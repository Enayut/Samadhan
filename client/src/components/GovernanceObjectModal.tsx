import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, FileText, CheckCircle2, AlertTriangle, Clock, MapPin, Search, ChevronRight, Check } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { GovernanceObject, EvidenceItem } from '../types';
import { useAppContext } from '../store/AppContext';

interface Props {
  objectId: string | null;
  onClose: () => void;
}

const statusColors = {
  'Closed': 'bg-verdant/10 text-verdant border-verdant/20',     // 🟢 Green
  'Submitted': 'bg-steel/10 text-steel border-steel/20',         // 🔵 Blue
  'In Progress': 'bg-safety-amber/10 text-safety-amber border-safety-amber/20', // 🟠 Amber
  'Overdue': 'bg-[#C1502E]/10 text-[#C1502E] border-[#C1502E]/20', // 🔴 Red
  'Escalated': 'bg-[#C1502E]/10 text-[#C1502E] border-[#C1502E]/20', // 🔴 Red
};

const evidenceStatusColors = {
  'Present': 'text-verdant',
  'Missing': 'text-anthracite-800/50',
  'Flagged': 'text-safety-amber'
};

export function GovernanceObjectModal({ objectId, onClose }: Props) {
  const { state, rejectEvidence, approveObject, resubmitObject } = useAppContext();
  const [rejectingItem, setRejectingItem] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!objectId) return null;

  const obj = state.govObjects.find(o => o.id === objectId);
  if (!obj) return null;

  const isVerifier = state.userName === obj.verifier.name;
  const isOwner = state.userName === obj.owner.name;

  const handleReject = (evidenceId: string) => {
    if (!rejectionReason.trim()) return;
    rejectEvidence(obj.id, evidenceId, rejectionReason);
    setRejectingItem(null);
    setRejectionReason('');
  };

  const daysUntilDeadline = differenceInDays(new Date(obj.deadline), new Date());
  const isOverdue = isPast(new Date(obj.deadline)) && obj.status !== 'Closed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-anthracite-950/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-paper-50 w-full max-w-3xl rounded-2xl shadow-2xl border border-paper-100 flex flex-col max-h-[90vh]"
      >
        {/* 1. Header: domain badge + severity + status pill */}
        <div className="flex justify-between items-start p-6 border-b border-paper-100 bg-white rounded-t-2xl">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <span className="bg-anthracite-100 text-anthracite-800 px-2 py-1 rounded">{obj.domain}</span>
              <span className="bg-anthracite-100 text-anthracite-800 px-2 py-1 rounded">Severity: {obj.severity}</span>
              <span className={`px-2 py-1 rounded border ${statusColors[obj.status]}`}>
                {obj.status}
              </span>
            </div>
            {/* 2. Title + source citation */}
            <div>
              <h2 className="text-xl font-display font-bold text-anthracite-950">{obj.title}</h2>
              <p className="text-sm text-anthracite-800/70 mt-1 flex items-center gap-1">
                <FileText size={14} /> Source: {obj.source}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-anthracite-800/50 hover:text-anthracite-950 p-2 rounded-full hover:bg-paper-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-8 bg-paper-50">
          
          {/* 3. Owner and deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-paper-100">
              <p className="text-xs font-bold text-anthracite-800 uppercase tracking-wider mb-1">Owner</p>
              <p className="text-sm font-medium text-anthracite-950">{obj.owner.name}</p>
              <p className="text-xs text-anthracite-800">{obj.owner.role}</p>
            </div>
            <div className={`p-4 rounded-xl shadow-sm border ${isOverdue ? 'bg-[#C1502E]/5 border-[#C1502E]/20' : 'bg-white border-paper-100'}`}>
              <p className="text-xs font-bold text-anthracite-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={12} /> Deadline
              </p>
              <p className={`text-sm font-medium ${isOverdue ? 'text-[#C1502E]' : 'text-anthracite-950'}`}>
                {format(new Date(obj.deadline), 'MMM dd, yyyy')}
              </p>
              {obj.status !== 'Closed' && (
                <p className={`text-xs ${isOverdue ? 'text-[#C1502E]' : 'text-anthracite-800'}`}>
                  {isOverdue ? `${Math.abs(daysUntilDeadline)} days overdue` : `${daysUntilDeadline} days remaining`}
                </p>
              )}
            </div>
          </div>

          {/* 4. Evidence checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-anthracite-950 uppercase tracking-wider">Evidence Checklist</h3>
            <div className="space-y-2">
              {obj.evidence_checklist.map((ev: EvidenceItem) => (
                <div key={ev.id} className="bg-white border border-paper-100 rounded-lg p-4 shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${evidenceStatusColors[ev.status]}`}>
                        {ev.status === 'Present' ? <CheckCircle2 size={18} /> : ev.status === 'Missing' ? <Clock size={18} /> : <AlertTriangle size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-anthracite-950">{ev.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs font-bold ${evidenceStatusColors[ev.status]}`}>{ev.status.toUpperCase()}</span>
                          {ev.timestamp && <span className="text-xs text-anthracite-800 flex items-center gap-1"><Clock size={10} /> {format(new Date(ev.timestamp), 'MMM dd, HH:mm')}</span>}
                          {ev.geoTag && <span className="text-xs text-anthracite-800 flex items-center gap-1"><MapPin size={10} /> {ev.geoTag}</span>}
                        </div>
                        {ev.rejectionReason && (
                          <div className="mt-2 text-xs bg-safety-amber/10 text-safety-amber p-2 rounded border border-safety-amber/20">
                            <strong>Rejection Reason:</strong> {ev.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Verifier Actions */}
                    {obj.status === 'Submitted' && isVerifier && ev.status !== 'Flagged' && (
                      <div className="shrink-0">
                        {rejectingItem === ev.id ? (
                          <div className="flex flex-col gap-2 w-48">
                            <input 
                              type="text" 
                              placeholder="Reason for rejection..." 
                              className="text-xs p-2 border border-paper-100 rounded bg-paper-50 w-full outline-none focus:border-safety-amber"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button onClick={() => setRejectingItem(null)} className="text-xs text-anthracite-800 hover:text-anthracite-950 flex-1">Cancel</button>
                              <button 
                                onClick={() => handleReject(ev.id)}
                                disabled={!rejectionReason.trim()}
                                className="text-xs bg-safety-amber text-white px-2 py-1 rounded disabled:opacity-50 flex-1"
                              >
                                Confirm
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setRejectingItem(ev.id)}
                            className="text-xs font-medium text-[#C1502E] hover:bg-[#C1502E]/10 px-2 py-1 rounded transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Owner Actions */}
            {(obj.status === 'In Progress' || obj.status === 'Escalated') && isOwner && (
              <button 
                onClick={() => resubmitObject(obj.id)}
                className="mt-2 w-full bg-steel hover:bg-steel/90 text-white py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
              >
                Submit Evidence for Verification
              </button>
            )}
          </div>

          {/* 5. Verifier block */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-anthracite-950 uppercase tracking-wider">Verification</h3>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-paper-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-anthracite-950">{obj.verifier.name}</p>
                  <p className="text-xs text-anthracite-800">{obj.verifier.role}</p>
                </div>
                {obj.status === 'Submitted' && isVerifier && (
                  <button 
                    onClick={() => approveObject(obj.id)}
                    className="bg-verdant hover:bg-verdant/90 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                  >
                    <Check size={16} /> Approve & Close
                  </button>
                )}
              </div>
              
              {/* Critical Demo Scene: Verifier != Owner Check */}
              {obj.status === 'Closed' && obj.closure_certificate && (
                <div className="mt-4 p-3 bg-paper-50 rounded-lg border border-paper-100 flex items-start gap-2">
                  <ShieldAlert size={16} className="text-steel shrink-0 mt-0.5" />
                  <div className="text-xs text-anthracite-800">
                    <span className="font-bold text-steel">Segregation of Duties Verified:</span><br/>
                    Verifier ({obj.closure_certificate.verifierName}) ≠ Submitter ({obj.closure_certificate.ownerName})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 6. Escalation history */}
          {obj.escalations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-anthracite-950 uppercase tracking-wider">Escalation History</h3>
              <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
                {obj.escalations.map((esc, i) => (
                  <div key={i} className={`p-3 text-sm flex justify-between items-center ${i > 0 ? 'border-t border-paper-100' : ''}`}>
                    <div>
                      <span className="font-bold text-[#C1502E] mr-2">{esc.level}</span>
                      <span className="text-anthracite-950">Notified: {esc.notified}</span>
                    </div>
                    <span className="text-xs text-anthracite-800">{format(new Date(esc.timestamp), 'MMM dd, HH:mm')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Closure certificate */}
          {obj.status === 'Closed' && obj.closure_certificate && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-anthracite-950 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} className="text-verdant" /> Closure Certificate
              </h3>
              <div className="bg-verdant/5 border border-verdant/20 p-4 rounded-xl font-mono text-xs text-anthracite-800">
                <p><strong>Hash:</strong> {obj.closure_certificate.hash}</p>
                <p><strong>Closed At:</strong> {format(new Date(obj.closure_certificate.closedAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                <p><strong>Owner:</strong> {obj.closure_certificate.ownerName}</p>
                <p><strong>Verifier:</strong> {obj.closure_certificate.verifierName}</p>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
