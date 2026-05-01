import { DEFAULT_FILTER, FILTER_PRESETS, filterToCss } from '../types';
import type { CellFilter, Photo } from '../types';

type Props = {
  filter: CellFilter | null;
  photo: Photo | null;
  onChange: (patch: Partial<CellFilter>) => void;
  onReset: () => void;
  onApplyPreset: (preset: CellFilter) => void;
};

export function FilterPanel({ filter, photo, onChange, onReset, onApplyPreset }: Props) {
  if (!photo || !filter) {
    return <p className="filter-empty">選一格已放照片的格子來套用效果。</p>;
  }

  return (
    <div className="filter-panel">
      <div className="filter-presets">
        {FILTER_PRESETS.map((p) => (
          <button
            key={p.id}
            className="filter-thumb"
            onClick={() => onApplyPreset({ ...p.filter })}
            title={p.name}
          >
            <div
              className="filter-thumb-img"
              style={{
                backgroundImage: `url(${photo.src})`,
                filter: filterToCss(p.filter),
              }}
            />
            <span className="filter-thumb-name">{p.name}</span>
          </button>
        ))}
      </div>

      <hr className="hr" />

      <FilterRow
        label="亮度"
        min={0.3}
        max={1.7}
        step={0.01}
        value={filter.brightness}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => onChange({ brightness: v })}
      />
      <FilterRow
        label="對比"
        min={0.3}
        max={1.7}
        step={0.01}
        value={filter.contrast}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => onChange({ contrast: v })}
      />
      <FilterRow
        label="飽和度"
        min={0}
        max={2}
        step={0.01}
        value={filter.saturation}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => onChange({ saturation: v })}
      />
      <FilterRow
        label="色相"
        min={-180}
        max={180}
        step={1}
        value={filter.hue}
        format={(v) => `${v}°`}
        onChange={(v) => onChange({ hue: v })}
      />
      <FilterRow
        label="模糊"
        min={0}
        max={20}
        step={0.5}
        value={filter.blur}
        format={(v) => `${v}px`}
        onChange={(v) => onChange({ blur: v })}
      />
      <FilterRow
        label="復古"
        min={0}
        max={1}
        step={0.01}
        value={filter.sepia}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => onChange({ sepia: v })}
      />
      <FilterRow
        label="灰階"
        min={0}
        max={1}
        step={0.01}
        value={filter.grayscale}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => onChange({ grayscale: v })}
      />

      <button
        className="btn"
        onClick={onReset}
        disabled={
          filter.brightness === DEFAULT_FILTER.brightness &&
          filter.contrast === DEFAULT_FILTER.contrast &&
          filter.saturation === DEFAULT_FILTER.saturation &&
          filter.hue === DEFAULT_FILTER.hue &&
          filter.blur === DEFAULT_FILTER.blur &&
          filter.sepia === DEFAULT_FILTER.sepia &&
          filter.grayscale === DEFAULT_FILTER.grayscale
        }
      >
        重設效果
      </button>
    </div>
  );
}

type RowProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
};

function FilterRow({ label, min, max, step, value, format, onChange }: RowProps) {
  return (
    <div className="form-row">
      <label>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="form-val">{format(value)}</span>
    </div>
  );
}
