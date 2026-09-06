import React, { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
// @ts-ignore
import 'leaflet/dist/leaflet.css';

export function AreaMap() {
  const { state } = useAppContext();
  const navigate = useNavigate();

  // Per-mine attention state derived from the shared obligations — no fake risk scores.
  const siteData = useMemo(() => {
    return state.sites.map((site) => {
      const tasks = state.tasks.filter((t) => t.mineId === site.id && t.status !== 'PROPOSED');
      const verified = tasks.filter((t) => t.status === 'VERIFIED').length;
      const open = tasks.filter((t) => t.status !== 'VERIFIED').length;
      const overdue = tasks.filter((t) => ['OVERDUE', 'ESCALATED'].includes(t.status)).length;
      const awaiting = tasks.filter((t) => t.status === 'AWAITING_VERIFICATION').length;
      const level = overdue > 0 ? 'attention' : open > 0 ? 'active' : 'nominal';
      return { site, open, verified, overdue, awaiting, level };
    });
  }, [state.sites, state.tasks]);

  const attentionCount = siteData.filter((s) => s.level === 'attention').length;
  const center: [number, number] = [23.78, 85.03];
  const bounds: [[number, number], [number, number]] = [
    [23.62, 84.9],
    [23.95, 85.15],
  ];

  const createCustomIcon = (level: string) => {
    const colorClass =
      level === 'attention' ? 'bg-signal-rust' : level === 'active' ? 'bg-safety-amber' : 'bg-verdant';
    const shadowColor = level === 'attention' ? '#C1502E' : level === 'active' ? '#F2A93B' : '#4C7A66';
    const html = `
      <div class="relative cursor-pointer" style="width: 18px; height: 18px; transform: translate(-9px, -9px);">
        ${level === 'attention' ? `<span class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${shadowColor};"></span>` : ''}
        <div class="relative w-4 h-4 rounded-full ${colorClass} ring-2 ring-anthracite-950 transition-transform hover:scale-125" style="box-shadow: 0 0 15px ${shadowColor};"></div>
      </div>
    `;
    return L.divIcon({ html, className: 'custom-leaflet-marker', iconSize: [0, 0] });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-anthracite-950">Area Map</h1>
          <p className="text-anthracite-800/80 mt-1">
            Five CCL mines across the North Karanpura Coalfield — color reflects live compliance state.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-anthracite-950">Attention required</p>
          <p className="text-2xl font-bold text-signal-rust">{attentionCount}</p>
        </div>
      </div>

      <div className="flex-1 bg-anthracite-950 rounded-xl border border-anthracite-800 shadow-inner relative overflow-hidden flex flex-col">
        {/* Legend overlay */}
        <div className="absolute top-4 left-4 z-[400] flex gap-2">
          <div className="bg-anthracite-900/90 backdrop-blur border border-anthracite-800 p-2 rounded-lg flex gap-3 text-xs font-medium text-paper-100 shadow-xl">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-verdant shadow-[0_0_8px_#4C7A66]"></span> Nominal</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-safety-amber shadow-[0_0_8px_#F2A93B]"></span> Active</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-signal-rust shadow-[0_0_8px_#C1502E]"></span> Attention</span>
          </div>
        </div>

        <div className="flex-1 relative bg-[#0E1114] z-0">
          <MapContainer
            center={center}
            zoom={11}
            minZoom={10}
            scrollWheelZoom={true}
            className="w-full h-full bg-[#0E1114]"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {siteData.map(({ site, open, verified, overdue, level }) => {
              const colorClass =
                level === 'attention' ? 'text-signal-rust' : level === 'active' ? 'text-safety-amber' : 'text-verdant';
              return (
                <Marker
                  key={site.id}
                  position={[site.lat, site.lng]}
                  icon={createCustomIcon(level)}
                  eventHandlers={{
                    click: () => navigate(`/mine/${site.id}`),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -15]} className="custom-leaflet-tooltip" permanent={false}>
                    <div className="bg-anthracite-950/95 backdrop-blur-md border border-anthracite-800 rounded-xl p-4 shadow-2xl w-56 text-paper-50 pointer-events-none">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-paper-100/50 mb-1">
                        {site.id} · {site.type === 'OC' ? 'Opencast' : 'Underground'}
                      </div>
                      <div className="text-xl font-display font-bold text-paper-50 mb-1 tracking-tight">
                        {site.name}
                      </div>
                      <div className="text-[11px] text-paper-100/50 mb-3">
                        {site.subsidiary} · {site.district}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Open', value: open, color: 'text-paper-50' },
                          { label: 'Verified', value: verified, color: 'text-verdant' },
                          { label: 'Overdue', value: overdue, color: overdue > 0 ? 'text-signal-rust' : 'text-paper-50' },
                        ].map((cell) => (
                          <div key={cell.label} className="bg-anthracite-900/50 rounded-lg p-2 border border-anthracite-800/50">
                            <div className="text-[9px] text-paper-100/50 uppercase tracking-wider mb-0.5">{cell.label}</div>
                            <div className={`text-xl font-display font-bold ${cell.color}`}>
                              {cell.value}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-[10px] text-paper-100/40 text-center uppercase tracking-wider">
                        {site.gisAnchor ? 'Click · mine detail + GIS' : 'Click for mine detail'}
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
