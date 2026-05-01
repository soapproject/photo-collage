import type { TextItem } from './types';

function parseTransform(str: string): { rotate: number; flipH: boolean; flipV: boolean } {
  let rotate = 0;
  let flipH = false;
  let flipV = false;
  if (!str) return { rotate, flipH, flipV };
  const rotMatch = str.match(/rotate\(([-\d.]+)deg\)/);
  if (rotMatch) rotate = parseFloat(rotMatch[1]);
  const sxMatch = str.match(/scaleX\(([-\d.]+)\)/);
  if (sxMatch && parseFloat(sxMatch[1]) < 0) flipH = true;
  const syMatch = str.match(/scaleY\(([-\d.]+)\)/);
  if (syMatch && parseFloat(syMatch[1]) < 0) flipV = true;
  return { rotate, flipH, flipV };
}

function parseShadowColor(boxShadow: string): string {
  const rgbMatch = boxShadow.match(/(rgba?\([^)]+\))/);
  if (rgbMatch) return rgbMatch[1];
  const hexMatch = boxShadow.match(/#[0-9a-f]{3,8}/i);
  if (hexMatch) return hexMatch[0];
  return 'rgba(0,0,0,0.5)';
}

function parseShadowOffsets(boxShadow: string): { x: number; y: number; blur: number } {
  const stripped = boxShadow.replace(/rgba?\([^)]+\)/g, '').replace(/#[0-9a-f]{3,8}/gi, '');
  const nums = stripped.match(/-?\d+(?:\.\d+)?/g)?.map(parseFloat) ?? [];
  return { x: nums[0] ?? 0, y: nums[1] ?? 0, blur: nums[2] ?? 0 };
}

export async function exportStageToPngDataUrl(
  stage: HTMLElement,
  texts: TextItem[],
  outputWidth: number,
  outputHeight: number
): Promise<string> {
  const stageRect = stage.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(outputWidth);
  canvas.height = Math.round(outputHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d 不可用');
  const pixelRatio = outputWidth / stageRect.width;
  ctx.scale(pixelRatio, pixelRatio);

  const bg = getComputedStyle(stage).backgroundColor;
  if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, stageRect.width, stageRect.height);
  }

  const cells = Array.from(stage.querySelectorAll<HTMLElement>('.cell'));
  for (const cell of cells) {
    const r = cell.getBoundingClientRect();
    const x = r.left - stageRect.left;
    const y = r.top - stageRect.top;
    const w = r.width;
    const h = r.height;

    const cs = getComputedStyle(cell);
    const radius = Math.min(parseFloat(cs.borderTopLeftRadius || '0') || 0, w / 2, h / 2);

    const drawCellPath = () => {
      ctx.beginPath();
      if (radius > 0 && typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, radius);
      } else {
        ctx.rect(x, y, w, h);
      }
    };

    const shadowMatch = cs.boxShadow && cs.boxShadow !== 'none' ? cs.boxShadow : null;
    if (shadowMatch) {
      ctx.save();
      ctx.shadowColor = parseShadowColor(shadowMatch);
      const offs = parseShadowOffsets(shadowMatch);
      ctx.shadowOffsetX = offs.x;
      ctx.shadowOffsetY = offs.y;
      ctx.shadowBlur = offs.blur;
      ctx.fillStyle = '#ffffff';
      drawCellPath();
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    drawCellPath();
    ctx.clip();

    const cellBg = cs.backgroundColor;
    if (cellBg && cellBg !== 'rgba(0, 0, 0, 0)' && cellBg !== 'transparent') {
      ctx.fillStyle = cellBg;
      ctx.fillRect(x, y, w, h);
    }

    const img = cell.querySelector<HTMLImageElement>('img.cell-img');
    if (img && img.complete && img.naturalWidth > 0) {
      const ir = img.getBoundingClientRect();
      const dx = ir.left - stageRect.left;
      const dy = ir.top - stageRect.top;
      const dw = ir.width;
      const dh = ir.height;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const naturalRatio = nw / nh;
      const boxRatio = dw / dh;

      let sx: number, sy: number, sw: number, sh: number;
      if (naturalRatio > boxRatio) {
        sh = nh;
        sw = nh * boxRatio;
        sx = (nw - sw) / 2;
        sy = 0;
      } else {
        sw = nw;
        sh = nw / boxRatio;
        sx = 0;
        sy = (nh - sh) / 2;
      }

      const transform = parseTransform(img.style.transform);
      const imgFilter = img.style.filter;

      ctx.save();
      const cx = dx + dw / 2;
      const cy = dy + dh / 2;
      ctx.translate(cx, cy);
      if (transform.rotate) ctx.rotate((transform.rotate * Math.PI) / 180);
      if (transform.flipH || transform.flipV) {
        ctx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1);
      }
      ctx.translate(-cx, -cy);
      if (imgFilter && imgFilter !== 'none') {
        ctx.filter = imgFilter;
      }
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      ctx.restore();
    }

    ctx.restore();

    const borderWidth = parseFloat(cs.borderTopWidth || '0') || 0;
    if (borderWidth > 0) {
      ctx.save();
      drawCellPath();
      ctx.strokeStyle = cs.borderTopColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();
      ctx.restore();
    }
  }

  for (const t of texts) {
    drawTextItem(ctx, t, stageRect.width, stageRect.height);
  }

  return canvas.toDataURL('image/png');
}

