import React from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface CountdownChipProps {
  hoursRemaining: number;
  shiftInfo: string;
  isOverdue?: boolean;
}

export const CountdownChip: React.FC<CountdownChipProps> = ({
  hoursRemaining,
  shiftInfo,
  isOverdue = false,
}) => {
  if (isOverdue || hoursRemaining < 0) {
    const daysOverdue = Math.abs(Math.round(hoursRemaining / 24)) || 1;
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-red-50 text-[#E53E3E] border border-red-200 text-xs font-bold tracking-tight">
        <AlertCircle className="w-3.5 h-3.5 text-[#E53E3E] shrink-0" />
        <span>Overdue {daysOverdue}d</span>
        <span className="text-red-400 font-normal">· {shiftInfo}</span>
      </span>
    );
  }

  if (hoursRemaining <= 24) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-red-50 text-[#E53E3E] border border-red-200 text-xs font-bold tracking-tight">
        <AlertTriangle className="w-3.5 h-3.5 text-[#E53E3E] shrink-0 animate-pulse" />
        <span>{hoursRemaining}h remaining</span>
        <span className="text-red-400 font-normal">({shiftInfo})</span>
      </span>
    );
  }

  if (hoursRemaining <= 72) {
    const days = Math.floor(hoursRemaining / 24);
    const hours = hoursRemaining % 24;
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-orange-50 text-[#DD6B20] border border-orange-200 text-xs font-semibold tracking-tight">
        <Clock className="w-3.5 h-3.5 text-[#DD6B20] shrink-0" />
        <span>{days}d {hours > 0 ? `${hours}h` : ''}</span>
        <span className="text-orange-600/80 font-normal">({shiftInfo})</span>
      </span>
    );
  }

  const days = Math.round(hoursRemaining / 24);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-slate-50 text-[#2D3748] border border-[#E2E8F0] text-xs font-medium tracking-tight">
      <Clock className="w-3.5 h-3.5 text-[#718096] shrink-0" />
      <span>{days}d remaining</span>
      <span className="text-[#718096]">({shiftInfo})</span>
    </span>
  );
};
