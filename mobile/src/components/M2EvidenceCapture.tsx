import React, { useState } from 'react';
import { Task, EvidenceItem, SyncStatusType } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ConfirmationModal } from './ConfirmationModal';
import {
  ArrowLeft,
  Camera,
  FileText,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  HardDrive,
  Send,
  Upload,
  Clock,
} from 'lucide-react';

interface M2EvidenceCaptureProps {
  task: Task;
  syncStatus: SyncStatusType;
  onBack: () => void;
  onUpdateTask: (updatedTask: Task) => void;
}

export const M2EvidenceCapture: React.FC<M2EvidenceCaptureProps> = ({
  task,
  onBack,
  onUpdateTask,
}) => {
  const [isRequirementExpanded, setIsRequirementExpanded] = useState(false);
  const [remediationNotes, setRemediationNotes] = useState(task.remediationNotes || '');
  const [activeCapturingItem, setActiveCapturingItem] = useState<EvidenceItem | null>(null);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);

  const totalEvidence = task.evidenceItems.length;
  const uploadedEvidence = task.evidenceItems.filter(
    (item) => item.status === 'uploaded' || item.status === 'verified'
  ).length;

  const isAllEvidenceUploaded = uploadedEvidence === totalEvidence;
  const isNotesValid = remediationNotes.trim().length >= 15;
  const canSubmit = isAllEvidenceUploaded && isNotesValid;

  const isOverdue = task.urgencyGroup === 'OVERDUE' || task.hoursRemaining < 0;

  // Handle Photo Capture Completion
  const handleCaptureComplete = (data: {
    photoUrl: string;
    gps: string;
    sha256: string;
    timestamp: string;
  }) => {
    if (!activeCapturingItem) return;

    const updatedEvidenceItems = task.evidenceItems.map((item) => {
      if (item.id === activeCapturingItem.id) {
        return {
          ...item,
          status: 'uploaded' as const,
          photoUrl: data.photoUrl,
          metadata: {
            timestamp: data.timestamp,
            gps: data.gps,
            user: 'R. Singh (MSO-402)',
            sha256: data.sha256,
            fileSize: '3.1 MB',
          },
        };
      }
      return item;
    });

    onUpdateTask({
      ...task,
      evidenceItems: updatedEvidenceItems,
    });

    setActiveCapturingItem(null);
  };

  // Handle Document Simulation Upload
  const handleDocumentSimulatedUpload = (item: EvidenceItem) => {
    const updatedEvidenceItems = task.evidenceItems.map((ev) => {
      if (ev.id === item.id) {
        return {
          ...ev,
          status: 'uploaded' as const,
          fileName: `${ev.title.replace(/\s+/g, '_')}_signed.pdf`,
          metadata: {
            timestamp: new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            }) + ' IST',
            gps: '23.7957° N, 86.4304° E · Pit-4',
            user: 'R. Singh (MSO-402)',
            sha256: '992a8b1c43029fe87154210acbf9412',
            fileSize: '2.4 MB',
          },
        };
      }
      return ev;
    });

    onUpdateTask({
      ...task,
      evidenceItems: updatedEvidenceItems,
    });
  };

  const handleNotesChange = (val: string) => {
    setRemediationNotes(val);
    onUpdateTask({
      ...task,
      remediationNotes: val,
    });
  };

  const handleManualSaveDraft = () => {
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 2500);
  };

  const handleConfirmSubmit = () => {
    setIsSubmitConfirmOpen(false);

    onUpdateTask({
      ...task,
      status: 'AWAITING_VERIFICATION',
      urgencyGroup: 'AWAITING_VERIFICATION',
      isCriticalDoThisNext: false,
      submittedTimestamp: 'Just now (Shift III)',
      remediationNotes,
    });

    setTimeout(() => {
      onBack();
    }, 400);
  };

  const getEvidenceIcon = (type: EvidenceItem['type']) => {
    switch (type) {
      case 'photo':
        return <Camera className="w-4 h-4 text-[#718096]" />;
      case 'document':
        return <FileText className="w-4 h-4 text-[#718096]" />;
      case 'register':
        return <BookOpen className="w-4 h-4 text-[#718096]" />;
      default:
        return <FileText className="w-4 h-4 text-[#718096]" />;
    }
  };

  return (
    <div className="w-full pb-32 select-none bg-[#F7FAFC] min-h-screen">
      {/* 1. Consistent Light Top Navigation Header */}
      <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-5 py-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-[#718096] hover:text-[#1A202C] active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <span className="font-mono text-xs font-bold text-[#718096]">
            {task.id}
          </span>
        </div>
      </div>

      {/* Main Page Content */}
      <div className="px-5 pt-4 space-y-5">
        {draftSavedToast && (
          <div className="p-3 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Draft saved locally on device</span>
          </div>
        )}

        {/* 2. Critical Task Info: Title, Due Date, and Progress */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-[#E53E3E]' : 'text-[#DD6B20]'}`} />
            <span className={isOverdue ? 'text-[#E53E3E] font-bold' : 'text-[#718096]'}>
              {task.deadlineDisplay}
            </span>
          </div>

          <h1 className="text-xl font-bold text-[#1A202C] leading-snug">
            {task.title}
          </h1>

          {/* Minimal Progress Bar */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#718096]">
              <span className="font-medium">Evidence attached</span>
              <span className="font-bold text-[#1A202C]">
                {uploadedEvidence} / {totalEvidence}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#ECC94B] transition-all duration-300 rounded-full"
                style={{ width: `${(uploadedEvidence / totalEvidence) * 100}%` }}
              />
            </div>
          </div>

          {/* Progressive Disclosure: Collapsible Guidelines */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsRequirementExpanded(!isRequirementExpanded)}
              className="flex items-center gap-1.5 text-xs text-[#718096] font-medium hover:text-[#1A202C] transition-colors"
            >
              <span>{isRequirementExpanded ? 'Hide instructions' : 'View instructions & reference'}</span>
              {isRequirementExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {isRequirementExpanded && (
              <div className="mt-3 p-3.5 rounded-[12px] bg-[#F7FAFC] border border-[#E2E8F0] text-xs text-[#718096] space-y-2 animate-in fade-in duration-150">
                <div>
                  <strong className="text-[#2D3748]">Action:</strong>{' '}
                  {task.remediationNotes ||
                    `Execute compliance measures for ${task.title.toLowerCase()}.`}
                </div>
                <div>
                  <strong className="text-[#2D3748]">Statutory Ref:</strong> {task.sourceCitation}
                </div>
                <div>
                  <strong className="text-[#2D3748]">Reviewer:</strong> {task.verifier}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Evidence Capture Cards (Spacious & Clean) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">
              Required Evidence
            </span>
            <button
              type="button"
              onClick={handleManualSaveDraft}
              className="text-xs font-semibold text-[#718096] hover:text-[#1A202C] flex items-center gap-1 transition-colors"
            >
              <HardDrive className="w-3 h-3" />
              <span>Save draft</span>
            </button>
          </div>

          {task.evidenceItems.map((item, index) => {
            const isUploaded = item.status === 'uploaded' || item.status === 'verified';

            return (
              <div
                key={item.id}
                className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-xs space-y-3 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {getEvidenceIcon(item.type)}
                    <h3 className="text-sm font-bold text-[#1A202C] leading-snug">
                      {index + 1}. {item.title}
                    </h3>
                  </div>

                  {isUploaded && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#38A169] shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Attached</span>
                    </span>
                  )}
                </div>

                {/* Uploaded state vs Action button */}
                {isUploaded ? (
                  <div className="space-y-3">
                    {item.photoUrl ? (
                      <div className="relative rounded-[12px] overflow-hidden border border-[#E2E8F0] bg-slate-900">
                        <img
                          src={item.photoUrl}
                          alt={item.title}
                          className="w-full h-36 object-cover"
                        />
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-[#ECC94B]">
                          GEOTAGGED
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-[12px] bg-[#F7FAFC] border border-[#E2E8F0] flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-[#3182CE]" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#1A202C] truncate">
                            {item.fileName || 'Statutory_Record.pdf'}
                          </div>
                          <div className="text-[11px] text-[#718096]">Signed & verified</div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.type === 'photo') {
                            setActiveCapturingItem(item);
                          } else {
                            handleDocumentSimulatedUpload(item);
                          }
                        }}
                        className="text-xs font-semibold text-[#718096] hover:text-[#1A202C] flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retake</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {item.type === 'photo' ? (
                      <button
                        type="button"
                        onClick={() => setActiveCapturingItem(item)}
                        className="w-full py-3 px-4 rounded-[12px] bg-[#ECC94B] text-[#1A202C] font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-[#D69E2E] active:scale-98 transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-[#1A202C]" />
                        <span>Capture Photo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDocumentSimulatedUpload(item)}
                        className="w-full py-3 px-4 rounded-[12px] border border-[#E2E8F0] bg-white text-[#2D3748] font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-98 transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-[#718096]" />
                        <span>Attach Document</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 4. Notes Section (Spacious & Clean) */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="remediation-notes-input"
              className="text-xs font-bold uppercase tracking-wider text-[#2D3748]"
            >
              Field Remarks <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-[#718096]">
              {remediationNotes.length >= 15 ? (
                <span className="text-emerald-700 font-semibold">Ready</span>
              ) : (
                <span>Min 15 chars</span>
              )}
            </span>
          </div>

          <textarea
            id="remediation-notes-input"
            rows={3}
            value={remediationNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Briefly describe corrective measures taken..."
            className="w-full p-3.5 rounded-[12px] border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-hidden focus:border-[#ECC94B] min-h-[90px] resize-none leading-relaxed bg-[#F7FAFC]"
          />
        </div>
      </div>

      {/* 5. Sticky Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto p-4 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0]">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => setIsSubmitConfirmOpen(true)}
          className={`w-full h-13 rounded-[12px] font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-xs ${
            canSubmit
              ? 'bg-[#ECC94B] text-[#1A202C] hover:bg-[#D69E2E] active:scale-98 cursor-pointer'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>
            {canSubmit
              ? 'Submit for Verification'
              : !isAllEvidenceUploaded
              ? `Attach Evidence (${uploadedEvidence}/${totalEvidence})`
              : 'Add Field Remarks'}
          </span>
        </button>
      </div>

      {/* Interactive Camera Viewfinder Modal */}
      {activeCapturingItem && (
        <CameraCaptureModal
          isOpen={!!activeCapturingItem}
          itemTitle={activeCapturingItem.title}
          guidanceText={activeCapturingItem.guidance}
          onCaptureComplete={handleCaptureComplete}
          onClose={() => setActiveCapturingItem(null)}
        />
      )}

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={isSubmitConfirmOpen}
        title={`Submit ${task.id}?`}
        subtitle="This will forward your evidence packet to the Area Safety Officer for official sign-off."
        confirmLabel="Confirm & Submit"
        cancelLabel="Keep Editing"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setIsSubmitConfirmOpen(false)}
      />
    </div>
  );
};

