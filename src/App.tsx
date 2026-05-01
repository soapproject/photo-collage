import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { exportStageToPngDataUrl } from './exportCanvas';
import { Dropzone } from './components/Dropzone';
import { LayoutPicker } from './components/LayoutPicker';
import { PhotoCell } from './components/PhotoCell';
import { TextLayer } from './components/TextLayer';
import { TextPanel } from './components/TextPanel';
import { FilterPanel } from './components/FilterPanel';
import { CellStylePanel } from './components/CellStylePanel';
import { SizeInput } from './components/SizeInput';
import { LAYOUTS } from './layouts';
import { ASPECT_RATIOS, DEFAULT_FILTER, FONT_FAMILIES } from './types';
import { applyResize, type ResizeDir } from './resize';
import type { CanvasConfig, CellFilter, CellState, Layout, Photo, TextItem } from './types';
import './styles.css';

const cloneLayout = (l: Layout): Layout => ({
  ...l,
  cells: l.cells.map((c) => ({ ...c })),
});

const DEFAULT_CELL: CellState = {
  photoId: null,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotate: 0,
  flipH: false,
  flipV: false,
  filter: { ...DEFAULT_FILTER },
  border: null,
  shadow: null,
};

type EditableState = {
  photos: Photo[];
  layout: Layout;
  cellStates: CellState[];
  texts: TextItem[];
  config: CanvasConfig;
};

const HISTORY_LIMIT = 100;
const HISTORY_DEBOUNCE_MS = 400;

const statesDiffer = (a: EditableState, b: EditableState) =>
  a.photos !== b.photos ||
  a.layout !== b.layout ||
  a.cellStates !== b.cellStates ||
  a.texts !== b.texts ||
  a.config !== b.config;

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

