"use client";

import { XIcon, HandSignIcon } from "@/components/common/Icons";

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATIC_SIGNS = [
  { sign: "A", desc: "Fist with thumb upright against side of index finger" },
  { sign: "B", desc: "Flat hand upright with 4 fingers together, thumb folded across palm" },
  { sign: "C", desc: "Curved hand forming a 'C' shape with thumb and fingers" },
  { sign: "D", desc: "Index finger pointing up, thumb touching tips of other fingers" },
  { sign: "E", desc: "Curved fingers tucked down resting on thumb" },
  { sign: "F", desc: "Index and thumb touching in circle, remaining 3 fingers open upright" },
  { sign: "G", desc: "Index and thumb pointing horizontally forward, parallel" },
  { sign: "H", desc: "Index and middle fingers pointing horizontally together" },
  { sign: "I", desc: "Pinky finger pointing straight up, fist closed" },
  { sign: "K", desc: "Index up, middle forward at angle, thumb resting at middle joint" },
  { sign: "L", desc: "Index finger pointing up and thumb pointing out forming an 'L'" },
  { sign: "M", desc: "Fist with thumb tucked underneath 3 fingers (index, middle, ring)" },
  { sign: "N", desc: "Fist with thumb tucked underneath 2 fingers (index, middle)" },
  { sign: "O", desc: "All fingers curved touching thumb tip forming an 'O'" },
  { sign: "P", desc: "Like 'K' pointing downward" },
  { sign: "Q", desc: "Like 'G' pointing downward" },
  { sign: "R", desc: "Index and middle fingers crossed" },
  { sign: "S", desc: "Fist with thumb wrapped across front of fingers" },
  { sign: "T", desc: "Thumb tucked between index and middle fingers" },
  { sign: "U", desc: "Index and middle fingers held together upright" },
  { sign: "V", desc: "Index and middle fingers separated upright forming 'V'" },
  { sign: "W", desc: "Index, middle, and ring fingers held upright forming 'W'" },
  { sign: "X", desc: "Index finger hooked like a claw, others closed" },
  { sign: "Y", desc: "Thumb and pinky outstretched, middle 3 fingers closed ('hang loose')" },
];

const CONTROL_SIGNS = [
  { sign: "space", desc: "Open flat hand moved slightly to right (ends current word)" },
  { sign: "del", desc: "Quick wave / swipe left (deletes previous letter)" },
  { sign: "nothing", desc: "Hands down or resting at sides (ends sentence after ~1.5s)" },
];

export function CheatSheetModal({ isOpen, onClose }: CheatSheetModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cheat-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white w-full max-w-2xl rounded-[28px] shadow-2xl border border-black/10 p-6 md:p-8 flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#EAF0FF] text-[#2F62E8] flex items-center justify-center">
              <HandSignIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cheat-modal-title" className="text-xl font-bold text-[#111827] m-0">
                Supported Signs Reference
              </h2>
              <p className="text-xs text-[#6B7280] m-0">
                Fingerspelling & Control Signs recognized by SignCall
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tip banner */}
        <div className="p-3.5 rounded-2xl bg-[#EAF0FF] text-[#2349C7] text-xs leading-relaxed flex items-center gap-2.5">
          <span className="font-bold">Tip:</span>
          <span>
            Hold a sign steady for ~0.6 seconds in front of your camera. Commit happens when
            confidence stays high. Hold hands down for 1.5 seconds to finalize a sentence.
          </span>
        </div>

        {/* Control Signs */}
        <div>
          <h3 className="text-sm font-bold text-[#111827] mb-2 uppercase tracking-wider">
            Control Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {CONTROL_SIGNS.map((c) => (
              <div
                key={c.sign}
                className="p-3 rounded-2xl bg-[#F4F5F7] border border-gray-200 flex flex-col gap-1"
              >
                <span className="font-mono font-bold text-sm text-[#2F62E8]">{c.sign}</span>
                <span className="text-xs text-[#6B7280] leading-snug">{c.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alphabet Signs */}
        <div>
          <h3 className="text-sm font-bold text-[#111827] mb-2 uppercase tracking-wider">
            ASL Alphabet Letters (A–Y)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {STATIC_SIGNS.map((item) => (
              <div
                key={item.sign}
                className="p-3 rounded-2xl bg-white border border-gray-200 hover:border-[#2F62E8] transition-colors flex flex-col gap-1"
              >
                <span className="w-7 h-7 rounded-full bg-[#EAF0FF] text-[#2F62E8] font-bold text-base flex items-center justify-center">
                  {item.sign}
                </span>
                <span className="text-[11px] text-[#6B7280] leading-snug line-clamp-2">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-full bg-[#2F62E8] text-white font-semibold hover:bg-[#2552c7] transition-all cursor-pointer mt-2"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
