/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ElevationGridData } from '../types';

/**
 * Standard configuration for the 3D Mining Coordinate System
 */
export interface Geo3DTransformConfig {
  elevationData: ElevationGridData;
  meshWidth?: number; // Three.js units along X (East-West), default 100
  meshHeight?: number; // Three.js units along Y (North-South), default 100
  verticalBaseScale?: number; // Three.js units per meter of elevation, default 0.12
}

/**
 * Catmull-Rom 1D spline interpolation
 * Preserves exact node values at grid points (t=0 => p1, t=1 => p2)
 * Provides C1-smooth transitions without blockiness
 */
function catmullRom1D(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;
  const t3 = t * t2;
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
}

/**
 * Single, deterministic Geographic-to-Three.js Coordinate Transformation Engine.
 * Used identically by:
 * - Terrain Mesh vertices & normals
 * - Boundary Polygon draping
 * - Pit Zoning boundaries
 * - DGMS Compliance Violation pins
 * - Simulated Telemetry sensors
 * - Pointers, leader lines, and screen callouts
 * - Cursor raycasting and hover inspection
 */
export class Geo3DTransform {
  readonly elevationData: ElevationGridData;
  readonly meshWidth: number;
  readonly meshHeight: number;
  readonly verticalBaseScale: number;

  // Real-world physical metrics
  readonly physicalWidthMeters: number;
  readonly physicalHeightMeters: number;
  readonly metersPerUnitX: number;
  readonly metersPerUnitY: number;

  constructor(config: Geo3DTransformConfig) {
    this.elevationData = config.elevationData;
    this.meshWidth = config.meshWidth ?? 100;
    this.meshHeight = config.meshHeight ?? 100;
    this.verticalBaseScale = config.verticalBaseScale ?? 0.12;

    const { bounds } = this.elevationData;
    const midLat = (bounds.north + bounds.south) / 2;
    const latSpanDeg = bounds.north - bounds.south;
    const lonSpanDeg = bounds.east - bounds.west;

    // Approximate WGS84 geodesic distances
    this.physicalHeightMeters = latSpanDeg * 110780; // ~110.78 km per degree latitude
    this.physicalWidthMeters = lonSpanDeg * (111320 * Math.cos((midLat * Math.PI) / 180));

    this.metersPerUnitX = this.physicalWidthMeters / this.meshWidth;
    this.metersPerUnitY = this.physicalHeightMeters / this.meshHeight;
  }

  /**
   * Convert Longitude to Normalized U [0, 1] (0 = West, 1 = East)
   */
  lonToU(lon: number): number {
    const { west, east } = this.elevationData.bounds;
    return (lon - west) / (east - west);
  }

  /**
   * Convert Latitude to Normalized V [0, 1] (0 = South, 1 = North)
   */
  latToV(lat: number): number {
    const { south, north } = this.elevationData.bounds;
    return (lat - south) / (north - south);
  }

  /**
   * Convert Normalized U to Longitude
   */
  uToLon(u: number): number {
    const { west, east } = this.elevationData.bounds;
    return west + u * (east - west);
  }

  /**
   * Convert Normalized V to Latitude
   */
  vToLat(v: number): number {
    const { south, north } = this.elevationData.bounds;
    return south + v * (north - south);
  }

  /**
   * Convert U, V directly to World X, Y in Three.js coordinates
   * X in [-meshWidth / 2, meshWidth / 2]
   * Y in [-meshHeight / 2, meshHeight / 2]
   */
  uvToWorldXY(u: number, v: number): { x: number; y: number } {
    const x = (u - 0.5) * this.meshWidth;
    const y = (v - 0.5) * this.meshHeight;
    return { x, y };
  }

  /**
   * Convert World X, Y back to U, V
   */
  worldXYToUV(x: number, y: number): { u: number; v: number } {
    const u = x / this.meshWidth + 0.5;
    const v = y / this.meshHeight + 0.5;
    return { u, v };
  }

  /**
   * Continuous Bicubic Catmull-Rom Elevation Sampler from Normalized U, V coordinates.
   * Reproduces exact node values at cell centers, and provides C1 smooth derivatives.
   */
  sampleElevationNorm(u: number, v: number): number {
    const { rows, cols, elevations, minElevationMeters, maxElevationMeters } = this.elevationData;

    // Clamp normalized coordinates to [0, 1]
    const clampedU = Math.max(0, Math.min(1, u));
    const clampedV = Math.max(0, Math.min(1, v));

    // Note: row 0 is North (v = 1), row rows-1 is South (v = 0)
    const rowFloat = (1 - clampedV) * (rows - 1);
    const colFloat = clampedU * (cols - 1);

    const r1 = Math.floor(rowFloat);
    const c1 = Math.floor(colFloat);
    const tr = rowFloat - r1;
    const tc = colFloat - c1;

    // 4x4 neighborhood indices clamped to grid boundaries
    const getElev = (r: number, c: number): number => {
      const cr = Math.max(0, Math.min(rows - 1, r));
      const cc = Math.max(0, Math.min(cols - 1, c));
      return elevations[cr][cc];
    };

    // Interpolate across columns for 4 rows
    const rowVals = new Float64Array(4);
    for (let i = 0; i < 4; i++) {
      const r = r1 - 1 + i;
      const p0 = getElev(r, c1 - 1);
      const p1 = getElev(r, c1);
      const p2 = getElev(r, c1 + 1);
      const p3 = getElev(r, c1 + 2);
      rowVals[i] = catmullRom1D(p0, p1, p2, p3, tc);
    }

    // Interpolate vertically across rows
    const finalElev = catmullRom1D(rowVals[0], rowVals[1], rowVals[2], rowVals[3], tr);

    return Math.max(minElevationMeters, Math.min(maxElevationMeters, finalElev));
  }

