import React, { useState } from 'react';
import { Task, QueueFilter, DomainType } from '../types';
import { TaskCard } from './TaskCard';
import { TaskDetailSheet } from './TaskDetailSheet';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
  RotateCcw,
} from 'lucide-react';

interface M1QueueProps {
  tasks: Task[];
  initialFilter?: QueueFilter;
  initialDomainFilter?: DomainType | null;
  onSelectTask: (taskId: string) => void;
  onOpenReport: () => void;
  onClearDomainFilter?: () => void;
}

export const M1Queue: React.FC<M1QueueProps> = ({
  tasks,
  initialFilter = 'ALL',
  initialDomainFilter = null,
  onSelectTask,
  onOpenReport,
  onClearDomainFilter,
}) => {
  const [activeFilter, setActiveFilter] = useState<QueueFilter>(initialFilter);
  const [domainFilter, setDomainFilter] = useState<DomainType | null>(initialDomainFilter);
  const [showFilters, setShowFilters] = useState(false);
  const [isClosedSectionOpen, setIsClosedSectionOpen] = useState(false);
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);

  const domains: DomainType[] = [
    'SAFETY',
    'ENVIRONMENT',
    'PRODUCTION',
    'LABOUR',
    'CONTRACTOR',
    'GRIEVANCE',
  ];

  // Apply filters
  const filteredTasks = tasks.filter((task) => {
    if (domainFilter && task.domain !== domainFilter) {
      return false;
    }

    switch (activeFilter) {
      case 'CRITICAL':
        return (
          task.isCriticalDoThisNext ||
          task.urgencyGroup === 'OVERDUE' ||
          task.hoursRemaining < 0 ||
          task.status === 'ESCALATED'
        );
      case 'DUE_3D':
        return (
          task.urgencyGroup === 'DUE_SOON' ||
          (task.hoursRemaining > 0 && task.hoursRemaining <= 72)
        );
      case 'VERIFYING':
        return task.status === 'AWAITING_VERIFICATION';
      case 'CLOSED':
        return task.status === 'VERIFIED';
      case 'ALL':
      default:
        return true;
    }
  });

  // Urgency Buckets
  const overdueTasks = filteredTasks.filter(
    (t) => t.urgencyGroup === 'OVERDUE' || t.hoursRemaining < 0 || t.status === 'ESCALATED'
  );
  const dueSoonTasks = filteredTasks.filter(
    (t) =>
      (t.urgencyGroup === 'DUE_SOON' || t.status === 'IN_PROGRESS') &&
      t.hoursRemaining > 0 &&
      t.status !== 'AWAITING_VERIFICATION' &&
      t.status !== 'VERIFIED'
  );
  const verifyingTasks = filteredTasks.filter((t) => t.status === 'AWAITING_VERIFICATION');
  const closedTasks = filteredTasks.filter((t) => t.status === 'VERIFIED');

  const hasActiveFilters = activeFilter !== 'ALL' || domainFilter !== null;

  const handleResetFilters = () => {
    setActiveFilter('ALL');
    setDomainFilter(null);
    if (onClearDomainFilter) onClearDomainFilter();
  };

  const filterOptions: { id: QueueFilter; label: string; count?: number }[] = [
    { id: 'ALL', label: 'All Tasks', count: tasks.length },
    {
      id: 'CRITICAL',
      label: 'Critical',
      count: tasks.filter(
        (t) => t.urgencyGroup === 'OVERDUE' || t.hoursRemaining < 0 || t.status === 'ESCALATED'
      ).length,
    },
    {
      id: 'DUE_3D',
      label: 'Due ≤ 3d',
      count: tasks.filter((t) => t.hoursRemaining > 0 && t.hoursRemaining <= 72).length,
    },
    {
      id: 'VERIFYING',
      label: 'Under Review',
      count: tasks.filter((t) => t.status === 'AWAITING_VERIFICATION').length,
    },
    {
      id: 'CLOSED',
      label: 'Closed',
      count: tasks.filter((t) => t.status === 'VERIFIED').length,
    },
  ];

  return (
    <div className="w-full pb-28 select-none">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A202C] tracking-tight">Work Queue</h1>
          <p className="text-xs text-[#718096] mt-0.5">
            {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Toggle Button (hides options by default) */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-bold border transition-all active:scale-95 ${
              showFilters || hasActiveFilters
                ? 'bg-[#2D3748] text-[#ECC94B] border-[#2D3748] shadow-xs'
                : 'bg-white text-[#718096] border-[#E2E8F0] hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#ECC94B]" />
            )}
          </button>

          {/* Report Button */}
          <button
            type="button"
            onClick={onOpenReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#ECC94B] text-[#1A202C] font-bold text-xs shadow-xs hover:bg-[#D69E2E] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Active Filter Pill (Visible only when filters are active and panel is collapsed) */}
      {hasActiveFilters && !showFilters && (
        <div className="mx-5 mb-3 px-3 py-2 rounded-[10px] bg-slate-100/90 border border-slate-200 flex items-center justify-between text-xs animate-in fade-in duration-150">
          <span className="text-[#4A5568] font-medium">
            Filtered: {activeFilter !== 'ALL' && <strong className="text-[#1A202C] capitalize mr-1">{activeFilter.toLowerCase()}</strong>}
            {domainFilter && <strong className="text-[#1A202C]">({domainFilter})</strong>}
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[#E53E3E] font-bold hover:underline"
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* Expandable Filter Panel (Hidden by default) */}
      {showFilters && (
        <div className="mx-5 mb-4 p-4 rounded-[14px] bg-white border border-[#E2E8F0] shadow-sm space-y-3.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1A202C] tracking-wide">
              Filter Queue
            </span>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-[#E53E3E] flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="text-xs font-bold text-[#718096] hover:text-[#1A202C] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Section */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#718096] mb-2">
              Status
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.map((chip) => {
                const isSelected = activeFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActiveFilter(chip.id)}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-[#ECC94B] text-[#1A202C] border-[#D69E2E] font-bold'
                        : 'bg-white text-[#718096] border-[#E2E8F0] hover:bg-slate-50'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Domain Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#718096] mb-2">
              Domain
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setDomainFilter(null);
                  if (onClearDomainFilter) onClearDomainFilter();
                }}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold border transition-all ${
                  domainFilter === null
                    ? 'bg-[#2D3748] text-white border-[#2D3748]'
                    : 'bg-white text-[#718096] border-[#E2E8F0] hover:bg-slate-50'
                }`}
              >
                All Domains
              </button>
              {domains.map((dom) => (
                <button
                  key={dom}
                  type="button"
                  onClick={() => setDomainFilter(dom === domainFilter ? null : dom)}
                  className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold border transition-all ${
                    domainFilter === dom
                      ? 'bg-[#2D3748] text-white border-[#2D3748]'
                      : 'bg-white text-[#718096] border-[#E2E8F0] hover:bg-slate-50'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Task List Content */}
      <div className="px-5 space-y-6">
        {/* 1. OVERDUE SECTION */}
        {overdueTasks.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <div className="text-xs font-bold text-[#E53E3E] tracking-wider uppercase">
                Overdue · {overdueTasks.length}
              </div>
            </div>

            <div className="space-y-3">
              {overdueTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSelectTask={onSelectTask}
                  onOpenDetails={(t) => setSelectedDetailTask(t)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 2. DUE SOON SECTION */}
        {dueSoonTasks.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <div className="text-xs font-bold text-[#718096] tracking-wider uppercase">
                Due Soon · {dueSoonTasks.length}
              </div>
            </div>

            <div className="space-y-3">
              {dueSoonTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSelectTask={onSelectTask}
                  onOpenDetails={(t) => setSelectedDetailTask(t)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 3. AWAITING VERIFICATION SECTION */}
        {verifyingTasks.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <div className="text-xs font-bold text-[#3182CE] tracking-wider uppercase">
                Under Review · {verifyingTasks.length}
              </div>
            </div>

            <div className="space-y-3">
              {verifyingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSelectTask={onSelectTask}
                  onOpenDetails={(t) => setSelectedDetailTask(t)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 4. RECENTLY CLOSED (Collapsible) */}
        {closedTasks.length > 0 && (
          <section className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setIsClosedSectionOpen(!isClosedSectionOpen)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-[10px] bg-slate-50 border border-[#E2E8F0] hover:bg-slate-100 transition-colors"
            >
              <span className="text-xs font-bold text-[#718096] uppercase tracking-wider">
                Closed · {closedTasks.length}
              </span>
              <div className="flex items-center gap-1 text-xs text-[#718096]">
                <span>{isClosedSectionOpen ? 'Hide' : 'Show'}</span>
                {isClosedSectionOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {isClosedSectionOpen && (
              <div className="space-y-3 pt-1">
                {closedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelectTask={onSelectTask}
                    onOpenDetails={(t) => setSelectedDetailTask(t)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Empty state */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 px-4 bg-white rounded-[14px] border border-[#E2E8F0]">
            <p className="text-sm font-bold text-[#1A202C]">No tasks found</p>
            <p className="text-xs text-[#718096] mt-1">
              Adjust your filters to view other statutory obligations.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 px-3.5 py-2 rounded-[8px] bg-[#ECC94B] text-[#1A202C] text-xs font-bold"
            >
              Show All Tasks
            </button>
          </div>
        )}
      </div>

      {/* Task Detail Sheet for progressive disclosure */}
      <TaskDetailSheet
        task={selectedDetailTask}
        isOpen={!!selectedDetailTask}
        onClose={() => setSelectedDetailTask(null)}
        onStartTask={onSelectTask}
      />
    </div>
  );
};

