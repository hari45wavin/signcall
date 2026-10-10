"use client";

import { useEffect, useState } from "react";
import {
  XIcon,
  SettingsIcon,
  CaptionsIcon,
  SpeakerIcon,
  FlipHorizontalIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  VolumeXIcon,
} from "@/components/common/Icons";
import { getVoicesAsync, testVoice } from "@/lib/tts";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
  captionSize: number;
  onCaptionSizeChange: (size: number) => void;
  voiceName: string;
  onVoiceNameChange: (name: string) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  signLanguage: string;
  onSignLanguageChange: (lang: string) => void;
  mirrorVideo?: boolean;
  onToggleMirrorVideo?: (val: boolean) => void;
  // Host management
  isHost?: boolean;
  hostManagementEnabled?: boolean;
  onToggleHostManagement?: (val: boolean) => void;
  allowParticipantVideo?: boolean;
  onToggleParticipantVideo?: (val: boolean) => void;
  allowParticipantAudio?: boolean;
  onToggleParticipantAudio?: (val: boolean) => void;
  allowParticipantChat?: boolean;
  onToggleParticipantChat?: (val: boolean) => void;
  onMuteAll?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  theme = "light",
  onThemeChange,
  captionSize,
  onCaptionSizeChange,
  voiceName,
  onVoiceNameChange,
  speechRate,
  onSpeechRateChange,
  signLanguage,
  onSignLanguageChange,
  mirrorVideo = true,
  onToggleMirrorVideo,
  isHost = true,
  hostManagementEnabled = true,
  onToggleHostManagement,
  allowParticipantVideo = true,
  onToggleParticipantVideo,
  allowParticipantAudio = true,
  onToggleParticipantAudio,
  allowParticipantChat = true,
  onToggleParticipantChat,
  onMuteAll,
}: SettingsModalProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | "audio" | "host">("general");
  const isLight = theme === "light";

  // Async voice retrieval with fallback
  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;

    getVoicesAsync().then((loaded) => {
      if (active && loaded.length > 0) {
        setVoices(loaded);
      }
    });

    const handler = () => {
      if (window.speechSynthesis) {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0) setVoices(v);
      }
    };
    if (window.speechSynthesis) {
      window.speechSynthesis.addEventListener("voiceschanged", handler);
    }
    return () => {
      active = false;
      if (window.speechSynthesis) {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className={`w-full max-w-xl rounded-[28px] shadow-2xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto border transition-colors ${
          isLight
            ? "bg-white text-[#202124] border-black/10"
            : "bg-[#282a2d] text-white border-white/10"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-current/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isLight ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-[#8ab4f8]/20 text-[#8ab4f8]"
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-xl font-bold m-0">
                Call Settings
              </h2>
              <p className={`text-xs m-0 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                Customize theme, accessibility, voices, and host management
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              isLight ? "text-gray-500 hover:bg-gray-100" : "text-gray-400 hover:bg-white/10"
            }`}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-2 border-b pb-2 border-current/10">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "general"
                ? isLight
                  ? "bg-[#1a73e8] text-white"
                  : "bg-[#8ab4f8] text-[#202124]"
                : isLight
                ? "text-gray-600 hover:bg-gray-100"
                : "text-gray-400 hover:bg-white/10"
            }`}
          >
            General & Theme
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audio")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "audio"
                ? isLight
                  ? "bg-[#1a73e8] text-white"
                  : "bg-[#8ab4f8] text-[#202124]"
                : isLight
                ? "text-gray-600 hover:bg-gray-100"
                : "text-gray-400 hover:bg-white/10"
            }`}
          >
            Voice & Captions
          </button>

          {isHost && (
            <button
              type="button"
              onClick={() => setActiveTab("host")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "host"
                  ? isLight
                    ? "bg-[#1a73e8] text-white"
                    : "bg-[#8ab4f8] text-[#202124]"
                  : isLight
                  ? "text-gray-600 hover:bg-gray-100"
                  : "text-gray-400 hover:bg-white/10"
              }`}
            >
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span>Host Controls</span>
            </button>
          )}
        </div>

        {/* Tab 1: General & Theme */}
        {activeTab === "general" && (
          <div className="flex flex-col gap-5">
            {/* Theme Switcher */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-current">Call Appearance Theme</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onThemeChange?.("light")}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                    isLight
                      ? "border-[#1a73e8] bg-[#e8f0fe]/50 ring-2 ring-[#1a73e8]/20"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <SunIcon className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="text-sm font-bold text-gray-900">White (Light)</div>
                      <div className="text-[11px] text-gray-500">Default clean theme</div>
                    </div>
                  </div>
                  {isLight && <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8]" />}
                </button>

                <button
                  type="button"
                  onClick={() => onThemeChange?.("dark")}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                    !isLight
                      ? "border-[#8ab4f8] bg-[#8ab4f8]/10 ring-2 ring-[#8ab4f8]/20"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MoonIcon className="w-5 h-5 text-indigo-400" />
                    <div>
                      <div className={`text-sm font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Black (Dark)</div>
                      <div className="text-[11px] text-gray-400">Google Meet theater</div>
                    </div>
                  </div>
                  {!isLight && <span className="w-2.5 h-2.5 rounded-full bg-[#8ab4f8]" />}
                </button>
              </div>
            </div>

            {/* Selfie Mirroring */}
            <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#202124] border-white/10"}`}>
              <label className="text-sm font-semibold text-current flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2">
                  <FlipHorizontalIcon className="w-4.5 h-4.5 text-[#1a73e8]" />
                  Mirror local camera (selfie reflection)
                </span>
                <input
                  type="checkbox"
                  checked={mirrorVideo}
                  onChange={(e) => onToggleMirrorVideo?.(e.target.checked)}
                  className="w-5 h-5 rounded accent-[#1a73e8] cursor-pointer"
                />
              </label>
              <p className={`text-xs m-0 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                {mirrorVideo
                  ? "Selfie mirror is ON (natural mirror reflection). Your gestures match your view."
                  : "Unmirrored (natural direction). Click to enable selfie mirror reflection."}
              </p>
            </div>

            {/* Sign Language Dictionary */}
            <div className="flex flex-col gap-2">
              <label htmlFor="lang-select" className="text-sm font-semibold text-current">
                Sign Language Vocabulary System
              </label>
              <select
                id="lang-select"
                value={signLanguage}
                onChange={(e) => onSignLanguageChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                  isLight
                    ? "bg-white border-gray-300 text-gray-900 focus:border-[#1a73e8]"
                    : "bg-[#202124] border-white/20 text-white focus:border-[#8ab4f8]"
                }`}
              >
                <option value="ASL">American Sign Language (ASL - 26 A-Z + Space/Del)</option>
                <option value="ISL">Indian Sign Language (ISL - Preview)</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab 2: Voice & Captions */}
        {activeTab === "audio" && (
          <div className="flex flex-col gap-5">
            {/* Caption Size Slider */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label htmlFor="caption-size-slider" className="text-sm font-semibold text-current flex items-center gap-2">
                  <CaptionsIcon className="w-4.5 h-4.5 text-[#1a73e8]" />
                  Caption Font Size
                </label>
                <span
                  className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
                    isLight ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-[#8ab4f8]/20 text-[#8ab4f8]"
                  }`}
                >
                  {captionSize}px
                </span>
              </div>

              <input
                id="caption-size-slider"
                type="range"
                min={22}
                max={44}
                step={1}
                value={captionSize}
                onChange={(e) => onCaptionSizeChange(Number(e.target.value))}
                className="w-full accent-[#1a73e8] cursor-pointer"
              />

              {/* Preview Box */}
              <div
                className={`p-3.5 rounded-xl border ${
                  isLight ? "bg-gray-50 border-gray-200" : "bg-[#202124] border-white/10"
                }`}
              >
                <span className="text-[11px] text-gray-400 block mb-1">Live caption preview:</span>
                <p
                  className="m-0 font-bold leading-tight"
                  style={{
                    fontSize: `${captionSize}px`,
                  }}
                >
                  SignCall real-time translation
                </p>
              </div>
            </div>

            {/* TTS Voice Selector */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label htmlFor="voice-select" className="text-sm font-semibold text-current flex items-center gap-2">
                  <SpeakerIcon className="w-4.5 h-4.5 text-[#1a73e8]" />
                  Text-to-Speech Voice
                </label>
                <button
                  type="button"
                  onClick={() => testVoice(voiceName, speechRate)}
                  className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer transition-all flex items-center gap-1 ${
                    isLight
                      ? "bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc]"
                      : "bg-[#8ab4f8]/20 text-[#8ab4f8] hover:bg-[#8ab4f8]/30"
                  }`}
                >
                  🔊 Test Voice
                </button>
              </div>

              <select
                id="voice-select"
                value={voiceName}
                onChange={(e) => onVoiceNameChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                  isLight
                    ? "bg-white border-gray-300 text-gray-900 focus:border-[#1a73e8]"
                    : "bg-[#202124] border-white/20 text-white focus:border-[#8ab4f8]"
                }`}
              >
                <option value="">Default system voice</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between text-sm">
                <span className={`text-xs ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                  Speech Rate: {speechRate}x
                </span>
                <div className="flex gap-2">
                  {[0.8, 1.0, 1.2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => onSpeechRateChange(rate)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        speechRate === rate
                          ? isLight
                            ? "bg-[#1a73e8] text-white"
                            : "bg-[#8ab4f8] text-[#202124]"
                          : isLight
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Host Management (Google Meet feature) */}
        {activeTab === "host" && isHost && (
          <div className="flex flex-col gap-4">
            {/* Master Switch */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isLight ? "bg-[#e8f0fe]/40 border-[#1a73e8]/30" : "bg-[#8ab4f8]/10 border-[#8ab4f8]/30"
              }`}
            >
              <div>
                <h4 className="text-sm font-bold m-0 text-current">Host Management</h4>
                <p className={`text-xs m-0 mt-0.5 ${isLight ? "text-gray-600" : "text-gray-300"}`}>
                  Lets you restrict what participants can do in the call
                </p>
              </div>
              <input
                type="checkbox"
                checked={hostManagementEnabled}
                onChange={(e) => onToggleHostManagement?.(e.target.checked)}
                className="w-5 h-5 rounded accent-[#1a73e8] cursor-pointer"
              />
            </div>

            {/* Participant permissions */}
            <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#202124] border-white/10"}`}>
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 m-0">
                Let participants
              </h5>

              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span>Turn on their video</span>
                <input
                  type="checkbox"
                  disabled={!hostManagementEnabled}
                  checked={allowParticipantVideo}
                  onChange={(e) => onToggleParticipantVideo?.(e.target.checked)}
                  className="w-4.5 h-4.5 rounded accent-[#1a73e8] cursor-pointer disabled:opacity-40"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span>Turn on their microphone</span>
                <input
                  type="checkbox"
                  disabled={!hostManagementEnabled}
                  checked={allowParticipantAudio}
                  onChange={(e) => onToggleParticipantAudio?.(e.target.checked)}
                  className="w-4.5 h-4.5 rounded accent-[#1a73e8] cursor-pointer disabled:opacity-40"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span>Send chat messages</span>
                <input
                  type="checkbox"
                  disabled={!hostManagementEnabled}
                  checked={allowParticipantChat}
                  onChange={(e) => onToggleParticipantChat?.(e.target.checked)}
                  className="w-4.5 h-4.5 rounded accent-[#1a73e8] cursor-pointer disabled:opacity-40"
                />
              </label>
            </div>

            {/* Quick Host Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 m-0">
                Host actions
              </h5>
              <button
                type="button"
                onClick={() => {
                  onMuteAll?.();
                  alert("All remote participants muted.");
                }}
                className={`py-2.5 px-4 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  isLight
                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                }`}
              >
                <VolumeXIcon className="w-4 h-4" />
                <span>Mute all participants</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 rounded-full font-bold text-sm cursor-pointer transition-all ${
              isLight
                ? "bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-sm"
                : "bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#202124] shadow-sm"
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
