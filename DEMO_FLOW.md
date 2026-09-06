# SAMAADHAN — Demo Story & Runbook (NEW: 5-Mine Everyday Compliance)

> **This document SUPERSEDES the previous 61-mine / 183-obligation / DGMS fatal-alert fan-out story.**
> The old story was a disaster-response demo. The new story is an *everyday compliance monitoring
> platform* for one Jharkhand operational area with five mines. Read this document top to bottom —
> it is the single unambiguous specification a coding agent needs to implement the demo.

---

## 1. What SAMAADHAN is (one sentence + 20-second explanation)

**One sentence:** SAMAADHAN turns every compliance requirement at a coal mine — a DGMS circular, an EC
condition, a licence renewal, a weekly check — into an owned, deadlined, evidenced and independently
verified obligation, and shows one area manager the live compliance state of all five mines.

**20-second explanation for a judge (memorize this):**

> "Coal mines are buried in compliance requirements — DGMS circulars, environmental conditions,
> licence renewals, weekly checks — most of them tracked on paper or in spreadsheets, with nobody
> able to prove what was actually done. SAMAADHAN is the operating layer on top. A requirement enters
> the system; a rules engine decides which mine it applies to, who owns it, when it's due and what
> evidence is required. The mine official does the work in the field and captures geo-tagged photos on
> his phone. An independent verifier — a different person — must approve the evidence before it's
> called closed. One manager sees all five mines' compliance state live. AI only reads documents and
> flags patterns — it never decides compliance."

---

## 2. Canonical facts (the coding agent MUST implement exactly this)

### The operational area
North Karanpura Coalfield, Central Coalfields Limited (CCL), Jharkhand — **five mines**:

| id | Mine | Type | HEMM | Notes / role in demo |
|---|---|---|---|---|
| MINE-001 | **Piparwar Opencast Project** (Chatra) 23.69111, 85.06667 | OC | ✅ | **Hero mine + GIS anchor.** Detailed mobile workflow. |
| MINE-002 | Ashoka OCP (Chatra) ~23.7306, 85.0403 | OC | ✅ | Weekly dust-suppression obligation in manager review. |
| MINE-003 | Magadh OCP (Hazaribagh) ~23.8361, 84.9867 | OC | ✅ | Also applicable for the slope-monitoring obligations (real source: DGMS(Tech) Circular 02 of 2020). |
| MINE-004 | Ray-Bachra UG (Chatra) ~23.7006, 85.0750 | UG | ❌ | **Correctly filtered out** by the applicability rules (no high-wall benches, no HEMM). |
| MINE-005 | Amrapali OCP (Hazaribagh) ~23.89, 85.00 | OC | ✅ | CLRA licence renewal PROPOSED (shows expiry-driven obligation). |

> Coordinates for MINE-002…005 are indicative (verify before final polish); MINE-001 coordinates are
> authoritative from the GIS module.

### The three actors
| Actor | Surface | Identity | Does |
|---|---|---|---|
| **Area/Corporate Manager** | Desktop (default persona) | "Area Manager — North Karanpura" | Monitors all 5 mines; reviews/edit/adjust/publishes obligations; sees workload. |
| **Regulatory Official** | Desktop (2nd persona) | "Regulatory Officer — DGMS/Area oversight" | Ingests compliance documents; verifies submitted evidence (approve/reject). **Never the same person as the mine official.** |
| **Mine Official** | Mobile (only user) | **Ram Singh, Mine Safety Officer, MSO-402, MINE-001 Piparwar OCP** | Receives assigned tasks, executes in the field, captures evidence, submits, corrects after rejection. |

- Desktop persona switcher shows exactly these two personas (+ a read-only "Monitor" mode is allowed).
- The mobile app belongs to Ram Singh and **only ever shows tasks whose owner is Ram Singh (MINE-001)**.

