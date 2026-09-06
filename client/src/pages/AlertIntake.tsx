import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  ShieldQuestion,
  Loader2,
  FileText,
  Sparkles,
  ArrowRight,
  History,
  Clock,
  ChevronRight,
  Inbox,
  Scale,
  Ban,
  ExternalLink,
} from 'lucide-react';

// Deterministic stage pacing (ms) for the simulated AI pipeline.
const STAGE_DELAY = 700;

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

type Applicability = {
  ruleId: string;
  applicableMineIds: string[];
  filteredOut: Array<{ mineId: string; reason: string }>;
  obligationsCreated: number;
  cadence?: string;
  summary: string;
  mineTasks?: Record<string, string[]>;
};

const SOURCE_META: Record<string, { short: string; cls: string; origin: string }> = {
  DGMS: {
    short: 'DGMS',
    cls: 'bg-[#C1502E]/10 text-[#C1502E] border-[#C1502E]/25',
    origin: 'Directorate General of Mines Safety — technical circulars & safety alerts',
  },
  EC: {
    short: 'EC',
    cls: 'bg-safety-amber/10 text-safety-amber border-safety-amber/30',
    origin: 'Environmental Clearance conditions / State Pollution Control Board',
  },
  CSIS: {
    short: 'CSIS',
    cls: 'bg-steel/10 text-steel border-steel/25',
    origin: 'CIL Safety Information System — safety-parameter feed',
  },
  SENSOR: {
    short: 'SENSOR',
    cls: 'bg-[#A93226]/10 text-[#A93226] border-[#A93226]/25',
    origin: 'Mine instrumentation telemetry (slope, strata)',
  },
  AUDIT: {
    short: 'REGISTRY',
    cls: 'bg-anthracite-100 text-anthracite-800 border-anthracite-800/20',
    origin: 'Audit / credential registry feeds (e.g. licence expiry windows)',
  },
};

const SEVERITY_DOT: Record<string, string> = {
  Critical: 'bg-[#C1502E]',
  High: 'bg-safety-amber',
  Medium: 'bg-steel',
  Low: 'bg-verdant',
};

