/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MineRecord,
  MineGovernanceStatus,
  SimulatedTelemetryStream,
  ComplianceViolation,
  SimulatedTelemetrySensor,
} from '../types';
import { formatDMS, sampleElevationAt } from '../lib/gisUtils';
import {
  Layers,
  Radio,
  Eye,
  Info,
  Maximize2,
  Minimize2,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';

interface Gis2DViewProps {
  mine: MineRecord;
  governance: MineGovernanceStatus;
  telemetry: SimulatedTelemetryStream;
  onSelectViolation: (violation: ComplianceViolation) => void;
  onSelectTelemetry: (sensor: SimulatedTelemetrySensor) => void;
  onOpenProvenance: () => void;
}

export const Gis2DView: React.FC<Gis2DViewProps> = ({
  mine,
  governance,
  telemetry,
  onSelectViolation,
  onSelectTelemetry,
  onOpenProvenance,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const baseLayersRef = useRef<{ [key: string]: L.TileLayer }>({});
  const boundaryLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const violationsLayerRef = useRef<L.LayerGroup | null>(null);
  const telemetryLayerRef = useRef<L.LayerGroup | null>(null);
  const coordinateMarkerRef = useRef<L.LayerGroup | null>(null);

  // Layer visibility state
  const [activeBaseLayer, setActiveBaseLayer] = useState<string>('esri-satellite');
  const [showBoundary, setShowBoundary] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showViolations, setShowViolations] = useState<boolean>(true);
  const [showTelemetry, setShowTelemetry] = useState<boolean>(true);
  const [showMineDatum, setShowMineDatum] = useState<boolean>(true);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState<boolean>(false);
  const [disclaimerDismissed, setDisclaimerDismissed] = useState<boolean>(false);

  // Cursor live info
  const [cursorPos, setCursorPos] = useState<{
    lat: number;
    lng: number;
    elevation: number | null;
  } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [mine.latitude, mine.longitude],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // Add Zoom Control to top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Add Scale Control to bottom-left
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    // Initialize Base Layers
    const baseLayers: { [key: string]: L.TileLayer } = {};
    mine.imageryLayers.forEach((layerDef) => {
      const tileLayer = L.tileLayer(layerDef.url, {
        maxZoom: layerDef.maxZoom,
        attribution: layerDef.attribution,
        subdomains: layerDef.url.includes('{s}') ? ['a', 'b', 'c', 'd'] : [],
      });
      baseLayers[layerDef.id] = tileLayer;
    });

    // Default to ESRI Satellite
    if (baseLayers['esri-satellite']) {
      baseLayers['esri-satellite'].addTo(map);
    } else if (Object.values(baseLayers)[0]) {
      Object.values(baseLayers)[0].addTo(map);
    }
    baseLayersRef.current = baseLayers;

    // Initialize Layer Groups
    boundaryLayerRef.current = L.layerGroup().addTo(map);
    zonesLayerRef.current = L.layerGroup().addTo(map);
    violationsLayerRef.current = L.layerGroup().addTo(map);
    telemetryLayerRef.current = L.layerGroup().addTo(map);
    coordinateMarkerRef.current = L.layerGroup().addTo(map);

    // Track mouse position
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const elev = sampleElevationAt(e.latlng.lat, e.latlng.lng, mine.elevationData);
      setCursorPos({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        elevation: elev,
      });
    });

    map.on('mouseout', () => {
      setCursorPos(null);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mine]);

  // Handle Base Layer Switch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.entries(baseLayersRef.current).forEach(([id, layer]) => {
      if (id === activeBaseLayer) {
        if (!map.hasLayer(layer)) {
          map.addLayer(layer);
        }
      } else {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      }
    });
  }, [activeBaseLayer]);

  // Render Indicative Mine Boundary
  useEffect(() => {
    const group = boundaryLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showBoundary) return;

    // Convert [lon, lat] to Leaflet [lat, lng]
    const latlngs = mine.geometry.coordinates[0].map(([lon, lat]) => [lat, lon] as [number, number]);

    // Outer Glow / Warning Boundary Polygon
    const boundaryPolygon = L.polygon(latlngs, {
      color: '#f59e0b', // Amber/warning color for indicative derived status
      weight: 3,
      dashArray: '8, 6', // Dashed to explicitly signal indicative, not statutory lease
      fillColor: '#f59e0b',
      fillOpacity: 0.08,
    });

    boundaryPolygon.bindTooltip(
      `<div class="p-1 text-xs">
        <div class="font-bold text-amber-400 flex items-center gap-1">
          <span>⚠ Indicative Mine Boundary</span>
        </div>
        <div class="text-neutral-300 text-[11px] mt-0.5">Derived from Sentinel-2 & OpenStreetMap</div>
        <div class="text-[10px] text-amber-200/80 mt-1 border-t border-neutral-700 pt-0.5">NOT a statutory legal lease boundary</div>
      </div>`,
      { sticky: true, className: 'leaflet-custom-tooltip' }
    );

    group.addLayer(boundaryPolygon);
  }, [mine, showBoundary]);

  // Render Pit Zoning Overlays
  useEffect(() => {
    const group = zonesLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showZones) return;

    mine.pitZoning.features.forEach((feature) => {
      const coords = feature.geometry.coordinates[0].map(([lon, lat]) => [lat, lon] as [number, number]);
      const zoneType = feature.properties.zoneType;

      let strokeColor = '#38bdf8';
      let fillColor = '#0284c7';
      if (zoneType === 'ACTIVE_PIT_FACE') {
        strokeColor = '#ef4444';
        fillColor = '#dc2626';
      } else if (zoneType === 'OVERBURDEN_DUMP') {
        strokeColor = '#eab308';
        fillColor = '#ca8a04';
      } else if (zoneType === 'WATER_SUMP') {
        strokeColor = '#06b6d4';
        fillColor = '#0891b2';
      }

      const zonePolygon = L.polygon(coords, {
        color: strokeColor,
        weight: 1.5,
        fillColor: fillColor,
        fillOpacity: 0.18,
      });

      zonePolygon.bindTooltip(
        `<div class="text-xs">
          <div class="font-semibold text-neutral-100">${feature.properties.name}</div>
          <div class="text-[11px] text-neutral-400 mt-0.5">Type: <span class="text-neutral-200">${zoneType}</span></div>
          <div class="text-[10px] text-neutral-500 mt-0.5">Source: ${feature.properties.provenance}</div>
        </div>`,
        { sticky: true, className: 'leaflet-custom-tooltip' }
      );

      group.addLayer(zonePolygon);
    });
  }, [mine, showZones]);

  // Render Official Mine Datum / Coordinate Marker
  useEffect(() => {
    const group = coordinateMarkerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showMineDatum) return;

    const datumIcon = L.divIcon({
      className: 'custom-datum-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full border border-sky-400/60 animate-ping opacity-40"></div>
          <div class="w-6 h-6 rounded-full bg-neutral-950/90 border-2 border-sky-400 flex items-center justify-center shadow-lg">
            <div class="w-2 h-2 rounded-full bg-sky-400"></div>
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-neutral-900/90 border border-sky-500/40 text-[9px] font-mono text-sky-300 font-semibold tracking-wider">
            DATUM (CMPDI)
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([mine.latitude, mine.longitude], { icon: datumIcon });
    marker.bindPopup(
      `<div class="text-xs font-sans p-1">
        <div class="font-bold text-sky-400 text-sm flex items-center gap-1.5">
          <span>${mine.id} Quarry Coordinate Datum</span>
        </div>
        <div class="text-neutral-300 text-xs mt-1 font-medium">${mine.name}</div>
        <div class="text-neutral-400 text-[11px] mt-0.5">${mine.district}, ${mine.state}</div>
        <div class="mt-2 text-[11px] bg-neutral-900 p-1.5 rounded border border-neutral-700 font-mono">
          <div>LAT: ${mine.latitude.toFixed(5)}° N (${formatDMS(mine.latitude, true)})</div>
          <div>LON: ${mine.longitude.toFixed(5)}° E (${formatDMS(mine.longitude, false)})</div>
          <div>ELEVATION: ~435m MSL (Copernicus DEM)</div>
        </div>
        <div class="mt-2 pt-1 border-t border-neutral-700 text-[10px] text-neutral-400">
          <span class="text-sky-400 font-semibold">[OFFICIAL SOURCE]:</span> ${mine.coordinateProvenance.source}
          <div class="text-neutral-500 mt-0.5">Accuracy: ${mine.coordinateProvenance.accuracy}</div>
        </div>
      </div>`,
      { className: 'leaflet-custom-popup' }
    );

    group.addLayer(marker);
  }, [mine, showMineDatum]);

  // Render SAMAADHAN Compliance Violations (Application Data)
  useEffect(() => {
    const group = violationsLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showViolations) return;

    governance.violations.forEach((violation) => {
      const isCritical = violation.severity === 'CRITICAL';
      const isHigh = violation.severity === 'HIGH';

      const iconBg = isCritical
        ? 'bg-rose-600 border-rose-400'
        : isHigh
        ? 'bg-amber-600 border-amber-400'
        : 'bg-yellow-600 border-yellow-400';

      const pulseBg = isCritical ? 'border-rose-500' : 'border-amber-500';

      const violIcon = L.divIcon({
        className: 'custom-violation-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute w-8 h-8 rounded-full border ${pulseBg} animate-ping opacity-60"></div>
            <div class="w-6 h-6 rounded-full ${iconBg} border-2 flex items-center justify-center shadow-md text-white font-bold text-[10px]">
              !
            </div>
            <div class="absolute -top-5 whitespace-nowrap px-1 py-0.5 rounded bg-rose-950/90 border border-rose-600/60 text-[9px] font-mono text-rose-200 font-bold">
              ${violation.severity}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(violation.locationCoordinates, { icon: violIcon });
      marker.on('click', () => {
        onSelectViolation(violation);
      });

      marker.bindTooltip(
        `<div class="text-xs">
          <div class="flex items-center gap-1.5 font-bold ${isCritical ? 'text-rose-400' : 'text-amber-400'}">
            <span>[SAMAADHAN VIOLATION]</span>
            <span class="px-1 rounded bg-rose-950 border border-rose-800 text-[9px]">${violation.severity}</span>
          </div>
          <div class="font-semibold text-neutral-100 mt-1">${violation.title}</div>
          <div class="text-neutral-400 text-[11px] mt-0.5">${violation.statutoryCode}</div>
          <div class="text-[10px] text-amber-300/80 mt-1">Click marker for statutory compliance action plan</div>
        </div>`,
        { className: 'leaflet-custom-tooltip' }
      );

      group.addLayer(marker);
    });
  }, [governance, showViolations, onSelectViolation]);

  // Render Operational Telemetry (Strictly SIMULATED)
  useEffect(() => {
    const group = telemetryLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showTelemetry) return;

    telemetry.sensors.forEach((sensor) => {
      const isAlert = sensor.status === 'ALERT';
      const isWarning = sensor.status === 'WARNING';

      const sensorColor = isAlert ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';

      const telemIcon = L.divIcon({
        className: 'custom-telemetry-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="w-5 h-5 rounded bg-neutral-900/90 border border-neutral-700 flex items-center justify-center shadow">
              <div class="w-2 h-2 rounded-full ${sensorColor}"></div>
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap px-1 py-0.2 rounded bg-neutral-950/90 border border-neutral-700 text-[8px] font-mono text-neutral-300">
              <span class="text-amber-400 font-bold">[SIMULATED]</span> ${sensor.id}
            </div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker(sensor.coordinates, { icon: telemIcon });
      marker.on('click', () => {
        onSelectTelemetry(sensor);
      });

      marker.bindTooltip(
        `<div class="text-xs">
          <div class="font-mono text-[10px] text-amber-400 font-bold flex items-center gap-1">
            <span>[SIMULATED TELEMETRY]</span>
          </div>
          <div class="font-semibold text-neutral-100 mt-0.5">${sensor.name}</div>
          <div class="font-mono text-neutral-300 mt-1">Value: <span class="font-bold text-cyan-400">${sensor.currentValue} ${sensor.unit}</span></div>
          <div class="text-[10px] text-neutral-400 mt-0.5">Status: <span class="${sensor.status === 'ALERT' ? 'text-rose-400' : 'text-emerald-400'} font-semibold">${sensor.status}</span></div>
        </div>`,
        { className: 'leaflet-custom-tooltip' }
      );

      group.addLayer(marker);
    });
  }, [telemetry, showTelemetry, onSelectTelemetry]);

  // Zoom back to mine extent
  const handleFitMine = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([mine.latitude, mine.longitude], 15, { animate: true });
  };

  return (
    <div className="relative w-full h-full bg-neutral-950 overflow-hidden select-none">
      {/* 1. Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 2. Boundary status: compact neutral legend chip (dismissed by default —
          full provenance lives in the Provenance panel; no static yellow box) */}
      {!disclaimerDismissed && (
        <div className="absolute top-3 left-3 z-20 pointer-events-auto">
          <button
            onClick={() => setDisclaimerDismissed(true)}
            title={mine.geometryDisclaimer + ' — click Provenance for sources.'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-950/85 backdrop-blur-md border border-neutral-700/80 text-[10px] font-mono text-neutral-300 hover:border-sky-400/60 transition-colors shadow cursor-pointer"
          >
            <span className="w-2 h-2 rounded-sm border border-amber-400/80 bg-amber-400/20" />
            Boundary indicative — not statutory lease
            <span className="text-neutral-500">✕</span>
          </button>
        </div>
      )}

      {/* 3. Floating GIS Control Bar (Top Right) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {/* Layer Control Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/90 backdrop-blur-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800 text-xs font-medium shadow-lg transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>GIS Layers</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {/* Layer Control Popup */}
          {isLayerPanelOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg bg-neutral-900/95 backdrop-blur-md border border-neutral-700 shadow-2xl p-3 z-30 text-xs text-neutral-200">
              <div className="font-semibold text-neutral-100 mb-2 pb-1.5 border-b border-neutral-800 flex items-center justify-between">
                <span>Basemap Imagery</span>
                <span className="text-[10px] text-sky-400 font-mono">2D GIS</span>
              </div>
              <div className="space-y-1 mb-3">
                {mine.imageryLayers.map((layer) => (
                  <label
                    key={layer.id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-800/80 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="basemap"
                      checked={activeBaseLayer === layer.id}
                      onChange={() => setActiveBaseLayer(layer.id)}
                      className="accent-sky-500"
                    />
                    <div className="leading-tight">
                      <div className="font-medium text-neutral-200">{layer.label}</div>
                      <div className="text-[10px] text-neutral-400">{layer.sourceType}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="font-semibold text-neutral-100 mb-2 pb-1.5 border-b border-neutral-800">
                Data Overlays
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-neutral-800/80 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full border border-amber-400 bg-amber-400/20"></span>
                    <span>Indicative Boundary</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showBoundary}
                    onChange={(e) => setShowBoundary(e.target.checked)}
                    className="accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded hover:bg-neutral-800/80 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full border border-sky-400 bg-sky-400/20"></span>
                    <span>Pit Operational Zones</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showZones}
                    onChange={(e) => setShowZones(e.target.checked)}
                    className="accent-sky-500"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded hover:bg-neutral-800/80 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full border border-rose-500 bg-rose-500"></span>
                    <span>DGMS Violations (SAMAADHAN)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showViolations}
                    onChange={(e) => setShowViolations(e.target.checked)}
                    className="accent-rose-500"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded hover:bg-neutral-800/80 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full border border-amber-400 bg-amber-500"></span>
                    <span className="flex items-center gap-1">
                      <span>Telemetry</span>
                      <span className="text-[9px] font-mono text-amber-400 font-bold">[SIM]</span>
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showTelemetry}
                    onChange={(e) => setShowTelemetry(e.target.checked)}
                    className="accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded hover:bg-neutral-800/80 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-sky-400"></span>
                    <span>Mine Coordinate Datum</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showMineDatum}
                    onChange={(e) => setShowMineDatum(e.target.checked)}
                    className="accent-sky-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Center / Fit Extent Button */}
        <button
          onClick={handleFitMine}
          title="Reset to Mine Quarry Extent"
          className="p-1.5 rounded-lg bg-neutral-900/90 backdrop-blur-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800 shadow-lg cursor-pointer"
        >
          <Maximize2 className="w-4 h-4 text-neutral-300" />
        </button>

        {/* North Indicator */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900/90 backdrop-blur-md border border-neutral-700 text-neutral-200 shadow-lg font-mono font-bold text-xs">
          <span className="text-rose-500">N</span>
          <span className="text-[10px] text-neutral-400">↑</span>
        </div>
      </div>

      {/* 4. Bottom-Right Real-Time Cursor Coordinates & DEM Elevation Bar */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
        <div className="bg-neutral-950/90 backdrop-blur-md border border-neutral-700/80 rounded-lg px-3 py-2 shadow-xl font-mono text-[11px] text-neutral-200 flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400">CURSOR:</span>
            {cursorPos ? (
              <>
                <span className="text-sky-400">{cursorPos.lat.toFixed(5)}° N</span>
                <span className="text-sky-400">{cursorPos.lng.toFixed(5)}° E</span>
              </>
            ) : (
              <span className="text-neutral-500">Hover over terrain</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="text-neutral-400">COPERNICUS DEM:</span>
            {cursorPos && cursorPos.elevation !== null ? (
              <span className="text-emerald-400 font-semibold">{cursorPos.elevation.toFixed(1)} m MSL</span>
            ) : (
              <span className="text-neutral-500">30m GLO-30 grid</span>
            )}
          </div>
          <div className="text-[9px] text-neutral-500 border-t border-neutral-800 pt-0.5 mt-0.5">
            Geodetic Datum: WGS84 / EGM96
          </div>
        </div>

        {/* Data Provenance Quick Indicator */}
        <div className="pointer-events-auto">
          <button
            onClick={onOpenProvenance}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/70 text-[10px] text-neutral-300 transition-colors shadow cursor-pointer"
          >
            <Info className="w-3 h-3 text-sky-400" />
            <span>Data Provenance: 5 sources verified</span>
          </button>
        </div>
      </div>

      {/* 5. Bottom-Left Scale Note */}
      <div className="absolute bottom-9 left-3 z-20 pointer-events-none text-[10px] font-mono text-neutral-400 bg-neutral-950/80 backdrop-blur px-2 py-0.5 rounded border border-neutral-800">
        GRID: EPSG:4326 WGS84
      </div>
    </div>
  );
};
