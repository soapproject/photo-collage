import type { ShapeItem, ShapeKind } from '../types';

type Props = {
  items: ShapeItem[];
  selectedId: string | null;
  onAdd: (kind: ShapeKind) => void;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<ShapeItem>) => void;
  onRemove: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
};

const KIND_LABELS: { id: ShapeKind; label: string; glyph: string }[] = [
  { id: 'rect', label: '矩形', glyph: '▭' },
  { id: 'ellipse', label: '橢圓', glyph: '⬭' },
  { id: 'line', label: '直線', glyph: '─' },
  { id: 'arrow', label: '箭頭', glyph: '→' },
];

export function ShapePanel({
  items,
  selectedId,
  onAdd,
  onSelect,
  onChange,
  onRemove,
  onBringToFront,
  onSendToBack,
}: Props) {
  const selected = items.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="text-panel">
      <div className="filter-presets" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {KIND_LABELS.map((k) => (
          <button key={k.id} className="filter-thumb" onClick={() => onAdd(k.id)} title={k.label}>
            <div
              className="filter-thumb-img"
              style={{
                background: 'var(--panel)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                color: 'var(--text)',
              }}
            >
              {k.glyph}
            </div>
            <span className="filter-thumb-name">{k.label}</span>
          </button>
        ))}
      </div>

      {items.length > 0 && (
        <div className="text-list">
          {items.map((s) => (
            <button
              key={s.id}
              className={`text-list-item ${s.id === selectedId ? 'is-active' : ''}`}
              onClick={() => onSelect(s.id)}
              title={s.kind}
            >
              <span className="text-list-glyph">
                {KIND_LABELS.find((k) => k.id === s.kind)?.glyph ?? '?'}
              </span>
              <span className="text-list-text">{s.kind}</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <ShapeEditor
          item={selected}
          onChange={(p) => onChange(selected.id, p)}
          onRemove={() => onRemove(selected.id)}
          onBringToFront={() => onBringToFront(selected.id)}
          onSendToBack={() => onSendToBack(selected.id)}
        />
      )}
    </div>
  );
}

type EditorProps = {
  item: ShapeItem;
  onChange: (patch: Partial<ShapeItem>) => void;
  onRemove: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
};

function ShapeEditor({ item, onChange, onRemove, onBringToFront, onSendToBack }: EditorProps) {
  const canFill = item.kind === 'rect' || item.kind === 'ellipse';

  return (
    <div className="text-editor">
      {canFill && (
        <div className="form-row">
          <label>填滿</label>
          <input
            type="checkbox"
            checked={!!item.fill}
            onChange={(e) => onChange({ fill: e.target.checked ? '#6b8afd' : null })}
          />
          {item.fill && (
            <input
              type="color"
              value={item.fill.startsWith('#') ? item.fill : '#6b8afd'}
              onChange={(e) => onChange({ fill: e.target.value })}
            />
          )}
        </div>
      )}

      <div className="form-row">
        <label>{canFill ? '外框' : '線條'}</label>
        <input
          type="checkbox"
          checked={!!item.stroke}
          onChange={(e) =>
            onChange({ stroke: e.target.checked ? '#0e0f12' : null })
          }
        />
        {item.stroke && (
          <input
            type="color"
            value={item.stroke.startsWith('#') ? item.stroke : '#0e0f12'}
            onChange={(e) => onChange({ stroke: e.target.value })}
          />
        )}
      </div>

      {item.stroke && (
        <div className="form-row">
          <label>線寬</label>
          <input
            type="range"
            min={0}
            max={40}
            value={item.strokeWidth}
            onChange={(e) => onChange({ strokeWidth: parseInt(e.target.value) })}
          />
          <span className="form-val">{item.strokeWidth}px</span>
        </div>
      )}

      {item.kind === 'rect' && (
        <div className="form-row">
          <label>圓角</label>
          <input
            type="range"
            min={0}
            max={50}
            value={item.radius}
            onChange={(e) => onChange({ radius: parseInt(e.target.value) })}
          />
          <span className="form-val">{item.radius}</span>
        </div>
      )}

      <div className="form-row">
        <label>旋轉</label>
        <input
          type="range"
          min={-180}
          max={180}
          value={item.rotation}
          onChange={(e) => onChange({ rotation: parseInt(e.target.value) })}
        />
        <span className="form-val">{item.rotation}°</span>
      </div>

      <div className="form-row">
        <label>透明度</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={item.opacity}
          onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
        />
        <span className="form-val">{Math.round(item.opacity * 100)}%</span>
      </div>

      <div className="text-actions">
        <button className="btn" onClick={onSendToBack}>移至後</button>
        <button className="btn" onClick={onBringToFront}>移至前</button>
        <button className="btn btn-danger" onClick={onRemove}>刪除</button>
      </div>
    </div>
  );
}
