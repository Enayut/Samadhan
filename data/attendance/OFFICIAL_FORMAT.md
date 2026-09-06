# Attendance — Official Register Format (basis for the synthetic CSV)

## Legal basis (REAL OFFICIAL sources bundled in `data/regulatory/`)

| Instrument | Provision | What it requires |
|---|---|---|
| **The Mines Act, 1952** (`Mines_Act_1952_official.pdf`) | **s.48 — Register of persons employed**; s.47 hours of work | Every mine must keep, in the prescribed form and place, a register of all persons employed showing name, age, residence, and (for attendance) the hours of work; it must be available for inspection. |
| **The Mines Rules, 1955** (`Mines_Rules_1955_gazette_text.pdf`) | Registers & returns chapters (Form B muster/attendance register lineage; safety apparel; leave registers) | Prescribes the register **forms** coal mines must maintain — including the attendance/muster record signed by the responsible person (manager/overman/clerk), with IN/OUT per shift and daily hours. |
| **Coal Mines Regulations, 2017** (`Coal_Mines_Regulations_2017_gazette_text.pdf`) | Reg. on registers/returns & statutory inspections | Registers must be kept at the mine and countersigned; the demo's "register keeper / counter-signing supervisor" columns mirror this. |

## What a mine attendance / muster register actually records (template)

The register is a **daily, per-person, per-shift** record kept at the mine (pit-top / section office).
Its effective columns, per the statutory requirements and standard CCL practice, are:

| Register column | Meaning |
|---|---|
| Date | Shift date (GGG DD MMM YYYY) |
| Mine / Project | e.g., Piparwar OCP (CCL) |
| Section / Work location | Where the person was posted (bench, workshop, CHP, haul road, UG district) |
| Shift | I (06:00–14:00) / II (14:00–22:00) / III (22:00–06:00) / GS (general) |
| Employee ID (Token No.) | Per-person employment number (statutory) |
| Employee name | Full name |
| Occupation / Designation | e.g., HEMM Operator, Mining Sirdar, Shotfirer, Attendant |
| IN / OUT | Gate/register times per shift |
| Hours worked | Computed attendance hours |
| Status | P (present), A (absent), CL/EL/HD (leave codes), OT (overtime) |
| Remarks / Counter-sign | Overtime sanction, note, or supervisor initials |

The register is **kept by a designated record-keeper and counter-signed by the responsible
supervisor** — the demo's `register_keeper` and `status` columns preserve that structure.

## Template used for the synthetic CSV

`SYNTHETIC_attendance_NKP_2026-09-01-03.csv` follows the register columns above in CSV form:
`date,mine_id,mine_name,work_location,shift,employee_id,employee_name,occupation,in_time,out_time,hours_worked,attendance_status,remarks,register_keeper`.

## Labelling

The CSV is **SYNTHETIC DEMO DATA**: names, IDs and numbers are fabricated (format drawn from the
statutory registers above). It is never shown or stored as a real record.