async function loadPhoto(file: File): Promise<Photo> {
  const src = URL.createObjectURL(file);
  const img = new Image();
  img.src = src;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load ${file.name}`));
  });
  return {
    id: newId(),
    src,
    name: file.name,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
  };
}

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [layout, setLayout] = useState<Layout>(() => cloneLayout(LAYOUTS[5]));
  const [cellStates, setCellStates] = useState<CellState[]>(() =>
    LAYOUTS[5].cells.map(() => ({ ...DEFAULT_CELL }))
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [config, setConfig] = useState<CanvasConfig>({
    width: 1080,
    height: 1080,
    gap: 8,
    radius: 6,
    bg: '#ffffff',
  });
  const [exporting, setExporting] = useState(false);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });
  const stageRef = useRef<HTMLDivElement>(null);

  const historyRef = useRef<{
    past: EditableState[];
    future: EditableState[];
    current: EditableState;
  }>({
    past: [],
    future: [],
    current: { photos: [], layout, cellStates, texts: [], config },
  });
  const [, bumpHistory] = useReducer((x: number) => x + 1, 0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current: EditableState = { photos, layout, cellStates, texts, config };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const prev = historyRef.current.current;
      if (statesDiffer(prev, current)) {
        historyRef.current.past.push(prev);
        if (historyRef.current.past.length > HISTORY_LIMIT) historyRef.current.past.shift();
        historyRef.current.future = [];
        historyRef.current.current = current;
        bumpHistory();
      }
    }, HISTORY_DEBOUNCE_MS);
  }, [photos, layout, cellStates, texts, config]);

  const applyState = (s: EditableState) => {
    historyRef.current.current = s;
    setPhotos(s.photos);
    setLayout(s.layout);
    setCellStates(s.cellStates);
    setTexts(s.texts);
    setConfig(s.config);
    setSelected(null);
    setSelectedTextId(null);
  };

  const flushPendingHistory = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const current: EditableState = { photos, layout, cellStates, texts, config };
    const prev = historyRef.current.current;
    if (statesDiffer(prev, current)) {
      historyRef.current.past.push(prev);
      if (historyRef.current.past.length > HISTORY_LIMIT) historyRef.current.past.shift();
      historyRef.current.future = [];
      historyRef.current.current = current;
    }
  };

  const undo = useCallback(() => {
    flushPendingHistory();
    if (!historyRef.current.past.length) return;
    const prev = historyRef.current.past.pop()!;
    historyRef.current.future.push(historyRef.current.current);
    applyState(prev);
    bumpHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, layout, cellStates, texts, config]);

  const redo = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (!historyRef.current.future.length) return;
    const next = historyRef.current.future.pop()!;
    historyRef.current.past.push(historyRef.current.current);
    applyState(next);
    bumpHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undo();
      } else if (mod && ((e.shiftKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const addPhotosAndFill = useCallback(async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;
    const loaded = await Promise.all(imgs.map(loadPhoto));
    setPhotos((prev) => [...prev, ...loaded]);
    setCellStates((cs) => {
      const queue = [...loaded];
      return cs.map((c) => {
        if (c.photoId) return c;
        const p = queue.shift();
        return p ? { ...DEFAULT_CELL, photoId: p.id } : c;
      });
    });
  }, []);

  const selectLayout = (l: Layout) => {
    const cloned = cloneLayout(l);
    setLayout(cloned);
    setSelected(null);
    setCellStates(() => {
      const queue = [...photos];
      return cloned.cells.map(() => {
        const p = queue.shift();
        return p ? { ...DEFAULT_CELL, photoId: p.id } : { ...DEFAULT_CELL };
      });
    });
  };

  const startCellMove = (idx: number, e: React.PointerEvent) => {
    if (!stageRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const stageRect = stageRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startCell = { ...layout.cells[idx] };
    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / stageRect.width) * 100;
      const dy = ((ev.clientY - startY) / stageRect.height) * 100;
      const newX = Math.max(0, Math.min(100 - startCell.w, startCell.x + dx));
      const newY = Math.max(0, Math.min(100 - startCell.h, startCell.y + dy));
      setLayout((prev) => ({
        ...prev,
        cells: prev.cells.map((c, i) => (i === idx ? { ...c, x: newX, y: newY } : c)),
      }));
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

  const startResize = (idx: number, dir: ResizeDir, e: React.PointerEvent) => {
    if (!stageRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const stageRect = stageRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startCells = layout.cells.map((c) => ({ ...c }));
    const isHorizontal = dir === 'l' || dir === 'r';
    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / stageRect.width) * 100;
      const dy = ((ev.clientY - startY) / stageRect.height) * 100;
      const delta = isHorizontal ? dx : dy;
      const newCells = applyResize(startCells, idx, dir, delta);
      setLayout((prev) => ({ ...prev, cells: newCells }));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    document.body.style.cursor = isHorizontal ? 'ew-resize' : 'ns-resize';
  };

  const updateCell = (idx: number, patch: Partial<CellState>) => {
    setCellStates((cs) => cs.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const updateCellFilter = (idx: number, patch: Partial<CellFilter>) => {
    setCellStates((cs) =>
      cs.map((c, i) => (i === idx ? { ...c, filter: { ...c.filter, ...patch } } : c))
    );
  };

  const setCellFilter = (idx: number, filter: CellFilter) => {
    setCellStates((cs) => cs.map((c, i) => (i === idx ? { ...c, filter } : c)));
  };

  const addCell = () => {
    setLayout((l) => ({
      ...l,
      cells: [...l.cells, { x: 35, y: 35, w: 30, h: 30 }],
    }));
    setCellStates((cs) => [...cs, { ...DEFAULT_CELL }]);
    setSelected(layout.cells.length);
  };

  const removeCell = (idx: number) => {
    setLayout((l) => ({ ...l, cells: l.cells.filter((_, i) => i !== idx) }));
    setCellStates((cs) => cs.filter((_, i) => i !== idx));
    setSelected(null);
  };

  const distributeRow = (idx: number) => {
    const me = layout.cells[idx];
    const rowIdxs = layout.cells
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => Math.abs(c.y - me.y) < 0.5 && Math.abs(c.h - me.h) < 0.5)
      .map(({ i }) => i)
      .sort((a, b) => layout.cells[a].x - layout.cells[b].x);
    if (rowIdxs.length < 2) return;
    const minX = Math.min(...rowIdxs.map((i) => layout.cells[i].x));
    const maxX = Math.max(...rowIdxs.map((i) => layout.cells[i].x + layout.cells[i].w));
    const eachW = (maxX - minX) / rowIdxs.length;
    setLayout((l) => {
      const cells = l.cells.slice();
      rowIdxs.forEach((i, k) => {
        cells[i] = { ...cells[i], x: minX + k * eachW, w: eachW };
      });
      return { ...l, cells };
    });
  };

  const distributeCol = (idx: number) => {
    const me = layout.cells[idx];
    const colIdxs = layout.cells
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => Math.abs(c.x - me.x) < 0.5 && Math.abs(c.w - me.w) < 0.5)
      .map(({ i }) => i)
      .sort((a, b) => layout.cells[a].y - layout.cells[b].y);
    if (colIdxs.length < 2) return;
    const minY = Math.min(...colIdxs.map((i) => layout.cells[i].y));
    const maxY = Math.max(...colIdxs.map((i) => layout.cells[i].y + layout.cells[i].h));
    const eachH = (maxY - minY) / colIdxs.length;
    setLayout((l) => {
      const cells = l.cells.slice();
      colIdxs.forEach((i, k) => {
        cells[i] = { ...cells[i], y: minY + k * eachH, h: eachH };
      });
      return { ...l, cells };
    });
  };

  const splitCell = (idx: number, dir: 'h' | 'v') => {
    setLayout((l) => {
      const cells = l.cells.slice();
      const c = cells[idx];
      const a = dir === 'h' ? { ...c, w: c.w / 2 } : { ...c, h: c.h / 2 };
      const b =
        dir === 'h'
          ? { ...c, x: c.x + c.w / 2, w: c.w / 2 }
          : { ...c, y: c.y + c.h / 2, h: c.h / 2 };
      cells[idx] = a;
      cells.splice(idx + 1, 0, b);
      return { ...l, cells };
    });
    setCellStates((cs) => {
      const next = cs.slice();
      next.splice(idx + 1, 0, { ...DEFAULT_CELL });
      return next;
    });
  };

  const clearCell = (idx: number) => {
    setCellStates((cs) => cs.map((c, i) => (i === idx ? { ...DEFAULT_CELL } : c)));
  };

  const dropFilesIntoCell = async (idx: number, files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;
    const loaded = await Promise.all(imgs.map(loadPhoto));
    setPhotos((prev) => [...prev, ...loaded]);
    setCellStates((cs) => {
      const next = cs.slice();
      next[idx] = { ...DEFAULT_CELL, photoId: loaded[0].id };
      let cursor = idx + 1;
      for (let i = 1; i < loaded.length && cursor < next.length; i++) {
        while (cursor < next.length && next[cursor].photoId) cursor++;
        if (cursor < next.length) {
          next[cursor] = { ...DEFAULT_CELL, photoId: loaded[i].id };
          cursor++;
        }
      }
      return next;
    });
    setSelected(idx);
  };

  const requestPhotoForCell = (idx: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : [];
      dropFilesIntoCell(idx, files);
    };
    input.click();
  };

  const photoMap = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);

  const snapTargets = useMemo(() => {
    const xs = new Set<number>([0, 50, 100]);
    const ys = new Set<number>([0, 50, 100]);
    layout.cells.forEach((c) => {
      xs.add(c.x);
      xs.add(c.x + c.w / 2);
      xs.add(c.x + c.w);
      ys.add(c.y);
      ys.add(c.y + c.h / 2);
      ys.add(c.y + c.h);
    });
    return { xs: Array.from(xs), ys: Array.from(ys) };
  }, [layout]);

  const addText = () => {
    const id = newId();
    const item: TextItem = {
      id,
      text: '雙擊編輯',
      x: 10,
      y: 10,
      fontFamily: FONT_FAMILIES[3].stack,
      fontSize: 64,
      fontWeight: 700,
      italic: false,
      color: '#ffffff',
      align: 'left',
      letterSpacing: 0,
      lineHeight: 1.2,
      rotation: 0,
      opacity: 1,
      stroke: null,
      shadow: { color: 'rgba(0,0,0,0.5)', x: 0, y: 4, blur: 10 },
      background: null,
    };
    setTexts((ts) => [...ts, item]);
    setSelectedTextId(id);
    setSelected(null);
  };

  const updateText = (id: string, patch: Partial<TextItem>) => {
    setTexts((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const removeText = (id: string) => {
    setTexts((ts) => ts.filter((t) => t.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
  };

  const bringTextToFront = (id: string) => {
    setTexts((ts) => {
      const idx = ts.findIndex((t) => t.id === id);
      if (idx < 0) return ts;
      const next = ts.slice();
      const [item] = next.splice(idx, 1);
      next.push(item);
      return next;
    });
  };

  const sendTextToBack = (id: string) => {
    setTexts((ts) => {
      const idx = ts.findIndex((t) => t.id === id);
      if (idx < 0) return ts;
      const next = ts.slice();
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedTextId &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        removeText(selectedTextId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTextId]);

  const exportPng = async () => {
    if (!stageRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await exportStageToPngDataUrl(
        stageRef.current,
        texts,
        config.width,
        config.height
      );
      const filename = `collage-${Date.now()}.png`;
      const isTauri = '__TAURI_INTERNALS__' in window;
      if (isTauri) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke<boolean>('save_png', { dataUrl, defaultName: filename });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
      }
    } catch (err) {
      console.error(err);
      alert('匯出失敗: ' + (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const onStageDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          拼貼相片
          <span className="brand-version">v{__APP_VERSION__}</span>
        </div>
        <div className="topbar-spacer" />
        <button
          className="btn btn-icon"
          onClick={undo}
          disabled={!canUndo}
          title="復原 (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          className="btn btn-icon"
          onClick={redo}
          disabled={!canRedo}
          title="重做 (Ctrl+Y)"
        >
          ↷
        </button>
        <button
          className="btn btn-primary"
          onClick={exportPng}
          disabled={exporting || (!cellStates.some((c) => c.photoId) && texts.length === 0)}
        >
          {exporting ? '匯出中…' : '⤓ 匯出 PNG'}
        </button>
      </header>

      <div className="main">
        <aside className="sidebar">
          <section className="panel">
            <div className="panel-head">
              <h3>版型</h3>
            </div>
            <LayoutPicker selectedId={layout.id} onSelect={selectLayout} />
            <div className="text-actions">
              <button className="btn" onClick={addCell}>＋ 加格子</button>
              <button
                className="btn btn-danger"
                onClick={() => selected != null && removeCell(selected)}
                disabled={selected == null}
              >
                － 刪選中
              </button>
            </div>
            <div className="text-actions">
              <button
                className="btn"
                onClick={() => selected != null && splitCell(selected, 'h')}
                disabled={selected == null}
                title="把選中格子切左右兩半"
              >
                ↔ 左右切
              </button>
              <button
                className="btn"
                onClick={() => selected != null && splitCell(selected, 'v')}
                disabled={selected == null}
                title="把選中格子切上下兩半"
              >
                ↕ 上下切
              </button>
            </div>
            <div className="text-actions">
              <button
                className="btn"
                onClick={() => selected != null && distributeRow(selected)}
                disabled={selected == null}
                title="把同一橫排的格子設成等寬"
              >
                ⇿ 平均橫排
              </button>
              <button
                className="btn"
                onClick={() => selected != null && distributeCol(selected)}
                disabled={selected == null}
                title="把同一直列的格子設成等高"
              >
                ⇕ 平均直列
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>效果</h3>
              {selected != null && cellStates[selected]?.photoId && (
                <span className="panel-tag">第 {selected + 1} 格</span>
              )}
            </div>
            <FilterPanel
              filter={
                selected != null && cellStates[selected]?.photoId
                  ? cellStates[selected].filter
                  : null
              }
              photo={
                selected != null && cellStates[selected]?.photoId
                  ? photoMap.get(cellStates[selected].photoId!) ?? null
                  : null
              }
              onChange={(patch) => selected != null && updateCellFilter(selected, patch)}
              onReset={() =>
                selected != null && setCellFilter(selected, { ...DEFAULT_FILTER })
              }
              onApplyPreset={(f) => selected != null && setCellFilter(selected, f)}
            />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>邊框 / 陰影</h3>
              {selected != null && <span className="panel-tag">第 {selected + 1} 格</span>}
            </div>
            <CellStylePanel
              state={selected != null ? cellStates[selected] ?? null : null}
              onChange={(patch) => selected != null && updateCell(selected, patch)}
            />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>文字</h3>
            </div>
            <TextPanel
              items={texts}
              selectedId={selectedTextId}
              onAdd={addText}
              onSelect={(id) => {
                setSelectedTextId(id);
                setSelected(null);
              }}
              onChange={updateText}
              onRemove={removeText}
              onBringToFront={bringTextToFront}
              onSendToBack={sendTextToBack}
            />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>畫布</h3>
              <span className="panel-tag">
                {config.width} × {config.height} px
              </span>
            </div>
            <div className="form-row">
              <label>比例</label>
              <div className="aspect-row">
                {ASPECT_RATIOS.map((r) => {
                  const active =
                    Math.abs(config.width / config.height - r.w / r.h) < 0.001;
                  return (
                    <button
                      key={r.id}
                      className={`chip ${active ? 'is-active' : ''}`}
                      onClick={() =>
                        setConfig((c) => {
                          const max = Math.max(c.width, c.height);
                          return r.w >= r.h
                            ? { ...c, width: max, height: Math.round((max * r.h) / r.w) }
                            : { ...c, height: max, width: Math.round((max * r.w) / r.h) };
                        })
                      }
                    >
                      {r.id}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="form-row">
              <label>寬</label>
              <SizeInput
                value={config.width}
                min={64}
                max={8000}
                onCommit={(v) => setConfig((c) => ({ ...c, width: v }))}
              />
              <span className="form-val">px</span>
            </div>
            <div className="form-row">
              <label>高</label>
              <SizeInput
                value={config.height}
                min={64}
                max={8000}
                onCommit={(v) => setConfig((c) => ({ ...c, height: v }))}
              />
              <span className="form-val">px</span>
            </div>
            <div className="form-row">
              <label>對調</label>
              <button
                className="btn"
                onClick={() =>
                  setConfig((c) => ({ ...c, width: c.height, height: c.width }))
                }
                style={{ gridColumn: '2 / -1' }}
              >
                ⇆ 寬高互換
              </button>
            </div>
            <div className="form-row">
              <label>間距</label>
              <input
                type="range"
                min={0}
                max={40}
                value={config.gap}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, gap: parseInt(e.target.value) }))
                }
              />
              <span className="form-val">{config.gap}px</span>
            </div>
            <div className="form-row">
              <label>圓角</label>
              <input
                type="range"
                min={0}
                max={40}
                value={config.radius}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, radius: parseInt(e.target.value) }))
                }
              />
              <span className="form-val">{config.radius}px</span>
            </div>
            <div className="form-row">
              <label>背景</label>
              <input
                type="color"
                value={config.bg}
                onChange={(e) => setConfig((c) => ({ ...c, bg: e.target.value }))}
              />
              <div className="bg-presets">
                {['#ffffff', '#0f0f10', '#f4f1ea', '#ffd9e6', '#cfe9ff'].map((c) => (
                  <button
                    key={c}
                    className="bg-swatch"
                    style={{ background: c }}
                    onClick={() => setConfig((cfg) => ({ ...cfg, bg: c }))}
                  />
                ))}
              </div>
            </div>
          </section>

          <p className="hint">
            提示 · 點選格子,拖曳平移、滾輪縮放。空格按 + 加入照片。
            拖曳格子邊緣可調整版面比例。
          </p>
        </aside>

        <main
          className="stage-area"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onStageDrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelected(null);
              setSelectedTextId(null);
            }
          }}
        >
          {photos.length === 0 && texts.length === 0 ? (
            <Dropzone onFiles={addPhotosAndFill} />
          ) : (
            <div
              className="stage-wrap"
              style={
                {
                  aspectRatio: `${config.width} / ${config.height}`,
                  '--aspect-w': config.width,
                  '--aspect-h': config.height,
                } as React.CSSProperties
              }
            >
              <div
                ref={stageRef}
                className="stage"
                style={{ background: config.bg, padding: config.gap / 2 }}
              >
                {layout.cells.map((cell, i) => {
                  const cs = cellStates[i] ?? { ...DEFAULT_CELL };
                  const photo = cs.photoId ? photoMap.get(cs.photoId) ?? null : null;
                  return (
                    <PhotoCell
                      key={`${layout.id}-${i}`}
                      cell={cell}
                      state={cs}
                      photo={photo}
                      selected={selected === i}
                      radius={config.radius}
                      gap={config.gap}
                      onSelect={() => {
                        setSelected(i);
                        setSelectedTextId(null);
                      }}
                      onChange={(patch) => updateCell(i, patch)}
                      onClear={() => clearCell(i)}
                      onAddPhoto={() => requestPhotoForCell(i)}
                      onResizeStart={(dir, e) => startResize(i, dir, e)}
                      onMoveStart={(e) => startCellMove(i, e)}
                      onDropFiles={(files) => dropFilesIntoCell(i, files)}
                    />
                  );
                })}
                {texts.map((t) => (
                  <TextLayer
                    key={t.id}
                    item={t}
                    selected={selectedTextId === t.id}
                    stageRef={stageRef}
                    snapTargets={snapTargets}
                    onSelect={() => {
                      setSelectedTextId(t.id);
                      setSelected(null);
                    }}
                    onChange={(patch) => updateText(t.id, patch)}
                    onSnapChange={setSnapGuides}
                  />
                ))}
                {snapGuides.x !== null && (
                  <div className="snap-guide snap-guide-v" style={{ left: `${snapGuides.x}%` }} />
                )}
                {snapGuides.y !== null && (
                  <div className="snap-guide snap-guide-h" style={{ top: `${snapGuides.y}%` }} />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
