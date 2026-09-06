# data/images — IMAGE SOURCES (curated; no Google Image scraping)

> Images are used on stage and in the app UI. **Download manually at record time** and drop them into
> `data/images/` with an attribution note; only license-safe/public/official sources are listed.
> Prefer originals from the government/PSU.

## A. Extract frames from bundled OFFICIAL PDFs (zero external risk)
| Source file | What is inside |
|---|---|
| `../mine_documents/CCL_Annual_Report_2024-25.pdf` (412 pp) | Real photographs: CCL operations, opencast benches & HEMM fleets, Magadh/Amrapali area scenes, safety events, CSR/reclamation. **Best single image source.** |
| `../regulatory/DGMS_Annual_Report_2024.pdf` (135 pp) | Inspections, mine safety personnel, training scenes. |
| `../regulatory/DGMS_Tech_Circular_02_of_2020_Slope_Monitoring_OC.pdf` | Slope-monitoring/prism/survey illustrations (2 pp). |

**Already extracted (18 files — full inventory and per-file provenance in `ATTRIBUTION.md`;
photo-page scan in `CCL_AR_PHOTO_SCAN.md`):**
- Cover + front/rear plates: `ccl-ar-2024-25-cover-front.jpg` · `cover-back.jpg` · `plate-after-cover.jpg` · `vision-mission-plate.jpg` · `contents-plate.jpg` · `financial-statements-divider.jpg`
- Captioned event plates: `ccl-ar-event-security-training-centre.jpg` (PDF p.188) · `ccl-ar-event-hospital-foundation.jpg` (PDF p.6)
- Safety chapter: `ccl-ar-safety-chapter-photo-1..3.jpg` (PDF p.61) · environment events: `ccl-ar-2024-25-environment-event-photo-1..3.jpg` (PDF p.85) · geology field visits: `ccl-ar-2024-25-geology-field-visit-1..3.jpg` (PDF p.89) · CSR: `ccl-ar-csr-community-photo.jpg` (PDF p.148)

**Scan verdict (see `CCL_AR_PHOTO_SCAN.md`):** this report edition has **no dedicated full-page
opencast/HEMM plate**; chapter photos are ~300–340 px montage images. For guaranteed high-res
HEMM/bench shots, use §B/§C sources. For more in-report pages use `pdftoppm -jpeg -r 120 <pdf> <out>`
(whole page) or `pdfimages -j <pdf> <out>` (embedded JPEGs) and add a row to `ATTRIBUTION.md`.

## B. Official PSU / government galleries (open, screenshot or download with attribution)
| Subject | Source | URL |
|---|---|---|
| CCL (Central Coalfields Limited) media/photo gallery | CCL official site — look under **Media/Photo Gallery** (Ranchi) | https://www.centralcoalfields.in/ |
| Coal India Limited media | CIL official site — Media / Photo Gallery | https://www.coalindia.in/ |
| Ministry of Coal | Photo gallery & press-release images | https://coal.gov.in/ |
| PIB photo archive (mine visits, Coal India functions) | Press Information Bureau photo gallery search | https://pib.gov.in/indexd.aspx (use "Photo Gallery") |
| CMPDI | Company photo/news pages | https://www.cmpdi.co.in/ |
| DGMS | Site imagery/annual-report photos | https://www.dgms.gov.in/ |

## C. Wikimedia Commons (public/CC-licensed; verify each file's license)
Use the **search** pages below, pick files with CC-BY/CC-BY-SA/PD licenses, download with the
"Original file" link, and record author + license per file:
| Subject | Commons search URL |
|---|---|
| Piparwar / North Karanpura | https://commons.wikimedia.org/w/index.php?search=Piparwar |
| Central Coalfields / CCL mining | https://commons.wikimedia.org/w/index.php?search=%22Central+Coalfields%22+OR+CCL+coal |
| Open-cast coal mining India (HEMM, dumpers, draglines) | https://commons.wikimedia.org/w/index.php?search=opencast+coal+mine+India |
| Coal mining in Jharkhand category | https://commons.wikimedia.org/wiki/Category:Coal_mining_in_Jharkhand |
| HEMM / mining equipment | https://commons.wikimedia.org/w/index.php?search=HEMM+%22open+cast%22+dumper |
| Environmental/air monitoring stations | https://commons.wikimedia.org/w/index.php?search=ambient+air+quality+monitoring+station |

## D. Subject → required shot list (download 1 image each)
1. Piparwar/North Karanpura operations (mine-side) → app GIS header / monitor card.
2. Open-cast benches + HEMM fleet (dumpers/shovels) → evidence-capture placeholder art, demo opener.
3. Mine safety personnel / inspection (PPE, officer) → mobile profile scene, monitor "attention".
4. Slope/extensometer or survey prism on high-wall → hero task illustration.
5. Environmental monitoring (ambient station / water sprinkler on haul road) → dust-obligation art.
6. Coal handling plant / rail siding → production-domain art.

## E. Attribution + honesty rules
- Save as `data/images/<slug>.jpg` plus `data/images/ATTRIBUTION.md` recording **source, author,
  license, URL, download date** for every image.
- Images of real mines/people are used only as representative background/illustration. No image is
  presented as a live feed or as a photo captured by the demo's characters (evidence photos in the
  app are the existing SVG placeholders/simulated camera captures).
