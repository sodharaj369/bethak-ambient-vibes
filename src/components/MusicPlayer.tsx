import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getYouTubeEngine, type PlayerState } from "@/services/musicEngine";
import { bethakPlaylist, type MusicTrack } from "@/data/playlist";
import type { MoodId } from "@/data/scenes";
import { getAmbienceEngine } from "@/services/ambienceEngine";
import { stopChaiSound } from "@/services/chaiSound";
import { stopHarmoniumNotes } from "@/services/harmoniumSound";
import { PlaylistPanel } from "@/components/PlaylistPanel";
import { isFresh, readSession, writeSession } from "@/lib/bethakSession";

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M7 5h2v14H7zM20 5v14L9.5 12z" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M15 5h2v14h-2zM4 5v14l10.5-7z" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15L20 12z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" />
    </svg>
  );
}
function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 opacity-50" fill="currentColor" aria-hidden="true">
      <path d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M3 6h12v2H3zM3 11h12v2H3zM3 16h8v2H3zM17 10v7.2a2.6 2.6 0 1 0 1.6 2.4V13h2.4v-3z" />
    </svg>
  );
}


const YT_HOST_ID = "bethak-yt-host";

function Artwork({
  trackId,
  candidates,
  title,
}: {
  trackId: string;
  candidates: string[];
  title: string;
}) {
  const [fallback, setFallback] = useState({ trackId, index: 0 });
  const index = fallback.trackId === trackId ? fallback.index : 0;
  const src = candidates[index];
  if (!src) return <NoteIcon />;
  return (
    <img
      src={src}
      alt={`Artwork for ${title}`}
      className="h-full w-full object-cover"
      width={512}
      height={512}
      onError={() =>
        setFallback((current) => ({
          trackId,
          index: current.trackId === trackId ? current.index + 1 : 1,
        }))
      }
    />
  );
}

