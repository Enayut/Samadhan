import React, { useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Cpu, ShieldAlert, Activity, AlertTriangle, 
  MapPin, Settings2, Target, Video, Layers, Wind, Droplets
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Open Pit Mine Geometry in Three.js
function OpenPit({ riskScore, activeLayerCount }: { riskScore: number, activeLayerCount: number }) {
  const maxRadius = 40;
  const minRadius = 10;
  const depth = 25;
  const tierHeight = depth / 8; // Max 8 tiers
  const tierWidth = (maxRadius - minRadius) / 8;
  const groupRef = useRef<THREE.Group>(null);

  const isHighRisk = riskScore > 60;
  const isMediumRisk = riskScore > 30 && riskScore <= 60;
  const dangerColor = isHighRisk ? '#C1502E' : isMediumRisk ? '#F2A93B' : '#4C7A66';

  // Rotate slowly
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: activeLayerCount }).map((_, i) => {
        const r = maxRadius - i * tierWidth;
        const nextR = maxRadius - (i + 1) * tierWidth;
        const y = -i * tierHeight;
        
        // Let's highlight layer 3 if there's high risk
        const isHazard = isHighRisk && i === 3;
        
        return (
          <group key={i}>
            {/* Horizontal Terrace (Ring) */}
            <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[nextR, r, 64]} />
              <meshStandardMaterial 
                color={isHazard ? dangerColor : '#1a2026'} 
                roughness={0.9} 
                metalness={0.1}
                emissive={isHazard ? dangerColor : '#000000'}
                emissiveIntensity={isHazard ? 0.5 : 0}
              />
            </mesh>
            
            {/* Vertical Drop (Cylinder) */}
            <mesh position={[0, y - tierHeight / 2, 0]}>
              <cylinderGeometry args={[nextR, nextR, tierHeight, 64, 1, true]} />
              <meshStandardMaterial 
                color={isHazard ? dangerColor : '#12161A'} 
                roughness={1} 
                metalness={0} 
                side={THREE.DoubleSide} 
              />
            </mesh>
            
            {/* Edge Highlights (Wireframe) */}
            <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[nextR, r, 64]} />
              <meshBasicMaterial 
                color={isHazard ? dangerColor : '#2A3138'} 
                wireframe 
                opacity={isHazard ? 0.8 : 0.2} 
                transparent 
              />
            </mesh>
          </group>
        );
      })}

      {/* Deepest point floor */}
      <mesh position={[0, -activeLayerCount * tierHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[maxRadius - activeLayerCount * tierWidth, 64]} />
        <meshStandardMaterial color={isHighRisk && activeLayerCount === 8 ? dangerColor : '#0a0d0f'} roughness={1} />
      </mesh>

      {/* Surrounding Ground Plane */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[maxRadius, 150, 64]} />
        <meshStandardMaterial color="#0E1114" roughness={1} />
      </mesh>

      {/* Holographic scanning radar ring */}
      <RadarRing radius={maxRadius + 10} color={dangerColor} />
    </group>
  );
}

