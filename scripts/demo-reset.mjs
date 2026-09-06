#!/usr/bin/env node
// Deterministic demo reset — POST /api/reset on the demo server (and, when
// reachable, on the FastAPI backend), so a recording always begins from the
// exact same five-mine state.
//
// Usage: npm run demo:reset   (DEMO_URL / BACKEND_URL env vars override targets)

const DEMO_URL = process.env.DEMO_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function reset(base, label) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${base}/api/reset`, { method: 'POST', signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const state = await res.json();
    const mines = (state.sites ?? []).length;
    const tasks = (state.tasks ?? []).length;
    const docs = (state.pipeline?.documents ?? []).length;
    console.log(`✓ ${label} reset: ${mines} mines · ${tasks} tasks · ${docs} compliance documents`);
    return true;
  } catch {
    console.log(`· ${label} (${base}) not reachable — skipped`);
    return false;
  }
}

const demoOk = await reset(DEMO_URL, 'Demo server (in-memory state)');
if (!process.env.NO_BACKEND) await reset(BACKEND_URL, 'FastAPI backend (PostgreSQL)');

if (!demoOk) {
  console.log('\nStart the demo first:  npm run demo   (then re-run npm run demo:reset)');
  process.exit(1);
}
console.log('\nDemo state reset — the recording can begin from a known state.');
