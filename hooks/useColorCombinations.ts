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
        // Check both orientations since (A,B) is similar to (B,A)
        // Orientation 1: candidate.c1 ↔ kept.c1, candidate.c2 ↔ kept.c2
        const dist1 = (getColorDistance(candidate.hsl1, kept.hsl1) + getColorDistance(candidate.hsl2, kept.hsl2)) / 2;
        // Orientation 2: candidate.c1 ↔ kept.c2, candidate.c2 ↔ kept.c1
        const dist2 = (getColorDistance(candidate.hsl1, kept.hsl2) + getColorDistance(candidate.hsl2, kept.hsl1)) / 2;
        // Use the minimum distance (most similar orientation)
        const comboDist = Math.min(dist1, dist2);
        
        if (comboDist < minTotalDistance) {
          isDiverseEnough = false;
          break;
        }
      }
      if (isDiverseEnough) filtered.push(candidate);
    }
    return filtered;
  }, [deferredSelectedIds, minHueDistance, minSatDistance, minLumDistance, minTotalDistance, minBgContrast, excludeInverse, colorDataCache, currentPalette]);

  // Apply diverse sorting if enabled - but only for display ordering
  const displayedCombinations = useMemo(() => {
    if (!isDiverse || baseCombinations.length <= 1) return baseCombinations;

    const pool = [...baseCombinations];
    const sorted: ComboWithMeta[] = [pool.shift()!];

    // Limit diversity sorting to first 500 to keep it fast
    // But we'll display ALL combinations via virtualization
    const maxDiversitySort = Math.min(500, pool.length);
    let sortedCount = 1;

    while (pool.length > 0 && sortedCount < maxDiversitySort) {
      let maxDist = -1;
      let bestIdx = 0;
      const last = sorted[sorted.length - 1];

      for (let i = 0; i < pool.length; i++) {
        const current = pool[i];
        const d1 = getColorDistance(last.hsl1, current.hsl1) + getColorDistance(last.hsl2, current.hsl2);
        const d2 = getColorDistance(last.hsl1, current.hsl2) + getColorDistance(last.hsl2, current.hsl1);
        const dist = Math.min(d1, d2);

        if (dist > maxDist) {
          maxDist = dist;
          bestIdx = i;
        }
      }
      sorted.push(pool.splice(bestIdx, 1)[0]);
      sortedCount++;
    }
    
    // Append remaining unsorted combinations
    return [...sorted, ...pool];
  }, [baseCombinations, isDiverse]);

  return {
    combinations: displayedCombinations,
    colorContrastMap,
    colorDataCache,
    totalCount: baseCombinations.length,
  };
}
