import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import {
  createDemoStore,
  loadSeed,
  HERO_REJECTION_REASON,
} from "../shared/demo/store";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const cwd = process.cwd();

  app.use(express.json({ limit: "10mb" }));

  // -------------------------------------------------------------------------
  // DEMO API — deterministic in-memory demo state.
  // Both the desktop app and the mobile app (served at /mobile) consume these
  // endpoints, which is how the two frontends stay synchronized during the
  // SIH demo. The FastAPI + PostgreSQL backend (backend/app, :8000) exposes
  // the same routes and is preferred when reachable; this in-memory store is
  // the always-available fallback so the demo never breaks.
  // -------------------------------------------------------------------------
  const demoStore = createDemoStore(loadSeed());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/state", (req, res) => {
    res.json(demoStore.getState());
  });

  // Mobile-scoped state: only the Piparwar official's visible tasks
  // (PROPOSED never appears — manager must publish first).
  app.get("/api/mobile/state", (req, res) => {
    res.json(demoStore.getMobileState());
  });

  // Deterministic demo reset — the recording always starts from this state.
  app.post("/api/reset", (req, res) => {
    res.json(demoStore.reset());
  });

  // ---- Compliance document pipeline (ingest → AI extraction → rules) ----
  app.post("/api/documents/:id/process", (req, res) => {
    res.json(demoStore.processDocument(req.params.id));
  });

  app.post("/api/documents/:id/determine", (req, res) => {
    res.json(demoStore.determineApplicability(req.params.id));
  });

  // ---- Manager review & publish ----
  app.post("/api/tasks/:id/publish", (req, res) => {
    res.json(demoStore.publishTask(req.params.id, req.body || {}));
  });

  app.post("/api/tasks", (req, res) => {
    const { title, mineId, domain, severity, deadlineOffsetDays, ownerId, notes } = req.body || {};
    res.json(demoStore.createTask({ title, mineId, domain, severity, deadlineOffsetDays, ownerId, notes }));
  });

  // ---- Mobile field execution ----
  app.post("/api/tasks/:id/start", (req, res) => {
    res.json(demoStore.startTask(req.params.id));
  });

  app.post("/api/tasks/:id/draft", (req, res) => {
    const { evidenceItems = [], remediationNotes = "", formValues } = req.body || {};
    res.json(demoStore.saveDraft(req.params.id, evidenceItems, remediationNotes, formValues));
  });

  app.post("/api/tasks/:id/submit", (req, res) => {
    const { evidenceItems = [], remediationNotes = "", formValues } = req.body || {};
    res.json(demoStore.submitTask(req.params.id, evidenceItems, remediationNotes, formValues));
  });

  // ---- Regulatory verification ----
  app.post("/api/tasks/:id/reject", (req, res) => {
    const { evidenceId, reason } = req.body || {};
    res.json(demoStore.rejectEvidence(req.params.id, evidenceId, reason ?? HERO_REJECTION_REASON));
  });

  app.post("/api/tasks/:id/resubmit", (req, res) => {
    const { evidenceItems, remediationNotes, formValues } = req.body || {};
    res.json(demoStore.resubmitTask(req.params.id, evidenceItems, remediationNotes, formValues));
  });

  app.post("/api/tasks/:id/approve", (req, res) => {
    res.json(demoStore.approveTask(req.params.id));
  });

  // ---- Recurring compliance scheduler (idempotent) ----
  app.post("/api/scheduler/tick", (req, res) => {
    res.json(demoStore.schedulerTick());
  });

  // ---- RAG advisory proxy (FastAPI backend on :8000; graceful fallback) ----
  // The retrieval layer is advisory only — rules and human verification decide
  // compliance. When the FastAPI backend is unreachable the UI shows a clear
  // "backend offline" message instead of fake data.
  const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";
  const ragProxy = async (req: any, res: any, path: string, init?: RequestInit, timeoutMs = 2500) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const resp = await fetch(`${BACKEND}${path}`, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      const data = await resp.json();
      res.status(resp.status).json(data);
    } catch {
      res.status(503).json({
        error: "backend_offline",
        detail:
          "SAMAADHAN retrieval backend (FastAPI + RAG) is not reachable on " +
          BACKEND +
          ". Start it with: cd backend && python backend.py",
        disclaimer: "Advisory only — retrieval requires the backend service.",
      });
    }
  };

  app.get("/api/rag/status", (req, res) => ragProxy(req, res, "/api/rag/status"));
  app.get("/api/rag/search", (req, res) => {
    const q = encodeURIComponent(String(req.query.q ?? ""));
    const topK = Number(req.query.top_k ?? 6);
    const mineId = req.query.mine_id ? `&mine_id=${encodeURIComponent(String(req.query.mine_id))}` : "";
    ragProxy(req, res, `/api/rag/search?q=${q}&top_k=${topK}${mineId}`);
  });
  // One-time corpus indexing (real bundled PDFs/text) — long timeout: the
  // ingestion extracts and embeds the whole corpus.
  app.post("/api/rag/ingest", (req, res) =>
    ragProxy(
      req,
      res,
      "/api/rag/ingest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body ?? {}),
      },
      300000,
    ),
  );

  // -------------------------------------------------------------------------
  // MOBILE APP — served from the same origin so both apps share demo state.
  // Build it first: `cd mobile && npm run build` (or `npm run demo` at root).
  // -------------------------------------------------------------------------
  const mobileDist = path.join(cwd, "..", "mobile", "dist");
  const mobileIndex = path.join(mobileDist, "index.html");

  if (fs.existsSync(mobileIndex)) {
    app.use("/mobile", express.static(mobileDist));
    app.get("/mobile/*", (req, res) => {
      res.sendFile(mobileIndex);
    });
  } else {
    // Dev convenience: tell the presenter to build the mobile app.
    app.get("/mobile", (req, res) => {
      res
        .status(503)
        .send(
          '<html><body style="font-family:sans-serif;background:#12161A;color:#FAF8F3;padding:40px"><h2>SAMAADHAN Demo</h2><p>The mobile app has not been built yet. Run <code style="color:#F2A93B">npm run demo</code> at the repository root (builds mobile, then starts this server), or run <code style="color:#F2A93B">cd mobile &amp;&amp; npm run build</code> first.</p></body></html>',
        );
    });
  }

  // -------------------------------------------------------------------------
  // Real bundled regulatory PDFs (client/public/pdf) + Vite middleware for the
  // desktop app (development).
  // -------------------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(cwd, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SAMAADHAN demo server on http://localhost:${PORT}`);
    console.log(`  Desktop:  http://localhost:${PORT}/`);
    console.log(`  Mobile:   http://localhost:${PORT}/mobile`);
    console.log(`  State:    http://localhost:${PORT}/api/state`);
    console.log(`  Reset:    POST http://localhost:${PORT}/api/reset`);
  });
}

startServer();
