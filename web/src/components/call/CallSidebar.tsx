"use client";

import { useState } from "react";
import type { ParticipantInfo } from "./SpeakerStage";
import {
  SendIcon,
  UsersIcon,
  MessageSquareIcon,
  HandSignIcon,
  XIcon,
  VolumeXIcon,
  UserXIcon,
  ShieldCheckIcon,
} from "@/components/common/Icons";

export interface TranscriptEntry {
  id: string;
  who: string;
  mode: "Spoken" | "Signed" | "Typed" | "Signing now";
  time: string;
  text: string;
  bubbleBg: string;
  textColor: string;
}

interface CallSidebarProps {
  participants: ParticipantInfo[];
  entries: TranscriptEntry[];
  activeTab: "participants" | "transcript" | "sign" | null;
  onTabChange: (tab: "participants" | "transcript" | "sign") => void;
  onSendMessage: (text: string) => void;
  onClose?: () => void;
  theme?: "light" | "dark";
  isHost?: boolean;
  onMuteParticipant?: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
  onMuteAll?: () => void;
}

export function CallSidebar({
  participants,
  entries,
  activeTab,
  onTabChange,
  onSendMessage,
  onClose,
  theme = "light",
  isHost = true,
  onMuteParticipant,
  onRemoveParticipant,
  onMuteAll,
}: CallSidebarProps) {
  const [typedText, setTypedText] = useState("");
  const isLight = theme === "light";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedText.trim()) return;
    onSendMessage(typedText.trim());
    setTypedText("");
  };

  const handleDownloadTranscript = () => {
    const textContent = entries
      .map((entry) => `[${entry.time}] ${entry.who} (${entry.mode}): ${entry.text}`)
      .join("\n\n");
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signcall-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Default to transcript tab if null
  const currentTab = activeTab ?? "transcript";

  return (
    <aside
      className={`w-full lg:w-[360px] xl:w-[380px] flex-shrink-0 flex flex-col justify-between border-l p-4 transition-all select-none ${
        isLight
          ? "bg-white text-[#202124] border-gray-200"
          : "bg-[#202124] text-white border-white/10"
      }`}
    >
      {/* Top Tabs Switcher */}
      <div>
        <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-gray-200" : "border-white/10"}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTabChange("participants")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                currentTab === "participants"
                  ? isLight
                    ? "bg-[#1a73e8] text-white shadow-xs"
                    : "bg-[#8ab4f8] text-[#202124] shadow-xs"
                  : isLight
                  ? "text-gray-600 hover:text-black hover:bg-gray-100"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              <span>People</span>
              <span
                className={`min-w-[18px] h-4.5 px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center ${
                  currentTab === "participants"
                    ? isLight
                      ? "bg-white text-[#1a73e8]"
                      : "bg-[#202124] text-white"
                    : isLight
                    ? "bg-gray-200 text-gray-700"
                    : "bg-white/10 text-gray-300"
                }`}
              >
                {participants.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("transcript")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                currentTab === "transcript"
                  ? isLight
                    ? "bg-[#1a73e8] text-white shadow-xs"
                    : "bg-[#8ab4f8] text-[#202124] shadow-xs"
                  : isLight
                  ? "text-gray-600 hover:text-black hover:bg-gray-100"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <MessageSquareIcon className="w-4 h-4" />
              <span>Chat & CC</span>
              <span
                className={`min-w-[18px] h-4.5 px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center ${
                  currentTab === "transcript"
                    ? isLight
                      ? "bg-white text-[#1a73e8]"
                      : "bg-[#202124] text-white"
                    : isLight
                    ? "bg-gray-200 text-gray-700"
                    : "bg-white/10 text-gray-300"
                }`}
              >
                {entries.length}
              </span>
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                isLight ? "text-gray-500 hover:bg-gray-100" : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main Content Pane */}
        <div className="overflow-y-auto max-h-[calc(100vh-230px)] pt-3 pr-1 flex flex-col gap-4">
          {currentTab === "participants" ? (
            /* Participants Section with Google Meet Host Controls */
            <section aria-labelledby="sc-people" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 id="sc-people" className={`text-sm font-semibold m-0 ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                  In this call ({participants.length})
                </h2>

                {isHost && participants.length > 1 && onMuteAll && (
                  <button
                    type="button"
                    onClick={onMuteAll}
                    title="Mute everyone in this call"
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isLight
                        ? "border-red-200 text-red-600 hover:bg-red-50"
                        : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                    }`}
                  >
                    <VolumeXIcon className="w-3.5 h-3.5" />
                    <span>Mute all</span>
                  </button>
                )}
              </div>

              {/* Host management badge */}
              {isHost && (
                <div
                  className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border ${
                    isLight
                      ? "bg-[#e8f0fe]/60 border-[#1a73e8]/20 text-[#1a73e8]"
                      : "bg-[#8ab4f8]/10 border-[#8ab4f8]/20 text-[#8ab4f8]"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheckIcon className="w-4 h-4" />
                    Host management is on
                  </span>
                  <span className="text-[11px] font-bold">You are Host</span>
                </div>
              )}

              <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
                {participants.map((p) => {
                  return (
                    <li
                      key={p.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                        isLight ? "hover:bg-gray-100" : "hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border ${
                          isLight ? "bg-gray-200 text-gray-800 border-gray-300" : "bg-[#3c4043] text-white border-white/10"
                        }`}
                      >
                        {p.initial}
                      </span>
                      <div className="flex flex-col mr-auto min-w-0">
                        <span className="text-sm font-medium truncate text-current">
                          {p.name} {p.isLocal ? "(You)" : ""}
                        </span>
                        <span className={`text-xs ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                          {p.isSigning ? "Signing active" : p.isMuted ? "Muted" : p.isSpeaking ? "Speaking" : "Active"}
                        </span>
                      </div>

                      {/* Host Actions on remote participants */}
                      {!p.isLocal && isHost && (
                        <div className="flex items-center gap-1">
                          {onMuteParticipant && (
                            <button
                              type="button"
                              onClick={() => onMuteParticipant(p.id)}
                              title={`Mute ${p.name}`}
                              className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                                isLight
                                  ? "text-gray-600 hover:text-red-600 hover:bg-gray-200"
                                  : "text-gray-400 hover:text-red-400 hover:bg-white/10"
                              }`}
                            >
                              <VolumeXIcon className="w-4 h-4" />
                            </button>
                          )}

                          {onRemoveParticipant && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Remove ${p.name} from the call?`)) {
                                  onRemoveParticipant(p.id);
                                }
                              }}
                              title={`Remove ${p.name} from call`}
                              className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                                isLight
                                  ? "text-gray-600 hover:text-red-600 hover:bg-red-50"
                                  : "text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                              }`}
                            >
                              <UserXIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : (
            /* Transcript Section */
            <section aria-labelledby="sc-transcript" className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <h2 id="sc-transcript" className={`text-sm font-semibold m-0 ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                  Live Transcript & Chat
                </h2>
                <button
                  type="button"
                  onClick={handleDownloadTranscript}
                  className={`text-xs cursor-pointer hover:underline ${isLight ? "text-[#1a73e8]" : "text-[#8ab4f8]"}`}
                >
                  Download (.txt)
                </button>
              </div>

              {entries.length === 0 ? (
                <div
                  className={`flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border mt-2 ${
                    isLight ? "bg-gray-50 border-gray-200" : "bg-white/5 border-white/10"
                  }`}
                >
                  <MessageSquareIcon className={`w-8 h-8 mb-2 ${isLight ? "text-gray-400" : "text-gray-500"}`} />
                  <p className={`text-xs font-semibold m-0 ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                    No messages yet
                  </p>
                  <p className={`text-[11px] m-0 mt-1 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                    Signed captions and typed messages will appear here.
                  </p>
                </div>
              ) : (
                <ol className="list-none m-0 p-0 flex flex-col gap-3">
                  {entries.map((item) => (
                    <li key={item.id} className="flex flex-col gap-1">
                      <div className={`flex items-center gap-1.5 text-xs ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                        <span className={`font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>{item.who}</span>
                        <span>·</span>
                        <span
                          className={`inline-flex items-center gap-1 ${
                            item.mode === "Signed" || item.mode === "Signing now"
                              ? isLight
                                ? "text-[#1a73e8] font-bold"
                                : "text-[#8ab4f8] font-bold"
                              : ""
                          }`}
                        >
                          {item.mode === "Signed" && <HandSignIcon className="w-3 h-3" />}
                          {item.mode}
                        </span>
                        <span>·</span>
                        <span>{item.time}</span>
                      </div>

                      <p
                        className={`m-0 p-3 rounded-xl text-sm leading-relaxed border ${
                          item.mode === "Signed"
                            ? isLight
                              ? "bg-[#e8f0fe] text-[#1f2937] border-[#1a73e8]/20"
                              : "bg-[#1f2d47] text-white border-[#8ab4f8]/20"
                            : isLight
                            ? "bg-gray-100 text-gray-800 border-gray-200"
                            : "bg-[#2d2e30] text-gray-100 border-white/5"
                        }`}
                      >
                        {item.text}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Bottom: "Type instead of signing" input */}
      <form
        onSubmit={handleSend}
        className={`flex items-center gap-2 p-1.5 pl-4 rounded-full border shadow-sm mt-3 ${
          isLight ? "bg-gray-100 border-gray-300" : "bg-[#2d2e30] border-white/10"
        }`}
      >
        <label htmlFor="sc-type-input" className="sr-only">
          Type a message
        </label>
        <input
          id="sc-type-input"
          type="text"
          placeholder="Send a message to call…"
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          className={`flex-1 min-w-0 border-none bg-transparent text-sm outline-none ${
            isLight ? "text-black placeholder:text-gray-500" : "text-white placeholder:text-gray-400"
          }`}
        />
        <button
          type="submit"
          aria-label="Send message"
          title="Send message"
          disabled={!typedText.trim()}
          className={`w-9 h-9 rounded-full disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
            isLight
              ? "bg-[#1a73e8] hover:bg-[#1557b0] text-white"
              : "bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#202124]"
          }`}
        >
          <SendIcon className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
}
