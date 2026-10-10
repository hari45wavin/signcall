"use client";

import { useEffect, useRef, useCallback } from "react";

interface VideoStreamTileProps {
  stream: MediaStream | null;
  className?: string;
  mirror?: boolean;
  onVideoElementChange?: (el: HTMLVideoElement | null) => void;
}

/**
 * Robust video renderer that automatically attaches a MediaStream whenever
 * the element mounts or remounts (e.g. switching between Spotlight and Grid view).
 */
export function VideoStreamTile({
  stream,
  className,
  mirror = false,
  onVideoElementChange,
}: VideoStreamTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const attachStream = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (onVideoElementChange) onVideoElementChange(node);
    if (node && stream) {
      if (node.srcObject !== stream) {
        node.srcObject = stream;
      }
      node.play().catch(() => {});
    }
  }, [stream, onVideoElementChange]);

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }
      el.play().catch(() => {});
    } else if (el && !stream) {
      el.srcObject = null;
    }
  }, [stream]);

  const mirrorClass = mirror ? "sc-mirrored" : "sc-unmirrored";
  const defaultClasses = `w-full h-full object-cover ${mirrorClass}`;

  return (
    <video
      ref={attachStream}
      autoPlay
      playsInline
      muted
      className={className ? `${className} ${mirrorClass}` : defaultClasses}
    />
  );
}
