import React, { useState, useMemo } from 'react';
import { TAILWIND_COLORS, SHADES, COLOR_NAMES, ALL_COLORS } from './constants';
import { TemplateType, ContrastLevel, ColorInfo, HSL, RGB } from './types';

// --- Utility Functions ---

function hexToRgb(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHsl({ r, g, b }: RGB): HSL {
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

function getLuminance({ r, g, b }: RGB): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(rgb1: RGB, rgb2: RGB): number {
  const l1 = getLuminance(rgb1) + 0.05;
  const l2 = getLuminance(rgb2) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

function getColorDistance(hsl1: HSL, hsl2: HSL): number {
  const hueDist = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h));
  const normalizedHueDist = (hueDist / 180) * 100;
  const satDist = Math.abs(hsl1.s - hsl2.s);
  const lightDist = Math.abs(hsl1.l - hsl2.l);
  return Math.sqrt(Math.pow(normalizedHueDist, 2) + Math.pow(satDist, 2) + Math.pow(lightDist, 2));
}

const CONTRAST_THRESHOLDS: Record<ContrastLevel, number> = {
  'A': 3.0,
  'AA': 4.5,
  'AAA': 7.0
};

type ViewMode = 'large' | 'mini';

interface ComboWithMeta {
  c1: ColorInfo;
  c2: ColorInfo;
  hsl1: HSL;
  hsl2: HSL;
}

const HeroPreview = ({ color1, color2, textColor, showCode, code }: { color1: string, color2: string, textColor: string, showCode?: boolean, code?: string }) => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background SVG */}
      <svg width="100%" height="100%" viewBox="0 0 393 393" fill="none" xmlns="http://www.w3.org/2000/svg" className="block absolute inset-0">
        <g clipPath="url(#clip0_hero_simple)">
          <rect width="393" height="393" fill={color1}/>
          <path d="M64.72 405H33V198.034C33 174.815 37.3399 152.286 45.8928 131.063C54.1557 110.577 65.9749 92.1771 81.033 76.386C96.0912 60.595 113.627 48.1873 133.157 39.5243C153.388 30.5477 174.866 26 197 26C219.134 26 240.612 30.5525 260.843 39.5243C280.373 48.1921 297.913 60.5902 312.967 76.386C328.021 92.1819 339.849 110.577 348.107 131.063C356.665 152.286 361 174.815 361 198.034V395.135H329.275V198.034C329.275 160.968 315.517 126.126 290.534 99.9134C265.55 73.7059 232.331 59.2739 196.995 59.2739C161.66 59.2739 128.445 73.7059 103.457 99.9134C78.4735 126.121 64.7155 160.968 64.7155 198.034V405H64.72Z" fill={color2}/>
        </g>
        <defs>
          <clipPath id="clip0_hero_simple">
            <rect width="393" height="393" fill="white"/>
          </clipPath>
        </defs>
      </svg>
      
      {/* Lettering Overlay - Only for Large View */}
      {!showCode && (
        <div className="absolute inset-0 flex flex-col justify-start p-8 pt-10 select-none pointer-events-none" style={{ color: textColor }}>
          <h2 className="text-3xl font-black leading-tight tracking-tight mb-2">
            The future<br/>of design
          </h2>
          <p className="text-sm font-semibold opacity-80 tracking-wide leading-none">
            Exploring new horizons
          </p>
        </div>
      )}

      {/* Code Overlay - Centered and clean for Mini View */}
      {showCode && code && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[11px] font-mono font-black tracking-tight" style={{ color: textColor }}>
            {code}
          </span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(ALL_COLORS.filter(c => ['400', '500', '600', '700'].includes(c.shade)).map(c => c.id))
  );
  const [template, setTemplate] = useState<TemplateType>(TemplateType.LIGHT);
  const [minHueDistance, setMinHueDistance] = useState(5);
  const [minSatDistance, setMinSatDistance] = useState(5);
  const [minLumDistance, setMinLumDistance] = useState(5);
  const [minTotalDistance, setMinTotalDistance] = useState(20);
  const [minBgContrast, setMinBgContrast] = useState(1.4);
  const [contrastLevel, setContrastLevel] = useState<ContrastLevel>('AA');
  const [viewMode, setViewMode] = useState<ViewMode>('large');
  const [isDiverse, setIsDiverse] = useState(true);

  const textColorHex = template === TemplateType.DARK ? '#FFFFFF' : '#000000';
  const textColorRgb = hexToRgb(textColorHex);
  const threshold = CONTRAST_THRESHOLDS[contrastLevel];

  const checkContrast = (hex: string) => {
    return getContrast(hexToRgb(hex), textColorRgb) >= threshold;
  };

  const toggleId = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleColorGroup = (name: string) => {
    const next = new Set(selectedIds);
    const groupIds = SHADES.map(s => `${name}-${s}`).filter(id => {
      const color = ALL_COLORS.find(c => c.id === id);
      return color && checkContrast(color.hex);
    });
    const allSelected = groupIds.length > 0 && groupIds.every(id => next.has(id));
    if (allSelected) groupIds.forEach(id => next.delete(id));
    else groupIds.forEach(id => next.add(id));
    setSelectedIds(next);
  };

  const toggleShadeGroup = (shade: string) => {
    const next = new Set(selectedIds);
    const shadeIds = COLOR_NAMES.map(name => `${name}-${shade}`).filter(id => {
      const color = ALL_COLORS.find(c => c.id === id);
      return color && checkContrast(color.hex);
    });
    
    if (shadeIds.length === 0) return;

    const allSelected = shadeIds.every(id => next.has(id));
    if (allSelected) {
      shadeIds.forEach(id => next.delete(id));
    } else {
      shadeIds.forEach(id => next.add(id));
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    const next = new Set<string>();
    ALL_COLORS.forEach(c => { if (checkContrast(c.hex)) next.add(c.id); });
    setSelectedIds(next);
  };
  
  const deselectAll = () => setSelectedIds(new Set());

  const getComboCode = (c1: ColorInfo, c2: ColorInfo) => {
    const n1 = c1.name.substring(0, 2).toUpperCase();
    const n2 = c2.name.substring(0, 2).toUpperCase();
    return `${n1}${c1.shade}-${n2}${c2.shade}`;
  };

  const baseCombinations = useMemo(() => {
    const activeColors = ALL_COLORS.filter(c => selectedIds.has(c.id));
    const candidates: ComboWithMeta[] = [];

    for (let i = 0; i < activeColors.length; i++) {
      const c1 = activeColors[i];
      const rgb1 = hexToRgb(c1.hex);
      if (getContrast(rgb1, textColorRgb) < threshold) continue;

      for (let j = 0; j < activeColors.length; j++) {
        if (i === j) continue;

        const c2 = activeColors[j];
        const rgb2 = hexToRgb(c2.hex);
        if (getContrast(rgb2, textColorRgb) < threshold) continue;

        if (getContrast(rgb1, rgb2) < minBgContrast) continue;

        const hsl1 = rgbToHsl(rgb1);
        const hsl2 = rgbToHsl(rgb2);

        const hueDist = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h));
        const satDist = Math.abs(hsl1.s - hsl2.s);
        const lumDist = Math.abs(hsl1.l - hsl2.l);

        if (hueDist >= minHueDistance && satDist >= minSatDistance && lumDist >= minLumDistance) {
          candidates.push({ c1, c2, hsl1, hsl2 });
        }
      }
    }

    if (minTotalDistance === 0) return candidates;

    const filtered: ComboWithMeta[] = [];
    for (const candidate of candidates) {
      let isDiverseEnough = true;
      for (const kept of filtered) {
        const comboDist = (getColorDistance(candidate.hsl1, kept.hsl1) + getColorDistance(candidate.hsl2, kept.hsl2)) / 2;
        if (comboDist < minTotalDistance) {
          isDiverseEnough = false;
          break;
        }
      }
      if (isDiverseEnough) filtered.push(candidate);
    }
    return filtered;
  }, [selectedIds, template, minHueDistance, minSatDistance, minLumDistance, minTotalDistance, minBgContrast, contrastLevel, textColorRgb, threshold]);

  const displayedCombinations = useMemo(() => {
    if (!isDiverse || baseCombinations.length <= 1) return baseCombinations;

    const pool = [...baseCombinations];
    const sorted: ComboWithMeta[] = [pool.shift()!];

    while (pool.length > 0) {
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
    }
    return sorted;
  }, [baseCombinations, isDiverse]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <i className="fa-solid fa-palette text-indigo-600"></i>
          Hero Combinator
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('large')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'large' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}><i className="fa-solid fa-table-cells-large"></i> Preview</button>
            <button onClick={() => setViewMode('mini')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'mini' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}><i className="fa-solid fa-grip"></i> Mini</button>
          </div>
          <button 
            onClick={() => setIsDiverse(!isDiverse)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${isDiverse ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            title="Maximize visual difference between adjacent cards"
          >
            <i className={`fa-solid fa-shuffle ${isDiverse ? 'text-indigo-600' : 'text-slate-400'}`}></i> 
            Diverse Sort
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-96 bg-white border-r overflow-y-auto p-6 flex flex-col gap-6 shrink-0">
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Template</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setTemplate(TemplateType.LIGHT)} className={`flex-1 px-4 py-2 rounded-md text-xs font-bold transition-all ${template === TemplateType.LIGHT ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>LIGHT</button>
              <button onClick={() => setTemplate(TemplateType.DARK)} className={`flex-1 px-4 py-2 rounded-md text-xs font-bold transition-all ${template === TemplateType.DARK ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>DARK</button>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Text Contrast</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['A', 'AA', 'AAA'] as ContrastLevel[]).map(level => (
                <button key={level} onClick={() => setContrastLevel(level)} className={`py-2 rounded-md border text-sm font-semibold transition-all ${contrastLevel === level ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white text-slate-600 hover:border-slate-300'}`}>{level}</button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min BG Contrast</label>
                <span className="text-[10px] font-mono text-indigo-600 font-bold">{minBgContrast.toFixed(1)}:1</span>
              </div>
              <input type="range" min="1.0" max="5.0" step="0.1" value={minBgContrast} onChange={(e) => setMinBgContrast(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            </div>

            {[{ label: 'Hue Distance', val: minHueDistance, set: setMinHueDistance, max: 180, unit: '°' },
              { label: 'Sat Distance', val: minSatDistance, set: setMinSatDistance, max: 100, unit: '%' },
              { label: 'Lum Distance', val: minLumDistance, set: setMinLumDistance, max: 100, unit: '%' },
              { label: 'Diversity', val: minTotalDistance, set: setMinTotalDistance, max: 50, unit: '' }].map(ctrl => (
              <div key={ctrl.label}>
                <div className="flex justify-between mb-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{ctrl.label}</label><span className="text-[10px] font-mono text-indigo-600 font-bold">{ctrl.val}{ctrl.unit}</span></div>
                <input type="range" min="0" max={ctrl.max} step="1" value={ctrl.val} onChange={(e) => ctrl.set(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>
            ))}
          </section>

          <section className="flex flex-col flex-1 min-h-0 border-t pt-4">
            <div className="flex justify-between items-end mb-4"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Palette Selection</h3><div className="flex gap-2"><button onClick={deselectAll} className="text-[10px] text-slate-400 hover:text-slate-600">None</button><button onClick={selectAll} className="text-[10px] text-slate-400 hover:text-slate-600">All Passing</button></div></div>
            <div className="bg-slate-50 border rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="grid grid-cols-[80px_repeat(11,minmax(0,1fr))] bg-slate-100 border-b text-[9px] font-bold text-slate-500">
                <div className="px-2 py-1.5 border-r uppercase flex items-center">Color</div>
                {SHADES.map(s => (
                  <button 
                    key={s} 
                    onClick={() => toggleShadeGroup(s)}
                    className="h-8 flex flex-col items-center justify-center hover:bg-slate-200 transition-colors border-l first:border-l-0 border-slate-200"
                    title={`Toggle all ${s} shades`}
                  >
                    <div className="text-[8px] opacity-40">
                      <i className="fa-solid fa-chevron-down"></i>
                    </div>
                  </button>
                ))}
              </div>
              <div className="overflow-y-auto flex-1">
                {COLOR_NAMES.map(name => {
                   const shades = SHADES.map(s => ({ hex: TAILWIND_COLORS[name][s], id: `${name}-${s}`, passes: checkContrast(TAILWIND_COLORS[name][s]) }));
                   return (
                     <div key={name} className="grid grid-cols-[80px_repeat(11,minmax(0,1fr))] border-b border-slate-100 last:border-0 hover:bg-white group/row">
                        <button onClick={() => toggleColorGroup(name)} className="px-2 py-1.5 text-[9px] font-bold uppercase text-left truncate border-r border-slate-100 text-slate-400 group-hover/row:text-slate-600">{name}</button>
                        {shades.map(s => (
                          <button key={s.id} disabled={!s.passes} onClick={() => toggleId(s.id)} className={`relative h-8 transition-all flex items-center justify-center ${s.passes ? 'cursor-pointer' : 'opacity-10 grayscale pointer-events-none'}`} style={{ backgroundColor: s.hex }}>
                            {s.passes && selectedIds.has(s.id) && (
                              <i className={`fa-solid fa-check text-[8px] drop-shadow-sm ${template === TemplateType.LIGHT ? 'text-black' : 'text-white'}`}></i>
                            )}
                          </button>
                        ))}
                     </div>
                   );
                })}
              </div>
            </div>
          </section>
        </aside>

        <main className="flex-1 bg-slate-50 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div><h2 className="text-2xl font-bold text-slate-800">Visual Results</h2><p className="text-slate-500 text-sm mt-1">Showing <span className="font-bold text-indigo-600">{displayedCombinations.length}</span> results.</p></div>
            </div>

            {displayedCombinations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <i className="fa-solid fa-circle-nodes text-slate-200 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-slate-600">No results found</h3>
                <p className="text-slate-400 max-w-xs mx-auto mt-2">Try selecting more colors from the palette or loosening the distance and contrast filters.</p>
              </div>
            ) : viewMode === 'large' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {displayedCombinations.map((combo, idx) => (
                  <div key={`${combo.c1.id}-${combo.c2.id}-${idx}`} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-200 flex flex-col cursor-pointer hover:-translate-y-1">
                    <div className="relative aspect-square w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                       <HeroPreview color1={combo.c1.hex} color2={combo.c2.hex} textColor={textColorHex} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {displayedCombinations.map((combo, idx) => (
                  <div key={`${combo.c1.id}-${combo.c2.id}-${idx}`} className="group w-28 h-28 relative rounded-2xl overflow-hidden shadow-sm hover:scale-110 transition-transform cursor-pointer border border-slate-200">
                    <HeroPreview 
                      color1={combo.c1.hex} 
                      color2={combo.c2.hex} 
                      textColor={textColorHex} 
                      showCode={true}
                      code={getComboCode(combo.c1, combo.c2)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
