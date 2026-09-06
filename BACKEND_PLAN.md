> **[PARTIALLY SUPERSEDED]** Sections describing the 61-mine fan-out story are retired; the five-mine model lives in `shared/data/` + `backend/app/services/workflow/`. RAG and reset sections remain valid.

# SAMAADHAN — Backend Implementation Plan

> **Phase:** Design & implementation plan for the *real* backend that replaces the demo seam.
> **Current state (context):** The SIH demo runs entirely on hardcoded JSON (`shared/data/*.json`) behind a deterministic in-memory store (`shared/demo/store.ts`) exposed by an Express server (`client/server.ts`) as `/api/demo/*`. Both the desktop app and the mobile app consume those endpoints through thin `demoApi` clients and poll `/api/demo/state`.
> **This document:** the full plan for the production backend — stack, schema, API contract, state machine, business rules, AI pipeline, evidence handling, verification, closure, seeding, testing, and a phased build order. It is written so that replacing the JSON layer with FastAPI endpoints is a *drop-in* swap: **the demo API surface becomes the production API surface.**

---

## 1. Goals and guiding principles

1. **The demo API contract is the production API contract.** Every function in `client/src/services/demoApi.ts` and `mobile/src/services/demoApi.ts` maps 1:1 to a FastAPI route (see §5). Frontend changes when the backend lands are limited to a base-URL/config switch.
2. **One Governance Object → one workflow → one verification gate.** All six domains (SAFETY, ENVIRONMENT, PRODUCTION, LABOUR, CONTRACTOR, GRIEVANCE) plus ANOMALY share one table, one state machine, one evidence model. Adding a domain = adding an enum value + a rule pack, not new modules.
3. **Owner ≠ Verifier is structurally impossible.** Enforced in the DB (no valid path assigns owner == verifier), in the API (rejects `verifier_id == owner_user_id`), and by role hierarchy.
4. **Determinism where it matters.** Applicability routing, deadlines, and state transitions are policy code — the same input always produces the same output. AI is advisory only and has a pre-parsed deterministic fallback.
5. **Append-only trust.** Every state transition writes an immutable audit event. Closure records are SHA-256 sealed. No UPDATE/DELETE paths on audit.
6. **Offline-friendly field capture.** Mobile evidence capture works against a local draft and syncs; server validates on receipt.

---

## 2. Stack & architecture

| Layer | Choice | Rationale (from Plan.md) |
|---|---|---|
| Language / framework | **Python 3.12 + FastAPI** | Async, auto OpenAPI docs, Pydantic validation |
| Database | **PostgreSQL 15** | ACID audit integrity; JSONB for flexible domain payloads; pg_trgm as the recurrence fallback |
| ORM / migrations | **SQLAlchemy 2.x + Alembic** | Mature async support, migration discipline |
| Object storage | **Local filesystem volume in dev; S3-compatible in prod** (MinIO optional) | Evidence photos/registers/documents |
| OCR | **Tesseract** (via `pytesseract`) | Scanned DGMS PDF replicas |
| LLM | **OpenAI GPT-4o-mini** (Gemini API key already present in repo env files as an alternative) | Structured extraction with citations |
| Embeddings / recurrence | **pgvector** primary; **pg_trgm** fallback | See §9.3 |
| PDF generation | **WeasyPrint** | Closure certificates |
| Auth | **JWT (access + refresh) + RBAC** | 4 canonical roles, §11 |
| Async tasks / timers | **APScheduler** (in-process) for hackathon; **Celery + Redis** noted as production path | Escalation + deadline engine |
| Serving | **Uvicorn** behind the existing repo structure | One process for the demo era; Docker later |

**Repo layout (new `backend/` directory at project root):**

