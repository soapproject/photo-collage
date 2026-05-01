import { useEffect, useRef, useState } from 'react';
import type { TextItem } from '../types';

type Props = {
  item: TextItem;
  selected: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
  snapTargets: { xs: number[]; ys: number[] };
  onSelect: () => void;
  onChange: (patch: Partial<TextItem>) => void;
  onSnapChange: (g: { x: number | null; y: number | null }) => void;
};

const SNAP_THRESHOLD_PCT = 1.2;

const findSnap = (value: number, targets: number[]): number | null => {
  let best: number | null = null;
  let bestDist = SNAP_THRESHOLD_PCT;
  for (const t of targets) {
    const d = Math.abs(t - value);
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  return best;
};

export function TextLayer({
  item,
  selected,
  stageRef,
  snapTargets,
  onSelect,
  onChange,
  onSnapChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      taRef.current?.focus();
      taRef.current?.select();
    }
  }, [editing]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editing) return;
    e.stopPropagation();
    onSelect();
    if (!stageRef.current || !wrapRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = item.x;
    const baseY = item.y;
    const target = wrapRef.current;
    target.setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / stageRect.width) * 100;
      const dy = ((ev.clientY - startY) / stageRect.height) * 100;
      let nextX = baseX + dx;
      let nextY = baseY + dy;
      const snapX = findSnap(nextX, snapTargets.xs);
      const snapY = findSnap(nextY, snapTargets.ys);
      if (snapX !== null) nextX = snapX;
      if (snapY !== null) nextY = snapY;
      onChange({ x: nextX, y: nextY });
      onSnapChange({ x: snapX, y: snapY });
    };
    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      onSnapChange({ x: null, y: null });
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  };

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${item.x}%`,
    top: `${item.y}%`,
    transform: `rotate(${item.rotation}deg)`,
    transformOrigin: 'top left',
    cursor: editing ? 'text' : 'move',
    opacity: item.opacity,
    color: item.color,
    fontFamily: item.fontFamily,
    fontSize: item.fontSize,
    fontWeight: item.fontWeight,
    fontStyle: item.italic ? 'italic' : 'normal',
    letterSpacing: item.letterSpacing,
    lineHeight: item.lineHeight,
    textAlign: item.align,
    whiteSpace: 'pre',
    userSelect: editing ? 'text' : 'none',
    touchAction: 'none',
    padding: item.background ? item.background.padding : 0,
    background: item.background ? item.background.color : 'transparent',
    borderRadius: item.background ? item.background.radius : 0,
    textShadow: item.shadow
      ? `${item.shadow.x}px ${item.shadow.y}px ${item.shadow.blur}px ${item.shadow.color}`
      : 'none',
    WebkitTextStroke: item.stroke ? `${item.stroke.width}px ${item.stroke.color}` : undefined,
    paintOrder: 'stroke fill',
    outline: selected ? '2px dashed rgba(107, 138, 253, 0.9)' : 'none',
    outlineOffset: 2,
  };

  return (
    <div
      ref={wrapRef}
      className="text-layer"
      style={baseStyle}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
    >
      {editing ? (
        <textarea
          ref={taRef}
          className="text-edit"
          value={item.text}
          rows={Math.max(1, item.text.split('\n').length)}
          onChange={(e) => onChange({ text: e.target.value })}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
            }
          }}
          style={{
            font: 'inherit',
            color: 'inherit',
            letterSpacing: 'inherit',
            lineHeight: 'inherit',
            textAlign: 'inherit',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
            margin: 0,
            resize: 'none',
            width: 'auto',
            minWidth: '4ch',
            whiteSpace: 'pre',
            overflow: 'hidden',
          }}
        />
      ) : (
        item.text || ' '
      )}
    </div>
  );
}