### The core lifecycle (shown on screen as a pipeline strip)
```
INGEST → UNDERSTAND REQUIREMENT → APPLY COMPLIANCE RULES → CREATE/REVIEW OBLIGATION
→ ASSIGN → FIELD EXECUTION → FORM + EVIDENCE → VERIFY → REJECT/CORRECT OR APPROVE
→ VERIFIED RECORD → MONITOR
```

### Task state machine (implement exactly)
```
PROPOSED ──(manager reviews/edits/publishes)──▶ ASSIGNED ──(officer opens)──▶ IN_PROGRESS
   ▲                                                  │
   │   (deadline passes → OVERDUE → ESCALATED_L1 → ESCALATED_L2, automatic)   │
   └─────────────────────────────────────────────────────────────────────────┘
   IN_PROGRESS ──(submit: all evidence uploaded + remarks ≥15 chars)──▶ AWAITING_VERIFICATION
        ▲                                                                    │
        │                        ┌───────────────────────────────────────────┤
        │   (officer corrects     │                                           │
        │    rejected item,       ▼                                           ▼
        │    resubmits)      REJECTED ◀──(verifier: item + reason)      VERIFIED_CLOSED
        └─────────────────────────┘                            (closure record, audit-sealed)
```
- PROPOSED is **invisible on mobile**. ASSIGNED and later states appear on the owning official's phone.
- Every transition writes an audit event. VERIFIED_CLOSED is terminal.

---

## 3. The hero obligation (canonical definition)

Everything in the demo revolves around ONE recurring, everyday compliance activity:

| Field | Value |
|---|---|
| Task | **Weekly slope-displacement monitoring — Bench 3B high-wall, extensometer EX-07** |
| Domain | SAFETY (routine monitoring — NOT an accident) |
| Origin | **DGMS(Tech) Circular No. 02 of 2020 — Guidelines for Systematic Monitoring of Slopes in Opencast Coal Mines** (real PDF bundled in `data/regulatory/`; the in-app ingest replica may keep internal ref `DGMS/2026/TC-27`) |
| Obligation class | `OBL-SLOPE-WEEKLY` — recurring **WEEKLY** (rule registry) |
| Applicability | OC mines with high-wall benches > 30 m → MINE-001, MINE-002, MINE-003. **MINE-004 (UG) filtered out.** |
| Owner (per mine) | Mine Safety Officer (MINE-001 → Ram Singh) |
| Verifier (per mine) | Regulatory Official (Area oversight) — **≠ owner** |
| Deadline | Next Friday, end of Shift I (fixed by deadline policy) |
| Evidence checklist | 1. **Extensometer reading sheet (weekly log, EX-07)** — photo/register, guidance: "Signed weekly reading sheet with displacement < 2.5 mm/day threshold noted" — GPS: Bench 3B (23.6952, 85.0598) |
| | 2. **Bench 3B crest photo** — photo, guidance: "Crest showing berm markers and crack gauge in frame" |
| Field remarks | required, ≥ 15 characters |
| Rejection (verifier) | Item 2 only, fixed reason: **"Crest photo timestamp inconsistent with the recorded visit window and berm markers are not clearly visible — re-capture at the bench crest showing the berm and crack gauge."** |
| Close | Approve → VERIFIED_CLOSED + closure record (both names, timestamps, SHA-256 evidence hashes) |

Why this hero: it is **normal, recurring, field-based, verifiable** — not a disaster. It also ties
directly to the GIS module (the Bench 3B / northern highwall zone and slope-radar telemetry point
already exist in `GIS_3D_Map/src/data/mine001.ts`).

Supporting cast (seeded so the platform feels everyday, shown briefly in the manager review queue):
- MINE-005: **CLRA contractor licence renewal — PROPOSED** (expiry-driven, CONTRACTOR domain).
- MINE-002: **Weekly dust-suppression verification — PROPOSED** (recurring, ENVIRONMENT domain, EC Condition 14).
- MINE-002: **PPE compliance audit — AWAITING_VERIFICATION** (LABOUR) — shows a second item mid-flow.
- MINE-004: **Strata monitoring response — ESCALATED_L1** (overdue) — shows automatic escalation without being the hero.

