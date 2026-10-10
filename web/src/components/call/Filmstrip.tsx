"use client";

import { useState } from "react";
import type { ParticipantInfo } from "./SpeakerStage";
import { MicIcon, MicOffIcon, CopyIcon, CheckIcon } from "@/components/common/Icons";
import { VideoStreamTile } from "@/components/common/VideoStreamTile";
import { VideoTrack, isTrackReference } from "@livekit/components-react";

interface FilmstripProps {
  participants: ParticipantInfo[];
  localStream?: MediaStream | null;
  isCameraOn?: boolean;
  mirrorVideo?: boolean;
  theme?: "light" | "dark";
  onSelectSpeaker: (p: ParticipantInfo) => void;
  roomId?: string;
}

export function Filmstrip({
  participants,
  localStream,
  isCameraOn = true,
  mirrorVideo = true,
  theme = "light",
  onSelectSpeaker,
  roomId,
}: FilmstripProps) {
  // When alone, do not render a large card that crushes the main video stage!
  if (participants.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 shrink-0 pt-2">
      {participants.map((p) => {
        return (
          <div
            key={p.id}
            onClick={() => onSelectSpeaker(p)}
            title={`Click to spotlight ${p.name}`}
            className="group relative h-28 sm:h-32 rounded-2xl overflow-hidden flex items-end justify-center cursor-pointer border border-white/10 hover:ring-2 hover:ring-[#8ab4f8] transition-all bg-[#202124]"
          >
            {/* Live video: LiveKit Track, custom Stream, or local stream */}
            {p.trackRef && isTrackReference(p.trackRef) ? (
              <VideoTrack
                trackRef={p.trackRef}
                className={`w-full h-full object-cover ${p.isLocal && mirrorVideo ? "sc-mirrored" : "sc-unmirrored"}`}
              />
            ) : p.stream ? (
              <VideoStreamTile stream={p.stream} mirror={p.isLocal ? mirrorVideo : false} />
            ) : p.isLocal && isCameraOn && localStream ? (
              <VideoStreamTile stream={localStream} mirror={mirrorVideo} />
            ) : p.isLocal && !isCameraOn ? (
              /* Camera OFF Avatar Initial */
              <div className="absolute inset-0 flex items-center justify-center bg-[#202124]">
                <span className="w-12 h-12 rounded-full bg-[#3c4043] text-white flex items-center justify-center text-xl font-bold shadow-xs">
                  {p.initial}
                </span>
              </div>
            ) : (
              /* Participant silhouette avatar */
              <div className="absolute inset-0 flex items-center justify-center bg-[#202124]">
                <span className="w-12 h-12 rounded-full bg-[#3c4043] text-white flex items-center justify-center text-xl font-bold shadow-xs">
                  {p.initial}
                </span>
              </div>
            )}

            {/* Bottom Left: Participant Name Tag */}
            <span className="absolute bottom-2 left-2 inline-flex items-center h-6 px-2.5 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-md border border-white/10 z-10">
              {p.name}
            </span>

            {/* Bottom Right: Mute Status */}
            {p.isMuted && (
              <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#ea4335] text-white flex items-center justify-center shadow-xs z-10">
                <MicOffIcon className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
