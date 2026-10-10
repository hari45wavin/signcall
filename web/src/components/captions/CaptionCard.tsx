"use client";

interface CaptionCardProps {
  speaker: string;
  modeText?: string;
  readAloud: boolean;
  committedText: string;
  pendingText?: string;
  fontSizePx?: number;
}

export function CaptionCard({
  speaker,
  modeText = "signing",
  readAloud,
  committedText,
  pendingText,
  fontSizePx,
}: CaptionCardProps) {
  const displayText = committedText || pendingText;
  if (!displayText && !pendingText) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="max-w-[780px] w-full bg-white rounded-[18px] px-5 py-4 shadow-[0_8px_28px_rgba(17,24,39,0.12)] border border-black/5 flex flex-col gap-1.5 transition-all"
    >
      {/* Label line */}
      <div className="flex items-center justify-between text-sm font-semibold text-[#6B7280]">
        <span>
          {speaker}, {modeText}
          {readAloud ? " · read aloud when finished" : ""}
        </span>
      </div>

      {/* Main caption text */}
      <p
        className="m-0 font-bold leading-[1.3] text-[#111827]"
        style={{
          fontFamily: "var(--font-caption), Atkinson Hyperlegible, sans-serif",
          fontSize: fontSizePx ? `${fontSizePx}px` : "var(--caption-size, 28px)",
        }}
      >
        <span>{committedText}</span>
        {pendingText && (
          <span className="text-[#6B7280] font-normal ml-1">
            {pendingText}
          </span>
        )}
        <span
          className="sc-caret inline-block w-[3.5px] h-[0.9em] ml-1.5 rounded-[2px] bg-[#2F62E8] align-[-0.1em]"
          aria-hidden="true"
        />
      </p>
    </div>
  );
}