function RadarRing({ radius, color }: { radius: number, color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      const scale = 1 + (Math.sin(state.clock.elapsedTime * 2) * 0.05);
      ref.current.scale.set(scale, scale, scale);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + (Math.sin(state.clock.elapsedTime * 4) * 0.2);
    }
  });

  return (
    <mesh ref={ref} position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 1, radius, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Particle system for floating data points / dust
function DataParticles() {
  const count = 300;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 20 - 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.3} color="#4C7A66" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

export function Site3DView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAppContext();
  
  const [layers, setLayers] = useState(6);
  
  const site = state.sites.find(s => s.id === id);
  
  const siteData = useMemo(() => {
    if (!site) return null;
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
    return {
      ...site,
      riskScore: Math.min(score, 100),
      violations: siteObjs.filter(o => o.status !== 'Closed')
    };
  }, [site, state.govObjects]);

  if (!siteData) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl text-paper-50 font-display">Site not found</h2>
        <button onClick={() => navigate('/gis')} className="mt-4 text-steel">Return to Map</button>
      </div>
    );
  }

  const isHighRisk = siteData.riskScore > 60;
  const isMediumRisk = siteData.riskScore > 30 && siteData.riskScore <= 60;

  return (
    <div className="flex flex-col h-full -m-4 lg:-m-6 relative bg-[#0E1114]">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <button 
            onClick={() => navigate('/gis')}
            className="flex items-center gap-2 text-paper-100 hover:text-paper-50 bg-anthracite-950/80 backdrop-blur border border-anthracite-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Back to Network Map
          </button>
          
          <div className="bg-anthracite-950/80 backdrop-blur border border-anthracite-800 p-5 rounded-xl shadow-xl w-80">
            <div className="text-[10px] font-bold text-steel tracking-widest uppercase mb-1 flex items-center gap-2">
              <Cpu size={12} /> Digital Twin Active
            </div>
            <h1 className="text-3xl font-display font-bold text-paper-50 tracking-tight">{siteData.name}</h1>
            <p className="text-sm text-paper-100/60 mt-1">{siteData.subsidiary} • {siteData.district}</p>
            
            <div className="mt-6 pt-6 border-t border-anthracite-800 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-paper-100/50 mb-1">Risk Index</div>
                <div className={`text-2xl font-display font-bold ${isHighRisk ? 'text-signal-rust' : isMediumRisk ? 'text-safety-amber' : 'text-verdant'}`}>
                  {siteData.riskScore}<span className="text-sm text-paper-100/30">/100</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-paper-100/50 mb-1">Open Violations</div>
                <div className="text-2xl font-display font-bold text-paper-50">
                  {siteData.violations.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-3">
          <button className="w-10 h-10 rounded-lg bg-anthracite-950/80 backdrop-blur border border-anthracite-800 flex items-center justify-center text-paper-100 hover:text-paper-50 hover:bg-anthracite-900 transition-colors shadow-xl" title="Toggle Layers" onClick={() => setLayers(l => l === 6 ? 3 : 6)}>
            <Layers size={18} />
          </button>
          <button className="w-10 h-10 rounded-lg bg-anthracite-950/80 backdrop-blur border border-anthracite-800 flex items-center justify-center text-paper-100 hover:text-paper-50 hover:bg-anthracite-900 transition-colors shadow-xl" title="Sensors">
            <Target size={18} />
          </button>
          <button className="w-10 h-10 rounded-lg bg-anthracite-950/80 backdrop-blur border border-anthracite-800 flex items-center justify-center text-paper-100 hover:text-paper-50 hover:bg-anthracite-900 transition-colors shadow-xl" title="Camera Feeds">
            <Video size={18} />
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative overflow-hidden bg-[#0E1114]">
        <Canvas camera={{ position: [50, 40, 50], fov: 45 }} className="w-full h-full">
          <ambientLight intensity={0.4} />
          <directionalLight position={[100, 100, 50]} intensity={1} castShadow />
          
          <OpenPit riskScore={siteData.riskScore} activeLayerCount={layers} />
          <DataParticles />
          
          <OrbitControls 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2 - 0.1} 
            minDistance={30} 
            maxDistance={150}
            target={[0, -10, 0]}
          />
        </Canvas>

        {isHighRisk && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-signal-rust/20 backdrop-blur-md border border-signal-rust/30 text-signal-rust px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-[0_0_25px_rgba(193,80,46,0.25)] animate-pulse pointer-events-none">
            <ShieldAlert size={16} /> Structural Subsidence Hazard Detected in Strata 3
          </div>
        )}
      </div>

      {/* Footer Info Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none p-6">
        <div className="pointer-events-auto bg-anthracite-950/80 backdrop-blur border border-anthracite-800 rounded-xl p-4 shadow-2xl max-w-2xl ml-auto flex gap-6 items-center">
          <div className="flex-1">
            <div className="text-[10px] uppercase font-bold text-paper-100/50 mb-2">Live Telemetry</div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-sm text-paper-100">
                 <Wind size={16} className="text-steel" /> Air Qual: <span className="font-mono text-safety-amber">112 AQI</span>
               </div>
               <div className="flex items-center gap-2 text-sm text-paper-100">
                 <Droplets size={16} className="text-steel" /> Moisture: <span className="font-mono text-verdant">42%</span>
               </div>
               <div className="flex items-center gap-2 text-sm text-paper-100">
                 <Activity size={16} className="text-steel" /> Seismic: <span className="font-mono text-paper-100">0.2mm/s</span>
               </div>
            </div>
          </div>
          <div className="border-l border-anthracite-800 pl-6 shrink-0">
             <button className="bg-steel hover:bg-steel/90 text-anthracite-950 font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm">
                <Settings2 size={16} /> System Control
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
