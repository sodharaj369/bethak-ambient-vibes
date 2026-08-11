import { useEffect, useRef } from "react";
import type { MusicTrack } from "@/data/playlist";

type Props = {
  tracks: MusicTrack[];
  currentIndex: number;
  shuffle: boolean;
  repeat: boolean;
  onSelect: (index: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onClose: () => void;
};

export function PlaylistPanel({
  tracks,
  currentIndex,
  shuffle,
  repeat,
  onSelect,
  onToggleShuffle,
  onToggleRepeat,
  onClose,
  children,
}: Props & { children?: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="panel-overlay" onPointerDown={onClose}>
      <div
        ref={panelRef}
        className="playlist-panel"
        role="dialog"
        aria-label="बैठक की ग़ज़लें"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="panel-head">
          <p className="panel-title">बैठक की ग़ज़लें · {tracks.length}</p>
          <button type="button" className="ctl" aria-label="Close playlist" onClick={onClose}>
            {children}
          </button>
        </div>

        <div className="panel-modes">
          <button
            type="button"
            className={`mode-btn${shuffle ? " mode-on" : ""}`}
            aria-label="Shuffle"
            aria-pressed={shuffle}
            onClick={onToggleShuffle}
          >
            Shuffle
          </button>
          <button
            type="button"
            className={`mode-btn${repeat ? " mode-on" : ""}`}
            aria-label="Repeat playlist"
            aria-pressed={repeat}
            onClick={onToggleRepeat}
          >
            Repeat
          </button>
        </div>

        <ul className="panel-list">
          {tracks.map((t, i) => (
            <li key={t.id}>
              <button
                type="button"
                className={`panel-item${i === currentIndex ? " panel-item-active" : ""}`}
                aria-current={i === currentIndex}
                onClick={() => onSelect(i)}
              >
                <span className="panel-note" aria-hidden="true">
                  ♫
                </span>
                <span className="panel-text">
                  <span className="panel-song">{t.title}</span>
                  <span className="panel-artist">{t.artist}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
