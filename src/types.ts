export type Photo = {
  id: string;
  src: string;
  name: string;
  naturalWidth: number;
  naturalHeight: number;
};

export type LayoutCell = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Layout = {
  id: string;
  name: string;
  cells: LayoutCell[];
};

export type CellFilter = {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  sepia: number;
  grayscale: number;
};

export const DEFAULT_FILTER: CellFilter = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  hue: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
};

export const FILTER_PRESETS: { id: string; name: string; filter: CellFilter }[] = [
  { id: 'none', name: '原圖', filter: { ...DEFAULT_FILTER } },
  { id: 'bw', name: '黑白', filter: { ...DEFAULT_FILTER, grayscale: 1, contrast: 1.05 } },
  { id: 'vintage', name: '復古', filter: { ...DEFAULT_FILTER, sepia: 0.5, contrast: 1.05, saturation: 0.85 } },
  { id: 'cool', name: '冷調', filter: { ...DEFAULT_FILTER, hue: -15, saturation: 1.1 } },
  { id: 'warm', name: '暖調', filter: { ...DEFAULT_FILTER, hue: 15, saturation: 1.15, brightness: 1.05 } },
  { id: 'punch', name: '高對比', filter: { ...DEFAULT_FILTER, contrast: 1.3, saturation: 1.2 } },
  { id: 'soft', name: '柔和', filter: { ...DEFAULT_FILTER, contrast: 0.9, saturation: 0.9, brightness: 1.05 } },
  { id: 'fade', name: '褪色', filter: { ...DEFAULT_FILTER, contrast: 0.85, saturation: 0.7, brightness: 1.08 } },
];

export function filterToCss(f: CellFilter | null | undefined): string {
  if (!f) return 'none';
  const parts: string[] = [];
  if (f.brightness !== 1) parts.push(`brightness(${f.brightness})`);
  if (f.contrast !== 1) parts.push(`contrast(${f.contrast})`);
  if (f.saturation !== 1) parts.push(`saturate(${f.saturation})`);
  if (f.hue !== 0) parts.push(`hue-rotate(${f.hue}deg)`);
  if (f.blur > 0) parts.push(`blur(${f.blur}px)`);
  if (f.sepia > 0) parts.push(`sepia(${f.sepia})`);
  if (f.grayscale > 0) parts.push(`grayscale(${f.grayscale})`);
  return parts.length ? parts.join(' ') : 'none';
}

export type CellBorder = { color: string; width: number };
export type CellShadow = { color: string; x: number; y: number; blur: number };

export type CellState = {
  photoId: string | null;
  scale: number;
  offsetX: number;
  offsetY: number;
  rotate: number;
  flipH: boolean;
  flipV: boolean;
  filter: CellFilter;
  border: CellBorder | null;
  shadow: CellShadow | null;
};

export type AspectRatio = { id: string; w: number; h: number };

export const ASPECT_RATIOS: AspectRatio[] = [
  { id: '1:1', w: 1, h: 1 },
  { id: '4:3', w: 4, h: 3 },
  { id: '3:4', w: 3, h: 4 },
  { id: '16:9', w: 16, h: 9 },
  { id: '9:16', w: 9, h: 16 },
  { id: '3:2', w: 3, h: 2 },
  { id: '2:3', w: 2, h: 3 },
];

export type CanvasConfig = {
  width: number;
  height: number;
  gap: number;
  radius: number;
  bg: string;
};

export type TextAlign = 'left' | 'center' | 'right';

export type TextStroke = { color: string; width: number };
export type TextShadow = { color: string; x: number; y: number; blur: number };
export type TextBackground = { color: string; padding: number; radius: number };

export type TextItem = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  color: string;
  align: TextAlign;
  letterSpacing: number;
  lineHeight: number;
  rotation: number;
  opacity: number;
  stroke: TextStroke | null;
  shadow: TextShadow | null;
  background: TextBackground | null;
};

export const FONT_FAMILIES: { id: string; label: string; stack: string }[] = [
  { id: 'sans', label: '系統 Sans', stack: 'system-ui, "Segoe UI", "Microsoft JhengHei UI", sans-serif' },
  { id: 'serif', label: '系統 Serif', stack: 'Cambria, "Times New Roman", "PMingLiU", serif' },
  { id: 'mono', label: '等寬', stack: 'Consolas, "Courier New", monospace' },
  { id: 'jhenghei', label: '微軟正黑體', stack: '"Microsoft JhengHei", "Microsoft JhengHei UI", sans-serif' },
  { id: 'mingliu', label: '新細明體', stack: '"PMingLiU", "MingLiU", "Noto Serif CJK TC", serif' },
  { id: 'kai', label: '標楷體', stack: '"DFKai-SB", "BiauKai", "Kaiti TC", serif' },
  { id: 'segoe', label: 'Segoe UI', stack: '"Segoe UI Variable", "Segoe UI", sans-serif' },
  { id: 'georgia', label: 'Georgia', stack: 'Georgia, serif' },
  { id: 'impact', label: 'Impact', stack: 'Impact, "Arial Black", sans-serif' },
  { id: 'comic', label: 'Comic Sans MS', stack: '"Comic Sans MS", cursive' },
  { id: 'verdana', label: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
  { id: 'trebuchet', label: 'Trebuchet MS', stack: '"Trebuchet MS", sans-serif' },
];

export const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800, 900];