```
backend/
  app/
    main.py                 # FastAPI app factory, CORS, routers
    config.py               # pydantic-settings; env-driven (DATABASE_URL, JWT_*, AI_*)
    database.py             # async engine, session dependency
    models/                 # SQLAlchemy ORM models (one file per aggregate)
    schemas/                # Pydantic request/response schemas
    api/
      deps.py               # get_current_user, require_roles, get_task_or_404
      routes/
        auth.py
        state.py            # GET /api/state (aggregated bootstrap, demo parity)
        alerts.py           # DGMS alert intake + AI process + confirm
        governance.py       # governance objects: list, detail, draft, submit
        verification.py     # reject, resubmit, approve, closure certificate
        evidence.py         # artifact upload
        mines.py            # registry + GIS payload
        dashboard.py        # counters, domain distribution, alerts
        notifications.py
        audit.py            # append-only read
        health.py
    services/
      state_machine.py      # pure transition functions + guards
      applicability.py      # deterministic mine × hazard routing rules
      deadlines.py          # policy deadline calculator
      escalation.py         # aging timer, L1/L2 escalation
      evidence_service.py   # upload, GPS/timestamp metadata, sha256 sealing
      closure.py            # closure record + certificate payload
      ai/
        ocr.py              # Tesseract wrapper
        extraction.py       # LLM structured extraction + 3-badge regime
        recurrence.py       # Pinecone or pg_trgm similarity
        fallbacks.py        # pre-parsed deterministic outputs (demo parity)
      notifications.py
      audit_service.py
      hashing.py            # sha256 helpers
      aggregations.py       # dashboard + GIS risk rollups
    seed/
      seed.py               # loads shared/data/*.json into PostgreSQL
      reset.py              # full reset to pristine demo state
    tests/                  # pytest + httpx AsyncClient; see §14
  alembic/
  pyproject.toml            # or requirements.txt
  Dockerfile
  .env.example
```

**Frontend migration when this lands:** `demoApi.ts` base URL becomes `VITE_API_URL` (same origin in the demo, so no CORS in practice), and the `/api/demo/*` paths become `/api/*`. Response bodies keep the exact shapes the frontends already parse.

---

## 3. Data model

JSON today (`shared/data/`) → SQL tomorrow. The seed files *are* the fixtures (§12).

### 3.1 Tables

