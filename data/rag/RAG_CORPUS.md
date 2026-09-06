# data/rag — RAG CORPUS (first cut, 18 documents)

> This is the **seed corpus** for the advisory retrieval layer (P5). Each entry lists title, source
> class, URL (or bundled path), why relevant, domain, mine relevance, and expected searchable
> concepts. Documents marked **bundled** are physically in this data pack; others are ingested by
> URL at build time (or replaced by their bundled copy). Embeddings should be built over the text of
> each document once fetched.

## Tier 1 — statutory & regulatory (must-have)

| # | Title | Class / path | Why relevant | Domain | Mine relevance | Searchable concepts |
|---|---|---|---|---|---|---|
| 1 | Coal Mines Regulations, 2017 (gazette text) | [REAL PUBLIC] bundled `../regulatory/Coal_Mines_Regulations_2017_gazette_text.pdf` | Statutory backbone; every task cites a Reg. | Safety/Labour/Production | All 5 | slope, spoil bank, dump, HEMM, transport, registers, medical examination, safety appliances |
| 2 | DGMS(Tech) Circular No. 02 of 2020 — Systematic Monitoring of Slopes in OC Mines | [REAL OFFICIAL] bundled `../regulatory/DGMS_Tech_Circular_02_of_2020_Slope_Monitoring_OC.pdf` | **Hero instrument**; generates the weekly slope-monitoring obligation | Safety | MINE-001/002/003 (OC, high-wall/dump slopes); not MINE-004 | slope monitoring, prism, extensometer, radar, dump slope, high-wall, monitoring frequency |
| 3 | Mines Rules, 1955 (gazette text) | [REAL PUBLIC] bundled `../regulatory/Mines_Rules_1955_gazette_text.pdf` | Attendance registers, PPE/safety apparel, leave/medical rules | Labour/Safety | All 5 | attendance register, muster, safety apparel, footwear, helmet, medical |
| 4 | The Mines Act, 1952 (DGMS-hosted) | [REAL OFFICIAL] bundled `../regulatory/Mines_Act_1952_official.pdf` | s.47/48 hours + register of persons | Labour | All 5 | register of persons employed, hours of work, attendance |
| 5 | DGMS Safety Alert 23/2026 (Kusmunda) | [REAL OFFICIAL] bundled `../regulatory/DGMS_Safety_Alert_23-2026_Kusmunda.pdf` | Real alert PDF example; dumper/berm hazard class | Safety | National → OC+HEMM mines | dump edge, berm, dumper, overturn, safe operating limit, seat belt |

## Tier 2 — statistics, risk & accountability evidence

| # | Title | Class / URL | Why relevant | Domain | Mine relevance | Searchable concepts |
|---|---|---|---|---|---|---|
| 6 | DGMS Annual Report 2024 | [REAL OFFICIAL] bundled `../regulatory/DGMS_Annual_Report_2024.pdf` | Accident statistics (Table 17), inspection activity | Safety | All 5 (context) | fatal accidents, fatalities, accident rate, inspections, enforcement |
| 7 | DGMS National Risk Rating Index | [REAL OFFICIAL] bundled `../regulatory/DGMS_National_Risk_Rating_Index.pdf` | Official mine risk rating → advisory analytics alignment | Safety | All 5 | risk rating, hazard index, mine categorization |
| 8 | MoC PIB — Measures in place to Ensure Coal Mines Safety (Aug 2023) | [REAL OFFICIAL] bundled `../regulatory/MoC_PIB_Safety_Measures_Aug2023.pdf` | CSIS described as parameter monitoring (the enforcement gap) | Safety/Labour | All 5 | CSIS, safety monitoring, parameters, portal |
| 9 | The Wire — MSS alerts analysis (Jan 2026) | [REAL PUBLIC] https://m.thewire.in/article/business/a-system-to-identify-illegal-mining-raises-hundreds-of-alerts-governments-sleep-on-half-of-them | 958 alerts/491 acted/13% follow-up — detection vs enforcement | Safety/Environment | All 5 (context) | mining surveillance, satellite alerts, action taken, follow-up |
| 10 | Dataful Insights — coal mine accidents 2020-24 | [REAL PUBLIC] https://insights.dataful.in/articles/telangana-accounted-for-nearly-two-thirds-of-serious-coal-mine-accidents | 195 fatal accidents, 226 deaths, 770 injuries | Safety | All 5 (context) | fatal accidents, serious injuries, deaths, state-wise |

