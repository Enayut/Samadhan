import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../store/AppContext';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, FileCheck, ShieldAlert, FileText, ArrowRight, Activity, CalendarClock, Sparkles, BrainCircuit } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { GovernanceObjectModal } from '../components/GovernanceObjectModal';
import { GovernanceObject, GovStatus } from '../types';

export function Dashboard() {
  const { state } = useAppContext();
  const { role } = state;
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <GovernanceObjectModal objectId={selectedObjId} onClose={() => setSelectedObjId(null)} />
      
      <AlertBanner />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-anthracite-950">
            {role === 'Mine Manager' || role.includes('Officer') || role === 'Mine Engineer' ? 'Mine Dashboard' : role === 'Corporate Management' ? 'Corporate Oversight' : 'Regulatory Dashboard'}
          </h1>
          <p className="text-anthracite-800/80 mt-1">Real-time governance and compliance metrics.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-paper-50 px-4 py-2 rounded-lg border border-paper-100/50 shadow-sm flex flex-col items-end">
            <span className="text-xs text-anthracite-800 uppercase tracking-wider font-bold">Sync Status</span>
            <span className="text-sm font-medium text-verdant flex items-center gap-1"><CheckCircle2 size={14} /> SYNCED</span>
          </div>
          {role === 'Regulatory Authority' && (
            <div className="bg-[#C1502E]/10 px-4 py-2 rounded-lg border border-[#C1502E]/20 shadow-sm flex flex-col items-end">
               <span className="text-xs text-[#C1502E] uppercase tracking-wider font-bold">Mode</span>
               <span className="text-sm font-medium text-[#C1502E]">SIMULATION</span>
            </div>
          )}
        </div>
      </div>

      <DashboardContent onOpenModal={setSelectedObjId} />
    </div>
  );
}

const STATUS_COLORS: Record<GovStatus, string> = {
  'Closed': '#4C7A66',       // Green
  'Submitted': '#4A7C9B',    // Blue
  'In Progress': '#F2A93B',  // Amber
  'Rejected': '#A93226',     // Dark red — returned to owner
  'Overdue': '#C1502E',      // Red
  'Escalated': '#C1502E'     // Red
};

