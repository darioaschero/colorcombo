
export type ContrastLevel = 'A' | 'AA' | 'AAA';

export interface ColorInfo {
  name: string;
  shade: string;
  hex: string;
  id: string; // combination of name and shade
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Combination {
  color1: ColorInfo;
  color2: ColorInfo;
}

export enum TemplateType {
  DARK = 'dark',
  LIGHT = 'light'
}
