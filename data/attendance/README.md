# data/attendance — README

## Files
| File | Class | Description |
|---|---|---|
| `OFFICIAL_FORMAT.md` | [DOC] | Statutory basis (Mines Act 1952 s.48; Mines Rules 1955; CMR 2017) and the register template the CSV follows. |
| `SYNTHETIC_attendance_NKP_2026-09-01-03.csv` | [SYNTHETIC DEMO DATA] | 29 fabricated attendance rows across the five mines (2026-09-01 → 03). Not real employee records. |

## Column codes used in the CSV
- `shift`: I (06:00–14:00) · II (14:00–22:00) · III (22:00–06:00)
- `attendance_status`: `P` present · `A` absent · `OT` overtime sanctioned (status column carries `OT`, remarks note sanction)
- `hours_worked`: decimal hours between IN and OUT (shift-corrected)
- `register_keeper`: the person who maintains the register (clerk/overman) — mirrors the statutory "register kept by a responsible person"
- `remarks`: operational note; each row's remarks end with `SYNT` to make the synthetic nature machine-checkable

## Use in the demo
- The register page is the **optional third attachment** type for field evidence
  (see `../FIELD_EVIDENCE_SPEC.md` §4).
- It also feeds the "attendance logs enter the platform" ingest story (new obligation class:
  repeated absenteeism / PPE-duty rosters). Present it as **synthetic sample data**, never as a real
  CCL attendance record.
