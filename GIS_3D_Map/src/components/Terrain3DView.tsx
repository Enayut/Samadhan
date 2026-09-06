/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  MineRecord,
  MineGovernanceStatus,
  SimulatedTelemetryStream,
  ComplianceViolation,
  SimulatedTelemetrySensor,
} from '../types';
import { Geo3DTransform } from '../lib/geo3dTransform';
import { generateTerrainTextures, TerrainTextures } from '../lib/terrainTextures';
import { formatDMS } from '../lib/gisUtils';
import {
  Layers,
  RotateCcw,
  Compass,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  Radio,
  Eye,
  ShieldAlert,
  MapPin,
  X,
  ChevronRight,
} from 'lucide-react';

interface Terrain3DViewProps {
  mine: MineRecord;
  governance: MineGovernanceStatus;
  telemetry: SimulatedTelemetryStream;
  onSelectViolation: (violation: ComplianceViolation) => void;
  onSelectTelemetry: (sensor: SimulatedTelemetrySensor) => void;
  onOpenProvenance: () => void;
}

type TextureMode = 'satellite' | 'hypsometric' | 'slope' | 'wireframe';

interface SelectedMarkerDetail {
  id: string;
  type: 'violation' | 'telemetry';
  data: ComplianceViolation | SimulatedTelemetrySensor;
  title: string;
  badge: string;
  severityColor: string;
  statutoryCode?: string;
  status: string;
  keyMetric: string;
  secondaryMetric: string;
  coordinates: [number, number];
  worldPos: THREE.Vector3;
}

