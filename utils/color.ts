import { RGB, HSL, ContrastLevel } from '../types';

export function hexToRgb(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function getLuminance({ r, g, b }: RGB): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrast(rgb1: RGB, rgb2: RGB): number {
  const l1 = getLuminance(rgb1) + 0.05;
  const l2 = getLuminance(rgb2) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

export function getColorDistance(hsl1: HSL, hsl2: HSL): number {
  const hueDist = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h));
  const normalizedHueDist = (hueDist / 180) * 100;
  const satDist = Math.abs(hsl1.s - hsl2.s);
  const lightDist = Math.abs(hsl1.l - hsl2.l);
  return Math.sqrt(Math.pow(normalizedHueDist, 2) + Math.pow(satDist, 2) + Math.pow(lightDist, 2));
}

export const CONTRAST_THRESHOLDS: Record<ContrastLevel, number> = {
  'A': 3.0,
  'AA': 4.5,
  'AAA': 7.0
};
