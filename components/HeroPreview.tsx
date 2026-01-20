import React, { useMemo } from 'react';
import { TemplateType } from '../types';
import { SVG_TEMPLATE } from './SvgTemplate';

interface HeroPreviewProps {
  color1: string;
  color2: string;
  textColor: string;
  showCode?: boolean;
  code?: string;
  template: TemplateType;
}

// Memoized HeroPreview component using CSS variables for optimal performance
export const HeroPreview = React.memo(({ 
  color1, 
  color2, 
  textColor, 
  showCode, 
  code, 
  template 
}: HeroPreviewProps) => {
  // Calculate CSS variable values based on template - memoize these calculations
  const style = useMemo(() => {
    const textColorVar = template === TemplateType.DARK ? '#FFFFFF' : '#000000';
    const bgColorVar = template === TemplateType.DARK ? '#000000' : '#EAEAEA';
    return {
      '--color1': color1,
      '--color2': color2,
      '--text-color': textColorVar,
      '--bg-color': bgColorVar,
    } as React.CSSProperties;
  }, [color1, color2, template]);

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      style={style}
    >
      {/* Background SVG - static template with CSS variables, no string replacements! */}
      <div 
        className="absolute inset-0"
        dangerouslySetInnerHTML={{ __html: SVG_TEMPLATE }}
      />
      
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
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo - only re-render if props actually changed
  return prevProps.color1 === nextProps.color1 &&
         prevProps.color2 === nextProps.color2 &&
         prevProps.textColor === nextProps.textColor &&
         prevProps.template === nextProps.template &&
         prevProps.showCode === nextProps.showCode &&
         prevProps.code === nextProps.code;
});

HeroPreview.displayName = 'HeroPreview';
