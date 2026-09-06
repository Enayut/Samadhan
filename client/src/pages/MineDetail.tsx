import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Mountain,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  ArrowRight,
  Layers,
  BookOpen,
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { useAppContext } from '../store/AppContext';
import { GovernanceObjectModal } from '../components/GovernanceObjectModal';
import { STATUS_COLOR, STATUS_LABEL } from '../services/demoApi';
import type { Task } from '../../../shared/demo/types';
import { Header, ViewMode } from '../gis/components/Header';
import { Gis2DView } from '../gis/components/Gis2DView';
import { Terrain3DView } from '../gis/components/Terrain3DView';
import { ComplianceDrawer } from '../gis/components/ComplianceDrawer';
import { DataProvenancePanel } from '../gis/components/DataProvenancePanel';
import { MINE_001_DATA, MINE_001_SIMULATED_TELEMETRY } from '../gis/data/mine001';
import type { ComplianceViolation, SimulatedTelemetrySensor } from '../gis/types';
import { useGisGovernance } from '../gis/useGisGovernance';
// @ts-ignore — leaflet stylesheet ships without types entry for css import
import 'leaflet/dist/leaflet.css';

function MineTaskRow({ task }: { task: Task }) {
  const color = STATUS_COLOR[task.status] || '#6B7280';
  const deadline = new Date(task.deadline);
  return (
    <div className="px-4 py-2.5 flex items-center gap-3 border-b border-paper-100/60 last:border-0">
      <span className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-anthracite-950 truncate">{task.title}</p>
        <p className="text-[11px] text-anthracite-800/60 truncate">
          {task.owner.name} · {task.sourceCitation}
        </p>
      </div>
      {isValid(deadline) && (
        <span className="shrink-0 text-[11px] font-bold text-anthracite-800/70">
          {format(deadline, 'd MMM')}
        </span>
      )}
      <span
        className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border"
        style={{ color, backgroundColor: `${color}12`, borderColor: `${color}30` }}
      >
        {STATUS_LABEL[task.status] || task.status}
      </span>
    </div>
  );
}

