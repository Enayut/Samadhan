import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  subtitle: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  subtitle,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-[360px] bg-white rounded-[12px] border border-[#E2E8F0] shadow-xl p-5 select-none animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              isDestructive ? 'bg-red-100 text-[#E53E3E]' : 'bg-amber-100 text-[#DD6B20]'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A202C] leading-snug">{title}</h3>
            <p className="text-xs text-[#718096] mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-[8px] border border-[#E2E8F0] text-xs font-semibold text-[#718096] hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-[8px] text-xs font-bold transition-colors ${
              isDestructive
                ? 'bg-[#E53E3E] text-white hover:bg-red-700'
                : 'bg-[#ECC94B] text-[#1A202C] hover:bg-[#D69E2E]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
