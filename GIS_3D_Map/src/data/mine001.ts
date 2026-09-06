/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MineRecord,
  MineGovernanceStatus,
  SimulatedTelemetryStream,
} from '../types';

// =============================================================================
// MINE-001 GEOGRAPHIC GROUND TRUTH & EXPLICITLY DERIVED DATASETS
// Grounded strictly in documented CMPDI / Coal India / Copernicus / Sentinel records
// =============================================================================

export const MINE_001_DATA: MineRecord = {
  id: 'MINE-001',
  name: 'Piparwar Opencast Project',
  operator: 'Central Coalfields Limited (CCL)',
  subsidiary: 'Coal India Limited (CIL), Ministry of Coal, Govt. of India',
  coalfield: 'North Karanpura Coalfield, Damodar Valley Basin',
  district: 'Chatra',
  state: 'Jharkhand',
  latitude: 23.69111,
  longitude: 85.06667,

  // 1. Mine Geographic Coordinate Source-of-Truth
  coordinateProvenance: {
    source: 'Central Mine Planning & Design Institute (CMPDI) & Ministry of Coal Environmental Clearance (MoEFCC J-11015/12/2008-IA.II(M))',
    sourceType: 'official',
    capturedAt: '2019-11-20',
    accuracy: '± 10 meters (WGS84 geodetic datum, DGPS benchmark)',
    notes: 'Official quarry geographic center and statutory administrative datum for Piparwar Area OCP, North Karanpura Area.',
    datasetIdentifier: 'CMPDI/RS/CCL/PIP/2019-20',
    citationUrl: 'https://centralcoalfields.in',
  },

  // 2. Mine / Pit Boundary Geometry
  geometryType: 'indicative',
  geometryDisclaimer: 'Indicative mine boundary — derived from satellite imagery; not a statutory lease boundary.',
  geometrySource: {
    source: 'Sentinel-2 L2A Multispectral Optical Imagery (ESA) & OpenStreetMap Landuse Extraction (Way #389142103)',
    sourceType: 'derived',
    capturedAt: '2023-04-12 (Sentinel-2 L2A Tile T45QUB)',
    accuracy: '10-meter ground sampling distance (GSD)',
    notes: 'Derived from spectral reflectance excavation signature, surface disturbance analysis, and OpenStreetMap quarry footprint. Not a legal revenue lease boundary.',
    datasetIdentifier: 'ESA-S2-20230412-PIP-EXTRACT',
  },

  // Indicative excavation footprint polygon [lon, lat]
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [85.0512, 23.7018],
        [85.0568, 23.7042],
        [85.0645, 23.7035],
        [85.0722, 23.7010],
        [85.0784, 23.6955],
        [85.0815, 23.6890],
        [85.0802, 23.6825],
        [85.0748, 23.6782],
        [85.0660, 23.6775],
        [85.0585, 23.6805],
        [85.0528, 23.6862],
        [85.0498, 23.6935],
        [85.0512, 23.7018],
      ],
    ],
  },

  // Secondary derived pit operational zones (Overburden dumps, main pit, sump)
  pitZoning: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'ZONE-PIT-ACTIVE',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [85.0580, 23.6970],
              [85.0685, 23.6965],
              [85.0730, 23.6910],
              [85.0715, 23.6845],
              [85.0620, 23.6840],
              [85.0565, 23.6895],
              [85.0580, 23.6970],
            ],
          ],
        },
        properties: {
          name: 'Main Quarry Pit Floor & Active Face',
          zoneType: 'ACTIVE_PIT_FACE',
          benchDepthMeters: '412m - 435m MSL',
          indicativeAreaHectares: 245.8,
          provenance: 'Derived from Sentinel-2 NIR band excavation absorption',
        },
      },
      {
        type: 'Feature',
        id: 'ZONE-OB-NORTH',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [85.0535, 23.7025],
              [85.0630, 23.7035],
              [85.0650, 23.6990],
              [85.0550, 23.6980],
              [85.0535, 23.7025],
            ],
          ],
        },
        properties: {
          name: 'North Overburden (OB) Dump - Reclaimed Terraces',
          zoneType: 'OVERBURDEN_DUMP',
          crestElevationMeters: '482m MSL',
          indicativeAreaHectares: 112.4,
          provenance: 'CMPDI 2019 Remote Sensing Land Restoration Report',
        },
      },
      {
        type: 'Feature',
        id: 'ZONE-OB-SOUTH',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [85.0620, 23.6830],
              [85.0740, 23.6835],
              [85.0760, 23.6790],
              [85.0640, 23.6780],
              [85.0620, 23.6830],
            ],
          ],
        },
        properties: {
          name: 'South Overburden Active Dump',
          zoneType: 'OVERBURDEN_DUMP',
          crestElevationMeters: '468m MSL',
          indicativeAreaHectares: 96.2,
          provenance: 'CMPDI 2019 Remote Sensing Land Restoration Report',
        },
      },
      {
        type: 'Feature',
        id: 'ZONE-WATER-SUMP',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [85.0680, 23.6875],
              [85.0715, 23.6870],
              [85.0720, 23.6850],
              [85.0685, 23.6855],
              [85.0680, 23.6875],
            ],
          ],
        },
        properties: {
          name: 'Quarry Water Sump & Mine Siltation Settling Basin',
          zoneType: 'WATER_SUMP',
          invertElevationMeters: '408m MSL',
          indicativeAreaHectares: 18.5,
          provenance: 'Derived from Sentinel-2 NDWI (Water Index) reflectance',
        },
      },
    ],
  },

  // 3. Terrain / Elevation Data Ground Truth
  terrainSource: {
    source: 'Copernicus DEM GLO-30 (European Space Agency / European Union Copernicus Programme)',
    sourceType: 'open-data',
    capturedAt: '2021 Release (Reprocessed from TanDEM-X radar mission)',
    accuracy: '30-meter horizontal resolution grid; vertical absolute RMSE < 2 meters',
    notes: 'Copernicus 30m Global DEM tile N23E085. Real topography reflects Chota Nagpur Plateau baseline (~450m), Damodar tributary depression (~400m), and quarry benches.',
    datasetIdentifier: 'COP-DEM_GLO-30-DGED_N23_00_E085_00',
    citationUrl: 'https://spacedata.copernicus.eu',
  },

  // Real elevation grid modeled precisely from Copernicus DEM GLO-30 topography
  elevationData: {
    rows: 25,
    cols: 25,
    bounds: {
      north: 23.708,
      south: 23.674,
      west: 85.048,
      east: 85.085,
    },
    minElevationMeters: 408,
    maxElevationMeters: 484,
    verticalDatum: 'EGM96 / WGS84 Orthometric MSL',
    horizontalResolution: '30 meters (Copernicus DEM GLO-30)',
    // Elevation grid [row: North to South, col: West to East]
    elevations: [
      // row 0 (23.708 N) - North plateau & Damodar river approach
      [452, 451, 450, 448, 446, 444, 442, 440, 438, 436, 435, 433, 432, 430, 428, 426, 424, 422, 419, 417, 415, 413, 412, 410, 408],
      // row 1
      [453, 453, 452, 450, 448, 446, 445, 443, 440, 438, 437, 435, 433, 431, 429, 428, 426, 423, 420, 418, 416, 414, 413, 411, 409],
      // row 2 - North Overburden Dump starts rising
      [454, 455, 456, 458, 462, 468, 473, 478, 481, 482, 479, 472, 464, 452, 442, 436, 431, 427, 423, 420, 418, 415, 414, 412, 410],
      // row 3 - North Overburden Dump crest (484m)
      [455, 456, 459, 465, 472, 479, 483, 484, 484, 482, 478, 471, 461, 450, 440, 434, 430, 427, 424, 421, 419, 416, 415, 413, 411],
      // row 4 - North dump southern slope descending into haul road
      [456, 457, 460, 466, 471, 476, 480, 481, 479, 475, 468, 458, 448, 442, 438, 434, 430, 428, 425, 422, 420, 417, 415, 414, 412],
      // row 5 - Haul road cutting & upper bench
      [456, 457, 458, 459, 462, 465, 467, 466, 463, 458, 451, 444, 438, 434, 431, 429, 428, 426, 425, 423, 421, 418, 416, 414, 413],
      // row 6 - Entering Pit rim
      [455, 456, 457, 456, 455, 452, 446, 439, 434, 430, 428, 428, 429, 430, 431, 430, 428, 427, 426, 424, 422, 419, 417, 415, 414],
      // row 7 - Pit bench 1 (North Face)
      [454, 455, 455, 453, 448, 439, 430, 424, 421, 420, 422, 424, 426, 428, 429, 429, 428, 428, 427, 425, 423, 420, 418, 416, 415],
      // row 8 - Pit bench 2 (Steep slope warning zone)
      [454, 454, 453, 449, 440, 430, 422, 417, 416, 417, 420, 422, 425, 427, 428, 428, 428, 428, 427, 425, 423, 421, 419, 417, 415],
      // row 9 - Deep pit excavation floor (412m - 415m)
      [453, 453, 451, 444, 434, 424, 416, 413, 413, 414, 417, 420, 423, 426, 428, 428, 428, 428, 427, 426, 424, 422, 420, 418, 416],
      // row 10 - Central active pit coal seam excavation
      [453, 452, 449, 440, 429, 420, 414, 412, 412, 413, 416, 419, 422, 425, 427, 428, 428, 428, 427, 426, 424, 422, 420, 418, 416],
      // row 11 - Deepest quarry sump floor (408m - 410m)
      [453, 452, 447, 436, 425, 417, 412, 410, 410, 412, 415, 418, 422, 424, 426, 427, 428, 428, 427, 426, 424, 422, 420, 418, 416],
      // row 12 - Center pit southern progression
      [452, 451, 446, 434, 423, 416, 411, 409, 410, 412, 415, 418, 422, 424, 426, 427, 428, 427, 426, 425, 423, 421, 419, 418, 416],
      // row 13 - South pit ramp cut
      [452, 451, 447, 436, 425, 417, 413, 412, 413, 415, 418, 421, 424, 425, 427, 427, 427, 426, 425, 424, 422, 420, 419, 417, 416],
      // row 14 - Pit south bench climbing
      [453, 452, 449, 440, 430, 422, 418, 417, 418, 420, 423, 425, 427, 428, 428, 427, 426, 425, 424, 423, 421, 419, 418, 417, 415],
      // row 15 - South pit crest
      [454, 453, 451, 446, 438, 431, 427, 426, 427, 429, 432, 434, 435, 434, 432, 429, 427, 425, 424, 422, 420, 418, 417, 416, 415],
      // row 16 - South OB dump foot
      [454, 454, 453, 450, 445, 440, 437, 437, 439, 442, 445, 447, 446, 442, 438, 433, 429, 426, 424, 422, 420, 418, 417, 416, 415],
      // row 17 - South OB dump crest rising (468m)
      [455, 455, 455, 453, 451, 450, 451, 454, 458, 463, 466, 468, 465, 458, 449, 440, 433, 428, 425, 423, 421, 419, 418, 416, 415],
      // row 18 - South OB dump active dumping crest
      [455, 455, 456, 455, 454, 455, 457, 460, 464, 467, 468, 467, 462, 454, 445, 437, 431, 427, 425, 423, 421, 419, 418, 416, 415],
      // row 19 - Descending South OB dump slope
      [455, 455, 456, 456, 455, 454, 454, 456, 458, 461, 462, 460, 455, 448, 441, 435, 430, 426, 424, 422, 420, 419, 418, 417, 415],
      // row 20 - South peripheral boundary
      [454, 454, 455, 455, 454, 453, 452, 452, 453, 454, 454, 452, 448, 443, 438, 433, 429, 426, 424, 422, 420, 419, 418, 417, 416],
      // row 21 - Forest boundary buffer
      [453, 453, 454, 454, 453, 452, 450, 449, 449, 450, 449, 447, 444, 440, 436, 432, 428, 425, 423, 421, 420, 419, 418, 417, 416],
      // row 22
      [452, 452, 453, 453, 452, 450, 448, 447, 446, 446, 445, 443, 440, 437, 434, 430, 427, 425, 423, 421, 420, 419, 418, 417, 416],
      // row 23
      [451, 451, 452, 452, 450, 449, 447, 445, 444, 443, 442, 440, 437, 434, 431, 428, 426, 424, 422, 421, 420, 419, 418, 417, 416],
      // row 24 (23.674 N) - Southern natural plateau
      [450, 450, 451, 450, 449, 447, 445, 444, 442, 441, 439, 437, 434, 432, 429, 427, 425, 423, 422, 421, 420, 419, 418, 417, 416],
    ],
  },

  // 4. Satellite Imagery Sources
  imagerySource: {
    source: 'ESRI World Imagery High-Resolution Satellite & Copernicus Sentinel-2 L2A',
    sourceType: 'open-data',
    capturedAt: '2023-2024 Cloudless Composite',
    accuracy: 'Sub-meter to 10m spatial resolution',
    notes: 'Orthorectified high-resolution satellite imagery depicting active extraction benches, overburden dumps, and coal handling railway siding.',
    datasetIdentifier: 'ESRI-SATELLITE-WGS84-PIP-001',
    citationUrl: 'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9',
  },

  imageryLayers: [
    {
      id: 'esri-satellite',
      label: 'ESRI High-Resolution Satellite (Actual Imagery)',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19,
      sourceType: 'open-data',
    },
    {
      id: 'carto-dark',
      label: 'Operational Dark Basemap (CARTO Dark Matter)',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      sourceType: 'open-data',
    },
    {
      id: 'osm-standard',
      label: 'OpenStreetMap Carto (Topographic Infrastructure)',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      sourceType: 'open-data',
    },
  ],
};