export function MineDetail() {
  const { mineId } = useParams<{ mineId: string }>();
  const navigate = useNavigate();
  const { state } = useAppContext();
  const site = state.sites.find((s) => s.id === mineId);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('2D');
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<ComplianceViolation | null>(null);
  const [selectedTelemetry, setSelectedTelemetry] = useState<SimulatedTelemetrySensor | null>(null);

  const isPiparwar = mineId === 'MINE-001';
  const governance = useGisGovernance(state.tasks, site);

  const mineTasks = useMemo(
    () =>
      state.tasks
        .filter((t) => t.mineId === mineId)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
    [state.tasks, mineId],
  );

  const counts = useMemo(() => {
    const tasks = mineTasks;
    return {
      verified: tasks.filter((t) => t.status === 'VERIFIED').length,
      inProgress: tasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'].includes(t.status)).length,
      awaiting: tasks.filter((t) => t.status === 'AWAITING_VERIFICATION').length,
      overdue: tasks.filter((t) => ['OVERDUE', 'ESCALATED'].includes(t.status)).length,
      proposed: tasks.filter((t) => t.status === 'PROPOSED').length,
    };
  }, [mineTasks]);

  const recentEvidence = useMemo(() => {
    return mineTasks
      .flatMap((t) => t.evidenceItems.filter((ev) => ev.metadata).map((ev) => ({ task: t, ev })))
      .slice(0, 5);
  }, [mineTasks]);

  if (!site) {
    return (
      <div className="bg-white rounded-xl border border-paper-100 p-8 text-center">
        <p className="text-sm font-bold text-anthracite-950">Mine not found</p>
        <button onClick={() => navigate('/')} className="mt-3 text-xs font-bold text-steel">
          ← Back to dashboard
        </button>
      </div>
    );
  }

  const selectedTask = state.tasks.find((t) => t.id === selectedTaskId) ?? null;
  const overallState =
    counts.overdue > 0
      ? { label: 'Attention required', color: '#C1502E', bg: '#C1502E12' }
      : counts.inProgress + counts.awaiting > 0
      ? { label: 'Active compliance', color: '#F2A93B', bg: '#F2A93B12' }
      : { label: 'Nominal', color: '#4C7A66', bg: '#4C7A6612' };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <GovernanceObjectModal objectId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />

      {/* Compact identity header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-bold text-anthracite-800/60 hover:text-anthracite-950 mb-1.5"
          >
            <ArrowLeft size={13} /> Area dashboard
          </button>
          <h1 className="text-2xl font-display font-bold text-anthracite-950 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-anthracite-950 text-safety-amber flex items-center justify-center">
              <Mountain size={18} />
            </span>
            {site.fullName || site.name}
          </h1>
          <p className="text-anthracite-800/80 mt-1 flex items-center gap-2 flex-wrap text-[13px]">
            <span className="font-mono font-bold text-steel">{site.id}</span>
            <span>·</span>
            <span>{site.subsidiary}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {site.district}, {site.state} · {site.area}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-white border border-paper-100 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-anthracite-950 flex items-center gap-1.5">
            <Layers size={12} className="text-steel" /> {site.type === 'OC' ? 'Opencast' : 'Underground'}
          </span>
          <span className="bg-white border border-paper-100 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-anthracite-950 flex items-center gap-1.5">
            <Users size={12} className="text-steel" /> {site.workforce} workforce
          </span>
          <span
            className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1.5"
            style={{ color: overallState.color, backgroundColor: overallState.bg }}
          >
            <ShieldCheck size={12} />
            {overallState.label}
          </span>
        </div>
      </div>

      {/* Slim compliance status strip */}
      <div className="bg-white rounded-xl shadow-sm border border-paper-100 px-4 py-2.5 flex items-center gap-4 md:gap-6 overflow-x-auto">
        {[
          { label: 'Verified', value: counts.verified, color: '#4C7A66' },
          { label: 'In progress', value: counts.inProgress, color: '#F2A93B' },
          { label: 'Awaiting verification', value: counts.awaiting, color: '#4A7C9B' },
          { label: 'Overdue', value: counts.overdue, color: '#C1502E' },
          { label: 'In manager review', value: counts.proposed, color: '#8A9098' },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
            <span className="text-sm font-display font-bold text-anthracite-950">{stat.value}</span>
            <span className="text-[11px] font-semibold text-anthracite-800/60 uppercase tracking-wide">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* GIS — the centerpiece, full width, generous height */}
      {isPiparwar && governance ? (
        <div className="bg-white rounded-xl shadow-md border border-paper-100 overflow-hidden">
          <div className="bg-anthracite-950">
            <Header
              mine={MINE_001_DATA}
              governance={governance}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenProvenance={() => setProvenanceOpen(true)}
            />
          </div>
          <div className="h-[540px] lg:h-[640px] relative w-full">
            {viewMode === '2D' && (
              <Gis2DView
                mine={MINE_001_DATA}
                governance={governance}
                telemetry={MINE_001_SIMULATED_TELEMETRY}
                onSelectViolation={setSelectedViolation}
                onSelectTelemetry={setSelectedTelemetry}
                onOpenProvenance={() => setProvenanceOpen(true)}
              />
            )}
            {viewMode === '3D' && (
              <Terrain3DView
                mine={MINE_001_DATA}
                governance={governance}
                telemetry={MINE_001_SIMULATED_TELEMETRY}
                onSelectViolation={setSelectedViolation}
                onSelectTelemetry={setSelectedTelemetry}
                onOpenProvenance={() => setProvenanceOpen(true)}
              />
            )}
            {viewMode === 'SPLIT' && (
              <div className="grid grid-cols-2 w-full h-full divide-x divide-neutral-800">
                <div className="relative w-full h-full">
                  <Gis2DView
                    mine={MINE_001_DATA}
                    governance={governance}
                    telemetry={MINE_001_SIMULATED_TELEMETRY}
                    onSelectViolation={setSelectedViolation}
                    onSelectTelemetry={setSelectedTelemetry}
                    onOpenProvenance={() => setProvenanceOpen(true)}
                  />
                </div>
                <div className="relative w-full h-full">
                  <Terrain3DView
                    mine={MINE_001_DATA}
                    governance={governance}
                    telemetry={MINE_001_SIMULATED_TELEMETRY}
                    onSelectViolation={setSelectedViolation}
                    onSelectTelemetry={setSelectedTelemetry}
                    onOpenProvenance={() => setProvenanceOpen(true)}
                  />
                </div>
              </div>
            )}
            <ComplianceDrawer
              selectedViolation={selectedViolation}
              selectedTelemetry={selectedTelemetry}
              onClose={() => {
                setSelectedViolation(null);
                setSelectedTelemetry(null);
              }}
            />
            <DataProvenancePanel
              mine={MINE_001_DATA}
              governance={governance}
              telemetry={MINE_001_SIMULATED_TELEMETRY}
              isOpen={provenanceOpen}
              onClose={() => setProvenanceOpen(false)}
            />
          </div>
          {/* Small legend strip under the map */}
          <div className="flex items-center gap-4 md:gap-6 px-4 py-2 border-t border-paper-100 bg-paper-50 overflow-x-auto text-[10px] font-semibold text-anthracite-800/70">
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C1502E]" /> Compliance issue
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-sm border border-amber-400 bg-amber-400/20" /> Mine boundary
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/40 border border-sky-500" /> Monitoring zone
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 border border-neutral-500" /> Sensor [SIM]
            </span>
            <span className="ml-auto hidden md:inline shrink-0 text-anthracite-800/50 font-normal">
              Boundary & zones: Sentinel-2 / Copernicus DEM · markers: live SAMAADHAN tasks · telemetry: SIMULATED
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-paper-100 p-8 text-center flex flex-col items-center justify-center">
          <MapPin size={28} className="text-anthracite-800/30 mb-3" />
          <p className="text-sm font-bold text-anthracite-950">GIS survey layer — Piparwar OCP only</p>
          <p className="text-xs text-anthracite-800/60 mt-1 max-w-sm">
            The bundled 2D/3D GIS (Sentinel-2 boundary, Copernicus DEM terrain, pit zoning) covers the
            Piparwar demo anchor. Other mines appear on the area map.
          </p>
          <button
            onClick={() => navigate('/gis')}
            className="mt-4 text-xs font-bold text-steel border border-steel/25 rounded-lg px-3 py-2 hover:bg-steel/5"
          >
            Open area map
          </button>
        </div>
      )}

      {/* Compliance information below the map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-paper-100 bg-paper-50">
            <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
              <ShieldCheck size={15} className="text-steel" /> Obligations · {mineTasks.length}
            </div>
          </div>
          {mineTasks.length === 0 ? (
            <p className="px-5 py-6 text-xs text-anthracite-800/60">No obligations for this mine yet.</p>
          ) : (
            <div>
              {mineTasks.map((t) => (
                <button key={t.id} onClick={() => setSelectedTaskId(t.id)} className="w-full text-left">
                  <MineTaskRow task={t} />
                </button>
              ))}
            </div>
          )}
          <div className="px-5 py-2.5 border-t border-paper-100 bg-paper-50">
            <Link to="/compliance?mine=MINE-001" className="text-[11px] font-bold text-steel flex items-center gap-1">
              Open in governance register <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-paper-100 bg-paper-50">
            <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
              <BookOpen size={15} className="text-verdant" /> Latest field evidence
            </div>
          </div>
          {recentEvidence.length === 0 ? (
            <p className="px-5 py-6 text-xs text-anthracite-800/60">No geo-tagged evidence submitted yet.</p>
          ) : (
            <div className="divide-y divide-paper-100/60">
              {recentEvidence.map(({ task, ev }) => (
                <button
                  key={`${task.id}-${ev.id}`}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-paper-50 transition-colors"
                >
                  <p className="text-xs font-medium text-anthracite-950 truncate">{ev.title}</p>
                  <p className="text-[10px] text-anthracite-800/60 font-mono truncate">
                    {ev.metadata?.timestamp} · {ev.metadata?.gps}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