const DOC_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  received: { label: 'Received', cls: 'bg-steel/10 text-steel border-steel/25' },
  processed: { label: 'AI Review', cls: 'bg-safety-amber/10 text-safety-amber border-safety-amber/30' },
  determined: { label: 'Rules applied', cls: 'bg-verdant/10 text-verdant border-verdant/25' },
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

  useEffect(() => {
    setIndex(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < stages.length; i++) {
      timers.push(setTimeout(() => setIndex(i), i * STAGE_DELAY));
    }
    const done = setTimeout(onDone, stages.length * STAGE_DELAY + 400);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2.5">
      <div className="text-xs font-bold text-anthracite-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        {label}
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

export function AlertIntake() {
  const { state, processDocument, determineApplicability } = useAppContext();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transient, setTransient] = useState<'processing' | 'confirming' | null>(null);

  const selectedEntry =
    state.pipeline.documents.find((p) => p.alert.id === selectedId) ?? state.pipeline.documents[0];
  const alert = selectedEntry?.alert ?? null;
  const extraction = (selectedEntry?.extraction as Extraction | null) ?? null;
  const recurrence = (selectedEntry?.recurrence as Recurrence | null) ?? null;
  const applicability = (selectedEntry?.applicability as Applicability | null) ?? null;
  const phase: Phase = transient ?? (applicability ? 'confirmed' : extraction ? 'extracted' : 'idle');

  const inbox = state.pipeline.documents;
  const receivedCount = inbox.filter((p) => p.alert.status === 'received').length;
  const reviewCount = inbox.filter((p) => p.alert.status === 'processed').length;
  const determinedCount = inbox.filter((p) => p.alert.status === 'determined').length;

  const runProcessing = async () => {
    if (!alert) return;
    setTransient('processing');
    await new Promise((r) => setTimeout(r, (extraction?.pipelineStages.length ?? 4) * STAGE_DELAY + 500));
    await processDocument(alert.id);
    setTransient(null);
  };

  const runDetermine = async () => {
    if (!alert) return;
    setTransient('confirming');
    await new Promise((r) => setTimeout(r, 900));
    await determineApplicability(alert.id);
    setTransient(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-anthracite-950">Compliance Ingest</h1>
          <p className="text-anthracite-800/80 mt-1">
            Regulatory documents in → structured requirements out. AI reads and advises — rules and people
            decide.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-steel/10 text-steel px-3 py-1.5 rounded-lg text-xs font-bold border border-steel/20">
            <Inbox size={14} className="inline mr-1" />
            {inbox.length} documents · {receivedCount} new
          </span>
          <span className="bg-steel/10 text-steel px-3 py-1.5 rounded-lg text-xs font-bold border border-steel/20 flex items-center gap-1.5">
            <BrainCircuit size={14} /> AI ADVISORY
          </span>
          <span className="bg-anthracite-100 text-anthracite-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-anthracite-800/15 flex items-center gap-1.5">
            <Scale size={14} /> RULES AUTHORITATIVE
          </span>
        </div>
      </div>

      {/* INBOX */}
      <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-paper-100 bg-paper-50">
          <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
            <Inbox size={16} className="text-steel" /> Incoming compliance documents
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold text-anthracite-800/70">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-steel inline-block" /> {receivedCount} received</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-safety-amber inline-block" /> {reviewCount} in AI review</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-verdant inline-block" /> {determinedCount} rules applied</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-paper-100">
          {inbox.map(({ alert: a }) => {
            const statusBadge = DOC_STATUS_BADGE[a.status ?? 'received'] || DOC_STATUS_BADGE.received;
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: source document */}
        <div className="lg:col-span-2 space-y-4">
          {alert && (
            <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-paper-100 bg-paper-50">
                <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
                  <FileText size={16} className="text-steel" /> Source document
                </div>
                <span className="font-mono text-xs text-anthracite-800/70">{alert.ref}</span>
              </div>
              <div className="p-4 bg-anthracite-950 flex items-center justify-center">
                <div className="w-full max-w-sm bg-paper-50 rounded shadow-lg overflow-hidden">
                  {alert.pdfUrl ? (
                    <iframe
                      src={alert.pdfUrl}
                      title={`${alert.alertNo || 'Compliance document'} — original source document`}
                      className="w-full h-[520px] bg-white"
                    />
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
              <div className="px-5 py-3 border-t border-paper-100 bg-paper-50 flex items-center justify-between gap-3 text-xs">
                <span className="text-anthracite-800/70 flex items-center gap-1.5">
                  <ExternalLink size={12} /> {alert.pdfSource || alert.issued || '—'}
                </span>
                {alert.realSourceClass && (
                  <span className="shrink-0 text-[10px] font-bold text-verdant bg-verdant/10 border border-verdant/25 rounded px-1.5 py-0.5 uppercase tracking-wider">
                    {alert.realSourceClass}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: pipeline panel */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white rounded-xl shadow-sm border border-paper-100 p-6"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-steel/10 p-2.5 rounded-lg text-steel shrink-0">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-anthracite-950">
                      {alert?.title || 'Incoming document'}
                    </h2>
                    <p className="text-sm text-anthracite-800/70 mt-1">
                      {alert?.summary || 'Structured requirements will be extracted from this document.'}
                    </p>
                  </div>
                </div>
                <div className="bg-paper-50 border border-paper-100 rounded-lg p-4 text-sm text-anthracite-800 space-y-2 mb-5">
                  <div className="font-bold text-anthracite-950 flex items-center gap-1.5">
                    <BrainCircuit size={14} className="text-steel" /> What AI does here — and what it does not
                  </div>
                  <p className="text-xs leading-relaxed">
                    <span className="font-bold text-steel">AI (advisory):</span> OCR + extraction of structured
                    requirements with source citations, and similarity search over organizational memory. Every
                    field is badged so you can see what is quoted vs inferred.
                  </p>
                  <p className="text-xs leading-relaxed">
                    <span className="font-bold text-verdant">Rules (authoritative):</span> applicability per
                    mine, owner role, deadline policy, evidence checklist and recurrence are decided by the
                    deterministic rule registry — identical output on every run.
                  </p>
                </div>
                <button
                  onClick={runProcessing}
                  className="w-full sm:w-auto bg-steel hover:bg-steel/90 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles size={16} /> Extract requirements (AI advisory)
                </button>
              </motion.div>
            )}

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
                      AI extracting requirements…
                    </h2>
                    <p className="text-sm text-anthracite-800/70">
                      {alert?.ref || 'Document'} · OCR → LLM extraction → memory search
                    </p>
                  </div>
                </div>
                <StagedLoader
                  stages={(extraction?.pipelineStages || [
                    { label: 'Reading document…' },
                    { label: 'Extracting requirements…' },
                  ]).map((s) => s.label)}
                  label="Pipeline (simulated for the demo — deterministic fallback)"
                  onDone={() => undefined}
                />
              </motion.div>
            )}

            {phase === 'extracted' && extraction && (
              <motion.div
                key="extracted"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-xl shadow-sm border border-paper-100 p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-display font-bold text-anthracite-950 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-verdant" /> Extracted requirements
                      <span className="text-[10px] font-bold text-steel bg-steel/10 border border-steel/25 rounded px-2 py-0.5 uppercase tracking-wider">
                        AI · advisory
                      </span>
                    </h2>
                  </div>
                  <p className="text-sm text-anthracite-800/70 mb-5">
                    Each field cites the source section and carries a confidence badge. The manager confirms
                    before anything is published.
                  </p>
                  <div className="space-y-3">
                    {extraction.fields.map((field) => (
                      <div key={field.key} className="rounded-lg border border-paper-100 bg-paper-50 p-4">
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <span className="text-xs font-bold text-anthracite-800 uppercase tracking-wider">
                            {field.label}
                            {field.citation && field.citation !== '—' && (
                              <span className="ml-2 font-mono text-steel normal-case">source {field.citation}</span>
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

                {recurrence && (
                  <div className="bg-white rounded-xl shadow-sm border border-paper-100 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <History size={17} className="text-safety-amber" />
                      <h3 className="text-sm font-bold text-anthracite-950 uppercase tracking-wider">
                        {recurrence.badge}
                      </h3>
                      <span className="text-[10px] font-bold text-safety-amber bg-safety-amber/10 border border-safety-amber/30 rounded px-2 py-0.5 uppercase tracking-wider">
                        AI · advisory
                      </span>
                      <span className="text-xs text-anthracite-800/60">
                        · {recurrence.matched} of {recurrence.searched} memory records
                      </span>
                    </div>
                    <div className="space-y-2">
                      {recurrence.items.map((item) => (
                        <div
                          key={`${item.mineId}-${item.year}`}
                          className="flex items-center justify-between rounded-lg border border-safety-amber/25 bg-safety-amber/5 px-4 py-2.5 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-anthracite-950">{item.mineId}</span>
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
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-paper-100 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-sm text-anthracite-800">
                    <span className="font-bold text-anthracite-950">Apply the rule registry</span> to determine
                    applicability per mine.
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-verdant border border-verdant/25 rounded px-1.5 py-0.5">
                      <Scale size={10} /> Rules — deterministic
                    </span>
                  </div>
                  <button
                    onClick={runDetermine}
                    className="bg-verdant hover:bg-verdant/90 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-colors shrink-0"
                  >
                    <Scale size={16} /> Apply compliance rules
                  </button>
                </div>
              </motion.div>
            )}

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
                    <Scale size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-anthracite-950">
                      Determining applicability…
                    </h2>
                    <p className="text-sm text-anthracite-800/70">
                      Rule registry · owner roles · deadline policy
                    </p>
                  </div>
                </div>
                <StagedLoader
                  stages={[
                    'Matching document to rule registry…',
                    'Evaluating mine applicability…',
                    'Resolving owner & verifier roles…',
                    'Computing deadline & evidence checklist…',
                  ]}
                  label="Rules engine"
                  onDone={() => undefined}
                />
              </motion.div>
            )}

            {phase === 'confirmed' && applicability && (
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
                        Rules applied — obligations determined
                      </h2>
                      <p className="text-sm text-anthracite-800/70">{applicability.summary}</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-anthracite-800/60">
                      <Scale size={13} className="text-verdant" /> Rule <span className="font-mono text-verdant normal-case">{applicability.ruleId}</span>
                      {applicability.cadence && (
                        <span className="text-[10px] font-bold text-steel bg-steel/10 border border-steel/25 rounded px-1.5 py-0.5 uppercase normal-case">
                          Recurring · {applicability.cadence}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {applicability.applicableMineIds.map((mineId) => {
                        const mine = state.sites.find((s) => s.id === mineId);
                        const taskIds = applicability.mineTasks?.[mineId] ?? [];
                        return (
                          <div key={mineId} className="rounded-lg border border-verdant/25 bg-verdant/5 px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="font-mono text-xs font-bold text-verdant">{mineId}</span>
                                <span className="ml-2 text-sm font-medium text-anthracite-950">{mine?.name}</span>
                              </div>
                              <CheckCircle2 size={14} className="text-verdant shrink-0" />
                            </div>
                            {taskIds.length > 0 && (
                              <p className="text-[11px] text-anthracite-800/60 mt-1 font-mono">{taskIds.join(', ')}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {applicability.filteredOut.length > 0 && (
                      <div className="rounded-lg border border-paper-100 bg-paper-50 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-anthracite-800/60">
                          <Ban size={13} /> Correctly filtered out
                        </div>
                        {applicability.filteredOut.map((f) => {
                          const mine = state.sites.find((s) => s.id === f.mineId);
                          return (
                            <div key={f.mineId} className="flex items-center justify-between text-sm">
                              <span>
                                <span className="font-mono text-xs font-bold text-anthracite-800">{f.mineId}</span>
                                <span className="ml-2 text-anthracite-800/80">{mine?.name}</span>
                              </span>
                              <span className="text-xs text-anthracite-800/60 text-right">{f.reason}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button
                      onClick={() => navigate('/review')}
                      className="w-full bg-anthracite-950 hover:bg-anthracite-800 text-paper-50 rounded-lg px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      Open Manager Review to publish <ArrowRight size={15} />
                    </button>
                    <p className="text-xs text-anthracite-800/60 flex items-center gap-1.5">
                      <ShieldQuestion size={12} /> Nothing reaches a mine official until the manager reviews and
                      publishes.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
