/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ComplianceViolation, SimulatedTelemetrySensor } from '../types';
import {
  X,
  AlertTriangle,
  Calendar,
  MapPin,
  ShieldAlert,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface ComplianceDrawerProps {
  selectedViolation: ComplianceViolation | null;
  selectedTelemetry: SimulatedTelemetrySensor | null;
  onClose: () => void;
}

export const ComplianceDrawer: React.FC<ComplianceDrawerProps> = ({
  selectedViolation,
  selectedTelemetry,
  onClose,
}) => {
  if (!selectedViolation && !selectedTelemetry) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-neutral-900/95 backdrop-blur-md border-l border-neutral-800 shadow-2xl flex flex-col text-neutral-200 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
        <div className="flex items-center gap-2">
          {selectedViolation ? (
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          ) : (
            <Radio className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            {selectedViolation ? 'DGMS Statutory Violation' : 'Simulated Sensor Feed'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 overflow-y-auto space-y-4 text-xs">
        {selectedViolation && (
          <>
            {/* System provenance banner */}
            <div className="p-2 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between">
              <span>SOURCE: SAMAADHAN Compliance Engine</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold">
                {selectedViolation.severity}
              </span>
            </div>

            {/* Violation Title */}
            <div>
              <div className="text-sm font-bold text-neutral-100 leading-snug">
                {selectedViolation.title}
              </div>
              <div className="text-[11px] font-mono text-sky-400 mt-1">
                {selectedViolation.statutoryCode}
              </div>
            </div>

            {/* Status Pills */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                <span className="text-neutral-500 block text-[9px]">STATUS</span>
                <span className={selectedViolation.status === 'OVERDUE' ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                  {selectedViolation.status}
                </span>
              </div>
              <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                <span className="text-neutral-500 block text-[9px]">DUE DATE</span>
                <span className="text-neutral-200">{selectedViolation.dueDate}</span>
              </div>
            </div>

            {/* Description */}
            <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800">
              <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                Field Inspection Finding
              </div>
              <div className="text-neutral-300 leading-relaxed text-[11px]">
                {selectedViolation.description}
              </div>
            </div>

            {/* Location & Authority */}
            <div className="space-y-2 border-t border-neutral-800 pt-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-neutral-200 font-medium">{selectedViolation.locationDescription}</div>
                  <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                    {selectedViolation.locationCoordinates[0].toFixed(5)}° N, {selectedViolation.locationCoordinates[1].toFixed(5)}° E
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-neutral-200 font-medium">Statutory Authority</div>
                  <div className="text-[11px] text-neutral-400">{selectedViolation.statutoryAuthority}</div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/50 text-[10px] text-amber-300">
              <strong>Compliance Context:</strong> This violation record is generated by SAMAADHAN's compliance engine. It is an application-derived risk overlay, not a physical alteration of the mine topography.
            </div>
          </>
        )}

        {selectedTelemetry && (
          <>
            {/* Mandatory Simulated Tag */}
            <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/80 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse text-amber-400" />
              <span>SIMULATED OPERATIONAL TELEMETRY</span>
            </div>

            <div>
              <div className="text-sm font-bold text-neutral-100">
                {selectedTelemetry.name}
              </div>
              <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                Sensor ID: <span className="text-sky-400">{selectedTelemetry.id}</span>
              </div>
            </div>

            {/* Live value box */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <div className="text-xs text-neutral-400 uppercase tracking-wider">Simulated Reading</div>
              <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                {selectedTelemetry.currentValue}{' '}
                <span className="text-xs font-normal text-neutral-400">{selectedTelemetry.unit}</span>
              </div>
              <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-neutral-900 border border-neutral-700 text-neutral-300">
                Status: {selectedTelemetry.status}
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-neutral-300 bg-neutral-950/50 p-2.5 rounded border border-neutral-800">
              <div><strong className="text-neutral-400">Sampling Rate:</strong> {selectedTelemetry.sampleRate}</div>
              <div><strong className="text-neutral-400">Warning Threshold:</strong> {selectedTelemetry.threshold.warning} {selectedTelemetry.unit}</div>
              <div><strong className="text-neutral-400">Alert Ceiling:</strong> {selectedTelemetry.threshold.alert} {selectedTelemetry.unit}</div>
              <div><strong className="text-neutral-400">Elevation:</strong> {selectedTelemetry.elevationMeters}m MSL</div>
            </div>

            <div className="text-[10px] text-neutral-500 italic">
              Notice: Operational telemetry is simulated. No physical IoT/SCADA connection exists.
            </div>
          </>
        )}
      </div>
    </div>
  );
};
