import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ClipboardList,
  Scale,
  Sparkles,
  ShieldQuestion,
  Clock,
  CalendarClock,
  ArrowRight,
  FileText,
  Send,
  Search,
  ExternalLink,
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import type { Task } from '../../../shared/demo/types';
import { DOMAIN_LABEL } from '../services/demoApi';

function ProvenanceChips({ task }: { task: Task }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-verdant bg-verdant/10 border border-verdant/25 rounded px-1.5 py-0.5">
        <Scale size={10} /> Rule derived
      </span>
      {task.sourceRef && task.sourceRef.startsWith('DGMS') && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-steel bg-steel/10 border border-steel/25 rounded px-1.5 py-0.5">
          <Sparkles size={10} /> AI extracted — confirmed
        </span>
      )}
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-anthracite-800 bg-paper-100 border border-anthracite-800/20 rounded px-1.5 py-0.5">
        <ShieldQuestion size={10} /> Requires human confirmation
      </span>
    </div>
  );
}

function ReviewCard({ task }: { task: Task }) {
  const { state, publishTask } = useAppContext();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [deadlineOffset, setDeadlineOffset] = useState<number>(
    Math.max(1, Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000)),
  );
  const [publishing, setPublishing] = useState(false);

  const mine = state.sites.find((s) => s.id === task.mineId);
  const rule = state.rules.find((r) => r.id === task.obligationRef);
  const deadline = new Date(task.deadline);
  const requiredEvidence = task.evidenceItems.filter((ev) => !ev.optional);

  const doPublish = async () => {
    setPublishing(true);
    await publishTask(task.id, {
      deadlineOffsetDays: deadlineOffset,
      hoursRemaining: deadlineOffset * 24,
      deadlineDisplay: `Due ${format(new Date(Date.now() + deadlineOffset * 86400000), 'd MMM')} · Shift I`,
    });
    setPublishing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
      <div className="p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-anthracite-800 bg-anthracite-100 px-2 py-0.5 rounded">
                {DOMAIN_LABEL[task.domain] || task.domain}
              </span>
              <span className="font-mono text-[11px] text-steel">{task.id}</span>
              {task.recurring && task.cadence && (
                <span className="text-[10px] font-bold text-steel bg-steel/10 border border-steel/25 rounded px-1.5 py-0.5 uppercase tracking-wider">
                  Recurring · {task.cadence}
                </span>
              )}
            </div>
            <h3 className="text-base font-display font-bold text-anthracite-950 leading-snug">{task.title}</h3>
            <p className="text-xs text-anthracite-800/70 mt-1">
              {mine?.name} ({task.mineId}) · Owner {task.ownerLabel} · Verifier {task.verifierLabel}
            </p>
            <div className="mt-2">
              <ProvenanceChips task={task} />
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
            <div className="flex items-center gap-1.5 text-sm font-bold text-anthracite-950">
              <CalendarClock size={14} className="text-steel" />
              {isValid(deadline) ? format(deadline, 'EEE d MMM') : '—'}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-anthracite-800/70 uppercase tracking-wider">
                Deadline in
              </label>
              <select
                value={deadlineOffset}
                onChange={(e) => setDeadlineOffset(Number(e.target.value))}
                className="bg-white border border-paper-100 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-steel"
              >
                {[1, 2, 3, 4, 5, 7, 10, 14].map((d) => (
                  <option key={d} value={d}>
                    {d} day{d > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={doPublish}
              disabled={publishing}
              className="bg-verdant hover:bg-verdant/90 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              <Send size={13} /> {publishing ? 'Publishing…' : 'Review & publish'}
            </button>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-steel hover:text-steel/80 transition-colors"
        >
          {expanded ? 'Hide' : 'Show'} rule basis, evidence checklist & source
          <ArrowRight size={12} className={expanded ? 'rotate-90' : ''} />
        </button>

        {expanded && (
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="rounded-lg border border-paper-100 bg-paper-50 p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-anthracite-800/60 mb-2">
                <Scale size={12} className="text-verdant" /> Rule basis
              </div>
              {rule ? (
                <div className="space-y-1.5 text-xs text-anthracite-800">
                  <p className="font-mono font-bold text-verdant">{rule.id}</p>
                  <p><strong className="text-anthracite-950">Applicability:</strong> {rule.applicability.description}</p>
                  <p><strong className="text-anthracite-950">Owner role:</strong> {rule.ownerRole} · <strong className="text-anthracite-950">Verifier:</strong> {rule.verifierRole} (≠ owner)</p>
                  {rule.cadence && (
                    <p><strong className="text-anthracite-950">Cadence:</strong> {rule.cadence.kind} ({rule.cadence.anchor} · {rule.cadence.shift})</p>
                  )}
                  <p><strong className="text-anthracite-950">Escalation:</strong> {rule.escalationRule}</p>
                  <div className="pt-1.5 border-t border-paper-100">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-verdant">
                      {rule.statutoryBasis?.startsWith('DGMS') ? 'STATUTORY BASIS' : 'CONFIGURED RULE'}
                    </span>
                    <p className="text-[11px] text-anthracite-800/80">{rule.statutoryBasis}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-anthracite-800/70">
                  Manager-created obligation — organizational rule, not statutory.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-paper-100 bg-paper-50 p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-anthracite-800/60 mb-2">
                <ClipboardList size={12} className="text-steel" /> Required evidence ({requiredEvidence.length})
              </div>
              <ul className="space-y-1.5 text-xs text-anthracite-800">
                {requiredEvidence.map((ev) => (
                  <li key={ev.id} className="flex items-start gap-1.5">
                    <CheckCircle2 size={12} className="text-steel mt-0.5 shrink-0" />
                    <span>{ev.title}</span>
                  </li>
                ))}
                {task.evidenceItems.some((ev) => ev.optional) && (
                  <li className="text-anthracite-800/50">+ optional attachments (e.g. attendance page)</li>
                )}
              </ul>
            </div>

            <div className="rounded-lg border border-paper-100 bg-paper-50 p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-anthracite-800/60 mb-2">
                <FileText size={12} className="text-[#C1502E]" /> Source requirement
              </div>
              <p className="text-xs text-anthracite-800">
                <span className="font-mono font-bold text-anthracite-950">{task.sourceCitation}</span>
              </p>
              <button
                onClick={() => navigate('/intake')}
                className="mt-2 text-[11px] font-bold text-steel hover:text-steel/80 flex items-center gap-1"
              >
                View source document <ExternalLink size={11} />
              </button>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-anthracite-800/50 flex items-center gap-1">
                <Clock size={10} /> {task.shiftInfo}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ManagerReview() {
  const { state } = useAppContext();
  const [search, setSearch] = useState('');

  const proposed = useMemo(
    () =>
      state.tasks.filter(
        (t) =>
          t.status === 'PROPOSED' &&
          (t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.mineId.toLowerCase().includes(search.toLowerCase())),
      ),
    [state.tasks, search],
  );

  const recentlyPublished = useMemo(
    () => state.tasks.filter((t) => t.status === 'ASSIGNED').slice(0, 6),
    [state.tasks],
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-anthracite-950">Manager Review</h1>
          <p className="text-anthracite-800/80 mt-1">
            Rule-derived obligations awaiting your confirmation. Nothing reaches a mine official until you
            publish it.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-anthracite-800/50" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search obligation or mine…"
            className="w-full pl-9 pr-4 py-2 bg-white border border-paper-100 rounded-lg text-sm focus:outline-none focus:border-steel"
          />
        </div>
      </div>

      {/* Review queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-anthracite-950">
            Awaiting review ({proposed.length})
          </h2>
          <span className="text-[11px] font-bold text-anthracite-800/60 uppercase tracking-wider">
            AI extracted → rules derived → human confirms
          </span>
        </div>
        {proposed.length === 0 ? (
          <div className="bg-white rounded-xl border border-paper-100 p-8 text-center">
            <CheckCircle2 size={28} className="text-verdant mx-auto mb-2" />
            <p className="text-sm font-bold text-anthracite-950">Review queue is clear</p>
            <p className="text-xs text-anthracite-800/60 mt-1">
              Ingest a new compliance document to generate obligations, or run the scheduler for the next
              recurring instances.
            </p>
          </div>
        ) : (
          proposed.map((task) => <ReviewCard key={task.id} task={task} />)
        )}
      </div>

      {/* Recently published */}
      {recentlyPublished.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-paper-100 bg-paper-50">
            <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
              <Send size={15} className="text-verdant" /> Published — visible on mine officials' devices
            </div>
            <span className="text-[10px] font-bold text-anthracite-800/60">{recentlyPublished.length}</span>
          </div>
          <div className="divide-y divide-paper-100/60">
            {recentlyPublished.map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-anthracite-950 truncate">{t.title}</p>
                  <p className="text-[11px] text-anthracite-800/60">
                    {t.mineId} · {t.owner.name} · {t.shiftInfo}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-steel bg-steel/10 border border-steel/25 rounded px-2 py-0.5 uppercase tracking-wider">
                  ASSIGNED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
