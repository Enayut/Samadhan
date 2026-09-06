import React, { useState } from 'react';
import { Task, QueueFilter } from '../types';
import { TaskCard } from './TaskCard';
import { TaskDetailSheet } from './TaskDetailSheet';
import {
  PlusCircle,
  ListTodo,
  Hourglass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface M0HomeProps {
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  onNavigateToQueue: (filter?: QueueFilter) => void;
  onOpenReport: () => void;
}

export const M0Home: React.FC<M0HomeProps> = ({
  tasks,
  onSelectTask,
  onNavigateToQueue,
  onOpenReport,
}) => {
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // Regulatory rejection → ACTION REQUIRED banner (top of home)
  const rejectedTasks = tasks.filter(
    (t) => (t.status === 'REJECTED' || t.evidenceItems.some((ev) => ev.status === 'rejected')) &&
      t.status !== 'VERIFIED'
  );

  // Find the critical hero task (rejections take priority — correction first)
  const heroTask = rejectedTasks[0] ?? tasks.find((t) => t.isCriticalDoThisNext && t.status !== 'VERIFIED');

  // Compute key summary metrics (clean, low-density)
  const pendingTasks = tasks.filter(
    (t) =>
      !['VERIFIED', 'AWAITING_VERIFICATION', 'ASSIGNED'].includes(t.status) &&
      !rejectedTasks.includes(t)
  );
  const overdueCount = tasks.filter(
    (t) => t.urgencyGroup === 'OVERDUE' || t.hoursRemaining < 0
  ).length;
  const awaitingCount = tasks.filter((t) => t.status === 'AWAITING_VERIFICATION').length;

  return (
    <div className="w-full pb-28 px-4 pt-4 select-none space-y-6">
      {/* 0. ACTION REQUIRED — regulatory rejection banner */}
      {rejectedTasks.length > 0 && (
        <section aria-label="Action required">
          <button
            type="button"
            onClick={() => onSelectTask(rejectedTasks[0].id)}
            className="w-full text-left bg-red-50 rounded-[16px] border border-red-200 p-5 shadow-xs space-y-2 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-[#E53E3E]" />
              <span className="text-xs font-extrabold tracking-widest uppercase text-[#E53E3E]">
                Action Required · Evidence returned
              </span>
            </div>
            <p className="text-sm font-bold text-[#1A202C] leading-snug">
              {rejectedTasks[0].shortTitle || rejectedTasks[0].title}
            </p>
            {rejectedTasks[0].rejectionReason && (
              <p className="text-xs text-[#E53E3E] font-medium leading-relaxed">
                Verifier: {rejectedTasks[0].rejectionReason}
              </p>
            )}
            <p className="text-[11px] text-[#718096] flex items-center gap-1">
              Tap to correct and resubmit <ArrowRight className="w-3 h-3" />
            </p>
          </button>
        </section>
      )}

      {/* 1. DOMINANT HERO CARD ("DO THIS NEXT") */}
      <section aria-label="Hero action">
        {heroTask ? (
          <TaskCard
            task={heroTask}
            onSelectTask={onSelectTask}
            onOpenDetails={(t) => setDetailTask(t)}
            isHero={true}
          />
        ) : (
          <div className="w-full bg-white rounded-[16px] border border-[#E2E8F0] p-6 text-center shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-[#38A169] mx-auto mb-2" />
            <h2 className="text-base font-bold text-[#1A202C]">All clear for this shift</h2>
            <p className="text-xs text-[#718096] mt-1">
              No immediate critical obligations pending.
            </p>
          </div>
        )}
      </section>

      {/* 2. QUICK ACTIONS (Clean 2-column action grid) */}
      <section aria-label="Quick actions" className="space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-[#718096] px-0.5">
          Quick Actions
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Action 1: Report Observation */}
          <button
            type="button"
            onClick={onOpenReport}
            className="flex flex-col items-start justify-between p-4 rounded-[14px] bg-white border border-[#E2E8F0] hover:border-[#ECC94B] shadow-xs active:scale-[0.98] transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-[#ECC94B]/20 text-[#1A202C] flex items-center justify-center mb-3 group-hover:bg-[#ECC94B] transition-colors">
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#1A202C] leading-tight">
                Report Observation
              </div>
              <div className="text-xs text-[#718096] mt-0.5">Capture field hazard</div>
            </div>
          </button>

          {/* Action 2: My Queue */}
          <button
            type="button"
            onClick={() => onNavigateToQueue('ALL')}
            className="flex flex-col items-start justify-between p-4 rounded-[14px] bg-white border border-[#E2E8F0] hover:border-slate-300 shadow-xs active:scale-[0.98] transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 text-[#2D3748] flex items-center justify-center mb-3 group-hover:bg-slate-200 transition-colors">
              <ListTodo className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#1A202C] leading-tight">
                My Queue
              </div>
              <div className="text-xs text-[#718096] mt-0.5">
                {pendingTasks.length} action{pendingTasks.length === 1 ? '' : 's'} pending
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* 3. OPERATIONAL SUMMARY (ONE Clean Summary Card) */}
      <section aria-label="Work summary">
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1A202C] tracking-tight">
              My Work Overview
            </h2>
            {overdueCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] tracking-wide uppercase">
                {overdueCount} Overdue
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 py-1 border-y border-[#E2E8F0]">
            <div>
              <div className="text-2xl font-extrabold text-[#1A202C] font-mono tracking-tight">
                {pendingTasks.length + rejectedTasks.length}
              </div>
              <div className="text-xs text-[#718096] font-medium mt-0.5">
                Pending execution
              </div>
            </div>

            <div>
              <div className="text-2xl font-extrabold text-[#3182CE] font-mono tracking-tight">
                {awaitingCount}
              </div>
              <div className="text-xs text-[#718096] font-medium mt-0.5">
                Awaiting sign-off
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToQueue('ALL')}
            className="w-full flex items-center justify-between text-xs font-bold text-[#2D3748] hover:text-[#1A202C] pt-0.5 group"
          >
            <span>View all items in queue</span>
            <ArrowRight className="w-4 h-4 text-[#718096] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* 4. OPTIONAL SECONDARY SUMMARY CARD (Shift Status & Telemetry) */}
      <section aria-label="Shift details">
        <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#1A202C]">Shift I Active</div>
              <div className="text-[11px] text-[#718096]">Bench 3B · Piparwar OCP · Chatra</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#38A169] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#38A169]" />
            <span>Telemetry OK</span>
          </div>
        </div>
      </section>

      {/* Task Detail Sheet (Progressive Disclosure bottom sheet when hero is tapped) */}
      <TaskDetailSheet
        task={detailTask}
        isOpen={!!detailTask}
        onClose={() => setDetailTask(null)}
        onStartTask={onSelectTask}
      />
    </div>
  );
};
