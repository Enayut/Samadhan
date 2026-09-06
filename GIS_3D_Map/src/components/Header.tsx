/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
  AlertTriangle,
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
  return (
    <header className="h-14 bg-neutral-950 border-b border-neutral-800 px-4 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Left: Brand & Mine Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white tracking-widest text-sm shadow">
            SM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-neutral-100 tracking-wider">SAMAADHAN</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                GOVERNANCE GIS
              </span>
            </div>
            <div className="text-[10px] text-neutral-400">Mining Compliance &amp; Geospatial Intelligence</div>
          </div>
        </div>

        <div className="h-6 w-px bg-neutral-800 hidden sm:block" />

        {/* Mine Selector (Prototype restricted to MINE-001) */}
        <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-700/70 rounded-lg px-2.5 py-1 text-xs">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-sky-300">{mine.id}</span>
            <span className="text-neutral-200 font-medium">{mine.name}</span>
            <span className="text-neutral-400 text-[11px]">({mine.district}, {mine.state})</span>
          </div>
        </div>
      </div>

      {/* Middle: View Mode Tabs */}
      <div className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-medium">
        <button
          onClick={() => onViewModeChange('2D')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            viewMode === '2D'
              ? 'bg-sky-600 text-white font-semibold shadow'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2D GIS</span>
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
          <span>3D Terrain (DEM)</span>
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
          <span>Split 2D / 3D</span>
        </button>
      </div>

      {/* Right: SAMAADHAN Risk State & Provenance Button */}
      <div className="flex items-center gap-3">
        {/* Risk Badge (Explicitly marked application data) */}
        <div
          title="SAMAADHAN Application Risk Engine calculation"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/80 text-xs"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <div className="leading-tight text-left">
            <div className="text-[9px] font-mono text-rose-300 font-bold tracking-wider">
              RISK: {governance.riskLevel}
            </div>
            <div className="text-[10px] text-neutral-300">
              {governance.openViolationsCount} Violations ({governance.overdueTasksCount} Overdue)
            </div>
          </div>
        </div>

        {/* Data Provenance Trigger */}
        <button
          onClick={onOpenProvenance}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-medium transition-colors shadow cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Data Provenance</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      </div>
    </header>
  );
};
