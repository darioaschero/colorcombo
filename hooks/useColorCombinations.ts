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

  // Apply diverse sorting using Quality Tiers + Interleave approach
  // This ensures homogeneous diversity throughout the ENTIRE list, not just at the beginning
  const displayedCombinations = useMemo(() => {
    if (!isDiverse || baseCombinations.length <= 1) return baseCombinations;

    // Helper: calculate distance between two combinations
    const comboDistance = (a: ComboWithMeta, b: ComboWithMeta): number => {
      const d1 = getColorDistance(a.hsl1, b.hsl1) + getColorDistance(a.hsl2, b.hsl2);
      if (excludeInverse) {
        const d2 = getColorDistance(a.hsl1, b.hsl2) + getColorDistance(a.hsl2, b.hsl1);
        return Math.min(d1, d2);
      }
      return d1;
    };

    // === PHASE 1: Calculate quality score for each combination ===
    // Quality = internal diversity (how different c1 and c2 are from each other)
    // Higher score = more visually interesting combination
    const combosWithScore = baseCombinations.map(combo => ({
      combo,
      quality: getColorDistance(combo.hsl1, combo.hsl2)
    }));

    // === PHASE 2: Sort by quality and divide into tiers ===
    combosWithScore.sort((a, b) => b.quality - a.quality); // Best quality first
    
    const numTiers = 4;
    const tierSize = Math.ceil(combosWithScore.length / numTiers);
    const tiers: ComboWithMeta[][] = [];
    
    for (let t = 0; t < numTiers; t++) {
      const start = t * tierSize;
      const end = Math.min(start + tierSize, combosWithScore.length);
      const tierCombos = combosWithScore.slice(start, end).map(x => x.combo);
      
      // Shuffle within each tier for randomness
      for (let i = tierCombos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tierCombos[i], tierCombos[j]] = [tierCombos[j], tierCombos[i]];
      }
      
      tiers.push(tierCombos);
    }

    // === PHASE 3: Interleave from tiers with local diversity optimization ===
    const result: ComboWithMeta[] = [];
    const maxItems = Math.min(500, baseCombinations.length);
    
    // Track colors for diversity within the final list
    const colorLastSeen = new Map<string, number>();
    const neighborhoodDepth = 4;

    // Round-robin through tiers, picking best diverse option from each
    let tierIndex = 0;
    while (result.length < maxItems && tiers.some(t => t.length > 0)) {
      // Find next non-empty tier
      let attempts = 0;
      while (tiers[tierIndex].length === 0 && attempts < numTiers) {
        tierIndex = (tierIndex + 1) % numTiers;
        attempts++;
      }
      
      if (tiers[tierIndex].length === 0) break;
      
      const currentTier = tiers[tierIndex];
      const currentPos = result.length;
      
      // Pick the best option from this tier based on local diversity
      let bestIdx = 0;
      let bestScore = -Infinity;
      
      // Only check first 20 items in tier for performance
      const checkLimit = Math.min(20, currentTier.length);
      
      for (let i = 0; i < checkLimit; i++) {
        const candidate = currentTier[i];
        let score = 0;
        
        // Diversity from recent neighbors
        const neighborsToCheck = Math.min(neighborhoodDepth, result.length);
        if (neighborsToCheck > 0) {
          for (let n = 0; n < neighborsToCheck; n++) {
            const neighbor = result[result.length - 1 - n];
            const weight = 1 / Math.pow(2, n);
            score += weight * comboDistance(candidate, neighbor);
          }
        } else {
          score = 100; // First item gets neutral score
        }
        
        // Bonus for colors not seen recently
        const lastSeenC1 = colorLastSeen.get(candidate.c1.id) ?? -50;
        const lastSeenC2 = colorLastSeen.get(candidate.c2.id) ?? -50;
        const recencyBonus = Math.min(currentPos - lastSeenC1, 30) + Math.min(currentPos - lastSeenC2, 30);
        score += recencyBonus * 0.5;
        
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      
      // Add chosen item to result
      const chosen = currentTier.splice(bestIdx, 1)[0];
      result.push(chosen);
      
      // Update tracking
      colorLastSeen.set(chosen.c1.id, currentPos);
      colorLastSeen.set(chosen.c2.id, currentPos);
      
      // Move to next tier
      tierIndex = (tierIndex + 1) % numTiers;
    }
    
    // Append any remaining items from tiers
    for (const tier of tiers) {
      result.push(...tier);
    }
    
    return result;
  }, [baseCombinations, isDiverse, excludeInverse]);

  return {
    combinations: displayedCombinations,
    colorContrastMap,
    colorDataCache,
    totalCount: baseCombinations.length,
  };
}
