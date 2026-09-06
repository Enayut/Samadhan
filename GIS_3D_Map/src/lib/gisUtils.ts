/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ElevationGridData } from '../types';

/**
 * Format decimal degrees to Degrees Minutes Seconds (DMS) string
 */
export function formatDMS(deg: number, isLat: boolean): string {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);

  const direction = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
  return `${degrees}° ${minutes}′ ${seconds}″ ${direction}`;
}

/**
 * Bilinear interpolation to sample elevation in meters from the DEM grid at given lat, lon
 */
export function sampleElevationAt(
  lat: number,
  lon: number,
  elevationData: ElevationGridData
): number | null {
  const { bounds, rows, cols, elevations, minElevationMeters, maxElevationMeters } = elevationData;

  // Check bounds
  if (
    lat > bounds.north ||
    lat < bounds.south ||
    lon < bounds.west ||
    lon > bounds.east
  ) {
    return null;
  }

  // Calculate normalized coordinate [0, 1]
  const rowProgress = (bounds.north - lat) / (bounds.north - bounds.south); // 0 at North, 1 at South
  const colProgress = (lon - bounds.west) / (bounds.east - bounds.west); // 0 at West, 1 at East

  const rowFloat = rowProgress * (rows - 1);
  const colFloat = colProgress * (cols - 1);

  const r0 = Math.floor(rowFloat);
  const r1 = Math.min(r0 + 1, rows - 1);
  const c0 = Math.floor(colFloat);
  const c1 = Math.min(c0 + 1, cols - 1);

  const dr = rowFloat - r0;
  const dc = colFloat - c0;

  const e00 = elevations[r0][c0];
  const e01 = elevations[r0][c1];
  const e10 = elevations[r1][c0];
  const e11 = elevations[r1][c1];

  // Bilinear interpolation
  const top = e00 * (1 - dc) + e01 * dc;
  const bottom = e10 * (1 - dc) + e11 * dc;
  const val = top * (1 - dr) + bottom * dr;

  return Math.min(Math.max(val, minElevationMeters), maxElevationMeters);
}

/**
 * Calculate approximate slope in degrees at a specific grid cell in the DEM
 */
export function calculateSlopeAt(
  r: number,
  c: number,
  elevationData: ElevationGridData,
  horizontalCellSizeMeters = 30
): number {
  const { elevations, rows, cols } = elevationData;
  const rPrev = Math.max(0, r - 1);
  const rNext = Math.min(rows - 1, r + 1);
  const cPrev = Math.max(0, c - 1);
  const cNext = Math.min(cols - 1, c + 1);

  // Central difference approximation
  const dz_dx = (elevations[r][cNext] - elevations[r][cPrev]) / (2 * horizontalCellSizeMeters);
  const dz_dy = (elevations[rNext][c] - elevations[rPrev][c]) / (2 * horizontalCellSizeMeters);

  const gradient = Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy);
  const slopeDegrees = (Math.atan(gradient) * 180) / Math.PI;
  return slopeDegrees;
}
