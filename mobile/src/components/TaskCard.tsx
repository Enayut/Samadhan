import React from 'react';
import { Task } from '../types';
import { ArrowRight, Clock, ChevronRight } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onSelectTask: (taskId: string) => void;
  onOpenDetails?: (task: Task) => void;
  isHero?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelectTask,
  onOpenDetails,
  isHero = false,
}) => {
  const isOverdue = task.urgencyGroup === 'OVERDUE' || task.hoursRemaining < 0;

  // Format friendly deadline string
  const getDeadlineText = () => {
    if (task.status === 'VERIFIED') return `Closed ${task.closedDate || ''}`;
    if (task.status === 'AWAITING_VERIFICATION') return 'Submitted · Under Review';
    if (task.status === 'REJECTED') return 'Correction Required';
    if (isOverdue) {
      const days = Math.max(1, Math.floor(Math.abs(task.hoursRemaining) / 24));
      return `Overdue by ${days}d`;
    }
    if (task.hoursRemaining <= 24) return 'Due today';
    if (task.hoursRemaining <= 48) return 'Due in 2 days';
    const days = Math.ceil(task.hoursRemaining / 24);
    return `Due in ${days} days`;
  };

  // HERO CARD VARIANT (M0)
  // Minimal, spacious layout: Only task title, Due indicator, and singular primary CTA button.
  // All other metadata is hidden behind a click action.
  if (isHero) {
    return (
      <div
        id={`hero-${task.id}`}
        onClick={() => {
          if (onOpenDetails) {
            onOpenDetails(task);
          } else {
            onSelectTask(task.id);
          }
        }}
        className="w-full bg-white rounded-[18px] border border-[#E2E8F0] p-6 shadow-xs hover:border-[#ECC94B] transition-all cursor-pointer select-none active:scale-[0.99] group flex flex-col justify-between min-h-[160px]"
      >
        <div className="space-y-2">
          {/* Due Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#718096]">
            <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-[#E53E3E]' : 'text-[#DD6B20]'}`} />
            <span className={isOverdue ? 'text-[#E53E3E] font-bold' : 'text-[#2D3748]'}>
              {getDeadlineText()}
            </span>
          </div>

          {/* Task Title */}
          <h2 className="text-[17px] font-bold text-[#1A202C] leading-snug">
            {task.shortTitle || task.title}
          </h2>
        </div>

        {/* Bottom: Singular Primary Call-To-Action Button */}
        <div className="pt-4 flex items-center justify-between">
          <span className="text-[11px] text-[#A0AEC0] group-hover:text-[#718096] transition-colors">
            Tap card for details
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTask(task.id);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#ECC94B] text-[#1A202C] font-extrabold text-xs shadow-xs active:bg-[#D69E2E] hover:bg-[#D69E2E] transition-all cursor-pointer"
          >
            <span>Start Task</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // WORK QUEUE CARD VARIANT (M1)
  // Spacious, smooth, and uncluttered: no overwhelming tags, just clean title, due indicator, and smooth navigation.
  return (
    <div
      id={`task-card-${task.id}`}
      onClick={() => {
        if (onOpenDetails) {
          onOpenDetails(task);
        } else {
          onSelectTask(task.id);
        }
      }}
      className="w-full bg-white rounded-[14px] border border-[#E2E8F0] p-4.5 transition-all cursor-pointer select-none active:scale-[0.99] hover:border-slate-300 group shadow-xs space-y-2.5"
    >
      {/* Title */}
      <h3 className="text-[15px] font-bold text-[#1A202C] leading-snug">
        {task.title}
      </h3>

      {/* Due Indicator and Chevron */}
      <div className="flex items-center justify-between text-xs text-[#718096] pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 font-medium">
          <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-[#E53E3E]' : 'text-[#718096]'}`} />
          <span className={isOverdue ? 'text-[#E53E3E] font-semibold' : 'text-[#4A5568]'}>
            {getDeadlineText()}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[#A0AEC0] group-hover:text-[#4A5568] transition-colors">
          <span className="text-[11px]">Details</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};

