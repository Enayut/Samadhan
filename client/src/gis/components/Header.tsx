/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Compact GIS toolbar — deliberately NOT an app header. The parent SAMAADHAN
 * Layout owns application branding/navigation; this bar only carries the
 * mine-specific controls: mine identity, view mode, live risk state and data
 * provenance. Styled with the application's design tokens so the GIS reads as
 * a page inside SAMAADHAN, not an embedded second app.
 */

import React from 'react';
import { MineRecord, MineGovernanceStatus } from '../types';
import {
  ShieldAlert,
  Database,
  Layers,
  Box,
  Columns,
  MapPin,
} from 'lucide-react';

export type ViewMode = '2D' | '3D' | 'SPLIT';

interface HeaderProps {
  mine: MineRecord;
  governance: MineGovernanceStatus;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenProvenance: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mine,
  governance,
  viewMode,
  onViewModeChange,
  onOpenProvenance,
}) => {
  const riskTone =
    governance.riskLevel === 'CRITICAL'
      ? { text: 'text-rose-300', bg: 'bg-rose-950/60', border: 'border-rose-800/70', dot: 'bg-rose-400' }
      : governance.riskLevel === 'HIGH'
      ? { text: 'text-amber-300', bg: 'bg-amber-950/50', border: 'border-amber-800/60', dot: 'bg-amber-400' }
      : { text: 'text-emerald-300', bg: 'bg-emerald-950/50', border: 'border-emerald-800/60', dot: 'bg-emerald-400' };

  return (
    <header className="h-12 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 px-4 flex items-center justify-between gap-3 z-30 shrink-0 select-none">
      {/* Left: mine identity + live compliance state (no app branding here) */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-safety-amber shrink-0" />
          <div className="leading-tight min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[11px] text-sky-300">{mine.id}</span>
              <span className="font-bold text-xs text-neutral-100 truncate">{mine.name}</span>
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              Live compliance overlay · {mine.district}, {mine.state}
            </div>
          </div>
        </div>

        {/* Risk state (application data, from shared workflow state) */}
        <div
          title="Derived from live SAMAADHAN compliance state"
          className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${riskTone.bg} ${riskTone.border} ${riskTone.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${riskTone.dot}`} />
          {governance.openViolationsCount} open · {governance.overdueTasksCount} overdue
        </div>
      </div>

      {/* Center: view mode tabs */}
      <div className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-medium shrink-0">
        <button
          onClick={() => onViewModeChange('2D')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            viewMode === '2D'
              ? 'bg-sky-600 text-white font-semibold shadow'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2D</span>
        </button>

        <button
          onClick={() => onViewModeChange('3D')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            viewMode === '3D'
              ? 'bg-sky-600 text-white font-semibold shadow'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D</span>
        </button>

        <button
          onClick={() => onViewModeChange('SPLIT')}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            viewMode === 'SPLIT'
              ? 'bg-sky-600 text-white font-semibold shadow'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Split</span>
        </button>
      </div>

      {/* Right: data provenance (single compact entry point) */}
      <button
        onClick={onOpenProvenance}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-medium transition-colors shadow shrink-0 cursor-pointer"
      >
        <Database className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline">Provenance</span>
        <ShieldAlert className="hidden sm:inline w-3 h-3 text-emerald-400" />
      </button>
    </header>
  );
};
