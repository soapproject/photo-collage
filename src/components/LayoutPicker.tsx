import { LAYOUTS } from '../layouts';
import type { Layout } from '../types';

type Props = {
  selectedId: string;
  onSelect: (layout: Layout) => void;
};

export function LayoutPicker({ selectedId, onSelect }: Props) {
  return (
    <div className="layout-grid">
      {LAYOUTS.map((layout) => (
        <button
          key={layout.id}
          className={`layout-thumb ${layout.id === selectedId ? 'is-active' : ''}`}
          onClick={() => onSelect(layout)}
          title={layout.name}
        >
          <div className="layout-thumb-inner">
            {layout.cells.map((c, i) => (
              <span
                key={i}
                className="layout-thumb-cell"
                style={{
                  left: `${c.x}%`,
                  top: `${c.y}%`,
                  width: `${c.w}%`,
                  height: `${c.h}%`,
                }}
              />
            ))}
          </div>
          <div className="layout-thumb-label">{layout.name}</div>
        </button>
      ))}
    </div>
  );
}
