import React, { useState } from 'react';
import { SyncStatusType } from '../types';
import { MINE_INFO } from '../data/mockData';
import { RefreshCw, Check } from 'lucide-react';

interface TopHeaderProps {
  syncStatus: SyncStatusType;
  onToggleSyncStatus: (status: SyncStatusType) => void;
  onOpenProfile: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  syncStatus,
  onToggleSyncStatus,
  onOpenProfile,
}) => {
  const [showSyncModal, setShowSyncModal] = useState(false);

  const getSyncDot = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          dotColor: 'bg-[#38A169]',
          ringColor: 'ring-emerald-200',
          title: 'Synced (WAN Connected)',
        };
      case 'pending':
        return {
          dotColor: 'bg-[#DD6B20]',
          ringColor: 'ring-orange-200',
          title: 'Pending (Queueing locally)',
        };
      case 'offline':
      default:
        return {
          dotColor: 'bg-[#E53E3E]',
          ringColor: 'ring-red-200',
          title: 'Offline (No Pit Signal)',
        };
    }
  };

  const syncDot = getSyncDot();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-5 py-3.5 select-none">
      <div className="flex items-center justify-between">
        {/* Left: Simple Contextual Greeting & Mine */}
        <div>
          <h1 className="text-[17px] font-extrabold text-[#1A202C] tracking-tight leading-tight">
            Good morning, {MINE_INFO.user.shortName}
          </h1>
          <p className="text-xs font-medium text-[#718096] mt-0.5">
            {MINE_INFO.name}
          </p>
        </div>

        {/* Right: Small Sync Indicator & User Avatar */}
        <div className="flex items-center gap-3">
          {/* Small sync dot indicator button */}
          <button
            type="button"
            onClick={() => setShowSyncModal(!showSyncModal)}
            title={`Sync status: ${syncDot.title}. Tap to toggle simulation`}
            aria-label="Toggle sync simulation"
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center relative"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${syncDot.dotColor} ring-2 ${syncDot.ringColor} block`}
            />
          </button>

          {/* Small user avatar (Tapping navigates to Profile) */}
          <button
            type="button"
            onClick={onOpenProfile}
            title="Open official profile and settings"
            aria-label="Open profile"
            className="w-9 h-9 rounded-full bg-[#2D3748] text-[#ECC94B] flex items-center justify-center text-xs font-extrabold shadow-xs hover:ring-2 hover:ring-[#ECC94B] transition-all active:scale-95"
          >
            {MINE_INFO.user.avatar}
          </button>
        </div>
      </div>

      {/* Sync Status Simulation Dropdown */}
      {showSyncModal && (
        <div className="absolute top-full right-4 mt-2 w-64 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xl p-3 z-50 text-xs">
          <div className="font-bold text-[#1A202C] mb-1 flex items-center justify-between">
            <span>Comms & Sync Simulation</span>
            <RefreshCw className="w-3.5 h-3.5 text-[#718096]" />
          </div>
          <p className="text-[11px] text-[#718096] mb-2.5 leading-normal">
            Simulate telemetry conditions for in-pit testing:
          </p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                onToggleSyncStatus('synced');
                setShowSyncModal(false);
              }}
              className={`w-full text-left px-2.5 py-2 rounded-[8px] flex items-center justify-between border ${
                syncStatus === 'synced'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                  : 'bg-white border-[#E2E8F0] text-[#2D3748]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38A169]" />
                <span>Synced (Normal WAN)</span>
              </div>
              {syncStatus === 'synced' && <Check className="w-3.5 h-3.5 text-[#38A169]" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleSyncStatus('pending');
                setShowSyncModal(false);
              }}
              className={`w-full text-left px-2.5 py-2 rounded-[8px] flex items-center justify-between border ${
                syncStatus === 'pending'
                  ? 'bg-orange-50 border-orange-300 text-orange-900 font-bold'
                  : 'bg-white border-[#E2E8F0] text-[#2D3748]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DD6B20]" />
                <span>Pending (Upload Queue)</span>
              </div>
              {syncStatus === 'pending' && <Check className="w-3.5 h-3.5 text-[#DD6B20]" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleSyncStatus('offline');
                setShowSyncModal(false);
              }}
              className={`w-full text-left px-2.5 py-2 rounded-[8px] flex items-center justify-between border ${
                syncStatus === 'offline'
                  ? 'bg-red-50 border-red-300 text-red-900 font-bold'
                  : 'bg-white border-[#E2E8F0] text-[#2D3748]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E53E3E]" />
                <span>Offline (In-Pit No Signal)</span>
              </div>
              {syncStatus === 'offline' && <Check className="w-3.5 h-3.5 text-[#E53E3E]" />}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
