import { FONT_FAMILIES, FONT_WEIGHTS } from '../types';
import type { TextAlign, TextItem } from '../types';

type Props = {
  items: TextItem[];
  selectedId: string | null;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<TextItem>) => void;
  onRemove: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
};

const ALIGNS: { id: TextAlign; label: string }[] = [
  { id: 'left', label: '⇤' },
  { id: 'center', label: '⇔' },
  { id: 'right', label: '⇥' },
];

export function TextPanel({
  items,
  selectedId,
  onAdd,
  onSelect,
  onChange,
  onRemove,
  onBringToFront,
  onSendToBack,
}: Props) {
  const selected = items.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="text-panel">
      <button className="text-add-btn" onClick={onAdd}>
        + 加入文字
      </button>

      {items.length > 0 && (
        <div className="text-list">
          {items.map((t) => (
            <button
              key={t.id}
              className={`text-list-item ${t.id === selectedId ? 'is-active' : ''}`}
              onClick={() => onSelect(t.id)}
              title={t.text}
            >
              <span className="text-list-glyph" style={{ fontFamily: t.fontFamily }}>
                T
              </span>
              <span className="text-list-text">{t.text || '(空)'}</span>
            </button>
          ))}
        </div>
      )}

      {selected && <TextEditor item={selected} onChange={(p) => onChange(selected.id, p)}
        onRemove={() => onRemove(selected.id)}
        onBringToFront={() => onBringToFront(selected.id)}
        onSendToBack={() => onSendToBack(selected.id)} />}
    </div>
  );
}

type EditorProps = {
  item: TextItem;
  onChange: (patch: Partial<TextItem>) => void;
  onRemove: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
};

function TextEditor({ item, onChange, onRemove, onBringToFront, onSendToBack }: EditorProps) {
  return (
    <div className="text-editor">
      <textarea
        className="text-editor-content"
        rows={2}
        value={item.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="輸入文字..."
      />

      <div className="form-row">
        <label>字型</label>
        <select
          className="select"
          value={item.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          style={{ fontFamily: item.fontFamily }}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.id} value={f.stack} style={{ fontFamily: f.stack }}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>字級</label>
        <input
          type="range"
          min={12}
          max={240}
          value={item.fontSize}
          onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
        />
        <span className="form-val">{item.fontSize}px</span>
      </div>

      <div className="form-row">
        <label>粗細</label>
        <select
          className="select"
          value={item.fontWeight}
          onChange={(e) => onChange({ fontWeight: parseInt(e.target.value) })}
        >
          {FONT_WEIGHTS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <button
          className={`chip ${item.italic ? 'is-active' : ''}`}
          onClick={() => onChange({ italic: !item.italic })}
          title="斜體"
        >
          <i>I</i>
        </button>
      </div>

      <div className="form-row">
        <label>顏色</label>
        <input
          type="color"
          value={item.color}
          onChange={(e) => onChange({ color: e.target.value })}
        />
        <div className="aspect-row" style={{ gridColumn: 'unset' }}>
          {ALIGNS.map((a) => (
            <button
              key={a.id}
              className={`chip ${a.id === item.align ? 'is-active' : ''}`}
              onClick={() => onChange({ align: a.id })}
              title={`對齊 ${a.id}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label>字距</label>
        <input
          type="range"
          min={-10}
          max={40}
          value={item.letterSpacing}
          onChange={(e) => onChange({ letterSpacing: parseInt(e.target.value) })}
        />
        <span className="form-val">{item.letterSpacing}px</span>
      </div>

      <div className="form-row">
        <label>行高</label>
        <input
          type="range"
          min={0.8}
          max={3}
          step={0.05}
          value={item.lineHeight}
          onChange={(e) => onChange({ lineHeight: parseFloat(e.target.value) })}
        />
        <span className="form-val">{item.lineHeight.toFixed(2)}</span>
      </div>

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

      <hr className="hr" />

      <div className="form-row">
        <label>外框</label>
        <input
          type="checkbox"
          checked={!!item.stroke}
          onChange={(e) =>
            onChange({ stroke: e.target.checked ? { color: '#000000', width: 2 } : null })
          }
        />
        {item.stroke && (
          <>
            <input
              type="color"
              value={item.stroke.color}
              onChange={(e) =>
                onChange({ stroke: { ...item.stroke!, color: e.target.value } })
              }
            />
            <input
              type="range"
              min={1}
              max={20}
              value={item.stroke.width}
              onChange={(e) =>
                onChange({ stroke: { ...item.stroke!, width: parseInt(e.target.value) } })
              }
              style={{ gridColumn: '1 / -1' }}
            />
          </>
        )}
      </div>

      <div className="form-row">
        <label>陰影</label>
        <input
          type="checkbox"
          checked={!!item.shadow}
          onChange={(e) =>
            onChange({
              shadow: e.target.checked
                ? { color: 'rgba(0,0,0,0.5)', x: 0, y: 4, blur: 8 }
                : null,
            })
          }
        />
        {item.shadow && (
          <div className="shadow-grid">
            <label>X</label>
            <input
              type="range"
              min={-30}
              max={30}
              value={item.shadow.x}
              onChange={(e) =>
                onChange({ shadow: { ...item.shadow!, x: parseInt(e.target.value) } })
              }
            />
            <label>Y</label>
            <input
              type="range"
              min={-30}
              max={30}
              value={item.shadow.y}
              onChange={(e) =>
                onChange({ shadow: { ...item.shadow!, y: parseInt(e.target.value) } })
              }
            />
            <label>模糊</label>
            <input
              type="range"
              min={0}
              max={40}
              value={item.shadow.blur}
              onChange={(e) =>
                onChange({ shadow: { ...item.shadow!, blur: parseInt(e.target.value) } })
              }
            />
          </div>
        )}
      </div>

      <div className="form-row">
        <label>底色</label>
        <input
          type="checkbox"
          checked={!!item.background}
          onChange={(e) =>
            onChange({
              background: e.target.checked
                ? { color: 'rgba(0,0,0,0.6)', padding: 8, radius: 6 }
                : null,
            })
          }
        />
        {item.background && (
          <div className="shadow-grid">
            <label>顏色</label>
            <input
              type="color"
              value={item.background.color.startsWith('#') ? item.background.color : '#000000'}
              onChange={(e) =>
                onChange({ background: { ...item.background!, color: e.target.value } })
              }
              style={{ width: '100%' }}
            />
            <label>內距</label>
            <input
              type="range"
              min={0}
              max={40}
              value={item.background.padding}
              onChange={(e) =>
                onChange({
                  background: { ...item.background!, padding: parseInt(e.target.value) },
                })
              }
            />
            <label>圓角</label>
            <input
              type="range"
              min={0}
              max={40}
              value={item.background.radius}
              onChange={(e) =>
                onChange({
                  background: { ...item.background!, radius: parseInt(e.target.value) },
                })
              }
            />
          </div>
        )}
      </div>

      <div className="text-actions">
        <button className="btn" onClick={onSendToBack}>移至後</button>
        <button className="btn" onClick={onBringToFront}>移至前</button>
        <button className="btn btn-danger" onClick={onRemove}>刪除</button>
      </div>
    </div>
  );
}
