/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MineRecord, MineGovernanceStatus, SimulatedTelemetryStream } from '../types';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCheck,
  ShieldAlert,
  ExternalLink,
  Layers,
  MapPin,
} from 'lucide-react';

interface DataProvenancePanelProps {
  mine: MineRecord;
  governance: MineGovernanceStatus;
  telemetry: SimulatedTelemetryStream;
  isOpen: boolean;
  onClose: () => void;
}

export const DataProvenancePanel: React.FC<DataProvenancePanelProps> = ({
  mine,
  governance,
  telemetry,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <span>Geospatial Data Provenance & Source-of-Truth</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                  {mine.id}
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Statutory audit trails, dataset resolutions, and clear separation of ground truth vs application overlays.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs">
          {/* Architecture Concept Rule Banner */}
          <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[9px] font-mono font-bold text-emerald-400 block mb-0.5">REAL DATA</span>
              <span className="text-neutral-300">Mine Coordinates, Copernicus DEM, Sentinel-2 Imagery</span>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[9px] font-mono font-bold text-sky-400 block mb-0.5">SAMAADHAN DATA</span>
              <span className="text-neutral-300">Compliance Risk, DGMS Violations, Governance Status</span>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[9px] font-mono font-bold text-amber-400 block mb-0.5">SIMULATED DATA</span>
              <span className="text-neutral-300">Live IoT Sensors, InSAR Radar & Piezometer Telemetry</span>
            </div>
          </div>

          {/* 1. Mine Geographic Coordinate */}
          <div className="border border-neutral-800 rounded-lg p-3.5 bg-neutral-950/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-neutral-100 text-sm">Mine Geographic Coordinates</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                [OFFICIAL GROUND TRUTH]
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[11px] mb-2 font-mono bg-neutral-900/60 p-2 rounded border border-neutral-800">
              <div>Latitude: <span className="text-neutral-100 font-semibold">{mine.latitude.toFixed(5)}° N</span></div>
              <div>Longitude: <span className="text-neutral-100 font-semibold">{mine.longitude.toFixed(5)}° E</span></div>
            </div>
            <div className="space-y-1 text-neutral-300">
              <div><strong className="text-neutral-400">Source:</strong> {mine.coordinateProvenance.source}</div>
              <div><strong className="text-neutral-400">Captured:</strong> {mine.coordinateProvenance.capturedAt}</div>
              <div><strong className="text-neutral-400">Reported Accuracy:</strong> {mine.coordinateProvenance.accuracy}</div>
              <div className="text-neutral-400 italic text-[11px] mt-1">{mine.coordinateProvenance.notes}</div>
            </div>
          </div>

          {/* 2. Mine Boundary & Pit Geometry */}
          <div className="border border-neutral-800 rounded-lg p-3.5 bg-neutral-950/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-neutral-100 text-sm">Mine Boundary & Operational Zoning</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-mono font-bold">
                [INDICATIVE DERIVED]
              </span>
            </div>
            <div className="p-2 rounded bg-amber-950/30 border border-amber-800/60 text-amber-300 font-medium text-[11px] mb-2">
              ⚠️ {mine.geometryDisclaimer}
            </div>
            <div className="space-y-1 text-neutral-300">
              <div><strong className="text-neutral-400">Source:</strong> {mine.geometrySource.source}</div>
              <div><strong className="text-neutral-400">Captured:</strong> {mine.geometrySource.capturedAt}</div>
              <div><strong className="text-neutral-400">Resolution / Accuracy:</strong> {mine.geometrySource.accuracy}</div>
              <div className="text-neutral-400 italic text-[11px] mt-1">{mine.geometrySource.notes}</div>
            </div>
          </div>

          {/* 3. Terrain & Elevation (Copernicus DEM) */}
          <div className="border border-neutral-800 rounded-lg p-3.5 bg-neutral-950/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span className="font-semibold text-neutral-100 text-sm">Terrain & Elevation Model</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-mono font-bold">
                [OPEN-DATA GROUND TRUTH]
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] mb-2 font-mono bg-neutral-900/60 p-2 rounded border border-neutral-800">
              <div>Elevation Range: <span className="text-sky-300">{mine.elevationData.minElevationMeters}m - {mine.elevationData.maxElevationMeters}m</span></div>
              <div>Vertical Datum: <span className="text-neutral-300">{mine.elevationData.verticalDatum}</span></div>
              <div>Resolution: <span className="text-neutral-300">{mine.elevationData.horizontalResolution}</span></div>
            </div>
            <div className="space-y-1 text-neutral-300">
              <div><strong className="text-neutral-400">Dataset:</strong> {mine.terrainSource.source}</div>
              <div><strong className="text-neutral-400">Captured / Release:</strong> {mine.terrainSource.capturedAt}</div>
              <div><strong className="text-neutral-400">Accuracy Benchmark:</strong> {mine.terrainSource.accuracy}</div>
              <div className="text-neutral-400 italic text-[11px] mt-1">
                {mine.terrainSource.notes} <em>(No fake centimeter precision is displayed).</em>
              </div>
            </div>
          </div>

          {/* 4. Satellite Imagery */}
          <div className="border border-neutral-800 rounded-lg p-3.5 bg-neutral-950/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-neutral-100 text-sm">Satellite Imagery Basemaps</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                [OPEN-DATA / LICENSED]
              </span>
            </div>
            <div className="space-y-1 text-neutral-300">
              <div><strong className="text-neutral-400">Primary Providers:</strong> {mine.imagerySource.source}</div>
              <div><strong className="text-neutral-400">Acquisition:</strong> {mine.imagerySource.capturedAt}</div>
              <div><strong className="text-neutral-400">Optical Resolution:</strong> {mine.imagerySource.accuracy}</div>
              <div className="text-neutral-400 italic text-[11px] mt-1">{mine.imagerySource.notes}</div>
            </div>
          </div>

          {/* 5. Compliance Risk & Governance (SAMAADHAN Application Data) */}
          <div className="border border-neutral-800 rounded-lg p-3.5 bg-neutral-950/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span className="font-semibold text-neutral-100 text-sm">Compliance Risk & Governance State</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-mono font-bold">
                [SAMAADHAN APPLICATION DATA]
              </span>
            </div>
            <div className="space-y-1 text-neutral-300">
              <div><strong className="text-neutral-400">Determining System:</strong> {governance.provenance.source}</div>
              <div><strong className="text-neutral-400">Audit Protocol:</strong> {governance.provenance.auditCycle}</div>
              <div className="text-rose-300/90 text-[11px] mt-1">
                <strong>Architectural Note:</strong> {governance.provenance.disclaimer}
              </div>
            </div>
          </div>

          {/* 6. Operational Telemetry (Strictly SIMULATED) */}
          <div className="border border-neutral-800 rounded-lg p-3.5 bg-neutral-950/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-neutral-100 text-sm">Operational Telemetry Feeds</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-mono font-bold">
                [STRICTLY SIMULATED]
              </span>
            </div>
            <div className="p-2 rounded bg-amber-950/40 border border-amber-800/80 text-amber-300 text-[11px]">
              {telemetry.bannerNotice}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <div>Mine Unit: <span className="text-neutral-200 font-semibold">{mine.name} ({mine.operator})</span></div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-medium transition-colors cursor-pointer"
          >
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  );
};