---

## 4. The 4.5-minute script — screen by screen, line by line

> Presenter note: one laptop. Desktop in the main window, mobile in a second window/browser tab
> (`http://localhost:3000/mobile`), or a phone simulator frame. Reset demo state before starting.

### SCENE 1 — 00:00–00:30 · OPEN ON REALITY (no app)
**Screen:** browser tabs/PDFs (see §8 Research Kit) — DGMS Safety Alerts page, DGMS Annual Report 2024, The Wire MSS article.
**Manager (narrating):**
> "Every year DGMS publishes safety alerts and technical circulars. 2024: 40 fatal accidents, 51
> deaths in coal mines. Between 2020 and 2024, 226 people died — and most of the requirements that
> would have prevented it sit on notice boards and in spreadsheets. Even the satellite-based Mining
> Surveillance System: 958 alerts sent to states, only 491 acted on — follow-up inspections fell to
> 13%. The systems we have today *record* and *report*. Nothing *enforces* follow-through."
**Visible result:** the judge sees real government pages and a real annual report — the problem is documented, not invented.

### SCENE 2 — 00:30–00:55 · MONITOR (desktop, Manager persona)
**Screen:** `/` five-mine Monitor. One card per mine (Piparwar, Ashoka, Magadh, Ray-Bachra, Amrapali) with:
open / awaiting / overdue / closed counts, risk state, "needs attention" list; small GIS strip with 5 pins.
**Manager:**
> "This is what the area manager sees every morning: five mines, one screen. Which mines have work
> pending, what's awaiting verification, what's overdue, what's drifting. Today, this lives in
> five different mines' registers — I can't see any of it without asking."
**Visible result:** monitoring is the product's front door — calm, everyday, legible.

### SCENE 3 — 00:55–01:30 · INGEST + UNDERSTAND (desktop, Regulatory persona)
**Screen:** `/intake` — a document lands in the inbox: the **DGMS(Tech) Circular No. 02 of 2020 on systematic slope monitoring** (rendered replica of the real circular in `data/regulatory/` — a *routine regulatory instruction*, not an accident).
**Regulatory Official clicks "Process".** The AI pipeline runs (fixed staged animation).
**AI extraction panel appears with the 3-badge regime** (`✅ CONFIRMED FROM SOURCE`, `⚠️ AI INFERENCE`, `🔶 REQUIRES CONFIRMATION`):
- Scope: high-wall benches above 30 m → OC mines … ✅ source §2
- Requirement: continuous slope monitoring — extensometer/MPBX, prism survey, radar … ✅ source §3
- Threshold: alarm at ≥ 2.5 mm/day displacement … ✅ source §4
- Weekly displacement report to Regional Inspector … ✅ source §5
- Affected mines: OC with benches > 30 m … ⚠️ AI INFERENCE — confirm
**Regulatory Official:**
> "A circular arrives as a PDF. The AI extracts the structured requirements — each field cites the
> exact section of the document, and every field is badged: confirmed from source, inferred, or
> needing human confirmation. AI reads. The human stays in command."
**Regulatory Official clicks "Confirm".**
**Visible result:** AI does real, cited, non-authoritative work.

### SCENE 4 — 01:30–02:00 · RULES + RECURRENCE + REVIEW (desktop, Manager persona)
**Screen:** rule engine results + organizational-memory (RAG) panel + Manager Review queue.
- Rules panel: `OBL-SLOPE-WEEKLY` determined → applicable to **MINE-001, MINE-002, MINE-003**;
  **MINE-004 Ray-Bachra UG correctly filtered** (no high-wall benches). Deadline policy, owner role,
  verifier role, evidence checklist auto-attached. Recurring cadence: **WEEKLY** — this week's
  instance is in the review queue (also visible on the Calendar).
