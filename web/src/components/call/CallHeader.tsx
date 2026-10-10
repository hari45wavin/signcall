"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  HandSignIcon,
  CopyIcon,
  CheckIcon,
  GridIcon,
  SpotlightIcon,
  SmartphoneIcon,
  SunIcon,
  MoonIcon,
  LayoutIcon,
} from "@/components/common/Icons";

interface CallHeaderProps {
  roomId: string;
  title: string;
  onTitleChange?: (newTitle: string) => void;
  captionsOn: boolean;
  onToggleCaptions: () => void;
  isGridView: boolean;
  onToggleGridView: () => void;
  onOpenMobileJoin?: () => void;
  onOpenAdjustView?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  onBack: () => void;
}

export function CallHeader({
  roomId,
  title,
  onTitleChange,
  captionsOn,
  onToggleCaptions,
  isGridView,
  onToggleGridView,
  onOpenMobileJoin,
  onOpenAdjustView,
  theme = "light",
  onToggleTheme,
  onBack,
}: CallHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [time, setTime] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [customTitle, setCustomTitle] = useState(title);

  const isLight = theme === "light";

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, []);

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

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (customTitle.trim() && onTitleChange) {
      onTitleChange(customTitle.trim());
    }
  };

  return (
    <header
      className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b select-none transition-colors ${
        isLight
          ? "bg-white border-gray-200 text-[#202124]"
          : "bg-[#1e2024] border-white/10 text-white"
      }`}
    >
      {/* Left section: Back button & Title / Room Info */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Lobby"
          title="Back to Lobby"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            isLight
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
          }`}
        >
          <ArrowLeftIcon className="w-4.5 h-4.5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <input
                type="text"
                value={customTitle}
                autoFocus
                onChange={(e) => setCustomTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleBlur();
                }}
                className={`text-base font-semibold px-2 py-0.5 rounded border outline-none ${
                  isLight
                    ? "text-black bg-gray-100 border-gray-300"
                    : "text-white bg-[#2d2e30] border-white/20"
                }`}
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename call"
                className={`text-base font-semibold m-0 cursor-pointer hover:underline decoration-dashed ${
                  isLight ? "text-gray-900 decoration-gray-400" : "text-white decoration-gray-400"
                }`}
              >
                {customTitle}
              </h1>
            )}

            {captionsOn && (
              <span
                className={`inline-flex items-center gap-1 h-5.5 px-2 rounded-full text-[11px] font-semibold ${
                  isLight
                    ? "bg-[#e8f0fe] text-[#1a73e8]"
                    : "bg-[#8ab4f8]/20 text-[#8ab4f8]"
                }`}
              >
                <HandSignIcon className="w-3 h-3" />
                Live CC
              </span>
            )}
          </div>

          <span className={`text-xs ${isLight ? "text-gray-500" : "text-gray-400"}`}>
            {roomId} · {time || "16:50"}
          </span>
        </div>
      </div>

      {/* Right section: Theme toggle, Mobile join, Adjust view & Copy invite link */}
      <div className="flex items-center gap-2">
        {/* Instant Theme Toggle (Sun / Moon) */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            title={isLight ? "Switch to Dark theme (Black)" : "Switch to Light theme (White)"}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? "bg-gray-100 text-amber-500 hover:bg-gray-200"
                : "bg-[#3c4043] text-indigo-300 hover:bg-[#474a4d]"
            }`}
          >
            {isLight ? <MoonIcon className="w-4.5 h-4.5 text-gray-700" /> : <SunIcon className="w-4.5 h-4.5 text-amber-400" />}
          </button>
        )}

        {/* Adjust View / Change Layout Modal */}
        {onOpenAdjustView && (
          <button
            type="button"
            onClick={onOpenAdjustView}
            title="Adjust layout view"
            className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
              isLight
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-[#3c4043] hover:bg-[#474a4d] text-white"
            }`}
          >
            <LayoutIcon className={`w-4 h-4 ${isLight ? "text-[#1a73e8]" : "text-[#8ab4f8]"}`} />
            <span className="hidden sm:inline">Adjust view</span>
          </button>
        )}

        {onOpenMobileJoin && (
          <button
            type="button"
            onClick={onOpenMobileJoin}
            title="Join on Mobile Phone"
            className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
              isLight
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-[#3c4043] hover:bg-[#474a4d] text-white"
            }`}
          >
            <SmartphoneIcon className={`w-4 h-4 ${isLight ? "text-[#1a73e8]" : "text-[#8ab4f8]"}`} />
            <span className="hidden sm:inline">Join on Phone</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleGridView}
          title={isGridView ? "Switch to Spotlight view" : "Switch to Grid view"}
          className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
            isLight
              ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
              : "bg-[#3c4043] hover:bg-[#474a4d] text-white"
          }`}
        >
          {isGridView ? (
            <>
              <SpotlightIcon className={`w-4 h-4 ${isLight ? "text-[#1a73e8]" : "text-[#8ab4f8]"}`} />
              <span className="hidden sm:inline">Spotlight</span>
            </>
          ) : (
            <>
              <GridIcon className={`w-4 h-4 ${isLight ? "text-gray-600" : "text-gray-300"}`} />
              <span className="hidden sm:inline">Grid</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className={`h-9 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            isLight
              ? "bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-xs"
              : "bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#202124] shadow-xs"
          }`}
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
