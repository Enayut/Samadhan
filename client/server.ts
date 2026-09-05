import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createDemoStore, loadSeed } from "../shared/demo/store";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const cwd = process.cwd();

  app.use(express.json());

  // -------------------------------------------------------------------------
  // DEMO API — deterministic in-memory demo state.
  // Both the desktop app and the mobile app (served at /mobile) consume these
  // endpoints, which is how the two frontends stay synchronized during the
  // SIH demo. A future FastAPI backend would expose the same routes.
  // -------------------------------------------------------------------------
  const demoStore = createDemoStore(loadSeed());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/demo/state", (req, res) => {
    res.json(demoStore.getState());
  });

  app.post("/api/demo/reset", (req, res) => {
    res.json(demoStore.reset());
  });

  app.post("/api/demo/alert/process", (req, res) => {
    res.json(demoStore.processAlert(req.body?.alertId));
  });

  app.post("/api/demo/alert/confirm", (req, res) => {
    res.json(demoStore.confirmExtraction(req.body?.alertId));
  });

  app.post("/api/demo/tasks/:id/draft", (req, res) => {
    const { evidenceItems = [], remediationNotes = "" } = req.body || {};
    res.json(demoStore.saveDraft(req.params.id, evidenceItems, remediationNotes));
  });

  app.post("/api/demo/tasks/:id/submit", (req, res) => {
    const { evidenceItems = [], remediationNotes = "" } = req.body || {};
    res.json(demoStore.submitTask(req.params.id, evidenceItems, remediationNotes));
  });

  app.post("/api/demo/tasks/:id/reject", (req, res) => {
    const { evidenceId, reason } = req.body || {};
    res.json(demoStore.rejectEvidence(req.params.id, evidenceId, reason));
  });

  app.post("/api/demo/tasks/:id/resubmit", (req, res) => {
    res.json(demoStore.resubmitTask(req.params.id));
  });

  app.post("/api/demo/tasks/:id/approve", (req, res) => {
    res.json(demoStore.approveTask(req.params.id));
  });

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
  // Vite middleware for the desktop app (development)
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
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`  Desktop:  http://localhost:${PORT}/`);
    console.log(`  Mobile:   http://localhost:${PORT}/mobile`);
    console.log(`  Demo API: http://localhost:${PORT}/api/demo/state`);
  });
}

startServer();