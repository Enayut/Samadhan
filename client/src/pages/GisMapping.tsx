import React, { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
// @ts-ignore
import 'leaflet/dist/leaflet.css';

// Coordinates for Indian coal sites
const SITE_COORDS: Record<string, [number, number]> = {
  'MINE-001': [23.74, 86.41], // Jharia
  'MINE-002': [22.35, 82.68], // Korba
  'MINE-003': [20.95, 85.23], // Talcher
  'MINE-004': [24.19, 82.66], // Singrauli
  'MINE-005': [21.14, 79.08], // WCL
  'MINE-006': [23.79, 86.43], // BCCL
  'MINE-007': [17.55, 80.61], // SCCL
  'MINE-008': [23.68, 86.98], // ECL
};

const createCustomIcon = (riskScore: number) => {
  const isHighRisk = riskScore > 60;
  const isMediumRisk = riskScore > 30 && riskScore <= 60;
  
  const colorClass = isHighRisk ? 'bg-signal-rust' : isMediumRisk ? 'bg-safety-amber' : 'bg-verdant';
  const shadowColor = isHighRisk ? '#C1502E' : isMediumRisk ? '#F2A93B' : '#4C7A66';

  const html = `
    <div class="relative cursor-pointer" style="width: 16px; height: 16px; transform: translate(-8px, -8px);">
      ${isHighRisk ? `<span class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${shadowColor};"></span>` : ''}
      <div class="relative w-4 h-4 rounded-full ${colorClass} ring-2 ring-anthracite-950 transition-transform hover:scale-125" style="box-shadow: 0 0 15px ${shadowColor};"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [0, 0],
  });
};

export function GisMapping() {
  const { state } = useAppContext();
  const navigate = useNavigate();

  // Calculate risk scores mapping
  const siteData = useMemo(() => {
    return state.sites.map(site => {
      const siteObjs = state.govObjects.filter(o => o.mineId === site.id);
      
      let score = 20; 
      let violationCount = 0;
      
      siteObjs.forEach(o => {
        if (o.status !== 'Closed') {
          violationCount++;
          if (o.severity === 'Critical') score += 25;
          else if (o.severity === 'High') score += 15;
          else if (o.severity === 'Medium') score += 5;
          else score += 2;

          if (o.status === 'Overdue' || o.status === 'Escalated') score += 10;
        }
      });

      score = Math.min(score, 100);

      // Default to central India if unknown
      const coords = SITE_COORDS[site.id] || [22.0, 80.0];

      return {
        ...site,
        riskScore: score,
        violationCount,
        coords
      };
    });
  }, [state.sites, state.govObjects]);

  const highRiskCount = siteData.filter(s => s.riskScore > 60).length;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-anthracite-950">GIS Mapping</h1>
          <p className="text-anthracite-800/80 mt-1">Live geospatial monitoring of operations and risk.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-anthracite-950">High Risk Sites</p>
            <p className="text-2xl font-bold text-signal-rust">{highRiskCount}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-anthracite-950 rounded-xl border border-anthracite-800 shadow-inner relative overflow-hidden flex flex-col">
        {/* Map Controls Overlay */}
        <div className="absolute top-4 left-4 z-[400] flex gap-2">
          <div className="bg-anthracite-900/90 backdrop-blur border border-anthracite-800 p-2 rounded-lg flex gap-3 text-xs font-medium text-paper-100 shadow-xl">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-verdant shadow-[0_0_8px_#4C7A66]"></span> Nominal</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-safety-amber shadow-[0_0_8px_#F2A93B]"></span> Elevated</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-signal-rust shadow-[0_0_8px_#C1502E]"></span> Critical</span>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="flex-1 relative bg-[#0E1114] z-0">
          <MapContainer 
            center={[21.5, 83.0]} 
            zoom={6} 
            scrollWheelZoom={true} 
            className="w-full h-full bg-[#0E1114]"
            zoomControl={false} // Disable default to keep it clean, could add custom controls
          >
            {/* Dark industrial map tiles from CartoDB */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {siteData.map(site => {
              const isHighRisk = site.riskScore > 60;
              const colorClass = isHighRisk ? 'text-signal-rust' : site.riskScore > 30 ? 'text-safety-amber' : 'text-verdant';
              
              return (
                <Marker 
                  key={site.id} 
                  position={site.coords}
                  icon={createCustomIcon(site.riskScore)}
                  eventHandlers={{
                    click: () => {
                      navigate(`/site/${site.id}`);
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -15]} className="custom-leaflet-tooltip" permanent={false}>
                    <div className="bg-anthracite-950/95 backdrop-blur-md border border-anthracite-800 rounded-xl p-4 shadow-2xl w-56 text-paper-50 pointer-events-none">
                       <div className="text-[10px] uppercase font-bold tracking-widest text-paper-100/50 mb-1 flex items-center justify-between">
                         <span>Live Telemetry</span>
                         <span className="w-1.5 h-1.5 rounded-full bg-safety-amber animate-pulse"></span>
                       </div>
                       <div className="text-xl font-display font-bold text-paper-50 mb-4 tracking-tight">{site.name}</div>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="bg-anthracite-900/50 rounded-lg p-2 border border-anthracite-800/50">
                            <div className="text-[9px] text-paper-100/50 uppercase tracking-wider mb-0.5">Risk Score</div>
                            <div className={`text-xl font-display font-bold ${colorClass}`}>{site.riskScore}</div>
                          </div>
                          <div className="bg-anthracite-900/50 rounded-lg p-2 border border-anthracite-800/50">
                            <div className="text-[9px] text-paper-100/50 uppercase tracking-wider mb-0.5">Tasks</div>
                            <div className="text-xl font-display font-bold text-paper-50">{site.violationCount}</div>
                          </div>
                       </div>
                       {isHighRisk && (
                         <div className="mt-3 text-[10px] uppercase text-signal-rust font-bold bg-signal-rust/10 border border-signal-rust/20 px-2 py-1.5 rounded text-center tracking-wider">
                           Critical Action Required
                         </div>
                       )}
                       <div className="mt-3 text-[10px] text-paper-100/40 text-center uppercase tracking-wider">
                         Click to view Digital Twin
                       </div>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
