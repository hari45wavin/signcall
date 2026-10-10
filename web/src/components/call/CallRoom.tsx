"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { TokenResponse } from "@/types/messages";
import { NavRail } from "./NavRail";
import { CallHeader } from "./CallHeader";
import { SpeakerStage, type ParticipantInfo } from "./SpeakerStage";
import { Filmstrip } from "./Filmstrip";
import { ParticipantGrid } from "./ParticipantGrid";
import { CallControls } from "./CallControls";
import { CallSidebar, type TranscriptEntry } from "./CallSidebar";
import { SettingsModal } from "./SettingsModal";
import { MobileJoinModal } from "./MobileJoinModal";
import { AdjustViewModal, type LayoutMode } from "./AdjustViewModal";
import { CheatSheetModal } from "@/components/sign/CheatSheetModal";
import { useCaptions } from "@/hooks/useCaptions";
import { useSignRecognition } from "@/hooks/useSignRecognition";
import { useWebRtcRoom } from "@/hooks/useWebRtcRoom";
import { speak } from "@/lib/tts";
import { translateSignText, type TranslationTone } from "@/lib/translate";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useRemoteParticipants,
  useLocalParticipant,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track, type RemoteParticipant, type LocalParticipant } from "livekit-client";
import "@livekit/components-styles";

interface CallRoomProps {
  roomId: string;
  session: TokenResponse;
  onLeave: () => void;
  initialMicOn?: boolean;
  initialCameraOn?: boolean;
  initialSignModeOn?: boolean;
  initialMirrorVideo?: boolean;
}

interface CallRoomInnerProps extends CallRoomProps {
  liveKitTracks?: TrackReferenceOrPlaceholder[];
  remoteParticipants?: RemoteParticipant[];
  localParticipant?: LocalParticipant;
}

export function CallRoom({
  roomId,
  session,
  onLeave,
  initialMicOn = true,
  initialCameraOn = true,
  initialSignModeOn = false,
  initialMirrorVideo = true,
}: CallRoomProps) {
  const [liveKitFailed, setLiveKitFailed] = useState(false);
  const isLiveKit = !liveKitFailed && Boolean(session.url && (session.url.startsWith("wss://") || session.url.startsWith("ws://")));

  if (isLiveKit) {
    return (
      <LiveKitRoom
        serverUrl={session.url}
        token={session.token}
        connect
        audio={initialMicOn}
        video={initialCameraOn}
        onError={(err) => {
          console.warn("[LiveKit] Connection notice, gracefully operating in direct mode:", err);
          setLiveKitFailed(true);
        }}
        onDisconnected={onLeave}
        data-lk-theme="default"
        className="min-h-screen"
      >
        <RoomAudioRenderer />
        <LiveKitBridge
          roomId={roomId}
          session={session}
          onLeave={onLeave}
          initialMicOn={initialMicOn}
          initialCameraOn={initialCameraOn}
          initialSignModeOn={initialSignModeOn}
          initialMirrorVideo={initialMirrorVideo}
        />
      </LiveKitRoom>
    );
  }

  return (
    <CallRoomInner
      roomId={roomId}
      session={session}
      onLeave={onLeave}
      initialMicOn={initialMicOn}
      initialCameraOn={initialCameraOn}
      initialSignModeOn={initialSignModeOn}
      initialMirrorVideo={initialMirrorVideo}
    />
  );
}

function LiveKitBridge(props: CallRoomProps) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant } = useLocalParticipant();

  return (
    <CallRoomInner
      {...props}
      liveKitTracks={tracks}
      remoteParticipants={remoteParticipants}
      localParticipant={localParticipant}
    />
  );
}

