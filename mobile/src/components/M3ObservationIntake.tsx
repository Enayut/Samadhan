import React, { useState } from 'react';
import { Task } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { GalleryPickerModal, GALLERY_FALLBACK_SVG } from './GalleryPickerModal';
import {
  X,
  Images,
  RefreshCw,
  MapPin,
  Send,
  CheckCircle2,
  HardHat,
  Trees,
  Shield,
  Users,
} from 'lucide-react';

interface M3ObservationIntakeProps {
  onClose: () => void;
  onCreateObservationTask: (newTask: Task) => void;
}

type CategoryType =
  | 'Safety Observation'
  | 'Environment Anomaly'
  | 'Labour Grievance'
  | 'Contractor Violation';

type SeverityType = 'Low' | 'Medium' | 'High';

export const M3ObservationIntake: React.FC<M3ObservationIntakeProps> = ({
  onClose,
  onCreateObservationTask,
}) => {
  const [step, setStep] = useState<'sheet'>('sheet');
  const [isGalleryOpen, setIsGalleryOpen] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoLabel, setPhotoLabel] = useState<string>('');
  const locationLabel = 'Pit 4 · Bench 2';

  // Form states in Step 2
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [severity, setSeverity] = useState<SeverityType>('Medium');
  const [description, setDescription] = useState('');
  const [isSubmittingConfirmOpen, setIsSubmittingConfirmOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleGalleryConfirm = (data: { photoUrl: string; photoLabel: string; gps: string; sha256: string; timestamp: string }) => {
    setPhotoUrl(data.photoUrl);
    setPhotoLabel(data.photoLabel);
    setIsGalleryOpen(false);
  };

  const isFormValid = !!category && description.trim().length >= 8;

  const handleConfirmCreate = () => {
    setIsSubmittingConfirmOpen(false);

    let domain: Task['domain'] = 'SAFETY';
    if (category === 'Environment Anomaly') domain = 'ENVIRONMENT';
    else if (category === 'Labour Grievance') domain = 'LABOUR';
    else if (category === 'Contractor Violation') domain = 'CONTRACTOR';

    const newTask: Task = {
      id: `OBS-${Math.floor(100 + Math.random() * 900)}`,
      title: description.trim(),
      domain,
      status: 'DUE_SOON',
      urgencyGroup: severity === 'High' ? 'OVERDUE' : 'DUE_SOON',
      deadlineDate: 'Today',
      deadlineDisplay: 'Due in 24h · Shift III',
      shiftInfo: 'Shift III',
      hoursRemaining: severity === 'High' ? 12 : 24,
      sourceCitation: 'Field Spot Observation · Reg. 182 CMR 2017',
      owner: 'Ram Singh (MSO)',
      verifier: 'Mine Manager',
      escalationRule: 'Escalates to Mine Manager in 12h',
      isCriticalDoThisNext: severity === 'High',
      remediationNotes: '',
      evidenceItems: [
        {
          id: `ev-obs-1`,
          title: 'Initial Condition Photo',
          type: 'photo',
          status: photoUrl ? 'uploaded' : 'pending',
          guidance: 'Photograph hazardous condition or equipment',
          photoUrl: photoUrl || undefined,
          metadata: photoUrl
            ? {
                timestamp: new Date().toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }) + ' IST',
                gps: '23.6911° N, 85.0667° E · Piparwar OCP',
                user: 'R. Singh (MSO-402)',
                sha256: '9a8b1c098df765e43a21b098',
              }
            : undefined,
        },
      ],
    };

    setShowSuccessToast(true);
    setTimeout(() => {
      onCreateObservationTask(newTask);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-xs select-none max-w-[430px] mx-auto overflow-hidden">
      {/* Visually Minimal Classification Sheet */}
      <div className="relative w-full max-h-[90vh] bg-white rounded-t-[20px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
          <div className="w-10 h-1 rounded-full bg-slate-300"></div>
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#1A202C]">Log Observation</h2>
            <div className="flex items-center gap-1 text-[11px] text-[#718096] mt-0.5">
              <MapPin className="w-3 h-3 text-[#E53E3E]" />
              <span>{locationLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#718096] hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Photo preview or add photo from demo gallery */}
          {photoUrl ? (
            <div className="p-2.5 rounded-[10px] bg-slate-50 border border-[#E2E8F0] space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src={photoUrl}
                  alt={photoLabel || 'Observation'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = GALLERY_FALLBACK_SVG;
                  }}
                  className="w-14 h-14 object-cover rounded-[8px] bg-[#F0F2F5]"
                />
                <div className="flex-1 text-xs min-w-0">
                  <div className="font-bold text-[#1A202C] truncate">{photoLabel || 'Photo Attached'}</div>
                  <div className="text-[11px] text-[#718096]">Tagged at {locationLabel}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGalleryOpen(true)}
                  className="text-xs font-semibold text-[#718096] hover:text-[#1A202C] px-2 py-1 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="w-full p-3 rounded-[10px] border border-dashed border-[#E2E8F0] text-xs font-semibold text-[#718096] flex items-center justify-center gap-2 hover:bg-slate-50"
            >
              <Images className="w-4 h-4" />
              <span>Choose field photo from gallery (optional)</span>
            </button>
          )}

          {/* Category */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#718096] block mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { name: 'Safety Observation', icon: Shield },
                  { name: 'Environment Anomaly', icon: Trees },
                  { name: 'Labour Grievance', icon: Users },
                  { name: 'Contractor Violation', icon: HardHat },
                ] as const
              ).map(({ name, icon: Icon }) => {
                const isSelected = category === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCategory(name)}
                    className={`p-3 rounded-[10px] border text-left flex items-center gap-2.5 transition-all text-xs font-bold ${
                      isSelected
                        ? 'bg-[#ECC94B] text-[#1A202C] border-[#D69E2E] shadow-xs'
                        : 'bg-white text-[#2D3748] border-[#E2E8F0] hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#1A202C]' : 'text-[#718096]'}`} />
                    <span className="leading-tight">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#718096] block mb-2">
              Severity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as SeverityType[]).map((level) => {
                const isSelected = severity === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    className={`py-2 px-3 rounded-[8px] text-xs font-bold border text-center transition-all ${
                      isSelected
                        ? level === 'High'
                          ? 'bg-[#E53E3E] text-white border-red-700'
                          : level === 'Medium'
                          ? 'bg-[#DD6B20] text-white border-orange-700'
                          : 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-[#718096] border-[#E2E8F0] hover:bg-slate-50'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="obs-desc"
              className="text-xs font-bold uppercase tracking-wider text-[#718096] block mb-1.5"
            >
              Description
            </label>
            <textarea
              id="obs-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what you observed..."
              className="w-full p-3 rounded-[10px] border border-[#E2E8F0] text-xs text-[#1A202C] focus:outline-hidden focus:border-[#ECC94B] min-h-[80px] resize-none leading-relaxed bg-[#F7FAFC]"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="p-4 border-t border-[#E2E8F0] bg-white">
          <button
            type="button"
            disabled={!isFormValid}
            onClick={() => setIsSubmittingConfirmOpen(true)}
            className={`w-full h-13 rounded-[10px] text-xs font-extrabold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-sm ${
              isFormValid
                ? 'bg-[#ECC94B] text-[#1A202C] hover:bg-[#D69E2E] active:scale-98 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Submit Observation</span>
          </button>
        </div>
      </div>

      {/* Demo gallery picker — opens first so a photo can be chosen, and again for "Change" */}
      <GalleryPickerModal
        isOpen={isGalleryOpen}
        itemTitle="Field observation photo"
        gpsHint="23.6911° N, 85.0667° E · Piparwar OCP"
        onConfirm={handleGalleryConfirm}
        onClose={() => {
          if (photoUrl) {
            setIsGalleryOpen(false);
          } else {
            onClose();
          }
        }}
      />

      <ConfirmationModal
        isOpen={isSubmittingConfirmOpen}
        title={`Log ${category}?`}
        subtitle="This assigns the observation to the Mine Manager for review."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleConfirmCreate}
        onCancel={() => setIsSubmittingConfirmOpen(false)}
      />

      {showSuccessToast && (
        <div className="absolute top-6 left-4 right-4 z-50 p-3 rounded-[10px] bg-[#2D3748] text-white text-xs font-bold flex items-center gap-2 shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-[#38A169]" />
          <span>Observation submitted successfully</span>
        </div>
      )}
    </div>
  );
};
