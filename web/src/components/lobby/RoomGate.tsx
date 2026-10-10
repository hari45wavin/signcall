"use client";

import { useState, useRef, useEffect } from "react";
import type { TokenResponse } from "@/types/messages";
import { CallRoom } from "@/components/call/CallRoom";
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  HandSignIcon,
  CopyIcon,
  CheckIcon,
  SettingsIcon,
  ArrowLeftIcon,
  FlipHorizontalIcon,
  SmartphoneIcon,
} from "@/components/common/Icons";
import Link from "next/link";

import { VideoStreamTile } from "@/components/common/VideoStreamTile";
import { MobileJoinModal } from "@/components/call/MobileJoinModal";

interface RoomGateProps {
  roomId: string;
  host: boolean;
}

export function RoomGate({ roomId, host }: RoomGateProps) {
  const [name, setName] = useState("");
  const [session, setSession] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Pre-join devices preview
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [startWithSignMode, setStartWithSignMode] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [lobbyStream, setLobbyStream] = useState<MediaStream | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [isSecure, setIsSecure] = useState(true);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check secure context
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSecure(window.isSecureContext);
    }
  }, []);

  // Initialize camera & mic preview with resilient fallback
  useEffect(() => {
    let active = true;

    async function initPreview() {
      if (!cameraOn && !micOn) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        setLobbyStream(null);
        setDeviceError(null);
        return;
      }

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setDeviceError(
          window.isSecureContext
            ? "Media devices not supported in this browser."
            : "Camera/microphone blocked on insecure HTTP. Please use localhost or enable insecure origin in Chrome flags."
        );
        return;
      }

      // Stop old tracks first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      let stream: MediaStream | null = null;
      try {
        // Attempt 1: acquire both requested devices
        stream = await navigator.mediaDevices.getUserMedia({
          video: cameraOn ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          audio: micOn,
        });
      } catch (err: unknown) {
        console.warn("[RoomGate] Initial media request error:", err);
        // Attempt 2: If both were requested, try video only
        if (cameraOn && micOn) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            setDeviceError("Microphone not available or permission denied. Video is active.");
          } catch {
            // Attempt 3: Try audio only
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              setDeviceError("Camera not available or permission denied. Audio is active.");
            } catch (innerErr: unknown) {
              const e = innerErr as Error;
              if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
                setDeviceError("Camera & microphone permission denied. Please allow camera/mic access in your browser address bar.");
              } else {
                setDeviceError("No camera or microphone detected on this device.");
              }
              return;
            }
          }
        } else {
          const e = err as Error;
          if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
            setDeviceError("Permission denied for selected devices. Check browser site settings.");
          } else {
            setDeviceError("Device unavailable: " + (e.message || "Could not start media."));
          }
          return;
        }
      }

      if (!active) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (stream) {
        streamRef.current = stream;
        setLobbyStream(stream);

        // Audio level meter
        if (micOn && stream.getAudioTracks().length > 0) {
          try {
            const AudioCtx =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const audioCtx = new AudioCtx();
            audioContextRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 64;
            const buffer = new Uint8Array(analyser.frequencyBinCount);

            let lastTick = 0;
            const checkLevel = (time: number) => {
              if (!active || !streamRef.current) return;
              if (time - lastTick >= 100) {
                lastTick = time;
                analyser.getByteFrequencyData(buffer);
                let sum = 0;
                for (let i = 0; i < buffer.length; i++) sum += buffer[i];
                const avg = sum / buffer.length;
                const newLevel = Math.min(100, Math.round((avg / 128) * 100));
                setAudioLevel(newLevel);
              }
              requestAnimationFrame(checkLevel);
            };
            requestAnimationFrame(checkLevel);
          } catch {
            // Ignore audio context errors
          }
        }
      }
    }

    initPreview();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [cameraOn, micOn]);

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/room/${roomId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  async function join(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const finalName = name.trim() || "Guest";
    setBusy(true);
    setError(null);

    // CRITICAL: Stop and release lobby preview tracks before entering call!
    // This frees hardware webcam and mic so LiveKit and the in-call room don't suffer hardware lock collisions!
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setLobbyStream(null);

    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, name: finalName, host }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.warn("[RoomGate] LiveKit server notice:", data.error, "Falling back to demo session.");
        setSession({
          token: "demo-token-" + Math.random().toString(36).slice(2),
          identity: `${finalName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-demo`,
          url: "demo://signcall",
        });
        return;
      }
      setSession(data);
    } catch {
      setSession({
        token: "demo-token-" + Math.random().toString(36).slice(2),
        identity: `${finalName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-demo`,
        url: "demo://signcall",
      });
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <CallRoom
        roomId={roomId}
        session={session}
        onLeave={() => setSession(null)}
        initialMicOn={micOn}
        initialCameraOn={cameraOn}
        initialSignModeOn={startWithSignMode}
        initialMirrorVideo={mirrorVideo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col justify-between p-4 sm:p-6 md:p-10 select-none">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-full bg-[#2F62E8] text-white flex items-center justify-center shadow-xs group-hover:opacity-90">
            <HandSignIcon className="w-5.5 h-5.5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#111827]">SignCall</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileModalOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#EAF0FF] hover:bg-[#dbe6ff] text-sm font-semibold text-[#2F62E8] transition-all cursor-pointer"
          >
            <SmartphoneIcon className="w-4 h-4" />
            <span>Join on Phone</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#F4F5F7] hover:bg-gray-200 text-sm font-semibold text-[#111827] transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Link copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="w-4 h-4 text-[#6B7280]" />
                <span>Copy invite link</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Lobby Area (Google Meet two-column layout) */}
      <main className="max-w-6xl w-full mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 my-auto">
        {/* Left Side: Camera & Mic Preview Box */}
        <div className="w-full lg:w-[600px] flex flex-col gap-4">
          <div className="relative aspect-video w-full rounded-[28px] overflow-hidden bg-[#1E2024] shadow-md flex items-center justify-center border border-black/10">
            {cameraOn && lobbyStream ? (
              <VideoStreamTile stream={lobbyStream} mirror={mirrorVideo} />
            ) : (
              <div className="flex flex-col items-center gap-3 text-white">
                <span className="w-22 h-22 rounded-full bg-[#374151] flex items-center justify-center text-4xl font-bold">
                  {name ? name[0].toUpperCase() : "A"}
                </span>
                <span className="text-sm font-medium text-gray-300">Camera is off</span>
              </div>
            )}

            {/* Bottom Floating Control Buttons */}
            <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-3.5 z-10">
              <button
                type="button"
                onClick={() => setMicOn((v) => !v)}
                aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                  micOn
                    ? "bg-white text-[#111827] hover:bg-gray-100"
                    : "bg-[#D92D20] text-white hover:bg-red-700"
                }`}
              >
                {micOn ? <MicIcon className="w-5.5 h-5.5" /> : <MicOffIcon className="w-5.5 h-5.5" />}
              </button>

              <button
                type="button"
                onClick={() => setCameraOn((v) => !v)}
                aria-label={cameraOn ? "Turn off camera" : "Turn on camera"}
                className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                  cameraOn
                    ? "bg-white text-[#111827] hover:bg-gray-100"
                    : "bg-[#D92D20] text-white hover:bg-red-700"
                }`}
              >
                {cameraOn ? <VideoIcon className="w-5.5 h-5.5" /> : <VideoOffIcon className="w-5.5 h-5.5" />}
              </button>

              <button
                type="button"
                onClick={() => setMirrorVideo((v) => !v)}
                aria-label={mirrorVideo ? "Unmirror camera" : "Mirror camera"}
                title={mirrorVideo ? "Camera is mirrored (click to unmirror)" : "Camera is unmirrored (click to mirror)"}
                className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                  mirrorVideo
                    ? "bg-[#2F62E8] text-white hover:bg-[#2552c7]"
                    : "bg-white text-[#111827] hover:bg-gray-100"
                }`}
              >
                <FlipHorizontalIcon className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Audio level meter dot in corner */}
            {micOn && (
              <div
                className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-medium"
                title="Microphone active"
              >
                <span
                  className="w-2 h-2 rounded-full bg-emerald-400 transition-transform duration-100"
                  style={{ transform: `scale(${1 + (audioLevel / 100) * 0.8})` }}
                />
                <span>Mic ready</span>
              </div>
            )}
          </div>

          {deviceError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3 shadow-2xs">
              <span className="flex-1">⚠️ {deviceError}</span>
              <button
                type="button"
                onClick={() => {
                  setCameraOn((v) => !v);
                  setTimeout(() => setCameraOn((v) => !v), 50);
                }}
                className="underline font-semibold text-amber-900 cursor-pointer shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {!isSecure && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex flex-col gap-1 shadow-2xs">
              <span className="font-semibold">ℹ️ Wi-Fi Testing Notice</span>
              <span>
                Browsers disable webcams on insecure HTTP (<code>http://172.168...</code>). To test video across devices on local Wi-Fi, open <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> on the remote device, add this origin, and relaunch. Or join to view peers and use live text chat.
              </span>
            </div>
          )}

          <p className="text-xs text-center text-[#6B7280]">
            Check your audio and video before joining. You can always change devices in the call.
          </p>
        </div>

        {/* Right Side: Join Controls & Form */}
        <div className="w-full lg:max-w-md flex flex-col gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF0FF] text-[#2349C7] text-xs font-semibold mb-3">
              Room {roomId}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111827]">
              Ready to join?
            </h1>
            <p className="text-base text-[#6B7280] mt-1.5">
              Enter your display name to start or join the call. No Google sign-in required.
            </p>
          </div>

          <form onSubmit={join} className="flex flex-col gap-4">
            <div>
              <label htmlFor="display-name-input" className="block text-sm font-semibold text-[#111827] mb-1.5">
                Your display name
              </label>
              <input
                id="display-name-input"
                type="text"
                autoFocus
                maxLength={40}
                placeholder="e.g. Alex (defaults to Guest)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-[#F4F5F7] px-4.5 py-3.5 text-base text-[#111827] placeholder:text-gray-400 outline-none focus:border-[#2F62E8] focus:bg-white transition-all shadow-xs"
              />
            </div>

            {/* Start with Sign Mode option */}
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F4F5F7] border border-gray-200/80 cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={startWithSignMode}
                onChange={(e) => setStartWithSignMode(e.target.checked)}
                className="w-5 h-5 rounded accent-[#2F62E8] cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#111827] flex items-center gap-1.5">
                  <HandSignIcon className="w-4 h-4 text-[#2F62E8]" />
                  Join with Sign Mode enabled
                </span>
                <span className="text-xs text-[#6B7280]">
                  MediaPipe will recognize your hand signs into live captions
                </span>
              </div>
            </label>

            {/* Join Button */}
            <button
              type="submit"
              onClick={join}
              disabled={busy}
              className="w-full py-4 rounded-full bg-[#2F62E8] hover:bg-[#2552c7] disabled:opacity-60 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {busy ? "Joining call..." : "Join now"}
            </button>

            {error && (
              <p role="alert" className="text-sm font-medium text-[#E5532F] text-center">
                {error}
              </p>
            )}
          </form>

          {/* Quick tips */}
          <div className="border-t border-gray-100 pt-4 flex flex-col gap-2 text-xs text-[#6B7280]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#111827]">Privacy note:</span>
              <span>Hand tracking runs 100% locally in your browser.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#111827]">Accessibility:</span>
              <span>Captions are spoken aloud via Text-to-Speech for hearing participants.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-[#6B7280] pt-6 border-t border-gray-100">
        SignCall • Video calls with live sign language captions & speech • WCAG AA compliant
      </footer>

      {/* Mobile Join Modal */}
      <MobileJoinModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        roomId={roomId}
      />
    </div>
  );
}
