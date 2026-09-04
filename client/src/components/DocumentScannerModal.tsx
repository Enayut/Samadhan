import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, ScanLine, CheckCircle2, AlertTriangle, X, ShieldAlert, FileCheck } from 'lucide-react';

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentScannerModal({ isOpen, onClose }: DocumentScannerModalProps) {
  const [step, setStep] = useState<'upload' | 'scanning' | 'verify'>('upload');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [docType, setDocType] = useState('Environmental Clearance (EC)');
  const [licenseNo, setLicenseNo] = useState('EC-2023-882O-XYZ'); // Intentional OCR error (O instead of 0)
  const [issueDate, setIssueDate] = useState('2023-04-15');
  const [expiryDate, setExpiryDate] = useState('2028-04-14');
  const [authority, setAuthority] = useState('MoEFCC');

  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setProgress(0);
    }
  }, [isOpen]);

  const handleSimulateScan = () => {
    setStep('scanning');
    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 12) + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setStep('verify'), 800);
      }
      setProgress(p);
    }, 300);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSimulateScan();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-anthracite-950/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-paper-50 w-full max-w-2xl rounded-2xl shadow-2xl border border-paper-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-paper-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-steel/10 p-2 rounded-lg text-steel">
              <ScanLine size={24} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-anthracite-950">AI Document Scanner</h2>
              <p className="text-sm text-anthracite-800/70">Upload compliance certificates for automated data extraction.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-anthracite-800/50 hover:text-anthracite-950 transition-colors p-2 rounded-full hover:bg-paper-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 flex-1 overflow-y-auto bg-paper-50">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: UPLOAD */}
            {step === 'upload' && (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div 
                  className="w-full max-w-lg border-2 border-dashed border-paper-100/80 rounded-xl p-12 flex flex-col items-center justify-center bg-white hover:border-steel/50 transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
                  <div className="bg-paper-50 group-hover:bg-steel/10 transition-colors p-4 rounded-full mb-4">
                    <Upload size={32} className="text-steel" />
                  </div>
                  <h3 className="text-lg font-bold text-anthracite-950 mb-1">Drag & Drop or Click to Upload</h3>
                  <p className="text-sm text-anthracite-800/70 text-center max-w-xs">Supports PDF, PNG, JPG. The AI engine will automatically extract key metadata.</p>
                </div>
                <div className="flex items-center gap-4 mt-8 w-full max-w-lg">
                  <div className="h-px bg-paper-100 flex-1"></div>
                  <span className="text-xs font-bold text-anthracite-800/50 uppercase tracking-wider">OR</span>
                  <div className="h-px bg-paper-100 flex-1"></div>
                </div>
                <button 
                  onClick={handleSimulateScan}
                  className="mt-8 bg-anthracite-950 hover:bg-anthracite-800 text-paper-50 px-6 py-3 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  <FileText size={18} />
                  Simulate Document Scan
                </button>
              </motion.div>
            )}

            {/* STEP 2: SCANNING */}
            {step === 'scanning' && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="relative w-48 h-64 bg-white rounded-lg shadow-md border border-paper-100 overflow-hidden mb-8">
                  {/* Fake document lines */}
                  <div className="absolute inset-4 space-y-3 opacity-30">
                    <div className="h-4 bg-anthracite-800 rounded w-3/4"></div>
                    <div className="h-2 bg-anthracite-800 rounded w-full"></div>
                    <div className="h-2 bg-anthracite-800 rounded w-5/6"></div>
                    <div className="h-2 bg-anthracite-800 rounded w-full"></div>
                    <div className="h-8"></div>
                    <div className="h-2 bg-anthracite-800 rounded w-1/2"></div>
                    <div className="h-2 bg-anthracite-800 rounded w-2/3"></div>
                  </div>
                  
                  {/* Laser Scan Line */}
                  <motion.div 
                    className="absolute left-0 right-0 h-1 bg-steel shadow-[0_0_15px_#4A7C9B]"
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div 
                    className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent to-steel/20 pointer-events-none"
                    initial={{ top: '-32px' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                
                <h3 className="text-xl font-bold text-anthracite-950 mb-2">Analyzing Document...</h3>
                <p className="text-sm text-anthracite-800 mb-6">Running optical character recognition and field mapping</p>
                
                <div className="w-full max-w-md bg-paper-100 rounded-full h-2.5 overflow-hidden">
                  <motion.div 
                    className="bg-steel h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut" }}
                  ></motion.div>
                </div>
                <div className="mt-2 text-xs font-bold text-steel">{progress}% Complete</div>
              </motion.div>
            )}

            {/* STEP 3: VERIFY */}
            {step === 'verify' && (
              <motion.div 
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="bg-safety-amber/10 border border-safety-amber/30 rounded-lg p-4 flex gap-3 items-start">
                  <ShieldAlert className="text-safety-amber shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-anthracite-950 mb-1">Please verify extracted fields</h4>
                    <p className="text-xs text-anthracite-800/80">The AI has extracted the following information. Some fields have low confidence scores and require manual confirmation.</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-paper-100 p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-anthracite-800 uppercase tracking-wider mb-1.5">Document Type</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full bg-paper-50 border border-paper-100 rounded-md px-3 py-2 text-sm text-anthracite-950 focus:border-steel focus:ring-1 focus:ring-steel outline-none"
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-verdant" size={16} />
                    </div>
                  </div>

                  {/* Imperfect Field */}
                  <div>
                    <label className="block text-xs font-bold text-anthracite-800 uppercase tracking-wider mb-1.5">License / Registration Number</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        value={licenseNo}
                        onChange={(e) => setLicenseNo(e.target.value)}
                        className="w-full bg-safety-amber/5 border border-safety-amber rounded-md px-3 py-2 text-sm text-anthracite-950 focus:border-safety-amber focus:ring-1 focus:ring-safety-amber outline-none font-mono"
                      />
                      <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 text-safety-amber" size={16} />
                      
                      {/* Tooltip */}
                      <div className="absolute left-0 -top-10 bg-anthracite-950 text-paper-50 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-lg">
                        Low confidence: Contains potential substitution ('O' vs '0').
                      </div>
                    </div>
                    <p className="text-[10px] text-safety-amber mt-1 font-medium flex items-center gap-1">
                      Verify potential OCR substitution: 'O' instead of '0'
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-anthracite-800 uppercase tracking-wider mb-1.5">Issue Date</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          className="w-full bg-paper-50 border border-paper-100 rounded-md px-3 py-2 text-sm text-anthracite-950 focus:border-steel focus:ring-1 focus:ring-steel outline-none"
                        />
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-verdant pointer-events-none" size={16} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-anthracite-800 uppercase tracking-wider mb-1.5">Expiry Date</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full bg-paper-50 border border-paper-100 rounded-md px-3 py-2 text-sm text-anthracite-950 focus:border-steel focus:ring-1 focus:ring-steel outline-none"
                        />
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-verdant pointer-events-none" size={16} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-anthracite-800 uppercase tracking-wider mb-1.5">Issuing Authority</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={authority}
                        onChange={(e) => setAuthority(e.target.value)}
                        className="w-full bg-paper-50 border border-paper-100 rounded-md px-3 py-2 text-sm text-anthracite-950 focus:border-steel focus:ring-1 focus:ring-steel outline-none"
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-verdant" size={16} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-paper-100 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-anthracite-800 hover:text-anthracite-950 transition-colors"
          >
            Cancel
          </button>
          
          {step === 'verify' && (
            <button 
              onClick={() => {
                // In a real app, this would save to the backend/context
                onClose();
              }}
              className="bg-verdant hover:bg-verdant/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              <FileCheck size={16} /> Confirm & Save Record
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
