import React, { useState, useCallback, useTransition } from 'react';
import { TAILWIND_COLORS, SHADES, COLOR_NAMES, ALL_COLORS, TUNDRA_COLORS, NEWYORK_COLORS } from './constants';
import { TemplateType, ContrastLevel, ColorInfo } from './types';
import { hexToRgb, getContrast, CONTRAST_THRESHOLDS } from './utils/color';
import { useColorCombinations } from './hooks/useColorCombinations';
import { ColorButton, TailwindColorCell, VirtualizedGrid } from './components';

type PaletteType = 'tailwind' | 'tundra' | 'newyork';
type ViewMode = 'large' | 'mini';

export default function App() {
  const [paletteType, setPaletteType] = useState<PaletteType>('tundra');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(TUNDRA_COLORS.map(c => c.id))
  );
  const [template, setTemplate] = useState<TemplateType>(TemplateType.LIGHT);
  const [minHueDistance, setMinHueDistance] = useState(0);
  const [minSatDistance, setMinSatDistance] = useState(0);
  const [minLumDistance, setMinLumDistance] = useState(0);
  const [minTotalDistance, setMinTotalDistance] = useState(0);
  const [minBgContrast, setMinBgContrast] = useState(1.4);
  const [contrastLevel, setContrastLevel] = useState<ContrastLevel>('A');
  const [viewMode, setViewMode] = useState<ViewMode>('large');
  const [isDiverse, setIsDiverse] = useState(true);
  const [excludeInverse, setExcludeInverse] = useState(false);

  const [isPending, startTransition] = useTransition();

  const currentPalette = paletteType === 'tundra' ? TUNDRA_COLORS : 
                         paletteType === 'newyork' ? NEWYORK_COLORS : 
                         ALL_COLORS;

  const textColorHex = template === TemplateType.DARK ? '#FFFFFF' : '#000000';
  const textColorRgb = hexToRgb(textColorHex);
  const threshold = CONTRAST_THRESHOLDS[contrastLevel];

  // Use the custom hook for color combinations - NO LIMIT on combinations
  const { combinations, colorContrastMap, totalCount } = useColorCombinations({
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
  });

  // Memoized toggle functions using startTransition for responsive UI
  const toggleId = useCallback((id: string) => {
    startTransition(() => {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    });
  }, []);

  const toggleColorGroup = useCallback((name: string) => {
    startTransition(() => {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (paletteType === 'tundra') {
          const color = TUNDRA_COLORS.find(c => c.name === name);
          if (color) {
            if (next.has(color.id)) next.delete(color.id);
            else next.add(color.id);
          }
        } else if (paletteType === 'newyork') {
          const color = NEWYORK_COLORS.find(c => c.name === name);
          if (color) {
            if (next.has(color.id)) next.delete(color.id);
            else next.add(color.id);
          }
        } else {
          const groupIds = SHADES.map(s => `${name}-${s}`).filter(id => {
            const color = ALL_COLORS.find(c => c.id === id);
            return color && colorContrastMap.get(id);
          });
          const allSelected = groupIds.length > 0 && groupIds.every(id => next.has(id));
          if (allSelected) groupIds.forEach(id => next.delete(id));
          else groupIds.forEach(id => next.add(id));
        }
        return next;
      });
    });
  }, [paletteType, colorContrastMap]);

  const toggleShadeGroup = useCallback((shade: string) => {
    if (paletteType === 'tundra') return;
    startTransition(() => {
      setSelectedIds(prev => {
        const next = new Set(prev);
        const shadeIds = COLOR_NAMES.map(name => `${name}-${shade}`).filter(id => {
          return colorContrastMap.get(id);
        });
        
        if (shadeIds.length === 0) return prev;

        const allSelected = shadeIds.every(id => next.has(id));
        if (allSelected) {
          shadeIds.forEach(id => next.delete(id));
        } else {
          shadeIds.forEach(id => next.add(id));
        }
        return next;
      });
    });
  }, [paletteType, colorContrastMap]);

  const selectAll = useCallback(() => {
    startTransition(() => {
      const next = new Set<string>();
      currentPalette.forEach(c => { 
        if (colorContrastMap.get(c.id)) next.add(c.id); 
      });
      setSelectedIds(next);
    });
  }, [currentPalette, colorContrastMap]);
  
  const deselectAll = useCallback(() => {
    startTransition(() => {
      setSelectedIds(new Set());
    });
  }, []);

  // Reset selected colors when switching palettes
  React.useEffect(() => {
    if (paletteType === 'tundra') {
      setSelectedIds(new Set(TUNDRA_COLORS.map(c => c.id)));
    } else if (paletteType === 'newyork') {
      setSelectedIds(new Set(NEWYORK_COLORS.map(c => c.id)));
    } else {
      setSelectedIds(new Set(ALL_COLORS.filter(c => ['400', '500', '600', '700'].includes(c.shade)).map(c => c.id)));
    }
  }, [paletteType]);

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

            {/* Exclude inverse combinations checkbox */}
            <label className="flex items-center gap-2 mt-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={excludeInverse} 
                onChange={(e) => setExcludeInverse(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 group-hover:text-slate-700">Exclude inverse combinations</span>
            </label>
          </section>

          <section className="flex flex-col flex-1 min-h-0 border-t pt-4">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Palette Selection</h3>
              <div className="flex gap-2">
                <button onClick={deselectAll} className="text-[10px] text-slate-400 hover:text-slate-600">None</button>
                <button onClick={selectAll} className="text-[10px] text-slate-400 hover:text-slate-600">All Passing</button>
              </div>
            </div>
            
            {/* Palette Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg mb-4 gap-1">
              <button 
                onClick={() => setPaletteType('tailwind')} 
                className={`flex-1 px-3 py-2 rounded-md text-xs font-bold transition-all ${paletteType === 'tailwind' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                Tailwind
              </button>
              <button 
                onClick={() => setPaletteType('tundra')} 
                className={`flex-1 px-3 py-2 rounded-md text-xs font-bold transition-all ${paletteType === 'tundra' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                Tundra
              </button>
              <button 
                onClick={() => setPaletteType('newyork')} 
                className={`flex-1 px-3 py-2 rounded-md text-xs font-bold transition-all ${paletteType === 'newyork' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                New York
              </button>
            </div>

            <div className="bg-slate-50 border rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
              {paletteType === 'tundra' ? (
                <div className="overflow-y-auto flex-1 p-4">
                  <div className="grid grid-cols-7 gap-2">
                    {TUNDRA_COLORS.map(color => {
                      const passes = colorContrastMap.get(color.id) ?? false;
                      return (
                        <ColorButton
                          key={color.id}
                          color={color}
                          isSelected={selectedIds.has(color.id)}
                          passes={passes}
                          onClick={() => toggleId(color.id)}
                          template={template}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : paletteType === 'newyork' ? (
                <div className="overflow-y-auto flex-1 p-4">
                  <div className="grid grid-cols-8 gap-2">
                    {NEWYORK_COLORS.map(color => {
                      const passes = colorContrastMap.get(color.id) ?? false;
                      return (
                        <ColorButton
                          key={color.id}
                          color={color}
                          isSelected={selectedIds.has(color.id)}
                          passes={passes}
                          onClick={() => toggleId(color.id)}
                          template={template}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
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
                       const shades = SHADES.map(s => {
                         const id = `${name}-${s}`;
                         return { hex: TAILWIND_COLORS[name][s], id, passes: colorContrastMap.get(id) ?? false };
                       });
                       return (
                         <div key={name} className="grid grid-cols-[80px_repeat(11,minmax(0,1fr))] border-b border-slate-100 last:border-0 hover:bg-white group/row">
                            <button onClick={() => toggleColorGroup(name)} className="px-2 py-1.5 text-[9px] font-bold uppercase text-left truncate border-r border-slate-100 text-slate-400 group-hover/row:text-slate-600">{name}</button>
                            {shades.map(s => (
                              <TailwindColorCell
                                key={s.id}
                                hex={s.hex}
                                id={s.id}
                                passes={s.passes}
                                isSelected={selectedIds.has(s.id)}
                                onClick={() => toggleId(s.id)}
                                template={template}
                              />
                            ))}
                         </div>
                       );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>
        </aside>

        <main className="flex-1 bg-slate-50 overflow-hidden flex flex-col">
          <div className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Visual Results</h2>
                <p className="text-slate-500 text-sm mt-1">
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <i className="fa-solid fa-spinner fa-spin text-indigo-600"></i>
                      <span>Calculating combinations...</span>
                    </span>
                  ) : (
                    <>Showing <span className="font-bold text-indigo-600">{combinations.length}</span> results{totalCount > combinations.length ? ` (${totalCount} total)` : ''}.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="flex-1 px-8 pb-8 min-h-0 overflow-y-auto">
            <VirtualizedGrid
              combinations={combinations}
              viewMode={viewMode}
              textColorHex={textColorHex}
              template={template}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