## Tier 3 — operator/company & area (mine relevance)

| # | Title | Class / URL | Why relevant | Domain | Mine relevance | Searchable concepts |
|---|---|---|---|---|---|---|
| 11 | CCL Annual Report 2024-25 | [REAL OFFICIAL] bundled `../mine_documents/CCL_Annual_Report_2024-25.pdf` | Area/company production, mines, safety stats, photos | Production/Safety/Env | All 5 | Magadh, Amrapali, Piparwar, North Karanpura, production MT, safety |
| 12 | CIL BRSR FY 2024-25 | [REAL OFFICIAL] bundled `../regulatory/CIL_BRSR_FY2024-25.pdf` | Group sustainability/compliance backbone (NCMSR/CSIS) | Labour/Env/Governance | All 5 | compliance, reporting, NCMSR, CSIS, sustainability |
| 13 | Amrapali OCP Expansion Phase-I project report | [REAL OFFICIAL] environmentclearance.nic.in (URL in `../environment/MANIFEST.md`) | Real EC project doc for MINE-005 | Environment | MINE-005 | environmental clearance, MTPA, expansion, EC conditions |
| 14 | Ashok OCP expansion project report | [REAL OFFICIAL] forestsclearance.nic.in (URL in `../environment/MANIFEST.md`) | Real project doc for MINE-002 | Environment | MINE-002 | forest clearance, expansion, North Karanpura |
| 15 | CCL Environment & Forest page (EC/CTO/six-monthly compliance) | [REAL OFFICIAL] https://www.centralcoalfields.in/sutbs/envrfrst.php | Compliance-reporting cadence the platform automates | Environment | All 5 | environmental clearance, consent to operate, six-monthly compliance |
| 16 | Ministry of Coal — Production and Supplies | [REAL OFFICIAL] https://coal.gov.in/major-statistics/production-and-supplies | Real production statistics scale | Production | All 5 (context) | production MT, despatch, subsidiary |
| 17 | PIB (Aug 2022) — North Karanpura production outlook | [REAL OFFICIAL] https://www.pib.gov.in/PressReleasePage.aspx?PRID=1855791 | ~85 MT from North Karanpura by FY25 | Production | All 5 | North Karanpura, CCL production, coal |
| 18 | Piparwar Area — Wikipedia + GEM Magadh | [REAL PUBLIC] https://en.wikipedia.org/wiki/Piparwar_Area · https://www.gem.wiki/Magadh_Coal_Mine | Geographic/company context for MINE-001/003 | Context | MINE-001/003 | Piparwar OCP, Ashoka, Ray-Bachra, Magadh, Chatra, Hazaribagh |

## How the corpus will be used (advisory only)

- **Recurrence panel** (demo scene 4): embed the hero circular + task text → nearest neighbours in
  the corpus/closed-obligation history → "similar slope-monitoring pattern closed late before".
- **Default-risk advisory** (demo scene 10): deterministic rule score over live workload; documents
  6-10 supply the cited context behind "why this matters".
- Deterministic fallback: keyword/cause-code overlap (pg_trgm style) returns the same seeded hits —
  the demo never depends on a live vector DB.

## Build note

For bundled PDFs, extract text with `pdftotext` at RAG-build time. For URL-only documents (9, 10, 13,
14, 16, 17, 18), download once and store next to the corpus with an attribution note before building
embeddings.

**Implemented tooling (backend/app/services/rag):** the corpus is mirrored in `corpus.py` and
indexed by `python -m app.services.rag.cli --rebuild` (from `backend/`; see
`backend/app/services/rag/README.md`). Extraction caches plain text under
`data/rag/text/<doc_id>.txt` — generated for every bundled PDF at first index, and the place to
*drop a plain-text copy of a URL-only document* so it becomes searchable. Scanned PDFs (e.g. the
hero Circular 02/2020, which has no text layer) are OCR'd automatically via `pdftoppm` + `tesseract`
when installed. Current coverage after `--rebuild`: 10/18 documents indexed (11 bundled PDFs, one of
which is the 412-page CCL Annual Report), 8 URL-only registered.
