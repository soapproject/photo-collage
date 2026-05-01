import type { CellBorder, CellShadow, CellState } from '../types';

type Props = {
  state: CellState | null;
  onChange: (patch: Partial<CellState>) => void;
};

export function CellStylePanel({ state, onChange }: Props) {
  if (!state) {
    return <p className="filter-empty">選一格來調整邊框與陰影。</p>;
  }

  const setBorder = (patch: Partial<CellBorder>) =>
    onChange({ border: { ...(state.border ?? { color: '#000000', width: 2 }), ...patch } });
  const setShadow = (patch: Partial<CellShadow>) =>
    onChange({
      shadow: {
        ...(state.shadow ?? { color: 'rgba(0,0,0,0.4)', x: 0, y: 4, blur: 12 }),
        ...patch,
      },
    });

  return (
    <div className="filter-panel">
      <div className="form-row">
        <label>邊框</label>
        <input
          type="checkbox"
          checked={!!state.border}
          onChange={(e) =>
            onChange({ border: e.target.checked ? { color: '#000000', width: 2 } : null })
          }
        />
        {state.border && (
          <div className="shadow-grid">
            <label>顏色</label>
            <input
              type="color"
              value={state.border.color}
              onChange={(e) => setBorder({ color: e.target.value })}
              style={{ width: '100%' }}
            />
            <label>寬度</label>
            <input
              type="range"
              min={1}
              max={20}
              value={state.border.width}
              onChange={(e) => setBorder({ width: parseInt(e.target.value) })}
            />
          </div>
        )}
      </div>

      <div className="form-row">
        <label>陰影</label>
        <input
          type="checkbox"
          checked={!!state.shadow}
          onChange={(e) =>
            onChange({
              shadow: e.target.checked
                ? { color: 'rgba(0,0,0,0.4)', x: 0, y: 4, blur: 12 }
                : null,
            })
          }
        />
        {state.shadow && (
          <div className="shadow-grid">
            <label>顏色</label>
            <input
              type="color"
              value={state.shadow.color.startsWith('#') ? state.shadow.color : '#000000'}
              onChange={(e) => setShadow({ color: e.target.value })}
              style={{ width: '100%' }}
            />
            <label>X</label>
            <input
              type="range"
              min={-30}
              max={30}
              value={state.shadow.x}
              onChange={(e) => setShadow({ x: parseInt(e.target.value) })}
            />
            <label>Y</label>
            <input
              type="range"
              min={-30}
              max={30}
              value={state.shadow.y}
              onChange={(e) => setShadow({ y: parseInt(e.target.value) })}
            />
            <label>模糊</label>
            <input
              type="range"
              min={0}
              max={60}
              value={state.shadow.blur}
              onChange={(e) => setShadow({ blur: parseInt(e.target.value) })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