- RAG/advisory panel (small, top-right of the obligations panel):
  > "Memory: similar high-wall displacement pattern closed at Ashoka OCP (FY2023) D+12 and at
  > Magadh OCP (FY2024) D+9. Advisory: keep weekly cadence; both closed late."
- Review queue shows the generated PROPOSED items: weekly slope monitoring ×3 mines, monthly
  geotechnical review ×3, plus MINE-005 CLRA renewal and MINE-002 dust suppression.
**Manager (edits one thing, e.g. tightens Magadh's deadline to Friday noon, then publishes):**
> "Rules decide what applies, to which mine, by when, and what evidence proves it — every run is
> identical, auditable, no AI guesswork. The system also remembers this pattern happened before and
> tells me it closed late both times — that's advisory. I review the workload, adjust if needed, and
> publish. Nothing reaches a mine official until a human has looked at it."
**Visible result:** rules are authoritative; AI is advisory; the manager is the human gate.

### SCENE 5 — 02:00–02:40 · FIELD EXECUTION + EVIDENCE (mobile, Ram Singh)
**Screen:** phone. **DO THIS NEXT** hero card:
> "Weekly slope-displacement monitoring — Bench 3B high-wall (EX-07) · Due Fri, Shift I · DGMS(Tech) Circ. 02/2020"
Tap → task instructions: what to do, where (Bench 3B, Northern Highwall), the 2.5 mm/day threshold,
what to prove, who verifies ("Regulatory Official — ≠ you"), what happens if late (auto-escalate).
**Ram (narrating over the capture):**
> "Thursday morning. I walk to Bench 3B, read the extensometer, photograph the reading sheet — the
> phone stamps GPS and time. Then the crest photo with the berm markers and crack gauge in frame.
> Two items, geo-tagged, time-stamped. I add my remarks and submit. The system blocked submission
> until every required piece of evidence was attached."
**Visible result:** the phone is the field instrument — form + evidence in one flow.

### SCENE 6 — 02:40–03:00 · VERIFY + REJECT (desktop, Regulatory persona)
**Screen:** governance record for the task. Evidence metadata visible (GPS, timestamps, SHA-256).
**Regulatory Official:**
> "Submission reached my desk — desktop and mobile share the same state, so it's here the moment he
> submits. The evidence is complete, but look at the crest photo: timestamp inconsistent with the
> visit window, berm markers not clearly visible. I can't approve this. I reject that one item, with
> a reason — the task goes back to Ram, not to a queue, to *him*."
Click Reject → reason field → Confirm.
**Visible result:** rejection is specific, reasoned, and returns the task to the owner — and self-approval is structurally impossible.

### SCENE 7 — 03:00–03:20 · CORRECT + RESUBMIT (mobile)
**Screen:** phone — **ACTION REQUIRED** (red bucket), task shows the rejection reason inline on the flagged evidence item.
**Ram:**
> "On my phone it's loud and clear — Action Required, this photo, this reason. I walk back to the
> crest, re-capture with the berm and crack gauge visible, and resubmit."
Tap re-capture → submit.
**Visible result:** the correction loop is explicit, not implicit.

### SCENE 8 — 03:20–03:40 · APPROVE + VERIFIED RECORD (desktop)
**Screen:** governance record → Approve & Close → **VERIFIED RECORD** (closure panel: owner Ram Singh,
verifier Regulatory Official, created/submitted/verified timestamps, evidence hashes, closure hash, audit chain).
**Regulatory Official:**
> "Re-submission checks out. Approve. And here's the record — two different people, every timestamp,
> hashed evidence, an append-only audit trail. 'Closed' is now a proven fact, not an assumption."
**Visible result:** the closure record is the tangible artifact.

### SCENE 9 — 03:40–04:05 · MONITOR UPDATE + GIS (desktop, Manager persona)
**Screen:** Monitor — MINE-001 card updates live (awaiting 1 → closed +1; risk improves); then click
MINE-001 → **GIS drill-down: Piparwar OCP** — 2D map (boundary, zones, Bench 3B point, telemetry)
/ 3D terrain (Copernicus DEM) toggle. The extensometer point and the task's geotag sit inside the
mine boundary.
**Manager:**
> "Back on the monitor, everything updated — no refresh, no reconciliation. And this is Piparwar,
> the actual mine: real CMPDI coordinates, real Copernicus elevation data, the zone where the work
> happened, the geotag inside the boundary. The map is the mine's compliance state, not a pin on a
> national dashboard."
**Visible result:** GIS is the geographic anchor for the hero mine — integrated, not decorative.

### SCENE 10 — 04:05–04:30 · ADVISORY AI + CLOSE
**Screen:** Monitor advisory strip (or a small panel): per-mine **default-risk ranking** — e.g.
"MINE-005 elevated risk: 2 renewals due, 1 prior rejection; MINE-004 escalated; others nominal."
Badged `ADVISORY`.
**Manager (closing):**
> "Finally — advisory analytics. The platform watches each mine's overdue load, rejection rate, and
> closure speed, and flags which mine is drifting before a deadline is missed. Rules decide. AI
> advises. People act. One requirement entered the system; a rule made it an owned, recurring
> obligation; Ram executed it in the field; an independent verifier rejected, he corrected, and it
> closed with a provable record — and the manager sees all five mines in one screen. Today, that
> journey ends at a notice board. With SAMAADHAN, it ends here."
**Visible result:** the demo closes on the platform's everyday value, with the 20-second explanation
as the final line if time allows.

---

## 5. Moment index (where each pillar appears)

| Moment | Where (scene) | Exact screen |
|---|---|---|
| **AI appears** | Scene 3 (ingest) — extraction with 3-badge regime; also Scene 4 (memory) + Scene 10 (advisory risk). AI is *never* shown deciding anything. | `/intake` extraction panel |
| **Rules appear** | Scene 4 — applicability (3 of 4 OC apply; Ray-Bachra UG filtered), owner/deadline/evidence policy, **weekly recurrence** auto-instance, escalation rule visible on MINE-004 item. | rule-engine results panel + Manager Review queue + Calendar |
| **Monitoring appears** | Scene 2 (five-mine monitor) + Scene 9 (live update after closure). | `/` Monitor |
| **GIS appears** | Scene 2 (5-pin strip) + Scene 9 (Piparwar 2D/3D drill-down with boundary, zones, Bench 3B, telemetry). | `/gis` overview + `/mine/MINE-001` GIS module |
| **RAG appears** | Scene 4 (organizational-memory panel: "same pattern closed late at Ashoka/Magadh") + Scene 10 (default-risk ranking). Both clearly labeled advisory; deterministic fallback required. | obligations panel + Monitor advisory strip |

---

## 6. USP shown to judges

**Primary:** *Every compliance requirement becomes an owned, deadlined, evidenced, independently
verified, recurring obligation — and one manager can see the live compliance state of all five mines.*

The three pillars the demo actually demonstrates:
1. **Rules enforce; humans decide.** Applicability, deadlines, recurrence, evidence, owner, escalation
   are deterministic policy. The manager reviews before anything is assigned; the verifier decides
   closure.
2. **Structural accountability (owner ≠ verifier).** The officer who works cannot close his own work;
   rejection returns the task to the *person*, with a reason, and the closure record locks both
   identities.
3. **Everyday monitoring, not event response.** The platform's default state is a calm, live picture
   of compliance work across the area — recurring checks, renewals, verifications — with AI as an
   advisory memory/risk layer.

**Closing line:** "Coal India records compliance everywhere and proves almost nothing. SAMAADHAN makes
sure every requirement has an owner, a deadline, field evidence, and an independent verifier — and
shows the manager the whole area in one screen."

---

## 7. Mapping to PS 26024 (Ministry of Coal / CIL — Smart Automation)

| PS requirement | Where the demo shows it |
|---|---|
| Digitally track statutory compliance (safety, environment, production, labour) | Rule registry + obligations across domains (slope monitoring, dust suppression, PPE, CLRA renewal) |
| Real-time monitoring of inspections, observations, violations, corrective actions | Scene 2 + 9 — five-mine Monitor, live state transitions |
| AI/analytics to identify high-risk areas, recurring compliance failures, anomalies | Scene 4 (recurrence memory) + Scene 10 (default-risk ranking) — advisory |
| Geo-tagged, time-stamped field reporting via mobile | Scenes 5–7 — GPS + timestamp + SHA-256 evidence capture |
| Dashboards for mine officials, corporate management, regulatory authorities | Three actors: mobile official, manager monitor, regulatory verifier |
| Automated alerts, reminders, compliance reports, escalation | Weekly recurrence auto-instance, due/overdue/escalation ladder (MINE-004 escalated item) |
| Minimize paperwork; transparency, accountability, decision-making | Evidence replaces registers; closure record + audit trail; manager drill-down |
| Scalable across multiple mines and subsidiaries | One obligation class fans to 3 mines by rule; registry scales by adding mines/rows |
| GIS mapping, OCR/doc digitization, workflow automation, audit trails | GIS drill-down (Scene 9), AI extraction (Scene 3), state machine + append-only audit |
| Contract management / labour compliance | MINE-005 CLRA renewal + MINE-002 PPE audit (supporting cast) |

---

## 8. What must NOT be shown (complexity that hurts the story)

- ❌ **61 mines / 183 obligations / nationwide map.** Any leftover "fan-out" language from the old story.
- ❌ **A fatal-accident alert as the hero.** The Kusmunda dumper PDF is not in the script (it may remain
  in the inbox as an unrelated item, but never opened on stage).
- ❌ **"AI decides" phrasing.** AI extracts, remembers, advises — rules and humans decide.
- ❌ **Walking all six domains.** Show 2–3 domains in passing; six domains on stage = confusion.
- ❌ **Offline-sync simulation toggles**, sync status popovers, draft-save toasts on mobile.
- ❌ **The desktop role switcher mid-demo.** Personas are changed by the presenter off-screen; on-stage
  it's Manager → Regulatory → Manager.
- ❌ **Blockchain / "immutable ledger" claims.** It's a SHA-256 audit chain; say "tamper-evident record".
- ❌ **Real-time sensor feeds or telemetry claims** — the GIS telemetry stays visibly labeled SIMULATED.
- ❌ **Regulator portal / MoU simulation badges**, export buttons, PDF certificate download hype.
- ❌ **Any load on the GIS page other than the five pins** and the Piparwar drill-down.

---

## 9. Research kit for the presenter (open these on stage)

Pre-download the PDFs; keep the web pages as pinned tabs. Exact claims to make with each:

| # | Artifact (open/show) | Claim it supports | Link |
|---|---|---|---|
| 1 | **DGMS Safety Alerts page** (live tab) | "DGMS publishes numbered alerts/circulars as PDFs on a website — this is the raw input our platform digitizes." | https://www.dgms.gov.in/UserView/index?mid=1362 |
| 2 | **DGMS Annual Report 2024 (PDF, pre-download, Table 17)** | "2024: 40 fatal accidents / 51 fatalities in coal mines. Year-wise table is right here." | https://www.dgms.gov.in/writereaddata/UploadFile/AR_2024_Final_16122025.pdf |
| 3 | **The Wire — "Governments sleep on half of them" (Jan 2026, RTI)** | "MSS satellite alerts: 958 sent, only 491 acted on (~51%); follow-up inspections fell to 13% in 2023-24; Chhattisgarh, Jharkhand, Meghalaya inspected 11 of 173 triggers. Detection without enforcement." | https://m.thewire.in/article/business/a-system-to-identify-illegal-mining-raises-hundreds-of-alerts-governments-sleep-on-half-of-them |
| 4 | **Dataful Insights (Aug 2026, Parliamentary data)** | "2020–2024 coal mines: 195 fatal accidents, 726 serious accidents, 226 deaths, 770 serious injuries." | https://insights.dataful.in/articles/telangana-accounted-for-nearly-two-thirds-of-serious-coal-mine-accidents |
| 5 | **Factly (Mar 2025)** | Same numbers + "deaths continue even as production target rises 42%." | https://factly.in/data-india-sets-a-target-to-increase-domestic-coal-production-by-42-in-next-5-years-as-coal-mine-accidents-continue/ |
| 6 | **ETV Bharat — Rajya Sabha answer (Mar 2025)** | "226 deaths confirmed in Parliament; 53 in 2020 and 53 in 2024." | https://www.etvbharat.com/en/!bharat/parliament-coal-and-mines-deaths-lignite-rajya-sabha-enn25031704125 |
| 7 | **Ministry of Coal PIB (Aug 2023, PDF)** | "CSIS exists — 'online centralized safety monitoring system for monitoring different safety parameters.' It monitors parameters; it doesn't enforce follow-through." | https://www.coal.nic.in/sites/default/files/2023-08/PIB1946382.pdf |
| 8 | **PIB (Dec 2023)** | Same CSIS description, safety measures list. | https://www.pib.gov.in/PressReleasePage.aspx?PRID=1985836 |
| 9 | **CIL BRSR FY 2024-25 (PDF)** | "CIL's own sustainability report lists NCMSR portal + CSIS as the compliance/reporting backbone — reporting and monitoring exist; enforcement doesn't." | https://d3u7ubx0okog7j.cloudfront.net/documents/Coal_India_BRSR_31.07.2025.pdf |
| 10 | **Ministry of Coal Annual Report 2024-25, Ch. 20 (IT)** | "The Ministry's IT chapter: lots of decision-support systems — none is a compliance *enforcement* spine." | https://coal.gov.in/sites/default/files/2025-02/chap20AnnualReport2025en2.pdf |
| 11 | **CIL ICIS compliance dashboard (live tab)** | "Contractor statutory compliance exists today as a *separate silo* ('ICIS') — our point: everything runs through one engine." | https://www.coalindiaicis.com/ |
| 12 | **CSIS login (live tab)** + **NCMSR login (live tab)** | "These are the two portals coal India uses to record and report. Neither assigns an owner or verifies closure." | https://apps.coalindia.in/ords/f?p=130 · https://apps.coalindia.in/ords/f?p=239 |
| 13 | **DGMS National Risk Rating Index (PDF)** | "DGMS itself now risk-ranks mines (NRRI) — the appetite for risk analytics is official; our default-risk advisory complements it." | https://dgms.gov.in/writereaddata/UploadFile/NationalRiskDGMS_19082026.pdf |
| 14 | **Piparwar Area — Wikipedia** | "Our demo area is real: North Karanpura Coalfield, CCL, Chatra — Piparwar, Ashoka, Ray-Bachra." | https://en.wikipedia.org/wiki/Piparwar_Area |
| 15 | **CCL environmental monitoring page** | "CCL already monitors Ashok & Piparwar OCP by remote sensing — ground-truthing that data is exactly what field evidence does." | https://www.centralcoalfields.in/sutbs/envirm.php |
| 16 | **Mongabay — Piparwar reclamation (context, optional)** | "Piparwar is also the site of India's largest mine-reclamation study — a mine the platform tracks across its whole lifecycle." | https://india.mongabay.com/2021/04/the-hits-and-misses-of-a-mine-reclamation-project-in-jharkhand/ |
| 17 | **Coal Controller — mine statistics (live tab, optional)** | "408 mines in the national register — this is the registry scale the rule engine is built for." | https://coalcontroller.gov.in/mine-statistics |

**Suggested research script (45 seconds, fits inside Scene 1):**
> "Three artifacts show the gap. DGMS publishes alerts and circulars as PDFs — here's the page, and
> here's their 2024 annual report: 40 fatal accidents, 51 deaths in coal mines. The Mining
> Surveillance System sends satellite alerts — 958 so far, only 491 acted on, follow-up at 13%.
> And Coal India's own portals — CSIS, NCMSR — record and report compliance. What's missing in all
> three is the same thing: a requirement with an owner, a deadline, proof, and a verifier."

---

## 10. Implementation checklist for the coding agent

**Data (shared/data + new files):**
- [ ] `mines.json` → exactly the 5 mines in §2 (MINE-001 = Piparwar OCP, coordinates 23.69111/85.06667).
- [ ] `users.json` → Manager, Regulatory Official, Ram Singh (MSO-402, mine MINE-001) + verifiers; every task owner/verifier pair has owner ≠ verifier.
- [ ] `tasks.json` → hero task (Bench 3B weekly slope monitoring) with the 2-item evidence checklist, `isCriticalDoThisNext: true`, status flow-ready; supporting cast (dust suppression, PPE, CLRA, escalation item).
- [ ] NEW `obligations.json` → rule registry incl. `OBL-SLOPE-WEEKLY` (cadence WEEKLY, applicability OC+bench>30m, owner/verifier roles, deadline policy, evidence checklist, escalation rule).
- [ ] NEW `schedule.json` → the weekly instance seed (current week, MINE-001).
- [ ] `alerts.json` → the slope-monitoring circular as the ingest document (internal ref `DGMS/2026/TC-27` ↔ **real source DGMS(Tech) Circ. No. 02 of 2020**, PDF in `data/regulatory/`; `kind: dgms-circular`); remove 61-mine/183-object language from `dashboard.json`, `fanoutByAlert.json`, `history.json`, `recurrence.json`, `aiExtractionByAlert.json`.

**Store (`shared/demo/store.ts` + types):**
- [ ] Statuses: add `PROPOSED`, `ASSIGNED`; keep `IN_PROGRESS`, `AWAITING_VERIFICATION`, `REJECTED`, `VERIFIED_CLOSED`, `OVERDUE`, `ESCALATED`.
- [ ] Operations: `processDocument` (extraction), `determineObligations` (rule engine), `reviewAndPublish` (manager), `createTask`/`adjustTask` (manager), `submitTask`, `rejectEvidence` (fixed hero reason), `resubmitTask`, `approveTask`, `schedulerTick` (idempotent weekly instance), `observationIntake` (officer → PROPOSED).
- [ ] Actor scoping: mobile `/api/state` returns only Ram Singh's visible tasks; PROPOSED never on mobile.
- [ ] Audit events for every transition; closure record with hashes.

**Desktop (client):**
- [ ] Routes: `/` Monitor (5 cards + attention list + GIS strip), `/intake` (document + extraction + rules panel + memory panel), `/review` (manager queue + edit/publish + manual create), `/register`, `/calendar`, `/gis` (5 pins), `/mine/:id` (drill-down; MINE-001 hosts the integrated GIS module).
- [ ] Persona switcher: Manager ↔ Regulatory Official only.
- [ ] Governance record modal: evidence metadata, reject-with-reason, approve, closure record; manager edit mode when PROPOSED.

**Mobile (mobile):**
- [ ] Keep all existing components/visual language. Add: ACTION REQUIRED bucket (REJECTED), inline rejection reason on the flagged evidence item, "≠ you" verifier chip, submitting state.
- [ ] Identity: Ram Singh / Piparwar OCP (from server state, not hardcoded mix).
- [ ] M3 observations POST to the store (no more local-only).

**GIS integration (no redesign):**
- [ ] Move `GIS_3D_Map/src/{types,lib,data,components}` into `client/src/gis/` verbatim; render in `/mine/MINE-001` with `MINE_001_DATA` + governance derived from shared task state + existing SIMULATED telemetry; keep provenance panel.

**Sync & reset:** polling (3 s) + focus refetch stays; desktop and mobile must show the same task status within seconds; `POST /api/reset` restores pristine state; verify the full Scene 3–9 loop after every change.

**Verification:** `npm run typecheck`, store state-machine test (updated), and the manual runbook above end-to-end.