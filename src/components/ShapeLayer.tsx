import { useRef } from 'react';
import type { ShapeItem } from '../types';

type Props = {
  item: ShapeItem;
  selected: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onChange: (patch: Partial<ShapeItem>) => void;
};

type ResizeDir = 'l' | 'r' | 't' | 'b';

const MIN_DIM = 1;

export function ShapeLayer({ item, selected, stageRef, onSelect, onChange }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const startMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    if (!stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = item.x;
    const baseY = item.y;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / stageRect.width) * 100;
      const dy = ((ev.clientY - startY) / stageRect.height) * 100;
      onChange({
        x: Math.max(0, Math.min(100 - item.w, baseX + dx)),
        y: Math.max(0, Math.min(100 - item.h, baseY + dy)),
      });
    };
    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  };

  const startResize = (dir: ResizeDir, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    if (!stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const base = { x: item.x, y: item.y, w: item.w, h: item.h };
    const onMove = (ev: PointerEvent) => {
      const dxPct = ((ev.clientX - startX) / stageRect.width) * 100;
      const dyPct = ((ev.clientY - startY) / stageRect.height) * 100;
      let { x, y, w, h } = base;
      if (dir === 'r') w = Math.max(MIN_DIM, Math.min(100 - x, base.w + dxPct));
      else if (dir === 'l') {
        const nx = Math.max(0, Math.min(base.x + base.w - MIN_DIM, base.x + dxPct));
        w = base.w + (base.x - nx);
        x = nx;
      } else if (dir === 'b') h = Math.max(MIN_DIM, Math.min(100 - y, base.h + dyPct));
      else if (dir === 't') {
        const ny = Math.max(0, Math.min(base.y + base.h - MIN_DIM, base.y + dyPct));
        h = base.h + (base.y - ny);
        y = ny;
      }
      onChange({ x, y, w, h });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    document.body.style.cursor = dir === 'l' || dir === 'r' ? 'ew-resize' : 'ns-resize';
  };

  const startRotate = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - cx;
      const dy = ev.clientY - cy;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (ev.shiftKey) angle = Math.round(angle / 15) * 15;
      if (angle > 180) angle -= 360;
      if (angle < -180) angle += 360;
      onChange({ rotation: Math.round(angle * 10) / 10 });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    document.body.style.cursor = 'grabbing';
  };

  const wrapStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${item.x}%`,
    top: `${item.y}%`,
    width: `${item.w}%`,
    height: `${item.h}%`,
    transform: `rotate(${item.rotation}deg)`,
    transformOrigin: 'center center',
    opacity: item.opacity,
    cursor: 'move',
    touchAction: 'none',
    outline: selected ? '1px dashed rgba(107, 138, 253, 0.9)' : 'none',
    outlineOffset: 2,
  };

  const fill = item.fill ?? 'none';
  const stroke = item.stroke ?? 'none';
  const sw = item.strokeWidth;
  const strokeColor = stroke === 'none' ? '#000' : stroke;

  return (
    <div ref={wrapRef} className="shape-layer" style={wrapStyle} onPointerDown={startMove}>
      {(item.kind === 'rect' || item.kind === 'ellipse') && (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ overflow: 'visible', pointerEvents: 'none', display: 'block' }}
        >
          {item.kind === 'rect' && (
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              rx={item.radius}
              ry={item.radius}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {item.kind === 'ellipse' && (
            <ellipse
              cx="50"
              cy="50"
              rx="50"
              ry="50"
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      )}

      {item.kind === 'line' && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: sw,
            background: strokeColor,
            transform: 'translateY(-50%)',
            borderRadius: sw / 2,
            pointerEvents: 'none',
          }}
        />
      )}

      {item.kind === 'arrow' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: strokeColor,
            pointerEvents: 'none',
            clipPath: `polygon(
              0 calc(50% - ${sw / 2}px),
              calc(100% - ${sw * 3.5}px) calc(50% - ${sw / 2}px),
              calc(100% - ${sw * 3.5}px) calc(50% - ${sw * 2}px),
              100% 50%,
              calc(100% - ${sw * 3.5}px) calc(50% + ${sw * 2}px),
              calc(100% - ${sw * 3.5}px) calc(50% + ${sw / 2}px),
              0 calc(50% + ${sw / 2}px)
            )`,
          }}
        />
      )}

      {selected && (
        <>
          <div
            className="shape-handle shape-handle-l"
            onPointerDown={(e) => startResize('l', e)}
          />
          <div
            className="shape-handle shape-handle-r"
            onPointerDown={(e) => startResize('r', e)}
          />
          <div
            className="shape-handle shape-handle-t"
            onPointerDown={(e) => startResize('t', e)}
          />
          <div
            className="shape-handle shape-handle-b"
            onPointerDown={(e) => startResize('b', e)}
          />
          <div className="rotate-anchor">
            <div className="rotate-line" />
            <div
              className="rotate-handle"
              onPointerDown={startRotate}
              title="拖曳旋轉(Shift 鎖 15°)"
            />
          </div>
        </>
      )}
    </div>
  );
}
