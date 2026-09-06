/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Geo3DTransform } from './geo3dTransform';

export interface TerrainTextures {
  satelliteTexture: THREE.CanvasTexture;
  hypsometricTexture: THREE.CanvasTexture;
  slopeTexture: THREE.CanvasTexture;
}

/**
 * Generates high-resolution analytical and visual textures mapped 1-to-1 with the 3D terrain coordinates.
 */
export function generateTerrainTextures(
  transform: Geo3DTransform,
  resolution = 1024
): TerrainTextures {
  const width = resolution;
  const height = resolution;

  // 1. Satellite Landcover Canvas
  const satCanvas = document.createElement('canvas');
  satCanvas.width = width;
  satCanvas.height = height;
  const satCtx = satCanvas.getContext('2d')!;

  // 2. Hypsometric Color Ramp Canvas
  const hypCanvas = document.createElement('canvas');
  hypCanvas.width = width;
  hypCanvas.height = height;
  const hypCtx = hypCanvas.getContext('2d')!;

  // 3. DGMS Slope Stability Canvas
  const slopeCanvas = document.createElement('canvas');
  slopeCanvas.width = width;
  slopeCanvas.height = height;
  const slopeCtx = slopeCanvas.getContext('2d')!;

  const satImgData = satCtx.createImageData(width, height);
  const hypImgData = hypCtx.createImageData(width, height);
  const slopeImgData = slopeCtx.createImageData(width, height);

  const satData = satImgData.data;
  const hypData = hypImgData.data;
  const slopeData = slopeImgData.data;

  const { minElevationMeters, maxElevationMeters } = transform.elevationData;
  const elevRange = maxElevationMeters - minElevationMeters;

  // Sun vector for analytical hillshading (Azimuth 315° NW, Altitude 45°)
  const sunAzimuth = (315 * Math.PI) / 180;
  const sunAltitude = (45 * Math.PI) / 180;
  const sunX = Math.cos(sunAltitude) * Math.sin(sunAzimuth);
  const sunY = Math.cos(sunAltitude) * Math.cos(sunAzimuth);
  const sunZ = Math.sin(sunAltitude);

  for (let py = 0; py < height; py++) {
    // Canvas y=0 is top (North, v=1), y=height-1 is bottom (South, v=0)
    const v = 1 - py / (height - 1);

    for (let px = 0; px < width; px++) {
      // Canvas x=0 is left (West, u=0), x=width-1 is right (East, u=1)
      const u = px / (width - 1);
      const pixelIndex = (py * width + px) * 4;

      const elev = transform.sampleElevationNorm(u, v);
      const slope = transform.sampleSlopeDegreesNorm(u, v);
      const normElev = (elev - minElevationMeters) / elevRange;

      // Calculate analytical hillshading gradient
      const delta = 0.004;
      const eL = transform.sampleElevationNorm(u - delta, v);
      const eR = transform.sampleElevationNorm(u + delta, v);
      const eD = transform.sampleElevationNorm(u, v - delta);
      const eU = transform.sampleElevationNorm(u, v + delta);

      const dxMeters = 2 * delta * transform.physicalWidthMeters;
      const dyMeters = 2 * delta * transform.physicalHeightMeters;

      const dz_dx = (eR - eL) / dxMeters;
      const dz_dy = (eU - eD) / dyMeters;

      // Surface normal vector (-dz/dx, -dz/dy, 1) normalized
      const len = Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy + 1.0);
      const nx = -dz_dx / len;
      const ny = -dz_dy / len;
      const nz = 1.0 / len;

      // Lambertian dot product
      const dot = Math.max(0.15, nx * sunX + ny * sunY + nz * sunZ);
      const hillshadeFactor = 0.55 + 0.45 * dot;

      // -------------------------------------------------------------
      // 1. SATELLITE / REALISTIC LANDCOVER (Clear contrast, solid gray/earthy palette)
      // -------------------------------------------------------------
      let sR = 122, sG = 120, sB = 112; // Surrounding plateau: natural earthen gray-tan ground

      if (normElev < 0.12) {
        // Deep sump & settling basin (408m - 415m): distinct mineral quarry blue
        sR = 38; sG = 92; sB = 148;
      } else if (normElev >= 0.12 && normElev < 0.32) {
        // Active pit floor & exposed coal seam (415m - 432m): distinct dark charcoal slate
        sR = 58; sG = 60; sB = 65;
      } else if (normElev >= 0.32 && normElev < 0.58) {
        // Sandstone working benches, ramps & haulage corridors (432m - 452m): prominent sandstone buff
        sR = 185; sG = 172; sB = 148;
      } else if (normElev >= 0.58) {
        // Overburden waste rock dumps (452m - 484m): terraced overburden rock
        sR = 198; sG = 178; sB = 142;
      }

      // Subtle contour band shading at 10m intervals for elevation cues
      const isContour = Math.abs(elev % 10) < 0.45;
      const contourMod = isContour ? 0.88 : 1.0;

      satData[pixelIndex] = Math.min(255, Math.floor(sR * hillshadeFactor * contourMod));
      satData[pixelIndex + 1] = Math.min(255, Math.floor(sG * hillshadeFactor * contourMod));
      satData[pixelIndex + 2] = Math.min(255, Math.floor(sB * hillshadeFactor * contourMod));
      satData[pixelIndex + 3] = 255;

      // -------------------------------------------------------------
      // 2. HYPSOMETRIC TINT (Real elevation gradient with contour intervals)
      // -------------------------------------------------------------
      let hR = 59, hG = 130, hB = 246; // 408m: Blue (Pit floor)
      if (normElev <= 0.20) {
        // 408m - 423m: Blue to Cyan
        const t = normElev / 0.20;
        hR = Math.floor(59 * (1 - t) + 6 * t);
        hG = Math.floor(130 * (1 - t) + 182 * t);
        hB = Math.floor(246 * (1 - t) + 212 * t);
      } else if (normElev <= 0.45) {
        // 423m - 442m: Cyan to Green
        const t = (normElev - 0.20) / 0.25;
        hR = Math.floor(6 * (1 - t) + 16 * t);
        hG = Math.floor(182 * (1 - t) + 185 * t);
        hB = Math.floor(212 * (1 - t) + 129 * t);
      } else if (normElev <= 0.70) {
        // 442m - 461m: Green to Gold/Amber
        const t = (normElev - 0.45) / 0.25;
        hR = Math.floor(16 * (1 - t) + 245 * t);
        hG = Math.floor(185 * (1 - t) + 158 * t);
        hB = Math.floor(129 * (1 - t) + 11 * t);
      } else {
        // 461m - 484m: Amber to Crimson (Overburden Crest)
        const t = (normElev - 0.70) / 0.30;
        hR = Math.floor(245 * (1 - t) + 239 * t);
        hG = Math.floor(158 * (1 - t) + 68 * t);
        hB = Math.floor(11 * (1 - t) + 68 * t);
      }

      // Contour line accents
      const isMajorContour = Math.abs(elev % 10) < 0.4;
      const isMinorContour = Math.abs(elev % 5) < 0.25;
      let hMod = 1.0;
      if (isMajorContour) hMod = 0.75;
      else if (isMinorContour) hMod = 0.88;

      hypData[pixelIndex] = Math.floor(hR * hMod);
      hypData[pixelIndex + 1] = Math.floor(hG * hMod);
      hypData[pixelIndex + 2] = Math.floor(hB * hMod);
      hypData[pixelIndex + 3] = 255;

      // -------------------------------------------------------------
      // 3. DGMS SLOPE STABILITY (<25° Safe, 25-45° Caution, >45° Critical)
      // -------------------------------------------------------------
      let slR = 16, slG = 185, slB = 129; // Safe green
      if (slope >= 25 && slope < 45) {
        // Caution amber
        slR = 245; slG = 158; slB = 11;
      } else if (slope >= 45) {
        // Critical slope exceedance (DGMS safety threshold)
        slR = 239; slG = 68; slB = 68;
      }

      slopeData[pixelIndex] = slR;
      slopeData[pixelIndex + 1] = slG;
      slopeData[pixelIndex + 2] = slB;
      slopeData[pixelIndex + 3] = 255;
    }
  }

  satCtx.putImageData(satImgData, 0, 0);
  hypCtx.putImageData(hypImgData, 0, 0);
  slopeCtx.putImageData(slopeImgData, 0, 0);

  const satelliteTexture = new THREE.CanvasTexture(satCanvas);
  satelliteTexture.wrapS = THREE.ClampToEdgeWrapping;
  satelliteTexture.wrapT = THREE.ClampToEdgeWrapping;
  satelliteTexture.generateMipmaps = true;
  satelliteTexture.minFilter = THREE.LinearMipmapLinearFilter;

  const hypsometricTexture = new THREE.CanvasTexture(hypCanvas);
  hypsometricTexture.wrapS = THREE.ClampToEdgeWrapping;
  hypsometricTexture.wrapT = THREE.ClampToEdgeWrapping;
  hypsometricTexture.generateMipmaps = true;
  hypsometricTexture.minFilter = THREE.LinearMipmapLinearFilter;

  const slopeTexture = new THREE.CanvasTexture(slopeCanvas);
  slopeTexture.wrapS = THREE.ClampToEdgeWrapping;
  slopeTexture.wrapT = THREE.ClampToEdgeWrapping;
  slopeTexture.generateMipmaps = true;
  slopeTexture.minFilter = THREE.LinearMipmapLinearFilter;

  return { satelliteTexture, hypsometricTexture, slopeTexture };
}
