import React, { useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Zap, ZapOff, Crosshair } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  itemTitle: string;
  guidanceText: string;
  onCaptureComplete: (data: {
    photoUrl: string;
    gps: string;
    sha256: string;
    timestamp: string;
  }) => void;
  onClose: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  itemTitle,
  guidanceText,
  onCaptureComplete,
  onClose,
}) => {
  const [step, setStep] = useState<'viewfinder' | 'captured' | 'uploading'>('viewfinder');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Generate dynamic mock photo data
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStep('viewfinder');
      setUploadProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTriggerShutter = () => {
    // Generate an authentic industrial/document mock vector photo
    const isDoc = itemTitle.toLowerCase().includes('sheet') || itemTitle.toLowerCase().includes('register') || itemTitle.toLowerCase().includes('licence');
    
    const svgContent = isDoc
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
          <rect width="400" height="300" fill="%232D3748"/>
          <rect x="30" y="20" width="340" height="260" rx="4" fill="%23FFFFFF" stroke="%23ECC94B" stroke-width="2"/>
          <rect x="50" y="40" width="200" height="14" fill="%231A202C"/>
          <rect x="50" y="65" width="300" height="4" fill="%23E2E8F0"/>
          <rect x="50" y="80" width="280" height="8" fill="%23718096"/>
          <rect x="50" y="100" width="290" height="8" fill="%23718096"/>
          <rect x="50" y="120" width="260" height="8" fill="%23718096"/>
          <line x1="50" y1="145" x2="350" y2="145" stroke="%23CBD5E0" stroke-width="1"/>
          <rect x="50" y="160" width="100" height="40" fill="%23EDF2F7" stroke="%23A0AEC0"/>
          <circle cx="280" cy="180" r="24" fill="none" stroke="%2338A169" stroke-width="2"/>
          <text x="280" y="184" fill="%2338A169" font-family="sans-serif" font-size="8" text-anchor="middle" font-weight="bold">DGMS VERIFIED</text>
          <text x="50" y="240" fill="%23718096" font-family="monospace" font-size="9">SHA256: e8b941...2390</text>
          <text x="50" y="255" fill="%23718096" font-family="monospace" font-size="9">GPS: 23.7957° N, 86.4304° E</text>
        </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
          <rect width="400" height="300" fill="%231A202C"/>
          <path d="M0 240 L120 180 L220 210 L340 160 L400 200 L400 300 L0 300 Z" fill="%232D3748"/>
          <rect x="140" y="130" width="110" height="70" fill="%23ECC94B" rx="4"/>
          <rect x="155" y="145" width="40" height="30" fill="%232D3748"/>
          <circle cx="165" cy="205" r="14" fill="%231A202C" stroke="%23718096" stroke-width="3"/>
          <circle cx="225" cy="205" r="14" fill="%231A202C" stroke="%23718096" stroke-width="3"/>
          <text x="200" y="275" fill="%23ECC94B" font-family="monospace" font-size="10" text-anchor="middle" font-weight="bold">BENCH #4 REVERSING TEST · 23.7957° N, 86.4304° E</text>
        </svg>`;

    setCapturedPhotoUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`);
    setStep('captured');
  };

  const handleConfirmUsePhoto = () => {
    setStep('uploading');
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setUploadProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onCaptureComplete({
            photoUrl: capturedPhotoUrl,
            gps: '23.7957° N, 86.4304° E (Pit-4 Bench-2)',
            sha256: '7fa3b9281e04c10a489bce918f4312d980a37b12',
            timestamp: new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            }) + ' IST',
          });
          onClose();
        }, 300);
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none max-w-[430px] mx-auto">
      {/* Top HUD Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-md z-10 text-white">
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-[#ECC94B]">
            DGMS Evidence Capture
          </div>
          <div className="text-[11px] text-slate-300 font-mono">
            GPS Lock: ±2.4m · 23.7957°N
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFlashEnabled(!flashEnabled)}
          className={`p-2 rounded-full ${
            flashEnabled ? 'bg-[#ECC94B] text-black' : 'bg-white/10 text-white'
          }`}
        >
          {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
        </button>
      </div>

      {/* Viewfinder Main View */}
      <div className="relative flex-1 bg-[#1A202C] flex items-center justify-center overflow-hidden">
        {step === 'viewfinder' ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Viewfinder background simulation */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ECC94B_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Target reticle & framing brackets */}
            <div className="relative w-[82%] h-[68%] border-2 border-dashed border-[#ECC94B] rounded-[8px] flex flex-col items-center justify-between p-4 pointer-events-none">
              <div className="w-full flex justify-between">
                <div className="w-5 h-5 border-t-3 border-l-3 border-[#ECC94B]"></div>
                <div className="w-5 h-5 border-t-3 border-r-3 border-[#ECC94B]"></div>
              </div>

              <div className="flex flex-col items-center text-center px-2 py-1 bg-black/60 rounded-[6px] backdrop-blur-xs">
                <Crosshair className="w-6 h-6 text-[#ECC94B] mb-1 animate-spin" />
                <span className="text-xs font-bold text-white tracking-wide">
                  {itemTitle}
                </span>
                <span className="text-[11px] text-[#ECC94B] mt-0.5 max-w-[220px]">
                  {guidanceText}
                </span>
              </div>

              <div className="w-full flex justify-between">
                <div className="w-5 h-5 border-b-3 border-l-3 border-[#ECC94B]"></div>
                <div className="w-5 h-5 border-b-3 border-r-3 border-[#ECC94B]"></div>
              </div>
            </div>

            {/* Simulated laser scan line */}
            <div className="absolute top-16 left-8 right-8 h-0.5 bg-[#ECC94B]/70 shadow-[0_0_12px_#ECC94B] animate-scan pointer-events-none"></div>
          </div>
        ) : (
          /* Captured Photo Preview */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            <img
              src={capturedPhotoUrl}
              alt="Evidence Capture"
              className="max-h-[75%] rounded-[8px] border-2 border-[#ECC94B] shadow-lg"
            />
            {step === 'uploading' ? (
              <div className="w-full max-w-xs mt-4 bg-black/80 p-3 rounded-[8px] text-center">
                <div className="text-xs font-bold text-[#ECC94B] mb-1">
                  Hashing SHA-256 & Uploading ({uploadProgress}%)
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#ECC94B] h-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-center text-xs text-white">
                <div className="font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>Image captured with Exif & GNSS tag</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Ready to attach to statutory evidence chain.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Shutter / Action Controls */}
      <div className="px-6 py-6 bg-black/90 flex items-center justify-around z-10">
        {step === 'viewfinder' ? (
          <>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 text-xs font-semibold py-2 px-3 rounded hover:text-white"
            >
              Cancel
            </button>

            {/* Circular shutter button */}
            <button
              type="button"
              onClick={handleTriggerShutter}
              aria-label="Capture photo"
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform bg-white/20 hover:bg-white/30"
            >
              <div className="w-13 h-13 rounded-full bg-[#ECC94B] shadow-inner"></div>
            </button>

            <button
              type="button"
              onClick={handleTriggerShutter}
              className="text-xs text-[#ECC94B] font-semibold py-2 px-2 hover:underline"
            >
              Simulate Shot
            </button>
          </>
        ) : step === 'captured' ? (
          <div className="w-full flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep('viewfinder')}
              className="flex-1 py-3 px-4 rounded-[8px] bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmUsePhoto}
              className="flex-1 py-3 px-4 rounded-[8px] bg-[#ECC94B] text-[#1A202C] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#D69E2E]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Use Photo</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#ECC94B]" />
            <span>Cryptographic sealing in progress...</span>
          </div>
        )}
      </div>
    </div>
  );
};
