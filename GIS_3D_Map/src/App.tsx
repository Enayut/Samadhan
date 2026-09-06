/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MINE_001_DATA, MINE_001_GOVERNANCE, MINE_001_SIMULATED_TELEMETRY } from './data/mine001';
import {
  ComplianceViolation,
  SimulatedTelemetrySensor,
  SimulatedTelemetryStream,
} from './types';
import { Header, ViewMode } from './components/Header';
import { Gis2DView } from './components/Gis2DView';
import { Terrain3DView } from './components/Terrain3DView';
import { DataProvenancePanel } from './components/DataProvenancePanel';
import { ComplianceDrawer } from './components/ComplianceDrawer';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('2D');
  const [isProvenanceOpen, setIsProvenanceOpen] = useState<boolean>(false);
  const [selectedViolation, setSelectedViolation] = useState<ComplianceViolation | null>(null);
  const [selectedTelemetry, setSelectedTelemetry] = useState<SimulatedTelemetrySensor | null>(null);

  // Simulated telemetry state with periodic simulated ticks
  const [telemetryState, setTelemetryState] = useState<SimulatedTelemetryStream>(MINE_001_SIMULATED_TELEMETRY);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryState((prev) => ({
        ...prev,
        sensors: prev.sensors.map((s) => {
          // Add subtle synthetic oscillation within realistic bounds
          const jitter = (Math.random() - 0.48) * 0.08;
          const nextVal = Math.max(0.1, +(s.currentValue + jitter).toFixed(2));
          return {
            ...s,
            currentValue: nextVal,
            lastSimulatedPing: 'Just now (Simulated)',
          };
        }),
      }));
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const handleSelectViolation = (violation: ComplianceViolation) => {
    setSelectedTelemetry(null);
    setSelectedViolation(violation);
  };

  const handleSelectTelemetry = (sensor: SimulatedTelemetrySensor) => {
    setSelectedViolation(null);
    setSelectedTelemetry(sensor);
  };

  const handleCloseDrawer = () => {
    setSelectedViolation(null);
    setSelectedTelemetry(null);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* 1. System Header */}
      <Header
        mine={MINE_001_DATA}
        governance={MINE_001_GOVERNANCE}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenProvenance={() => setIsProvenanceOpen(true)}
      />

      {/* 2. Main Visualization Canvas */}
      <main className="relative flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* 2D View */}
        {viewMode === '2D' && (
          <Gis2DView
            mine={MINE_001_DATA}
            governance={MINE_001_GOVERNANCE}
            telemetry={telemetryState}
            onSelectViolation={handleSelectViolation}
            onSelectTelemetry={handleSelectTelemetry}
            onOpenProvenance={() => setIsProvenanceOpen(true)}
          />
        )}

        {/* 3D View */}
        {viewMode === '3D' && (
          <Terrain3DView
            mine={MINE_001_DATA}
            governance={MINE_001_GOVERNANCE}
            telemetry={telemetryState}
            onSelectViolation={handleSelectViolation}
            onSelectTelemetry={handleSelectTelemetry}
            onOpenProvenance={() => setIsProvenanceOpen(true)}
          />
        )}

        {/* Split 2D / 3D View */}
        {viewMode === 'SPLIT' && (
          <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full divide-y md:divide-y-0 md:divide-x divide-neutral-800">
            <div className="relative w-full h-full">
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-700 text-[10px] font-mono text-sky-400 font-bold shadow">
                2D GIS (LEAFLET)
              </div>
              <Gis2DView
                mine={MINE_001_DATA}
                governance={MINE_001_GOVERNANCE}
                telemetry={telemetryState}
                onSelectViolation={handleSelectViolation}
                onSelectTelemetry={handleSelectTelemetry}
                onOpenProvenance={() => setIsProvenanceOpen(true)}
              />
            </div>
            <div className="relative w-full h-full">
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-700 text-[10px] font-mono text-sky-400 font-bold shadow">
                3D TERRAIN (COPERNICUS DEM)
              </div>
              <Terrain3DView
                mine={MINE_001_DATA}
                governance={MINE_001_GOVERNANCE}
                telemetry={telemetryState}
                onSelectViolation={handleSelectViolation}
                onSelectTelemetry={handleSelectTelemetry}
                onOpenProvenance={() => setIsProvenanceOpen(true)}
              />
            </div>
          </div>
        )}

        {/* 3. Detailed Inspection Drawer */}
        <ComplianceDrawer
          selectedViolation={selectedViolation}
          selectedTelemetry={selectedTelemetry}
          onClose={handleCloseDrawer}
        />
      </main>

      {/* 4. Provenance & Source-of-Truth Modal */}
      <DataProvenancePanel
        mine={MINE_001_DATA}
        governance={MINE_001_GOVERNANCE}
        telemetry={telemetryState}
        isOpen={isProvenanceOpen}
        onClose={() => setIsProvenanceOpen(false)}
      />
    </div>
  );
}
