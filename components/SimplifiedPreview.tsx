import React from 'react';
import { TemplateType } from '../types';

interface SimplifiedPreviewProps {
  color1: string;
  color2: string;
  template: TemplateType;
}

// Lightweight preview for mini view - just 2 colored divs instead of 224-line SVG
// This reduces DOM from ~224 elements per card to just 2
export const SimplifiedPreview = React.memo(({ 
  color1, 
  color2, 
  template 
}: SimplifiedPreviewProps) => {
  const bgColor = template === TemplateType.DARK ? '#000000' : '#EAEAEA';
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Top section - primary color (larger) */}
      <div 
        className="flex-[3]" 
        style={{ backgroundColor: color1 }}
      />
      {/* Accent stripe - secondary color */}
      <div 
        className="flex-[1] flex items-center justify-center" 
        style={{ backgroundColor: color1 }}
      >
        <div 
          className="w-[60%] h-[60%] rounded-full" 
          style={{ backgroundColor: color2 }}
        />
      </div>
      {/* Bottom section - background color */}
      <div 
        className="flex-[2]" 
        style={{ backgroundColor: bgColor }}
      />
    </div>
  );
});

SimplifiedPreview.displayName = 'SimplifiedPreview';
