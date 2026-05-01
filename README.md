# 拼貼相片 · Photo Collage

> 原生 Windows 桌面拼貼相片工具 — Tauri 2 + React 19 + TypeScript

把多張照片拖進來,挑版型、調濾鏡、加文字,匯出指定解析度的 PNG。完全離線,所有運算在本機。

---

## ✨ 功能

### 照片
- 多檔拖拉匯入(從檔案總管直接拖到任一格)
- 每格獨立 **平移 / 縮放 / 裁切**(滑鼠拖曳 + 滾輪 + 滑桿)
- 90° 旋轉、水平 / 垂直翻轉
- 每格獨立 **邊框 + 陰影**(顏色 / 寬度 / 偏移 / 模糊)
- 7 個 **濾鏡微調**(亮度、對比、飽和度、色相、模糊、復古、灰階) + 8 個一鍵預設(原圖 / 黑白 / 復古 / 冷暖 / 高對比 / 柔和 / 褪色)

### 版型
- **17 種預設版型**:Single / Duo / Triptych / Grid (2×2~3×3) / Big-Left+2 / Magazine / Pinwheel 等
- **自由版型編輯**:加格子、刪格子、拖曳格子邊界調整比例、整格自由移動
- 拖曳邊界時自動 snap 到對齊輔助線(畫布中心 / 邊緣 / 其他格邊緣)

### 文字
- 多文字圖層,雙擊原地編輯
- 12 種 Win11 字型(微軟正黑體、新細明體、標楷體、Segoe、Impact 等)
- 完整樣式:大小、粗細、斜體、顏色、對齊、字距、行高、旋轉、透明度
- 外框、陰影、底色條
- 移至前 / 後、Delete 刪除

### 畫布
- 7 種比例(1:1 / 4:3 / 3:4 / 16:9 / 9:16 / 3:2 / 2:3)
- 自訂寬高(64 ~ 8000 px)、寬高互換
- 即時尺寸顯示
- 圓角 / 間距 / 背景色

### 工作流
- **Undo / Redo**(Ctrl+Z / Ctrl+Y),100 步歷史,連續操作自動合併
- **PNG 匯出** — 走 Tauri 存檔對話框,直接照畫布尺寸輸出

---

## 🚀 快速開始

### 環境需求
- **Node** 24+
- **Rust** 1.95+(`winget install Rustlang.Rustup`)
- **Visual Studio Build Tools 2022** + Desktop development with C++ workload
- Windows 10/11(WebView2 內建)

### 開發
```powershell
npm install
npm run tauri:dev
```

第一次 `tauri:dev` 會編 ~389 個 Rust crate,大約 5–10 分鐘;之後增量很快。

### 打包成安裝檔
```powershell
npm run tauri:build
```

輸出在 `src-tauri/target/release/bundle/`:
- `msi/` — Windows MSI 安裝檔
- `nsis/` — NSIS .exe 安裝檔

---

## 🛠 技術棧

| 層 | 工具 |
|---|---|
| Desktop 殼 | Tauri 2(Rust) |
| 前端 | React 19 + TypeScript + Vite 8 |
| 匯出 | Canvas 2D API(自寫 exporter,不依賴 html-to-image) |
| 檔案存取 | tauri-plugin-dialog + 自訂 Rust 命令(base64 解碼 + std::fs::write) |
| 圖示 | @resvg/resvg-js 渲 SVG → tauri icon 生整套 |

---

## 📁 專案結構

```
photo-collage/
├─ src/                          React 前端
│  ├─ App.tsx                    主 shell + 狀態 + history
│  ├─ types.ts                   型別、字型、比例、濾鏡預設
│  ├─ layouts.ts                 17 種預設版型
│  ├─ resize.ts                  邊界 / 自由 resize 演算法
│  ├─ exportCanvas.ts            Canvas 匯出器(照片 / 變形 / 文字)
│  └─ components/
│     ├─ PhotoCell.tsx           單格 pan/zoom/crop/旋轉/翻轉/resize
│     ├─ LayoutPicker.tsx        版型 thumbnails
│     ├─ FilterPanel.tsx         濾鏡(預設 + 滑桿)
│     ├─ CellStylePanel.tsx      邊框 + 陰影
│     ├─ TextLayer.tsx           文字圖層(拖曳 + 編輯)
│     ├─ TextPanel.tsx           文字編輯器
│     └─ Dropzone.tsx            初始拖拉區
├─ src-tauri/                    Rust + Tauri 設定
│  ├─ Cargo.toml
│  ├─ tauri.conf.json
│  ├─ icons/                     Windows / macOS / iOS / Android 整套
│  └─ src/
│     ├─ main.rs
│     └─ lib.rs                  save_png 命令
└─ public/favicon.svg            Tab icon (master,也是 Tauri icon 的源檔)
```

---

## 🎨 自訂 icon

要換 icon 編輯 `public/favicon.svg`,然後跑:

```powershell
node -e "const fs=require('fs');const{Resvg}=require('@resvg/resvg-js');const svg=fs.readFileSync('public/favicon.svg');fs.writeFileSync('icon-1024.png',new Resvg(svg,{fitTo:{mode:'width',value:1024}}).render().asPng())"
npx @tauri-apps/cli icon icon-1024.png
rm icon-1024.png
```

之後 `npm run tauri:dev`(可能要 touch 一下 `src-tauri/build.rs` 強制 rebuild)。

---

## 📜 License

MIT