```sql
-- Org & people -------------------------------------------------------------
CREATE TABLE subsidiaries (
    id UUID PRIMARY KEY,
    code TEXT UNIQUE,          -- e.g. 'CIL'
    name TEXT
);

CREATE TABLE mines (
    id UUID PRIMARY KEY,
    code TEXT UNIQUE,          -- 'MINE-001' … (map from shared/data/mines.json)
    name TEXT,
    subsidiary_id UUID REFERENCES subsidiaries(id),
    district TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    type TEXT,                 -- OPENCAST | UNDERGROUND | MIXED
    has_hemm BOOLEAN,          -- has HEMM fleet (drives applicability)
    workforce INTEGER,
    risk_level TEXT            -- GREEN | AMBER | RED (derived; see §10)
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    employee_id TEXT UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL,        -- MINE_SAFETY_OFFICER | AREA_SAFETY_OFFICER | DGMS | MANAGEMENT
    subsidiary_id UUID,
    mine_id UUID REFERENCES mines(id)   -- null for roles above mine level
);

-- Governance ---------------------------------------------------------------
CREATE TABLE domains (         -- 6 + ANOMALY; config, not schema churn
    id TEXT PRIMARY KEY        -- 'SAFETY' | 'ENVIRONMENT' | 'PRODUCTION' |
                               -- 'LABOUR' | 'CONTRACTOR' | 'GRIEVANCE' | 'ANOMALY'
);

CREATE TABLE governance_objects (
    id TEXT PRIMARY KEY,                       -- keep demo ids like 'TASK-HEMM-BRIEF-001'
    object_type TEXT REFERENCES domains(id),
    source_type TEXT,                          -- DGMS_ALERT | CSIS_FEED | AUDIT | MANUAL | SENSOR | CREDENTIAL_REGISTRY
    source_reference TEXT,                     -- e.g. 'DGMS/2026/SA-041'
    title TEXT NOT NULL,
    short_title TEXT,
    description TEXT,
    severity TEXT,                             -- CRITICAL | HIGH | MEDIUM | LOW
    mine_id UUID REFERENCES mines(id),
    citations JSONB,                           -- [{paragraph, text, badge}]
    owner_user_id UUID NOT NULL REFERENCES users(id),
    owner_role TEXT NOT NULL,
    verifier_user_id UUID NOT NULL REFERENCES users(id),
    verifier_role TEXT NOT NULL,
    status TEXT NOT NULL,                      -- §6 state machine
    urgency_group TEXT NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    evidence_checklist JSONB NOT NULL,         -- [{id, title, type, guidance}]
    escalation_level INT NOT NULL DEFAULT 0,   -- 0 | L1 | L2
    escalation_rule TEXT,
    rejection_reason TEXT,
    remediation_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    closure_hash TEXT,
    CONSTRAINT owner_not_verifier CHECK (owner_user_id <> verifier_user_id)
);

CREATE TABLE evidence_items (                  -- the checklist instances
    id TEXT PRIMARY KEY,                       -- demo ids preserved
    governance_object_id TEXT NOT NULL REFERENCES governance_objects(id),
    checklist_ref TEXT NOT NULL,               -- links evidence_checklist JSONB entry
    item_type TEXT,                            -- photo | document | register
    status TEXT NOT NULL DEFAULT 'pending',    -- pending | uploaded | verified | rejected | missing
    guidance TEXT,
    rejection_reason TEXT
);

CREATE TABLE evidence_artifacts (              -- one row per actual upload
    id TEXT PRIMARY KEY,
    evidence_item_id TEXT NOT NULL REFERENCES evidence_items(id),
    file_name TEXT,
    mime_type TEXT,
    content_type TEXT,                         -- photo | document | register
    byte_size BIGINT,
    storage_key TEXT,                          -- object-store key or local path
    sha256 TEXT NOT NULL,                      -- server-sealed (§8)
    gps TEXT,                                  -- '23.5,86.1'
    captured_at TIMESTAMPTZ,                   -- device timestamp
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    uploaded_by UUID REFERENCES users(id)
);

-- Append-only audit ---------------------------------------------------------
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    governance_object_id TEXT REFERENCES governance_objects(id),
    alert_ref TEXT,
    actor_user_id UUID,
    actor_label TEXT,
    action TEXT NOT NULL,      -- ALERT_RECEIVED, EXTRACTION_CONFIRMED, FANOUT_COMPLETE,
                               -- TASK_CREATED, EVIDENCE_SUBMITTED, EVIDENCE_REJECTED,
                               -- EVIDENCE_RESUBMITTED, CLOSURE_VERIFIED, ESCALATED, …
    entity TEXT NOT NULL,
    detail JSONB,
    prev_hash TEXT,            -- SHA-256 chain
    hash TEXT NOT NULL,        -- SHA-256(prev_hash | payload | ts)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    -- NO update/delete path anywhere in code
);

-- Alerts / ingestion --------------------------------------------------------
CREATE TABLE alerts (
    id TEXT PRIMARY KEY,                 -- 'DGMS/2026/SA-041'
    alert_kind TEXT,                     -- 'dgms-alert'
    severity TEXT,
    issued_at TIMESTAMPTZ,
    title TEXT,
    message TEXT,
    body_paragraphs JSONB,
    pdf_storage_key TEXT,
    status TEXT                          -- received | processed | confirmed
);

CREATE TABLE ai_extractions (
    alert_id TEXT PRIMARY KEY REFERENCES alerts(id),
    payload JSONB NOT NULL,              -- structured fields + 3-badge regime (§9.2)
    task_templates JSONB NOT NULL,       -- governance object templates produced
    confidence TEXT,
    model TEXT,
    created_at TIMESTAMPTZ
);

CREATE TABLE recurrence_matches (        -- organization memory hits
    id BIGSERIAL PRIMARY KEY,
    alert_id TEXT REFERENCES alerts(id),
    historical_ref TEXT,                 -- e.g. 'MINE-002/2019 …'
    similarity REAL,
    payload JSONB
);

-- Notifications -------------------------------------------------------------
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    governance_object_id TEXT REFERENCES governance_objects(id),
    kind TEXT,                           -- task_assigned | submission | rejection | approval | escalation
    title TEXT,
    body TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.2 Column-for-column mapping from demo JSON

| `shared/data/*.json` | SQL destination |
|---|---|
| `mines.json` | `mines` (id ↔ code `MINE-001`…) |
| `users.json` | `users` + `subsidiaries` |
| `domains.json` | `domains` |
| `tasks.json` | `governance_objects` + `evidence_items`; owner/verifier resolved from ids; `sourceCitation` → `citations`; `isCriticalDoThisNext` → derived from urgency |
| `evidence.json` | `evidence_artifacts` seeds (SVG replicas referenced by `storage_key`) |
| `alerts.json` | `alerts` (actionable alerts each get a per-alert pipeline slot; operational feed items stay feed-only) |
| `aiExtractionByAlert.json` | `ai_extractions` keyed by `alert_id` (payload + task_templates verbatim; per-alert `recurrence` override) |
| `recurrence.json` | `recurrence_matches` (shared corpus fallback) |
| `fanoutByAlert.json` | reference rows in `audit_log` (FANOUT_COMPLETE) + generated objects, keyed by `alert_id` |
| `history.json` | `history`-shaped seed table for recurrence corpus |
| `notifications.json` | `notifications` |
| `dashboard.json` | not stored — it is an *aggregation* (dashboard.ts reads counts); seed only for tests |

> Ids are deliberately kept as the readable demo strings (`MINE-001`, `TASK-…`) so the frontends, logs, and the demo story stay in sync.

---

## 4. Roles & authorization

Four canonical roles (already used by the UIs):

| Role | Scope | Typical actor | Can do |
|---|---|---|---|
| `MINE_SAFETY_OFFICER` | one `mine_id` | Ram Singh (MINE-001) | Execute tasks, capture evidence, submit, resubmit. **Never verifies own task.** |
| `AREA_SAFETY_OFFICER` | area (≥1 mines) | area verifier | Reject / approve evidence for tasks they did not own |
| `DGMS` | read-mostly + alert intake | regulator | Publish/reference alerts, read-only across org |
| `MANAGEMENT` | subsidiary-wide | corporate dashboard | Read-only dashboard + GIS + closure records |

**RBAC decisions**
- **API guard:** every mutating endpoint resolves the acting user and checks role *and* ownership. `reject`/`approve` require a verifier role whose scope covers `mine_id` and who is **not** `owner_user_id`. Returns `403` otherwise.
- **DB guard:** `CHECK (owner_user_id <> verifier_user_id)` makes self-verification structurally impossible even if the API guard is bypassed.
- **JWT:** access token (short) + refresh token (long). Roles/scope claims are read from the DB on each request (cheap, avoids stale-role bugs).
- Demo convenience: `POST /api/auth/demo-login {employee_id}` returns a token for any seeded user (removed in production).

---

## 5. API contract (drop-in parity with the demo)

The demo server today exposes (see `client/server.ts`). The production API exposes the **same routes minus `/demo`**, same request/response bodies.

| # | Method & path | Request | Response | Maps to demoApi fn |
|---|---|---|---|---|
| 1 | `GET /api/health` | — | `{status:"ok"}` | — |
| 2 | `GET /api/state` | — | `{sites, tasks, alerts, notifications, pipeline, audit, updatedAt}` — full bootstrap snapshot, exactly the `DemoState` shape | `getState()` |
| 3 | `POST /api/reset` | — | full state (pristine seed) | `reset()` |
| 4 | `POST /api/alerts/process` | `{alertId}` | full state (`pipeline.extraction`, `pipeline.recurrence` populated) | `processAlert()` |
| 5 | `POST /api/alerts/confirm` | `{alertId}` | full state + `createdTasks[]` + `fanout` | `confirmExtraction()` |
| 6 | `POST /api/tasks/{id}/draft` | `{evidenceItems[], remediationNotes}` | full state (autosave; **no** status change) | `saveDraft()` |
| 7 | `POST /api/tasks/{id}/submit` | `{evidenceItems[], remediationNotes}` | full state → `AWAITING_VERIFICATION` | `submitTask()` |
| 8 | `POST /api/tasks/{id}/reject` | `{evidenceId, reason}` | full state → `REJECTED`, item marked rejected | `rejectEvidence()` |
| 9 | `POST /api/tasks/{id}/resubmit` | — | full state → `AWAITING_VERIFICATION` | `resubmitTask()` |
| 10 | `POST /api/tasks/{id}/approve` | — | full state → `VERIFIED` + `closureCertificate` | `approveTask()` |
| 11 | `POST /api/tasks/{id}/evidence` | multipart file + GPS/timestamp fields | sealed artifact metadata (`sha256`, `gps`, size) | (new — real upload; see §8) |
| 12 | `GET /api/tasks/{id}/closure.pdf` | — | `application/pdf` closure certificate | (new — real PDF; see §10) |
| 13 | `GET /api/dashboard` | — | counters `{open, awaitingVerification, overdue, closed}` + domain distribution + alert banner | (dashboard aggregates) |
| 14 | `GET /api/gis` | — | sites + per-mine risk `GREEN/AMBER/RED` derived from open objects | GIS payload |
| 15 | `GET /api/mines`, `GET /api/mines/{id}` | — | registry rows | — |
| 16 | `GET /api/audit?governance_object_id=` | — | append-only audit chain | — |
| 17 | `GET /api/notifications?user_id=` | — | unread list | — |

**Real (non-demo) additions later (not in demo scope):** CSIS feed intake, sensor webhooks, manual observation intake — all funnel into the same `governance_objects` table via the same service, which is what makes §5 stable while new sources appear.

**Error conventions:** `400` validation (Pydantic), `403` owner==verifier / role violation, `404` unknown id, `409` illegal state transition (e.g., submit when already `AWAITING_VERIFICATION`), `422` malformed body. Machine-readable `{detail: {code, message}}`.

---

## 6. State machine

Statuses (already in use by both frontends):

```
ALERT_RECEIVED
   │ process
   ▼
AI_PROCESSING ──(pipeline steps, §9)──▶ AI_REVIEW
   │ confirm (human)
   ▼
TASK_CREATED / FANOUT (creates N governance objects)
   │
   ▼
IN_PROGRESS ◀── REJECTED (verifier rejects evidence, reason attached)
   │  ▲            │
   │  │            │  resubmit (owner corrects + resubmits)
   │  └────────────┘
   ▼  submit (all checklist items uploaded)
AWAITING_VERIFICATION
   │ approve (verifier ≠ owner)
   ▼
VERIFIED_CLOSED  (closure certificate + sealed record)
```

**Guards (pure functions in `state_machine.py`, unit-tested):**

| Transition | Allowed from | Guard conditions |
|---|---|---|
| `process_alert` | `ALERT_RECEIVED` | once only per alert id |
| `confirm_extraction` | `AI_REVIEW` | extraction exists & not yet confirmed |
| `submit` | `IN_PROGRESS`, `DUE_SOON`, `REJECTED`, `OVERDUE`, `ESCALATED` | **all** evidence items `uploaded`/`verified`; owner only |
| `reject` | `AWAITING_VERIFICATION` | actor role covers mine & `actor ≠ owner`; `evidenceId` + non-empty reason required |
| `resubmit` | `REJECTED` | owner only; rejected item is re-uploaded |
| `approve` | `AWAITING_VERIFICATION` | actor role covers mine & `actor ≠ owner`; all items `uploaded` (get flipped to `verified`) |

**Idempotency & concurrency:** transitions run inside a DB transaction with `SELECT … FOR UPDATE` on the governance object row; a transition already applied returns the current state (matching the demo's idempotent `confirmExtraction` behavior) rather than erroring on replay. Every transition writes one `audit_log` row (§13).

---

## 7. Business rules engine

### 7.1 Applicability router (deterministic)
Input: alert extraction metadata (incident/equipment/cause codes/affected mine classes) + mine registry. Matrix in code (`applicability.py`), e.g.:

| Hazard | Mine type | HEMM fleet | Result |
|---|---|---|---|
| Reversing/run-over (HEMM) | OPENCAST | yes | **APPLICABLE** |
| Reversing/run-over | UNDERGROUND | n/a | NOT APPLICABLE |
| Reversing/run-over | OPENCAST | no | NOT APPLICABLE (filtered) |

Demo parity numbers must reproduce **61 affected / 261 filtered / 183 governance objects** for `DGMS/2026/SA-041` (§12 ties this to the seed corpus + a snapshot test).

### 7.2 Deadline calculator
Config-driven policy defaults (`deadlines.py`):

| Task class | Policy deadline |
|---|---|
| Acknowledge alert | 48 h |
| Briefing / retraining | 7 days |
| Document/register verification | 7 days |
| Critical corrective action | 14 days |

Deadline set at creation from the template class; **no silent extension** — extension requires a higher role + recorded reason + new deadline (audited).

### 7.3 Escalation timer
Background job (APScheduler, every 10 min) ages objects per `escalation_rule`:
- Not acknowledged by D1 → notify owner again.
- `OVERDUE` past deadline → `ESCALATED_L1` (area officer notified).
- Still open at L1 window → `ESCALATED_L2` (management notified).
Each step writes an audit event + notification. Seed data already carries `escalationEvents` examples for display parity.

---

## 8. Evidence handling

1. **Upload:** `POST /api/tasks/{id}/evidence` (multipart) with file + `evidenceItemId` + `gps` + `capturedAt`. The server:
   - stores bytes to object storage / disk → `storage_key`
   - computes **server-sealed** SHA-256 over `(task_id, item_id, bytes, uploaded_at)` — replaces the mobile client's placeholder hash, exactly as the demo store does today (so the closure certificate shows distinct per-item hashes)
   - records `mime_type`, `byte_size`, GPS, timestamps in `evidence_artifacts`
2. **Checklist completeness:** derived from `evidence_items` rows (type/status). Submit is rejected by the API (`409`) if not all checklist items are `uploaded`.
3. **Item states:** `pending → uploaded → (rejected ↺) → verified`. Only `reject` (verifier) or `approve` (verifier) moves items; the owner can overwrite a `rejected` upload (which flips it back to `uploaded`).
4. **Metadata realism** (kept from the demo, now genuinely captured): GPS string, device `captured_at` timestamp, capture user, file size. Server re-stamps authoritative `uploaded_at`.
5. **Offline path (future/mobile):** camera/register capture drafts locally with GPS+timestamp, queued for sync; server idempotency key per draft avoids duplicates on retry.

---

## 9. AI pipeline

One ingestion endpoint is enough for the demo: `POST /api/alerts/process` runs stages, and the **response is returned only after the pipeline completes**, but the frontend already renders staged statuses; production adds a `POST /api/alerts/{id}/process?async=true` + `GET /api/alerts/{id}/pipeline` for real long-running work. Stage timing guidance from the demo (800–1500 ms per stage) is replaced by real durations; the same visual staging UI is reused.

### 9.1 OCR
- Tesseract on the uploaded alert PDF (scanned replicas) → raw text.
- If the PDF already has a text layer, extract directly (skip OCR).

### 9.2 LLM structured extraction (3-badge regime)
- Prompt the model with the raw text to emit the exact JSON schema already in `shared/data/aiExtraction.json`: incident, equipment, cause codes, recommended precautions, affected mine class, severity suggestion.
- **Citation mechanism:** each field carries the source paragraph + text span.
- **Badges:** `CONFIRMED_FROM_SOURCE` | `AI_INFERENCE` | `REQUIRES_CONFIRMATION` — assigned by a **post-processing rule layer**, not left to the model (rules are deterministic; the model supplies candidates + citations).
- **Pre-parsed fallback:** if the model/API is unavailable, `fallbacks.py` returns `aiExtraction.json` verbatim (identical schema — the demo's reliability guarantee carries into production).

### 9.3 Recurrence detection
- **Embed:** title + cause codes + description of each governance object → vector (same embedding model as §9.2).
- **Store:** `vector` column via **pgvector** extension on PostgreSQL (same DB as the rest of the system). Index for cosine/Euclidean distance search.
- **Query:** top-5 neighbors for the new alert; surface as `recurrence_matches` with similarity.
- **Fallback:** `pg_trgm` similarity over cause codes + title when pgvector is unavailable — per Plan.md, recurrence is valuable but not architecturally critical; schema keeps both behind one service interface.

### 9.4 Human confirmation
`POST /api/alerts/confirm` stores the confirmed extraction (human-in-the-loop) and triggers fan-out (§7.1). Unconfirmed AI fields never reach the workflow engine.

---

## 10. Verification, closure & outputs

### 10.1 Verification gate
- Rejection/approval payloads require `verifier_user_id ≠ owner_user_id` (API + DB).
- Approve flips all `uploaded`/`rejected` items to `verified`, sets `verified_at`, `closed_at`, status → `VERIFIED_CLOSED`, writes the closure record.

### 10.2 Closure certificate (data + PDF)
- The certificate payload is the exact `ClosureCertificate` shape the desktop already renders: task id, source, owner (name + role), verifier (name + role), created/submitted/verified timestamps, evidence count, per-item SHA-256 hashes, certificate `hash`, `auditHash`, closed-at.
- `hash` = SHA-256 over the canonical closure JSON (owner, verifier, submitted, verified, evidence hashes). `auditHash` = SHA-256 over the object's audit chain tail.
- **PDF:** WeasyPrint template rendering the same payload — replaces the frontend-only certificate view when judges ask for a downloadable artifact. Certificate regeneration is deterministic given the stored closure row (hash-verifiable).

### 10.3 Dashboard & GIS aggregation
- `GET /api/dashboard`: single SQL rollup — `open` (`IN_PROGRESS`/`DUE_SOON`), `awaitingVerification`, `overdue` (`OVERDUE`/`ESCALATED`), `closed` (`VERIFIED_CLOSED`), plus `COUNT(*) GROUP BY object_type` for the domain distribution and the active-alert banner row. Exactly the counters the desktop Dashboard shows.
- `GET /api/gis`: mines joined to open-object severity. Mine risk: any `OVERDUE`/`ESCALATED` → **RED**; any open task → **AMBER**; none → **GREEN**. This reproduces the demo's MINE-001 **AMBER → GREEN** arc after the hero task closes. (The GIS frontend is unchanged — this endpoint just feeds it.)

---

## 11. Auth endpoints (new, outside demo parity)

| Method & path | Body | Behavior |
|---|---|---|
| `POST /api/auth/login` | `{employeeId, password}` | access + refresh JWT |
| `POST /api/auth/refresh` | `{refreshToken}` | rotate tokens |
| `POST /api/auth/demo-login` | `{employeeId}` | seeded-user token (dev/demo only) |
| `GET /api/auth/me` | — | profile + role + mine scope |

Passwords: `bcrypt` hash, never stored plaintext. All demo endpoints in §5 additionally enforce auth in production mode; in `DEMO_MODE=1` the acting user is inferred from headers for the demo story (frontend already passes `userId`-style actor context via its role switcher).

---

## 12. Seeding & demo parity

`backend/seed/seed.py` loads the existing `shared/data/*.json` files into PostgreSQL (§3.2 mapping). Two modes:

1. `seed --demo-state` → pristine state identical to the demo server's fresh boot (all tasks open, pipeline empty, MINE-001 amber). Used by tests and by `npm run demo:reset` once the backend owns the API.
2. `seed --sample` → a fuller corpus for dashboards.

**Parity snapshot test (critical):** `tests/test_demo_parity.py` replays the exact script from `shared/demo/store.test.ts` — fresh → process → confirm → draft → submit → reject → resubmit → approve → dashboard counters → reset — against the live FastAPI app on a throwaway DB and asserts the same statuses, counters (6 closed / 1 awaiting), rejection reasons, and certificate hashes the demo produces. **If a future backend change breaks the demo story, this test fails.**

`POST /api/reset` truncates the mutable tables and re-seeds mode 1 — preserving the "start from a clean state every time" demo requirement.

---

## 13. Audit & immutability

- Every transition in §6 and every evidence upload calls `audit_service.record(...)` inside the same transaction.
- **Hash chain:** each row stores `prev_hash` (previous row for that object) and `hash = SHA-256(prev_hash || canonical_payload || created_at)`.
- No UPDATE/DELETE code paths exist for `audit_log` (DB-level triggers deny them as defense-in-depth).
- Closure certificate `auditHash` is computed over the object's chain, giving tamper-evidence without blockchain (Plan.md's stated rationale).
- `GET /api/audit` returns the chain for a governance object for the desktop modal's audit view.

---

## 14. Testing strategy

| Suite | Tooling | Covers |
|---|---|---|
| Unit | `pytest` | State machine guards, applicability matrix (61/261/183), deadline calculator, escalation aging, badge-assignment rules, hashing/closure payload |
| API | `httpx.AsyncClient` + FastAPI `TestClient` against an ephemeral PostgreSQL (or SQLite with JSONB-compatible dialect in CI) | Every route in §5 happy + error paths (403 self-verify, 409 illegal transition, 404) |
| Parity | `test_demo_parity.py` | §12 — byte-level equivalence with the JS demo store script |
| AI | VCR-style recorded fixtures + injected fallbacks | Extraction schema stability; fallback path returns identical JSON when the model is down |
| E2E (manual) | existing runbook in `DEMO_FLOW.md` | Full DGMS story against the live backend |

Run in CI: `pytest` + `uvicorn` smoke + frontend typecheck/build unchanged.

---

## 15. Phased build order

**Phase 0 — Scaffolding (0.5 day)**
- `backend/` skeleton, FastAPI app + health, config, alembic init, Docker compose for PostgreSQL.
- Pydantic schemas mirrored from `shared/demo/types.ts`.

**Phase 1 — Data layer + seed (1 day)**
- ORM models + migrations for all tables in §3.1.
- `seed.py` importing the twelve JSON files; reset endpoint.
- Parity snapshot: `getState()` returns the exact `DemoState` shape.

**Phase 2 — Workflow core (1–1.5 days)**
- State machine + guards, governance CRUD-lite (list/detail), draft/submit.
- Rules: applicability router + deadline calculator + escalation job.
- Audit chain + hashing. Owner≠verifier enforcement (API + DB + tests).

**Phase 3 — Evidence + verification + closure (1–1.5 days)**
- Multipart upload → storage → sealed SHA-256, GPS/timestamp metadata.
- Reject/resubmit/approve; evidence completeness checks.
- Closure certificate payload + WeasyPrint PDF.

**Phase 4 — AI pipeline (1–1.5 days)**
- OCR, LLM extraction with citations + 3-badge post-rules, Pinecone (or pg_trgm) recurrence, deterministic fallbacks, confirm endpoint wiring fan-out.

**Phase 5 — Read models + auth + notifications (1 day)**
- Dashboard/GIS aggregation endpoints; notifications; JWT + RBAC; demo-login.
- Frontend demoApi base-URL switch + local `DEMO_MODE` shim removed.

**Phase 6 — Hardening (1 day)**
- Full pytest pass, parity test against the recorded demo story, E2E rehearsal of `DEMO_FLOW.md`, seed reset from clean state, concurrency (`FOR UPDATE`) checks.

Total: **≈7 focused build days** for 1–2 backend engineers, matching Plan.md's own feasibility estimate.

---

## 16. Risks & decisions

| Decision | Choice | Why / fallback |
|---|---|---|
| One `governance_objects` table for 6 domains | Yes | Adding a domain = enum + rule pack (Plan.md core insight) |
| Pinecone vs pg_trgm vs pgvector | **pgvector** primary (same DB, no external service) | Both behind one service; pg_trgm fallback is config-only; pgvector removed entirely if the extension is unavailable |
| AI determinism | Post-rules + pre-parsed fallback | Demo reliability requirement (§26 of the demo brief) carries into prod |
| Self-verification | 3 layers (UI, API, DB) | Structural accountability is the product's pillar 2 |
| Ids readable strings vs UUIDs | Demo ids kept | Frontend + story + logs stay in sync; UUID transition documented |
| Blockchain | Explicitly not used | SHA-256 chain suffices inside one org + regulator (Plan.md §13) |
| Offline sync | Architecture specified, Phase 6+ | Web-first for the hackathon; WatermelonDB path documented |

---

## 17. Definition of done

1. `GET /api/state` returns byte-compatible `DemoState` for the pristine seed.
2. The §12 parity test passes: the complete DGMS story (process → confirm → fan-out → submit → reject → resubmit → approve → dashboard 6/1 → reset) works identically against the backend.
3. Owner≠verifier holds at UI, API, and DB layers (tests assert the 403 and the CHECK constraint).
4. Desktop **and** mobile run against the backend with no frontend logic changes — only `demoApi` base-URL config.
5. Closure certificate downloads as PDF and its `hash`/`auditHash` verify against the audit chain.
6. Every state transition is audited; audit rows are append-only.
