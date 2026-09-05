import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store/AppContext';
import { demoApi } from '../services/demoApi';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  ShieldQuestion,
  Loader2,
  FileText,
  Sparkles,
  Map,
  ArrowRight,
  History,
  Radar,
  Clock,
  ScanLine,
  ChevronRight,
  Inbox,
} from 'lucide-react';

// Deterministic stage delays (ms) for the simulated AI pipeline.
const STAGE_DELAYS = [900, 1100, 900, 800, 700];

type Phase = 'idle' | 'processing' | 'extracted' | 'confirming' | 'confirmed';

type Extraction = {
  pipelineStages: Array<{ label: string; detail: string }>;
  sourceRef: string;
  alertNo: string;
  fields: Array<{
    key: string;
    label: string;
    value: string;
    badge: 'CONFIRMED_FROM_SOURCE' | 'AI_INFERENCE' | 'REQUIRES_CONFIRMATION';
    citation: string;
    note: string;
  }>;
};

type Recurrence = {
  searched: number;
  matched: number;
  badge: string;
  items: Array<{ mineId: string; year: number; title: string; closure: string }>;
  suggestion: string;
  searchStages: string[];
};

type Fanout = {
  affected: number;
  filteredOut: number;
  governanceObjects: number;
  totalMines: number;
  pins: { green: number; amber: number; red: number };
  summary: string;
  generationStages: string[];
  mineTasks: Record<string, string[]>;
};

// ---------------------------------------------------------------------------
// Alert source metadata — where each alert originates, grounded in the real
// Indian mining ecosystem (DGMS portal, CIL CSIS feed, mine telemetry, CMSMS
// satellite, EC/pollution-board conditions).
// ---------------------------------------------------------------------------

const SOURCE_META: Record<string, { short: string; cls: string; origin: string }> = {
  DGMS: {
    short: 'DGMS',
    cls: 'bg-[#C1502E]/10 text-[#C1502E] border-[#C1502E]/25',
    origin: 'Directorate General of Mines Safety portal — numbered safety alerts & technical circulars (CMR 2017 · MMR 1961)',
  },
  CSIS: {
    short: 'CSIS',
    cls: 'bg-steel/10 text-steel border-steel/25',
    origin: 'CIL Safety Information System — centralized safety-parameter feed',
  },
  SENSOR: {
    short: 'SENSOR',
    cls: 'bg-[#A93226]/10 text-[#A93226] border-[#A93226]/25',
    origin: 'Mine telemetry — slope-stability radar · gas · strata extensometers',
  },
  CMSMS: {
    short: 'CMSMS',
    cls: 'bg-verdant/10 text-verdant border-verdant/25',
    origin: 'Coal Mine Surveillance & Management System — satellite monitoring',
  },
  EC: {
    short: 'EC',
    cls: 'bg-safety-amber/10 text-safety-amber border-safety-amber/30',
    origin: 'Environmental Clearance conditions / State Pollution Control Board',
  },
  AUDIT: {
    short: 'AUDIT',
    cls: 'bg-anthracite-100 text-anthracite-800 border-anthracite-800/20',
    origin: 'DGMS audit findings · Safety Committee minutes',
  },
  GRIEVANCE: {
    short: 'GRIEVANCE',
    cls: 'bg-anthracite-100 text-anthracite-800 border-anthracite-800/20',
    origin: 'Joint Consultative Committee grievance register',
  },
};

const SEVERITY_DOT: Record<string, string> = {
  Critical: 'bg-[#C1502E]',
  High: 'bg-safety-amber',
  Medium: 'bg-steel',
  Low: 'bg-verdant',
};

const ALERT_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  received: { label: 'Received', cls: 'bg-steel/10 text-steel border-steel/25' },
  processed: { label: 'AI Review', cls: 'bg-safety-amber/10 text-safety-amber border-safety-amber/30' },
  confirmed: { label: 'Fanned out', cls: 'bg-verdant/10 text-verdant border-verdant/25' },
};

