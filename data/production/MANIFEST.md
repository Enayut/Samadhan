# data/production — MANIFEST

## What is real (public, mine/area-level)

| Item | Class | URL | Content |
|---|---|---|---|
| CCL Annual Report 2024-25 (bundled in `mine_documents/`) | [REAL OFFICIAL] | https://d3u7ubx0okog7j.cloudfront.net/documents/CCL_Annual_Report_2024-25_Final_26.08.2025.pdf | Real CCL/area production, capex, mine profiles (Magadh, Piparwar area etc.). |
| Ministry of Coal — Production and Supplies | [REAL OFFICIAL] | https://coal.gov.in/major-statistics/production-and-supplies | Real national/company production figures (e.g., CIL, SCCL 2024-25). |
| Coal Controller — mine statistics register | [REAL OFFICIAL] | https://coalcontroller.gov.in/mine-statistics | Real per-mine register incl. CCL North Karanpura OC entries. |
| PIB (Aug 2022) — CCL North Karanpura outlook | [REAL OFFICIAL] | https://www.pib.gov.in/PressReleasePage.aspx?PRID=1855791 | "~85 MT of CCL's ~135 MT FY25 projection from North Karanpura." |
| CCL FY24-25 production (press) | [REAL PUBLIC] | https://newsriveting.com/central-coalfields-limited-sets-new-benchmark-in-fy-2024-25/ | CCL 87.5 MT FY24-25. |

> **Mine-level daily production (tonnes per shift) is NOT published.** Daily operational values below
> are therefore fabricated but **scale-calibrated to real public magnitudes** (Magadh is CCL's
> largest OC; Ashoka/Piparwar mid-scale; Ray-Bachra a small UG producer).

## Synthetic files

### `SYNTHETIC_daily_production_NKP_2026-09.csv` — [SYNTHETIC DEMO DATA]
Columns: `date, mine_id, mine_name, shift, coal_raised_tonnes, obr_cu_m, dragline_dump_trucks_operating, remarks`.
Purpose in demo: the platform's production-compliance view (weekly OBR report obligation) and the
"ingest production data" storyline. Every row is fabricated; nothing is a real CCL record.

## Real magnitude anchors used for calibration (for the presenter)

- CCL FY2024-25 total ≈ 87.5 MT (≈ 240 kt/day company-wide).
- Magadh OCP is among India's largest single OC mines (EC history at 20 MTPA and expanding).
- Daily synthetic values below are per-mine, per-shift approximations only.