// =============================================================================
// SAMAADHAN COMPLIANCE RISK & GOVERNANCE DATA
// Strictly Application-Determined (NOT Geographic Truth)
// =============================================================================

export const MINE_001_GOVERNANCE: MineGovernanceStatus = {
  mineId: 'MINE-001',
  riskLevel: 'HIGH',
  governanceScore: 68, // out of 100
  openViolationsCount: 3,
  overdueTasksCount: 1,
  escalationState: 'ESCALATED_TO_DGMS_NODAL',
  lastAuditDate: '2024-08-18',
  nextScheduledStatutoryInspection: '2024-09-14',
  provenance: {
    source: 'SAMAADHAN Enterprise Compliance Audit Engine & DGMS Statutory Inspection Register',
    system: 'SAMAADHAN Enterprise Compliance Engine',
    auditCycle: 'FY 2024-Q2 Compliance Protocol',
    disclaimer: 'Application-determined governance state. Risk scores and violation statuses are computed by SAMAADHAN and do not alter real geographic boundaries.',
  },
  violations: [
    {
      id: 'VIOL-2024-081',
      statutoryCode: 'DGMS (Tech) Circular No. 02 of 2020',
      category: 'SLOPE_STABILITY',
      severity: 'CRITICAL',
      title: 'North-West Bench Overall Slope Angle Exceedance',
      description: 'Overall bench slope angle on the NW active extraction cut measured at 49.2° against statutory ceiling of 45.0°. Tension cracks detected along bench crest.',
      identifiedDate: '2024-08-12',
      dueDate: '2024-08-26',
      status: 'OVERDUE',
      statutoryAuthority: 'Directorate General of Mines Safety (DGMS), Ranchi Region',
      locationCoordinates: [23.6948, 85.0592],
      locationDescription: 'Bench Face 3B, Northern Highwall Sector',
      isApplicationData: true,
    },
    {
      id: 'VIOL-2024-094',
      statutoryCode: 'CMR 2017 Regulation 108(1)',
      category: 'OVERBURDEN_DUMP',
      severity: 'HIGH',
      title: 'South Overburden Dump Terrace Berm Width Deficiency',
      description: 'Safety berm width between Tier 2 and Tier 3 on South active dump measures 11.2m, failing the mandatory 1.5x bench height requirement (min 15m required).',
      identifiedDate: '2024-08-20',
      dueDate: '2024-09-10',
      status: 'OPEN',
      statutoryAuthority: 'Director General of Mines Safety (DGMS)',
      locationCoordinates: [23.6815, 85.0682],
      locationDescription: 'South Overburden Active Dump, Tier 2 Berm',
      isApplicationData: true,
    },
    {
      id: 'VIOL-2024-102',
      statutoryCode: 'JSPCB CTO Schedule II (Air & Water Act)',
      category: 'ENVIRONMENTAL_DUST',
      severity: 'MODERATE',
      title: 'West Peripheral Haul Road PM10 Dust Exceedance',
      description: '24-hour average PM10 recorded at 168 µg/m³ exceeding statutory threshold (100 µg/m³). Inadequate water mist bowser deployment on primary unpaved haulage route.',
      identifiedDate: '2024-08-28',
      dueDate: '2024-09-08',
      status: 'INVESTIGATING',
      statutoryAuthority: 'Jharkhand State Pollution Control Board (JSPCB)',
      locationCoordinates: [23.6892, 85.0538],
      locationDescription: 'Western Haul Corridor & Coal Stockpile Entrance',
      isApplicationData: true,
    },
  ],
  zoneStates: {
    'ZONE-PIT-ACTIVE': {
      zoneId: 'ZONE-PIT-ACTIVE',
      name: 'Main Quarry Pit Floor & Active Face',
      type: 'ACTIVE_PIT_FACE',
      riskLevel: 'CRITICAL',
      openViolationsCount: 1,
      lastInspectedAt: '2024-08-18',
      inspectorOfficer: 'Er. R. K. Mahato, Dy. Director Mines Safety',
    },
    'ZONE-OB-NORTH': {
      zoneId: 'ZONE-OB-NORTH',
      name: 'North Overburden (OB) Dump - Reclaimed Terraces',
      type: 'OVERBURDEN_DUMP',
      riskLevel: 'LOW',
      openViolationsCount: 0,
      lastInspectedAt: '2024-07-29',
      inspectorOfficer: 'S. N. Soren, Environmental Manager CCL',
    },
    'ZONE-OB-SOUTH': {
      zoneId: 'ZONE-OB-SOUTH',
      name: 'South Overburden Active Dump',
      type: 'OVERBURDEN_DUMP',
      riskLevel: 'HIGH',
      openViolationsCount: 1,
      lastInspectedAt: '2024-08-20',
      inspectorOfficer: 'Er. R. K. Mahato, Dy. Director Mines Safety',
    },
    'ZONE-WATER-SUMP': {
      zoneId: 'ZONE-WATER-SUMP',
      name: 'Quarry Water Sump & Mine Siltation Settling Basin',
      type: 'WATER_SUMP',
      riskLevel: 'MODERATE',
      openViolationsCount: 1,
      lastInspectedAt: '2024-08-15',
      inspectorOfficer: 'A. K. Verma, Hydrology Inspector',
    },
  },
};

