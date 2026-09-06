# SAMAADHAN — RESEARCH, DEMO STORY & PRODUCT STRATEGY (NEW: 5-Mine Everyday Compliance)

> **SUPERSEDED STORY:** the previous 61-mine / 183-obligation / fatal DGMS alert fan-out narrative is
> retired. This document is the research and story base for the new demo: one Jharkhand operational
> area, five mines, three actors, one recurring compliance hero workflow. The executable script,
> screen-by-screen sequence and implementation checklist live in `DEMO_FLOW.md`.

---

## 1. PROJECT UNDERSTANDING

### What SAMAADHAN Is
A compliance, regulatory and monitoring platform for coal mines. It ingests compliance information
(DGMS circulars/alerts, EC conditions, compliance reports, attendance, production, safety and
environmental data, periodic/monthly reports, manual observations), applies a **deterministic rule
engine** to decide *what obligation exists, which mine it applies to, who owns it, when it's due,
what evidence proves it, and how it escalates*, then runs each obligation through **field execution →
evidence capture → independent verification → verified record → monitoring** — visible to an area
manager across all five mines on one screen.

### The three actors
| Actor | Surface | Role |
|---|---|---|
| **Area/Corporate Manager** | Desktop | Monitors five mines; reviews, edits, adjusts and publishes obligations; owns the workload. |
| **Regulatory Official** | Desktop | Ingests compliance documents; verifies submitted evidence (approve/reject). Never the person who did the work. |
| **Mine Official (Ram Singh, MSO-402)** | Mobile | One mine (MINE-001 Piparwar OCP); receives assigned tasks, executes in the field, captures geo-tagged evidence, submits, corrects after rejection. |

### The operational area (real)
**North Karanpura Coalfield, Central Coalfields Limited, Jharkhand** — five mines anchored on
**Piparwar Opencast Project (Chatra; 23.69111°N, 85.06667°E)** — the mine the existing GIS module
already models with real CMPDI coordinates, Copernicus DEM elevation, and Sentinel/ESRI imagery.
Companion mines: Ashoka OCP (Chatra), Magadh OCP (Hazaribagh), Ray-Bachra UG (Chatra), Amrapali OCP
(Hazaribagh).

### The hero workflow (why this one)
**Weekly slope-displacement monitoring at Bench 3B high-wall (extensometer EX-07)**, originating from
**DGMS(Tech) Circular No. 02 of 2020 (Guidelines for Systematic Monitoring of Slopes in Opencast Coal Mines)** — a normal, recurring, field-based compliance activity. It is NOT
an accident story. It exercises the entire product: ingest → AI extraction → rule engine → manager
review → assignment → field execution → evidence → verification → rejection → correction → approval →
verified record → live monitor update, and it ties directly into the GIS module (Bench 3B / northern
highwall zone + slope-radar telemetry).

---

## 2. REAL-WORLD PROBLEMS (RESEARCH-BACKED)

### Problem 1: The enforcement gap — detection and reporting exist, follow-through doesn't
India's Mining Surveillance System (MSS) uses satellites to detect illegal mining and compliance
violations. Since inception it has sent **958 alerts** to states; governments acted on just **491
(≈51%)**. Follow-up inspections fell to **13%** in 2023-24; Chhattisgarh, Jharkhand and Meghalaya
inspected only **11 of 173** triggers.
**Source:** The Wire, 13 Jan 2026, RTI-data analysis — https://m.thewire.in/article/business/a-system-to-identify-illegal-mining-raises-hundreds-of-alerts-governments-sleep-on-half-of-them
**The gap:** alerts are detected and published; nothing converts them into an owned, deadlined,
evidenced, verified obligation.