function SourceChip({ source }: { source?: string }) {
  const meta = (source && SOURCE_META[source]) || SOURCE_META.AUDIT;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${meta.cls}`}
      title={meta.origin}
    >
      {meta.short}
    </span>
  );
}

/** A pill on the AI-usage strip: blue = AI engine, neutral = deterministic/human. */
function EnginePill({ label, detail, ai }: { label: string; detail: string; ai: boolean }) {
  return (
    <span
      title={detail}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-bold whitespace-nowrap ${
        ai
          ? 'bg-steel/10 text-steel border-steel/25'
          : 'bg-anthracite-100 text-anthracite-800 border-anthracite-800/15'
      }`}
    >
      {label}
      <span className="font-medium normal-case text-anthracite-800/60 hidden xl:inline">· {detail}</span>
    </span>
  );
}

function Badge({ badge }: { badge: Extraction['fields'][number]['badge'] }) {
  if (badge === 'CONFIRMED_FROM_SOURCE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-verdant/10 text-verdant border border-verdant/25 uppercase tracking-wider">
        <CheckCircle2 size={11} /> Confirmed from source
      </span>
    );
  }
  if (badge === 'AI_INFERENCE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-safety-amber/10 text-safety-amber border border-safety-amber/30 uppercase tracking-wider">
        <Sparkles size={11} /> AI Inference
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-paper-100 text-anthracite-800 border border-anthracite-800/20 uppercase tracking-wider">
      <ShieldQuestion size={11} /> Requires confirmation
    </span>
  );
}

