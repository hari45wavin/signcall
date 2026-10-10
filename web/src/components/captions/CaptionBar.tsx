import type { CaptionMessage } from "@/types/messages";

/** Shows the latest caption per sender. Interim text is greyed. */
export function CaptionBar({ captions }: { captions: CaptionMessage[] }) {
  const latest = new Map<string, CaptionMessage>();
  for (const c of captions) latest.set(c.sender, c);
  const rows = [...latest.values()].filter((c) => Date.now() - c.ts < 8000 || !c.final).slice(-2);
  if (!rows.length) return null;

  return (
    <div aria-live="polite" className="w-full max-w-3xl rounded-2xl bg-white px-5 py-3 text-ink shadow-lg">
      {rows.map((c) => (
        <div key={c.id}>
          <div className="text-xs text-muted">
            {c.sender} · {c.source ?? "signed"}
          </div>
          <p className="font-caption font-bold" style={{ fontSize: "var(--caption-size)" }}>
            <span className={c.final ? "" : "text-muted"}>{c.text}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
