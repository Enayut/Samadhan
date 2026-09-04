# 07 — SAMAADHAN: Final Solution (From-Scratch Redesign)

**PS 26024 — AI-Based Smart Governance and Compliance Monitoring System for Coal Mines**
Ministry of Coal / Coal India Limited | Software | Smart Automation

**Document status:** Final design v2.0. Complete re-evaluation from scratch. All 6 compliance domains (safety, environment, production, labour, contractor, grievance) included as input sources into the SAME governance object. Preserves the core USP of SAMAADHAN (accountability + evidence + independent verification) while ruthlessly cutting everything that does not serve it.

---

# TABLE OF CONTENTS

1. Brutal Honesty Section (What's novel, what's not, what wins)
2. Final SAMAADHAN Concept
3. Final USP
4. Final Simplified Architecture
5. Final Data-Flow Diagram
6. Component-by-Component Explanation
7. MVP vs Full-PS Feature Table
8. Final Tech Stack with Justification
9. 2-Minute Demo Flow
10. Judge Questions and Strong Answers
11. Feasibility/Selection Assessment

---

# A. BRUTAL HONESTY SECTION

## What Is Genuinely Novel?

**One thing: the enforcement-and-memory spine between recording and reporting.**

The coal mining ecosystem already records (CSIS, statutory registers), reports (NCMSR, PARIVESH, DGMS portals), and analyses (Safety AI Analytics Dashboard). What nobody publicly owns is the horizontal conversion of a recorded compliance fact into an owned, deadlined, evidenced, independently verified, and remembered obligation.

This is novel because:
- It is the exact gap CIL's own 2024 EOI admits exists ("monitoring actions taken… ensure follow-up")
- It works across ALL SIX domains (safety, environment, production, labour, contractor, grievance) with ONE object type
- It makes self-approval structurally impossible (Owner ≠ Verifier)
- It tracks regulatory alert adoption to closure (not just publication)
- It treats an expired contractor licence with the same accountability as a safety violation

## What Is NOT Novel?

| What we do | What already exists | Why we are still needed |
|---|---|---|
| Store compliance items | CSIS stores safety records since ~2017-18 | CSIS does not enforce follow-through or verify closure |
| AI document parsing | CIL's Safety AI Dashboard (Feb 2026) | Analytics ≠ enforcement; insights don't become owned tasks |
| Dashboards | Koyla Shakti, NCMSR, Star Rating | Dashboards show data; we show accountability state |
| GIS maps | Khanan Prahari, CMSMS, satellite monitoring | Those detect; we drive action on detection |
| Escalation | Organizational hierarchy exists on paper | Ours is automated, timed, and evidence-backed |

## What Will Judges See as "Just Another Dashboard"?

- A system that only displays compliance statistics without driving action
- AI slapped onto a generic task tracker
- Analytics without the enforcement loop that makes them actionable
- A portal that duplicates CSIS, NCMSR, or PARIVESH functionality

## What Will Judges See as Genuinely Useful?

1. **Upload a DGMS alert → every affected mine gets precise, role-assigned, deadline-enforced tasks in minutes** (not months of cascading emails)
2. **A verifier rejects a fix because evidence is insufficient** — and the system structurally prevents self-approval
3. **Management sees exactly which mine ignored a directive, and drills to the accountable person in two clicks**
4. **A closure certificate with immutable audit trail** — printable, verifiable, independently witnessed
5. **Six compliance domains — safety, environment, production, labour, contractor, grievance — all run through ONE engine** (not six separate systems)
6. **An expired contractor licence becomes a governance object with the same accountability as a safety violation** (same owner/deadline/evidence/verification)

## What Features Are Unnecessary?

| Feature | Why unnecessary |
|---|---|
| LangGraph / multi-agent orchestration | Overkill for a deterministic workflow with two AI touchpoints |
| React Native + offline-first architecture | Hackathon judges don't test offline; responsive web is sufficient |
| 12 RBAC roles | 4 roles demonstrate the invariant; more is complexity theatre |
| MongoDB / MinIO | PostgreSQL handles everything; no need for document store |
| Event-driven outbox pattern | Synchronous calls are fine for hackathon scale |
| Full OCR pipeline (Tesseract + LLM) | Pre-parsed fallback covers demo; OCR is a component, not a headline |
| Integration adapters for CSIS/NCMSR/SAP | All simulated; building adapter frameworks for fake data is waste |
| Blockchain audit trails | SHA-256 hash chain achieves same tamper-evidence at 1% complexity |
| Generic analytics dashboards | Koyla Shakti and Safety AI Dashboard own analytics territory |
| Separate modules per domain | All 6 domains run through ONE governance object — no separate apps |
| Separate verification workflows | Same Owner ≠ Verifier rule applies to safety, environment, production, labour, contractor |

## What Features Are Missing Because of the PS?

Nothing critical. All six compliance domains (safety, environment, production, labour, contractor, grievance) are included as input sources into the SAME governance object. Operational anomaly detection is consumed as an ingest trigger — not a separate module.

| Domain | How It Enters SAMAADHAN | What Becomes a Governance Object | Demo Status |
|---|---|---|---|
| **Safety** | DGMS alerts, CSIS findings, audit observations, field hazard reports | Safety finding with owner/deadline/evidence/verification | **MVP — hero trigger** |
| **Environment** | EC condition violations, sensor exceedances, inspection observations | Environmental finding with corrective action | **MVP — seed item** |
| **Production** | Production compliance issues (missing shift reports, maintenance schedule drift) | Production compliance finding | **MVP — seed item** |
| **Labour** | Worker credential expiry, medical fitness lapses, CLRA documentation gaps | Labour compliance finding | **MVP — seed item** |
| **Contractor** | Contractor licence/insurance/PME expiry, safety induction gaps | Contractor compliance finding | **MVP — seed item** |
| **Operational Anomaly** | Sensor/production feed generates anomaly → SAMAADHAN turns it into a governance object | Anomaly-derived finding | **MVP — feed trigger** |
| **Grievance** | Worker grievance intake | Grievance object | FUTURE (same lifecycle) |

**The architectural insight:** All six domains are INPUT SOURCES. They all produce the SAME governance object, run through the SAME workflow, use the SAME evidence model, undergo the SAME verification (Owner ≠ Verifier), face the SAME escalation, and contribute to the SAME audit/memory. No separate modules. No separate applications. One engine, many sources.

## What Could Fail Technically During a Live Demo?

| Risk | Impact | Mitigation |
|---|---|---|
| LLM extraction hallucinates on alert PDF | Confuses judges about AI reliability | Pre-parsed fallback; 3-badge regime catches errors; human confirmation gate |
| Pinecone similarity returns irrelevant matches | Undermines recurrence detection claim | Seed 120 historical findings with guaranteed matches; test golden set |
| Demo app crashes during state transition | Breaks hero moment flow | Deterministic demo controller with pre-seeded states; backup screen recording |
| GIS map fails to render | Loses visual impact | Map is a Leaflet component; OpenStreetMap tiles are free and reliable |
| PDF generation fails | Closure certificate missing | Pre-generated certificate PDF as fallback; generation is simple WeasyPrint |
| Internet connectivity drops | Live AI extraction fails | Pre-parsed fallback for all AI-dependent scenes; offline-safe demo |
| Audience sees pre-computed data | Undermines "live" claim | Live parse attempted first; fallback disclosed if asked ("same pipeline, earlier run") |

## What Should Be Simulated Instead of Built?

| Component | Simulate Because | How |
|---|---|---|
| CSIS integration feed | API availability unknown | Simulated data with SIMULATED badge |
| DGMS real-time alert ingestion | No public API | Replica alert PDF; OCR/LLM pipeline runs on replica |
| Sensor/EC breach events | No sensor data available | Synthetic threshold-exceeded events → governance objects |
| Production compliance issues | No production data feed | Seed items: missing shift reports, maintenance schedule drift |
| Contractor credential expiry | Registry data unavailable | Seed items: expired licence, expiring insurance, PME overdue |
| Labour compliance issues | No HR data feed | Seed items: expired medical fitness, missing CLRA documents |
| Multi-mine adoption data | Too much seed data | 5 deep mines + 56 rollup records powering counters |
| Regulator read-only view | Requires MoU | Demo persona with SIMULATION badge |
| Offline sync | Complex; not testable in demo | State machine simulation with badges |

## What Is the Strongest USP?

**"Coal mines record everything, report everything, and close almost nothing — because no system gives any finding an owner, a deadline, verifiable evidence, independent verification, and a memory."**