### Problem 2: The human cost — 226 deaths in five years
Between 2020 and 2024, Indian coal mines recorded **195 fatal accidents and 726 serious accidents,
resulting in 226 deaths and 770 serious injuries** (Parliamentary data). DGMS's 2024 annual report
records **40 fatal accidents and 51 fatalities in coal mines in 2024 alone**. Ministerial answers in
Parliament (Mar 2025) confirm 226 deaths, with 53 in 2020 and 53 in 2024.
**Sources:**
- Dataful Insights (Aug 2026): https://insights.dataful.in/articles/telangana-accounted-for-nearly-two-thirds-of-serious-coal-mine-accidents
- Factly (Mar 2025): https://factly.in/data-india-sets-a-target-to-increase-domestic-coal-production-by-42-in-next-5-years-as-coal-mine-accidents-continue/
- ETV Bharat / Rajya Sabha (Mar 2025): https://www.etvbharat.com/en/!bharat/parliament-coal-and-mines-deaths-lignite-rajya-sabha-enn25031704125
- DGMS Annual Report 2024 (Table 17, year-wise fatal accidents in coal mines): https://www.dgms.gov.in/writereaddata/UploadFile/AR_2024_Final_16122025.pdf
**The gap:** the requirements that prevent these deaths exist as circulars and checklists; the
platform that proves they were done does not.

