import { useEffect, useRef, useState } from 'react';
import { filterToCss } from '../types';
import type { CellState, LayoutCell, Photo } from '../types';
import type { ResizeDir } from '../resize';

type Props = {
  cell: LayoutCell;
  state: CellState;
  photo: Photo | null;
  selected: boolean;
  radius: number;
  gap: number;
  onSelect: (additive: boolean) => void;
  onChange: (next: Partial<CellState>) => void;
  onClear: () => void;
  onAddPhoto: () => void;
  onResizeStart: (dir: ResizeDir, e: React.PointerEvent) => void;
  onMoveStart: (e: React.PointerEvent) => void;
  onDropFiles: (files: File[]) => void;
  useFullSrc?: boolean;
};

const MIN_SCALE = 1;
const MAX_SCALE = 5;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const clampOffsets = (scale: number, x: number, y: number) => {
  const limit = ((scale - 1) / 2) * 100;
  return { x: clamp(x, -limit, limit), y: clamp(y, -limit, limit) };
};

export function PhotoCell({
  cell,
  state,
  photo,
  selected,
  radius,
  gap,
  onSelect,
  onChange,
  onClear,
  onAddPhoto,
  onResizeStart,
  onMoveStart,
  onDropFiles,
  useFullSrc,
}: Props) {
  const hasRightLine = cell.x + cell.w < 99.9;
  const hasBottomLine = cell.y + cell.h < 99.9;
  const hasLeftLine = cell.x > 0.1;
  const hasTopLine = cell.y > 0.1;
  const elRef = useRef<HTMLDivElement>(null);
  const [dropHover, setDropHover] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    baseOffsetX: number;
    baseOffsetY: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      if (!photo) return;
      e.preventDefault();
      const direction = e.deltaY > 0 ? -1 : 1;
      const next = clamp(state.scale + direction * 0.08, MIN_SCALE, MAX_SCALE);
      const { x, y } = clampOffsets(next, state.offsetX, state.offsetY);
      onChange({ scale: next, offsetX: x, offsetY: y });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [photo, state.scale, state.offsetX, state.offsetY, onChange]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const additive = e.ctrlKey || e.shiftKey || e.metaKey;
    onSelect(additive);
    if (!photo || additive) return;
    const el = elRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseOffsetX: state.offsetX,
      baseOffsetY: state.offsetY,
      width: rect.width,
      height: rect.height,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = ((e.clientX - drag.startX) / drag.width) * 100;
    const dy = ((e.clientY - drag.startY) / drag.height) * 100;
    const { x, y } = clampOffsets(state.scale, drag.baseOffsetX + dx, drag.baseOffsetY + dy);
    onChange({ offsetX: x, offsetY: y });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      elRef.current?.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  };

  const cellStyle: React.CSSProperties = {
    position: 'absolute',
    left: `calc(${cell.x}% + ${gap / 2}px)`,
    top: `calc(${cell.y}% + ${gap / 2}px)`,
    width: `calc(${cell.w}% - ${gap}px)`,
    height: `calc(${cell.h}% - ${gap}px)`,
    borderRadius: radius,
    border: state.border ? `${state.border.width}px solid ${state.border.color}` : undefined,
    boxShadow: state.shadow
      ? `${state.shadow.x}px ${state.shadow.y}px ${state.shadow.blur}px ${state.shadow.color}`
      : undefined,
  };

  return (
    <div
      ref={elRef}
      className={`cell ${selected ? 'is-selected' : ''} ${photo ? 'has-photo' : 'empty'} ${
        dropHover ? 'is-drop-hover' : ''
      }`}
      style={cellStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDragEnter={(e) => {
        if (Array.from(e.dataTransfer.types).includes('Files')) setDropHover(true);
      }}
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes('Files')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDragLeave={(e) => {
        const next = e.relatedTarget as Node | null;
        if (!next || !elRef.current?.contains(next)) setDropHover(false);
      }}
      onDrop={(e) => {
        const files = Array.from(e.dataTransfer.files).filter((f) =>
          f.type.startsWith('image/')
        );
        if (!files.length) return;
        e.preventDefault();
        e.stopPropagation();
        setDropHover(false);
        onDropFiles(files);
      }}
    >
      {photo ? (
        <img
          src={useFullSrc ? photo.fullSrc ?? photo.src : photo.src}
          alt=""
          draggable={false}
          className="cell-img"
          style={{
            width: `${100 * state.scale}%`,
            height: `${100 * state.scale}%`,
            left: `calc(50% + ${state.offsetX}%)`,
            top: `calc(50% + ${state.offsetY}%)`,
            transform: `translate(-50%, -50%) rotate(${state.rotate}deg) scaleX(${
              state.flipH ? -1 : 1
            }) scaleY(${state.flipV ? -1 : 1})`,
            filter: filterToCss(state.filter),
          }}
        />
      ) : (
        <button
          type="button"
          className="cell-placeholder"
          onClick={(e) => {
            e.stopPropagation();
            onAddPhoto();
          }}
          title="加入照片"
        >
          +
        </button>
      )}

      {selected && photo && (
        <div className="cell-controls" onPointerDown={(e) => e.stopPropagation()}>
          <button
            className="cell-btn"
            onClick={() => {
              const next = clamp(state.scale - 0.2, MIN_SCALE, MAX_SCALE);
              const { x, y } = clampOffsets(next, state.offsetX, state.offsetY);
              onChange({ scale: next, offsetX: x, offsetY: y });
            }}
            title="縮小"
          >
            −
          </button>
          <input
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.01}
            value={state.scale}
            onChange={(e) => {
              const next = parseFloat(e.target.value);
              const { x, y } = clampOffsets(next, state.offsetX, state.offsetY);
              onChange({ scale: next, offsetX: x, offsetY: y });
            }}
          />
          <button
            className="cell-btn"
            onClick={() => {
              const next = clamp(state.scale + 0.2, MIN_SCALE, MAX_SCALE);
              const { x, y } = clampOffsets(next, state.offsetX, state.offsetY);
              onChange({ scale: next, offsetX: x, offsetY: y });
            }}
            title="放大"
          >
            +
          </button>
          <button
            className="cell-btn"
            onClick={() => onChange({ rotate: (state.rotate + 90) % 360 })}
            title="旋轉 90°"
          >
            ↻
          </button>
          <button
            className={`cell-btn ${state.flipH ? 'is-active' : ''}`}
            onClick={() => onChange({ flipH: !state.flipH })}
            title="水平翻轉"
          >
            ⇆
          </button>
          <button
            className={`cell-btn ${state.flipV ? 'is-active' : ''}`}
            onClick={() => onChange({ flipV: !state.flipV })}
            title="垂直翻轉"
          >
            ⇅
          </button>
          <button
            className="cell-btn"
            onClick={() =>
              onChange({
                scale: 1,
                offsetX: 0,
                offsetY: 0,
                rotate: 0,
                flipH: false,
                flipV: false,
              })
            }
            title="重設"
          >
            ⟲
          </button>
          <button className="cell-btn cell-btn-danger" onClick={onClear} title="移除照片">
            ✕
          </button>
        </div>
      )}

      {selected && (
        <button
          type="button"
          className="cell-move-btn"
          onPointerDown={(e) => {
            e.stopPropagation();
            onMoveStart(e);
          }}
          title="拖曳移動格子"
        >
          ✥
        </button>
      )}

      {hasRightLine && (
        <div
          className="cell-handle cell-handle-r"
          onPointerDown={(e) => onResizeStart('r', e)}
          title="拖曳調整寬度"
        />
      )}
      {hasBottomLine && (
        <div
          className="cell-handle cell-handle-b"
          onPointerDown={(e) => onResizeStart('b', e)}
          title="拖曳調整高度"
        />
      )}
      {hasLeftLine && (
        <div
          className="cell-handle cell-handle-l"
          onPointerDown={(e) => onResizeStart('l', e)}
          title="拖曳調整寬度"
        />
      )}
      {hasTopLine && (
        <div
          className="cell-handle cell-handle-t"
          onPointerDown={(e) => onResizeStart('t', e)}
          title="拖曳調整高度"
        />
      )}
    </div>
  );
}
