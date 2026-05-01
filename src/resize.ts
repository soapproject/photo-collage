import type { LayoutCell } from './types';

export type ResizeDir = 'l' | 'r' | 't' | 'b';

const TOL = 0.4;
const MIN_DIM = 8;

export function applyResize(
  cells: LayoutCell[],
  idx: number,
  dir: ResizeDir,
  deltaPct: number
): LayoutCell[] {
  const me = cells[idx];
  const next = cells.map((c) => ({ ...c }));

  if (dir === 'r' || dir === 'l') {
    const lineX = dir === 'r' ? me.x + me.w : me.x;
    const leftIdx: number[] = [];
    const rightIdx: number[] = [];
    cells.forEach((c, i) => {
      if (Math.abs(c.x + c.w - lineX) < TOL) leftIdx.push(i);
      if (Math.abs(c.x - lineX) < TOL) rightIdx.push(i);
    });
    const hasNeighbor = leftIdx.some((i) => i !== idx) || rightIdx.some((i) => i !== idx);

    if (hasNeighbor) {
      if (lineX <= 0.1 || lineX >= 99.9) return cells;
      const maxD = Math.min(...rightIdx.map((i) => cells[i].w - MIN_DIM));
      const minD = -Math.min(...leftIdx.map((i) => cells[i].w - MIN_DIM));
      const d = Math.max(minD, Math.min(deltaPct, maxD));
      leftIdx.forEach((i) => {
        next[i].w += d;
      });
      rightIdx.forEach((i) => {
        next[i].x += d;
        next[i].w -= d;
      });
    } else if (dir === 'r') {
      const maxD = 100 - me.x - me.w;
      const minD = -(me.w - MIN_DIM);
      const d = Math.max(minD, Math.min(deltaPct, maxD));
      next[idx].w += d;
    } else {
      const maxD = me.w - MIN_DIM;
      const minD = -me.x;
      const d = Math.max(minD, Math.min(deltaPct, maxD));
      next[idx].x += d;
      next[idx].w -= d;
    }
  } else {
    const lineY = dir === 'b' ? me.y + me.h : me.y;
    const topIdx: number[] = [];
    const bottomIdx: number[] = [];
    cells.forEach((c, i) => {
      if (Math.abs(c.y + c.h - lineY) < TOL) topIdx.push(i);
      if (Math.abs(c.y - lineY) < TOL) bottomIdx.push(i);
    });
    const hasNeighbor = topIdx.some((i) => i !== idx) || bottomIdx.some((i) => i !== idx);

    if (hasNeighbor) {
      if (lineY <= 0.1 || lineY >= 99.9) return cells;
      const maxD = Math.min(...bottomIdx.map((i) => cells[i].h - MIN_DIM));
      const minD = -Math.min(...topIdx.map((i) => cells[i].h - MIN_DIM));
      const d = Math.max(minD, Math.min(deltaPct, maxD));
      topIdx.forEach((i) => {
        next[i].h += d;
      });
      bottomIdx.forEach((i) => {
        next[i].y += d;
        next[i].h -= d;
      });
    } else if (dir === 'b') {
      const maxD = 100 - me.y - me.h;
      const minD = -(me.h - MIN_DIM);
      const d = Math.max(minD, Math.min(deltaPct, maxD));
      next[idx].h += d;
    } else {
      const maxD = me.h - MIN_DIM;
      const minD = -me.y;
      const d = Math.max(minD, Math.min(deltaPct, maxD));
      next[idx].y += d;
      next[idx].h -= d;
    }
  }

  return next;
}
