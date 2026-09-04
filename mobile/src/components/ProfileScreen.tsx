import React from 'react';
import { MINE_INFO } from '../data/mockData';
import { SyncStatusType } from '../types';
import {
  ArrowLeft,
  Phone,
  HardDrive,
  FileCheck2,
  ExternalLink,
  CheckCircle2,
  Radio,
} from 'lucide-react';

interface ProfileScreenProps {
  syncStatus: SyncStatusType;
  onToggleSyncStatus: (status: SyncStatusType) => void;
  onBackToHome: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  syncStatus,
  onToggleSyncStatus,
  onBackToHome,
}) => {
  return (
    <div className="w-full pb-28 px-5 pt-4 select-none space-y-5">
      {/* Top Header with Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-bold text-[#718096] hover:text-[#1A202C] active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-[#718096] font-semibold">
          DGMS ID: {MINE_INFO.user.id}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-[#1A202C] tracking-tight">Official Profile</h1>
        <p className="text-xs text-[#718096] mt-0.5">Statutory identity & mine assignment</p>
      </div>

      {/* Official Identity Card */}
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-[#2D3748] text-[#ECC94B] flex items-center justify-center text-lg font-extrabold ring-4 ring-[#ECC94B]/20 shrink-0">
            {MINE_INFO.user.avatar}
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1A202C] leading-tight">
              {MINE_INFO.user.name}
            </h2>
            <div className="text-xs font-medium text-[#718096] mt-0.5">
              {MINE_INFO.user.designation}
            </div>
            <div className="text-[11px] font-mono text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cert: {MINE_INFO.user.dgmsCertNo}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#E2E8F0] text-xs">
          <div className="p-3 rounded-[10px] bg-[#F7FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] text-[#718096] uppercase font-bold block">Assigned Mine</span>
            <span className="font-bold text-[#1A202C] mt-0.5 block">{MINE_INFO.name}</span>
          </div>
          <div className="p-3 rounded-[10px] bg-[#F7FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] text-[#718096] uppercase font-bold block">Shift Roster</span>
            <span className="font-bold text-[#1A202C] mt-0.5 block">Shift III (Night)</span>
          </div>
        </div>
      </div>

      {/* Sync & Connectivity Settings */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#718096] px-0.5">
          Comms & Telemetry Node
        </div>
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#2D3748] font-medium">
              <Radio className="w-4 h-4 text-[#ECC94B]" />
              <span>Pit Transceiver</span>
            </div>
            <span className="font-mono text-xs font-bold text-[#38A169]">Kusmunda Repeater #04</span>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0]">
            <div className="text-[11px] text-[#718096] mb-2 font-medium">Test Telemetry Conditions:</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onToggleSyncStatus('synced')}
                className={`py-2 px-2 rounded-[8px] text-xs font-bold border text-center transition-all ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                    : 'bg-white border-[#E2E8F0] text-[#718096] hover:bg-slate-50'
                }`}
              >
                Synced
              </button>
              <button
                type="button"
                onClick={() => onToggleSyncStatus('pending')}
                className={`py-2 px-2 rounded-[8px] text-xs font-bold border text-center transition-all ${
                  syncStatus === 'pending'
                    ? 'bg-orange-50 border-orange-400 text-orange-800 shadow-xs'
                    : 'bg-white border-[#E2E8F0] text-[#718096] hover:bg-slate-50'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => onToggleSyncStatus('offline')}
                className={`py-2 px-2 rounded-[8px] text-xs font-bold border text-center transition-all ${
                  syncStatus === 'offline'
                    ? 'bg-red-50 border-red-400 text-red-800 shadow-xs'
                    : 'bg-white border-[#E2E8F0] text-[#718096] hover:bg-slate-50'
                }`}
              >
                Offline
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Statutory Tools */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#718096] px-0.5">
          Emergency & Resources
        </div>
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] divide-y divide-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#E53E3E]" />
              <div className="text-xs">
                <div className="font-bold text-[#1A202C]">DGMS Emergency Hotline</div>
                <div className="text-[11px] text-[#718096]">1800-345-MINE · Direct Shift Desk</div>
              </div>
            </div>
            <a
              href="tel:18003450000"
              className="px-3 py-1 rounded-[6px] bg-red-50 text-[#E53E3E] font-bold text-xs border border-red-200"
            >
              Call
            </a>
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <HardDrive className="w-4 h-4 text-[#718096]" />
              <div className="text-xs">
                <div className="font-bold text-[#1A202C]">Local Encrypted Cache</div>
                <div className="text-[11px] text-[#718096]">14 draft items · 18.4 MB used</div>
              </div>
            </div>
            <span className="text-xs text-emerald-700 font-semibold">Healthy</span>
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <FileCheck2 className="w-4 h-4 text-[#38A169]" />
              <div className="text-xs">
                <div className="font-bold text-[#1A202C]">CMR 2017 Handbook</div>
                <div className="text-[11px] text-[#718096]">Coal Mines Regulations & Circulars</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#718096]" />
          </div>
        </div>
      </div>

      {/* App Version */}
      <div className="text-center pt-2 space-y-1 text-xs">
        <div className="font-bold text-[#2D3748]">
          SAMAADHAN Mobile · v2.4.2
        </div>
        <div className="text-[11px] text-[#718096]">
          DGMS Technical Circular Compliance Approved
        </div>
      </div>
    </div>
  );
};