export const Terrain3DView: React.FC<Terrain3DViewProps> = ({
  mine,
  governance,
  telemetry,
  onSelectViolation,
  onSelectTelemetry,
  onOpenProvenance,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgOverlayRef = useRef<SVGSVGElement>(null);
  const calloutCardRef = useRef<HTMLDivElement>(null);

  // Three.js Core Refs (Persist across renders - never re-initialize on slider change)
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const overlaysGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const renderFrameRef = useRef<(() => void) | null>(null);

  // Interaction Refs
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const interactiveMeshesRef = useRef<{ mesh: THREE.Object3D; data: any; type: 'violation' | 'telemetry' }[]>([]);

  // Camera Orbit & Pan State
  const isDraggingRef = useRef(false);
  const isRightDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Initial 3D Camera Angles:
  // - phi: 0.96 rad (~55° from polar +Z, giving a natural 35° oblique elevation angle above the horizontal terrain)
  // - theta: -0.62 rad (~ -36°, facing into the pit looking toward North-East)
  // - radius: 140 (terrain covers ~75-80% of viewport with surrounding plateau context)
  const cameraAnglesRef = useRef({ theta: -Math.PI / 5, phi: 0.96, radius: 140 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 2.5));
  const [cameraHeadingDeg, setCameraHeadingDeg] = useState<number>(36);

  // Visual Controls State
  const [textureMode, setTextureMode] = useState<TextureMode>('satellite');
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(1.3);
  const [showBoundary3D, setShowBoundary3D] = useState<boolean>(true);
  const [showPitZones3D, setShowPitZones3D] = useState<boolean>(true);
  const [showViolations3D, setShowViolations3D] = useState<boolean>(true);
  const [showTelemetry3D, setShowTelemetry3D] = useState<boolean>(true);

  // Interactive Marker Selection State (Default: clean scene with NO permanent large cards)
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Terrain Hover Probing State
  const [hoveredTerrain, setHoveredTerrain] = useState<{
    lat: number;
    lon: number;
    elevation: number;
    slope: number;
    zoneName?: string;
  } | null>(null);

  // Single Shared Geographic-to-Three.js Transformation Engine
  const transform = useMemo(() => {
    return new Geo3DTransform({
      elevationData: mine.elevationData,
      meshWidth: 100,
      meshHeight: 100,
      verticalBaseScale: 0.12,
    });
  }, [mine]);

  // Pre-generate high-resolution textures once
  const textures = useMemo<TerrainTextures>(() => {
    return generateTerrainTextures(transform, 1024);
  }, [transform]);

  // Derive Details for Currently Selected Marker
  const selectedMarkerDetail = useMemo<SelectedMarkerDetail | null>(() => {
    if (!selectedMarkerId) return null;

    // Check violations
    const viol = governance.violations.find((v) => v.id === selectedMarkerId);
    if (viol) {
      const [lat, lon] = viol.locationCoordinates;
      const isCritical = viol.severity === 'CRITICAL';
      const groundPos = transform.geoToWorld(lat, lon, verticalExaggeration, 0.05);
      const worldPos = groundPos.clone();
      worldPos.z += 6.5; // Beacon head height

      return {
        id: viol.id,
        type: 'violation',
        data: viol,
        title: viol.title,
        badge: viol.severity,
        severityColor: isCritical ? '#ef4444' : '#f59e0b',
        statutoryCode: viol.statutoryCode,
        status: viol.status,
        keyMetric: `Notice Date: ${viol.detectedDate}`,
        secondaryMetric: `Location: [${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E]`,
        coordinates: [lat, lon],
        worldPos,
      };
    }

    // Check telemetry
    const sensor = telemetry.sensors.find((s) => s.id === selectedMarkerId);
    if (sensor) {
      const [lat, lon] = sensor.coordinates;
      const groundPos = transform.geoToWorld(lat, lon, verticalExaggeration, 0.05);
      const worldPos = groundPos.clone();
      worldPos.z += 5.0;

      const statusColor = sensor.status === 'ALERT' ? '#ef4444' : sensor.status === 'WARNING' ? '#f59e0b' : '#10b981';

      return {
        id: sensor.id,
        type: 'telemetry',
        data: sensor,
        title: sensor.name,
        badge: 'SIMULATED',
        severityColor: statusColor,
        statutoryCode: sensor.sensorType,
        status: sensor.status,
        keyMetric: `Live Reading: ${sensor.currentValue} ${sensor.unit}`,
        secondaryMetric: `Baseline: ${sensor.baselineValue} ${sensor.unit}`,
        coordinates: [lat, lon],
        worldPos,
      };
    }

    return null;
  }, [selectedMarkerId, governance, telemetry, transform, verticalExaggeration]);

  // Update Camera based on spherical angles
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const { theta, phi, radius } = cameraAnglesRef.current;
    const target = cameraTargetRef.current;

    camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    camera.position.y = target.y + radius * Math.sin(phi) * Math.cos(theta);
    camera.position.z = target.z + radius * Math.cos(phi);

    // CRITICAL: set up vector BEFORE calling lookAt so horizontal ground stays flat
    camera.up.set(0, 0, 1);
    camera.lookAt(target);

    // Heading calculation: 0° = North, 90° = East
    let heading = (theta * 180) / Math.PI;
    heading = ((heading % 360) + 360) % 360;
    setCameraHeadingDeg(Math.round(heading));
  }, []);

  // Frame Loop logic for selected marker callout and beacon pulsing
  useEffect(() => {
    renderFrameRef.current = () => {
      // 1. Animate pulse on selected marker or critical beacons
      const time = Date.now() * 0.0035;
      interactiveMeshesRef.current.forEach(({ mesh, data }) => {
        if (mesh.name === 'beacon-pulse' || data.id === selectedMarkerId) {
          const s = 1 + Math.sin(time) * 0.15;
          mesh.scale.set(s, s, s);
        }
      });

      // 2. Synchronize selected marker callout card and single leader line
      const svg = svgOverlayRef.current;
      const cardEl = calloutCardRef.current;
      const camera = cameraRef.current;
      const container = containerRef.current;

      if (!svg || !cardEl || !camera || !container) return;

      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }

      if (!selectedMarkerDetail) {
        cardEl.style.display = 'none';
        return;
      }

      // Project 3D beacon head to screen pixel coordinates
      const p3d = selectedMarkerDetail.worldPos.clone().project(camera);
      const width = container.clientWidth;
      const height = container.clientHeight;

      // If behind camera or out of bounds
      if (p3d.z >= 1.0) {
        cardEl.style.display = 'none';
        return;
      }

      const screenX = (p3d.x * 0.5 + 0.5) * width;
      const screenY = (-p3d.y * 0.5 + 0.5) * height;

      if (screenX < -50 || screenX > width + 50 || screenY < -50 || screenY > height + 50) {
        cardEl.style.display = 'none';
        return;
      }

      cardEl.style.display = 'block';

      // Determine smart offset (place to right or left depending on screen quadrant)
      const isRight = screenX < width * 0.65;
      const cardOffsetX = isRight ? 75 : -75;
      const cardOffsetY = screenY > height * 0.7 ? -60 : 20;

      const targetCardX = Math.max(140, Math.min(width - 160, screenX + cardOffsetX));
      const targetCardY = Math.max(100, Math.min(height - 120, screenY + cardOffsetY));

      cardEl.style.transform = `translate3d(${targetCardX}px, ${targetCardY}px, 0) translate(${isRight ? '0%' : '-100%'}, -50%)`;

      // Draw clean leader line from marker head to card edge
      const cardAnchorX = isRight ? targetCardX - 6 : targetCardX + 6;
      const cardAnchorY = targetCardY;

      // Beacon anchor dot
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', screenX.toFixed(1));
      dot.setAttribute('cy', screenY.toFixed(1));
      dot.setAttribute('r', '4');
      dot.setAttribute('fill', selectedMarkerDetail.severityColor);
      dot.setAttribute('stroke', '#09090b');
      dot.setAttribute('stroke-width', '1.5');
      svg.appendChild(dot);

      // Clean vector leader line with dogleg
      const midX = screenX + (cardAnchorX - screenX) * 0.5;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = `M ${screenX.toFixed(1)} ${screenY.toFixed(1)} L ${midX.toFixed(1)} ${cardAnchorY.toFixed(1)} L ${cardAnchorX.toFixed(1)} ${cardAnchorY.toFixed(1)}`;
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', selectedMarkerDetail.severityColor);
      path.setAttribute('stroke-width', '1.6');
      path.setAttribute('stroke-dasharray', selectedMarkerDetail.type === 'telemetry' ? '3 2' : 'none');
      svg.appendChild(path);

      // Card terminal dot
      const endDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      endDot.setAttribute('cx', cardAnchorX.toFixed(1));
      endDot.setAttribute('cy', cardAnchorY.toFixed(1));
      endDot.setAttribute('r', '2.5');
      endDot.setAttribute('fill', selectedMarkerDetail.severityColor);
      svg.appendChild(endDot);
    };
  }, [selectedMarkerDetail, selectedMarkerId]);

  // Main Three.js Scene Setup (Mounts ONCE - never destroyed on slider change)
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#09090b');
    sceneRef.current = scene;

    // 2. Camera: Set up vector immediately to +Z (Elevation Up)
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1500);
    camera.up.set(0, 0, 1);
    cameraRef.current = camera;

    // 3. WebGL Renderer: Opaque, solid canvas (alpha: false)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x09090b, 1.0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting: Bright, high-contrast illumination
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x27272a, 0.75);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.5);
    sunLight.position.set(-65, 85, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -65;
    sunLight.shadow.camera.right = 65;
    sunLight.shadow.camera.top = 65;
    sunLight.shadow.camera.bottom = -65;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.45);
    fillLight.position.set(75, -75, 45);
    scene.add(fillLight);

    // 5. Grid datum floor
    const gridHelper = new THREE.GridHelper(140, 14, 0x3f3f46, 0x18181b);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -0.5;
    scene.add(gridHelper);

    // 6. 3D North Arrow Datum Indicator
    const northArrowGroup = new THREE.Group();
    northArrowGroup.position.set(-45, 45, 0);
    const arrowShaftGeo = new THREE.CylinderGeometry(0.25, 0.25, 7, 8);
    arrowShaftGeo.translate(0, 3.5, 0);
    const arrowShaftMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const arrowShaft = new THREE.Mesh(arrowShaftGeo, arrowShaftMat);
    northArrowGroup.add(arrowShaft);

    const arrowHeadGeo = new THREE.ConeGeometry(1.0, 2.5, 12);
    arrowHeadGeo.translate(0, 7.5, 0);
    const arrowHeadMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const arrowHead = new THREE.Mesh(arrowHeadGeo, arrowHeadMat);
    northArrowGroup.add(arrowHead);
    scene.add(northArrowGroup);

    // 7. 3D Metric Scale Bar (500m bar = 13.26 units)
    const scaleBarGroup = new THREE.Group();
    scaleBarGroup.position.set(-20, -48, 0);
    const scaleLen = 500 / transform.metersPerUnitX;
    const barGeo = new THREE.BoxGeometry(scaleLen, 0.7, 0.25);
    barGeo.translate(scaleLen / 2, 0, 0);
    const barMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const barMesh = new THREE.Mesh(barGeo, barMat);
    scaleBarGroup.add(barMesh);
    scene.add(scaleBarGroup);

    // 8. Dynamic Overlays Group
    const overlaysGroup = new THREE.Group();
    scene.add(overlaysGroup);
    overlaysGroupRef.current = overlaysGroup;

    // 9. Initial Terrain Mesh (Created once; geometry buffer is updated in-place)
    const initialGeometry = transform.generateTerrainGeometry(96, verticalExaggeration);
    const terrainMaterial = new THREE.MeshStandardMaterial({
      map: textures.satelliteTexture,
      roughness: 0.72,
      metalness: 0.05,
      transparent: false,
      opacity: 1.0,
      depthWrite: true,
    });
    const terrainMesh = new THREE.Mesh(initialGeometry, terrainMaterial);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 10. Position camera with optimal framing
    updateCameraPosition();

    // 11. 60fps Render Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
      renderFrameRef.current?.();
    };
    animate();

    // 12. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
      initialGeometry.dispose();
      terrainMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [transform, textures, updateCameraPosition]); // Mounts ONCE

  // In-Place Terrain Geometry Buffer Update (Solves Transparency / Disposal Bug completely)
  useEffect(() => {
    if (!terrainMeshRef.current) return;

    const geometry = terrainMeshRef.current.geometry;
    const pos = geometry.attributes.position;
    const baseMin = transform.elevationData.minElevationMeters;
    const scale = transform.verticalBaseScale * verticalExaggeration;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const { u, v } = transform.worldXYToUV(x, y);
      const elev = transform.sampleElevationNorm(u, v);
      pos.setZ(i, (elev - baseMin) * scale);
    }

    pos.needsUpdate = true;
    geometry.computeVertexNormals();

    // Ensure material remains strictly opaque and solid
    const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.transparent = false;
      mat.opacity = 1.0;
      mat.depthWrite = true;
      mat.needsUpdate = true;
    }
  }, [verticalExaggeration, transform]);

  // Texture Mode Switcher (Updates existing material map safely without disposing mesh)
  useEffect(() => {
    if (!terrainMeshRef.current) return;
    const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
    if (!mat) return;

    if (textureMode === 'wireframe') {
      mat.wireframe = true;
      mat.map = null;
      mat.color.setHex(0x38bdf8);
    } else {
      mat.wireframe = false;
      mat.color.setHex(0xffffff);
      if (textureMode === 'hypsometric') {
        mat.map = textures.hypsometricTexture;
      } else if (textureMode === 'slope') {
        mat.map = textures.slopeTexture;
      } else {
        mat.map = textures.satelliteTexture;
      }
    }

    mat.transparent = false;
    mat.opacity = 1.0;
    mat.depthWrite = true;
    mat.needsUpdate = true;
  }, [textureMode, textures]);

  // 3D Overlays: Draped Boundary, Pit Zones, and Clean Small Markers
  useEffect(() => {
    const overlaysGroup = overlaysGroupRef.current;
    if (!overlaysGroup) return;

    while (overlaysGroup.children.length > 0) {
      const child = overlaysGroup.children[0];
      overlaysGroup.remove(child);
    }
    interactiveMeshesRef.current = [];

    // 1. Draped Indicative Boundary
    if (showBoundary3D && mine.geometry.coordinates[0]) {
      const drapedBoundary = transform.drapeGeoPolygon(
        mine.geometry.coordinates[0],
        verticalExaggeration,
        0.12,
        20
      );
      const lineGeo = new THREE.BufferGeometry().setFromPoints(drapedBoundary);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0xf59e0b,
        dashSize: 1.8,
        gapSize: 1.2,
        linewidth: 2,
      });
      const boundaryLine = new THREE.Line(lineGeo, lineMat);
      boundaryLine.computeLineDistances();
      overlaysGroup.add(boundaryLine);
    }

    // 2. Draped Operational Pit Zones
    if (showPitZones3D && mine.pitZoning.features) {
      mine.pitZoning.features.forEach((zone) => {
        if (!zone.geometry.coordinates[0]) return;
        let zoneColor = 0xeab308;
        if (zone.properties.zoneType === 'OVERBURDEN_DUMP') zoneColor = 0xf97316;
        else if (zone.properties.zoneType === 'WATER_SUMP') zoneColor = 0x06b6d4;

        const drapedZone = transform.drapeGeoPolygon(
          zone.geometry.coordinates[0],
          verticalExaggeration,
          0.10,
          25
        );
        const zoneGeo = new THREE.BufferGeometry().setFromPoints(drapedZone);
        const zoneMat = new THREE.LineDashedMaterial({
          color: zoneColor,
          dashSize: 1.5,
          gapSize: 1.0,
          linewidth: 1.5,
        });
        const zoneLine = new THREE.Line(zoneGeo, zoneMat);
        zoneLine.computeLineDistances();
        overlaysGroup.add(zoneLine);
      });
    }

    // 3. Clean, Small 3D DGMS Violation Pins
    if (showViolations3D) {
      governance.violations.forEach((v) => {
        const [lat, lon] = v.locationCoordinates;
        const isCritical = v.severity === 'CRITICAL';
        const isSelected = v.id === selectedMarkerId;
        const colorHex = isCritical ? 0xef4444 : 0xf59e0b;
        const stemHeight = 4.5;

        const groundPt = transform.geoToWorld(lat, lon, verticalExaggeration, 0.05);
        const markerGroup = new THREE.Group();
        markerGroup.position.copy(groundPt);

        // Ground anchor ring
        const ringGeo = new THREE.RingGeometry(0.4, 0.9, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isSelected ? 0.95 : 0.7,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        markerGroup.add(ring);

        // Selected halo aura ring
        if (isSelected) {
          const haloGeo = new THREE.RingGeometry(1.0, 1.8, 32);
          const haloMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.rotation.x = -Math.PI / 2;
          markerGroup.add(halo);
        }

        // Slim vertical pillar
        const pillarGeo = new THREE.CylinderGeometry(0.1, 0.1, stemHeight, 8);
        pillarGeo.translate(0, stemHeight / 2, 0);
        pillarGeo.rotateX(Math.PI / 2);
        const pillarMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: 0.4,
          roughness: 0.3,
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        markerGroup.add(pillar);

        // Small geometric beacon head
        const beaconGeo = new THREE.OctahedronGeometry(isSelected ? 1.3 : 0.9, 0);
        const beaconMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: isSelected ? 1.0 : isCritical ? 0.8 : 0.5,
          roughness: 0.2,
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.z = stemHeight;
        beacon.name = isCritical || isSelected ? 'beacon-pulse' : 'beacon-static';
        markerGroup.add(beacon);

        overlaysGroup.add(markerGroup);

        interactiveMeshesRef.current.push({
          mesh: beacon,
          data: v,
          type: 'violation',
        });
      });
    }

    // 4. Clean, Small 3D Telemetry Sensors (SIMULATED)
    if (showTelemetry3D) {
      telemetry.sensors.forEach((s) => {
        const [lat, lon] = s.coordinates;
        const isSelected = s.id === selectedMarkerId;
        const colorHex = s.status === 'ALERT' ? 0xef4444 : s.status === 'WARNING' ? 0xf59e0b : 0x0ea5e9;
        const stemHeight = 3.5;

        const groundPt = transform.geoToWorld(lat, lon, verticalExaggeration, 0.05);
        const telemGroup = new THREE.Group();
        telemGroup.position.copy(groundPt);

        // Ground disc
        const discGeo = new THREE.CircleGeometry(0.7, 20);
        const discMat = new THREE.MeshBasicMaterial({
          color: 0x0ea5e9,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.rotation.x = -Math.PI / 2;
        telemGroup.add(disc);

        if (isSelected) {
          const haloGeo = new THREE.RingGeometry(0.8, 1.5, 32);
          const haloMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.rotation.x = -Math.PI / 2;
          telemGroup.add(halo);
        }

        // Slim stem
        const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, stemHeight, 8);
        stemGeo.translate(0, stemHeight / 2, 0);
        stemGeo.rotateX(Math.PI / 2);
        const stemMat = new THREE.MeshStandardMaterial({
          color: 0x52525b,
          roughness: 0.5,
        });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        telemGroup.add(stem);

        // Small sensor node box
        const boxGeo = new THREE.BoxGeometry(
          isSelected ? 1.1 : 0.8,
          isSelected ? 1.1 : 0.8,
          isSelected ? 1.1 : 0.8
        );
        const boxMat = new THREE.MeshStandardMaterial({
          color: 0x18181b,
          emissive: colorHex,
          emissiveIntensity: isSelected ? 0.9 : 0.5,
          roughness: 0.3,
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.z = stemHeight;
        box.name = s.status === 'ALERT' || isSelected ? 'beacon-pulse' : 'sensor-box';
        telemGroup.add(box);

        overlaysGroup.add(telemGroup);

        interactiveMeshesRef.current.push({
          mesh: box,
          data: s,
          type: 'telemetry',
        });
      });
    }
  }, [
    mine,
    governance,
    telemetry,
    showBoundary3D,
    showPitZones3D,
    showViolations3D,
    showTelemetry3D,
    verticalExaggeration,
    selectedMarkerId,
    transform,
  ]);

  // Mouse Handlers for Camera Orbit, Pan, and Raycasting
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) isDraggingRef.current = true;
    else if (e.button === 2) isRightDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraAnglesRef.current.theta -= deltaX * 0.008;
      cameraAnglesRef.current.phi = Math.max(
        0.08,
        Math.min(Math.PI / 2 - 0.04, cameraAnglesRef.current.phi - deltaY * 0.008)
      );
      updateCameraPosition();
    } else if (isRightDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      const right = new THREE.Vector3();
      const forward = new THREE.Vector3();
      if (cameraRef.current) {
        cameraRef.current.getWorldDirection(forward);
        forward.z = 0;
        forward.normalize();
        right.crossVectors(forward, new THREE.Vector3(0, 0, 1)).normalize();

        cameraTargetRef.current.addScaledVector(right, -deltaX * 0.12);
        cameraTargetRef.current.addScaledVector(forward, deltaY * 0.12);
        updateCameraPosition();
      }
    }

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    // Real-Time Terrain Elevation & Slope Probing
    if (terrainMeshRef.current && cameraRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(terrainMeshRef.current);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const geo = transform.worldToGeo({ x: hit.point.x, y: hit.point.y });

        let zoneName = 'Chota Nagpur Natural Plateau';
        if (geo.elevation < 415) zoneName = 'Main Quarry Sump / Settling Basin';
        else if (geo.elevation >= 415 && geo.elevation <= 438)
          zoneName = 'Main Quarry Active Face & Lower Benches';
        else if (geo.elevation > 455 && geo.lat > 23.695)
          zoneName = 'North Overburden Dump Terraces';
        else if (geo.elevation > 450 && geo.lat < 23.685)
          zoneName = 'South Active Overburden Dump';

        setHoveredTerrain({
          lat: geo.lat,
          lon: geo.lon,
          elevation: geo.elevation,
          slope: geo.slope,
          zoneName,
        });
      } else {
        setHoveredTerrain(null);
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isRightDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraAnglesRef.current.radius = Math.max(
      35,
      Math.min(260, cameraAnglesRef.current.radius + e.deltaY * 0.12)
    );
    updateCameraPosition();
  };

  // Click Handler: Click marker to select; Click empty terrain to deselect
  const handleClick = (e: React.MouseEvent) => {
    if (!cameraRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // 1. Check if a marker mesh was clicked
    const meshes = interactiveMeshesRef.current.map((item) => item.mesh);
    const markerIntersects = raycasterRef.current.intersectObjects(meshes, true);

    if (markerIntersects.length > 0) {
      const hitObj = markerIntersects[0].object;
      const matched = interactiveMeshesRef.current.find(
        (item) => item.mesh === hitObj || item.mesh.children.includes(hitObj)
      );

      if (matched) {
        setSelectedMarkerId(matched.data.id);
        return;
      }
    }

    // 2. If clicked empty terrain, deselect
    setSelectedMarkerId(null);
  };

  // Camera Presets
  const setPerspectiveView = () => {
    cameraAnglesRef.current = { theta: -Math.PI / 5, phi: 0.96, radius: 140 };
    cameraTargetRef.current.set(0, 0, 2.5);
    updateCameraPosition();
  };

  const setTopDownNadirView = () => {
    cameraAnglesRef.current = { theta: 0, phi: 0.05, radius: 165 };
    cameraTargetRef.current.set(0, 0, 0);
    updateCameraPosition();
  };

  const setNorthFacingProfile = () => {
    cameraAnglesRef.current = { theta: 0, phi: Math.PI / 2.35, radius: 125 };
    cameraTargetRef.current.set(0, 5, 2.0);
    updateCameraPosition();
  };

  const resetToNorth = () => {
    cameraAnglesRef.current.theta = 0;
    updateCameraPosition();
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-full bg-neutral-950 overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* 1. Mandatory Grounded Provenance Disclaimer Notice (Top Center) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-2xl w-11/12">
        <div className="bg-neutral-950/90 backdrop-blur-md border border-amber-500/40 rounded-lg px-3.5 py-1.5 shadow-2xl flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium text-[11px] leading-tight">
              Indicative 3D terrain visualization — Elevation grounded in Copernicus DEM GLO-30 (30m grid); Mine geometry derived from satellite imagery.
            </span>
          </div>
          <button
            onClick={onOpenProvenance}
            className="text-[11px] text-amber-200 underline hover:text-white shrink-0 font-semibold cursor-pointer"
          >
            Inspect Provenance
          </button>
        </div>
      </div>

      {/* 2. Top-Right 3D Controls Bar */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Shading Mode Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-900/90 backdrop-blur border border-neutral-700 shadow-xl text-xs font-medium">
          <button
            onClick={() => setTextureMode('satellite')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              textureMode === 'satellite'
                ? 'bg-sky-500 text-white font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setTextureMode('hypsometric')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              textureMode === 'hypsometric'
                ? 'bg-sky-500 text-white font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Elevation Tint
          </button>
          <button
            onClick={() => setTextureMode('slope')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              textureMode === 'slope'
                ? 'bg-sky-500 text-white font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Slope Stability
          </button>
          <button
            onClick={() => setTextureMode('wireframe')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              textureMode === 'wireframe'
                ? 'bg-sky-500 text-white font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            30m DEM Grid
          </button>
        </div>

        {/* Vertical Exaggeration Slider (Physically believable range 1.0x to 3.5x) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/90 backdrop-blur border border-neutral-700 shadow-xl text-xs text-neutral-300">
          <span className="text-[11px] text-neutral-400">Vertical Scale:</span>
          <span className="font-mono text-sky-400 font-bold">{verticalExaggeration.toFixed(1)}x</span>
          <input
            type="range"
            min="1.0"
            max="3.5"
            step="0.1"
            value={verticalExaggeration}
            onChange={(e) => setVerticalExaggeration(parseFloat(e.target.value))}
            className="w-20 accent-sky-500 cursor-pointer"
            title="Adjust vertical exaggeration without horizontal shift"
          />
        </div>

        {/* Camera Preset Quick Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-neutral-900/90 backdrop-blur border border-neutral-700 shadow-xl text-xs text-neutral-300">
          <button
            onClick={setPerspectiveView}
            className="px-2 py-0.5 rounded hover:bg-neutral-800 text-[11px] text-neutral-300 hover:text-white cursor-pointer"
            title="Natural Oblique 35° Perspective"
          >
            Default Oblique
          </button>
          <span className="text-neutral-700">|</span>
          <button
            onClick={setTopDownNadirView}
            className="px-2 py-0.5 rounded hover:bg-neutral-800 text-[11px] text-neutral-300 hover:text-white cursor-pointer"
            title="Nadir Top-Down"
          >
            Top-Down
          </button>
          <span className="text-neutral-700">|</span>
          <button
            onClick={setNorthFacingProfile}
            className="px-2 py-0.5 rounded hover:bg-neutral-800 text-[11px] text-neutral-300 hover:text-white cursor-pointer"
            title="North Pit Highwall Profile"
          >
            Highwall Cut
          </button>
        </div>
      </div>

      {/* 3. Top-Left Compass & Heading Indicator */}
      <div className="absolute top-3 left-3 z-20 pointer-events-auto flex items-center gap-2">
        <button
          onClick={resetToNorth}
          className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700 hover:border-sky-400 rounded-lg p-2 shadow-xl flex items-center gap-2 text-xs font-mono transition-colors cursor-pointer"
          title="Click to reset camera to True North"
        >
          <div
            className="w-6 h-6 rounded-full border border-neutral-600 flex items-center justify-center transition-transform duration-75"
            style={{ transform: `rotate(${-cameraHeadingDeg}deg)` }}
          >
            <div className="w-0.5 h-2.5 bg-rose-500 rounded-t-sm origin-bottom" />
            <div className="w-0.5 h-2.5 bg-neutral-300 rounded-b-sm origin-top" />
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[10px] text-neutral-400">HEADING</span>
            <span className="font-bold text-sky-400 text-xs">
              {String(cameraHeadingDeg).padStart(3, '0')}°
            </span>
          </div>
        </button>
      </div>

      {/* 4. Bottom-Left Minimal Layer Toggles & Dynamic Legend */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-auto flex flex-col gap-2">
        {/* Layer Checkboxes */}
        <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700 rounded-lg p-2.5 shadow-xl text-xs space-y-1.5">
          <div className="font-semibold text-neutral-200 text-[11px] border-b border-neutral-800 pb-1 flex items-center justify-between">
            <span>3D Ground Layers</span>
            <span className="text-[10px] text-sky-400 font-mono">Shared GIS</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
            <input
              type="checkbox"
              checked={showBoundary3D}
              onChange={(e) => setShowBoundary3D(e.target.checked)}
              className="accent-amber-500 cursor-pointer"
            />
            <span className="text-[11px]">
              Indicative Boundary <span className="text-amber-400 font-mono text-[9px]">[INDICATIVE]</span>
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
            <input
              type="checkbox"
              checked={showPitZones3D}
              onChange={(e) => setShowPitZones3D(e.target.checked)}
              className="accent-sky-500 cursor-pointer"
            />
            <span className="text-[11px]">Operational Zones (Benches, Dumps, Sump)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
            <input
              type="checkbox"
              checked={showViolations3D}
              onChange={(e) => setShowViolations3D(e.target.checked)}
              className="accent-rose-500 cursor-pointer"
            />
            <span className="text-[11px]">DGMS Violations ({governance.violations.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
            <input
              type="checkbox"
              checked={showTelemetry3D}
              onChange={(e) => setShowTelemetry3D(e.target.checked)}
              className="accent-sky-500 cursor-pointer"
            />
            <span className="text-[11px]">
              Operational Sensors <span className="text-amber-400 font-mono text-[9px] font-bold">[SIMULATED]</span>
            </span>
          </label>
        </div>

        {/* Dynamic Legend */}
        <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700 rounded-lg px-2.5 py-1.5 shadow-xl text-[10px] font-mono text-neutral-300">
          {textureMode === 'hypsometric' && (
            <div className="flex items-center gap-2">
              <span className="text-sky-400">408m (Sump)</span>
              <div className="w-24 h-2 rounded bg-gradient-to-r from-blue-600 via-cyan-400 via-emerald-500 via-amber-400 to-rose-600"></div>
              <span className="text-rose-400">484m (Dump Crest)</span>
            </div>
          )}
          {textureMode === 'slope' && (
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">Safe (&lt;25°)</span>
              <div className="w-20 h-2 rounded bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"></div>
              <span className="text-rose-400">Critical (&gt;45° DGMS)</span>
            </div>
          )}
          {textureMode === 'satellite' && (
            <div className="text-neutral-400">
              Copernicus DEM 30m with hillshade &amp; Piparwar coal strata landcover
            </div>
          )}
          {textureMode === 'wireframe' && (
            <div className="text-sky-400">
              Copernicus DEM GLO-30 grid cells (30m ground sampling resolution)
            </div>
          )}
        </div>
      </div>

      {/* 5. Bottom-Right 3D Coordinates & DEM Inspection Readout */}
      <div className="absolute bottom-3 right-3 z-20 pointer-events-none flex flex-col items-end gap-1.5">
        <div className="bg-neutral-950/90 backdrop-blur-md border border-neutral-700/80 rounded-lg px-3 py-2 shadow-xl font-mono text-[11px] text-neutral-200 flex flex-col gap-1 min-w-[260px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-neutral-400 text-[10px]">3D TERRAIN PICK:</span>
            {hoveredTerrain ? (
              <span className="text-sky-400 font-bold">
                {hoveredTerrain.lat.toFixed(5)}° N, {hoveredTerrain.lon.toFixed(5)}° E
              </span>
            ) : (
              <span className="text-neutral-500">Hover over 3D terrain</span>
            )}
          </div>
          {hoveredTerrain && (
            <div className="text-[10px] text-neutral-400">
              DMS: {formatDMS(hoveredTerrain.lat, true)}, {formatDMS(hoveredTerrain.lon, false)}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="text-neutral-400">ELEVATION (COPERNICUS):</span>
            {hoveredTerrain ? (
              <span className="text-emerald-400 font-bold">
                {hoveredTerrain.elevation.toFixed(1)} m MSL
              </span>
            ) : (
              <span className="text-neutral-500">Copernicus GLO-30</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="text-neutral-400">SLOPE ANGLE:</span>
            {hoveredTerrain ? (
              <span
                className={`font-bold ${
                  hoveredTerrain.slope >= 45
                    ? 'text-rose-400'
                    : hoveredTerrain.slope >= 25
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {hoveredTerrain.slope.toFixed(1)}° {hoveredTerrain.slope >= 45 ? '(CRITICAL)' : ''}
              </span>
            ) : (
              <span className="text-neutral-500">Central difference</span>
            )}
          </div>
          {hoveredTerrain?.zoneName && (
            <div className="text-[10px] text-sky-300 font-sans border-t border-neutral-800 pt-1 mt-0.5">
              Sector: {hoveredTerrain.zoneName}
            </div>
          )}
          <div className="text-[9px] text-neutral-500 border-t border-neutral-800/80 pt-0.5 mt-0.5">
            Left Drag = Orbit | Right Drag = Pan | Scroll = Zoom
          </div>
        </div>

        {/* Data Provenance Button */}
        <div className="pointer-events-auto">
          <button
            onClick={onOpenProvenance}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/70 text-[10px] text-neutral-300 transition-colors shadow cursor-pointer"
          >
            <Info className="w-3 h-3 text-sky-400" />
            <span>Data Provenance: Copernicus DEM GLO-30</span>
          </button>
        </div>
      </div>

      {/* 6. Dynamic Vector SVG Overlay for Selected Marker Leader Line */}
      <svg
        ref={svgOverlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* 7. Single Compact Floating Card for Selected Marker (Click-to-Inspect) */}
      <div
        ref={calloutCardRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'none',
          zIndex: 25,
        }}
        className="pointer-events-auto max-w-[260px] bg-neutral-950/95 backdrop-blur-md border border-sky-500/50 rounded-xl p-3 shadow-2xl transition-transform select-none"
      >
        {selectedMarkerDetail && (
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-neutral-800">
              <span
                style={{
                  backgroundColor:
                    selectedMarkerDetail.type === 'violation'
                      ? selectedMarkerDetail.badge === 'CRITICAL'
                        ? '#450a0a'
                        : '#451a03'
                      : '#1e293b',
                  borderColor: selectedMarkerDetail.severityColor,
                  color: selectedMarkerDetail.severityColor,
                }}
                className="px-2 py-0.5 rounded border font-mono font-bold text-[9px] uppercase tracking-wider"
              >
                {selectedMarkerDetail.badge}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-neutral-400">{selectedMarkerDetail.id}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMarkerId(null);
                  }}
                  className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Deselect"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-xs font-semibold text-neutral-100 leading-snug mb-1">
              {selectedMarkerDetail.title}
            </div>

            {selectedMarkerDetail.statutoryCode && (
              <div className="text-[10px] font-mono text-neutral-400 mb-1">
                Code: {selectedMarkerDetail.statutoryCode}
              </div>
            )}

            <div className="bg-neutral-900/90 rounded-md p-2 my-1.5 space-y-0.5 text-[10px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Status:</span>
                <span
                  style={{ color: selectedMarkerDetail.severityColor }}
                  className="font-bold uppercase"
                >
                  {selectedMarkerDetail.status}
                </span>
              </div>
              <div className="text-neutral-300">{selectedMarkerDetail.keyMetric}</div>
              <div className="text-neutral-400">{selectedMarkerDetail.secondaryMetric}</div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (selectedMarkerDetail.type === 'violation') {
                  onSelectViolation(selectedMarkerDetail.data as ComplianceViolation);
                } else {
                  onSelectTelemetry(selectedMarkerDetail.data as SimulatedTelemetrySensor);
                }
              }}
              className="w-full mt-1.5 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              <span>View Full Governance Record</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
