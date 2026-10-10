"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { newRoomId } from "@/lib/roomId";
import {
  HandSignIcon,
  VideoIcon,
  CaptionsIcon,
  SpeakerIcon,
  UsersIcon,
  CheckIcon,
  MoreHorizontalIcon,
} from "@/components/common/Icons";
import { CheatSheetModal } from "@/components/sign/CheatSheetModal";

export default function LandingPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);

  // Live interactive preview card state
  const [demoCaptionSize, setDemoCaptionSize] = useState(28);
  const [demoSignOn, setDemoSignOn] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStartCall = () => {
    const id = newRoomId();
    window.location.assign(`/room/${id}?host=1`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim().split("/").pop();
    if (cleaned) {
      window.location.assign(`/room/${cleaned}`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col justify-between selection:bg-[#EAF0FF] selection:text-[#2F62E8]">
      {/* 1. Google Meet-style Top Navbar */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#2F62E8] text-white flex items-center justify-center shadow-xs">
            <HandSignIcon className="w-6 h-6" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#111827]">SignCall</span>
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EAF0FF] text-[#2349C7]">
              Accessible Meet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium text-[#6B7280]">
          <span className="hidden md:inline-block">{timeStr || "10:45 AM • Sat, Oct 10"}</span>

          <button
            type="button"
            onClick={() => setIsCheatSheetOpen(true)}
            className="px-3.5 py-2 rounded-full hover:bg-[#F4F5F7] text-[#111827] font-semibold text-xs transition-colors cursor-pointer border border-gray-200"
          >
            Signs Guide
          </button>

          <Link
            href="/room/hack-sign-42"
            className="hidden sm:inline-flex px-3.5 py-2 rounded-full bg-[#F4F5F7] hover:bg-gray-200 text-[#111827] font-semibold text-xs transition-colors cursor-pointer"
          >
            Try Demo Room
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (Two-Column Layout) */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
        {/* Left Column: Heading and Action Bar */}
        <div className="w-full lg:max-w-xl flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF0FF] text-[#2349C7] text-xs font-bold w-fit">
            <HandSignIcon className="w-4 h-4" />
            Sign Language Mode • Real-Time Captions • TTS
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.12] text-[#111827]">
            Video calls where sign language becomes live captions and speech.
          </h1>

          <p className="text-lg sm:text-xl text-[#6B7280] leading-relaxed">
            A Google Meet-style platform designed for everyone. Hand signs are recognized in real time,
            displayed as live captions, and spoken aloud using browser speech synthesis.
          </p>

          {/* Action Row: Start Call & Join Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={handleStartCall}
              className="h-13 px-7 rounded-full bg-[#2F62E8] hover:bg-[#2552c7] text-white text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer flex-shrink-0"
            >
              <VideoIcon className="w-5 h-5" />
              <span>Start a new call</span>
            </button>

            <form onSubmit={handleJoin} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter a code or link"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-13 rounded-full border border-gray-300 bg-[#F4F5F7] px-5 text-base text-[#111827] placeholder:text-gray-400 outline-none focus:border-[#2F62E8] focus:bg-white transition-all shadow-2xs"
                  aria-label="Invite link or room code"
                />
              </div>

              <button
                type="submit"
                disabled={!code.trim()}
                className="h-13 px-6 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-base text-[#111827] shadow-2xs transition-all cursor-pointer"
              >
                Join
              </button>
            </form>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <span>No sign-in required.</span>
            <span>•</span>
            <Link
              href="/room/hack-sign-42"
              className="text-[#2F62E8] font-semibold hover:underline cursor-pointer"
            >
              Click here to test instant demo room &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Interactive In-Call Showcase Card */}
        <div className="w-full lg:max-w-lg xl:max-w-xl">
          <div className="relative bg-[#F4F5F7] rounded-[32px] p-5 sm:p-7 shadow-xl border border-black/5 flex flex-col gap-4">
            {/* Window Top Bar */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-[#6B7280] ml-2">
                  SignCall In-Call Preview
                </span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF0FF] text-[#2349C7] font-semibold">
                Live demo
              </span>
            </div>

            {/* Video Preview Card */}
            <div className="relative rounded-[22px] overflow-hidden bg-[#DCE1E8] h-72 sm:h-80 flex items-end justify-center">
              {/* Silhouette Avatar */}
              <svg viewBox="0 0 200 200" className="w-[44%] max-w-[240px] h-auto pb-2" aria-hidden="true">
                <circle cx="100" cy="80" r="36" fill="#C6CDD8" />
                <path d="M24 204c0-46 34-78 76-78s76 32 76 78z" fill="#C6CDD8" />
              </svg>

              {/* Speaker & Status Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="inline-flex items-center h-8 px-3 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-xs">
                  Speaker
                </span>
                {demoSignOn && (
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#2F62E8] text-white text-xs font-semibold shadow-xs">
                    <HandSignIcon className="w-3.5 h-3.5" />
                    Signing
                  </span>
                )}
              </div>

              {/* Floating Caption Card */}
              <div className="absolute left-0 right-0 bottom-4 flex justify-center px-4">
                <div className="w-full max-w-[480px] bg-white rounded-2xl p-4 shadow-lg border border-black/5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280]">
                    <span>Live captions · read aloud when finished</span>
                  </div>
                  <p
                    className="m-0 font-bold leading-snug text-[#111827]"
                    style={{
                      fontFamily: "var(--font-caption), Atkinson Hyperlegible, sans-serif",
                      fontSize: `${demoCaptionSize}px`,
                    }}
                  >
                    <span>Hello, how are </span>
                    <span className="text-[#6B7280] font-normal">you?</span>
                    <span className="sc-caret inline-block w-1 h-[0.9em] ml-1.5 rounded-xs bg-[#2F62E8] align-[-0.1em]" />
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Showcase Toggles */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDemoSignOn((v) => !v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    demoSignOn
                      ? "bg-[#2F62E8] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {demoSignOn ? "Sign Mode ON" : "Sign Mode OFF"}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span>Caption size:</span>
                <input
                  type="range"
                  min={22}
                  max={38}
                  value={demoCaptionSize}
                  onChange={(e) => setDemoCaptionSize(Number(e.target.value))}
                  className="w-24 accent-[#2F62E8] cursor-pointer"
                />
                <span className="font-semibold text-[#111827]">{demoCaptionSize}px</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Three Pillars Features Section */}
      <section className="bg-[#F4F5F7] border-t border-gray-200/60 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[24px] shadow-2xs border border-black/5 flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF0FF] text-[#2F62E8] flex items-center justify-center">
              <HandSignIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#111827]">In-Browser Hand Tracking</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Powered by MediaPipe Tasks Vision. Extracts 21 keypoints per hand into 126 normalized features at ~15 fps. Fast, private, and zero video stream uploads.
            </p>
          </div>

          <div className="bg-white p-6 rounded-[24px] shadow-2xs border border-black/5 flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF0FF] text-[#2F62E8] flex items-center justify-center">
              <CaptionsIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#111827]">High-Contrast Captions & TTS</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Typeset in Atkinson Hyperlegible for maximum readability. Final sentences are read aloud in real time using the browser Web Speech API.
            </p>
          </div>

          <div className="bg-white p-6 rounded-[24px] shadow-2xs border border-black/5 flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF0FF] text-[#2F62E8] flex items-center justify-center">
              <UsersIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#111827]">Google Meet Experience</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Minimal light interface with guest join, audio/video lobbies, responsive grid and spotlight views, downloadable transcripts, and &ldquo;type instead&rdquo; box.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-[#6B7280]">
        SignCall • Built for Hackathon • Google Meet-style Sign Language Video Conferencing
      </footer>

      {/* Supported Signs Cheat Sheet */}
      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />
    </div>
  );
}
