# SAMAADHAN Demo — Data Pack (North Karanpura / Piparwar, Jharkhand)

> Demo source material for the five-mine story (MINE-001 Piparwar OCP anchor). **Nothing here is
> invented as official.** Every file/URL is classified below. Synthetic operational data is only
> ever used where the mine-internal record is not public, and every synthetic file is labelled.

## 1. Classification legend (used in every manifest)

| Class | Meaning | How it is labelled |
|---|---|---|
| **REAL OFFICIAL SOURCE** | Published by the government/PSU itself (DGMS, Ministry of Coal, CCL, Coal Controller, MoEFCC/PARIVESH) | `[REAL OFFICIAL]` + origin + URL in the manifest; file kept byte-identical |
| **REAL PUBLIC SOURCE** | Real, verifiable public material published by a third party (IELRC gazette mirror, news/analysis, Wikimedia Commons images) | `[REAL PUBLIC]` + origin + URL |
| **SYNTHETIC DEMO DATA** | Fabricated mine-internal operational values (attendance, daily production, PM10 logs) — **not real records** | File prefix `SYNTHETIC_`, header note, and `[SYNTHETIC DEMO DATA]` rows in manifests |

**Honesty rules (must never be broken):**
1. Never claim a synthetic record is real — the demo script and the app badges must say
   "SIMULATED / SYNTHETIC DEMO DATA" whenever a record could be mistaken for real.
2. Never invent a real government document. The app's internal ingest ref `DGMS/2026/TC-27` maps to
   the **real** DGMS(Tech) Circular No. 02 of 2020 (bundled below) — the ref is only a demo replica
   handle, and the replica must show it is derived from the real circular.
3. Real figures quoted on stage (2024 accident statistics, MSS action rates, CCL production) must be
   cited from the bundled documents listed in `rag/RAG_CORPUS.md`.

## 2. Folder map and full file manifest

```
data/
├── README.md                        this manifest [DOC]
├── regulatory/                      real national/statutory documents
│   ├── MANIFEST.md                  per-file listing [DOC]
│   ├── Coal_Mines_Regulations_2017_gazette_text.pdf                 2.0 MB [REAL PUBLIC] gazette text (IELRC mirror)
│   ├── Mines_Rules_1955_gazette_text.pdf                            0.2 MB [REAL PUBLIC] gazette text (IELRC mirror)
│   ├── Mines_Act_1952_official.pdf                                  0.6 MB [REAL OFFICIAL] DGMS-hosted
│   ├── DGMS_Tech_Circular_02_of_2020_Slope_Monitoring_OC.pdf        0.9 MB [REAL OFFICIAL]  ← hero instrument
│   ├── DGMS_Safety_Alert_23-2026_Kusmunda.pdf                       0.1 MB [REAL OFFICIAL] (copy of the repo's real PDF)
│   ├── DGMS_Annual_Report_2024.pdf                                  5.7 MB [REAL OFFICIAL]
│   ├── DGMS_National_Risk_Rating_Index.pdf                          0.7 MB [REAL OFFICIAL]
│   ├── MoC_PIB_Safety_Measures_Aug2023.pdf                          0.1 MB [REAL OFFICIAL]
│   └── CIL_BRSR_FY2024-25.pdf                                       0.9 MB [REAL OFFICIAL]
├── mine_documents/                  mine/company-level real documents
│   ├── MANIFEST.md                  per-file listing + URL-only refs [DOC]
│   └── CCL_Annual_Report_2024-25.pdf                                6.4 MB [REAL OFFICIAL] (412 pp, incl. area production & ops photos)
├── attendance/
│   ├── OFFICIAL_FORMAT.md           statutory basis + register template [DOC]
│   ├── README.md                    legend & column codes [DOC]
│   └── SYNTHETIC_attendance_NKP_2026-09-01-03.csv                    [SYNTHETIC DEMO DATA] (format per Mines Act 1952 s.48 / Mines Rules 1955)
├── production/
│   ├── MANIFEST.md                  real aggregate sources + synthetic note [DOC]
│   └── SYNTHETIC_daily_production_NKP_2026-09.csv                    [SYNTHETIC DEMO DATA]
├── safety/
│   └── MANIFEST.md                  hero circular mapping + synthetic thresholds note [DOC]
├── environment/
│   ├── MANIFEST.md                  EC/forest clearance refs [DOC]
│   └── SYNTHETIC_PM10_haulroad_PIP_2026-09.csv                       [SYNTHETIC DEMO DATA]
├── images/
│   ├── IMAGE_SOURCES.md             curated official/public image sources (no scraping) [DOC]
│   ├── CCL_AR_PHOTO_SCAN.md         photo-page scan of the CCL AR (verdict: no full-page HEMM plates) [DOC]
│   ├── ATTRIBUTION.md               per-file provenance of the extracted CCL photos below [DOC]
│   └── ccl-ar-*.jpg (18 files)      extracted photos/plates from CCL AR 2024-25 (~0.7 MB) [REAL OFFICIAL] — covers, front plates, captioned events, safety/environment/geology/CSR chapter photos (see ATTRIBUTION.md)
├── rag/
│   ├── RAG_CORPUS.md                top-18 RAG corpus with per-doc metadata [DOC]
│   └── text/                        generated plain-text cache (pdftotext/OCR output per doc) —
│                                    also the drop-in spot for URL-only doc text [derived; see backend/app/services/rag]
├── FIELD_EVIDENCE_SPEC.md           hero task evidence + digital form schema [DOC]
└── SMALLEST_DATASET.md              minimal authentic-looking demo dataset [DOC]
```

## 3. Verification performed

All bundled PDFs were fetched from the URLs in their manifests on 2026-09-06 and verified as PDF
documents (`pdfinfo`). Page counts: CMR 2017 text 122 pp · Mines Rules 1955 80 pp · Mines Act 1952
33 pp · DGMS AR 2024 135 pp · CCL AR 2024-25 412 pp · BRSR 57 pp · Circ. 02/2020 2 pp · Alert
23/2026 2 pp · NRRI 19 pp · MoC PIB 3 pp.

## 4. Instrument mapping (demo story → real source)

| In-app object | Real source document |
|---|---|
| Ingest replica `DGMS/2026/TC-27` "slope monitoring circular" | `regulatory/DGMS_Tech_Circular_02_of_2020_Slope_Monitoring_OC.pdf` |
| Statutory bases cited on tasks (CMR 2017, MR 1955, Mines Act 1952) | the three bundled regulation texts |
| 2024 accident claims in the demo script | `regulatory/DGMS_Annual_Report_2024.pdf` (Table 17) |
| "MSS alerts half-unactioned" claim | `rag/RAG_CORPUS.md` → The Wire (URL) |
| CCL / North Karanpura context & production | `mine_documents/CCL_Annual_Report_2024-25.pdf` |

## 5. Smallest dataset

See `SMALLEST_DATASET.md`. Core = 10 bundled PDFs + 2 synthetic CSVs + 1 attendance format note
(≈ 18 MB on disk).
