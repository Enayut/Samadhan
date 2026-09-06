import React, { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Activity,
  CalendarClock,
  FileCheck2,
  Map,
  Mountain,
  Landmark,
  Pickaxe,
  Layers,
  Database,
  RefreshCw,
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import type { Task } from '../../../shared/demo/types';
import { STATUS_COLOR, STATUS_LABEL } from '../services/demoApi';

// Lifecycle strip — the central visual concept of the product.
const LIFECYCLE = [
  'Requirement',
  'Owner',
  'Deadline',
  'Field action',
  'Evidence',
  'Independent verification',
  'Verified record',
];

function LifecycleStrip() {
  return (
    <div className="bg-white rounded-xl border border-paper-100 shadow-sm px-4 py-3 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        {LIFECYCLE.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-anthracite-950 text-safety-amber text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-xs font-bold text-anthracite-950 whitespace-nowrap">{step}</span>
            </div>
            {i < LIFECYCLE.length - 1 && <ArrowRight size={13} className="text-anthracite-800/30 shrink-0" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function mineIcon(siteId: string) {
  switch (siteId) {
    case 'MINE-001':
      return Mountain;
    case 'MINE-004':
      return Layers;
    default:
      return Pickaxe;
  }
}

function TaskRow({ task }: { task: Task }) {
  const navigate = useNavigate();
  const color = STATUS_COLOR[task.status] || '#6B7280';
  const deadline = new Date(task.deadline);
  return (
    <button
      onClick={() => navigate(`/compliance?focus=${task.id}`)}
      className="w-full text-left px-4 py-2.5 hover:bg-paper-50 transition-colors flex items-center gap-3 border-b border-paper-100/60 last:border-0"
    >
      <span
        className="shrink-0 w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
        title={STATUS_LABEL[task.status] || task.status}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-anthracite-950 truncate">{task.title}</p>
        <p className="text-[11px] text-anthracite-800/60 truncate">
          {task.mineId} · {task.owner.name} · {task.sourceCitation}
        </p>
      </div>
      {isValid(deadline) && (
        <span className="shrink-0 text-[11px] font-bold text-anthracite-800/70 flex items-center gap-1">
          <CalendarClock size={11} /> {format(deadline, 'd MMM')}
        </span>
      )}
      <span
        className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border"
        style={{ color, backgroundColor: `${color}12`, borderColor: `${color}30` }}
      >
        {STATUS_LABEL[task.status] || task.status}
      </span>
    </button>
  );
}

export function Dashboard() {
  const { state, schedulerTick } = useAppContext();
  const navigate = useNavigate();

  const perMine = useMemo(() => {
    return state.sites.map((site) => {
      const tasks = state.tasks.filter((t) => t.mineId === site.id);
      const verified = tasks.filter((t) => t.status === 'VERIFIED').length;
      const inProgress = tasks.filter(
        (t) => ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'].includes(t.status),
      ).length;
      const awaiting = tasks.filter((t) => t.status === 'AWAITING_VERIFICATION').length;
      const overdue = tasks.filter((t) => ['OVERDUE', 'ESCALATED'].includes(t.status)).length;
      const proposed = tasks.filter((t) => t.status === 'PROPOSED').length;
      const openTotal = tasks.length - verified;
      const attention =
        overdue > 0 ? 'red' : overdue === 0 && (awaiting > 0 || inProgress > 0) ? 'amber' : 'green';
      return { site, tasks, verified, inProgress, awaiting, overdue, proposed, openTotal, attention };
    });
  }, [state.sites, state.tasks]);

  const totals = useMemo(() => {
    const compliant = state.tasks.filter((t) => t.status === 'VERIFIED').length;
    const inProgress = state.tasks.filter((t) =>
      ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'].includes(t.status),
    ).length;
    const awaiting = state.tasks.filter((t) => t.status === 'AWAITING_VERIFICATION').length;
    const overdue = state.tasks.filter((t) => ['OVERDUE', 'ESCALATED'].includes(t.status)).length;
    const proposed = state.tasks.filter((t) => t.status === 'PROPOSED').length;
    return { compliant, inProgress, awaiting, overdue, proposed };
  }, [state.tasks]);

  const upcoming = useMemo(
    () =>
      state.tasks
        .filter((t) => !['VERIFIED'].includes(t.status))
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 6),
    [state.tasks],
  );

  const attentionList = useMemo(
    () =>
      state.tasks
        .filter((t) => ['OVERDUE', 'ESCALATED', 'REJECTED'].includes(t.status))
        .slice(0, 6),
    [state.tasks],
  );

  const recentActivity = useMemo(() => [...state.audit].slice(-8).reverse(), [state.audit]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-anthracite-950">Area Compliance Monitor</h1>
          <p className="text-anthracite-800/80 mt-1">
            North Karanpura Coalfield · Central Coalfields Limited · Jharkhand — five mines, one live picture
            of compliance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => schedulerTick()}
            title="Run the recurring-compliance scheduler (generates next weekly/monthly instances)"
            className="inline-flex items-center gap-2 bg-white hover:bg-paper-50 border border-paper-100 text-anthracite-950 px-3 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <RefreshCw size={13} /> Run scheduler
          </button>
          <Link
            to="/gis"
            className="inline-flex items-center gap-2 bg-white hover:bg-paper-50 border border-paper-100 text-anthracite-950 px-3 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <Map size={14} /> Area map
          </Link>
        </div>
      </div>

      <LifecycleStrip />

      {/* Area totals */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Compliant (verified)', value: totals.compliant, color: '#4C7A66', icon: ShieldCheck },
          { label: 'In progress', value: totals.inProgress, color: '#F2A93B', icon: Activity },
          { label: 'Awaiting verification', value: totals.awaiting, color: '#4A7C9B', icon: FileCheck2 },
          { label: 'Attention required', value: totals.overdue, color: '#C1502E', icon: AlertTriangle },
          { label: 'Proposed (in review)', value: totals.proposed, color: '#8A9098', icon: Clock },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-xl shadow-sm border border-paper-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: stat.color }} />
            <div className="pl-2 flex items-center justify-between">
              <p className="text-xs font-bold text-anthracite-800 uppercase tracking-wider">{stat.label}</p>
              <stat.icon size={15} style={{ color: stat.color }} />
            </div>
            <p className="text-3xl font-display font-bold text-anthracite-950 pl-2 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Five-mine grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-semibold text-anthracite-950">Five mines · current state</h2>
          <span className="text-[11px] font-bold text-anthracite-800/60 uppercase tracking-wider">
            CCL · North Karanpura
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {perMine.map(({ site, tasks, verified, inProgress, awaiting, overdue, proposed, openTotal, attention }) => {
            const Icon = mineIcon(site.id);
            const accent =
              attention === 'red' ? '#C1502E' : attention === 'amber' ? '#F2A93B' : '#4C7A66';
            return (
              <button
                key={site.id}
                onClick={() => navigate(`/mine/${site.id}`)}
                className="bg-white rounded-xl shadow-sm border border-paper-100 p-5 text-left hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: accent }} />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${accent}14`, color: accent }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-steel">{site.id}</span>
                        {site.gisAnchor && (
                          <span className="text-[9px] font-bold text-steel bg-steel/10 border border-steel/25 rounded px-1.5 py-0.5 uppercase">
                            GIS anchor
                          </span>
                        )}
                      </div>
                      <p className="text-base font-display font-bold text-anthracite-950 leading-tight truncate">
                        {site.name}
                      </p>
                      <p className="text-[11px] text-anthracite-800/60 truncate">
                        {site.type} · {site.district} · {site.area}
                      </p>
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                    style={{ color: accent, backgroundColor: `${accent}12`, borderColor: `${accent}30` }}
                  >
                    {attention === 'red' ? 'Attention' : attention === 'amber' ? 'Active' : 'Nominal'}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1 mt-4 pt-3 border-t border-paper-100 text-center">
                  {[
                    { label: 'Verified', value: verified },
                    { label: 'In prog.', value: inProgress },
                    { label: 'Verifying', value: awaiting },
                    { label: 'Overdue', value: overdue },
                    { label: 'Proposed', value: proposed },
                  ].map((cell) => (
                    <div key={cell.label}>
                      <div
                        className="text-lg font-display font-bold"
                        style={{ color: cell.value > 0 && cell.label === 'Overdue' ? '#C1502E' : '#12161A' }}
                      >
                        {cell.value}
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-anthracite-800/50">
                        {cell.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-anthracite-800/60">{openTotal} open of {tasks.length} obligations</span>
                  <span className="text-steel flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    {site.id === 'MINE-001' ? 'Open mine detail + GIS' : 'Open mine detail'} <ArrowRight size={12} />
                  </span>
                </div>
              </button>
            );
          })}

          {/* Legacy-noise guard: nothing here — five mines only */}
          <div className="bg-white rounded-xl shadow-sm border border-paper-100 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
                <Landmark size={16} className="text-steel" /> Governance spine
              </div>
              <p className="text-xs text-anthracite-800/70 mt-2 leading-relaxed">
                Every obligation runs the same spine: a rule decides applicability, owner and deadline —
                field evidence is geo-tagged and time-stamped — an independent verifier closes it. Rules
                enforce, AI advises, people decide.
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                to="/intake"
                className="w-full flex items-center justify-between text-xs font-bold text-steel border border-steel/25 rounded-lg px-3 py-2 hover:bg-steel/5 transition-colors"
              >
                <span className="flex items-center gap-2"><Database size={13} /> Ingest a requirement</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                to="/review"
                className="w-full flex items-center justify-between text-xs font-bold text-anthracite-950 bg-anthracite-950 text-paper-50 rounded-lg px-3 py-2 hover:bg-anthracite-800 transition-colors"
              >
                <span className="flex items-center gap-2"><CheckCircle2 size={13} /> Manager review queue</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lists: attention / upcoming / activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-paper-100 bg-paper-50">
            <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
              <AlertTriangle size={15} className="text-signal-rust" /> Needs attention
            </div>
            <span className="text-[10px] font-bold text-anthracite-800/60">{attentionList.length}</span>
          </div>
          {attentionList.length === 0 ? (
            <p className="px-5 py-6 text-xs text-anthracite-800/60 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-verdant" /> Nothing overdue — the area is on cadence.
            </p>
          ) : (
            attentionList.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-paper-100 bg-paper-50">
            <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
              <CalendarClock size={15} className="text-steel" /> Upcoming obligations
            </div>
            <span className="text-[10px] font-bold text-anthracite-800/60">{upcoming.length}</span>
          </div>
          {upcoming.map((t) => <TaskRow key={t.id} task={t} />)}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-paper-100 bg-paper-50">
            <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
              <Activity size={15} className="text-verdant" /> Recent activity
            </div>
            <span className="text-[10px] font-bold text-anthracite-800/60">audit trail</span>
          </div>
          <div className="divide-y divide-paper-100/60">
            {recentActivity.length === 0 && (
              <p className="px-5 py-6 text-xs text-anthracite-800/60">No transitions yet — publish an obligation to begin.</p>
            )}
            {recentActivity.map((ev, i) => (
              <div key={i} className="px-5 py-2.5 flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-steel shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-anthracite-950">
                    <span className="font-mono text-[10px] text-steel">{ev.actor}</span> · {ev.action.replaceAll('_', ' ')}
                  </p>
                  <p className="text-[11px] text-anthracite-800/60 truncate">
                    {ev.entity}{ev.detail ? ` · ${ev.detail}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
