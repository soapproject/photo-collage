# 設計：照片在 scale=1 時可沿長邊平移

日期：2026-06-18
狀態：已核准（待寫實作計畫）

## 問題

目前照片必須先 zoom in（scale > 1）才能在格子內拖曳移動。但使用者觀察到很多原圖都比框大，預期應該能在不放大的情況下直接平移。

### 根因

`<img>` 使用 `object-fit: cover`（`styles.css` `.cell-img`），且元素尺寸是「格子大小 × scale」（`PhotoCell.tsx` 的 `width/height: 100×scale %`）。

- scale=1 時，元素剛好等於格子大小。`object-fit: cover` 把原圖縮放到填滿框、**置中裁切**，超出部分被裁掉、藏在元素內部。
- 拖曳改的是 `offsetX/offsetY`，那是移動**整個 `<img>` 元素**。scale=1 時元素＝格子，移動它只會露出格子空白，露不出被 cover 裁掉的內容。
- 因此 `clampOffsets` 在 scale=1 時把可移動範圍鎖死為 0：`limit = ((scale - 1) / 2) * 100`。

匯出邏輯（`exportCanvas.ts`）也寫死置中裁切（`sx = (nw - sw) / 2`），所以任何修正都必須讓預覽與匯出一致。

## 目標行為（已與使用者確認）

**cover 填滿 ＋ 可沿長邊平移。**

- 照片永遠填滿整個框（不留白）。
- 當原圖比例與框不同時，可沿「溢出的那一軸」拖曳，選擇要露出哪一段。
- 放大（scale > 1）後，兩軸都能平移。
- 拖到底永遠不會露出未覆蓋的空白。

## 方案

採用 **方案 A**：把 `<img>` 元素依原圖比例「cover 尺寸化」，平移＝移動元素（沿用現有「移動元素」模型，只是一般化）。

### 為什麼是 A（而非 B/C）

- **方案 B（`object-position` 平移裁切）**：縮放仍需元素放大，導致兩種平移機制並存互相干擾；且 `exportCanvas.ts` 的置中裁切數學要重寫。侵入大、出錯面大。
- **方案 C（只放寬 clamp）**：無效。scale=1 時移動「格子大小的元素」只會露出格子空白，露不出被裁掉的內容——這正是現在鎖死的原因。

### 核心想法

scale=1 時不再把元素強制成格子大小，而是設成 cover 後的實際尺寸：短邊＝格子、長邊依比例溢出。整張圖顯示在這個（溢出的）元素內，`offset=0` 時畫面與現在完全相同（一樣置中裁切）。`clampOffsets` 自然一般化；現在的 `(scale−1)/2×100` 正是「正方形特例」。

## 改動範圍

### 1. `src/components/PhotoCell.tsx`

- 新增 prop：`canvasW: number`、`canvasH: number`（畫布像素長寬，用於求格子像素比例）。
- 計算：
  - `cellRatio = (cell.w / cell.h) * (canvasW / canvasH)`
  - `imgRatio = photo.naturalWidth / photo.naturalHeight`
- 元素尺寸（% of cell），令短邊維持 `100×scale`（cover），長邊溢出：
  - 若 `imgRatio >= cellRatio`（橫向溢出）：
    - `heightPct = 100 * scale`
    - `widthPct = 100 * scale * (imgRatio / cellRatio)`
  - 否則（縱向溢出）：
    - `widthPct = 100 * scale`
    - `heightPct = 100 * scale * (cellRatio / imgRatio)`
  - 套用到 `<img>` 的 `style.width = ${widthPct}%`、`style.height = ${heightPct}%`。
- `clampOffsets` 改為以 `widthPct/heightPct` 計算每軸上限：
  - `limitX = (widthPct - 100) / 2`
  - `limitY = (heightPct - 100) / 2`
  - `x ∈ [-limitX, limitX]`、`y ∈ [-limitY, limitY]`
  - 需把 `widthPct/heightPct`（或可重算的輸入）提供給 wheel、滑桿、拖曳三處呼叫點，確保一致。
  - 既有簽章 `clampOffsets(scale, x, y)` 改為接受目前的 `widthPct/heightPct`（或在元件內以同一份計算共用），三處呼叫一併更新。
- `photo` 為 null 時維持現狀（無圖、不可拖）。

### 2. `src/App.tsx`

- 在 `<PhotoCell>` 傳入 `canvasW={config.width}`、`canvasH={config.height}`。

### 3. `src/exportCanvas.ts`

- **不變更。** 它讀 `img.getBoundingClientRect()` ＋置中 cover 裁切；當元素比例＝原圖比例時，裁切退化為「整張圖畫進元素框、再被格子路徑 clip」，已自動與預覽一致。需在驗證階段確認。

### 4. `src/styles.css`

- `.cell-img` 維持 `object-fit: cover`（比例相符時等同無裁切，留著作為保險，處理四捨五入誤差）。

## 邊界情況

- **原圖比例 ≈ 格子比例**：兩軸幾乎無溢出，scale=1 幾乎不能拖（正確，本就剛好填滿）。
- **旋轉 90°/270°**：維持現有近似行為，clamp 以未旋轉座標計算；旋轉後軸交換不在本次範圍。
- **向後相容**：既有專案在 scale=1 時 `offsetX/Y` 多為 0，畫面不變；本變更為純加值（新增可拖能力）。

## 驗證

1. 跑 dev server。
2. 放一張比例與格子不同的照片：
   - scale=1 應能沿長軸拖、短軸不動（拖到底不露白）。
   - 放大後兩軸皆可拖。
3. 匯出 PNG，比對與預覽一致（特別是有 offset 的格子）。
4. 既有專案載入後畫面不變。
