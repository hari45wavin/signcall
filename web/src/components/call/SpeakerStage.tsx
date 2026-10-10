"use client";

import { PinIcon, HandSignIcon, FlipHorizontalIcon } from "@/components/common/Icons";
import { SignOverlay } from "@/components/sign/SignOverlay";
import type { Hand } from "@/lib/features";
import type { EdgeState } from "@/hooks/useSignRecognition";

import { VideoStreamTile } from "@/components/common/VideoStreamTile";
import { VideoTrack, isTrackReference, type TrackReferenceOrPlaceholder } from "@livekit/components-react";

export interface ParticipantInfo {
  id: string;
  name: string;
  initial: string;
  isSigning: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isPinned: boolean;
  isLocal: boolean;
  avatarBg: string;
  stream?: MediaStream | null;
  trackRef?: TrackReferenceOrPlaceholder;
}

interface SpeakerStageProps {
  speaker: ParticipantInfo;
  captionsOn?: boolean;
  readAloud?: boolean;
  captionText?: string;
  pendingCaptionText?: string;
  captionFontSize?: number;
  localStream?: MediaStream | null;
  isCameraOn?: boolean;
  mirrorVideo?: boolean;
  onToggleMirror?: () => void;
  isSignModeOn?: boolean;
  hands?: Hand[];
  currentSign?: { label: string; confidence: number } | null;
  wordInProgress?: string;
  edgeState?: EdgeState;
  onUndoSign?: () => void;
  onClearSign?: () => void;
  onSpaceSign?: () => void;
  onOpenCheatSheet?: () => void;
  onTogglePin?: () => void;
  theme?: "light" | "dark";
}

export function SpeakerStage({
  speaker,
  localStream,
  isCameraOn = true,
  mirrorVideo = true,
  onToggleMirror,
  isSignModeOn = false,
  hands = [],
  currentSign = null,
  wordInProgress = "",
  edgeState = "ready",
  theme = "light",
  onUndoSign = () => {},
  onClearSign = () => {},
  onSpaceSign = () => {},
  onOpenCheatSheet = () => {},
  onTogglePin = () => {},
}: SpeakerStageProps) {
  const isLight = theme === "light";

  return (
    <div
      className={`relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#202124] flex-1 w-full h-full min-h-[380px] flex items-center justify-center shadow-lg border select-none transition-all ${
        isLight ? "border-gray-300" : "border-white/10"
      }`}
    >
      {/* Video Stream, LiveKit Track, or Google Meet Dark Avatar Silhouette */}
      {speaker.trackRef && isTrackReference(speaker.trackRef) && (!speaker.isLocal || isCameraOn) ? (
        <VideoTrack
          trackRef={speaker.trackRef}
          className={`w-full h-full object-cover ${speaker.isLocal && mirrorVideo ? "sc-mirrored" : "sc-unmirrored"}`}
        />
      ) : speaker.stream && (!speaker.isLocal || isCameraOn) ? (
        <VideoStreamTile stream={speaker.stream} mirror={speaker.isLocal ? mirrorVideo : false} />
      ) : speaker.isLocal && isCameraOn && localStream ? (
        <VideoStreamTile stream={localStream} mirror={mirrorVideo} />
      ) : (
        /* Google Meet clean dark avatar tile */
        <div className="w-full h-full flex flex-col items-center justify-center pb-4 bg-[#202124]">
          <span className="w-24 h-24 rounded-full bg-[#3c4043] text-white flex items-center justify-center text-4xl font-bold shadow-md mb-3 border border-white/10">
            {speaker.initial}
          </span>
          <span className="text-sm font-medium text-gray-400">
            {speaker.isLocal ? "Your camera is off" : `${speaker.name}'s camera is off`}
          </span>
        </div>
      )}

      {/* Top Left Chips: Name and Status */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
        <span className="inline-flex items-center h-8.5 px-3.5 rounded-full bg-black/60 text-white text-sm font-semibold backdrop-blur-md border border-white/10">
          {speaker.name}
        </span>

        {speaker.isSigning && (
          <span className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-full bg-[#2F62E8] text-white text-xs font-bold shadow-xs">
            <HandSignIcon className="w-3.5 h-3.5" />
            Signing
          </span>
        )}

        {speaker.isSpeaking && (
          <span className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xs animate-pulse">
            Speaking
          </span>
        )}
      </div>

      {/* Top Right Action Buttons: Flip Mirror & Pin */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        {speaker.isLocal && onToggleMirror && (
          <button
            type="button"
            onClick={onToggleMirror}
            aria-pressed={mirrorVideo}
            aria-label={mirrorVideo ? "Mirror is on. Click to unmirror camera (natural for sign language)" : "Camera is unmirrored. Click to mirror"}
            title={mirrorVideo ? "Mirror is ON (reflection). Click for unmirrored natural view" : "Camera is UNMIRRORED (natural). Click to mirror"}
            className={`w-10 h-10 rounded-full border-none shadow-md flex items-center justify-center cursor-pointer transition-all backdrop-blur-md ${
              mirrorVideo
                ? "bg-[#8ab4f8] text-[#202124] hover:bg-[#a8c7fa]"
                : "bg-black/60 text-white hover:bg-black/80 border border-white/10"
            }`}
          >
            <FlipHorizontalIcon className="w-4.5 h-4.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onTogglePin}
          aria-label={speaker.isPinned ? `Unpin ${speaker.name}` : `Pin ${speaker.name}`}
          title={speaker.isPinned ? "Unpin participant" : "Pin participant"}
          className={`w-10 h-10 rounded-full border-none shadow-md flex items-center justify-center cursor-pointer transition-all backdrop-blur-md ${
            speaker.isPinned
              ? "bg-[#8ab4f8] text-[#202124]"
              : "bg-black/60 text-white hover:bg-black/80 border border-white/10"
          }`}
        >
          <PinIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Sign Mode Overlay when active on this participant: matches mirror state */}
      {isSignModeOn && (
        <SignOverlay
          hands={hands}
          mirrored={speaker.isLocal ? mirrorVideo : false}
          currentSign={currentSign}
          wordInProgress={wordInProgress}
          edgeState={edgeState}
          onUndo={onUndoSign}
          onClear={onClearSign}
          onSpace={onSpaceSign}
          onOpenCheatSheet={onOpenCheatSheet}
        />
      )}
    </div>
  );
}
