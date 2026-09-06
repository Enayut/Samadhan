# SMALLEST DATASET — that makes the demo look authentic

> Goal: under ~20 MB of committed files that give the demo **provable realism** with zero invented
> official records. Everything below is already in the pack except the optional extras listed at the end.

## Core (commit now — ~18.5 MB total)
| File | MB | Why it is the floor |
|---|---|---|
| `regulatory/DGMS_Tech_Circular_02_of_2020_Slope_Monitoring_OC.pdf` | 0.9 | Hero instrument — shown in the intake viewer. **Cannot drop.** |
| `regulatory/Coal_Mines_Regulations_2017_gazette_text.pdf` | 2.0 | Every task citation (CMR 2017) is verifiable. **Cannot drop.** |
| `regulatory/DGMS_Safety_Alert_23-2026_Kusmunda.pdf` | 0.1 | Real PDF example for the intake background scene. Keep (tiny). |
| `regulatory/DGMS_Annual_Report_2024.pdf` | 5.7 | Table 17 — the 2024 accident claim is checkable on stage. Keep. |
| `regulatory/Mines_Act_1952_official.pdf` + `Mines_Rules_1955_gazette_text.pdf` | 0.8 | Attendance/register legal basis. Keep (small). |
| `regulatory/DGMS_National_Risk_Rating_Index.pdf` | 0.7 | Risk-analytics alignment claim. Keep (small). |
| `regulatory/MoC_PIB_Safety_Measures_Aug2023.pdf` | 0.1 | CSIS "records, doesn't enforce" proof. Keep (tiny). |
| `regulatory/CIL_BRSR_FY2024-25.pdf` | 0.9 | Reporting-backbone claim. Keep (small). |
| `mine_documents/CCL_Annual_Report_2024-25.pdf` | 6.4 | The operator's own report: area production, safety, and hundreds of usable operation photos. **Keep** (largest single file; optional if repo size is tight, but it is the best mine-level real anchor). |
| Synthetic CSVs (`attendance`, `production`, `environment`) | <0.01 | 3 small files make the mobile/dashboard screens feel like a live operation. Keep. |

**Drop list if repo size is critical:** first drop `CCL_Annual_Report_2024-25.pdf` (6.4 MB → 11.5 MB
pack) and keep only its URL; next drop `DGMS_Annual_Report_2024.pdf` (→ 5.8 MB) and cite Table 17 by
URL. Do **not** drop Circular 02/2020, CMR 2017, or the synthetic CSVs.

## Optional (add at record time)
| Item | Why |
|---|---|
| 5–6 further official/Commons images (see `images/IMAGE_SOURCES.md`) | Monitor cards, GIS header, intake art — optional; **18 zero-risk photos/plates are already extracted** from the bundled CCL AR into `images/` (~0.7 MB; provenance in `ATTRIBUTION.md`, photo-page scan in `CCL_AR_PHOTO_SCAN.md`) |
| Text extractions of the RAG corpus (`rag/RAG_CORPUS.md` tier 2 URL docs) | Only needed when P5 (RAG) is built |
| EC project report PDFs for Amrapali/Ashok (URL-only today) | Only if an EC document must be opened on stage |

## Coverage check — every demo scene has a real file behind it
| Scene | Real anchor file |
|---|---|
| 1 (reality, 2024 stats) | DGMS AR 2024 (Table 17) · The Wire URL · MoC PIB (CSIS) |
| 3 (ingest) | DGMS(Tech) Circ. 02/2020 (real PDF in viewer) |
| 5–7 (hero task + evidence) | Circ. 02/2020 + `FIELD_EVIDENCE_SPEC.md` + synthetic attendance CSV |
| 9 (GIS/monitor) | CCL AR 2024-25 (photos, area context) + image pack |
| 10 (advisory) | NRRI PDF + RAG corpus docs 6–10 |

## Honesty summary
- **REAL OFFICIAL:** 8 files · **REAL PUBLIC:** 2 files (gazette texts via IELRC) · **SYNTHETIC:** 3
  CSVs + in-app reading values (all labelled). No file pretends to be something it is not.
