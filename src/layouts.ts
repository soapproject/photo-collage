import type { Layout } from './types';

export const grid = (cols: number, rows: number): Layout['cells'] => {
  const cells: Layout['cells'] = [];
  const w = 100 / cols;
  const h = 100 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ x: c * w, y: r * h, w, h });
    }
  }
  return cells;
};

export const LAYOUTS: Layout[] = [
  { id: 'single', name: '單張', cells: [{ x: 0, y: 0, w: 100, h: 100 }] },

  { id: 'duo-h', name: '雙拼 · 橫', cells: grid(2, 1) },
  { id: 'duo-v', name: '雙拼 · 直', cells: grid(1, 2) },

  { id: 'triptych-h', name: '三拼 · 橫排', cells: grid(3, 1) },
  { id: 'triptych-v', name: '三拼 · 直排', cells: grid(1, 3) },

  { id: 'grid-2x2', name: '2 × 2 格', cells: grid(2, 2) },
  { id: 'grid-3x2', name: '3 × 2 格', cells: grid(3, 2) },
  { id: 'grid-2x3', name: '2 × 3 格', cells: grid(2, 3) },
  { id: 'grid-3x3', name: '3 × 3 格', cells: grid(3, 3) },
  { id: 'grid-4x4', name: '4 × 4 格', cells: grid(4, 4) },
  { id: 'grid-5x4', name: '5 × 4 格', cells: grid(5, 4) },
  { id: 'grid-4x5', name: '4 × 5 格', cells: grid(4, 5) },

  {
    id: 'big-left-2',
    name: '左大圖 + 2',
    cells: [
      { x: 0, y: 0, w: 60, h: 100 },
      { x: 60, y: 0, w: 40, h: 50 },
      { x: 60, y: 50, w: 40, h: 50 },
    ],
  },
  {
    id: 'big-right-2',
    name: '2 + 右大圖',
    cells: [
      { x: 0, y: 0, w: 40, h: 50 },
      { x: 0, y: 50, w: 40, h: 50 },
      { x: 40, y: 0, w: 60, h: 100 },
    ],
  },
  {
    id: 'big-top-3',
    name: '上大圖 + 3',
    cells: [
      { x: 0, y: 0, w: 100, h: 60 },
      { x: 0, y: 60, w: 100 / 3, h: 40 },
      { x: 100 / 3, y: 60, w: 100 / 3, h: 40 },
      { x: 200 / 3, y: 60, w: 100 / 3, h: 40 },
    ],
  },
  {
    id: 'big-bottom-3',
    name: '3 + 下大圖',
    cells: [
      { x: 0, y: 0, w: 100 / 3, h: 40 },
      { x: 100 / 3, y: 0, w: 100 / 3, h: 40 },
      { x: 200 / 3, y: 0, w: 100 / 3, h: 40 },
      { x: 0, y: 40, w: 100, h: 60 },
    ],
  },
  {
    id: 'big-left-4',
    name: '左大圖 + 2×2',
    cells: [
      { x: 0, y: 0, w: 50, h: 100 },
      { x: 50, y: 0, w: 25, h: 50 },
      { x: 75, y: 0, w: 25, h: 50 },
      { x: 50, y: 50, w: 25, h: 50 },
      { x: 75, y: 50, w: 25, h: 50 },
    ],
  },
  {
    id: 'magazine',
    name: '雜誌',
    cells: [
      { x: 0, y: 0, w: 50, h: 60 },
      { x: 50, y: 0, w: 50, h: 60 },
      { x: 0, y: 60, w: 100 / 3, h: 40 },
      { x: 100 / 3, y: 60, w: 100 / 3, h: 40 },
      { x: 200 / 3, y: 60, w: 100 / 3, h: 40 },
    ],
  },
  {
    id: 'asymm-3',
    name: '不對稱 3',
    cells: [
      { x: 0, y: 0, w: 65, h: 65 },
      { x: 65, y: 0, w: 35, h: 65 },
      { x: 0, y: 65, w: 100, h: 35 },
    ],
  },
  {
    id: 'pinwheel',
    name: '風車',
    cells: [
      { x: 0, y: 0, w: 50, h: 60 },
      { x: 50, y: 0, w: 50, h: 40 },
      { x: 0, y: 60, w: 50, h: 40 },
      { x: 50, y: 40, w: 50, h: 60 },
    ],
  },
];