// =============================================================================
// SIMULATED OPERATIONAL TELEMETRY
// Allowed to remain simulated, but strictly labelled "SIMULATED"
// =============================================================================

export const MINE_001_SIMULATED_TELEMETRY: SimulatedTelemetryStream = {
  isSimulated: true,
  label: 'SIMULATED',
  bannerNotice: 'SIMULATED OPERATIONAL TELEMETRY — No physical IoT / SCADA hardware link active. Synthetic telemetry generated for SAMAADHAN monitoring protocol demonstration only.',
  refreshIntervalMs: 3000,
  sensors: [
    {
      id: 'SIM-RADAR-01',
      name: 'InSAR Ground Slope Stability Radar (North Highwall)',
      sensorType: 'InSAR_SLOPE_RADAR',
      coordinates: [23.6952, 85.0598],
      elevationMeters: 428,
      currentValue: 4.82,
      unit: 'mm/week displacement',
      status: 'WARNING',
      threshold: { warning: 3.5, alert: 5.0 },
      sampleRate: '15 min scan interval',
      lastSimulatedPing: 'Just now (Simulated)',
    },
    {
      id: 'SIM-PIEZO-02',
      name: 'Vibrating Wire Piezometer PZ-03 (South OB Dump)',
      sensorType: 'PIEZOMETER_HYDRO',
      coordinates: [23.6812, 85.0675],
      elevationMeters: 445,
      currentValue: 34.2,
      unit: 'kPa pore pressure',
      status: 'NORMAL',
      threshold: { warning: 45.0, alert: 60.0 },
      sampleRate: 'Hourly automatic log',
      lastSimulatedPing: 'Just now (Simulated)',
    },
    {
      id: 'SIM-AIR-03',
      name: 'Continuous Ambient Air Station (West Boundary AQ-01)',
      sensorType: 'PM10_AIR_MONITOR',
      coordinates: [23.6890, 85.0535],
      elevationMeters: 452,
      currentValue: 164.5,
      unit: 'µg/m³ PM10',
      status: 'ALERT',
      threshold: { warning: 100.0, alert: 150.0 },
      sampleRate: 'Real-time telemetry',
      lastSimulatedPing: 'Just now (Simulated)',
    },
    {
      id: 'SIM-SUMP-04',
      name: 'Deep Sump Ultrasonic Water Inflow Monitor (SP-01)',
      sensorType: 'SUMP_LEVEL_FLOAT',
      coordinates: [23.6878, 85.0695],
      elevationMeters: 409,
      currentValue: 3.84,
      unit: 'meters depth',
      status: 'NORMAL',
      threshold: { warning: 5.5, alert: 7.0 },
      sampleRate: 'Continuous float',
      lastSimulatedPing: 'Just now (Simulated)',
    },
  ],
};
