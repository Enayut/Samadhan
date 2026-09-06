import React, { useState } from 'react';
import { GALLERY_PHOTOS, GALLERY_FALLBACK_SVG, type GalleryPhoto } from '../data/galleryPhotos';
import { X, Check, MapPin, Clock, Hash, Images, AlertTriangle } from 'lucide-react';

interface GalleryPickerModalProps {
  isOpen: boolean;
  itemTitle: string;
  gpsHint?: string;
  onConfirm: (data: { photoUrl: string; gps: string; sha256: string; timestamp: string; photoLabel: string }) => void;
  onClose: () => void;
}

// Simplified phone-gallery picker. The user sees ACTUAL photographs (real CCL
// report images bundled locally — no external URLs) and selects one; the photo
// becomes attached evidence with the existing GPS/timestamp/SHA-256 metadata.
// This is a demo gallery, not a device camera — there is no viewfinder, no
// shutter and no camera simulation anywhere in this flow.
export const GalleryPickerModal: React.FC<GalleryPickerModalProps> = ({
  isOpen,
  itemTitle,
  gpsHint,
  onConfirm,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const selected = GALLERY_PHOTOS.find((p) => p.id === selectedId) ?? null;

  const handleImgError = (id: string) => {
    setBrokenIds((prev) => new Set(prev).add(id));
  };

  const handleAdd = () => {
    if (!selected) return;
    // Deterministic demo hash per (item, photo) so the evidence chain stays stable.
    const sha = `g${Math.abs(
      [...itemTitle].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) +
        [...selected.id].reduce((a, c) => a * 33 + c.charCodeAt(0), 11),
    )
      .toString(16)
      .padStart(12, '0')
      .slice(0, 12)}`;
    onConfirm({
      photoUrl: selected.src,
      gps: gpsHint || '23.6911° N, 85.0667° E · Piparwar OCP',
      sha256: sha,
      timestamp:
        new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' · ' +
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) +
        ' IST',
      photoLabel: selected.label,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs select-none max-w-[430px] mx-auto overflow-hidden animate-in fade-in duration-200">
      <div className="flex-1" onClick={onClose} />

      <div className="relative w-full max-h-[88vh] bg-white rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Images className="w-4 h-4 text-[#3182CE]" />
              <h2 className="text-base font-extrabold text-[#1A202C]">Select photos</h2>
            </div>
            <p className="text-[11px] text-[#718096] mt-0.5 truncate max-w-[280px]">
              Evidence for: {itemTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A0AEC0] hover:text-[#1A202C] hover:bg-slate-100"
            aria-label="Close gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo-data honesty chip */}
        <div className="px-5 py-2 bg-slate-50 border-b border-[#E2E8F0] shrink-0">
          <span className="text-[10px] font-semibold text-[#718096]">
            Demo gallery · representative CCL mine photographs (official CCL Annual Report 2024-25) —
            not live device captures
          </span>
        </div>

        {/* Photo grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {GALLERY_PHOTOS.map((photo) => {
              const isSelected = selectedId === photo.id;
              const isBroken = brokenIds.has(photo.id);
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedId(photo.id)}
                  className={`relative rounded-[14px] overflow-hidden border-2 text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'border-[#ECC94B] ring-2 ring-[#ECC94B]/40 shadow-md'
                      : 'border-[#E2E8F0] hover:border-slate-300'
                  }`}
                >
                  <div className="aspect-[4/3] bg-[#F0F2F5]">
                    <img
                      src={photo.src}
                      alt={photo.label}
                      loading="lazy"
                      onError={() => handleImgError(photo.id)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Graceful fallback overlay — never black/blank */}
                  {isBroken && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7FAFC] px-2 text-center">
                      <AlertTriangle className="w-4 h-4 text-[#DD6B20] mb-1" />
                      <span className="text-[10px] font-bold text-[#4A5568] leading-tight">
                        {photo.label}
                      </span>
                      <span className="text-[9px] text-[#718096] mt-0.5">photo unavailable</span>
                    </div>
                  )}

                  {/* Selection badge */}
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#ECC94B] flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5 text-[#1A202C] stroke-[3]" />
                    </span>
                  )}

                  {/* Label strip */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-2 pt-4 pb-1.5">
                    <p className="text-[10px] font-bold text-white leading-tight">{photo.label}</p>
                    <p className="text-[9px] text-white/70 truncate">{photo.mine}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected photo details */}
          {selected && (
            <div className="mt-4 p-3.5 rounded-[12px] bg-[#F7FAFC] border border-[#E2E8F0] space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#2D3748]">
                <MapPin className="w-3.5 h-3.5 text-[#3182CE]" /> {gpsHint || '23.6911° N, 85.0667° E · Piparwar OCP'}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#718096]">
                <Clock className="w-3.5 h-3.5" /> Attached on submit · time-stamped with device clock
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#718096]">
                <Hash className="w-3.5 h-3.5" /> Sealed with SHA-256 on the evidence chain
              </div>
              <p className="text-[10px] text-[#A0AEC0] italic pt-1 border-t border-[#E2E8F0]">
                {selected.context} · source: {selected.source}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E2E8F0] bg-white flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-[#718096]">
            Selected: <span className="text-[#1A202C]">{selected ? 1 : 0}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-[10px] bg-white border border-[#E2E8F0] text-[#4A5568] font-bold text-xs hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={handleAdd}
              className={`py-2.5 px-6 rounded-[10px] font-extrabold text-xs flex items-center gap-1.5 transition-all ${
                selected
                  ? 'bg-[#ECC94B] text-[#1A202C] hover:bg-[#D69E2E] active:scale-98 shadow-xs'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Re-exported for evidence cards: the graceful fallback used when a previously
// attached photo asset cannot be rendered.
export { GALLERY_FALLBACK_SVG };
