import React from 'react';
import { ComboWithMeta } from '../hooks/useColorCombinations';
import { TemplateType } from '../types';
import { HeroPreview } from './HeroPreview';

interface VirtualizedGridProps {
  combinations: ComboWithMeta[];
  viewMode: 'large' | 'mini';
  textColorHex: string;
  template: TemplateType;
}

// Simple scrollable grid - works reliably without complex virtualization
// For better performance, we limit to first 500 combinations
export const VirtualizedGrid = React.memo(({ 
  combinations, 
  viewMode, 
  textColorHex, 
  template 
}: VirtualizedGridProps) => {
  // Limit displayed items to prevent performance issues
  const maxItems = 500;
  const displayedCombos = combinations.slice(0, maxItems);

  if (combinations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-dashed border-slate-300">
        <i className="fa-solid fa-circle-nodes text-slate-200 text-4xl mb-4"></i>
        <h3 className="text-lg font-medium text-slate-600">No results found</h3>
        <p className="text-slate-400 max-w-xs mx-auto mt-2">
          Try selecting more colors from the palette or loosening the distance and contrast filters.
        </p>
      </div>
    );
  }

  if (viewMode === 'large') {
    return (
      <>
        {/* Responsive grid: auto-fill columns, min 240px, max 360px each */}
        <div 
          className="grid gap-2"
          style={{ 
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          }}
        >
          {displayedCombos.map((combo, idx) => (
            <div 
              key={`${combo.c1.id}-${combo.c2.id}-${idx}`}
              className="group bg-white rounded-[6px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-200 flex flex-col cursor-pointer hover:-translate-y-1"
              style={{ maxWidth: '360px' }}
            >
              <div className="relative aspect-[100/142] w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                <HeroPreview 
                  color1={combo.c1.hex} 
                  color2={combo.c2.hex} 
                  textColor={textColorHex} 
                  template={template} 
                />
              </div>
            </div>
          ))}
        </div>
        {combinations.length > maxItems && (
          <p className="text-center text-slate-400 text-sm mt-4 pb-4">
            Showing {maxItems} of {combinations.length} combinations. Adjust filters to see different results.
          </p>
        )}
      </>
    );
  }

  return (
    <>
      {/* Mini view: CSS Grid with auto-fill for reliable wrapping */}
      <div 
        className="grid gap-2"
        style={{ 
          gridTemplateColumns: 'repeat(auto-fill, 112px)',
        }}
      >
        {displayedCombos.map((combo, idx) => (
          <div 
            key={`${combo.c1.id}-${combo.c2.id}-${idx}`}
            className="group w-28 h-28 relative rounded-[6px] overflow-hidden shadow-sm hover:scale-110 transition-transform cursor-pointer border border-slate-200"
          >
            <HeroPreview 
              color1={combo.c1.hex} 
              color2={combo.c2.hex} 
              textColor={textColorHex}
              template={template}
            />
          </div>
        ))}
      </div>
      {combinations.length > maxItems && (
        <p className="text-center text-slate-400 text-sm mt-4 pb-4">
          Showing {maxItems} of {combinations.length} combinations. Adjust filters to see different results.
        </p>
      )}
    </>
  );
});

VirtualizedGrid.displayName = 'VirtualizedGrid';