### Problem 3: Existing systems record and report — none enforce
- **CSIS** (CIL Centralised Safety Information System) is an "online centralized safety monitoring
  system for monitoring different safety parameters" — it monitors parameters, not accountability.
  (Ministry of Coal PIB Aug 2023, https://www.coal.nic.in/sites/default/files/2023-08/PIB1946382.pdf;
  PIB Dec 2023, https://www.pib.gov.in/PressReleasePage.aspx?PRID=1985836)
- **NCMSR** (National Coal Mine Safety Reporting Portal) digitizes reporting (apps.coalindia.in).
- **CIL's own BRSR FY 2024-25** lists NCMSR + CSIS as the compliance/reporting backbone
  (https://d3u7ubx0okog7j.cloudfront.net/documents/Coal_India_BRSR_31.07.2025.pdf).
- **ICIS** handles contractor statutory compliance as a *separate silo*
  (https://www.coalindiaicis.com/) — the point: today each domain has its own portal; none is a
  single engine with owner/deadline/evidence/verification.
**The gap:** recording and reporting are digitized; responsibility is not. Nothing assigns an owner,
a deadline, required evidence, an independent verifier, or automatic escalation.

### Problem 4: Regulatory documents are PDFs on a website
DGMS publishes numbered safety alerts and technical circulars as PDFs (https://www.dgms.gov.in/UserView/index?mid=1362).
They reach mines through email chains and notice boards. Whether the specific instruction was
implemented, by whom, when, and with what proof — no one can show.
**The gap:** a regulator PDF has no enforcement loop. SAMAADHAN's ingest → rules → obligation is that loop.

### Problem 5: Risk analytics are valued but disconnected from action
DGMS now publishes a **National Risk Rating Index (NRRI)** risk-ranking mines
(https://dgms.gov.in/writereaddata/UploadFile/NationalRiskDGMS_19082026.pdf), and CCL already does
remote-sensing monitoring of Ashok and Piparwar OCP (https://www.centralcoalfields.in/sutbs/envirm.php).
Risk scores exist; a *default-risk warning tied to actual compliance workload* does not.
**The gap:** advisory analytics should feed the manager's daily decisions — which mine is drifting —
without ever deciding compliance itself.

### Problem 6: Field evidence is paper
Attendance sheets, reading logs, licences and PME certificates live in physical registers; evidence
of compliance is reconstructed at audit time. Geo-tagged, time-stamped, hash-sealed capture at the
point of work is what auditors and DGMS inspectors actually need.
**The gap:** the PS explicitly asks for "geo-tagged and time-stamped field reporting through mobile
applications" — SAMAADHAN's field evidence flow is that requirement, demonstrated.

---

## 3. CANDIDATE STORIES FOR THE NEW DEMO

| # | Story | Everyday? | Full loop? | GIS fit | Rejection drama | Verdict |
|---|---|---|---|---|---|---|
| A | **Weekly slope-displacement monitoring (Bench 3B, EX-07) from the DGMS slope-monitoring circular (Tech) 02/2020** | ✅ recurring, routine | ✅ ingest→rules→assign→field→verify→reject→close→monitor | ✅ Bench 3B zone + radar telemetry exist in GIS | ✅ timestamp/berm-marker rejection | **WINNER** |
| B | Weekly dust-suppression verification (EC Condition 14, SPCB) | ✅ recurring | ✅ | ✅ haul road | ✅ | Strong backup |
| C | Monthly PPE compliance audit (Mines Rules 1955) | ✅ | ✅ | ⚠️ weak | ✅ | Backup |
| D | CLRA contractor licence renewal (annual, expiry-driven) | ✅ | ⚠️ less field work | ⚠️ | ⚠️ | Supporting cast |
| E | Field hazard observation → obligation | ✅ | ✅ | ✅ | ⚠️ | Supporting cast |
| F | Fatal-accident alert fan-out (OLD story) | ❌ disaster response | ✅ | ❌ national map | ✅ | **Retired** |

**Why A wins:** it is the platform's *everyday* job — a weekly check that today is a paper register.
It exercises every stage of the product, pairs perfectly with the existing GIS anchor, and its
rejection (a timestamp/visibility defect on the crest photo) is realistic and easy to demonstrate.

---

## 4. WHY THE NEW STORY WINS

1. **It feels like a monitoring platform, not a panic button.** The demo opens on a calm five-mine
   monitor and a routine weekly check — judges see a product for daily use, not a disaster tool.
2. **It demonstrates the FULL loop on one task.** Ingest → AI assist → rules → manager review →
   field execution → evidence → rejection → correction → approval → verified record → live monitor
   update. Nothing is skipped.
3. **Rules are visibly authoritative; AI is visibly advisory.** The applicability result (3 mines
   apply, Ray-Bachra UG filtered), the weekly recurrence, the owner/verifier/deadline/evidence
   policy — all deterministic. AI only extracts with citations, recalls history, and ranks risk.
4. **The rejection-correction scene remains the differentiator.** A verifier rejects one photo with a
   reason; the task returns to the *person*; he corrects; she approves; the closure record locks both
   names, timestamps and evidence hashes. That 40-second exchange is the product.
5. **GIS is the geographic anchor, used twice, not decoration.** Five pins on the monitor, then the
   real Piparwar 2D/3D GIS on drill-down — the geotag sits inside the mine boundary.
6. **RAG and risk analytics appear exactly where a judge expects intelligence** — "this pattern
   closed late twice before" (memory) and "MINE-005 is drifting" (default-risk) — both badged
   advisory, both deterministic-fallback safe.

---

## 5. THE 3–5 MINUTE SEQUENCE (summary — full script in DEMO_FLOW.md)

| Time | Scene | Screen | Who acts |
|---|---|---|---|
| 00:00–00:30 | Reality: DGMS alerts page, AR-2024 PDF, The Wire MSS | browser tabs/PDFs | Manager narrates |
| 00:30–00:55 | Monitor: five mines, one screen | desktop `/` | Manager |
| 00:55–01:30 | Ingest: DGMS(Tech) Circ. 02/2020 → AI extraction, 3 badges | desktop `/intake` | Regulatory Official |
| 01:30–02:00 | Rules + recurrence + manager review/publish | `/intake` rules panel → `/review` | Manager |
| 02:00–02:40 | Field execution + evidence (2 items, geo-tagged) | mobile M0 → M2 | Ram |
| 02:40–03:00 | Verify + reject crest photo with reason | desktop modal | Regulatory Official |
| 03:00–03:20 | Correct + resubmit (ACTION REQUIRED) | mobile M1 → M2 | Ram |
| 03:20–03:40 | Approve → VERIFIED RECORD | desktop modal | Regulatory Official |
| 03:40–04:05 | Monitor update + GIS drill-down (Piparwar 2D/3D) | desktop `/` → `/mine/MINE-001` | Manager |
| 04:05–04:30 | Advisory risk ranking + closing line | desktop `/` advisory strip | Manager |

---

## 6. SCREEN REQUIREMENTS (what each surface must deliver)

### Mobile (Ram Singh, MINE-001) — preserve the existing visual language
| Screen | Must show |
|---|---|
| Home (M0) | DO THIS NEXT hero: "Weekly slope-displacement monitoring — Bench 3B high-wall (EX-07) · Due Fri Shift I · DGMS(Tech) Circ. 02/2020"; quick actions (Report Observation, My Queue); work overview; shift card. |
| Queue (M1) | **ACTION REQUIRED** red bucket for REJECTED (with reason visible on the card), then Overdue / Due Soon / Under Review / Closed. Only Ram's tasks. |
| Evidence (M2) | Instructions ("what / where / threshold 2.5 mm/day / what to prove / verifier ≠ you / escalate if late"); 2 evidence items; per-item rejection reason inline; progress; remarks ≥15 chars; submit; brief submitting state. |
| Observation (M3) | POSTs to the shared store as PROPOSED (visible to manager) — no longer device-only. |
| Profile | Ram Singh / MSO-402 / Piparwar OCP / DGMS cert — from server state. |

### Desktop — Manager and Regulatory personas
| Screen | Must show |
|---|---|
| `/` Monitor | Five mine cards (open/awaiting/overdue/closed, risk, attention list), GIS strip (5 pins), advisory default-risk ranking. Live updates after closure. |
| `/intake` | Inbox; document viewer (DGMS(Tech) Circ. 02/2020 replica — internal ref `DGMS/2026/TC-27`); AI extraction panel (3-badge regime); rules panel (applicability per mine, deadline policy, owner/verifier, evidence, weekly recurrence); organizational-memory (RAG) panel (advisory). |
| `/review` | PROPOSED queue: edit owner/deadline/evidence, adjust, add manual task, publish. Recurring instances appear here and on the Calendar. |
| `/register` | Filterable compliance register (mine, domain, status). |
| `/gis` | 5 Jharkhand pins. |
| `/mine/MINE-001` | Integrated GIS module: 2D map (boundary, zones, Bench 3B, telemetry, geotag), 3D terrain (Copernicus DEM), compliance drawer, data-provenance panel. |
| Governance record modal | Evidence metadata (GPS/timestamp/SHA-256), reject-with-reason, approve, VERIFIED RECORD (both identities, timestamps, hashes, audit chain). Manager edit mode for PROPOSED items. |

---

## 7. FEATURES NOT BUILT / NOT SHOWN FOR THIS DEMO

- Real LLM/OCR calls and real vector DB — deterministic pre-parsed extraction + seeded memory (RAG panel) with the same schema; AI is simulated-but-labeled, exactly as before.
- Offline sync, sync-status simulation, draft-save toasts on mobile.
- More than two desktop personas on stage; the role switcher is presenter-only.
- Blockchain language — it's a SHA-256 audit chain; call it a "tamper-evident record".
- Export buttons, PDF certificate generation, regulatory MoU simulation.
- Walking all six domains; the register shows breadth implicitly, the story shows 2–3.
- National/61-mine scope in any form.

---

## 8. RESEARCH KIT (open or pre-download for the demo)

See **DEMO_FLOW.md §9** for the full table of links, PDFs and the exact claim each supports. The
four you will actually hold up on stage:
1. **DGMS Safety Alerts page** (live) — https://www.dgms.gov.in/UserView/index?mid=1362
2. **DGMS Annual Report 2024** (PDF, Table 17) — https://www.dgms.gov.in/writereaddata/UploadFile/AR_2024_Final_16122025.pdf
3. **The Wire, "Governments sleep on half of them"** (Jan 2026) — https://m.thewire.in/article/business/a-system-to-identify-illegal-mining-raises-hundreds-of-alerts-governments-sleep-on-half-of-them
4. **Ministry of Coal PIB (Aug 2023) on CSIS** (PDF) — https://www.coal.nic.in/sites/default/files/2023-08/PIB1946382.pdf

---

## 9. OPEN QUESTIONS FOR THE IMPLEMENTER

1. Slope-monitoring circular: render as the styled replica already present in `alerts.json` (`al-dgms2`, internal ref `DGMS/2026/TC-27`); the real source document is **DGMS(Tech) Circular No. 02 of 2020** (bundled at `data/regulatory/DGMS_Tech_Circular_02_of_2020_Slope_Monitoring_OC.pdf`) —
   confirm it displays correctly in the new intake view.
2. The `TASK-001` id from the old story is retired; adopt a new hero id (e.g. `TASK-SLOPE-WK-<period>`) and
   update `store.test.ts` assertions accordingly.
3. Rejection flow: single-item rejection only (crest photo); verify the mobile ACTION REQUIRED bucket
   and inline reason render from server state within the 3 s poll.
4. GIS module move: confirm `Terrain3DView` renders inside the desktop layout (WebGL + Tailwind neutral
   palette coexist with the desktop theme) and that the provenance panel and compliance drawer work
   from the drill-down route.
5. MINE-002…005 coordinates are indicative; finalize before polish (P6).

---

*Generated with Codebuff 🤖*
*Co-Authored-By: Codebuff <noreply@codebuff.com>*