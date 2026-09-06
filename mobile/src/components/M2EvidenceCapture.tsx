import React, { useState } from 'react';
import { Task, EvidenceItem, SyncStatusType } from '../types';
import { GalleryPickerModal, GALLERY_FALLBACK_SVG } from './GalleryPickerModal';
import { ConfirmationModal } from './ConfirmationModal';
import {
  ArrowLeft,
  Images,
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
  AlertTriangle,
  Camera,
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
  const [activeGalleryItem, setActiveGalleryItem] = useState<EvidenceItem | null>(null);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>(task.formValues ?? {});

  const isLocked = task.status === 'VERIFIED' || task.status === 'AWAITING_VERIFICATION';

  const handleFormValueChange = (fieldId: string, value: string) => {
    setFormValues((prev) => {
      const next = { ...prev, [fieldId]: value };
      onUpdateTask({ ...task, formValues: next });
      return next;
    });
  };

  const totalEvidence = task.evidenceItems.length;
  const uploadedEvidence = task.evidenceItems.filter(
    (item) => item.status === 'uploaded' || item.status === 'verified'
  ).length;

  const isAllEvidenceUploaded = uploadedEvidence === totalEvidence;
  const isNotesValid = remediationNotes.trim().length >= 15;
  const canSubmit = isAllEvidenceUploaded && isNotesValid;

  const isOverdue = task.urgencyGroup === 'OVERDUE' || task.hoursRemaining < 0;

  // Handle gallery selection → attach photo as evidence (demo gallery, not a
  // device camera). GPS/timestamp/hash metadata remain part of the chain.
  const handleGalleryConfirm = (data: {
    photoUrl: string;
    gps: string;
    sha256: string;
    timestamp: string;
    photoLabel: string;
  }) => {
    if (!activeGalleryItem) return;

    const updatedEvidenceItems = task.evidenceItems.map((item) => {
      if (item.id === activeGalleryItem.id) {
        return {
          ...item,
          status: 'uploaded' as const,
          rejectionReason: undefined,
          photoUrl: data.photoUrl,
          metadata: {
            timestamp: data.timestamp,
            gps: data.gps,
            user: 'Ram Singh (MSO-402) · Piparwar OCP',
            sha256: data.sha256,
            fileSize: '2.8 MB',
          },
        };
      }
      return item;
    });

    onUpdateTask({
      ...task,
      evidenceItems: updatedEvidenceItems,
    });

    setActiveGalleryItem(null);
  };

  // Handle Document Simulation Upload
  const handleDocumentSimulatedUpload = (item: EvidenceItem) => {
    const updatedEvidenceItems = task.evidenceItems.map((ev) => {
      if (ev.id === item.id) {
        return {
          ...ev,
          status: 'uploaded' as const,
          rejectionReason: undefined,
          fileName: `${ev.title.replace(/\s+/g, '_')}_signed.pdf`,
          metadata: {
            timestamp: new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            }) + ' IST',
            gps: '23.6911° N, 85.0667° E · Bench 3B',
            user: 'Ram Singh (MSO-402) · Piparwar OCP',
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
      submittedTimestamp: 'Just now (Shift I)',
      remediationNotes,
      formValues,
      evidenceItems: task.evidenceItems.map((ev) =>
        ev.status === 'rejected' ? { ...ev, status: 'uploaded' as const } : ev,
      ),
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
            <span>Draft saved & synced</span>
          </div>
        )}

        {/* 2. Critical Task Info: Title, Due Date, and Progress */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-[#E53E3E]' : 'text-[#DD6B20]'}`} />
            <span className={isOverdue ? 'text-[#E53E3E] font-bold' : 'text-[#718096]'}>
              {task.status === 'AWAITING_VERIFICATION'
                ? 'Submitted · awaiting verification'
                : task.deadlineDisplay}
            </span>
          </div>

          <h1 className="text-xl font-bold text-[#1A202C] leading-snug">
            {task.title}
          </h1>

          {/* Rejection notice — verifier sent this back for correction */}
          {task.status === 'REJECTED' && task.rejectionReason && (
            <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-[#C53030] text-xs font-semibold space-y-1.5">
              <div className="flex items-center gap-2 uppercase tracking-wider text-[10px] font-extrabold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Action required — evidence returned by verifier
              </div>
              <p className="leading-relaxed">{task.rejectionReason}</p>
            </div>
          )}

          {/* Digital form (rule-defined fields; read-only pre-filled) */}
          {task.form && task.form.fields.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">
                {task.form.title}
              </div>
              {task.form.fields.map((f) => (
                <div key={f.id} className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#4A5568] flex items-center gap-2">
                    {f.label}
                    {f.readOnly && (
                      <span className="text-[9px] font-bold uppercase text-[#718096] bg-slate-100 rounded px-1">
                        pre-filled
                      </span>
                    )}
                  </label>
                  {f.type === 'select' ? (
                    <select
                      value={formValues[f.id] ?? f.value ?? ''}
                      disabled={f.readOnly || isLocked}
                      onChange={(e) => handleFormValueChange(f.id, e.target.value)}
                      className="w-full p-2.5 rounded-[10px] border border-[#E2E8F0] text-xs bg-[#F7FAFC] text-[#1A202C] focus:outline-hidden focus:border-[#ECC94B]"
                    >
                      <option value="">Select…</option>
                      {(f.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      rows={2}
                      value={formValues[f.id] ?? f.value ?? ''}
                      readOnly={f.readOnly || isLocked}
                      placeholder={f.placeholder}
                      onChange={(e) => handleFormValueChange(f.id, e.target.value)}
                      className="w-full p-2.5 rounded-[10px] border border-[#E2E8F0] text-xs bg-[#F7FAFC] text-[#1A202C] focus:outline-hidden focus:border-[#ECC94B] resize-none"
                    />
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : 'text'}
                      inputMode={f.type === 'number' ? 'decimal' : undefined}
                      value={formValues[f.id] ?? f.value ?? ''}
                      readOnly={f.readOnly || isLocked}
                      placeholder={f.placeholder}
                      onChange={(e) => handleFormValueChange(f.id, e.target.value)}
                      className="w-full p-2.5 rounded-[10px] border border-[#E2E8F0] text-xs bg-[#F7FAFC] text-[#1A202C] focus:outline-hidden focus:border-[#ECC94B]"
                    />
                  )}
                  {f.hint && <p className="text-[10px] text-[#DD6B20] font-medium">ⓘ {f.hint}</p>}
                </div>
              ))}
            </div>
          )}

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
            {!isLocked && (
              <button
                type="button"
                onClick={handleManualSaveDraft}
                className="text-xs font-semibold text-[#718096] hover:text-[#1A202C] flex items-center gap-1 transition-colors"
              >
                <HardDrive className="w-3 h-3" />
                <span>Save draft</span>
              </button>
            )}
          </div>

          {task.evidenceItems.map((item, index) => {
            const isUploaded = item.status === 'uploaded' || item.status === 'verified';
            const isRejected = item.status === 'rejected';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-[16px] border p-5 shadow-xs space-y-3 transition-all ${
                  isRejected ? 'border-red-200' : 'border-[#E2E8F0]'
                }`}
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
                      <span>{item.status === 'verified' ? 'Verified' : 'Attached'}</span>
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#C53030] shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Returned</span>
                    </span>
                  )}
                </div>

                {/* Per-item rejection reason — shows what to fix on this specific item */}
                {isRejected && item.rejectionReason && (
                  <div className="p-3 rounded-[10px] bg-red-50 border border-red-200 text-[#C53030] text-[11px] font-semibold flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Returned: {item.rejectionReason}</span>
                  </div>
                )}

                {/* Attached evidence vs action button */}
                {isUploaded || (isRejected && item.photoUrl) ? (
                  <div className="space-y-3">
                    {item.photoUrl ? (
                      <div className="relative rounded-[12px] overflow-hidden border border-[#E2E8F0] bg-[#F0F2F5]">
                        <img
                          src={item.photoUrl}
                          alt={item.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = GALLERY_FALLBACK_SVG;
                          }}
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
                          <div className="text-[11px] text-[#718096]">
                            {item.status === 'verified' ? 'Verified record' : 'Signed & attached'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata strip — GPS · timestamp · hash, always visible */}
                    {item.metadata && (
                      <div className="p-3 rounded-[10px] bg-[#F7FAFC] border border-[#E2E8F0] space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2D3748]">
                          <Clock className="w-3 h-3 text-[#718096]" />
                          Captured {item.metadata.timestamp}
                        </div>
                        <div className="text-[10px] font-mono text-[#718096]">
                          GPS {item.metadata.gps}
                        </div>
                        <div className="text-[10px] font-mono text-[#A0AEC0]">
                          SHA-256 {item.metadata.sha256} · {item.metadata.user}
                        </div>
                      </div>
                    )}

                    {/* Replace photo (gallery again) — hidden when locked */}
                    {!isLocked && item.type === 'photo' && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveGalleryItem(item)}
                          className="text-xs font-semibold text-[#718096] hover:text-[#1A202C] flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Replace photo</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {item.type === 'photo' ? (
                      <button
                        type="button"
                        onClick={() => setActiveGalleryItem(item)}
                        className="w-full py-3 px-4 rounded-[12px] bg-[#ECC94B] text-[#1A202C] font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-[#D69E2E] active:scale-98 transition-all cursor-pointer"
                      >
                        <Images className="w-4 h-4 text-[#1A202C]" />
                        <span>Choose from Gallery</span>
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
                    <p className="text-[10px] text-[#A0AEC0] mt-2 text-center">
                      Demo gallery · geo-tag & time-stamp applied on attach
                    </p>
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
            readOnly={isLocked}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Briefly describe corrective measures taken..."
            className="w-full p-3.5 rounded-[12px] border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-hidden focus:border-[#ECC94B] min-h-[90px] resize-none leading-relaxed bg-[#F7FAFC]"
          />
        </div>
      </div>

      {/* 5. Sticky Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto p-4 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0]">
        {isLocked ? (
          <div
            className={`w-full h-13 rounded-[12px] font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 ${
              task.status === 'VERIFIED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-[#F0F2F5] text-[#4A7C9B] border border-[#E2E8F0]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {task.status === 'VERIFIED' ? 'Verified & Closed' : 'Submitted · Under Verification'}
            </span>
          </div>
        ) : (
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
              {task.status === 'REJECTED'
                ? 'Resubmit for Verification'
                : canSubmit
                ? 'Submit for Verification'
                : !isAllEvidenceUploaded
                ? `Attach Evidence (${uploadedEvidence}/${totalEvidence})`
                : 'Add Field Remarks'}
            </span>
          </button>
        )}
      </div>

      {/* Demo gallery picker (no camera simulation anywhere) */}
      {activeGalleryItem && (
        <GalleryPickerModal
          isOpen={!!activeGalleryItem}
          itemTitle={activeGalleryItem.title}
          gpsHint={activeGalleryItem.gpsHint}
          onConfirm={handleGalleryConfirm}
          onClose={() => setActiveGalleryItem(null)}
        />
      )}

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={isSubmitConfirmOpen}
        title={`Submit ${task.id}?`}
        subtitle="This will forward your evidence packet to the Regulatory Official for independent verification."
        confirmLabel="Confirm & Submit"
        cancelLabel="Keep Editing"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setIsSubmitConfirmOpen(false)}
      />
    </div>
  );
};
