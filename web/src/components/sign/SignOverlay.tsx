"use client";

import { useEffect, useRef } from "react";
import type { Hand } from "@/lib/features";
import type { EdgeState } from "@/hooks/useSignRecognition";
import { HandSignIcon } from "@/components/common/Icons";

interface SignOverlayProps {
  hands: Hand[];
  mirrored?: boolean;
  currentSign: { label: string; confidence: number } | null;
  wordInProgress: string;
  edgeState: EdgeState;
  onUndo: () => void;
  onClear: () => void;
  onSpace: () => void;
  onOpenCheatSheet: () => void;
  onTypeInstead?: () => void;
}

// MediaPipe 21 Hand Landmark Connections
const CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17],
];

export function SignOverlay({
  hands,
  mirrored = false,
  currentSign,
  wordInProgress,
  edgeState,
  onUndo,
  onClear,
  onSpace,
  onOpenCheatSheet,
  onTypeInstead,
}: SignOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw hand landmarks on canvas with exact aspect-fit and mirror transformation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to parent bounding rect with devicePixelRatio for crisp rendering
    const parent = canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const w = parent ? parent.getBoundingClientRect().width : canvas.width;
    const h = parent ? parent.getBoundingClientRect().height : canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (hands.length === 0) return;

    // Detect video sibling to compute object-fit: cover offset and scale
    let renderWidth = w;
    let renderHeight = h;
    let offsetX = 0;
    let offsetY = 0;

    const videoEl = parent?.querySelector("video");
    if (videoEl && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      const videoRatio = videoEl.videoWidth / videoEl.videoHeight;
      const containerRatio = w / h;
      if (containerRatio > videoRatio) {
        // Container is wider -> scaled by width, cropped top & bottom
        renderHeight = w / videoRatio;
        offsetY = (h - renderHeight) / 2;
      } else {
        // Container is taller -> scaled by height, cropped left & right
        renderWidth = h * videoRatio;
        offsetX = (w - renderWidth) / 2;
      }
    }

    // Helper to map normalized [x, y] to screen coordinates matching camera orientation
    const mapPoint = (normPt: number[]): [number, number] => {
      const px = normPt[0] ?? 0;
      const py = normPt[1] ?? 0;
      // Invert x if mirrored (selfie mode) so the skeleton matches the flipped camera video
      const nx = mirrored ? 1 - px : px;
      const screenX = offsetX + nx * renderWidth;
      const screenY = offsetY + py * renderHeight;
      return [screenX, screenY];
    };

    // Draw each detected hand
    hands.forEach((hand) => {
      const isLeft = hand.handedness === "Left";
      // Google Meet inspired vibrant tracking colors: Cyan/Blue & Emerald
      const jointColor = isLeft ? "#38bdf8" : "#34d399";
      const boneColor = isLeft ? "rgba(56, 189, 248, 0.75)" : "rgba(52, 211, 153, 0.75)";

      // Draw skeleton connections
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = boneColor;
      ctx.lineCap = "round";

      CONNECTIONS.forEach(([p1, p2]) => {
        const pt1 = hand.landmarks[p1];
        const pt2 = hand.landmarks[p2];
        if (pt1 && pt2) {
          const [x1, y1] = mapPoint(pt1);
          const [x2, y2] = mapPoint(pt2);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });

      // Draw keypoints
      hand.landmarks.forEach((pt, i) => {
        const [x, y] = mapPoint(pt);

        ctx.beginPath();
        // Fingertips (4, 8, 12, 16, 20) are slightly larger
        const radius = [4, 8, 12, 16, 20].includes(i) ? 6 : 4;
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = jointColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();
      });
    });
  }, [hands, mirrored]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none">
      {/* Hand landmarks skeleton canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Centered Top HUD: Word Builder, Signs Guide & Edge States (Zero collision with corner chips) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto max-w-[90%] flex-wrap justify-center z-20">
        {edgeState === "loading" && (
          <span className="inline-flex items-center gap-1.5 h-7.5 px-3 rounded-full bg-amber-500/90 text-white text-xs font-semibold backdrop-blur-md shadow-md animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            Loading Landmarker...
          </span>
        )}

        {edgeState === "no_hands" && !wordInProgress && (
          <span className="inline-flex items-center gap-1.5 h-7.5 px-3.5 rounded-full bg-black/65 text-gray-200 text-xs font-medium backdrop-blur-md border border-white/10 shadow-md">
            Raise hands in camera frame
          </span>
        )}

        {wordInProgress && (
          <div className="bg-black/75 backdrop-blur-md text-white px-3.5 py-1 rounded-full text-xs flex items-center gap-2 border border-white/15 shadow-md">
            <span className="text-gray-400 font-medium">Word:</span>
            <span className="font-mono font-bold text-amber-300 text-sm tracking-wide">{wordInProgress}</span>
            <button
              type="button"
              onClick={onSpace}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white text-xs font-semibold cursor-pointer"
              title="Add Space"
            >
              ␣ space
            </button>
            <button
              type="button"
              onClick={onUndo}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-red-300 hover:text-red-200 text-xs font-semibold cursor-pointer"
              title="Undo letter"
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={onClear}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-red-300 hover:text-red-200 text-xs font-semibold cursor-pointer"
              title="Clear"
            >
              ✕
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenCheatSheet}
          className="h-7.5 px-3 rounded-full bg-white/90 hover:bg-white text-[#111827] text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md"
        >
          <HandSignIcon className="w-3.5 h-3.5 text-[#2F62E8]" />
          <span>Signs Guide</span>
        </button>
      </div>

      {/* Floating Sign Confidence Badge if recognized: Centered above stage bottom */}
      {currentSign && currentSign.label !== "nothing" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto bg-black/80 text-white backdrop-blur-md px-4 py-1.5 rounded-full shadow-xl flex items-center gap-2.5 border border-white/20 animate-in fade-in duration-150 z-20">
          <span className="text-lg font-black font-mono text-amber-300 tracking-wider">
            {currentSign.label.toUpperCase()}
          </span>
          <span className="text-xs text-gray-300 font-medium bg-white/10 px-2 py-0.5 rounded-full">
            {Math.round(currentSign.confidence * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