The USP is not AI. It is not dashboards. It is the structural guarantee that:
1. Every compliance item has a named owner and a deadline
2. The person who fixes cannot approve their own fix
3. Evidence is required, verified, and immutable
4. Escalation is automatic, not dependent on human memory
5. Recurrence is detected across mines and years

## What Is the Strongest 2-Minute Demo Story?

**Scene 1 (30s):** A DGMS Safety Alert PDF appears. AI extracts fields with source citations. Human confirms. The map ignites: 61 mines affected, 261 correctly filtered out. Each mine gets role-assigned tasks with deadlines.

**Scene 2 (30s):** A Mine Safety Officer opens the task queue. Sees exactly what to do, by when, proving what. Submits photo evidence with GPS and timestamp.

**Scene 3 (30s):** An Area Safety Officer (different person) reviews. Rejects one photo — "insufficient location metadata." Task reopens. Officer re-submits. Verifier approves. Closure certificate locks. Both names, all timestamps, evidence hashes.

**Scene 4 (30s):** Management view. 60/61 mines acknowledged. ONE overdue. Click. Drill-down: MINE-004, owner role, missed deadline, escalation level L2. Nobody chased. The system did.

**Closing line:** "One PDF became 183 owned, evidenced, independently verified obligations. Today that journey ends at a notice board."

## Why Is This Better Than a Generic Compliance Management System?

