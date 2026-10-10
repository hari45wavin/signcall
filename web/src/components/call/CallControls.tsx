"use client";

import { useState, useRef, useEffect } from "react";
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  HandSignIcon,
  SpeakerIcon,
  SpeakerOffIcon,
  UsersIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  FlipHorizontalIcon,
  SwitchCameraIcon,
  PhoneOffIcon,
  SmartphoneIcon,
  MaximizeIcon,
  PictureInPictureIcon,
  SettingsIcon,
  LayoutIcon,
  SunIcon,
  MoonIcon,
} from "@/components/common/Icons";

interface CallControlsProps {
  roomId?: string;
  micOn: boolean;
  onToggleMic: () => void;
  cameraOn: boolean;
  onToggleCamera: () => void;
  mirrorVideo?: boolean;
  onToggleMirror?: () => void;
  facingMode?: "user" | "environment";
  onFlipCamera?: () => void;
  signModeOn: boolean;
  onToggleSignMode: () => void;
  aiTranslateEnabled?: boolean;
  onToggleAiTranslate?: () => void;
  translationTone?: string;
  captionsOn: boolean;
  onToggleCaptions: () => void;
  voiceOn: boolean;
  onToggleVoice: () => void;
  activeSidebarTab: "participants" | "transcript" | "sign" | null;
  onToggleSidebarTab: (tab: "participants" | "transcript" | "sign") => void;
  participantCount?: number;
  unreadCount?: number;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  onOpenAdjustView?: () => void;
  onOpenSettings: () => void;
  onOpenMobileJoin?: () => void;
  onLeaveCall: () => void;
}

