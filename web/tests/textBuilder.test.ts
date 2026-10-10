import { describe, expect, it } from "vitest";
import { TextBuilder } from "@/lib/textBuilder";

const opts = { minConfidence: 0.8, stableFrames: 3, finalizeAfterMs: 1000 };

function hold(tb: TextBuilder, label: string, frames: number, t: { now: number }, confidence = 0.95) {
  for (let i = 0; i < frames; i++) tb.push({ label, confidence }, (t.now += 66));
}

describe("TextBuilder", () => {
  it("commits a letter only after stable frames", () => {
    const tb = new TextBuilder(opts);
    const t = { now: 0 };
    hold(tb, "H", 2, t);
    expect(tb.state.text).toBe("");
    hold(tb, "H", 1, t);
    expect(tb.state.text).toBe("H");
  });

  it("does not repeat a held letter, but repeats after an idle break", () => {
    const tb = new TextBuilder(opts);
    const t = { now: 0 };
    hold(tb, "L", 10, t);
    expect(tb.state.text).toBe("L");
    hold(tb, "nothing", 3, t);
    hold(tb, "L", 3, t);
    expect(tb.state.text).toBe("LL");
  });

  it("ignores low-confidence frames", () => {
    const tb = new TextBuilder(opts);
    const t = { now: 0 };
    hold(tb, "A", 10, t, 0.5);
    expect(tb.state.text).toBe("");
  });

  it("handles space and del", () => {
    const tb = new TextBuilder(opts);
    const t = { now: 0 };
    hold(tb, "H", 3, t);
    hold(tb, "I", 3, t);
    hold(tb, "space", 3, t);
    hold(tb, "X", 3, t);
    hold(tb, "del", 3, t);
    expect(tb.state.text).toBe("HI ");
  });

  it("finalizes after no hands", () => {
    const tb = new TextBuilder(opts);
    const t = { now: 0 };
    hold(tb, "O", 3, t);
    hold(tb, "K", 3, t);
    expect(tb.push(null, t.now + 500)).toEqual([]);
    const events = tb.push(null, t.now + 1000);
    expect(events[0]).toEqual({ kind: "final", text: "OK" });
    expect(tb.state.text).toBe("");
  });
});