function AlertBanner() {
  const { state } = useAppContext();
  // The banner tracks the DGMS safety alert hero (first in the inbox).
  const heroEntry =
    state.pipeline.alerts.find((p) => p.alert.kind === 'dgms-alert') ?? state.pipeline.alerts[0];
  const alert = heroEntry?.alert ?? null;
  const fanout = (heroEntry?.fanout as { governanceObjects?: number } | null) ?? null;
  const processed = !!heroEntry?.extraction;
  const receivedCount = state.pipeline.alerts.filter((p) => p.alert.status === 'received').length;

  if (state.loading) {
    return (
      <div className="bg-white rounded-xl border border-paper-100 shadow-sm p-6 flex items-center justify-center gap-3 text-anthracite-800/60">
        <BrainCircuit size={18} className="animate-pulse text-steel" />
        <span className="text-sm font-medium">Loading demo state…</span>
      </div>
    );
  }

  const confirmed = !!fanout;
  const alertTitle = alert?.title || 'DGMS Safety Alert 23/2026';

  let bannerTitle: string;
  let bannerAction: string;
  if (confirmed) {
    bannerTitle = `${alertTitle} — ${fanout?.governanceObjects ?? 183} governance obligations created across 61 mines`;
    bannerAction = 'Open Alert Intelligence';
  } else if (processed) {
    bannerTitle = `${alertTitle} — AI extraction complete, awaiting confirmation`;
    bannerAction = 'Review Extraction';
  } else {
    bannerTitle = `${alertTitle} is awaiting AI processing`;
    bannerAction = 'Process with AI';
  }

  return (
    <div
      className={`rounded-xl border shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        confirmed ? 'bg-verdant/5 border-verdant/25' : 'bg-safety-amber/5 border-safety-amber/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg shrink-0 ${
            confirmed ? 'bg-verdant/10 text-verdant' : 'bg-safety-amber/10 text-safety-amber'
          }`}
        >
          {confirmed ? <CheckCircle2 size={20} /> : <Sparkles size={20} />}
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-anthracite-800/60">
            Active DGMS Alert · {alert?.ref || 'DGMS/2026/SA-041'}
            {receivedCount > 0 && ` · ${receivedCount} alert${receivedCount === 1 ? '' : 's'} awaiting AI`}
          </div>
          <p className="text-sm font-medium text-anthracite-950 mt-0.5">{bannerTitle}</p>
        </div>
      </div>
      <Link
        to="/intake"
        className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors ${
          confirmed
            ? 'bg-verdant hover:bg-verdant/90 text-white'
            : 'bg-anthracite-950 hover:bg-anthracite-800 text-paper-50'
        }`}
      >
        {bannerAction} <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function DashboardContent({ onOpenModal }: { onOpenModal: (id: string) => void }) {
  const { state } = useAppContext();
  const { govObjects } = state;

  const summaryData = useMemo(() => {
    const closed = govObjects.filter(o => o.status === 'Closed').length;
    const submitted = govObjects.filter(o => o.status === 'Submitted').length;
    // Rejected items are reopened and awaiting owner correction — they belong in the open bucket.
    const inProgress = govObjects.filter(o => o.status === 'In Progress' || o.status === 'Rejected').length;
    const escalatedOrOverdue = govObjects.filter(o => o.status === 'Escalated' || o.status === 'Overdue').length;

    return [
      { name: 'Verified Closed', value: closed, color: STATUS_COLORS['Closed'], status: 'Closed' },
      { name: 'Awaiting Verification', value: submitted, color: STATUS_COLORS['Submitted'], status: 'Submitted' },
      { name: 'In Progress', value: inProgress, color: STATUS_COLORS['In Progress'], status: 'In Progress' },
      { name: 'Overdue / Escalated', value: escalatedOrOverdue, color: STATUS_COLORS['Overdue'], status: 'Overdue' }
    ];
  }, [govObjects]);

  const domainData = useMemo(() => {
    const domains = ['Safety', 'Environment', 'Production', 'Labour', 'Contractor', 'Grievance'];
    return domains.map(domain => {
      const objects = govObjects.filter(o => o.domain === domain);
      return {
        domain,
        Closed: objects.filter(o => o.status === 'Closed').length,
        Submitted: objects.filter(o => o.status === 'Submitted').length,
        'In Progress': objects.filter(o => o.status === 'In Progress' || o.status === 'Rejected').length,
        'Overdue/Escalated': objects.filter(o => o.status === 'Escalated' || o.status === 'Overdue').length,
      };
    }).filter(d => d.Closed > 0 || d.Submitted > 0 || d['In Progress'] > 0 || d['Overdue/Escalated'] > 0);
  }, [govObjects]);

  const recentTasks = [...govObjects].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 8);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryData.map(stat => (
          <motion.div key={stat.name} variants={cardVariants} className="bg-white p-6 rounded-xl shadow-sm border border-paper-100 flex flex-col relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: stat.color }}></div>
             <p className="text-sm font-medium text-anthracite-800 mb-2 pl-2">{stat.name}</p>
             <p className="text-3xl font-display font-bold text-anthracite-950 pl-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Compliance By Status (Pie Chart) */}
        <motion.div variants={cardVariants} className="bg-white p-6 rounded-xl shadow-sm border border-paper-100">
          <h2 className="text-lg font-display font-semibold mb-4 border-b border-paper-100 pb-2 text-anthracite-950">Status Overview</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summaryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1D2329', color: '#FAF8F3', border: 'none', borderRadius: '6px', fontFamily: 'Poppins' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontFamily: 'Poppins', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Compliance By Domain (Bar Chart) */}
        <motion.div variants={cardVariants} className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-paper-100">
          <h2 className="text-lg font-display font-semibold mb-4 border-b border-paper-100 pb-2 text-anthracite-950">Task Distribution by Domain</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="domain" axisLine={false} tickLine={false} tick={{fill: '#586069', fontFamily: 'Poppins', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#586069', fontFamily: 'Poppins', fontSize: 12}} />
                <RechartsTooltip cursor={{fill: '#F1EEE6'}} contentStyle={{ backgroundColor: '#1D2329', color: '#FAF8F3', border: 'none', borderRadius: '6px', fontFamily: 'Poppins' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontFamily: 'Poppins', fontSize: '12px' }} />
                <Bar dataKey="Closed" stackId="a" fill={STATUS_COLORS['Closed']} />
                <Bar dataKey="Submitted" stackId="a" fill={STATUS_COLORS['Submitted']} />
                <Bar dataKey="In Progress" stackId="a" fill={STATUS_COLORS['In Progress']} />
                <Bar dataKey="Overdue/Escalated" stackId="a" fill={STATUS_COLORS['Overdue']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* Actionable List */}
      <motion.div variants={cardVariants} className="bg-white p-6 rounded-xl shadow-sm border border-paper-100">
        <div className="flex justify-between items-center border-b border-paper-100 pb-4 mb-4">
          <h2 className="text-lg font-display font-semibold text-anthracite-950">Governance Action Items</h2>
          <button className="text-sm text-steel hover:text-steel/80 font-medium flex items-center gap-1 transition-colors">
            View All <ArrowRight size={16} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-anthracite-800 border-b border-paper-100">
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Domain & Source</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Title</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Owner</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Deadline</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map((task) => (
                <motion.tr 
                  key={task.id}
                  whileHover={{ backgroundColor: '#F8F9FA' }}
                  onClick={() => onOpenModal(task.id)}
                  className="border-b border-paper-100/50 last:border-0 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-anthracite-950">{task.domain}</span>
                      <span className="text-xs text-anthracite-800">{task.source}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-anthracite-950">{task.title}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="text-anthracite-950">{task.owner.name}</span>
                      <span className="text-xs text-anthracite-800">{task.owner.role}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-anthracite-950">
                      <CalendarClock size={14} className="text-anthracite-800/70" />
                      {format(new Date(task.deadline), 'MMM dd')}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span 
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border`}
                      style={{
                        backgroundColor: `${STATUS_COLORS[task.status]}15`,
                        color: STATUS_COLORS[task.status],
                        borderColor: `${STATUS_COLORS[task.status]}30`
                      }}
                    >
                      {task.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
