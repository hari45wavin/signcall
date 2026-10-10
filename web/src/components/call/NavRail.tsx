"use client";

import Link from "next/link";
import { HandSignIcon, HomeIcon, VideoIcon, HistoryIcon, SettingsIcon } from "@/components/common/Icons";

interface NavRailProps {
  onOpenSettings: () => void;
  onOpenHistory?: () => void;
}

export function NavRail({ onOpenSettings, onOpenHistory }: NavRailProps) {
  return (
    <nav
      className="hidden md:flex flex-col items-center flex-shrink-0 w-[72px] gap-7 pt-1.5"
      aria-label="App Navigation"
    >
      {/* Brand logo */}
      <Link
        href="/"
        className="w-14 h-14 rounded-full bg-[#2F62E8] text-white flex items-center justify-center shadow-sm hover:opacity-95 transition-all"
        title="SignCall Home"
      >
        <HandSignIcon className="w-6 h-6" />
      </Link>

      {/* Nav items */}
      <div className="flex flex-col items-center gap-3.5 mt-8">
        <Link
          href="/"
          className="w-12 h-12 rounded-full text-[#8A919E] hover:text-[#111827] hover:bg-[#F4F5F7] flex items-center justify-center transition-colors"
          title="Home"
          aria-label="Home"
        >
          <HomeIcon className="w-5 h-5" />
        </Link>

        <button
          type="button"
          aria-current="page"
          className="w-12 h-12 rounded-full bg-[#EAF0FF] text-[#2F62E8] flex items-center justify-center transition-colors shadow-xs"
          title="Active Call"
          aria-label="Active Call"
        >
          <VideoIcon className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenHistory}
          className="w-12 h-12 rounded-full text-[#8A919E] hover:text-[#111827] hover:bg-[#F4F5F7] flex items-center justify-center transition-colors"
          title="Call History & Transcripts"
          aria-label="History"
        >
          <HistoryIcon className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="w-12 h-12 rounded-full text-[#8A919E] hover:text-[#111827] hover:bg-[#F4F5F7] flex items-center justify-center transition-colors"
          title="Settings & Accessibility"
          aria-label="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
