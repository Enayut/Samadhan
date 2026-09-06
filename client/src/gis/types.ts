/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SourceType = 'official' | 'research' | 'open-data' | 'derived';

export interface ProvenanceRecord {
  source: string;
  sourceType: SourceType;
  capturedAt: string;
  accuracy: string;
  notes: string;
  citationUrl?: string;
  datasetIdentifier?: string;
}

export type GeometryType = 'indicative' | 'official';

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [lon, lat]
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: [number, number][][]; // array of linear rings [lon, lat]
}

export interface GeoJSONFeature<G = GeoJSONPolygon | GeoJSONPoint, P = Record<string, any>> {
  type: 'Feature';
  id?: string;
  geometry: G;
  properties: P;
}

export interface GeoJSONFeatureCollection<G = GeoJSONPolygon | GeoJSONPoint, P = Record<string, any>> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<G, P>[];
}

export interface ElevationGridData {
  rows: number;
  cols: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  minElevationMeters: number;
  maxElevationMeters: number;
  verticalDatum: string;
  horizontalResolution: string;
  // Elevation matrix in meters above MSL
  elevations: number[][];
}

export interface MineRecord {
  id: string; // e.g. "MINE-001"
  name: string;
  operator: string;
  subsidiary: string;
  coalfield: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  coordinateProvenance: ProvenanceRecord;
  
  // Boundary geometry
  geometry: GeoJSONPolygon;
  geometrySource: ProvenanceRecord;
  geometryType: GeometryType;
  geometryDisclaimer: string;

  // Secondary derived pit zones (overburden dump, active pit cut, water sump, statutory greenbelt buffer)
  pitZoning: GeoJSONFeatureCollection<GeoJSONPolygon>;

  // Terrain elevation data
  terrainSource: ProvenanceRecord;
  elevationData: ElevationGridData;

  // Satellite imagery
  imagerySource: ProvenanceRecord;
  imageryLayers: {
    id: string;
    label: string;
    url: string;
    attribution: string;
    maxZoom: number;
    sourceType: SourceType;
  }[];
}

// SAMAADHAN Compliance and Governance Application Data (strictly separated from geographic ground truth)
export type ComplianceRiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface ComplianceViolation {
  id: string;
  statutoryCode: string; // e.g. "DGMS Regulation 108 CMR 2017"
  category: 'SLOPE_STABILITY' | 'OVERBURDEN_DUMP' | 'ENVIRONMENTAL_DUST' | 'DRAINAGE_SUMP' | 'STATUTORY_BUFFER';
  severity: ComplianceRiskLevel;
  title: string;
  description: string;
  identifiedDate: string;
  dueDate: string;
  status: 'OVERDUE' | 'OPEN' | 'INVESTIGATING' | 'ESCALATED';
  statutoryAuthority: string; // e.g. "DGMS Eastern Zone, Sitarampur / Ranchi Region"
  locationCoordinates: [number, number]; // [lat, lon]
  locationDescription: string;
  isApplicationData: true;
}

export interface ComplianceZoneState {
  zoneId: string;
  name: string;
  type: 'ACTIVE_PIT_FACE' | 'OVERBURDEN_DUMP' | 'WATER_SUMP' | 'GREENBELT_BUFFER' | 'HAUL_ACCESS';
  riskLevel: ComplianceRiskLevel;
  openViolationsCount: number;
  lastInspectedAt: string;
  inspectorOfficer: string;
}

export interface MineGovernanceStatus {
  mineId: string;
  riskLevel: ComplianceRiskLevel;
  governanceScore: number; // 0 - 100
  openViolationsCount: number;
  overdueTasksCount: number;
  escalationState: 'ESCALATED_TO_DGMS_NODAL' | 'PENDING_DIRECTOR_REVIEW' | 'NORMAL_OPERATIONAL_MONITORING';
  lastAuditDate: string;
  nextScheduledStatutoryInspection: string;
  violations: ComplianceViolation[];
  zoneStates: Record<string, ComplianceZoneState>;
  provenance: {
    source: string;
    system: 'SAMAADHAN Enterprise Compliance Engine';
    auditCycle: string;
    disclaimer: string;
  };
}

// Operational Telemetry (Strictly SIMULATED)
export interface SimulatedTelemetrySensor {
  id: string;
  name: string;
  sensorType: 'InSAR_SLOPE_RADAR' | 'PIEZOMETER_HYDRO' | 'PM10_AIR_MONITOR' | 'VIBRATION_SEISMOGRAPH' | 'SUMP_LEVEL_FLOAT';
  coordinates: [number, number]; // [lat, lon]
  elevationMeters: number;
  currentValue: number;
  unit: string;
  status: 'NORMAL' | 'WARNING' | 'ALERT';
  threshold: {
    warning: number;
    alert: number;
  };
  sampleRate: string;
  lastSimulatedPing: string;
}

export interface SimulatedTelemetryStream {
  isSimulated: true;
  label: 'SIMULATED';
  bannerNotice: string;
  refreshIntervalMs: number;
  sensors: SimulatedTelemetrySensor[];
}
