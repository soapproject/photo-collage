import { useCallback, useRef, useState } from 'react';

type Props = {
  onFiles: (files: File[]) => void;
  compact?: boolean;
};

export function Dropzone({ onFiles, compact }: Props) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  return (
    <div
      className={`dropzone ${compact ? 'dropzone-compact' : ''} ${hover ? 'is-hover' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {compact ? (
        <span>+ 加入照片</span>
      ) : (
        <>
          <div className="dropzone-icon">⬇</div>
          <div className="dropzone-title">將照片拖入這裡</div>
          <div className="dropzone-sub">或點擊瀏覽 · 支援多檔</div>
        </>
      )}
    </div>
  );
}
