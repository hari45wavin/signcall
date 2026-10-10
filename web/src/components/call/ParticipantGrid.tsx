"use client";

import type { ParticipantInfo } from "./SpeakerStage";
import { MicIcon, MicOffIcon, HandSignIcon, PinIcon } from "@/components/common/Icons";
import { VideoStreamTile } from "@/components/common/VideoStreamTile";
import { VideoTrack, isTrackReference } from "@livekit/components-react";

interface ParticipantGridProps {
  participants: ParticipantInfo[];
  localStream?: MediaStream | null;
  isCameraOn?: boolean;
  mirrorVideo?: boolean;
  captionsOn?: boolean;
  readAloud?: boolean;
  captionText?: string;
  pendingCaptionText?: string;
  captionFontSize?: number;
  activeSpeakerName?: string;
  theme?: "light" | "dark";
  onSelectSpeaker: (p: ParticipantInfo) => void;
  onTogglePin: (p: ParticipantInfo) => void;
}

export function ParticipantGrid({
  participants,
  localStream,
  isCameraOn = true,
  mirrorVideo = true,
  theme = "light",
  onSelectSpeaker,
  onTogglePin,
}: ParticipantGridProps) {
  const count = participants.length;
  const isLight = theme === "light";

  // Responsive, clean layout calculation like Google Meet
  const gridContainerClass =
    count === 1
      ? "flex items-center justify-center p-2 max-w-4xl mx-auto w-full h-full"
      : count === 2
      ? "grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 items-center justify-center max-w-5xl mx-auto w-full h-full p-2"
      : count <= 4
      ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center justify-center max-w-5xl mx-auto w-full h-full p-2"
      : count <= 6
      ? "grid grid-cols-2 md:grid-cols-3 gap-3 items-center justify-center max-w-6xl mx-auto w-full h-full p-2"
      : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 items-center justify-center max-w-7xl mx-auto w-full h-full p-2";

  return (
    <div className="relative flex-1 w-full h-full min-h-0 flex items-center justify-center overflow-hidden">
      <div className={gridContainerClass}>
        {participants.map((p) => {
          return (
            <div
              key={p.id}
              onClick={() => onSelectSpeaker(p)}
              className={`relative rounded-2xl md:rounded-3xl overflow-hidden flex items-center justify-center w-full aspect-video shadow-md border transition-all cursor-pointer bg-[#202124] ${
                p.isSigning
                  ? "ring-3 ring-[#1a73e8] border-transparent"
                  : p.isSpeaking
                  ? "ring-3 ring-emerald-500 border-transparent"
                  : isLight
                  ? "border-gray-300 hover:border-gray-400"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {/* Live video: LiveKit Track, custom Stream, or local stream */}
              {p.trackRef && isTrackReference(p.trackRef) && (!p.isLocal || isCameraOn) ? (
                <VideoTrack
                  trackRef={p.trackRef}
                  className={`w-full h-full object-cover ${p.isLocal && mirrorVideo ? "sc-mirrored" : "sc-unmirrored"}`}
                />
              ) : p.stream && (!p.isLocal || isCameraOn) ? (
                <VideoStreamTile stream={p.stream} mirror={p.isLocal ? mirrorVideo : false} />
              ) : p.isLocal && isCameraOn && localStream ? (
                <VideoStreamTile stream={localStream} mirror={mirrorVideo} />
              ) : p.isLocal && !isCameraOn ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#202124]">
                  <span className="w-16 h-16 rounded-full bg-[#3c4043] text-white flex items-center justify-center text-2xl font-bold shadow-xs mb-2 border border-white/10">
                    {p.initial}
                  </span>
                  <span className="text-xs font-medium text-gray-400">Camera is off</span>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#202124]">
                  <span className="w-16 h-16 rounded-full bg-[#3c4043] text-white flex items-center justify-center text-2xl font-bold shadow-xs mb-2 border border-white/10">
                    {p.initial}
                  </span>
                  <span className="text-xs font-medium text-gray-400">{p.name}</span>
                </div>
              )}

              {/* Bottom Left: Name Tag + Badges */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
                <span className="inline-flex items-center h-7.5 px-3 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-md border border-white/10">
                  {p.name}
                </span>

                {p.isSigning && (
                  <span className="inline-flex items-center gap-1 h-7.5 px-2.5 rounded-full bg-[#2F62E8] text-white text-xs font-semibold shadow-xs">
                    <HandSignIcon className="w-3.5 h-3.5" />
                    Signing
                  </span>
                )}
              </div>

              {/* Top Right: Status / Pin */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(p);
                  }}
                  title={p.isPinned ? "Unpin participant" : "Pin participant"}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors border border-white/10 backdrop-blur-md"
                >
                  <PinIcon className="w-4 h-4" />
                </button>

                {p.isMuted ? (
                  <span
                    role="img"
                    aria-label="Microphone muted"
                    className="w-8 h-8 rounded-full bg-[#ea4335] text-white flex items-center justify-center shadow-xs"
                  >
                    <MicOffIcon className="w-4 h-4" />
                  </span>
                ) : p.isSpeaking ? (
                  <span
                    role="img"
                    aria-label="Speaking"
                    className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs animate-pulse"
                  >
                    <MicIcon className="w-4 h-4" />
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