  /**
   * Sample terrain elevation in meters MSL at given geographic lat, lon
   */
  sampleElevation(lat: number, lon: number): number {
    const u = this.lonToU(lon);
    const v = this.latToV(lat);
    return this.sampleElevationNorm(u, v);
  }

  /**
   * Sample slope in degrees at given normalized coordinates
   */
  sampleSlopeDegreesNorm(u: number, v: number): number {
    const delta = 0.005; // tiny normalized step
    const eL = this.sampleElevationNorm(u - delta, v);
    const eR = this.sampleElevationNorm(u + delta, v);
    const eD = this.sampleElevationNorm(u, v - delta);
    const eU = this.sampleElevationNorm(u, v + delta);

    const dxMeters = 2 * delta * this.physicalWidthMeters;
    const dyMeters = 2 * delta * this.physicalHeightMeters;

    const dz_dx = (eR - eL) / dxMeters;
    const dz_dy = (eU - eD) / dyMeters;

    const gradient = Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy);
    return (Math.atan(gradient) * 180) / Math.PI;
  }

  /**
   * Core Deterministic Geographic to Three.js World Position transformation.
   *
   * @param lat Latitude (decimal degrees)
   * @param lon Longitude (decimal degrees)
   * @param exaggeration Vertical scale multiplier (e.g. 1.0 to 3.5)
   * @param surfaceOffset Small vertical offset to prevent z-fighting (e.g. 0.08)
   */
  geoToWorld(lat: number, lon: number, exaggeration = 1.0, surfaceOffset = 0.0): THREE.Vector3 {
    const u = this.lonToU(lon);
    const v = this.latToV(lat);
    const { x, y } = this.uvToWorldXY(u, v);
    const elev = this.sampleElevationNorm(u, v);

    const baseMin = this.elevationData.minElevationMeters;
    const z = (elev - baseMin) * (this.verticalBaseScale * exaggeration) + surfaceOffset;

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Convert Three.js World Coordinates back to Geographic coordinates and sampled elevation
   */
  worldToGeo(point: { x: number; y: number }): { lat: number; lon: number; elevation: number; slope: number } {
    const { u, v } = this.worldXYToUV(point.x, point.y);
    const lon = this.uToLon(u);
    const lat = this.vToLat(v);
    const elevation = this.sampleElevationNorm(u, v);
    const slope = this.sampleSlopeDegreesNorm(u, v);

    return { lat, lon, elevation, slope };
  }

  /**
   * Drapes a geographic polygon or linestring onto the undulating 3D terrain surface.
   * Densifies edges so the polyline strictly adheres to terrain contours without clipping or floating.
   *
   * @param coordinates Array of [lon, lat] points
   * @param exaggeration Vertical exaggeration multiplier
   * @param surfaceOffset Offset above terrain surface to prevent z-fighting
   * @param maxStepMeters Maximum physical distance between sampled points (default 25m)
   */
  drapeGeoPolygon(
    coordinates: [number, number][],
    exaggeration = 1.0,
    surfaceOffset = 0.12,
    maxStepMeters = 25
  ): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    if (!coordinates || coordinates.length < 2) return points;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lonA, latA] = coordinates[i];
      const [lonB, latB] = coordinates[i + 1];

      const uA = this.lonToU(lonA);
      const vA = this.latToV(latA);
      const uB = this.lonToU(lonB);
      const vB = this.latToV(latB);

      const dX = (uB - uA) * this.physicalWidthMeters;
      const dY = (vB - vA) * this.physicalHeightMeters;
      const segmentDistance = Math.sqrt(dX * dX + dY * dY);

      const steps = Math.max(1, Math.ceil(segmentDistance / maxStepMeters));

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const curLon = lonA + t * (lonB - lonA);
        const curLat = latA + t * (latB - latA);
        points.push(this.geoToWorld(curLat, curLon, exaggeration, surfaceOffset));
      }
    }

    // Add the final point
    const [lastLon, lastLat] = coordinates[coordinates.length - 1];
    points.push(this.geoToWorld(lastLat, lastLon, exaggeration, surfaceOffset));

    return points;
  }

  /**
   * Generates a high-fidelity smooth terrain PlaneGeometry using the exact same continuous DEM interpolation.
   *
   * @param subdivisions Grid resolution (e.g. 96x96 quads for smooth benches and realistic relief)
   * @param exaggeration Vertical exaggeration multiplier
   */
  generateTerrainGeometry(subdivisions = 96, exaggeration = 1.0): THREE.PlaneGeometry {
    const geometry = new THREE.PlaneGeometry(
      this.meshWidth,
      this.meshHeight,
      subdivisions,
      subdivisions
    );

    const pos = geometry.attributes.position;
    const baseMin = this.elevationData.minElevationMeters;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      // Derive normalized U, V from exact vertex coordinates
      const { u, v } = this.worldXYToUV(x, y);

      // Sample identical continuous elevation function
      const elev = this.sampleElevationNorm(u, v);
      const z = (elev - baseMin) * (this.verticalBaseScale * exaggeration);

      pos.setZ(i, z);
    }

    geometry.computeVertexNormals();
    return geometry;
  }
}
