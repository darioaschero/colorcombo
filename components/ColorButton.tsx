import React from 'react';
import { ColorInfo, TemplateType } from '../types';

interface ColorButtonProps {
  color: ColorInfo;
  isSelected: boolean;
  passes: boolean;
  onClick: () => void;
  template: TemplateType;
}

// Memoized color button component for Tundra/New York palettes
export const ColorButton = React.memo(({ 
  color, 
  isSelected, 
  passes, 
  onClick, 
  template 
}: ColorButtonProps) => (
  <button
    disabled={!passes}
    onClick={onClick}
    className={`relative aspect-square rounded-lg transition-all border-2 ${
      passes 
        ? isSelected
          ? 'border-indigo-600 ring-2 ring-indigo-200' 
          : 'border-slate-200 hover:border-slate-300 cursor-pointer'
        : 'opacity-10 grayscale pointer-events-none border-slate-100'
    }`}
    style={{ backgroundColor: color.hex }}
    title={color.name}
  >
    {passes && isSelected && (
      <i className={`fa-solid fa-check text-[10px] drop-shadow-sm absolute top-1 right-1 ${template === TemplateType.LIGHT ? 'text-black' : 'text-white'}`}></i>
    )}
  </button>
));

ColorButton.displayName = 'ColorButton';

interface TailwindColorCellProps {
  hex: string;
  id: string;
  passes: boolean;
  isSelected: boolean;
  onClick: () => void;
  template: TemplateType;
}

// Memoized Tailwind color cell component
export const TailwindColorCell = React.memo(({ 
  hex, 
  passes, 
  isSelected, 
  onClick, 
  template 
}: TailwindColorCellProps) => (
  <button 
    disabled={!passes} 
    onClick={onClick} 
    className={`relative h-8 transition-all flex items-center justify-center ${passes ? 'cursor-pointer' : 'opacity-10 grayscale pointer-events-none'}`} 
    style={{ backgroundColor: hex }}
  >
    {passes && isSelected && (
      <i className={`fa-solid fa-check text-[8px] drop-shadow-sm ${template === TemplateType.LIGHT ? 'text-black' : 'text-white'}`}></i>
    )}
  </button>
));

TailwindColorCell.displayName = 'TailwindColorCell';
