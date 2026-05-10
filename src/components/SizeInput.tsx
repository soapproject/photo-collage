import { useEffect, useState } from 'react';

type Props = {
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
  className?: string;
};

export function SizeInput({ value, min, max, onCommit, className }: Props) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isNaN(n)) {
      setDraft(String(value));
      return;
    }
    const v = Math.max(min, Math.min(max, n));
    if (v !== value) onCommit(v);
    else setDraft(String(value));
  };

  return (
    <input
      type="number"
      className={`num-input ${className ?? ''}`}
      min={min}
      max={max}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );
}
