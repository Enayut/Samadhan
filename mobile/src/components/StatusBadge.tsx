import React from 'react';
import { TaskStatus } from '../types';
import { AlertCircle, Clock, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus;
  escalationLevel?: 'ESCALATED_L1' | 'ESCALATED_L2';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, escalationLevel }) => {
  if (escalationLevel || status === 'ESCALATED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-red-100 text-[#E53E3E] border border-red-300 text-[11px] font-bold tracking-wider uppercase">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E53E3E]"></span>
        </span>
        <span>{escalationLevel || 'ESCALATED'}</span>
      </span>
    );
  }

  switch (status) {
    case 'OVERDUE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-red-50 text-[#E53E3E] border border-red-200 text-[11px] font-bold tracking-wider uppercase">
          <AlertCircle className="w-3 h-3" />
          <span>OVERDUE</span>
        </span>
      );
    case 'DUE_SOON':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-orange-50 text-[#DD6B20] border border-orange-200 text-[11px] font-semibold tracking-wider uppercase">
          <Clock className="w-3 h-3" />
          <span>DUE SOON</span>
        </span>
      );
    case 'AWAITING_VERIFICATION':
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-50 text-[#3182CE] border border-blue-200 text-[11px] font-semibold tracking-wider uppercase">
          <ArrowUpRight className="w-3 h-3" />
          <span>SUBMITTED · VERIFYING</span>
        </span>
      );
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-50 text-[#38A169] border border-emerald-200 text-[11px] font-bold tracking-wider uppercase">
          <CheckCircle2 className="w-3 h-3" />
          <span>VERIFIED · CLOSED</span>
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-rose-50 text-[#E53E3E] border border-rose-300 text-[11px] font-bold tracking-wider uppercase">
          <XCircle className="w-3 h-3" />
          <span>REJECTED</span>
        </span>
      );
    default:
      return null;
  }
};
