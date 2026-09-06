import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Check,
  Loader2,
  Scale,
  Sparkles,
  BookOpen,
  Hash,
  ExternalLink,
  FileDown,
} from 'lucide-react';
import { format, differenceInDays, isPast, isValid } from 'date-fns';
import { useAppContext } from '../store/AppContext';
import { demoApi, STATUS_COLOR, STATUS_LABEL, DOMAIN_LABEL, RagSearchResponse, RagResult } from '../services/demoApi';
import type { Task } from '../../../shared/demo/types';

interface Props {
  objectId: string | null;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// RAG — "Relevant Regulations" (advisory retrieval from the real corpus via
// the FastAPI backend). Rules remain authoritative; this only retrieves.
// ---------------------------------------------------------------------------
function RelevantRegulations({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RagSearchResponse | null>(null);
  const [offline, setOffline] = useState(false);

  const runSearch = async () => {
    setOpen(true);
    setLoading(true);
    setOffline(false);
    try {
      const resp = await demoApi.ragSearch(task.title, 6, task.mineId);
      setData(resp);
      setOffline(!!resp.error);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-anthracite-950 uppercase tracking-wider flex items-center gap-2">
          <BookOpen size={15} className="text-steel" /> Relevant regulations
          <span className="text-[9px] font-bold text-steel bg-steel/10 border border-steel/25 rounded px-1.5 py-0.5 uppercase tracking-wider">
            AI · advisory retrieval
          </span>
        </h3>
        {!open && (
          <button
            onClick={runSearch}
            className="text-xs font-bold text-steel hover:text-steel/80 flex items-center gap-1"
          >
            Retrieve from corpus <ExternalLink size={12} />
          </button>
        )}
      </div>

      {open && (
        <div className="bg-white rounded-xl border border-paper-100 overflow-hidden">
          {loading && (
            <div className="p-6 flex items-center gap-3 text-sm text-anthracite-800">
              <Loader2 size={16} className="animate-spin text-steel" /> Retrieving passages from the bundled
              regulatory corpus…
            </div>
          )}
          {!loading && offline && (
            <div className="p-6 text-sm text-anthracite-800/80 bg-safety-amber/5 border-b border-safety-amber/20">
              <strong className="text-safety-amber">Retrieval backend offline.</strong>
              <p className="text-xs mt-1 text-anthracite-800/70">
                The advisory retrieval service (FastAPI + RAG over the real corpus) is not reachable. Start it
                with <code className="font-mono text-steel">cd backend &amp;&amp; python backend.py</code>. Rules
                and verification are unaffected — this panel is advisory only.
              </p>
            </div>
          )}
          {!loading && data && !offline && (
            <>
              <div className="px-4 py-2.5 bg-paper-50 border-b border-paper-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-anthracite-800/70">
                  {data.results.length} passages · {data.embedding_backend} embeddings · {data.mode}
                </span>
                <span className="text-[10px] font-bold text-verdant bg-verdant/10 border border-verdant/25 rounded px-1.5 py-0.5 uppercase">
                  Advisory only
                </span>
              </div>
              <div className="divide-y divide-paper-100/70 max-h-72 overflow-y-auto">
                {data.results.map((r: RagResult) => (
                  <div key={r.chunk_key} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-anthracite-950">{r.title}</p>
                        <p className="text-[10px] font-mono text-anthracite-800/60 mt-0.5">
                          {r.doc_id} · relevance {(r.score * 100).toFixed(0)}%
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 border ${
                          r.source_class?.includes('OFFICIAL')
                            ? 'text-verdant bg-verdant/10 border-verdant/25'
                            : 'text-steel bg-steel/10 border-steel/25'
                        }`}
                      >
                        {r.source_class || 'CORPUS'}
                      </span>
                    </div>
                    <p className="text-xs text-anthracite-800/80 mt-1.5 leading-relaxed">{r.snippet}</p>
                    <p className="text-[10px] text-anthracite-800/50 mt-1.5 truncate">Source: {r.origin}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 bg-paper-50 border-t border-paper-100 text-[11px] text-anthracite-800/60">
                {data.disclaimer}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function GovernanceObjectModal({ objectId, onClose }: Props) {
  const { state, persona, rejectEvidence, approveTask } = useAppContext();
  const [rejectingItem, setRejectingItem] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3200);
  };

  if (!objectId) return null;

  const task = state.tasks.find((t) => t.id === objectId);
  if (!task) return null;

  const mine = state.sites.find((s) => s.id === task.mineId);
  const isVerifierPersona = persona === 'REGULATORY_OFFICIAL';
  const canVerify = isVerifierPersona && task.status === 'AWAITING_VERIFICATION';

  const handleReject = async (evidenceId: string) => {
    if (!rejectionReason.trim()) return;
    await rejectEvidence(task.id, evidenceId, rejectionReason.trim());
    setRejectingItem(null);
    setRejectionReason('');
    showToast('Evidence rejected — task returned to the owner for correction');
  };

  const handleApprove = async () => {
    if (approving) return;
    setApproving(true);
    await new Promise((r) => setTimeout(r, 700)); // verification visual
    await approveTask(task.id);
    setApproving(false);
    showToast('Evidence verified — closure record generated');
  };

  const deadlineDate = new Date(task.deadline);
  const hasValidDeadline = isValid(deadlineDate);
  const daysUntilDeadline = hasValidDeadline ? differenceInDays(deadlineDate, new Date()) : 0;
  const isOverdue = hasValidDeadline && isPast(deadlineDate) && task.status !== 'VERIFIED';

  const safeFormat = (value: string | undefined, pattern: string): string => {
    if (!value) return '—';
    const date = new Date(value);
    return isValid(date) ? format(date, pattern) : '—';
  };

  const color = STATUS_COLOR[task.status] || '#6B7280';
  const cert = task.closureCertificate;

  // Lifecycle stage index for the requirement→record strip
  const lifecycleStages: Array<{ label: string; done: boolean }> = [
    { label: 'Requirement', done: true },
    { label: 'Owner', done: true },
    { label: 'Deadline', done: true },
    { label: 'Field action', done: ['IN_PROGRESS', 'AWAITING_VERIFICATION', 'REJECTED', 'VERIFIED', 'OVERDUE', 'ESCALATED'].includes(task.status) },
    { label: 'Evidence', done: ['AWAITING_VERIFICATION', 'VERIFIED'].includes(task.status) },
    { label: 'Independent verification', done: task.status === 'VERIFIED' },
    { label: 'Verified record', done: task.status === 'VERIFIED' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-anthracite-950/80 backdrop-blur-sm p-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-anthracite-950 text-paper-50 text-sm font-medium px-4 py-2.5 rounded-lg shadow-2xl border border-anthracite-800 flex items-center gap-2"
          >
            <CheckCircle2 size={15} className="text-verdant" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-paper-50 w-full max-w-3xl rounded-2xl shadow-2xl border border-paper-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-paper-100 bg-white rounded-t-2xl">
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider flex-wrap">
              <span className="bg-anthracite-100 text-anthracite-800 px-2 py-1 rounded">
                {DOMAIN_LABEL[task.domain] || task.domain}
              </span>
              <span className="bg-anthracite-100 text-anthracite-800 px-2 py-1 rounded">Severity: {task.severity}</span>
              <span className="px-2 py-1 rounded border" style={{ color, backgroundColor: `${color}12`, borderColor: `${color}30` }}>
                {STATUS_LABEL[task.status] || task.status}
              </span>
              {task.recurring && task.cadence && (
                <span className="bg-steel/10 text-steel border border-steel/25 px-2 py-1 rounded">
                  Recurring · {task.cadence}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-anthracite-950">{task.title}</h2>
              <p className="text-sm text-anthracite-800/70 mt-1 flex items-center gap-1">
                <FileText size={14} /> Source: {task.sourceCitation}
                {task.generatedBy === 'RULE_DERIVED' && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-verdant bg-verdant/10 border border-verdant/25 rounded px-1.5 py-0.5">
                    <Scale size={9} /> Rule derived
                  </span>
                )}
              </p>
              <p className="text-xs text-anthracite-800/60 mt-0.5">
                {mine?.name} ({task.mineId}) · {mine?.district}, {mine?.state}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-anthracite-800/50 hover:text-anthracite-950 p-2 rounded-full hover:bg-paper-100 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-8 bg-paper-50">
          {/* Lifecycle strip */}
          <div className="bg-white rounded-xl border border-paper-100 p-4 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {lifecycleStages.map((stage, i) => (
                <React.Fragment key={stage.label}>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                        stage.done ? 'bg-verdant text-white' : 'bg-paper-100 text-anthracite-800/50'
                      }`}
                    >
                      {stage.done ? <Check size={10} /> : i + 1}
                    </span>
                    <span className={`text-[11px] font-bold whitespace-nowrap ${stage.done ? 'text-anthracite-950' : 'text-anthracite-800/40'}`}>
                      {stage.label}
                    </span>
                  </div>
                  {i < lifecycleStages.length - 1 && (
                    <div className={`w-4 h-px ${stage.done ? 'bg-verdant' : 'bg-paper-100'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Owner / deadline / verifier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-paper-100">
              <p className="text-xs font-bold text-anthracite-800 uppercase tracking-wider mb-1">Owner</p>
              <p className="text-sm font-medium text-anthracite-950">{task.owner.name}</p>
              <p className="text-xs text-anthracite-800">{task.owner.role}</p>
            </div>
            <div className={`p-4 rounded-xl shadow-sm border ${isOverdue ? 'bg-[#C1502E]/5 border-[#C1502E]/20' : 'bg-white border-paper-100'}`}>
              <p className="text-xs font-bold text-anthracite-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={12} /> Deadline
              </p>
              <p className={`text-sm font-medium ${isOverdue ? 'text-[#C1502E]' : 'text-anthracite-950'}`}>
                {safeFormat(task.deadline, 'EEE d MMM yyyy')}
              </p>
              {task.status !== 'VERIFIED' && (
                <p className={`text-xs ${isOverdue ? 'text-[#C1502E]' : 'text-anthracite-800'}`}>
                  {isOverdue ? `${Math.abs(daysUntilDeadline)} days overdue` : `${daysUntilDeadline} days remaining`}
                </p>
              )}
              <p className="text-[11px] text-anthracite-800/60 mt-1">{task.shiftInfo}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-paper-100">
              <p className="text-xs font-bold text-anthracite-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldAlert size={12} className="text-steel" /> Verifier (≠ owner)
              </p>
              <p className="text-sm font-medium text-anthracite-950">{task.verifier.name}</p>
              <p className="text-xs text-anthracite-800">{task.verifier.role}</p>
            </div>
          </div>

          {/* Evidence checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-anthracite-950 uppercase tracking-wider">
              Evidence {task.evidenceItems.filter((ev) => !ev.optional).length} required
              {task.evidenceItems.some((ev) => ev.optional) ? ' + optional' : ''}
            </h3>
            {task.rejectionReason && (
              <div className="bg-[#A93226]/5 border border-[#A93226]/20 rounded-lg p-3 text-sm text-[#A93226] flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <div>
                  <strong>Action required — returned to owner:</strong> {task.rejectionReason}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {task.evidenceItems.map((ev) => (
                <div key={ev.id} className="bg-white border border-paper-100 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5">
                        {ev.status === 'verified' ? (
                          <CheckCircle2 size={18} className="text-verdant" />
                        ) : ev.status === 'uploaded' ? (
                          <CheckCircle2 size={18} className="text-steel" />
                        ) : ev.status === 'rejected' ? (
                          <AlertTriangle size={18} className="text-[#C1502E]" />
                        ) : (
                          <Clock size={18} className="text-anthracite-800/40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-anthracite-950">
                          {ev.title}
                          {ev.optional && (
                            <span className="ml-2 text-[9px] font-bold uppercase text-anthracite-800/50 border border-anthracite-800/15 rounded px-1 py-0.5">
                              optional
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span
                            className={`text-xs font-bold uppercase ${
                              ev.status === 'verified'
                                ? 'text-verdant'
                                : ev.status === 'uploaded'
                                  ? 'text-steel'
                                  : ev.status === 'rejected'
                                    ? 'text-[#C1502E]'
                                    : 'text-anthracite-800/40'
                            }`}
                          >
                            {ev.status}
                          </span>
                          {ev.metadata && (
                            <>
                              <span className="text-xs text-anthracite-800 flex items-center gap-1">
                                <Clock size={10} /> {ev.metadata.timestamp}
                              </span>
                              <span className="text-xs text-anthracite-800 flex items-center gap-1">
                                <MapPin size={10} /> {ev.metadata.gps}
                              </span>
                              <span className="text-[10px] font-mono text-anthracite-800/60 flex items-center gap-1">
                                <Hash size={9} /> {ev.metadata.sha256}
                              </span>
                            </>
                          )}
                          {ev.fileName && (
                            <span className="text-xs text-anthracite-800 flex items-center gap-1">
                              <FileDown size={10} /> {ev.fileName}
                            </span>
                          )}
                        </div>
                        {ev.rejectionReason && (
                          <div className="mt-2 text-xs bg-safety-amber/10 text-safety-amber p-2 rounded border border-safety-amber/20">
                            <strong>Rejection reason:</strong> {ev.rejectionReason}
                          </div>
                        )}
                        {!ev.metadata && ev.status === 'pending' && (
                          <p className="text-xs text-anthracite-800/50 mt-1">{ev.guidance}</p>
                        )}
                      </div>
                    </div>

                    {/* Verifier reject action */}
                    {canVerify && ev.status !== 'rejected' && (
                      <div className="shrink-0">
                        {rejectingItem === ev.id ? (
                          <div className="flex flex-col gap-2 w-56">
                            <input
                              type="text"
                              placeholder="Reason for rejection (required)…"
                              className="text-xs p-2 border border-paper-100 rounded bg-paper-50 w-full outline-none focus:border-safety-amber"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button onClick={() => setRejectingItem(null)} className="text-xs text-anthracite-800 hover:text-anthracite-950 flex-1">
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReject(ev.id)}
                                disabled={!rejectionReason.trim()}
                                className="text-xs bg-[#C1502E] text-white px-2 py-1 rounded disabled:opacity-50 flex-1"
                              >
                                Confirm rejection
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRejectingItem(ev.id)}
                            className="text-xs font-medium text-[#C1502E] hover:bg-[#C1502E]/10 px-2 py-1 rounded transition-colors"
                          >
                            Reject item…
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Field remarks + form */}
            {(task.remediationNotes || task.formValues) && (
              <div className="bg-white border border-paper-100 rounded-lg p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-anthracite-800/60 mb-1.5">
                  Field record
                </p>
                {task.formValues && Object.keys(task.formValues).length > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    {Object.entries(task.formValues).map(([k, v]) => (
                      <div key={k} className="bg-paper-50 rounded px-2 py-1.5">
                        <span className="text-anthracite-800/50 uppercase text-[9px] font-bold block">{k}</span>
                        <span className="font-medium text-anthracite-950">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {task.remediationNotes && (
                  <p className="text-xs text-anthracite-800/80 leading-relaxed">{task.remediationNotes}</p>
                )}
              </div>
            )}

            {/* Approve action */}
            {canVerify && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="mt-2 w-full bg-verdant hover:bg-verdant/90 text-white py-3 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {approving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying evidence completeness, hashes and
                    owner ≠ verifier…
                  </>
                ) : (
                  <>
                    <Check size={16} /> Approve & close (independent verification)
                  </>
                )}
              </button>
            )}
          </div>

          {/* Escalation history */}
          {(task.escalationEvents?.length ?? 0) > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-anthracite-950 uppercase tracking-wider">Escalation history</h3>
              <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
                {task.escalationEvents.map((esc, i) => (
                  <div key={i} className={`p-3 text-sm flex justify-between items-center ${i > 0 ? 'border-t border-paper-100' : ''}`}>
                    <div>
                      <span className="font-bold text-[#C1502E] mr-2">{esc.level}</span>
                      <span className="text-anthracite-950">Notified: {esc.notified}</span>
                    </div>
                    <span className="text-xs text-anthracite-800">{safeFormat(esc.timestamp, 'MMM d, HH:mm')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RAG — Relevant Regulations (advisory) */}
          <RelevantRegulations task={task} />

          {/* Closure record */}
          {task.status === 'VERIFIED' && cert && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-anthracite-950 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} className="text-verdant" /> Verified closure record
              </h3>
              <div className="bg-verdant/5 border border-verdant/30 rounded-xl overflow-hidden">
                <div className="border-b border-verdant/20 bg-verdant/10 px-4 py-3 flex items-center justify-between">
                  <div className="text-xs font-bold text-verdant uppercase tracking-wider">
                    SAMAADHAN · independently verified record
                  </div>
                  <div className="text-xs font-mono text-anthracite-800/70">{cert.taskId}</div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2.5 font-mono text-xs text-anthracite-800">
                  <div><span className="text-anthracite-800/50">Source</span><br /><strong className="text-anthracite-950">{cert.source}</strong></div>
                  <div><span className="text-anthracite-800/50">Owner</span><br /><strong className="text-anthracite-950">{cert.ownerName} · {cert.ownerRole}</strong></div>
                  <div><span className="text-anthracite-800/50">Verifier</span><br /><strong className="text-anthracite-950">{cert.verifierName} · {cert.verifierRole}</strong></div>
                  <div><span className="text-anthracite-800/50">Evidence</span><br /><strong className="text-anthracite-950">{cert.evidenceCount} hashes</strong></div>
                  <div><span className="text-anthracite-800/50">Created</span><br /><strong className="text-anthracite-950">{safeFormat(cert.created, 'MMM d, HH:mm')}</strong></div>
                  <div><span className="text-anthracite-800/50">Submitted</span><br /><strong className="text-anthracite-950">{safeFormat(cert.submitted, 'MMM d, HH:mm')}</strong></div>
                  <div><span className="text-anthracite-800/50">Verified</span><br /><strong className="text-anthracite-950">{safeFormat(cert.verified, 'MMM d, HH:mm')}</strong></div>
                  <div><span className="text-anthracite-800/50">Closure hash</span><br /><strong className="text-anthracite-950">{cert.hash}</strong></div>
                  <div className="col-span-2"><span className="text-anthracite-800/50">Evidence hashes (SHA-256, tamper-evident)</span><br />{cert.evidenceHashes.map((h, i) => (<div key={i} className="truncate">{h}</div>))}</div>
                  {cert.auditHash && (
                    <div className="col-span-2"><span className="text-anthracite-800/50">Audit chain</span><br /><strong className="text-anthracite-950">{cert.auditHash}</strong></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Advisory note */}
          <div className="text-[11px] text-anthracite-800/50 flex items-center gap-1.5">
            <Sparkles size={11} /> AI surfaces in this product (extraction, memory, retrieval) are advisory.
            Applicability, deadlines, evidence and closure are decided by deterministic rules and the
            independent verifier.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