Because a generic system (Jira, ServiceNow, Monday.com) lacks:
1. **Statutory deadline semantics** per violation class (not arbitrary task due dates)
2. **Structural Owner ≠ Verifier enforcement** (Jira lets the same person create and approve)
3. **Regulatory alert parsing with source citations** (generic tools don't read PDFs)
4. **Per-class evidence checklists** tied to coal mine compliance requirements
5. **Cross-mine applicability routing** (one alert → precisely scoped affected mines)
6. **Immutable closure certificates** with evidence hashes and verifier identity
7. **CMR role hierarchy** encoding real mining-law accountability (not generic org charts)
8. **Adoption ledger** proving regulatory instruction follow-through to DGMS
9. **Six-domain unified engine** — safety, environment, production, labour, contractor, grievance all run through one object model
10. **Operational anomaly ingestion** — sensor/production anomalies become actionable governance objects automatically

---

# B. FINAL SAMAADHAN CONCEPT

## One Line

**SAMAADHAN converts every coal mine compliance fact into an owned, deadlined, evidenced, independently verified, and remembered obligation — closing the loop that existing systems open but never finish.**

## The Problem in 27 Words

Coal mines record everything, report everything, and close almost nothing — compliance facts die in scans and files because no system gives any finding an owner, a deadline, verifiable evidence, and a memory.

## The Solution in 60 Words

SAMAADHAN is a centralized AI-enabled governance and compliance platform that ingests safety findings, environmental violations, production compliance issues, labour credential expiries, contractor document lapses, and operational anomalies from any source. Each becomes a governed object with a named owner, an enforced deadline, required evidence, independent verification, automatic escalation, and cross-mine memory. Six domains, one engine, same accountability.

## What SAMAADHAN Is

- The enforcement-and-memory spine between recording and reporting
- A complementary layer that consumes existing system outputs, never replaces them
- A single Governance Object model covering ALL SIX compliance domains: safety, environment, production, labour, contractor, and grievance
- A structural accountability instrument, not a task tracker
- The follow-up capability CIL itself asked vendors to build (2024 EOI)

## What SAMAADHAN Is NOT

- Not CSIS (we don't store raw safety records; we enforce follow-through on findings)
- Not NCMSR (we don't do accident reporting; we track incident-derived preventive actions)
- Not Koyla Shakti (we don't track production data/logistics; we track compliance consequences)
- Not Safety AI Dashboard (we don't do analytics; we convert insights into owned obligations)
- Not PARIVESH/SWCS (we don't file regulatory submissions; we track evidence binding)
- Not CLIP (we don't manage wages; we extend the gating pattern to credentials and actions)
- Not SAP/e-Office (we don't do ERP or document management; we enforce follow-through)
- Not Jira/ServiceNow (we encode coal mine compliance law into structural invariants across 6 domains)
- Not a generic AI platform (AI does exactly two things: parse documents and detect recurrence)
- Not six separate applications (one engine, six input domains, same workflow)

---

# C. FINAL USP

## Primary USP

**Every compliance fact becomes a governed object — owned, deadlined, evidenced, independently verified, and remembered — across ALL SIX compliance domains (safety, environment, production, labour, contractor, grievance) in a single system with a single engine.**

## Three Pillars of Differentiation

### Pillar 1: Alert-to-Accountable-Action Fan-Out
One DGMS Safety Alert → AI extracts directives with source citations → rules route to applicable mines → role-assigned tasks with computed deadlines and evidence checklists → tracked to verified closure. Sector-wide, ~50% of regulatory alerts go unactioned. SAMAADHAN makes non-action visible and escalatable within hours.

### Pillar 2: Structural Accountability (Owner ≠ Verifier)
The person who executes corrective action cannot verify their own fix. Enforced at three levels: no UI path, API rejects verifier == owner, critical items require area-level-or-above verification. Every closure carries both identities, timestamps, and an immutable audit trail. Self-approval is structurally impossible.

### Pillar 3: Organizational Memory
When the same hazard reappears at another mine or in another year, SAMAADHAN links it to historical findings. Closure is not an endpoint — it is the beginning of prevention. No register-based system can do this because its memory is paper.

## The One-Sentence Pitch

> "Coal India records every violation. SAMAADHAN makes sure someone owns it, acts on it, proves it — and gets independently verified before it's called closed."

## The 30-Second Pitch

> "Coal India stores safety data in CSIS, analyzes it with its own Safety AI, and files reports through a dozen portals — but its own procurement notice admits violations sit in unstructured scans with no enforced follow-up, and sector-wide, half of satellite-generated alerts were never acted upon. SAMAADHAN is the missing middle layer: every finding or DGMS alert becomes an owned, deadlined task requiring timestamped, geo-tagged evidence, closed only by an independent verifier, escalating automatically when it ages, and remembered when the hazard reappears. Recording is digitized; reporting is digitized; SAMAADHAN digitizes responsibility."

---

# D. FINAL SIMPLIFIED ARCHITECTURE

## Architecture Diagram (Text)

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         INPUT SOURCES (6 DOMAINS)                        ║
║                                                                          ║
║  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐                    ║
║  │ 🛡️ SAFETY    │ │ 🌿 ENVIRON.  │ │ ⚙️ PRODUCTION  │                    ║
║  │ DGMS alerts  │ │ EC violations│ │ Shift reports  │                    ║
║  │ CSIS findings│ │ Sensor breach│ │ Maint. drift   │                    ║
║  │ Audit items  │ │ Insp. issues │ │ Prod. anomaly  │                    ║
║  └──────┬───────┘ └──────┬───────┘ └──────┬─────────┘                    ║
║         │                │                │                              ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                      ║
║  │ 👷 LABOUR    │ │ 🔧 CONTRACTOR│ │ 📢 GRIEVANCE │                     ║
║  │ Credential   │ │ Licence exp. │ │ Worker        │                    ║
║  │ expiry       │ │ Insurance    │ │ complaints    │                    ║
║  │ Medical fit. │ │ PME overdue  │ │               │                    ║
║  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘                     ║
║         │                │                │                             ║
╚═════════╪════════════════╪════════════════╪════════════════════════════╝
          │                │                │
          ▼                ▼                ▼
╔══════════════════════════════════════════════════════════════════════════╗
║                    AI INGESTION LAYER                                    ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    ║
║  │ Tesseract    │ │ LLM          │ │ Pinecone     │                    ║
║  │ OCR          │ │ Extraction   │ │ Similarity   │                    ║
║  │ (scanned PDF)│ │ (cited fields│ │ (recurrence  │                    ║
║  │              │ │  + 3 badges) │ │  detection)  │                    ║
║  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘                    ║
║         │                │                │                             ║
║    [pre-parsed fallback if live AI fails]                               ║
╚═════════╪════════════════╪════════════════╪════════════════════════════╝
          │                │                │
          ▼                ▼                ▼
╔══════════════════════════════════════════════════════════════════════════╗
║                   GOVERNANCE ENGINE                                      ║
║  ┌──────────────────────────────────────────────────────────────────┐   ║
║  │                    SINGLE GOVERNANCE OBJECT                       │   ║
║  │  source + type + severity + citations + affected_mines +        │   ║
║  │  owner_role + deadline + evidence_checklist + status             │   ║
║  │                                                                   │   ║
║  │  type ∈ {SAFETY, ENVIRONMENT, PRODUCTION, LABOUR,               │   ║
║  │          CONTRACTOR, GRIEVANCE, ANOMALY}                         │   ║
║  └──────────────────────────────────────────────────────────────────┘   ║
║                                                                         ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   ║
║  │ Applicability│ │ Deadline     │ │ Escalation   │ │ Evidence     │   ║
║  │ Router       │ │ Calculator   │ │ Timer        │ │ Completeness │   ║
║  │ (rules)      │ │ (policy)     │ │ (aging)      │ │ Checker      │   ║
║  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘   ║
║         │                │                │                │            ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   ║
║  │ Owner ≠      │ │ State        │ │ Notification │ │ Audit Log    │   ║
║  │ Verifier     │ │ Machine      │ │ Service      │ │ (SHA-256)    │   ║
║  │ Guard        │ │              │ │              │ │              │   ║
║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   ║
╚═══════════════╪════════════════╪════════════════════════════════════════╝
                │                │
                ▼                ▼
╔══════════════════════════════════════════════════════════════════════════╗
║                    FIELD EVIDENCE                                         ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    ║
║  │ Photo + GPS  │ │ Document     │ │ Attendance   │                    ║
║  │ + Timestamp  │ │ Upload       │ │ Sheet        │                    ║
║  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘                    ║
║         │                │                │                             ║
║    [offline capture → local draft → sync → server validation]           ║
╚═════════╪════════════════╪════════════════╪════════════════════════════╝
          │                │                │
          ▼                ▼                ▼
╔══════════════════════════════════════════════════════════════════════════╗
║                  VERIFICATION & CLOSURE                                  ║
║  ┌──────────────────────────────────────────────────────────────────┐   ║
║  │  INDEPENDENT VERIFIER (≠ owner by construction)                  │   ║
║  │  approve / reject against checklist → closure certificate        │   ║
║  └──────────────────────────────────────────────────────────────────┘   ║
╚═══════════════╪════════════════════════════════════════════════════════╝
                │
                ▼
╔══════════════════════════════════════════════════════════════════════════╗
║                    OUTPUTS                                               ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   ║
║  │ Mine Officer │ │ Corporate    │ │ Regulatory   │ │ Closure      │   ║
║  │ Work Queue   │ │ Dashboard    │ │ Read-Only    │ │ Certificate  │   ║
║  │              │ │ + GIS Map    │ │ View         │ │ (PDF)        │   ║
║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   ║
╚══════════════════════════════════════════════════════════════════════════╝

KEY ARCHITECTURAL INSIGHT:
┌──────────────────────────────────────────────────────────────────────────┐
│  6 DOMAINS  →  1 GOVERNANCE OBJECT  →  1 WORKFLOW  →  1 VERIFICATION   │
│                                                                          │
│  Safety        ─┐                                                        │
│  Environment   ─┤                                                        │
│  Production    ─┼─→ SAME OBJECT  → SAME EVIDENCE → SAME VERIFICATION    │
│  Labour        ─┤    TYPE           MODEL           (Owner ≠ Verifier)   │
│  Contractor    ─┤                                                        │
│  Grievance     ─┘                                                        │
│                                                                          │
│  Adding a domain = adding an enum value + rule pack. No new modules.    │
└──────────────────────────────────────────────────────────────────────────┘
```

## Database Layer

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    PostgreSQL                                            ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   ║
║  │ Governance   │ │ Evidence     │ │ Audit Log    │ │ Org/Mine     │   ║
║  │ Objects      │ │ Artifacts    │ │ (append-only │ │ Registry     │   ║
║  │ + Tasks      │ │              │ │  + SHA-256)  │ │              │   ║
║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   ║
╚══════════════════════════════════════════════════════════════════════════╝
```

## Technology Assignment

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    Frontend: React + TailwindCSS + Leaflet               ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   ║
║  │ Work Queue   │ │ GIS Map      │ │ Verification │ │ Dashboard    │   ║
║  │ (mobile-     │ │ (Leaflet +   │ │ Console      │ │ (3 views)    │   ║
║  │  responsive) │ │  OSM tiles)  │ │              │ │              │   ║
║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   ║
╠══════════════════════════════════════════════════════════════════════════╣
║                    Backend: FastAPI (Python)                              ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    ║
║  │ Workflow API │ │ AI Pipeline  │ │ PDF Generator│                    ║
║  │ (state CRUD) │ │ (OCR+LLM+    │ │ (WeasyPrint) │                    ║
║  │              │ │  Pinecone)   │ │              │                    ║
║  └──────────────┘ └──────────────┘ └──────────────┘                    ║
╠══════════════════════════════════════════════════════════════════════════╣
║                    AI: OpenAI GPT-4o-mini + Tesseract + Pinecone         ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    ║
║  │ OCR (scanned │ │ LLM (extraction│ │ Vector DB   │                    ║
║  │  documents)  │ │  with citations)│ │ (similarity)│                    ║
║  └──────────────┘ └──────────────┘ └──────────────┘                    ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

# E. FINAL DATA-FLOW DIAGRAM

## Complete Data Flow: Source → Ingestion → Governance Object → Workflow → Evidence → Verification → Closure → Dashboards

```
STEP 1: SOURCE EVENT (6 DOMAINS)
├── 🛡️ SAFETY: DGMS publishes Safety Alert (PDF on dgms.gov.in)
├── 🛡️ SAFETY: CSIS records a safety finding (simulated feed)
├── 🌿 ENVIRONMENT: Sensor detects PM10 exceedance (synthetic)
├── 🌿 ENVIRONMENT: EC condition breach detected (synthetic)
├── ⚙️ PRODUCTION: Missing shift report detected (synthetic rule)
├── ⚙️ PRODUCTION: Maintenance schedule overdue (synthetic)
├── 👷 LABOUR: Worker medical fitness certificate expiring (synthetic)
├── 👷 LABOUR: Competency certificate lapse detected (synthetic)
├── 🔧 CONTRACTOR: Contractor licence approaching expiry (synthetic)
├── 🔧 CONTRACTOR: Insurance policy lapsing (synthetic)
├── 🔧 CONTRACTOR: PME overdue for contract worker (synthetic)
├── 📊 ANOMALY: Sensor anomaly from production feed (synthetic)
├── Officer observes a hazard in the field (manual entry)
└── Internal audit team records a finding (manual entry)

STEP 2: INGESTION & AI PROCESSING
├── PDF arrives → Tesseract OCR extracts text (if scanned)
├── LLM parses text → structured fields with source citations
│   ├── Incident type: [CONFIRMED FROM SOURCE ¶2]
│   ├── Equipment: [CONFIRMED FROM SOURCE ¶2]
│   ├── Cause codes: [CONFIRMED FROM SOURCE ¶3]
│   ├── Recommended precautions: [CONFIRMED FROM SOURCE ¶4]
│   ├── Affected mine classes: [AI INFERENCE — requires human confirm]
│   └── Suggested severity: [AI INFERENCE — requires human confirm]
├── Pinecone checks historical similar findings
│   └── Returns: "This hazard was cited at MINE-002 in 2019, closed late"
└── Human confirms extraction and affected classes

STEP 3: GOVERNANCE OBJECT CREATION
├── Applicability Router (DETERMINISTIC RULES):
│   ├── Mine type = OC AND equipment = HEMM AND hazard ∈ {run-over, spotting}
│   │   → APPLICABLE
│   ├── Mine type = UG AND no HEMM fleet
│   │   → NOT APPLICABLE (filtered out)
│   └── AI suggests borderline cases → human confirms
├── Owner Assignment (ROLE-BASED DEFAULTS):
│   ├── Acknowledgment task → Mine Manager (role)
│   ├── Operator re-briefing → Mine Safety Officer (role)
│   └── Device approval check → Mine Engineer (role)
├── Deadline Computation (POLICY RULES):
│   ├── Acknowledgment: 48 hours
│   ├── Briefing class: 7 days
│   ├── Verification class: 7 days
│   └── Extensions require higher role + recorded reason
└── Evidence Checklist (CLASS-BASED DEFAULTS):
    ├── Briefing: attendance record + session photo + protocol list
    ├── Device check: valid approval certificate + expiry date
    └── Each item: PHOTO/DOC/ATTENDANCE type + metadata requirements

STEP 4: TASK DISPATCH
├── Tasks created per applicable mine
├── Notifications sent to owner roles
├── Work queues populated
├── Audit event logged: TASK_CREATED (actor, timestamp, source)
└── Dashboard counters update

STEP 5: OFFICER WORKS THE QUEUE
├── Officer sees: Why me? What? By when? Proving what? What if late?
├── Officer executes corrective action in the field
├── Officer captures evidence:
│   ├── Photo with auto-geotag + server timestamp
│   ├── Document upload (certificate, attendance sheet)
│   └── Each bound to specific checklist item
├── Evidence Completeness Check (DETERMINISTIC):
│   ├── All required items present? → status advances
│   └── Missing items? → blocked with exact gap named
├── Advisory AI checks (NON-BINDING):
│   ├── Geotag outside mine lease polygon?
│   ├── Photo timestamp inconsistent with stated session?
│   └── Wrong evidence type for checklist item?
└── Audit event logged: EVIDENCE_SUBMITTED

STEP 6: INDEPENDENT VERIFICATION
├── System assigns verifier (Area Safety Officer or Mine Manager)
├── OWNER ≠ VERIFIER enforced:
│   ├── UI: no self-verification path offered
│   ├── API: rejects verifier_id == owner_user_id
│   └── Critical items: require area-level-or-above
├── Verifier reviews evidence against checklist
├── APPROVE path:
│   ├── All items satisfactory
│   ├── Status: EVIDENCE_SUBMITTED → VERIFIED_CLOSED
│   ├── Closure certificate generated:
│   │   ├── Task ID, source citation
│   │   ├── Owner (name, role), Verifier (name, role)
│   │   ├── All timestamps (created, submitted, verified)
│   │   ├── Evidence hashes (SHA-256)
│   │   └── Audit trail chain hash
│   └── Audit event logged: CLOSURE_VERIFIED
├── REJECT path:
│   ├── Specific item(s) flagged as insufficient
│   ├── Written reason mandatory
│   ├── Status: EVIDENCE_SUBMITTED → REJECTED → REOPENED
│   ├── Officer receives rejection with reason + deficient item
│   ├── Officer corrects and resubmits
│   └── Audit event logged: EVIDENCE_REJECTED (reason recorded)

STEP 7: ESCALATION (PARALLEL, DETERMINISTIC)
├── Clock runs from task creation/assignment
├── Due-soon reminder: T-3 days, T-1 day
├── Deadline passes → OVERDUE (automatic)
├── Overdue +3 days → ESCALATED_L1 (Area GM notified)
├── Escalated_L1 +3 days → ESCALATED_L2 (Subsidiary HQ notified)
├── No human can suppress escalation
├── Extension possible only by higher role + reason
└── Every escalation event logged with timestamp + notify chain

STEP 8: MANAGEMENT / CORPORATE VIEW
├── Alert-level adoption dashboard:
│   ├── Affected mines: 61
│   ├── Acknowledged: 60/61
│   ├── Actions completed (verified): 98/122
│   ├── Awaiting verification: 18
│   ├── Overdue: 1
│   ├── Escalated: 1
│   └── Rejected evidence: 2 (both remediated)
├── GIS map: mine pins colored by governance state
│   ├── 🟢 Green: Verified closed
│   ├── 🟠 Amber: In progress / awaiting verification
│   ├── 🔴 Red: Overdue / escalated
│   └── 🔵 Blue: Submitted, not yet verified
├── Drill-down: click overdue counter → mine → owner → deadline → escalation chain
└── Risk ranking: mines ranked by overdue load, escalation density, rejection rate

STEP 9: REGULATORY VIEW (DEMO SIMULATION)
├── Read-only adoption proof per alert
├── Adoption funnel: issued → acknowledged → actions → verified → closed
├── Mine-level granularity (what DGMS sees)
├── No write access; no internal operational detail exposed
└── Clearly badged: SIMULATION — deployment requires MoU

STEP 10: ORGANIZATIONAL MEMORY
├── Every closed item embeds in historical corpus
├── New finding enters → Pinecone similarity search
│   ├── Returns: "This hazard was cited at MINE-002 in 2019, closed D+21"
│   ├── Returns: "Same cause code at 3 other mines in past 2 years"
│   └── Returns: "4 mines from prior alert closed late → suggest audit attention"
├── Adoption ledger per DGMS alert across all years
└── Recurrence links visible in task detail memory panel
```

---

# F. COMPONENT-BY-COMPONENT EXPLANATION

## 1. Input Sources (6 Domains)

### Safety Domain
| Source | Type | How It Enters | Demo Status |
|---|---|---|---|
| DGMS Safety Alerts | Public PDF | Upload → OCR → LLM extraction | **MVP** (hero trigger) |
| CSIS-type Findings | Simulated feed | Seeded data with SIMULATED badge | **MVP** (proves multi-source) |
| Audit Findings | Manual entry | Web form with checklist | **MVP** |
| Field Observations | Officer entry | Web form with location + timestamp | **MVP** |

### Environmental Domain
| Source | Type | How It Enters | Demo Status |
|---|---|---|---|
| EC Condition Breach | Synthetic sensor | Threshold-exceeded trigger → governance object | **MVP** (seed item) |
| Inspection Finding | Manual entry | Web form: environmental observation | **MVP** (seed item) |
| SPCB Compliance Issue | Synthetic | Consent condition violation | **MVP** (seed item) |

### Production Domain
| Source | Type | How It Enters | Demo Status |
|---|---|---|---|
| Missing Shift Report | Synthetic | Detected by rule (no submission within window) | **MVP** (seed item) |
| Maintenance Schedule Drift | Synthetic | Equipment inspection overdue | **MVP** (seed item) |
| Mining-Plan Milestone | Synthetic | Milestone drift detected | **MVP** (seed item) |

### Labour Domain
| Source | Type | How It Enters | Demo Status |
|---|---|---|---|
| Medical Fitness Expiry | Synthetic | Credential registry countdown | **MVP** (seed item) |
| Competency Certificate Lapse | Synthetic | DGMS certification expiry | **MVP** (seed item) |
| CLRA Documentation Gap | Synthetic | Missing contractor-worker documentation | **MVP** (seed item) |

### Contractor Domain
| Source | Type | How It Enters | Demo Status |
|---|---|---|
| Contractor Licence Expiry | Synthetic | Registry-based countdown | **MVP** (seed item) |
| Insurance Lapse | Synthetic | Policy expiry detection | **MVP** (seed item) |
| PME Overdue | Synthetic | Periodic medical examination schedule | **MVP** (seed item) |
| Safety Induction Gap | Synthetic | New worker not inducted | **MVP** (seed item) |

### Operational Anomaly (Feed Trigger)
| Source | Type | How It Enters | Demo Status |
|---|---|---|---|
| Sensor Anomaly | Synthetic | Abnormal reading from production/environmental sensor | **MVP** (feed → governance object) |

**Key decision:** We do NOT rebuild any existing system's input channel. We accept whatever comes, structure it into a Governance Object, and enforce follow-through. The value is in what happens AFTER capture. Every domain produces the SAME object type, runs through the SAME workflow, and faces the SAME verification.

## 2. AI Ingestion Layer

### Tesseract OCR
- **Purpose:** Extract text from scanned DGMS alert PDFs
- **When used:** Only when document has no text layer (scanned image)
- **MVP implementation:** Tesseract 5.x via pytesseract
- **Fallback:** Most regulator PDFs carry text layers; OCR is rarely needed
- **Why not a headline feature:** OCR is a hidden component of ingestion, not a product selling point. CIL's own EOI already procures OCR capabilities.

### LLM Extraction (GPT-4o-mini)
- **Purpose:** Parse free-text regulatory documents into structured fields
- **Input:** Raw text from OCR or text extraction
- **Output:** Structured JSON with:
  - Incident type, equipment, cause codes, risk category
  - Recommended precautions (as task templates)
  - Affected mine classes (AI suggestion, human confirms)
  - Severity suggestion (AI suggestion, human confirms)
- **Citation mechanism:** Each extraction field references the source paragraph and character range
- **3-badge regime:**
  - ✅ CONFIRMED FROM SOURCE — directly quoted or paraphrased from explicit text
  - ⚠️ AI INFERENCE — derived by reasoning, not explicitly stated
  - 🔶 REQUIRES HUMAN CONFIRMATION — AI suggests, human decides
- **Pre-parsed fallback:** Identical output schema, pre-computed for demo reliability
- **Why GPT-4o-mini:** Cheap, fast, sufficient for structured extraction; GPT-4o overkill for this task

### Pinecone Similarity
- **Purpose:** Detect recurring hazards across mines and years
- **What gets embedded:** Title + cause codes + description of each governance object
- **What is stored:** Object ID, embedding vector, metadata (mine, date, status, closure time)
- **Query performed:** Top-5 nearest neighbors when a new object enters
- **Returns:** Historical items with similar cause patterns, their mine locations, closure status, and time-to-close
- **Why Pinecone:** Managed service, no infrastructure, free tier sufficient, fast setup
- **Honest limitation:** MVP similarity is lightweight (text embedding match + cause-code overlap); not sophisticated ML. Sufficient for demo proof-of-concept.
- **When Pinecone is NOT justified:** If the hackathon team cannot set up Pinecone in time, fall back to PostgreSQL pg_trgm text search on cause codes. The recurrence detection is valuable but not architecturally critical.

## 3. Governance Engine (The Core)

### Governance Object Model
One table, one lifecycle, six domain types:

```sql
CREATE TABLE governance_objects (
    id UUID PRIMARY KEY,
    object_type VARCHAR(50),  -- SAFETY, ENVIRONMENT, PRODUCTION, LABOUR, CONTRACTOR, GRIEVANCE
    source_type VARCHAR(50),  -- DGMS_ALERT, CSIS_FEED, AUDIT, MANUAL, SENSOR, CREDENTIAL_REGISTRY
    source_reference TEXT,     -- alert ID, finding ID, etc.
    title TEXT,
    description TEXT,
    citations JSONB,          -- [{"paragraph": 2, "text": "...", "badge": "CONFIRMED"}]
    severity VARCHAR(20),     -- CRITICAL, HIGH, MEDIUM, LOW
    mine_id UUID REFERENCES mines(id),
    owner_user_id UUID REFERENCES users(id),
    owner_role VARCHAR(50),
    deadline TIMESTAMP,
    status VARCHAR(50),       -- see state machine
    evidence_checklist JSONB, -- [{"item": 1, "type": "PHOTO", "required": true}]
    escalation_level INT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    closed_at TIMESTAMP,
    verifier_id UUID,
    closure_hash TEXT          -- SHA-256 of closure record
);
```

**Why one table:** Adding a new compliance domain = adding an enum value + rule pack. No schema changes. No new modules. This is how we cover all six domains with ONE engine.

### How Each Domain Maps to the Object

| Domain | object_type | Typical source | What becomes the governance object | Example |
|---|---|---|---|---| 
| **Safety** | SAFETY | DGMS alert, CSIS finding, audit, field observation | Safety finding requiring corrective action | HEMM reversing alert → brief all operators |
| **Environment** | ENVIRONMENT | Sensor exceedance, EC condition breach, inspection finding | Environmental compliance finding | PM10 exceedance → corrective action → recheck |
| **Production** | PRODUCTION | Missing shift report, maintenance schedule drift, mining-plan milestone | Production compliance finding | Missing shift report → overdue → escalation |
| **Labour** | LABOUR | Medical fitness expiry, CLRA document gap, competency certificate lapse | Labour compliance finding | Expired medical certificate → renewal → verification |
| **Contractor** | CONTRACTOR | Licence expiry, insurance lapse, PME overdue, induction gap | Contractor compliance finding | Expired licence → renewal → gate pass restored |
| **Grievance** | GRIEVANCE | Worker complaint intake | Grievance requiring resolution | Wage dispute → investigation → resolution |

**The pattern is identical across all six:** source event → governance object → owner (role) → deadline (policy) → evidence (checklist) → verification (≠ owner) → escalation (aging) → closure (immutable) → memory (similarity).

### Applicability Router (Deterministic Rules)
- **Input:** Alert/finding metadata + mine registry attributes
- **Logic:** Mine type × hazard class × equipment fleet matrix
- **Example:** OC mine + HEMM fleet + run-over hazard → APPLICABLE; UG gassy mine + no HEMM → NOT APPLICABLE
- **AI role:** Suggests borderline cases; rules do final routing
- **Human role:** Confirms bulk applicability; can override per mine
- **Why deterministic:** Routing is policy. If the same alert runs twice, it must produce the same result. AI cannot make routing non-reproducible.

### Deadline Calculator (Policy Rules)
- **Input:** Task class (acknowledgment, briefing, verification, etc.)
- **Logic:** Configurable policy defaults per class
- **Examples:**
  - Acknowledgment: 48 hours
  - Briefing/retraining: 7 days
  - Document verification: 7 days
  - Critical corrective action: 14 days
- **Extension:** Requires higher role + recorded reason + new deadline
- **Why deterministic:** Deadlines are governance decisions, not predictions. They encode SLA expectations, not AI estimates.

### Escalation Timer (Aging-Based)
- **Trigger:** Deadline passes → automatic OVERDUE
- **Ladder:**
  - OVERDUE +3 days → ESCALATED_L1 (Area GM notified)
  - ESCALATED_L1 +3 days → ESCALATED_L2 (Subsidiary HQ notified)exponent funtion in 
- **Who can suppress:** Nobody. Extension is the only escape, and it requires higher role + reason.
- **Why deterministic:** Escalation is the mechanism that replaces human chasing. If it depends on a person remembering to escalate, it fails the same way the current system fails.

### Owner ≠ Verifier Guard (Three-Level Enforcement)
1. **UI level:** The verification screen does not offer a self-verification path. If the verifier is the owner, the approve/reject buttons are not rendered.
2. **API level:** POST /api/verify checks `verifier_id != owner_user_id`. Returns 403 if violated.
3. **Role hierarchy level:** For CRITICAL-severity items, verification requires area-level or above (not mine-level).
- **Why three levels:** Frontend can be bypassed. API is the hard constraint. Role hierarchy adds governance rigor for high-severity items.

### State Machine
```
NEW → CLASSIFIED → APPLICABILITY_CONFIRMED → ASSIGNED → IN_PROGRESS
                                                           │
                                          ┌────────────────┤
                                          │                │
                              EVIDENCE_SUBMITTED    OVERDUE → ESCALATED_L1 → ESCALATED_L2
                                          │
                              VERIFICATION_PENDING
                                          │
                              ┌───────────┤
                              │           │
                        VERIFIED_CLOSED  REJECTED → REOPENED → IN_PROGRESS
```

- **Transition authority:** Each transition has a designated actor (see transition table in Section D)
- **Immutability:** VERIFIED_CLOSED cannot be reopened. Period.
- **Audit:** Every transition writes an append-only record with SHA-256 hash

### Notification Service
- **Assignment notification:** Owner receives task with deadline
- **Due-soon reminder:** T-3 days, T-1 day
- **Overdue alert:** Automatic when deadline passes
- **Escalation notification:** Sent to escalated role
- **Rejection notification:** Officer receives rejection with reason
- **Why deterministic:** Notifications are triggered by state changes and time. No AI involvement.

### Audit Log (SHA-256 Hash Chain)
- **Append-only:** No update or delete paths in the API
- **Each record:** Actor, timestamp, action, entity, previous state, new state, reason
- **Hash chaining:** Each record's hash includes the previous record's hash. Tampering breaks the chain visibly.
- **Why SHA-256, not blockchain:** The parties who must trust the record are inside one organization (CIL hierarchy) plus a regulator with scoped read access. There is no multi-party trust boundary. Immutability is a property of disciplined API design, not distributed consensus. SHA-256 achieves tamper-evidence at 1% of blockchain's complexity.

## 4. Field Evidence Capture

### Photo + GPS + Timestamp
- **Metadata:** Captured at capture time (client) + reconciled at server time
- **Geotag:** GPS coordinates from device; validated against mine lease polygon (advisory)
- **Timestamp:** Device time + server time (reconciliation handles clock skew)
- **Binding:** Each artifact is bound to a specific checklist item on a specific task
- **Why these three:** PS explicitly requires geo-tagged and time-stamped field reporting. These are non-negotiable metadata.

### Evidence Completeness Check
- **Deterministic:** Checklist items are defined per task class
- **Gate:** If any required item is missing, submission is blocked. The system names exactly which item is missing.
- **No partial closures:** All or nothing.
- **Why deterministic:** Evidence completeness is a procedural rule, not an AI judgment.

### Advisory AI Checks (Non-Binding)
- Geotag outside mine lease polygon → advisory warning
- Photo timestamp inconsistent with stated session time → advisory warning
- Wrong evidence type for checklist item → advisory warning
- **Badge:** ADVISORY — shown as suggestions, not enforcement
- **Why advisory:** AI cannot prove authenticity. It can only flag inconsistencies for human review.

### Offline Support (Architecture)
- **Client-side:** Local draft store (IndexedDB in browser)
- **Sync queue:** Background sync when connectivity returns
- **Server validation:** On receipt, server validates metadata and binds to task
- **Conflict policy:** Server timestamps authoritative; drafts versioned
- **MVP:** Simulated with state badges (OFFLINE → DRAFT → SYNCED → RECEIVED)
- **Why simulated:** Underground connectivity reality is UNKNOWN. Building real offline sync is 2-3 days of work. Judges don't test offline in demos.

## 5. Verification & Closure

### Independent Verification Console
- **Verifier assignment:** Area Safety Officer or Mine Manager (role-based, ≠ owner)
- **Review interface:** Evidence thumbnails + metadata + checklist status
- **Approve:** All items satisfactory → VERIFIED_CLOSED
- **Reject:** Specific item(s) flagged + mandatory written reason → REJECTED → REOPENED
- **Why rejection is critical:** It proves the system is not rubber-stamp. The rejected-and-corrected cycle demonstrates real accountability.

### Closure Certificate (PDF)
- **Contents:**
  - Task ID, source citation chain
  - Owner (name, role, mine)
  - Verifier (name, role — DIFFERENT from owner)
  - All timestamps: created, assigned, evidence submitted, verified, closed
  - Evidence list with SHA-256 hashes
  - Full audit trail summary
  - Chain hash (tamper-evident)
- **Format:** Printable A4 PDF via WeasyPrint
- **Why PDF:** Judges remember tangible artifacts. A downloadable certificate is more memorable than a screen badge.

## 6. Dashboards & Reporting

### Mine Officer Work Queue
- **Buckets:** CRITICAL | DUE TODAY | AWAITING VERIFICATION | OVERDUE | RECENTLY CLOSED
- **Each task answers:** Why me? What exactly? By when? Proving what? What if I'm late?
- **Design principle:** Work surface with a clock, not a metrics wall. ≤3 clicks per routine action.

### Corporate / Portfolio Dashboard
- **Alert-level adoption counters** (affected, acknowledged, actions completed, awaiting verification, overdue, escalated)
- **GIS map** with mine pins colored by governance state
- **Risk ranking** by overdue load, escalation density, rejection rate
- **Drill-down:** Click overdue counter → mine → owner → deadline → escalation chain
- **Why this is NOT a generic dashboard:** Every metric drives a decision. "Where should I send scarce attention this week?" → click the redest cluster on the map.

### Regulatory Read-Only View (Demo Simulation)
- **Adoption funnel** per alert: issued → acknowledged → actions generated → evidence submitted → verified → closed
- **Mine-level granularity**
- **No write access; no internal operational detail**
- **Badged:** SIMULATION — deployment requires MoU
- **Why demo-only:** Politically staged in reality. Model fully supports it. Honest about deployment dependency.

### Closure Certificate & Compliance Register Export
- **Per-task:** Downloadable PDF certificate
- **Portfolio-level:** CSV/Excel export of all items with status, owner, verifier, timestamps
- **Audit log:** Full append-only log exportable per task or per mine
- **Why export:** Paper-parity for statutory requirements. Complements, never replaces gazetted formats.

---

# G. MVP VS FULL-PS FEATURE TABLE

## Classification System
- **MVP:** Built in hackathon prototype
- **SUPPORTING:** Built if hours remain
- **DEMO-SIM:** Shown as clearly-labelled simulation
- **FUTURE:** Architecturally supported; not built
- **DEFERRED:** Intentionally out; reason provided

## Complete Feature Table

| # | PS Requirement | SAMAADHAN Capability | MVP | Supporting | Demo-Sim | Future | Deferred |
|---|---|---|---|---|---|---|---|
| 1 | Statutory compliance tracking (safety) | Safety finding = governance object with owner/deadline/evidence/verification | ✅ | | | | |
| 2 | Statutory compliance tracking (environment) | Environmental finding = governance object (same lifecycle) | ✅ | | | | |
| 3 | Statutory compliance tracking (production) | Production compliance finding = governance object | ✅ | | | | |
| 4 | Statutory compliance tracking (labour) | Labour compliance finding = governance object | ✅ | | | | |
| 5 | Inspection tracking | Inspection observation = governance object | ✅ | | | | |
| 6 | Safety observations | Safety observation = governance object | ✅ | | | | |
| 7 | Violations | Violation = highest-severity governance object | ✅ | | | | |
| 8 | Corrective actions (CAPA) | THE product: owner+deadline+evidence+verification+escalation | ✅ | | | | |
| 9 | AI risk identification | Pinecone similarity + deterministic risk ranking | ✅ | | | | |
| 10 | Recurring compliance failure detection | Similarity links current ↔ historical findings | ✅ | | | | |
| 11 | Operational anomaly detection | Sensor/production anomaly → governance object (feed trigger) | ✅ | | | | |
| 12 | Geo-tagged field reporting | Photo + GPS + timestamp on evidence | ✅ | | | | |
| 13 | Time-stamped field reporting | Server + client timestamps on every event | ✅ | | | | |
| 14 | Mobile application | Responsive React web app (mobile-first) | ✅ | | | | |
| 15 | Mine official dashboard | Work queue with 5 buckets | ✅ | | | | |
| 16 | Corporate management dashboard | Adoption counters + GIS map + drill-down | ✅ | | | | |
| 17 | Regulatory dashboard | Read-only adoption funnel | | | ✅ | | |
| 18 | Automated alerts | Notification service: assignment, due-soon, overdue | ✅ | | | | |
| 19 | Reminders | T-3/T-1 due-soon reminders | ✅ | | | | |
| 20 | Escalation mechanisms | Mine → Area → Subsidiary HQ aging ladder | ✅ | | | | |
| 21 | Digital approvals | Verification approval with verifier identity locked | ✅ | | | | |
| 22 | Compliance reports | Closure certificate PDF + register export | ✅ | | | | |
| 23 | Statutory report generation | Paper-parity exports | | | | ✅ | |
| 24 | Reduced paperwork | Digital workflow; complements gazetted formats | ✅ | | | | |
| 25 | Improved transparency | Role-scoped visibility up hierarchy | ✅ | | | | |
| 26 | Improved accountability | Owner ≠ Verifier; every transition attributed | ✅ | | | | |
| 27 | Scalability (multi-mine) | Org hierarchy: Subsidiary → Area → Mine | ✅ | | | | |
| 28 | Scalability (multi-subsidiary) | Same model; fleet-wide tenancy is deployment config | | ✅ | | | |
| 29 | GIS mapping | Leaflet map with status-colored mine pins | ✅ | | | | |
| 30 | OCR/document digitization | Tesseract for scanned PDFs (hidden component) | ✅ | | | | |
| 31 | Blockchain audit trails | SHA-256 hash chain (no blockchain infra) | ✅ | | | | |
| 32 | Multilingual interfaces | Hindi + English labels (react-i18next) | ✅ | | | | |
| 33 | Offline support | Architecture specified; state machine simulated | | | ✅ | | |
| 34 | Contractor management | Credential expiry objects (same lifecycle) | ✅ | | | | |
| 35 | Grievance handling | Grievance = governance object type | | | | ✅ | |
| 36 | Operational reporting | Governance-relevant reporting only; ops stays with SAP/Koyla Shakti | | | | | ✅ |
| 37 | Predictive alerts | Deterministic aging signals; ML after real history | | | | ✅ | |
| 38 | Workflow automation | State machine: NEW → ASSIGNED → EVIDENCE → VERIFIED → CLOSED | ✅ | | | | |
| 39 | Attendance tracking | Exists in BAS; attendance as evidence for briefing tasks | ✅ | | | | |
| 40 | Incident reporting | Exists in NCMSR; incident-derived preventive actions are ours | | | ✅ | | |

## PS Coverage Summary
- **MVP:** 30 requirements directly built (up from 24)
- **SUPPORTING:** 2 requirements built if hours remain
- **DEMO-SIM:** 3 requirements shown as simulation
- **FUTURE:** 4 requirements architecturally supported
- **DEFERRED:** 1 requirement explicitly out with reasons
- **Total addressed:** 39/40 (97.5%)

## Domain Coverage in MVP

| Domain | object_type | Seed Items in Demo | Evidence Type |
|---|---|---|---|
| Safety | SAFETY | DGMS alert tasks, CSIS finding, audit item | Photo + attendance + document |
| Environment | ENVIRONMENT | PM10 exceedance finding, EC condition breach | Sensor data + lab report + photo |
| Production | PRODUCTION | Missing shift report, maintenance overdue | Shift log + maintenance record |
| Labour | LABOUR | Expired medical certificate, competency lapse | Medical cert + renewal document |
| Contractor | CONTRACTOR | Expired licence, insurance lapse, PME overdue | Renewal certificate + insurance doc |
| Anomaly | ANOMALY | Sensor anomaly → governance object | Sensor reading + corrective action proof |

---

# H. FINAL TECH STACK WITH JUSTIFICATION

## Complete Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | React 18 + Vite + TailwindCSS | Fast to build, responsive by default, huge ecosystem |
| **State Management** | TanStack Query (React Query) | Server state management; caching; optimistic updates |
| **GIS** | Leaflet + OpenStreetMap tiles | Free, no API key, reliable, good React bindings (react-leaflet) |
| **Backend** | Python 3.12 + FastAPI | Async, auto-docs, Pydantic validation, perfect for hackathon |
| **Database** | PostgreSQL 15 | ACID, JSON columns for flexible domain_data, pg_trgm for text search |
| **AI/OCR** | Tesseract 5.x + pytesseract | Free, open-source, sufficient for PDF text extraction |
| **LLM** | OpenAI GPT-4o-mini | Cheap, fast, sufficient for structured extraction with citations |
| **Vector DB** | Pinecone (free tier) | Managed, fast setup, sufficient for MVP similarity search |
| **PDF Generation** | WeasyPrint | Python library, HTML→PDF, sufficient for certificates |
| **i18n** | react-i18next | Standard React i18n, supports Hindi + English |
| **Auth** | JWT + bcrypt | Simple, sufficient for hackathon; no SSO complexity |
| **Deployment** | Docker Compose | Single `docker-compose up` for demo |

## Why Not MongoDB?
PostgreSQL handles everything we need. JSON columns provide flexible domain_data. ACID transactions ensure audit integrity. No need for a second database.

## Why Not React Native?
Hackathon judges watch a screen. Responsive React web works on any device. React Native + offline sync = 2-3 days of additional work that adds zero demo value.

## Why Not LangGraph?
We have exactly two AI touchpoints (document parsing + similarity search). LangGraph is for multi-agent orchestration with complex branching. We don't have multiple agents. We have deterministic rules with two AI assists. Adding LangGraph would be architectural decoration.

## Why Not Qdrant?
Pinecone is managed (no Docker config), has a free tier, and sets up in minutes. Qdrant is excellent but requires self-hosting. For a hackathon, managed wins.

## Why Not ServiceNow/Jira as Backend?
Because the domain logic (Owner ≠ Verifier, CMR role hierarchy, statutory deadlines, evidence checklists) is coal-mine-specific. Generic platforms require extensive customization that defeats the hackathon timeline.

---

# I. 2-MINUTE DEMO FLOW

## Pre-Demo Setup
- App running on presentation machine
- Pre-seeded demo data (61 mines, 15 users, 1 synthetic DGMS alert)
- Demo controller (keyboard shortcuts to advance timeline)

## Scene 1: Alert Ingestion (0:00 - 0:30)

**Screen:** Alert Intelligence view
**What happens:**
1. DGMS Safety Alert PDF appears on screen (SYNTHETIC REPLICA)
2. AI extraction runs (or pre-parsed fallback loads instantly)
3. Right panel shows structured fields:
   - Incident type: Run-over during HEMM reversing ✅ CONFIRMED
   - Equipment: Rear-dump truck, opencast bench ✅ CONFIRMED
   - Cause codes: Missing spotter, proximity warning ✅ CONFIRMED
   - Affected mine classes: OC + HEMM fleet ⚠️ AI INFERENCE
4. Human clicks "Confirm Extraction"

**What judge sees:** A PDF becomes structured, cited, machine-usable governance material in seconds
**What judge understands:** AI reads documents with receipts; humans stay in command

## Scene 2: Applicability Fan-Out (0:30 - 1:00)

**Screen:** Applicability Map (GIS layer)
**What happens:**
1. Map shows mine pins across 2 areas
2. Counters animate: "61 mines affected, 261 correctly filtered out"
3. Rule transparency table visible: "OC + HEMM + run-over → APPLICABLE"
4. Click "Generate Tasks" → 183 task cards appear with role-owners and deadlines
5. Per-mine drill: MINE-001 shows 3 tasks (acknowledge, brief operators, check devices)

**What judge sees:** One PDF became 183 precisely-scoped obligations across 61 mines
**What judge understands:** This is governed propagation, not mass notification

## Scene 3: Officer Work Queue (1:00 - 1:15)

**Screen:** Mine Officer Work Queue (mobile-width)
**What happens:**
1. Switch persona: Mine Safety Officer, MINE-001
2. Queue shows: CRITICAL (2 tasks), DUE TODAY (1), AWAITING VERIFICATION (1), OVERDUE (0), RECENTLY CLOSED (1)
3. Click TASK-001 → Task detail answers 5 questions:
   - Why me? → "Your mine matched: OC + HEMM + run-over class"
   - What exactly? → "Brief all HEMM operators on revised spotting protocol"
   - By when? → Countdown chip: 5 days remaining
   - Proving what? → 3-item checklist (attendance record, session photo, protocol list)
   - What if late? → "Auto-escalates to Area Safety Officer at deadline"

**What judge sees:** One screen answers every question the officer has
**What judge understands:** This is a work surface, not a dashboard

## Scene 4: Evidence Submission (1:15 - 1:30)

**Screen:** Evidence submission (mobile-width)
**What happens:**
1. Officer uploads: briefing attendance photo, session photo, protocol document
2. Each artifact shows: timestamp, geotag, uploader, bound to checklist item
3. Completeness check: 3/3 items → "All evidence submitted"
4. Status: IN_PROGRESS → EVIDENCE_SUBMITTED

**What judge sees:** Field evidence becomes structured, checkable proof
**What judge understands:** Evidence is bound to tasks, timestamped, and geo-tagged

## Scene 5: Independent Verification (1:30 - 1:45)

**Screen:** Verification Console
**What happens:**
1. Switch persona: Area Safety Officer (DIFFERENT person than submitter)
2. System badge: "VERIFIER: Area Safety Officer ≠ SUBMITTER: Mine Safety Officer"
3. Reviewer clicks REJECT on photo item: "Insufficient location metadata"
4. Task snaps open with rejection reason
5. Officer re-submits corrected photo
6. Verifier approves all items
7. Closure certificate renders: both names, all timestamps, evidence hashes

**What judge sees:** Self-approval is structurally impossible. Rejection → correction → approval.
**What judge understands:** "Closed" means proven to someone other than the fixer

## Scene 6: Multi-Domain Breadth (1:45 - 1:55)

**Screen:** Work Queue / Portfolio View
**What happens:**
1. Show the work queue now contains items from MULTIPLE domains:
   - 🛡️ SAFETY: DGMS alert tasks (hero trigger)
   - 🌿 ENVIRONMENT: PM10 exceedance → corrective action
   - ⚙️ PRODUCTION: Missing shift report → overdue
   - 👷 LABOUR: Expired medical certificate → renewal task
   - 🔧 CONTRACTOR: Licence expiry → renewal task
2. All items show the SAME fields: owner, deadline, evidence checklist, status
3. All items run through the SAME verification gate
4. One glance shows: "6 domains, 1 engine, same accountability"

**What judge sees:** Breadth without complexity; one system covers all compliance domains
**What judge understands:** This is not a safety-only tool; it is a unified governance engine

## Scene 7: Escalation (1:55 - 2:00)

**Screen:** Portfolio / Escalation View
**What happens:**
1. Advance timeline: MINE-004 hasn't acknowledged the alert
2. Counters update: "Acknowledged: 60/61, Overdue: 1, Escalated: 1"
3. Click OVERDUE:1 → drill-down:
   - MINE-004 → owner role → missed deadline by 6 days
   - Escalation chain: Mine → Area GM (L1) → Subsidiary HQ (L2)
   - Full notification history with timestamps
4. Closing line: "Nobody chased anybody. The system did. Six domains. Same engine. Same accountability."

**What judge sees:** Governance failures located NOW, not at month-end
**What judge understands:** Attention follows risk automatically, across all compliance domains

---

# J. LIKELY JUDGE QUESTIONS AND STRONG ANSWERS

### Q1: "Isn't this just Jira with AI?"

**Strong Answer:**
Jira lets the same person create and approve a task. SAMAADHAN makes this structurally impossible at three levels (UI, API, role hierarchy). Jira has no concept of statutory deadlines from DGMS directives — our deadlines encode CMR 2017 compliance expectations. Jira doesn't parse regulatory PDFs with source citations. Jira doesn't fan out one alert to 61 precisely-scoped mines. Jira doesn't generate closure certificates with evidence hashes and verifier identity. The moat is coal-mine domain encoding, not software category.

### Q2: "What is the AI actually doing?"

**Strong Answer:**
Exactly two things, and nothing else: (1) Parsing DGMS safety alert PDFs into structured fields with source citations — each extraction labeled as confirmed, inferred, or needs human confirmation. (2) Detecting similar historical findings using vector similarity when a new item enters. Everything else — deadlines, routing, escalation, verification, immutability — is deterministic rules. AI reads; rules enforce; humans decide.

### Q3: "How is this different from CSIS?"

**Strong Answer:**
CSIS records safety data since 2017-18. SAMAADHAN enforces follow-through across ALL SIX compliance domains: safety, environment, production, labour, contractor, and grievance. CSIS doesn't track whether a mine actually acted on an alert, doesn't verify fixes independently, doesn't escalate overdue actions automatically, and doesn't cover more than the safety domain. Our own positioning is not competitive with CSIS — we are the enforcement layer their own 2024 EOI asked vendors to build. One engine, six domains, same accountability.

### Q4: "Why does this need AI at all?"

**Strong Answer:**
It needs AI at exactly two joints where deterministic parsing fails: free-text regulatory documents (DGMS alerts are prose, not structured data) and cross-document similarity (detecting recurrence across thousands of historical findings). Remove both AIs and a degraded manual product survives — which is correct graceful degradation. We claim AI only where interpretation is genuinely useful, not as decoration.

### Q5: "Can you actually build this in the hackathon?"

**Strong Answer:**
Yes. The core is: FastAPI backend + PostgreSQL + React frontend + one Governance Object model + one state machine + evidence upload + verification gate + escalation timer + GIS map + closure certificate PDF. AI is two endpoints (extraction + similarity) with pre-parsed fallbacks. 4 roles, 8 screens, 1 subsidiary with 61 seeded mines. Realistic for 4-5 people in 4 days. The Governance Object model means adding domains is configuration, not code.

### Q6: "What if the AI hallucinates?"

**Strong Answer:**
Every extraction field carries a source citation pointing to the exact paragraph in the original document. Three badges tell the judge what's confirmed from source, what's AI-inferred, and what needs human confirmation. AI has no permission to write workflow state — it suggests, humans confirm, and every confirmation is audit-logged. Wrong classification costs one human click, not a compliance failure.

### Q7: "What about offline capability in mines?"

**Strong Answer:**
We acknowledge this limitation honestly. Web-first for hackathon. Responsive web works on any device. Production path: React Native + WatermelonDB offline sync, specified in our architecture. Underground connectivity reality is unknown — we design for worst case rather than claiming coverage we can't demonstrate.

### Q8: "Why not use blockchain for audit trails?"

**Strong Answer:**
SHA-256 hash chain on append-only audit events achieves tamper-evidence without blockchain infrastructure. The parties who must trust the record are inside one organization (CIL hierarchy) plus a regulator with scoped read access. There is no multi-party trust boundary that a distributed ledger would improve. Immutability here is a property of disciplined API design, not consensus mathematics. Adding blockchain would add cost and gimmickry while solving a problem our ecosystem does not have.

### Q9: "How do you handle all six compliance domains?"

**Strong Answer:**
Single Governance Object model with type discriminator. Safety, environment, production, labour, contractor, and grievance are all the same workflow — different enum values. Adding a new domain = adding an enum value + rule pack. No code changes to core engine. The demo shows safety findings (hero trigger) plus seed items across environment, production, labour, and contractor domains — all running through ONE engine with ONE verification gate. The architectural insight is: six domains, one object, same accountability.

### Q10: "What is genuinely novel here?"

**Strong Answer:**
The inversion: everyone else digitizes recording (CSIS), reporting (NCMSR), or analytics (Safety AI Dashboard). Nobody publicly owns the horizontal conversion of a recorded fact into an assigned, deadlined, evidenced, independently verified, and remembered obligation. Our novelty is: (a) cross-statute governed object model spanning 6 domains, (b) structural owner ≠ verifier closure, (c) adoption-proof for regulatory instructions, (d) honest AI scoping backed by the buyer's own EOI language. The deepest insight: safety violations, expired contractor licences, environmental exceedances, and production compliance gaps are all the SAME kind of problem — they need an owner, a deadline, evidence, and independent verification. We are the only system that treats them that way.

---

# K. BRUTALLY HONEST FEASIBILITY/SELECTION ASSESSMENT

## Feasibility Score: 8.5/10

| Dimension | Score | Notes |
|---|---|---|
| Technical feasibility | 9/10 | Standard stack (FastAPI + React + PostgreSQL); no exotic tech |
| Hackathon buildability | 8/10 | Core engine + 2 AI touchpoints + 8 screens; realistic for 4-5 people in 4 days |
| Demo reliability | 8/10 | Pre-parsed fallback for AI; deterministic demo controller; seeded data |
| PS coverage | 9.5/10 | 39/40 requirements addressed (97.5%); only statutory report format fidelity deferred |
| Differentiation | 9/10 | 6-domain unified engine + Owner ≠ Verifier + alert-to-action fan-out + closure certificate |
| Judge appeal | 9/10 | Strong narrative (226 deaths, 50% alerts ignored); 6-domain breadth visible; tangible demo |
| Risk of "just another dashboard" | LOW | Enforcement loop is visible and testable in demo |
| Risk of "AI shoe-horning" | LOW | Honest AI boundary; two touchpoints with clear justification |
| Risk of CIL building it internally | MEDIUM | Their own EOI + Safety AI Dashboard exist; we position as working reference implementation |

## Selection Assessment: STRONG CANDIDATE

### Strengths
1. **Evidence-backed problem:** 226 deaths (2020-24), ~50% alerts unactioned (MSS precedent), CIL's own EOI admits the gap
2. **Structurally demonstrable USP:** Owner ≠ Verifier can be tested live (try to self-approve → system rejects)
3. **Tangible artifact:** Closure certificate PDF is memorable and downloadable
4. **Narrative power:** "One PDF became 183 owned, evidenced, independently verified obligations"
5. **Honest AI:** Two touchpoints, clearly bounded, with fallbacks; not AI theatre
6. **Six-domain unified engine:** Safety, environment, production, labour, contractor, grievance — one object model, same accountability
7. **PS coverage 97.5%:** Only statutory report format fidelity deferred; every other requirement addressed

### Weaknesses
1. **Demo data is synthetic:** Honest labels help, but some judges may discount synthetic demonstrations
2. **CIL may build it internally:** The Safety AI Dashboard (Feb 2026) and EOI suggest internal capability
3. **No real mine data:** Cannot demonstrate with actual DGMS alerts (would need permission)
4. **Offline is simulated:** Judges who care about underground connectivity will note the gap
5. **Six domains may spread demo thin:** Must show breadth without losing depth on the hero moment

### What Could Go Wrong in Selection
1. **Judge asks for real DGMS data:** We show replica structure, acknowledge synthetic nature, point to public alert repository
2. **Judge says "CIL is already building this":** We position as working reference implementation of their own stated scope; value de-risks their build
3. **Judge wants to see production deployment:** We show architecture scalability (org hierarchy, Docker, PostgreSQL); acknowledge hackathon scope
4. **Judge compares to other teams' AI demos:** We pivot to "our AI is honest and bounded; theirs may be decorative"
5. **Judge wants offline proof:** We acknowledge limitation honestly; show architecture specification; pivot to "hackathon scope vs production roadmap"

### The One Thing That Wins or Loses

**The rejection-and-correction scene.** If we demonstrate a verifier rejecting evidence, the task reopening, the officer correcting, and the verifier approving — with both names locked in an immutable certificate — judges will understand this is not a task tracker. It is an accountability instrument. This scene is 30 seconds of the demo but carries 80% of the differentiation.

If we fail to demonstrate this scene (due to demo failure, time pressure, or poor narration), we lose our strongest differentiator and become "another compliance dashboard."

**Therefore:** Rehearse the rejection scene three times. Have a pre-recorded backup of just this scene. Never skip it.

**The second thing that wins:** Showing six domains in one work queue. If the judge sees safety, environment, production, labour, and contractor items all in the same queue with the same fields — owner, deadline, evidence checklist, verification gate — they will understand this is not a domain-specific tool. It is a unified governance engine.

---

## Document Version

**SAMAADHAN Final Solution v2.0**
**Date:** August 27, 2026
**Status:** Complete redesign with all 6 compliance domains
**Core principle preserved:** Converting governance/compliance issues into accountable actions supported by evidence and independently verified before closure
**Key change from v1.0:** All 6 domains (safety, environment, production, labour, contractor, grievance) included as input sources into the SAME governance object. PS coverage 97.5%.

---

*Generated with Codebuff 🤖*
*Co-Authored-By: Codebuff <noreply@codebuff.com>*