export function CallControls({
  roomId = "",
  micOn,
  onToggleMic,
  cameraOn,
  onToggleCamera,
  mirrorVideo = true,
  onToggleMirror,
  facingMode = "user",
  onFlipCamera,
  signModeOn,
  onToggleSignMode,
  aiTranslateEnabled = true,
  onToggleAiTranslate,
  translationTone = "conversational",
  captionsOn,
  onToggleCaptions,
  voiceOn,
  onToggleVoice,
  activeSidebarTab,
  onToggleSidebarTab,
  participantCount = 1,
  unreadCount = 0,
  theme = "light",
  onToggleTheme,
  onOpenAdjustView,
  onOpenSettings,
  onOpenMobileJoin,
  onLeaveCall,
}: CallControlsProps) {
  const [time, setTime] = useState("");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const isLight = theme === "light";

  // Clock for Google Meet bottom-left display
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, []);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMoreMenuOpen]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    setIsMoreMenuOpen(false);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Picture in picture handler
  const handleTogglePiP = () => {
    setIsMoreMenuOpen(false);
    const video = document.querySelector("video") as HTMLVideoElement | null;
    if (video && document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      } else {
        video.requestPictureInPicture().catch(() => {});
      }
    }
  };

  return (
    <div
      role="toolbar"
      aria-label="Google Meet call controls"
      className={`w-full border-t px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 z-30 select-none transition-colors ${
        isLight
          ? "bg-white border-gray-200 text-[#202124]"
          : "bg-[#1e2024] border-white/10 text-white"
      }`}
    >
      {/* Left: Meeting Time & Room ID (Google Meet style) */}
      <div className="hidden md:flex items-center gap-3 min-w-[180px]">
        <span className={`font-medium text-sm ${isLight ? "text-gray-800" : "text-gray-200"}`}>
          {time || "16:50"}
        </span>
        <span className={isLight ? "text-gray-300" : "text-gray-600"}>|</span>
        <span
          className={`text-xs font-mono truncate max-w-[140px] ${isLight ? "text-gray-500" : "text-gray-400"}`}
          title={roomId}
        >
          {roomId || "signcall"}
        </span>
      </div>

      {/* Center: Main Controls Cluster (Google Meet circular buttons) */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-1 md:flex-initial">
        {/* Microphone Toggle */}
        <button
          type="button"
          onClick={onToggleMic}
          aria-pressed={!micOn}
          aria-label={micOn ? "Mute microphone (M)" : "Unmute microphone (M)"}
          title={micOn ? "Mute microphone (M)" : "Unmute microphone (M)"}
          className={`w-11.5 h-11.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
            micOn
              ? isLight
                ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
              : "bg-[#ea4335] text-white hover:bg-[#d93025]"
          }`}
        >
          {micOn ? <MicIcon className="w-5 h-5" /> : <MicOffIcon className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          type="button"
          onClick={onToggleCamera}
          aria-pressed={!cameraOn}
          aria-label={cameraOn ? "Turn camera off (V)" : "Turn camera on (V)"}
          title={cameraOn ? "Turn camera off (V)" : "Turn camera on (V)"}
          className={`w-11.5 h-11.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
            cameraOn
              ? isLight
                ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
              : "bg-[#ea4335] text-white hover:bg-[#d93025]"
          }`}
        >
          {cameraOn ? <VideoIcon className="w-5 h-5" /> : <VideoOffIcon className="w-5 h-5" />}
        </button>

        {/* Flip / Mirror Camera Toggle (Selfie mirror default) */}
        {onToggleMirror && (
          <button
            type="button"
            onClick={onToggleMirror}
            aria-pressed={mirrorVideo}
            aria-label={mirrorVideo ? "Mirror is on (reflection). Click for unmirrored natural view" : "Camera is unmirrored. Click to mirror"}
            title={mirrorVideo ? "Selfie mirror is ON (reflection). Click to unmirror" : "Camera is unmirrored. Click to mirror"}
            className={`w-11.5 h-11.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              mirrorVideo
                ? isLight
                  ? "bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc]"
                  : "bg-[#8ab4f8] text-[#202124] hover:bg-[#a8c7fa]"
                : isLight
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
            }`}
          >
            <FlipHorizontalIcon className="w-5 h-5" />
          </button>
        )}

        {/* Switch Camera (Front / Rear for mobile devices) */}
        {onFlipCamera && (
          <button
            type="button"
            onClick={onFlipCamera}
            aria-label={facingMode === "user" ? "Switch to rear camera" : "Switch to front camera"}
            title={facingMode === "user" ? "Switch to back camera" : "Switch to front selfie camera"}
            className={`w-11.5 h-11.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              isLight
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
            }`}
          >
            <SwitchCameraIcon className="w-5 h-5" />
          </button>
        )}

        {/* Captions (CC) Toggle */}
        <button
          type="button"
          onClick={onToggleCaptions}
          aria-pressed={captionsOn}
          aria-label={captionsOn ? "Turn off captions (C)" : "Turn on captions (C)"}
          title={captionsOn ? "Turn off captions (C)" : "Turn on captions (C)"}
          className={`w-11.5 h-11.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs font-bold text-xs ${
            captionsOn
              ? isLight
                ? "bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc]"
                : "bg-[#8ab4f8] text-[#202124] hover:bg-[#a8c7fa]"
              : isLight
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
          }`}
        >
          <span className="font-sans font-bold tracking-tighter text-sm">CC</span>
        </button>

        {/* Sign Language Recognition Toggle */}
        <button
          type="button"
          onClick={onToggleSignMode}
          aria-pressed={signModeOn}
          aria-label={signModeOn ? "Turn off sign mode (S)" : "Turn on sign mode (S)"}
          title={signModeOn ? "Sign Mode active (S)" : "Sign Mode off (S)"}
          className={`h-11.5 px-3.5 sm:px-4 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-xs text-xs font-bold ${
            signModeOn
              ? isLight
                ? "bg-[#1a73e8] text-white hover:bg-[#1557b0]"
                : "bg-[#8ab4f8] text-[#202124] hover:bg-[#a8c7fa]"
              : isLight
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
          }`}
        >
          <HandSignIcon className="w-4.5 h-4.5" />
          <span className="hidden sm:inline">{signModeOn ? "Sign on" : "Sign"}</span>
        </button>

        {/* AI Sign-to-Speech Translation Toggle */}
        {onToggleAiTranslate && (
          <button
            type="button"
            onClick={onToggleAiTranslate}
            aria-pressed={aiTranslateEnabled}
            aria-label={aiTranslateEnabled ? "Turn off AI sign translation" : "Turn on AI sign translation"}
            title={`AI Translation: ${aiTranslateEnabled ? `Active (${translationTone})` : "Off"}`}
            className={`h-11.5 px-3 sm:px-3.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-xs text-xs font-bold ${
              aiTranslateEnabled
                ? isLight
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200"
                  : "bg-purple-950/80 text-purple-300 hover:bg-purple-900/80 border border-purple-800/60"
                : isLight
                ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                : "bg-[#3c4043] text-gray-400 hover:bg-[#474a4d]"
            }`}
          >
            <span className="text-sm">✨</span>
            <span className="hidden md:inline">{aiTranslateEnabled ? "AI Active" : "AI"}</span>
          </button>
        )}

        {/* Text-to-Speech Voice Toggle */}
        <button
          type="button"
          onClick={onToggleVoice}
          aria-pressed={voiceOn}
          aria-label={voiceOn ? "Turn off speech voice" : "Turn on speech voice"}
          title={voiceOn ? "Voice read-aloud active" : "Voice read-aloud muted"}
          className={`hidden sm:flex w-11.5 h-11.5 rounded-full items-center justify-center transition-all cursor-pointer shadow-xs ${
            voiceOn
              ? isLight
                ? "bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc]"
                : "bg-[#3c4043] text-[#8ab4f8] hover:bg-[#474a4d]"
              : isLight
              ? "bg-gray-100 text-gray-400 hover:bg-gray-200"
              : "bg-[#3c4043] text-gray-400 hover:bg-[#474a4d]"
          }`}
        >
          {voiceOn ? <SpeakerIcon className="w-5 h-5" /> : <SpeakerOffIcon className="w-5 h-5" />}
        </button>

        {/* More Options (...) with Google Meet menu (Adjust view, Fullscreen, Settings) */}
        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen((v) => !v)}
            aria-label="More options"
            title="More options"
            className={`w-11.5 h-11.5 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-xs ${
              isLight
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
            }`}
          >
            <MoreHorizontalIcon className="w-5 h-5" />
          </button>

          {isMoreMenuOpen && (
            <div
              className={`absolute bottom-14 left-1/2 -translate-x-1/2 rounded-2xl p-2 w-64 shadow-2xl flex flex-col gap-1 text-sm z-50 animate-in fade-in zoom-in-95 duration-100 border ${
                isLight
                  ? "bg-white border-gray-200 text-gray-800"
                  : "bg-[#2d2e30] border-white/10 text-gray-200"
              }`}
            >
              {/* Adjust View (Google Meet Change Layout) */}
              {onOpenAdjustView && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenAdjustView();
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-3 cursor-pointer transition-colors ${
                    isLight ? "hover:bg-gray-100 text-gray-800" : "hover:bg-white/10 text-gray-200"
                  }`}
                >
                  <LayoutIcon className="w-4.5 h-4.5 text-[#1a73e8]" />
                  <span>Change layout (Adjust view)</span>
                </button>
              )}

              {/* Fullscreen */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-3 cursor-pointer transition-colors ${
                  isLight ? "hover:bg-gray-100 text-gray-800" : "hover:bg-white/10 text-gray-200"
                }`}
              >
                <MaximizeIcon className="w-4.5 h-4.5 text-[#1a73e8]" />
                <span>Full screen</span>
              </button>

              {/* Picture in picture */}
              <button
                type="button"
                onClick={handleTogglePiP}
                className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-3 cursor-pointer transition-colors ${
                  isLight ? "hover:bg-gray-100 text-gray-800" : "hover:bg-white/10 text-gray-200"
                }`}
              >
                <PictureInPictureIcon className="w-4.5 h-4.5 text-[#1a73e8]" />
                <span>Picture-in-picture</span>
              </button>

              {/* Theme toggle from menu */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onToggleTheme();
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-3 cursor-pointer transition-colors ${
                    isLight ? "hover:bg-gray-100 text-gray-800" : "hover:bg-white/10 text-gray-200"
                  }`}
                >
                  {isLight ? (
                    <>
                      <MoonIcon className="w-4.5 h-4.5 text-indigo-500" />
                      <span>Switch to Black theme</span>
                    </>
                  ) : (
                    <>
                      <SunIcon className="w-4.5 h-4.5 text-amber-400" />
                      <span>Switch to White theme</span>
                    </>
                  )}
                </button>
              )}

              {/* Mobile Join */}
              {onOpenMobileJoin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenMobileJoin();
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-3 cursor-pointer transition-colors ${
                    isLight ? "hover:bg-gray-100 text-gray-800" : "hover:bg-white/10 text-gray-200"
                  }`}
                >
                  <SmartphoneIcon className="w-4.5 h-4.5 text-[#1a73e8]" />
                  <span>Join from Mobile Phone</span>
                </button>
              )}

              {/* Settings */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenSettings();
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-3 cursor-pointer transition-colors border-t mt-1 pt-2 ${
                  isLight
                    ? "hover:bg-gray-100 text-gray-800 border-gray-200"
                    : "hover:bg-white/10 text-gray-200 border-white/10"
                }`}
              >
                <SettingsIcon className="w-4.5 h-4.5 text-[#1a73e8]" />
                <span>Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* End Call Button (Google Meet Red Pill) */}
        <button
          type="button"
          onClick={onLeaveCall}
          aria-label="Leave call"
          title="Leave call"
          className="h-11.5 px-5 sm:px-6 rounded-full bg-[#ea4335] hover:bg-[#d93025] text-white font-semibold text-sm flex items-center gap-2 cursor-pointer transition-all shadow-md shrink-0"
        >
          <PhoneOffIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* Right: People & Chat toggle buttons */}
      <div className="hidden lg:flex items-center gap-2 min-w-[180px] justify-end">
        {onOpenMobileJoin && (
          <button
            type="button"
            onClick={onOpenMobileJoin}
            title="Join on phone (same Wi-Fi)"
            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              isLight ? "hover:bg-gray-100 text-gray-600 hover:text-black" : "hover:bg-white/10 text-gray-300 hover:text-white"
            }`}
          >
            <SmartphoneIcon className="w-5 h-5 text-[#1a73e8]" />
          </button>
        )}

        {/* Participants Sidebar Toggle */}
        <button
          type="button"
          onClick={() => onToggleSidebarTab("participants")}
          aria-pressed={activeSidebarTab === "participants"}
          title="Participants"
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors relative ${
            activeSidebarTab === "participants"
              ? isLight
                ? "bg-[#e8f0fe] text-[#1a73e8]"
                : "bg-[#8ab4f8] text-[#202124]"
              : isLight
              ? "hover:bg-gray-100 text-gray-600 hover:text-black"
              : "hover:bg-white/10 text-gray-300 hover:text-white"
          }`}
        >
          <UsersIcon className="w-5 h-5" />
          {participantCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                isLight ? "bg-[#1a73e8] text-white" : "bg-[#8ab4f8] text-[#202124]"
              }`}
            >
              {participantCount}
            </span>
          )}
        </button>

        {/* Transcript / Chat Sidebar Toggle */}
        <button
          type="button"
          onClick={() => onToggleSidebarTab("transcript")}
          aria-pressed={activeSidebarTab === "transcript"}
          title="Chat & Live Transcript"
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors relative ${
            activeSidebarTab === "transcript"
              ? isLight
                ? "bg-[#e8f0fe] text-[#1a73e8]"
                : "bg-[#8ab4f8] text-[#202124]"
              : isLight
              ? "hover:bg-gray-100 text-gray-600 hover:text-black"
              : "hover:bg-white/10 text-gray-300 hover:text-white"
          }`}
        >
          <MessageSquareIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-[#ea4335] text-white px-1.5 py-0.2 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