function drawTextItem(
  ctx: CanvasRenderingContext2D,
  item: TextItem,
  stageW: number,
  stageH: number
) {
  const dx = (item.x / 100) * stageW;
  const dy = (item.y / 100) * stageH;
  const lines = item.text.split('\n');
  const fontStr = `${item.italic ? 'italic ' : ''}${item.fontWeight} ${item.fontSize}px ${item.fontFamily}`;

  ctx.save();
  ctx.translate(dx, dy);
  ctx.rotate((item.rotation * Math.PI) / 180);
  ctx.globalAlpha = item.opacity;

  ctx.font = fontStr;
  if ('letterSpacing' in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${item.letterSpacing}px`;
  }
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  const lineHeight = item.fontSize * item.lineHeight;
  const lineWidths = lines.map((l) => ctx.measureText(l).width);
  const totalWidth = Math.max(0, ...lineWidths);
  const totalHeight = lines.length * lineHeight;

  if (item.background) {
    const pad = item.background.padding;
    const r = item.background.radius;
    const bx = -pad;
    const by = -pad;
    const bw = totalWidth + pad * 2;
    const bh = totalHeight + pad * 2;
    ctx.fillStyle = item.background.color;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function' && r > 0) {
      ctx.roundRect(bx, by, bw, bh, r);
    } else {
      ctx.rect(bx, by, bw, bh);
    }
    ctx.fill();
  }

  const hasStroke = !!item.stroke;
  const applyShadow = () => {
    if (item.shadow) {
      ctx.shadowColor = item.shadow.color;
      ctx.shadowOffsetX = item.shadow.x;
      ctx.shadowOffsetY = item.shadow.y;
      ctx.shadowBlur = item.shadow.blur;
    }
  };
  const clearShadow = () => {
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
  };

  lines.forEach((line, i) => {
    if (!line) return;
    let lx = 0;
    if (item.align === 'center') lx = (totalWidth - lineWidths[i]) / 2;
    else if (item.align === 'right') lx = totalWidth - lineWidths[i];
    const ly = i * lineHeight;

    if (hasStroke) {
      applyShadow();
      ctx.strokeStyle = item.stroke!.color;
      ctx.lineWidth = item.stroke!.width;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(line, lx, ly);
      clearShadow();
      ctx.fillStyle = item.color;
      ctx.fillText(line, lx, ly);
    } else {
      applyShadow();
      ctx.fillStyle = item.color;
      ctx.fillText(line, lx, ly);
      clearShadow();
    }
  });

  ctx.restore();
}
