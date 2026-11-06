"use client";

import { useEffect, useRef, useState } from "react";

export function ReelStage({
  title,
  poster,
  video,
  active,
  reduced,
}: {
  title: string;
  poster: string;
  video: string | null;
  active: boolean;
  reduced: boolean | null;
}) {
  const src = video;
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [manual, setManual] = useState(false);
  const [muted, setMuted] = useState(true);
  const [hidden, setHidden] = useState(false);
  const nodeRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    if (!active || hidden || !(reduced === false || manual)) {
      node.pause();
      return;
    }
    playMuted(node, muted);
  }, [active, hidden, manual, muted, reduced, src]);

  function togglePlay() {
    const node = nodeRef.current;
    if (!node) return;
    if (node.paused) {
      setManual(true);
      playMuted(node, muted);
    } else {
      setManual(false);
      node.pause();
    }
  }

  const showVideo = Boolean(active && src && !failed);
  const illustration = `${title}. Illustration, not a photograph of stock.`;

  return (
    <div className="stage">
      <img src={poster} alt={playing ? "" : illustration} />
      {showVideo ? (
        <video
          ref={nodeRef}
          src={src ?? undefined}
          poster={poster}
          muted={muted}
          playsInline
          loop
          preload="none"
          aria-label={`${title}. Silent illustration, not product footage.`}
          className={playing ? "is-playing" : undefined}
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setFailed(true)}
        >
          <track kind="descriptions" srcLang="en" label="English description" src="/media/silent-demo.vtt" default />
        </video>
      ) : null}
      <p className="stage-chip demo-pill">{src ? "Clip" : "Illustration"}</p>
      <div className="stage-controls">
        {showVideo ? (
          <>
            <button type="button" className="icon-btn" onClick={togglePlay} aria-pressed={playing}>
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setMuted((value) => !value)}
              aria-pressed={!muted}
            >
              {muted ? "Unmute" : "Mute"}
            </button>
          </>
        ) : (
          <p className="demo-pill">Illustration</p>
        )}
      </div>
    </div>
  );
}

function playMuted(node: HTMLVideoElement, muted: boolean) {
  const element: HTMLVideoElement = node;
  element.muted = muted;
  const pending = element.play();
  if (pending) pending.catch(() => undefined);
}
