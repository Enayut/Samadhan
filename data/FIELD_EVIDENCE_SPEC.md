# FIELD EVIDENCE SPEC — Hero task (Weekly Slope-Displacement Monitoring, Bench 3B, EX-07)

## Task (from DEMO_FLOW.md)
Weekly slope-displacement monitoring at **Bench 3B high-wall, Piparwar OCP (MINE-001)** — derived from
**DGMS(Tech) Circular No. 02 of 2020** (real PDF in `data/regulatory/`). Owner: Ram Singh (Mine
Safety Officer, MSO-402). Verifier: Regulatory Official (≠ owner).

## What the mobile app captures (required by submission gate)

### 1. Digital form (slope monitoring sheet — completed in-app before photos)
JSON shape stored with the submission:

```json
{
  "form_id": "SLP-2026-09-03-001",
  "obligation_ref": "OBL-SLOPE-WEEKLY",
  "task_id": "TASK-SLOPE-WK-2026-W36",
  "mine": { "id": "MINE-001", "name": "Piparwar OCP" },
  "location": { "name": "Bench 3B High-wall", "zone_id": "ZONE-PIT-ACTIVE",
                "lat": 23.6952, "lng": 85.0598 },
  "instrument": { "id": "EX-07", "type": "MPBX/Extensometer" },
  "reading": { "value_mm_per_24h": 1.9, "threshold_mm_per_24h": 2.5, "within_limit": true },
  "observations": "Crest intact; no new tension cracks on Bench 3B.",
  "performed_by": { "name": "Ram Singh", "id": "MSO-402" },
  "performed_at": "2026-09-03T07:40:00+05:30"
}
```

### 2. Photo artifacts (each bound to a checklist item)
| Item | Type | Guidance shown on phone | Required metadata (server-validated) |
|---|---|---|---|
| Extensometer reading sheet (weekly log EX-07) | photo of register/log | "Signed weekly reading sheet with displacement noted vs 2.5 mm/day threshold" | captured_at (device), gps (23.6952±, 85.0598± inside boundary), sha256 (server-sealed), file name/size |
| Bench 3B crest photo | photo | "Crest showing berm markers and crack gauge in frame" | captured_at, gps, sha256, file name/size |

Each artifact record:
```json
{
  "artifact_id": "art-…",
  "item_ref": "ev-1 | ev-2",
  "type": "photo",
  "captured_at": "ISO-8601 +05:30",
  "gps": "23.6952° N, 85.0598° E",
  "sha256": "server-sealed",
  "file": "IMG_….jpg"
}
```

### 3. Field remarks (free text, ≥ 15 chars) — appended to the form's observations.

### 4. Optional supporting attachment — attendance/register document
Per DEMO_FLOW the officer may attach the **shift attendance/muster page** (synthetic register in
`data/attendance/`) as a third, optional document item to prove presence — mirrors the register
photo evidence type used in compliance practice.

## Verification semantics
- Submission is **blocked** until items 1–2 (form + both photos + remarks) are complete.
- Verifier may reject **one item with a reason** (hero rejection: crest photo timestamp/visibility);
  the task returns to the officer with that item flagged; officer re-captures and resubmits.
- On approval, the closure record stores the form JSON + artifact hashes + both identities.

## Where data comes from in the pack
- Reading values / instrument identity: **synthetic** (see `safety/MANIFEST.md`) — badge in-app.
- Format inspiration: statutory registers (Mines Rules 1955) + Circular 02/2020 monitoring intent.
- The synthetic attendance register (`data/attendance/`) is the reference for the optional attachment.