/** Animates a fixed list of stages with deterministic delays, then calls onDone. */
function StagedLoader({
  stages,
  label,
  onDone,
}: {
  stages: string[];
  label: string;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIndex(0);
    timerRef.current = setTimeout(function tick() {
      setIndex((i) => {
        if (i >= stages.length - 1) {
          return i;
        }
        timerRef.current = setTimeout(tick, 750);
        return i + 1;
      });
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (index === stages.length - 1) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div className="space-y-2.5">
      <div className="text-xs font-bold text-anthracite-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <Radar size={13} className="text-steel" /> {label}
      </div>
      {stages.map((stage, i) => (
        <div
          key={stage}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm transition-all ${
            i < index
              ? 'bg-verdant/5 border-verdant/20 text-anthracite-800/60'
              : i === index
                ? 'bg-white border-steel/30 text-anthracite-950 shadow-sm'
                : 'bg-paper-50 border-paper-100 text-anthracite-800/40'
          }`}
        >
          {i < index ? (
            <CheckCircle2 size={16} className="text-verdant shrink-0" />
          ) : i === index ? (
            <Loader2 size={16} className="text-steel shrink-0 animate-spin" />
          ) : (
            <Clock size={16} className="text-anthracite-800/30 shrink-0" />
          )}
          <span className="font-medium">{stage}</span>
        </div>
      ))}
    </div>
  );
}

/** Deterministic count-up animation. */
function CountUp({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let current = 0;
    const start = setTimeout(() => {
      const interval = setInterval(() => {
        current = Math.min(current + 1, value);
        setDisplay(current);
        if (current >= value) clearInterval(interval);
      }, 28);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{display}</span>;
}

export function AlertIntake() {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Transient in-flight phases (processing / confirming) that override the
  // derived phase until the server state (or the 3 s poll) catches up.
  const [transient, setTransient] = useState<'processing' | 'confirming' | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [recurrenceRevealed, setRecurrenceRevealed] = useState(false);
  // Local copies of the selected alert's pipeline payloads (refresh-safe).
  const [local, setLocal] = useState<{
    extraction: Extraction | null;
    recurrence: Recurrence | null;
    fanout: Fanout | null;
  } | null>(null);

  const selectedEntry =
    state.pipeline.alerts.find((p) => p.alert.id === selectedId) ?? state.pipeline.alerts[0];
  const alert = selectedEntry?.alert ?? null;
  const extraction = local?.extraction ?? (selectedEntry?.extraction as Extraction | null) ?? null;
  const recurrence = local?.recurrence ?? (selectedEntry?.recurrence as Recurrence | null) ?? null;
  const fanout = local?.fanout ?? (selectedEntry?.fanout as Fanout | null) ?? null;
  const phase: Phase = transient ?? (fanout ? 'confirmed' : extraction ? 'extracted' : 'idle');

  // Switching alerts resets the per-alert transient view state.
  useEffect(() => {
    setTransient(null);
    setLocal(null);
    setRecurrenceRevealed(false);
    setConfirmError(null);
  }, [selectedId]);

  const runProcessing = async () => {
    if (!alert) return;
    setTransient('processing');
    // Pace the simulated pipeline with fixed delays, then flip the server state.
    const totalDelay = STAGE_DELAYS.reduce((a, b) => a + b, 0);
    await new Promise((r) => setTimeout(r, totalDelay));
    const response = await demoApi.processAlert(alert.id);
    const entry = response.pipeline.alerts.find((p) => p.alert.id === alert.id);
    setLocal({
      extraction: (entry?.extraction as Extraction | null) ?? null,
      recurrence: (entry?.recurrence as Recurrence | null) ?? null,
      fanout: null,
    });
    setRecurrenceRevealed(false);
    setTransient(null);
  };

  const runConfirm = async () => {
    if (!alert) return;
    setTransient('confirming');
    setConfirmError(null);
    await new Promise((r) => setTimeout(r, 900)); // evaluating applicability…
    await new Promise((r) => setTimeout(r, 1100)); // creating governance objects…
    try {
      const response = await demoApi.confirmExtraction(alert.id);
      const entry = response.state.pipeline.alerts.find((p) => p.alert.id === alert.id);
      setLocal((prev) => ({
        extraction: prev?.extraction ?? null,
        recurrence: prev?.recurrence ?? null,
        fanout: (entry?.fanout as Fanout | null) ?? null,
      }));
      setTransient(null);
    } catch {
      setConfirmError('Fan-out simulation failed. Reset the demo and try again.');
      setTransient(null);
    }
  };

  const fanoutStages = fanout?.generationStages || [
    'Evaluating mine applicability…',
    'Assigning owner roles…',
    'Computing statutory deadlines…',
    'Creating governance objects…',
  ];

  const isHero = alert?.kind === 'dgms-alert';
  const inbox = state.pipeline.alerts;
  const receivedCount = inbox.filter((p) => p.alert.status === 'received').length;
  const reviewCount = inbox.filter((p) => p.alert.status === 'processed').length;
  const fannedCount = inbox.filter((p) => p.alert.status === 'confirmed').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-anthracite-950">
            DGMS Safety Alert Intelligence
          </h1>
          <p className="text-anthracite-800/80 mt-1">
            One regulator PDF → structured obligations. AI reads, rules fan out, humans confirm.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-steel/10 text-steel px-3 py-1.5 rounded-lg text-xs font-bold border border-steel/20">
              <Inbox size={14} className="inline mr-1" />
              {inbox.length} in queue · {receivedCount} new
            </span>
            <span className="bg-[#C1502E]/10 text-[#C1502E] px-3 py-1.5 rounded-lg text-xs font-bold border border-[#C1502E]/20 flex items-center gap-1.5">
              <BrainCircuit size={14} /> AI PIPELINE · SIMULATED
            </span>
          </div>
        </div>
      </div>

      {/* INBOX — every actionable alert from every source */}
      <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-paper-100 bg-paper-50">
          <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
            <Inbox size={16} className="text-steel" /> Incoming Alerts
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold text-anthracite-800/70">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-steel inline-block" /> {receivedCount} received</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-safety-amber inline-block" /> {reviewCount} in AI review</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-verdant inline-block" /> {fannedCount} fanned out</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-paper-100">
          {inbox.map(({ alert: a }) => {
            const meta = (a.source && SOURCE_META[a.source]) || SOURCE_META.AUDIT;
            const statusBadge = ALERT_STATUS_BADGE[a.status ?? 'received'] || ALERT_STATUS_BADGE.received;
            const active = a.id === alert?.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`text-left p-4 bg-white hover:bg-paper-50 transition-colors flex flex-col gap-2 ${
                  active ? 'ring-2 ring-inset ring-steel/60 bg-paper-50' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <SourceChip source={a.source} />
                    <span className="font-mono text-[11px] text-anthracite-800/70 truncate">{a.ref}</span>
                  </div>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {a.severity && (
                      <span
                        className={`w-2 h-2 rounded-full ${SEVERITY_DOT[a.severity] || 'bg-anthracite-800/30'}`}
                        title={`${a.severity} severity`}
                      />
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge.cls}`}>
                      {statusBadge.label}
                    </span>
                  </span>
                </div>
                <p className="text-sm font-medium text-anthracite-950 leading-snug line-clamp-2">{a.title}</p>
                <div className="flex items-center justify-between text-[11px] text-anthracite-800/60">
                  <span className="truncate">{a.issued}{a.ackDeadline ? ` · ${a.ackDeadline}` : ''}</span>
                  <ChevronRight size={13} className={active ? 'text-steel' : 'text-anthracite-800/30'} />
                </div>
              </button>
            );
          })}
        </div>
        {/* Source origins legend */}
        <div className="px-5 py-3 border-t border-paper-100 bg-paper-50">
          <div className="text-[10px] font-bold uppercase tracking-wider text-anthracite-800/70 mb-1.5">
            Where these alerts come from
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(SOURCE_META).map(([key, meta]) => (
              <span key={key} className="flex items-center gap-1.5 text-[11px] text-anthracite-800/70">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${meta.cls}`}>
                  {meta.short}
                </span>
                {meta.origin}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Source document (PDF replica or notice) */}
        <div className="lg:col-span-2 space-y-4">
          {alert && (
            <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-paper-100 bg-paper-50">
                <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
                  <ScanLine size={16} className="text-steel" /> {alert.alertNo || 'Incoming alert'}
                </div>
                <span className="font-mono text-xs text-anthracite-800/70">{alert.ref}</span>
              </div>
              <div className="p-4 bg-anthracite-950 flex items-center justify-center">
                <div className="w-full max-w-sm bg-paper-50 rounded shadow-lg overflow-hidden">
                  {alert.pdfUrl ? (
                    <iframe
                      src={alert.pdfUrl}
                      title={`${alert.alertNo || 'Safety alert'} — original DGMS document`}
                      className="w-full h-[560px] bg-white"
                    />
                  ) : alert.pdfReplicaSvg ? (
                    <div dangerouslySetInnerHTML={{ __html: alert.pdfReplicaSvg }} />
                  ) : (
                    <div className="p-5 space-y-3 text-[11px] text-anthracite-900 leading-relaxed">
                      <div className="flex items-center justify-between pb-2 border-b border-paper-100">
                        <div className="flex items-center gap-2">
                          <SourceChip source={alert.source} />
                          {alert.severity && (
                            <span className="text-[10px] font-bold text-anthracite-800/70 uppercase tracking-wider">
                              {alert.severity}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-anthracite-800/50">{alert.ref}</span>
                      </div>
                      <p className="font-bold text-sm text-anthracite-950">{alert.title}</p>
                      {alert.paragraphs?.map((p, i) => (
                        <p key={i} className={i === 0 ? 'text-anthracite-900' : 'text-anthracite-800/80'}>
                          {p}
                        </p>
                      ))}
                      <div className="pt-2 border-t border-paper-100 font-mono text-[9px] text-anthracite-800/50">
                        {(alert.source && SOURCE_META[alert.source]?.origin) || 'External source'} · ingested
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-5 py-3 border-t border-paper-100 bg-paper-50 flex items-center justify-between gap-3 text-xs text-anthracite-800/70">
                <span>{alert.pdfSource || alert.issued || '—'}</span>
                {alert.pdfUrl && !alert.pdfSource ? (
                  <span className="font-mono">dgms.gov.in · source document</span>
                ) : null}
              </div>
            </div>
          )}

          {phase === 'confirmed' && fanout && (
            <div className="bg-white rounded-xl shadow-sm border border-paper-100 p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
                <Map size={16} className="text-steel" /> Governance state on GIS
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-verdant/10 border border-verdant/20 p-2">
                  <div className="text-xl font-bold text-verdant">
                    <CountUp value={fanout.pins.green} delay={500} />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-anthracite-800/60 font-bold">Compliant</div>
                </div>
                <div className="rounded-lg bg-safety-amber/10 border border-safety-amber/30 p-2">
                  <div className="text-xl font-bold text-safety-amber">
                    <CountUp value={fanout.pins.amber} delay={650} />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-anthracite-800/60 font-bold">In progress</div>
                </div>
                <div className="rounded-lg bg-[#C1502E]/10 border border-[#C1502E]/25 p-2">
                  <div className="text-xl font-bold text-[#C1502E]">
                    <CountUp value={fanout.pins.red} delay={800} />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-anthracite-800/60 font-bold">Overdue</div>
                </div>
              </div>
              <button
                onClick={() => navigate('/gis')}
                className="w-full flex items-center justify-between text-sm font-medium text-steel hover:text-steel/80 border border-steel/25 rounded-lg px-4 py-2.5 hover:bg-steel/5 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Map size={15} /> Open GIS Map
                </span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Pipeline panel */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="wait">
            {/* PHASE: IDLE */}
            {phase === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white rounded-xl shadow-sm border border-paper-100 p-6"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-[#C1502E]/10 p-2.5 rounded-lg text-[#C1502E] shrink-0">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-anthracite-950">
                      {alert?.title || 'Incoming alert'}
                    </h2>
                    <p className="text-sm text-anthracite-800/70 mt-1">
                      {alert?.summary || 'Structured requirements will be extracted from this document.'}
                    </p>
                  </div>
                </div>

                <div className="bg-paper-50 border border-paper-100 rounded-lg p-4 text-sm text-anthracite-800 space-y-3 mb-5">
                  <div className="font-bold text-anthracite-950 flex items-center gap-1.5">
                    <BrainCircuit size={14} className="text-steel" /> Where AI is used
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <EnginePill label="OCR" detail="read scanned PDFs" ai />
                    <ChevronRight size={14} className="text-anthracite-800/30 shrink-0" />
                    <EnginePill label="LLM extraction" detail="structured fields + source citations" ai />
                    <ChevronRight size={14} className="text-anthracite-800/30 shrink-0" />
                    <EnginePill label="Embedding search" detail="recurrence over 120 historical findings" ai />
                    <ChevronRight size={14} className="text-anthracite-800/30 shrink-0" />
                    <EnginePill label="Rules engine" detail="applicability · deadlines · fan-out" ai={false} />
                    <ChevronRight size={14} className="text-anthracite-800/30 shrink-0" />
                    <EnginePill label="Human gate" detail="confirm extraction · verify evidence" ai={false} />
                  </div>
                  <p className="text-xs text-anthracite-800/60">
                    No real LLM or vector database is contacted — this is a deterministic frontend
                    simulation for the demo.
                  </p>
                </div>

                <button
                  onClick={runProcessing}
                  className="w-full sm:w-auto bg-steel hover:bg-steel/90 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Sparkles size={16} /> Process with AI
                </button>
              </motion.div>
            )}

            {/* PHASE: PROCESSING */}
            {phase === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white rounded-xl shadow-sm border border-paper-100 p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-steel/10 p-2.5 rounded-lg text-steel animate-pulse">
                    <BrainCircuit size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-anthracite-950">
                      AI processing regulatory document…
                    </h2>
                    <p className="text-sm text-anthracite-800/70">
                      {alert?.ref || 'Incoming document'} · OCR → LLM extraction → embedding search
                    </p>
                  </div>
                </div>
                <StagedLoader
                  stages={(extraction?.pipelineStages || []).map((s) => s.label)}
                  label="Pipeline"
                  onDone={() => undefined}
                />
              </motion.div>
            )}

            {/* PHASE: EXTRACTED */}
            {phase === 'extracted' && extraction && (
              <motion.div
                key="extracted"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                {/* Extraction fields */}
                <div className="bg-white rounded-xl shadow-sm border border-paper-100 p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-display font-bold text-anthracite-950 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-verdant" /> Structured Extraction
                    </h2>
                    <span className="text-xs font-bold text-verdant bg-verdant/10 border border-verdant/25 rounded px-2 py-1">
                      ANALYSIS COMPLETE
                    </span>
                  </div>
                  <p className="text-sm text-anthracite-800/70 mb-5">
                    Each field is tagged with a source citation and a confidence badge. The human
                    stays in command.
                  </p>

                  <div className="space-y-3">
                    {extraction.fields.map((field) => (
                      <div
                        key={field.key}
                        className="rounded-lg border border-paper-100 bg-paper-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <span className="text-xs font-bold text-anthracite-800 uppercase tracking-wider">
                            {field.label}
                            {field.citation && field.citation !== '—' && (
                              <span className="ml-2 font-mono text-steel normal-case">
                                source {field.citation}
                              </span>
                            )}
                          </span>
                          <Badge badge={field.badge} />
                        </div>
                        <p className="text-sm font-medium text-anthracite-950">{field.value}</p>
                        <p className="text-xs text-anthracite-800/60 mt-1">{field.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recurrence panel */}
                <div className="bg-white rounded-xl shadow-sm border border-paper-100 p-6">
                  {!recurrenceRevealed && recurrence ? (
                    <StagedLoader
                      stages={recurrence.searchStages}
                      label="Organizational memory · embedding search"
                      onDone={() => setRecurrenceRevealed(true)}
                    />
                  ) : (
                    recurrence && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex items-center gap-2 mb-3">
                          <History size={17} className="text-safety-amber" />
                          <h3 className="text-sm font-bold text-anthracite-950 uppercase tracking-wider">
                            {recurrence.badge}
                          </h3>
                          <span className="text-xs text-anthracite-800/60">
                            · {recurrence.matched} of {recurrence.searched} historical findings
                          </span>
                        </div>
                        <div className="space-y-2">
                          {recurrence.items.map((item) => (
                            <div
                              key={`${item.mineId}-${item.year}`}
                              className="flex items-center justify-between rounded-lg border border-safety-amber/25 bg-safety-amber/5 px-4 py-2.5 text-sm"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-anthracite-950">
                                  {item.mineId}
                                </span>
                                <span className="text-anthracite-800/70">{item.title}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-anthracite-800/60">{item.year}</span>
                                <span className="font-bold text-safety-amber">{item.closure}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-start gap-2 text-xs text-anthracite-800/80 bg-paper-50 border border-paper-100 rounded-lg p-3">
                          <AlertTriangle size={13} className="text-safety-amber shrink-0 mt-0.5" />
                          <span>{recurrence.suggestion}</span>
                        </div>
                      </motion.div>
                    )
                  )}
                </div>

                {/* Confirm CTA */}
                <div className="bg-white rounded-xl shadow-sm border border-paper-100 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-sm text-anthracite-800">
                    <span className="font-bold text-anthracite-950">Confirm the extraction</span> to
                    fan obligations out to the applicable mines.
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-anthracite-800/60 border border-anthracite-800/15 rounded px-1.5 py-0.5">
                      <ShieldQuestion size={10} /> Human gate
                    </span>
                  </div>
                  <button
                    onClick={runConfirm}
                    className="bg-verdant hover:bg-verdant/90 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-colors shrink-0"
                  >
                    <FileText size={16} /> Confirm Extraction
                  </button>
                </div>
              </motion.div>
            )}

            {/* PHASE: CONFIRMING */}
            {phase === 'confirming' && (
              <motion.div
                key="confirming"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white rounded-xl shadow-sm border border-paper-100 p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-verdant/10 p-2.5 rounded-lg text-verdant animate-pulse">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-anthracite-950">
                      Fanning out obligations…
                    </h2>
                    <p className="text-sm text-anthracite-800/70">
                      Rules engine · role assignment · statutory deadlines
                    </p>
                  </div>
                </div>
                <StagedLoader stages={fanoutStages} label="Applicability" onDone={() => undefined} />
                {confirmError && (
                  <div className="mt-4 text-sm text-[#C1502E] bg-[#C1502E]/5 border border-[#C1502E]/20 rounded-lg p-3">
                    {confirmError}
                  </div>
                )}
              </motion.div>
            )}

            {/* PHASE: CONFIRMED */}
            {phase === 'confirmed' && fanout && (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-xl shadow-sm border border-verdant/25 overflow-hidden">
                  <div className="bg-verdant/5 border-b border-verdant/15 px-6 py-4 flex items-center gap-3">
                    <CheckCircle2 size={22} className="text-verdant" />
                    <div>
                      <h2 className="text-lg font-display font-bold text-anthracite-950">
                        Governance obligations created
                      </h2>
                      <p className="text-sm text-anthracite-800/70">{fanout.summary}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-px bg-paper-100">
                    <div className="bg-white p-6 text-center">
                      <div className="text-4xl font-display font-bold text-anthracite-950">
                        <CountUp value={fanout.affected} delay={200} />
                      </div>
                      <div className="text-xs uppercase tracking-wider text-anthracite-800/60 font-bold mt-1">
                        Mines affected
                      </div>
                    </div>
                    <div className="bg-white p-6 text-center">
                      <div className="text-4xl font-display font-bold text-anthracite-800/60">
                        <CountUp value={fanout.filteredOut} delay={450} />
                      </div>
                      <div className="text-xs uppercase tracking-wider text-anthracite-800/60 font-bold mt-1">
                        Correctly filtered out
                      </div>
                    </div>
                    <div className="bg-white p-6 text-center">
                      <div className="text-4xl font-display font-bold text-steel">
                        <CountUp value={fanout.governanceObjects} delay={700} />
                      </div>
                      <div className="text-xs uppercase tracking-wider text-anthracite-800/60 font-bold mt-1">
                        Governance objects
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generated tasks per mine */}
                <div className="bg-white rounded-xl shadow-sm border border-paper-100 p-6">
                  <h3 className="text-sm font-bold text-anthracite-950 uppercase tracking-wider mb-4">
                    Generated obligations by mine
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(fanout.mineTasks ?? {}).map(([mineId, taskIds]) => (
                      <div key={mineId} className="rounded-lg border border-paper-100 bg-paper-50 px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-steel">{mineId}</span>
                          <button
                            onClick={() => navigate(`/compliance?mine=${mineId}`)}
                            className="text-xs font-medium text-steel hover:text-steel/80 flex items-center gap-1 transition-colors"
                          >
                            Open queue <ArrowRight size={13} />
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {taskIds.map((id) => {
                            const obj = state.govObjects.find((o) => o.id === id);
                            return (
                              <div key={id} className="flex items-center gap-2 text-sm min-w-0">
                                <span className="font-mono text-xs text-anthracite-800/70 shrink-0">{id}</span>
                                <span className="font-medium text-anthracite-950 truncate">
                                  {obj?.title ?? id}
                                </span>
                                {id === 'TASK-001' && (
                                  <span className="shrink-0 text-[10px] font-bold text-safety-amber bg-safety-amber/10 border border-safety-amber/30 rounded px-1.5 py-0.5 uppercase">
                                    Hero · Mobile
                                  </span>
                                )}
                                {obj?.owner && (
                                  <span className="ml-auto shrink-0 text-xs text-anthracite-800/60 hidden md:inline">
                                    {obj.owner.name}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate('/compliance')}
                      className="flex-1 bg-steel hover:bg-steel/90 text-white rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      Full Governance Register <ArrowRight size={15} />
                    </button>
                  </div>
                  {isHero && (
                    <p className="mt-4 text-xs text-anthracite-800/60 flex items-center gap-1.5">
                      <BrainCircuit size={12} /> Next: open the mobile app at{' '}
                      <span className="font-mono text-steel">/mobile</span> — Ram Singh will receive
                      TASK-001 as his DO THIS NEXT action.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}