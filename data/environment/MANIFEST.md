# data/environment — MANIFEST

## Real mine-specific environmental documents (public)

| Item | Class | URL | Mine |
|---|---|---|---|
| Amrapali OCP Expansion Phase-I (25 MTPA) project report — environmental clearance portal | [REAL OFFICIAL] | https://environmentclearance.nic.in/DownloadPfdFile.aspx?FileName=3gL0Jc2zbttDCveCQH6/TrLaDtweAYQn62pz5EA25iVayUeF7WGszLwNkvWDijJvOexKDyovb0nqbTtojjWnBQ1F/XGKMGcJzQCn+f2U5JM=&FilePath=93ZZBm8LWEXfg+HAlQix2fE2t8z/pgnoBhDlYdZCxzWF1OLE6RXe5MiAhSH8vdQ1 | MINE-005 |
| Ashok OCP expansion project report — forest clearance portal | [REAL OFFICIAL] | https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=61119123512167I0Q0AshokExpansionProjectReport.pdf&FilePath=../writereaddata/FormA/Miningletter/ | MINE-002 |
| CCL Environment & Forest page — EC list & six-monthly compliance reports | [REAL OFFICIAL] | https://www.centralcoalfields.in/sutbs/envrfrst.php | all |
| CCL environment/remote-sensing monitoring page (Ashok & Piparwar OCP named) | [REAL OFFICIAL] | https://www.centralcoalfields.in/sutbs/envirm.php | MINE-001/002 |
| PARIVESH portal (EC/FC search) | [REAL OFFICIAL] | https://parivesh.nic.in/ | all |
| Magadh Coal Mine — Global Energy Monitor (EC history) | [REAL PUBLIC] | https://www.gem.wiki/Magadh_Coal_Mine | MINE-003 |
| Magadh/Amrapali context — Wikipedia Amrapali & Chandragupta Area | [REAL PUBLIC] | https://en.wikipedia.org/wiki/Amrapali_%26_Chandragupta_Area | MINE-003/005 |

> Real mine-level *air quality sensor logs* are not published. The PM10 log below is synthetic but
> mirrors the statutory EC condition: **24-hr PM10 ≤ 100 µg/m³** at haul-road ambient stations
> (EC Condition 14-style dust-suppression conditions), consistent with the demo's dust-obligation.

## Synthetic files

### `SYNTHETIC_PM10_haulroad_PIP_2026-09.csv` — [SYNTHETIC DEMO DATA]
Columns: `date, station_id, station_location, mine_id, pm10_24h_ugm3, standard_ugm3, status`.
Purpose: background for the dust-suppression obligation (MINE-002 supporting cast) and to show
sensor-style exceedances feeding the platform's environment domain. Fabricated readings only.
