import React, { useState } from 'react';
import { Task } from '../types';
import {
  X,
  Clock,
  ArrowRight,
  Camera,
  FileText,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TaskDetailSheetProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onStartTask: (taskId: string) => void;
}

export const TaskDetailSheet: React.FC<TaskDetailSheetProps> = ({
  task,
  isOpen,
  onClose,
  onStartTask,
}) => {
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  if (!isOpen || !task) return null;

  const isOverdue = task.urgencyGroup === 'OVERDUE' || task.hoursRemaining < 0;

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Camera className="w-3.5 h-3.5 text-[#718096]" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-[#718096]" />;
      case 'register':
        return <BookOpen className="w-3.5 h-3.5 text-[#718096]" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-[#718096]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs select-none max-w-[430px] mx-auto overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div className="flex-1 w-full" onClick={onClose} />

      {/* Slide-up sheet */}
      <div className="relative w-full max-h-[85vh] bg-white rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Top bar with close button */}
        <div className="px-6 pt-2 pb-1 flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-[#718096]">
            {task.id}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#A0AEC0] hover:text-[#1A202C] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Content: Spacious, uncluttered, critical info only */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-5">
          {/* Critical: Title & Due Status */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-[#E53E3E]' : 'text-[#DD6B20]'}`} />
              <span className={isOverdue ? 'text-[#E53E3E] font-bold' : 'text-[#718096]'}>
                {task.deadlineDisplay}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#1A202C] leading-snug">
              {task.title}
            </h2>
          </div>

          {/* Extreme Critical: Rejection alert if applicable */}
          {task.rejectionReason && (
            <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-[#E53E3E] text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E53E3E]" />
              <span>Review note: {task.rejectionReason}</span>
            </div>
          )}

          {/* Critical: Action Summary */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#718096] mb-1.5">
              Action Required
            </div>
            <p className="text-xs text-[#2D3748] leading-relaxed">
              {task.remediationNotes ||
                `Conduct immediate compliance execution for ${task.title.toLowerCase()} and log verification evidence.`}
            </p>
          </div>

          {/* Critical: Required Evidence (Simplified checklist) */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#718096] mb-2">
              Evidence to Provide ({task.evidenceItems.length})
            </div>
            <div className="space-y-2">
              {task.evidenceItems.map((item, idx) => {
                const isUploaded = item.status === 'uploaded' || item.status === 'verified';
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-[12px] border border-[#E2E8F0] bg-[#F7FAFC] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getEvidenceIcon(item.type)}
                      <span className="font-semibold text-[#1A202C] truncate">
                        {idx + 1}. {item.title}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {isUploaded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#38A169]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Attached</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#A0AEC0] font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progressive Disclosure: Secondary details hidden behind clean toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreInfo(!showMoreInfo)}
              className="flex items-center gap-1.5 text-xs text-[#718096] font-medium hover:text-[#1A202C] transition-colors"
            >
              <span>{showMoreInfo ? 'Hide statutory citation' : 'View statutory citation & verifier'}</span>
              {showMoreInfo ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showMoreInfo && (
              <div className="mt-2.5 p-3 rounded-[12px] bg-slate-50 border border-[#E2E8F0] text-xs text-[#718096] space-y-1.5 animate-in fade-in duration-150">
                <div>
                  <strong className="text-[#2D3748]">Statutory Ref:</strong> {task.sourceCitation}
                </div>
                <div>
                  <strong className="text-[#2D3748]">Review Officer:</strong> {task.verifier}
                </div>
                <div>
                  <strong className="text-[#2D3748]">Domain:</strong> {task.domain}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Singular CTA */}
        <div className="p-5 border-t border-[#E2E8F0] bg-white">
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartTask(task.id);
            }}
            className="w-full h-12 rounded-[12px] bg-[#ECC94B] text-[#1A202C] font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs hover:bg-[#D69E2E] active:scale-98 transition-all cursor-pointer"
          >
            <span>Start Task</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
