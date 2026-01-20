import { ColorInfo } from './types';

export const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

export const TAILWIND_COLORS: Record<string, Record<string, string>> = {
  slate: { '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0', '300': '#cbd5e1', '400': '#94a3b8', '500': '#64748b', '600': '#475569', '700': '#334155', '800': '#1e293b', '900': '#0f172a', '950': '#020617' },
  gray: { '50': '#f9fafb', '100': '#f3f4f6', '200': '#e5e7eb', '300': '#d1d5db', '400': '#9ca3af', '500': '#6b7280', '600': '#4b5563', '700': '#374151', '800': '#1f2937', '900': '#111827', '950': '#030712' },
  zinc: { '50': '#fafafa', '100': '#f4f4f5', '200': '#e4e4e7', '300': '#d4d4d8', '400': '#a1a1aa', '500': '#71717a', '600': '#52525b', '700': '#3f3f46', '800': '#27272a', '900': '#18181b', '950': '#09090b' },
  neutral: { '50': '#fafafa', '100': '#f5f5f5', '200': '#e5e5e5', '300': '#d4d4d4', '400': '#a3a3a3', '500': '#737373', '600': '#525252', '700': '#404040', '800': '#262626', '900': '#171717', '950': '#0a0a0a' },
  stone: { '50': '#fafaf9', '100': '#f5f5f4', '200': '#e7e5e4', '300': '#d6d3d1', '400': '#a8a29e', '500': '#78716c', '600': '#57534e', '700': '#44403c', '800': '#292524', '900': '#1c1917', '950': '#0c0a09' },
  red: { '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5', '400': '#f87171', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c', '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a' },
  orange: { '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74', '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c', '800': '#9a3412', '900': '#7c2d12', '950': '#431407' },
  amber: { '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d', '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309', '800': '#92400e', '900': '#78350f', '950': '#451a03' },
  yellow: { '50': '#fefce8', '100': '#fef9c3', '200': '#fef08a', '300': '#fde047', '400': '#facc15', '500': '#eab308', '600': '#ca8a04', '700': '#a16207', '800': '#854d0e', '900': '#713f12', '950': '#422006' },
  lime: { '50': '#f7fee7', '100': '#ecfccb', '200': '#d9f99d', '300': '#bef264', '400': '#a3e635', '500': '#84cc16', '600': '#65a30d', '700': '#4d7c0f', '800': '#3f6212', '900': '#365314', '950': '#1a2e05' },
  green: { '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0', '300': '#86efac', '400': '#4ade80', '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534', '900': '#14532d', '950': '#052e16' },
  emerald: { '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7', '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857', '800': '#065f46', '900': '#064e3b', '950': '#022c22' },
  teal: { '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4', '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e', '800': '#115e59', '900': '#134e4a', '950': '#042f2e' },
  cyan: { '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc', '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490', '800': '#155e75', '900': '#164e63', '950': '#083344' },
  sky: { '50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd', '300': '#7dd3fc', '400': '#38bdf8', '500': '#0ea5e9', '600': '#0284c7', '700': '#0369a1', '800': '#075985', '900': '#0c4a6e', '950': '#082f49' },
  blue: { '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554' },
  indigo: { '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc', '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b' },
  violet: { '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95', '950': '#2e1065' },
  purple: { '50': '#faf5ff', '100': '#f3e8ff', '200': '#e9d5ff', '300': '#d8b4fe', '400': '#c084fc', '500': '#a855f7', '600': '#9333ea', '700': '#7e22ce', '800': '#6b21a8', '900': '#581c87', '950': '#3b0764' },
  fuchsia: { '50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe', '300': '#f0abfc', '400': '#e879f9', '500': '#d946ef', '600': '#c026d3', '700': '#a21caf', '800': '#86198f', '900': '#701a75', '950': '#4a044e' },
  pink: { '50': '#fdf2f8', '100': '#fce7f3', '200': '#fbcfe8', '300': '#f9a8d4', '400': '#f472b6', '500': '#ec4899', '600': '#db2777', '700': '#be185d', '800': '#9d174d', '900': '#831843', '950': '#500724' },
  rose: { '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af', '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c', '800': '#9f1239', '900': '#881337', '950': '#4c0519' },
};

export const COLOR_NAMES = Object.keys(TAILWIND_COLORS);

export const ALL_COLORS: ColorInfo[] = COLOR_NAMES.flatMap((name) =>
  SHADES.map((shade) => ({
    name,
    shade,
    hex: TAILWIND_COLORS[name][shade],
    id: `${name}-${shade}`,
  }))
);

// Tundra Palette - 14 colors from the SVG (exact colors, no manipulation)
export const TUNDRA_COLORS: ColorInfo[] = [
  // Top row
  { name: 'vibrant-blue', shade: 'base', hex: '#0B00F5', id: 'tundra-vibrant-blue' },
  { name: 'deep-purple', shade: 'base', hex: '#7800C6', id: 'tundra-deep-purple' },
  { name: 'lime-green', shade: 'base', hex: '#0CF406', id: 'tundra-lime-green' },
  { name: 'magenta', shade: 'base', hex: '#FF00FF', id: 'tundra-magenta' },
  { name: 'sunny-yellow', shade: 'base', hex: '#FCEE21', id: 'tundra-sunny-yellow' },
  { name: 'cyan', shade: 'base', hex: '#00FFFF', id: 'tundra-cyan' },
  { name: 'bright-red', shade: 'base', hex: '#FF1010', id: 'tundra-bright-red' },
  // Bottom row
  { name: 'dusty-blue', shade: 'base', hex: '#4B8AC4', id: 'tundra-dusty-blue' },
  { name: 'lavender', shade: 'base', hex: '#A378C4', id: 'tundra-lavender' },
  { name: 'forest-green', shade: 'base', hex: '#009245', id: 'tundra-forest-green' },
  { name: 'pastel-pink', shade: 'base', hex: '#D884D8', id: 'tundra-pastel-pink' },
  { name: 'warm-brown', shade: 'base', hex: '#8C6239', id: 'tundra-warm-brown' },
  { name: 'sky-blue', shade: 'base', hex: '#34CBF4', id: 'tundra-sky-blue' },
  { name: 'burnt-orange', shade: 'base', hex: '#F45516', id: 'tundra-burnt-orange' },
];

export const TUNDRA_COLOR_NAMES = TUNDRA_COLORS.map(c => c.name);

// New York Palette - 24 colors from the SVG (exact colors, no manipulation)
// Layout: 8 columns x 3 rows
export const NEWYORK_COLORS: ColorInfo[] = [
  // Row 1
  { name: 'red-dark', shade: 'base', hex: '#D72A38', id: 'ny-red-dark' },
  { name: 'blue-dark', shade: 'base', hex: '#06284C', id: 'ny-blue-dark' },
  { name: 'purple-dark', shade: 'base', hex: '#573A68', id: 'ny-purple-dark' },
  { name: 'green-dark', shade: 'base', hex: '#045F48', id: 'ny-green-dark' },
  { name: 'yellow-dark', shade: 'base', hex: '#A28C4D', id: 'ny-yellow-dark' },
  { name: 'burgundy-dark', shade: 'base', hex: '#692239', id: 'ny-burgundy-dark' },
  { name: 'olive-dark', shade: 'base', hex: '#37461E', id: 'ny-olive-dark' },
  { name: 'teal-dark', shade: 'base', hex: '#425A60', id: 'ny-teal-dark' },
  // Row 2
  { name: 'red-medium', shade: 'base', hex: '#FC504B', id: 'ny-red-medium' },
  { name: 'blue-medium', shade: 'base', hex: '#3D55A5', id: 'ny-blue-medium' },
  { name: 'purple-medium', shade: 'base', hex: '#6E5F9E', id: 'ny-purple-medium' },
  { name: 'green-medium', shade: 'base', hex: '#07947A', id: 'ny-green-medium' },
  { name: 'yellow-medium', shade: 'base', hex: '#D1C06A', id: 'ny-yellow-medium' },
  { name: 'burgundy-medium', shade: 'base', hex: '#97434E', id: 'ny-burgundy-medium' },
  { name: 'olive-medium', shade: 'base', hex: '#6F7653', id: 'ny-olive-medium' },
  { name: 'teal-medium', shade: 'base', hex: '#9BADB4', id: 'ny-teal-medium' },
  // Row 3
  { name: 'red-light', shade: 'base', hex: '#FBA0A4', id: 'ny-red-light' },
  { name: 'blue-light', shade: 'base', hex: '#C9ECFB', id: 'ny-blue-light' },
  { name: 'purple-light', shade: 'base', hex: '#D6D5F0', id: 'ny-purple-light' },
  { name: 'green-light', shade: 'base', hex: '#A7E4C8', id: 'ny-green-light' },
  { name: 'yellow-light', shade: 'base', hex: '#EFE587', id: 'ny-yellow-light' },
  { name: 'burgundy-light', shade: 'base', hex: '#E5C6CF', id: 'ny-burgundy-light' },
  { name: 'olive-light', shade: 'base', hex: '#E0E5D7', id: 'ny-olive-light' },
  { name: 'teal-light', shade: 'base', hex: '#D2DDE2', id: 'ny-teal-light' },
];

export const NEWYORK_COLOR_NAMES = NEWYORK_COLORS.map(c => c.name);