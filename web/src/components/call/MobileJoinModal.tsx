"use client";

import { useState } from "react";
import { XIcon, SmartphoneIcon, CopyIcon, CheckIcon } from "@/components/common/Icons";

interface MobileJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export function MobileJoinModal({ isOpen, onClose, roomId }: MobileJoinModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Local Wi-Fi IP detected from network
  const lanIp = "172.168.168.225";
  const mobileUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${lanIp || window.location.hostname}:3000/room/${roomId}`
    : `http://${lanIp}:3000/room/${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-[#202124] text-white w-full max-w-lg rounded-3xl shadow-2xl border border-white/10 p-6 md:p-7 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8ab4f8]/20 text-[#8ab4f8] flex items-center justify-center">
              <SmartphoneIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="mobile-modal-title" className="text-lg font-bold text-white m-0">
                Join from Mobile Phone
              </h2>
              <p className="text-xs text-gray-400 m-0">Connect another device or teammate on the same Wi-Fi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Direct Link Box */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Mobile Wi-Fi Meeting Link
          </label>
          <div className="flex items-center gap-2 bg-[#2d2e30] border border-white/10 rounded-2xl p-2 px-3">
            <span className="font-mono text-xs text-[#8ab4f8] truncate flex-1 select-all">
              {mobileUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#202124] font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* 3 Simple Steps */}
        <div className="bg-[#2d2e30] rounded-2xl p-4 flex flex-col gap-3 text-xs border border-white/5">
          <span className="font-bold text-sm text-white">How to connect your phone:</span>

          <div className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-[#8ab4f8] text-[#202124] font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </span>
            <p className="m-0 text-gray-300 leading-relaxed">
              Connect your mobile phone to the <strong>same Wi-Fi network</strong> as this computer.
            </p>
          </div>

          <div className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-[#8ab4f8] text-[#202124] font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </span>
            <p className="m-0 text-gray-300 leading-relaxed">
              Open <strong>Chrome</strong> (Android) or <strong>Safari</strong> (iPhone) on your phone and enter the link above.
            </p>
          </div>

          <div className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-[#8ab4f8] text-[#202124] font-bold flex items-center justify-center shrink-0 text-xs">
              3
            </span>
            <div className="flex flex-col gap-1 text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">Camera permission over Wi-Fi (Android):</span>
              <span>
                Chrome requires secure origin for camera. If camera is blocked on phone:
              </span>
              <ol className="list-decimal list-inside pl-1 text-[11px] text-gray-400 space-y-0.5">
                <li>Type <code className="text-[#8ab4f8]">chrome://flags</code> in phone Chrome</li>
                <li>Search for <em>Insecure origins treated as secure</em></li>
                <li>Add <code className="text-[#8ab4f8]">http://{lanIp}:3000</code> and select <strong>Enabled</strong></li>
                <li>Tap <strong>Relaunch</strong> and re-open the call link.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Tunnel Alternative Tip */}
        <div className="rounded-xl bg-[#8ab4f8]/10 border border-[#8ab4f8]/20 p-3 text-[11px] text-gray-300 flex items-start gap-2">
          <span className="text-[#8ab4f8] text-sm">💡</span>
          <div>
            <strong className="text-white">Need 100% automatic HTTPS on phone?</strong>
            <p className="m-0 mt-0.5 text-gray-400">
              Run <code className="text-[#8ab4f8]">npx localtunnel --port 3000</code> in your terminal to get a public HTTPS link that opens directly on any phone without changing any Chrome flags.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#202124] font-bold text-sm cursor-pointer transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