export function MusicPlayer({
  autoStart = false,
  mood,
  tracks,
}: {
  autoStart?: boolean;
  /** The bethak currently in the room — drives the ambience layer. */
  mood: MoodId;
  /** Curated songs of the current sitting. */
  tracks: MusicTrack[];
}) {
  const engine = useMemo(() => getYouTubeEngine(YT_HOST_ID, tracks.length ? tracks : bethakPlaylist), []);
  const ambience = useMemo(() => getAmbienceEngine(), []);
  const [state, setState] = useState<PlayerState>(() => engine.getState());
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Silently pick the sitting back up: same song, roughly the same place.
  // The saved mood is only restored after hydration, so the remembered song
  // may belong to a session that arrives a tick later — keep looking until it
  // is found once, and never once the visitor is already inside the room.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || autoStart) return;
    const session = readSession();
    if (!isFresh(session) || !session?.trackId) {
      restored.current = true;
      return;
    }
    const index = tracks.findIndex((t) => t.id === session.trackId);
    if (index < 0) return;
    restored.current = true;
    engine.restoreSession(index, session.position ?? 0);
  }, [engine, tracks, autoStart]);

  // Mood change swaps the curated session underneath, without restarting a
  // song that also belongs to the new sitting.
  useEffect(() => {
    if (tracks.length) engine.setTracks(tracks);
  }, [engine, tracks]);

  // The room's own sound follows the mood, always crossfaded.
  useEffect(() => {
    ambience.setMood(mood);
  }, [ambience, mood]);

  // Leaving the room, or simply leaving the tab: everything in the bethak goes
  // quiet at once — ghazal, room sound, chai, harmonium. Coming back the
  // visitor finds the room exactly as silent as they left it; only their own
  // gesture starts it again.
  useEffect(() => {
    const silence = () => {
      engine.suspend();
      ambience.suspend();
      stopChaiSound();
      stopHarmoniumNotes();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") silence();
    };
    const onPageHide = () => {
      silence();
      engine.leave();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      // Restored from the back/forward cache: the controls work again, but
      // nothing sounds until the visitor asks.
      if (e.persisted && autoStart) engine.markEntered();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", silence);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", silence);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [ambience, engine, autoStart]);



  // Remember where we are, without ever interrupting playback.
  useEffect(() => {
    const save = () => {
      const s = engine.getState();
      writeSession({ trackId: s.track.id, index: s.index, position: s.position });
    };
    const id = window.setInterval(save, 7000);
    window.addEventListener("pagehide", save);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("pagehide", save);
    };
  }, [engine]);

  // Entering the room is a real user gesture: start the music from it.
  useEffect(() => {
    if (!autoStart) {
      // Landing state: the engine may be warm, but it must stay silent.
      engine.leave();
      ambience.stop();
      return;
    }
    // Only this gesture unlocks sound.
    engine.markEntered();
    // Music arrives a beat after the room starts opening, rising from silence.
    const id = window.setTimeout(() => void engine.fadeIn(700), 400);
    // Same gesture initialises the ambient room sound.
    ambience.start(mood);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, engine, ambience]);

  useEffect(() => {
    const unsub = engine.subscribe(setState);
    // Only unsubscribe here: the engine owns the YouTube player for the page
    // lifetime, so a dev-mode remount must not tear the real player down.
    return unsub;
  }, [engine]);

  const pct = state.duration ? Math.min(100, (state.position / state.duration) * 100) : 0;

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = barRef.current;
      const duration = engine.getDuration();
      if (!el || !duration) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      engine.seek(ratio * duration);
    },
    [engine],
  );

  // Pointer events cover mouse, touch and pen — click and drag both work.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (draggingRef.current) seekFromClientX(e.clientX);
    };
    const up = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [seekFromClientX]);

  return (
    <div className="player-shell">
      {/* Official YouTube IFrame Player API host — the real playback engine. */}
      <div className="yt-host" aria-hidden="true">
        <div id={YT_HOST_ID} />
      </div>
      <div className="player" role="group" aria-label="Bethak music player">
        <div className="artwork">
          <Artwork
            trackId={state.track.id}
            candidates={state.track.artworkCandidates}
            title={state.track.title}
          />
        </div>

        <div key={state.track.id} className="track-meta">
          <p className="track-title">{state.track.title}</p>
          <p className="track-artist">{state.track.artist}</p>
          <div
            ref={barRef}
            className="progress"
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-label="Seek within track"
            onPointerDown={(e) => {
              draggingRef.current = true;
              seekFromClientX(e.clientX);
            }}
            onKeyDown={(e) => {
              const d = engine.getDuration();
              if (!d) return;
              if (e.key === "ArrowRight") engine.seek(engine.getCurrentTime() + 5);
              if (e.key === "ArrowLeft") engine.seek(engine.getCurrentTime() - 5);
            }}
          >
            <span style={{ width: `${pct}%` }} />
          </div>

          <div className="player-row">
            <span className="track-times">
              {fmt(state.position)} / {fmt(state.duration)}
            </span>
            <div className="controls">
              <button type="button" className="ctl" aria-label="Previous track" onClick={() => engine.previous()}>
                <PrevIcon />
              </button>
              <button
                type="button"
                className={`ctl ctl-main ${state.isPlaying ? "ctl-breathing" : ""}`}
                aria-label={state.isPlaying ? "Pause" : "Play"}
                title={state.canPlay ? undefined : "Connecting to YouTube player…"}
                aria-disabled={!state.canPlay}
                onClick={() => {
                  if (state.isPlaying) {
                    engine.pause();
                    ambience.suspend();
                    return;
                  }
                  // Explicit gesture: the room may breathe again.
                  ambience.start(mood);
                  void engine.play();
                }}
              >
                {state.isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button type="button" className="ctl" aria-label="Next track" onClick={() => engine.next()}>
                <NextIcon />
              </button>
              <button
                type="button"
                className="ctl"
                aria-label="Open playlist"
                aria-expanded={open}
                onClick={() => setOpen(true)}
              >
                <ListIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <PlaylistPanel
          tracks={tracks}
          currentIndex={state.index}
          shuffle={state.shuffle}
          repeatMode={state.repeatMode}
          onSelect={(i) => {
            engine.playAt(i);
            setOpen(false);
          }}
          onToggleShuffle={() => engine.setShuffle(!state.shuffle)}
          onCycleRepeat={() => engine.cycleRepeat()}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

