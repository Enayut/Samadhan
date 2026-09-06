How to run the demo

1. One-time setup

```bash
# Frontend deps
cd client && npm install && cd ..
cd mobile && npm install && cd ..
 
# Backend (Python 3.12+)
cd backend && pip install -r requirements.txt && cd ..
```
2. Start everything (the normal demo path)

```bash
npm run demo
```

This builds the mobile app, then starts the demo server. Wait for:

SAMAADHAN demo server on http://localhost:3000
  Desktop:  http://localhost:3000/
  Mobile:   http://localhost:3000/mobile

Open both in two browser windows side-by-side:
- Desktop (manager/regulator): http://localhost:3000
- Mobile (mine official): http://localhost:3000/mobile (use browser dev-tools phone view, F12 → device toolbar)

3. Always reset before recording

```bash
npm run demo:reset
```

or click the ↺ Reset button in the desktop topbar. The recording must always start from the same state (5 mines · 8 tasks · hero = PROPOSED).

4. (Optional, for the RAG "Relevant Regulations" panel)

```bash
cd backend
DATABASE_URL="sqlite+aiosqlite:///./samaadhan_demo.db" python3 backend.py
```

Then index the real corpus once (~30 s):

```bash
curl -X POST http://localhost:3000/api/rag/ingest -H 'Content-Type: application/json' -d '{}'
```

Without the backend, everything else still works — the RAG panel just shows an honest "retrieval offline" message.

5. The 3-minute demo walkthrough

1. Desktop → reset → Dashboard shows the five-mine monitor
2. Click Piparwar OCP → mine detail + live GIS
3. Compliance Ingest → open Circular 02/2020 → Extract requirements → Apply compliance rules
4. Manager Review → Review & publish the slope-monitoring task
5. Mobile → task appears within ~3 s → Start Task → fill the form → capture evidence → Submit
6. Desktop → status flips to Awaiting Verification
7. Switch persona (topbar) to Regulatory Official → open task → Reject item… with a reason
8. Mobile → ACTION REQUIRED banner → retake photo → resubmit
9. Regulatory Official → Approve & close → verified closure record
10. Desktop updates to VERIFIED → open Relevant Regulations → real DGMS passages → end on the GIS

Quick health checks

```bash
curl localhost:3000/api/health          # demo server
curl localhost:3000/api/state | head    # shared state
bash scripts/verify-demo.sh             # full self-test (starts/stops everything)
```