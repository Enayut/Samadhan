# data/images — ATTRIBUTION (extracted CCL Annual Report 2024-25 plates)

> The 18 JPG files below were **extracted with `pdfimages` from the bundled official report**
> `../mine_documents/CCL_Annual_Report_2024-25.pdf` on 2026-09-06 (byte-identical embedded JPEGs,
> native resolution, no re-encode). Source: Central Coalfields Limited, *Annual Report & Accounts
> 2024-25* — an official CCL publication. Report PDF source URL as recorded in
> `../mine_documents/MANIFEST.md` (CCL official investor/annual-report page, Ranchi).
>
> **Usage rule (from IMAGE_SOURCES.md §E):** these images show real CCL sites/people and are used
> only as representative background/illustration in the demo and on stage. No extracted image is ever
> presented as a live feed or as a photo captured by the demo's characters; evidence photos inside the
> app remain the simulated camera/SVG placeholders.

## File → provenance table

| File | Size | Source page (PDF) | Page context / caption text in the report |
|---|---|---|---|
| `ccl-ar-2024-25-cover-front.jpg` | 107 KB · 817×1057 | PDF p.1 | **Front cover** photographic plate of the CCL Annual Report & Accounts 2024-25 (full-page artwork). |
| `ccl-ar-2024-25-cover-back.jpg` | 79 KB · 817×1057 | PDF p.412 | **Back cover** photographic plate (full-page artwork). |
| `ccl-ar-safety-chapter-photo-1.jpg` | 17 KB · 309×237 | PDF p.61 | Photograph inside CCL's **Safety chapter** (page discusses Roko-Toko Abhiyaan, Nukkad Natak awareness campaigns, Safety Counselling & Family Counselling, Mine Safety Awards 2024). |
| `ccl-ar-safety-chapter-photo-2.jpg` | 17 KB · 315×233 | PDF p.61 | Same Safety chapter plate as above (second photo). |
| `ccl-ar-safety-chapter-photo-3.jpg` | 19 KB · 314×229 | PDF p.61 | Same Safety chapter plate as above (third photo). |
| `ccl-ar-event-security-training-centre.jpg` | 51 KB · 720×403 | PDF p.188 | Captioned photo plate: *"Inauguration of Security Training Centre at Gandhi Nagar, Ranchi by Shri G. Kishan Reddy, Hon'ble Union Minister of Coal & Mines, Govt. of India."* |
| `ccl-ar-event-hospital-foundation.jpg` | 37 KB · 697×460 | PDF p.6 | Captioned photo plate: *"Laying of Foundation stone of 200 Multi Speciality Hospital at Gandhi Nagar, Ranchi by Shri G. Kishan Reddy, Hon'ble Union Minister of Coal & Mines, Govt. of India."* |
| `ccl-ar-csr-community-photo.jpg` | 56 KB · 822×511 | PDF p.148 | Photograph on the CSR chapter spread (community/school/infrastructure initiatives narrative on the same page). |
| `ccl-ar-2024-25-plate-after-cover.jpg` | 61 KB · 819×1059 | PDF p.3 | **Full-page plate** directly after the front cover (page has no text layer — official CCL artwork/photo plate). |
| `ccl-ar-2024-25-vision-mission-plate.jpg` | 69 KB · 819×1059 | PDF p.4 | **Full-page plate** behind the "OUR VISION / OUR MISSION" text page of the report. |
| `ccl-ar-2024-25-contents-plate.jpg` | 68 KB · 816×1060 | PDF p.5 | Large plate on the **Contents** page of the report (under the contents list). |
| `ccl-ar-2024-25-financial-statements-divider.jpg` | 51 KB · 818×1057 | PDF p.189 | **Full-page section-divider plate** opening the "FINANCIAL STATEMENTS" part (printed alongside the Independent Auditor's Report section). |
| `ccl-ar-2024-25-environment-event-photo-1..3.jpg` | 10–18 KB · up to 336×233 | PDF p.85 | Photographs under the printed caption **"Glimpses of Celebration of 'एक पेड़ मां के नाम' at Central Coalfields Limited on 25.07.24 and on 23.09.2024"** (Vriksharopan Abhiyan 2024, launched by Hon'ble Union Minister of Coal & Mines Shri G. Kishan Reddy on 25.07.24). |
| `ccl-ar-2024-25-geology-field-visit-1..3.jpg` | 9–17 KB · up to 342×234 | PDF p.89 | Photographs on the **Geology/exploration** page (page text covers the Geology Department's exploration work, joint borehole measurements with CMPDI, borehole-grid monitoring, and geophysical logging of 10 boreholes in the Deonad-1 Block, North Karanpura Coalfield — field/exploration imagery). |

## Honesty notes

1. **Captions**: rows marked "Captioned photo plate" reproduce the *printed caption* from the report
   itself. Rows marked "Photograph inside … chapter" describe only *which chapter the page belongs
   to* (from the page's text layer) — the specific subject of each small photo has not been
   individually verified and should not be asserted on stage.
2. **Cover plates** are official CCL artwork; treat as a branded "source: CCL Annual Report 2024-25"
   visual, not as evidence of any specific mine.
3. **No licence to re-distribute** is implied beyond demo/reporting use with attribution to CCL.
   Keep this file beside the JPGs.
4. If a slide/app shot needs a **guaranteed opencast-bench/HEMM operation photo**, download a
   CC-licensed Commons image per `IMAGE_SOURCES.md` §C, or screenshot a captioned CCL gallery photo
   (§B) and add its row to this table.

## Regeneration command (if the PDF or a page changes)

```bash
mkdir -p /tmp/cclimgs && cd /tmp/cclimgs
pdfimages -f 1   -l 1   -j ../data/mine_documents/CCL_Annual_Report_2024-25.pdf cover        # p.1 front cover
pdfimages -f 3   -l 5   -j ../data/mine_documents/CCL_Annual_Report_2024-25.pdf frontmatter  # p.3/4/5 plates
pdfimages -f 6   -l 6   -j ../data/mine_documents/CCL_Annual_Report_2024-25.pdf event6       # hospital foundation
pdfimages -f 61  -l 61  -j ../data/mine_documents/CCL_Annual_Report_2024-25.pdf safety       # safety chapter photos
pdfimages -f 85  -l 85  -j ../data/mine_documents/CCL_Annual_Report_2024-25.pdf env85        # tree-plantation glimpses
pdfimages -f 89  -l 89  -j ../data/mine_documents/CCL_Annual_Report_2024-25.pdf geo89        # geology page photos
pdfimages -f 148 -l 148 -j ../data/mine_documents/CCL_Annual_Report_2024-25.pdf csr          # CSR spread photo
pdfimages -f 188 -l 188 -j ../data/mine_documents/CCL_Annual_Report_2024-25.pdf event188     # security training centre
pdfimages -f 189 -l 189 -j ../data/mine_documents/CCL_Annual_Report_2024-25.pdf div189       # financials divider
pdfimages -f 412 -l 412 -j ../data/mine_documents/CCL_Annual_Report_2024-25.pdf back         # back cover
```