function CallRoomInner({
  roomId,
  session,
  onLeave,
  initialMicOn = true,
  initialCameraOn = true,
  initialSignModeOn = false,
  initialMirrorVideo = true,
  liveKitTracks,
  remoteParticipants,
  localParticipant,
}: CallRoomInnerProps) {
  // Appearance Theme state: Default is "light" (White) as requested
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Call controls state
  const [micOn, setMicOn] = useState(initialMicOn ?? true);
  const [cameraOn, setCameraOn] = useState(initialCameraOn ?? true);
  const [signModeOn, setSignModeOn] = useState(initialSignModeOn ?? false);
  const [mirrorVideo, setMirrorVideo] = useState(initialMirrorVideo ?? true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [captionsOn, setCaptionsOn] = useState(true);
  const [readAloud, setReadAloud] = useState(true);
  const [captionSize, setCaptionSize] = useState(28);
  const [voiceName, setVoiceName] = useState("");
  const [speechRate, setSpeechRate] = useState(1.0);
  const [signLanguage, setSignLanguage] = useState("ASL");
  const [aiTranslateEnabled, setAiTranslateEnabled] = useState(true);
  const [translationTone, setTranslationTone] = useState<TranslationTone>("conversational");
  const [callTitle, setCallTitle] = useState("SignCall Room");
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);

  // Layout mode state (Google Meet Adjust View)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("auto");
  const [maxTiles, setMaxTiles] = useState(16);

  // Modals and Sidebar state
  const [activeSidebarTab, setActiveSidebarTab] = useState<"participants" | "transcript" | "sign" | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdjustViewOpen, setIsAdjustViewOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isMobileJoinOpen, setIsMobileJoinOpen] = useState(false);

  // Google Meet Host Management state
  const isHost = true;
  const [hostManagementEnabled, setHostManagementEnabled] = useState(true);
  const [allowParticipantVideo, setAllowParticipantVideo] = useState(true);
  const [allowParticipantAudio, setAllowParticipantAudio] = useState(true);
  const [allowParticipantChat, setAllowParticipantChat] = useState(true);

  // Fallback stream for offline / demo mode
  const [fallbackStream, setFallbackStream] = useState<MediaStream | null>(null);
  const masterVideoRef = useRef<HTMLVideoElement | null>(null);

  // Live local camera track from LiveKit
  const localCameraTrackRef = liveKitTracks?.find(
    (t) => t.participant.isLocal && t.source === Track.Source.Camera
  );
  const liveKitMediaTrack = localCameraTrackRef?.publication?.track?.mediaStreamTrack;

  // Derive localStream without duplicate getUserMedia calls
  const localStream = useMemo(() => {
    if (liveKitMediaTrack) {
      return new MediaStream([liveKitMediaTrack]);
    }
    return fallbackStream;
  }, [liveKitMediaTrack, fallbackStream]);

  // If LiveKit is NOT active, acquire fallback media stream with mobile orientation resilience
  useEffect(() => {
    if (localParticipant) return; // LiveKit manages devices

    let active = true;
    if (cameraOn || micOn) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: cameraOn
            ? {
                facingMode: { ideal: facingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : false,
          audio: micOn,
        })
        .then((s) => {
          if (!active) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          setFallbackStream(s);
        })
        .catch((err) => {
          console.warn("[SignCall] Fallback camera notice:", err);
          setMediaNotice("Camera/mic access unavailable: " + (err instanceof Error ? err.message : String(err)));
        });
    }

    return () => {
      active = false;
      if (fallbackStream) {
        fallbackStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [localParticipant, cameraOn, micOn, facingMode]);

  // Flip front / rear camera handler (crucial for mobile devices)
  const handleFlipCamera = useCallback(async () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    setMirrorVideo(nextMode === "user");

    if (!localParticipant) {
      if (fallbackStream) {
        fallbackStream.getVideoTracks().forEach((t) => t.stop());
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: cameraOn
            ? {
                facingMode: { ideal: nextMode },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : false,
          audio: micOn,
        });
        setFallbackStream(s);
      } catch (err) {
        console.warn("[SignCall] Camera flip notice:", err);
      }
    }
  }, [facingMode, localParticipant, fallbackStream, cameraOn, micOn]);

  // Sync master video ref whenever localStream updates
  useEffect(() => {
    if (masterVideoRef.current && localStream) {
      if (masterVideoRef.current.srcObject !== localStream) {
        masterVideoRef.current.srcObject = localStream;
      }
      masterVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Toggle mic handler
  const handleToggleMic = useCallback(async () => {
    const next = !micOn;
    setMicOn(next);
    if (localParticipant) {
      try {
        await localParticipant.setMicrophoneEnabled(next);
      } catch (err) {
        console.warn("Failed to toggle mic:", err);
        setMediaNotice("Microphone unavailable: " + (err instanceof Error ? err.message : String(err)));
      }
    } else if (fallbackStream) {
      fallbackStream.getAudioTracks().forEach((t) => {
        t.enabled = next;
      });
    }
  }, [micOn, localParticipant, fallbackStream]);

  // Toggle camera handler
  const handleToggleCamera = useCallback(async () => {
    const next = !cameraOn;
    setCameraOn(next);
    if (localParticipant) {
      try {
        await localParticipant.setCameraEnabled(next);
      } catch (err) {
        console.warn("Failed to toggle camera:", err);
        setMediaNotice("Camera unavailable: " + (err instanceof Error ? err.message : String(err)));
      }
    } else if (fallbackStream) {
      fallbackStream.getVideoTracks().forEach((t) => {
        t.enabled = next;
      });
    }
  }, [cameraOn, localParticipant, fallbackStream]);

  const localParticipantName = session.identity ? session.identity.split("-")[0] || "You" : "You";

  // Initial participants: strictly the local participant (ZERO fake people!)
  const [participants, setParticipants] = useState<ParticipantInfo[]>([
    {
      id: "p-local",
      name: localParticipantName,
      initial: (localParticipantName[0] || "Y").toUpperCase(),
      isSigning: initialSignModeOn,
      isSpeaking: false,
      isMuted: !initialMicOn,
      isPinned: false,
      isLocal: true,
      avatarBg: "#DDE5E1",
      stream: localStream,
      trackRef: localCameraTrackRef,
    },
  ]);

  // Active spotlight speaker (defaults to p-local)
  const [spotlightId, setSpotlightId] = useState<string>("p-local");

  // Transcripts list: starts empty (ZERO fake messages!)
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);

  // Live caption text on screen
  const [committedCaption, setCommittedCaption] = useState("SignCall ready");
  const [pendingCaption, setPendingCaption] = useState("");
  const [captionSpeakerName, setCaptionSpeakerName] = useState<string>("You");
  const [captionSpeakerIsSigning, setCaptionSpeakerIsSigning] = useState<boolean>(true);

  // Captions publishing hook
  const { captions, publish } = useCaptions({ readAloud });

  // Update root CSS variable when caption size changes
  useEffect(() => {
    document.documentElement.style.setProperty("--caption-size", `${captionSize}px`);
  }, [captionSize]);

  // Synchronize sign mode state
  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, isSigning: signModeOn } : p))
    );
  }, [signModeOn]);

  // Cross-network WebRTC P2P Mesh Room for mobile & non-local participants (runs automatically when LiveKit is in direct/tunnel mode)
  const isWebRtcMeshActive = !localParticipant;
  const { remotePeers, broadcast } = useWebRtcRoom({
    roomId,
    peerId: session.identity || "local-peer",
    name: localParticipantName,
    localStream,
    enabled: isWebRtcMeshActive,
    onRemoteCaption: (sender, text, isFinal) => {
      setCaptionSpeakerName(sender);
      setCaptionSpeakerIsSigning(true);
      if (isFinal) {
        setCommittedCaption(text);
        setPendingCaption("");
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
        setTranscriptEntries((prev) => [
          ...prev,
          {
            id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            who: sender,
            mode: "Signed",
            time: timeStr,
            text,
            bubbleBg: "#EAF0FF",
            textColor: "#111827",
          },
        ]);
        if (readAloud) {
          speak(text, { rate: speechRate });
        }
      } else {
        setPendingCaption(text);
      }
    },
  });

  // Synchronize participants with real LiveKit peers OR cross-network WebRTC peers
  useEffect(() => {
    const localInfo: ParticipantInfo = {
      id: "p-local",
      name: localParticipantName,
      initial: (localParticipantName[0] || "Y").toUpperCase(),
      isSigning: signModeOn,
      isSpeaking: false,
      isMuted: !micOn,
      isPinned: false,
      isLocal: true,
      avatarBg: "#DDE5E1",
      stream: localStream,
      trackRef: localCameraTrackRef,
    };

    // 1. Real remote participants from LiveKit (if LiveKit active)
    if (remoteParticipants && remoteParticipants.length > 0) {
      const realRemotes: ParticipantInfo[] = remoteParticipants.map((rp) => {
        const rpTrack = liveKitTracks?.find(
          (t) => t.participant.identity === rp.identity && t.source === Track.Source.Camera
        );
        const name = rp.name || rp.identity.split("-")[0] || "Peer";
        return {
          id: rp.identity,
          name,
          initial: (name[0] || "P").toUpperCase(),
          isSigning: false,
          isSpeaking: rp.isSpeaking,
          isMuted: !rp.isMicrophoneEnabled,
          isPinned: false,
          isLocal: false,
          avatarBg: "#E3E0EA",
          trackRef: rpTrack,
        };
      });
      setParticipants([localInfo, ...realRemotes]);
      return;
    }

    // 2. Real remote peers from cross-network WebRTC (works across mobile cellular & different Wi-Fi networks!)
    if (remotePeers && remotePeers.length > 0) {
      const meshRemotes: ParticipantInfo[] = remotePeers.map((rp) => ({
        id: rp.id,
        name: rp.name,
        initial: (rp.name[0] || "P").toUpperCase(),
        isSigning: false,
        isSpeaking: false,
        isMuted: false,
        isPinned: false,
        isLocal: false,
        avatarBg: "#E3E0EA",
        stream: rp.stream,
      }));
      setParticipants([localInfo, ...meshRemotes]);
      return;
    }

    setParticipants([localInfo]);
  }, [remoteParticipants, liveKitTracks, localCameraTrackRef, localParticipantName, micOn, signModeOn, localStream, remotePeers]);

  // Auto-reset spotlight if current spotlight participant leaves
  useEffect(() => {
    if (!participants.some((p) => p.id === spotlightId)) {
      setSpotlightId("p-local");
    }
  }, [participants, spotlightId]);

  // Sign recognition hook for local signer (uses continuous masterVideoRef)
  const {
    hands,
    currentSign,
    textState,
    edgeState,
    deleteLast,
    clearText,
    addSpace,
  } = useSignRecognition({
    videoRef: masterVideoRef,
    enabled: signModeOn,
    onCaptionUpdate: async (text, isFinal) => {
      if (isFinal) {
        let textToPublish = text;
        if (aiTranslateEnabled && text.trim()) {
          try {
            const res = await translateSignText(text, translationTone);
            if (res.translated) {
              textToPublish = res.translated;
            }
          } catch (e) {
            console.warn("[SignCall AI] Translation fallback:", e);
          }
        }
        setCommittedCaption(textToPublish);
        setPendingCaption("");
        setCaptionSpeakerName("You");
        setCaptionSpeakerIsSigning(true);
        publish(textToPublish, { final: true, source: "signed" });
        if (!localParticipant) {
          broadcast("caption", { text: textToPublish, final: true });
        }

        // Add to transcript
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
        setTranscriptEntries((prev) => [
          ...prev,
          {
            id: `t-${Date.now()}`,
            who: "You",
            mode: "Signed",
            time: timeStr,
            text: textToPublish,
            bubbleBg: "#EAF0FF",
            textColor: "#111827",
          },
        ]);

        if (readAloud) {
          speak(textToPublish, { rate: speechRate });
        }
      } else {
        setCommittedCaption(text);
      }
    },
  });

  // Receive remote captions from LiveKit data channel
  useEffect(() => {
    if (captions.length > 0) {
      const latest = captions[captions.length - 1];
      if (latest) {
        setCommittedCaption(latest.text);
        setPendingCaption("");

        if (latest.final) {
          const isFromLocal =
            latest.sender === (session.identity || "You") || latest.sender === "You";
          if (!isFromLocal) {
            const timeStr = new Date(latest.ts).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
            setTranscriptEntries((prev) => {
              if (prev.some((e) => e.id === latest.id)) return prev;
              return [
                ...prev,
                {
                  id: latest.id,
                  who: latest.sender,
                  mode: latest.source === "signed" ? "Signed" : "Typed",
                  time: timeStr,
                  text: latest.text,
                  bubbleBg: latest.source === "signed" ? "#EAF0FF" : "#F4F5F7",
                  textColor: "#111827",
                },
              ];
            });
          }
        }
      }
    }
  }, [captions, session.identity]);

  // Handle typed caption sent from sidebar
  const handleSendTypedMessage = useCallback(
    (text: string) => {
      if (!allowParticipantChat && !isHost) {
        alert("The host has disabled in-call chat.");
        return;
      }

      publish(text, { final: true, source: "typed" });

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

      setTranscriptEntries((prev) => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          who: "You",
          mode: "Typed",
          time: timeStr,
          text,
          bubbleBg: "#F4F5F7",
          textColor: "#111827",
        },
      ]);

      setCommittedCaption(text);
      setPendingCaption("");

      if (readAloud) {
        speak(text, { rate: speechRate });
      }
    },
    [publish, readAloud, speechRate, allowParticipantChat, isHost]
  );

  // Google Meet Host Management actions
  const handleMuteParticipant = useCallback(
    (participantId: string) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, isMuted: true } : p))
      );
      publish(`Host muted participant ${participantId}`, { final: true, source: "typed" });
    },
    [publish]
  );

  const handleRemoveParticipant = useCallback(
    (participantId: string) => {
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
      publish(`Host removed participant ${participantId}`, { final: true, source: "typed" });
    },
    [publish]
  );

  const handleMuteAll = useCallback(() => {
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? p : { ...p, isMuted: true }))
    );
    publish("Host muted all participants", { final: true, source: "typed" });
  }, [publish]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        handleToggleMic();
      } else if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        handleToggleCamera();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setSignModeOn((v) => !v);
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setCaptionsOn((v) => !v);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleMic, handleToggleCamera]);

  // Current spotlight speaker
  const currentSpeaker =
    participants.find((p) => p.id === spotlightId) || participants[0];

  // Filmstrip participants (everyone except current spotlighted speaker)
  const filmstripParticipants = participants.filter((p) => p.id !== currentSpeaker.id);

  // Layout mode determination
  const isTiledView =
    layoutMode === "tiled" || (layoutMode === "auto" && participants.length >= 2);
  const showFilmstrip =
    layoutMode === "sidebar" || (layoutMode === "auto" && participants.length > 1 && !isTiledView);

  // Leave call cleanup
  const handleLeave = () => {
    if (fallbackStream) {
      fallbackStream.getTracks().forEach((t) => t.stop());
    }
    onLeave();
  };

  const isLight = theme === "light";

  return (
    <div
      className={`w-full h-screen flex flex-col select-none overflow-hidden transition-colors ${
        isLight ? "bg-[#f8f9fa] text-[#202124]" : "bg-[#202124] text-white"
      }`}
    >
      {/* Top Header */}
      <CallHeader
        roomId={roomId}
        title={callTitle}
        onTitleChange={setCallTitle}
        captionsOn={captionsOn}
        onToggleCaptions={() => setCaptionsOn((v) => !v)}
        isGridView={isTiledView}
        onToggleGridView={() => {
          setLayoutMode(isTiledView ? "spotlight" : "tiled");
        }}
        onOpenAdjustView={() => setIsAdjustViewOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        onOpenMobileJoin={() => setIsMobileJoinOpen(true)}
        onBack={handleLeave}
      />

      {/* Media Permission / Device Alert Banner */}
      {mediaNotice && (
        <div className="mx-4 my-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-200 px-4 py-2 text-xs flex items-center justify-between gap-3 shrink-0">
          <span className="font-medium">⚠️ {mediaNotice}</span>
          <button
            type="button"
            onClick={() => setMediaNotice(null)}
            className="font-bold hover:underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main View Area: Video Stage + Optional Right Sidebar */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left/Center: Video Stage (Full height & width) */}
        <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-3 relative overflow-hidden">
          {!isTiledView ? (
            <div className="flex-1 min-h-0 flex flex-col gap-2">
              {/* Spotlight Speaker View: Fills 100% available stage height */}
              <SpeakerStage
                speaker={currentSpeaker}
                captionsOn={captionsOn}
                readAloud={readAloud}
                captionText={committedCaption}
                pendingCaptionText={pendingCaption}
                captionFontSize={captionSize}
                localStream={localStream}
                isCameraOn={cameraOn}
                mirrorVideo={mirrorVideo}
                onToggleMirror={() => setMirrorVideo((v) => !v)}
                isSignModeOn={currentSpeaker.isLocal && signModeOn}
                hands={hands}
                currentSign={currentSign}
                wordInProgress={textState.text || textState.pending?.label || ""}
                edgeState={edgeState}
                theme={theme}
                onUndoSign={deleteLast}
                onClearSign={clearText}
                onSpaceSign={addSpace}
                onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
                onTogglePin={() => {
                  setParticipants((prev) =>
                    prev.map((p) =>
                      p.id === currentSpeaker.id ? { ...p, isPinned: !p.isPinned } : p
                    )
                  );
                }}
              />

              {/* Filmstrip with other participants (only when sidebar mode or multi-peer) */}
              {showFilmstrip && filmstripParticipants.length > 0 && (
                <Filmstrip
                  participants={filmstripParticipants}
                  localStream={localStream}
                  isCameraOn={cameraOn}
                  mirrorVideo={mirrorVideo}
                  theme={theme}
                  onSelectSpeaker={(p) => setSpotlightId(p.id)}
                  roomId={roomId}
                />
              )}
            </div>
          ) : (
            /* Google Meet Clean Multi-Tile Grid View */
            <ParticipantGrid
              participants={participants}
              localStream={localStream}
              isCameraOn={cameraOn}
              mirrorVideo={mirrorVideo}
              captionsOn={captionsOn}
              readAloud={readAloud}
              captionText={committedCaption}
              pendingCaptionText={pendingCaption}
              captionFontSize={captionSize}
              activeSpeakerName={currentSpeaker.name}
              theme={theme}
              onSelectSpeaker={(p) => setSpotlightId(p.id)}
              onTogglePin={(p) => {
                setParticipants((prev) =>
                  prev.map((item) =>
                    item.id === p.id ? { ...item, isPinned: !item.isPinned } : item
                  )
                );
              }}
            />
          )}
        </div>

        {/* Right Sidebar (People & In-call Transcript/Chat with Host Controls) */}
        {activeSidebarTab && (
          <CallSidebar
            participants={participants}
            entries={transcriptEntries}
            activeTab={activeSidebarTab}
            onTabChange={setActiveSidebarTab}
            onSendMessage={handleSendTypedMessage}
            onClose={() => setActiveSidebarTab(null)}
            theme={theme}
            isHost={isHost}
            onMuteParticipant={handleMuteParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onMuteAll={handleMuteAll}
          />
        )}
      </div>

      {/* Dedicated Live Captions Strip: Docked BELOW the video stage, ABOVE the bottom controls */}
      {captionsOn && (committedCaption || pendingCaption) && (
        <div className="px-4 py-1.5 flex justify-center shrink-0 z-20">
          <div
            className={`max-w-3xl w-full backdrop-blur-md rounded-2xl px-5 py-2.5 shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-150 border ${
              isLight
                ? "bg-white/95 border-gray-200 text-[#1f2937]"
                : "bg-[#1e2024]/95 border-white/10 text-white"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  isLight
                    ? "bg-[#e8f0fe] text-[#1a73e8]"
                    : "bg-[#8ab4f8]/10 text-[#8ab4f8]"
                }`}
              >
                {captionSpeakerName || currentSpeaker.name} {captionSpeakerIsSigning ? "• Signed" : "• Speaking"}
              </span>
              <p
                className={`m-0 font-medium truncate text-base md:text-lg ${
                  isLight ? "text-gray-900" : "text-white"
                }`}
                style={{
                  fontFamily: "var(--font-caption), Atkinson Hyperlegible, sans-serif",
                  fontSize: `${Math.min(captionSize, 26)}px`,
                }}
              >
                {committedCaption}
                {pendingCaption && (
                  <span className={`font-normal ml-1.5 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                    {pendingCaption}
                  </span>
                )}
              </p>
            </div>
            {readAloud && (
              <span
                className={`text-[11px] shrink-0 hidden sm:inline ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}
                title="Read aloud voice is active"
              >
                🔊 Read aloud
              </span>
            )}
          </div>
        </div>
      )}

      {/* Master 640x360 off-screen video element feeding MediaPipe continuously without throttling */}
      <video
        ref={masterVideoRef}
        autoPlay
        playsInline
        muted
        width={640}
        height={360}
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "640px",
          height: "360px",
          pointerEvents: "none",
          zIndex: -9999,
        }}
        aria-hidden="true"
      />

      {/* Google Meet Bottom Toolbar Controls */}
      <CallControls
        roomId={roomId}
        micOn={micOn}
        onToggleMic={handleToggleMic}
        cameraOn={cameraOn}
        onToggleCamera={handleToggleCamera}
        mirrorVideo={mirrorVideo}
        onToggleMirror={() => setMirrorVideo((v) => !v)}
        facingMode={facingMode}
        onFlipCamera={handleFlipCamera}
        signModeOn={signModeOn}
        onToggleSignMode={() => {
          setSignModeOn((v) => !v);
          if (!signModeOn) {
            setSpotlightId("p-local");
          }
        }}
        aiTranslateEnabled={aiTranslateEnabled}
        onToggleAiTranslate={() => setAiTranslateEnabled((v) => !v)}
        translationTone={translationTone}
        captionsOn={captionsOn}
        onToggleCaptions={() => setCaptionsOn((v) => !v)}
        voiceOn={readAloud}
        onToggleVoice={() => setReadAloud((v) => !v)}
        activeSidebarTab={activeSidebarTab}
        onToggleSidebarTab={(tab) =>
          setActiveSidebarTab((cur) => (cur === tab ? null : tab))
        }
        participantCount={participants.length}
        unreadCount={transcriptEntries.length}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        onOpenAdjustView={() => setIsAdjustViewOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMobileJoin={() => setIsMobileJoinOpen(true)}
        onLeaveCall={handleLeave}
      />

      {/* Remote WebRTC audio tracks so mobile & cross-network participants speak aloud */}
      <div className="hidden" aria-hidden="true">
        {remotePeers.map((rp) => (
          <audio
            key={rp.id}
            autoPlay
            playsInline
            ref={(el) => {
              if (el && el.srcObject !== rp.stream) {
                el.srcObject = rp.stream;
              }
            }}
          />
        ))}
      </div>

      {/* Google Meet Adjust View (Change Layout) Modal */}
      <AdjustViewModal
        isOpen={isAdjustViewOpen}
        onClose={() => setIsAdjustViewOpen(false)}
        layoutMode={layoutMode}
        onLayoutModeChange={(mode) => {
          setLayoutMode(mode);
        }}
        maxTiles={maxTiles}
        onMaxTilesChange={setMaxTiles}
        theme={theme}
      />

      {/* Mobile Join Modal */}
      <MobileJoinModal
        isOpen={isMobileJoinOpen}
        onClose={() => setIsMobileJoinOpen(false)}
        roomId={roomId}
      />

      {/* Settings Modal with Host Management & TTS Preview */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        captionSize={captionSize}
        onCaptionSizeChange={setCaptionSize}
        voiceName={voiceName}
        onVoiceNameChange={setVoiceName}
        speechRate={speechRate}
        onSpeechRateChange={setSpeechRate}
        signLanguage={signLanguage}
        onSignLanguageChange={setSignLanguage}
        mirrorVideo={mirrorVideo}
        onToggleMirrorVideo={setMirrorVideo}
        aiTranslateEnabled={aiTranslateEnabled}
        onToggleAiTranslate={setAiTranslateEnabled}
        translationTone={translationTone}
        onTranslationToneChange={setTranslationTone}
        isHost={isHost}
        hostManagementEnabled={hostManagementEnabled}
        onToggleHostManagement={setHostManagementEnabled}
        allowParticipantVideo={allowParticipantVideo}
        onToggleParticipantVideo={setAllowParticipantVideo}
        allowParticipantAudio={allowParticipantAudio}
        onToggleParticipantAudio={setAllowParticipantAudio}
        allowParticipantChat={allowParticipantChat}
        onToggleParticipantChat={setAllowParticipantChat}
        onMuteAll={handleMuteAll}
      />

      {/* Signs Cheat Sheet Modal */}
      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />
    </div>
  );
}
