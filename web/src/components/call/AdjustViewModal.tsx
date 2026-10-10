"use client";

import { XIcon, CheckIcon, GridIcon, SpotlightIcon, LayoutIcon } from "@/components/common/Icons";

export type LayoutMode = "auto" | "tiled" | "spotlight" | "sidebar";

interface AdjustViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  maxTiles?: number;
  onMaxTilesChange?: (max: number) => void;
  theme?: "light" | "dark";
}

export function AdjustViewModal({
  isOpen,
  onClose,
  layoutMode,
  onLayoutModeChange,
  maxTiles = 16,
  onMaxTilesChange,
  theme = "light",
}: AdjustViewModalProps) {
  if (!isOpen) return null;

  const isLight = theme === "light";

  const layouts: {
    id: LayoutMode;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "auto",
      title: "Auto",
      description: "Automatically balances the view based on who is speaking or signing.",
      icon: (
        <div className="w-12 h-10 rounded-lg border-2 border-current flex flex-col p-1 gap-1">
          <div className="flex-1 bg-current opacity-70 rounded-xs" />
          <div className="flex gap-1 h-2">
            <div className="flex-1 bg-current opacity-40 rounded-xs" />
            <div className="flex-1 bg-current opacity-40 rounded-xs" />
          </div>
        </div>
      ),
    },
    {
      id: "tiled",
      title: "Tiled",
      description: "Shows everyone in equal-sized cards without cluttering.",
      icon: (
        <div className="w-12 h-10 rounded-lg border-2 border-current grid grid-cols-2 p-1 gap-1">
          <div className="bg-current opacity-70 rounded-xs" />
          <div className="bg-current opacity-70 rounded-xs" />
          <div className="bg-current opacity-70 rounded-xs" />
          <div className="bg-current opacity-70 rounded-xs" />
        </div>
      ),
    },
    {
      id: "spotlight",
      title: "Spotlight",
      description: "The active signer or speaker fills the entire screen with maximum clarity.",
      icon: (
        <div className="w-12 h-10 rounded-lg border-2 border-current p-1">
          <div className="w-full h-full bg-current opacity-80 rounded-xs" />
        </div>
      ),
    },
    {
      id: "sidebar",
      title: "Sidebar",
      description: "The presenter stays on stage, with participants docked in a strip.",
      icon: (
        <div className="w-12 h-10 rounded-lg border-2 border-current flex p-1 gap-1">
          <div className="flex-1 bg-current opacity-80 rounded-xs" />
          <div className="w-3 flex flex-col gap-0.5">
            <div className="flex-1 bg-current opacity-50 rounded-xs" />
            <div className="flex-1 bg-current opacity-50 rounded-xs" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-view-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className={`w-full max-w-lg rounded-[28px] shadow-2xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto border transition-colors ${
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
              <LayoutIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="adjust-view-title" className="text-xl font-bold m-0">
                Change layout
              </h2>
              <p className={`text-xs m-0 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                Choose how participants and signers are arranged
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              isLight ? "text-gray-500 hover:bg-gray-100" : "text-gray-400 hover:bg-white/10"
            }`}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Layout Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {layouts.map((l) => {
            const isSelected = layoutMode === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onLayoutModeChange(l.id)}
                className={`relative p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? isLight
                      ? "border-[#1a73e8] bg-[#e8f0fe]/40 text-[#1a73e8] shadow-sm ring-2 ring-[#1a73e8]/20"
                      : "border-[#8ab4f8] bg-[#8ab4f8]/10 text-[#8ab4f8] shadow-sm ring-2 ring-[#8ab4f8]/20"
                    : isLight
                    ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  {l.icon}
                  {isSelected && (
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${
                        isLight ? "bg-[#1a73e8]" : "bg-[#8ab4f8] text-[#202124]"
                      }`}
                    >
                      <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold m-0 text-current">{l.title}</h3>
                  <p
                    className={`text-xs m-0 mt-1 line-clamp-2 ${
                      isLight ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {l.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tiled Max Tiles Slider (if tiled or auto) */}
        {(layoutMode === "tiled" || layoutMode === "auto") && onMaxTilesChange && (
          <div
            className={`p-4 rounded-2xl border flex flex-col gap-3 ${
              isLight ? "bg-gray-50 border-gray-200" : "bg-[#202124] border-white/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-current">Maximum tiles displayed</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isLight ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-[#8ab4f8]/20 text-[#8ab4f8]"
                }`}
              >
                {maxTiles} tiles
              </span>
            </div>

            <input
              type="range"
              min={6}
              max={49}
              step={1}
              value={maxTiles}
              onChange={(e) => onMaxTilesChange(Number(e.target.value))}
              className="w-full accent-[#1a73e8] cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-gray-400">
              <span>6</span>
              <span>16 (Recommended)</span>
              <span>30</span>
              <span>49</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 rounded-full font-bold text-sm cursor-pointer transition-all ${
              isLight
                ? "bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-sm"
                : "bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#202124] shadow-sm"
            }`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
