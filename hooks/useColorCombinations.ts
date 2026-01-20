import { useMemo, useDeferredValue } from 'react';
import { ColorInfo, HSL, RGB, ContrastLevel } from '../types';
import { hexToRgb, rgbToHsl, getContrast, getColorDistance, CONTRAST_THRESHOLDS } from '../utils/color';

export interface ComboWithMeta {
  c1: ColorInfo;
  c2: ColorInfo;
  hsl1: HSL;
  hsl2: HSL;
}

interface ColorDataCache {
  rgb: RGB;
  hsl: HSL;
  passesTextContrast: boolean;
}

interface UseColorCombinationsOptions {
  selectedIds: Set<string>;
  currentPalette: ColorInfo[];
  textColorHex: string;
  contrastLevel: ContrastLevel;
  minBgContrast: number;
  minHueDistance: number;
  minSatDistance: number;
  minLumDistance: number;
  minTotalDistance: number;
  isDiverse: boolean;
  excludeInverse: boolean;
}

export function useColorCombinations({
  selectedIds,
  currentPalette,
  textColorHex,
  contrastLevel,
  minBgContrast,
  minHueDistance,
  minSatDistance,
  minLumDistance,
  minTotalDistance,
  isDiverse,
  excludeInverse,
}: UseColorCombinationsOptions) {
  // Defer selectedIds to prevent blocking UI during color selection
  const deferredSelectedIds = useDeferredValue(selectedIds);
  
  const textColorRgb = useMemo(() => hexToRgb(textColorHex), [textColorHex]);
  const threshold = CONTRAST_THRESHOLDS[contrastLevel];

  // Pre-calculate RGB, HSL, and contrast data for all colors
  const colorDataCache = useMemo(() => {
    const cache = new Map<string, ColorDataCache>();
    currentPalette.forEach(color => {
      const rgb = hexToRgb(color.hex);
      const hsl = rgbToHsl(rgb);
      const passesTextContrast = getContrast(rgb, textColorRgb) >= threshold;
      cache.set(color.id, { rgb, hsl, passesTextContrast });
    });
    return cache;
  }, [currentPalette, textColorRgb, threshold]);

  // Memoize contrast checks for palette display
  const colorContrastMap = useMemo(() => {
    const map = new Map<string, boolean>();
    colorDataCache.forEach((data, id) => {
      map.set(id, data.passesTextContrast);
    });
    return map;
  }, [colorDataCache]);

  // Generate all valid combinations - NO LIMIT
  const baseCombinations = useMemo(() => {
    const activeColors = currentPalette.filter(c => deferredSelectedIds.has(c.id));
    const candidates: ComboWithMeta[] = [];

    // Pre-filter colors that pass text contrast
    const validColors = activeColors.filter(c => {
      const data = colorDataCache.get(c.id);
      return data?.passesTextContrast ?? false;
    });

    for (let i = 0; i < validColors.length; i++) {
      const c1 = validColors[i];
      const data1 = colorDataCache.get(c1.id)!;
      const rgb1 = data1.rgb;
      const hsl1 = data1.hsl;

      for (let j = i + 1; j < validColors.length; j++) {
        const c2 = validColors[j];
        
        // Skip if it's the same color (by ID)
        if (c1.id === c2.id) continue;
        
        const data2 = colorDataCache.get(c2.id)!;
        const rgb2 = data2.rgb;
        
        // Compare RGB values directly to catch identical colors
        if (rgb1.r === rgb2.r && rgb1.g === rgb2.g && rgb1.b === rgb2.b) {
          continue;
        }

        // Filter by minimum contrast between the two colors
        const colorContrast = getContrast(rgb1, rgb2);
        if (colorContrast <= 1.0 || colorContrast < minBgContrast) {
          continue;
        }

        const hsl2 = data2.hsl;

        const hueDist = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h));
        const satDist = Math.abs(hsl1.s - hsl2.s);
        const lumDist = Math.abs(hsl1.l - hsl2.l);

        if (hueDist >= minHueDistance && satDist >= minSatDistance && lumDist >= minLumDistance) {
          // Add the combination
          candidates.push({ c1, c2, hsl1, hsl2 });
          
          // Also add the inverse combination (c2, c1) if not excluding inverses
          if (!excludeInverse) {
            candidates.push({ c1: c2, c2: c1, hsl1: hsl2, hsl2: hsl1 });
          }
        }
      }
    }

    // Apply minimum total distance filter if set
    // This filters out combinations that are too similar to already-kept combinations
    if (minTotalDistance === 0) return candidates;

    const filtered: ComboWithMeta[] = [];
    for (const candidate of candidates) {
      let isDiverseEnough = true;
      for (const kept of filtered) {
        // Orientation 1: direct comparison (candidate.c1 ↔ kept.c1, candidate.c2 ↔ kept.c2)
        const dist1 = (getColorDistance(candidate.hsl1, kept.hsl1) + getColorDistance(candidate.hsl2, kept.hsl2)) / 2;
        
        let comboDist: number;
        
        if (excludeInverse) {
          // When excluding inverses, check both orientations since (A,B) should be same as (B,A)
          const dist2 = (getColorDistance(candidate.hsl1, kept.hsl2) + getColorDistance(candidate.hsl2, kept.hsl1)) / 2;
          comboDist = Math.min(dist1, dist2);
        } else {
          // When including inverses, only check direct orientation
          // This allows {A,B} and {B,A} to both pass as distinct combinations
          comboDist = dist1;
        }
        
        if (comboDist < minTotalDistance) {
          isDiverseEnough = false;
          break;
        }
      }
      if (isDiverseEnough) filtered.push(candidate);
    }
    return filtered;
  }, [deferredSelectedIds, minHueDistance, minSatDistance, minLumDistance, minTotalDistance, minBgContrast, excludeInverse, colorDataCache, currentPalette]);

  // Apply diverse sorting if enabled - using multi-objective algorithm
  // Objectives: 1) Maximize distance from neighbors, 2) Spread colors evenly throughout list
  const displayedCombinations = useMemo(() => {
    if (!isDiverse || baseCombinations.length <= 1) return baseCombinations;

    // Shuffle the pool first to remove bias from original order
    // Using Fisher-Yates shuffle for uniform distribution
    const pool = [...baseCombinations];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    
    const firstItem = pool.shift()!;
    const sorted: ComboWithMeta[] = [firstItem];

    // Track when each color was last seen in EACH POSITION (c1 vs c2)
    // This prevents same color appearing in same slot consecutively
    const colorLastSeenAsC1 = new Map<string, number>();
    const colorLastSeenAsC2 = new Map<string, number>();
    const colorLastSeenAny = new Map<string, number>();
    
    colorLastSeenAsC1.set(firstItem.c1.id, 0);
    colorLastSeenAsC2.set(firstItem.c2.id, 0);
    colorLastSeenAny.set(firstItem.c1.id, 0);
    colorLastSeenAny.set(firstItem.c2.id, 0);

    // Limit diversity sorting to first 500 to keep it fast
    const maxDiversitySort = Math.min(500, pool.length);
    let sortedCount = 1;

    // Algorithm parameters
    const neighborhoodDepth = 6;  // How many neighbors to consider for diversity
    const recencyWeight = 0.3;    // Weight for general color spread
    const positionRecencyWeight = 0.2;  // Extra weight for same-position repetition penalty
    const maxRecencyBonus = 100;  // Cap the recency bonus to prevent domination

    // Helper: calculate distance between two combinations
    const comboDistance = (a: ComboWithMeta, b: ComboWithMeta): number => {
      const d1 = getColorDistance(a.hsl1, b.hsl1) + getColorDistance(a.hsl2, b.hsl2);
      if (excludeInverse) {
        const d2 = getColorDistance(a.hsl1, b.hsl2) + getColorDistance(a.hsl2, b.hsl1);
        return Math.min(d1, d2);
      }
      return d1;
    };

    while (pool.length > 0 && sortedCount < maxDiversitySort) {
      let bestScore = -Infinity;
      let bestIdx = 0;
      const currentPos = sorted.length;

      for (let i = 0; i < pool.length; i++) {
        const candidate = pool[i];
        
        // === OBJECTIVE 1: Diversity from neighbors ===
        let diversityScore = 0;
        let totalWeight = 0;
        const neighborsToCheck = Math.min(neighborhoodDepth, sorted.length);
        for (let n = 0; n < neighborsToCheck; n++) {
          const neighbor = sorted[sorted.length - 1 - n];
          const weight = 1 / Math.pow(2, n);
          const dist = comboDistance(candidate, neighbor);
          diversityScore += weight * dist;
          totalWeight += weight;
        }
        if (totalWeight > 0) {
          diversityScore /= totalWeight;
        }

        // === OBJECTIVE 2: General color recency (spread colors evenly) ===
        const lastSeenC1Any = colorLastSeenAny.get(candidate.c1.id) ?? -Infinity;
        const lastSeenC2Any = colorLastSeenAny.get(candidate.c2.id) ?? -Infinity;
        
        const recencyC1 = Math.min(currentPos - lastSeenC1Any, maxRecencyBonus);
        const recencyC2 = Math.min(currentPos - lastSeenC2Any, maxRecencyBonus);
        const generalRecencyBonus = Math.min(recencyC1, recencyC2);

        // === OBJECTIVE 3: Position-specific recency (avoid same color in same slot) ===
        // Strong penalty if this color was recently used in the SAME position (c1 or c2)
        const lastSeenC1AsC1 = colorLastSeenAsC1.get(candidate.c1.id) ?? -Infinity;
        const lastSeenC2AsC2 = colorLastSeenAsC2.get(candidate.c2.id) ?? -Infinity;
        
        const posRecencyC1 = Math.min(currentPos - lastSeenC1AsC1, maxRecencyBonus);
        const posRecencyC2 = Math.min(currentPos - lastSeenC2AsC2, maxRecencyBonus);
        const positionRecencyBonus = Math.min(posRecencyC1, posRecencyC2);

        // === COMBINE SCORES ===
        // diversityWeight + recencyWeight + positionRecencyWeight should = 1.0
        const diversityWeight = 1 - recencyWeight - positionRecencyWeight; // 0.5
        const normalizedGeneralRecency = generalRecencyBonus * 2;
        const normalizedPositionRecency = positionRecencyBonus * 2;
        
        const finalScore = diversityWeight * diversityScore 
                         + recencyWeight * normalizedGeneralRecency
                         + positionRecencyWeight * normalizedPositionRecency;

        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestIdx = i;
        }
      }

      const chosen = pool.splice(bestIdx, 1)[0];
      sorted.push(chosen);
      
      // Update color tracking - both general and position-specific
      colorLastSeenAny.set(chosen.c1.id, currentPos);
      colorLastSeenAny.set(chosen.c2.id, currentPos);
      colorLastSeenAsC1.set(chosen.c1.id, currentPos);
      colorLastSeenAsC2.set(chosen.c2.id, currentPos);
      
      sortedCount++;
    }
    
    // Append remaining unsorted combinations
    return [...sorted, ...pool];
  }, [baseCombinations, isDiverse, excludeInverse]);

  return {
    combinations: displayedCombinations,
    colorContrastMap,
    colorDataCache,
    totalCount: baseCombinations.length,
  };
}
