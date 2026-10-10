/**
 * Turns a noisy stream of per-frame predictions into text.
 *
 * - A label is committed after `stableFrames` consecutive frames with confidence >= `minConfidence`.
 * - The same letter twice in a row needs a break in between: `nothing`, hands down, or another committed label.
 *   A brief flicker to another label does not count, so held signs don't repeat.
 * - `space` ends the current word, `del` removes the last character, `nothing` is idle.
 * - No hands for `finalizeAfterMs` finalizes the sentence.
 */
import { config } from "@/config";

export interface Prediction {
  label: string;
  confidence: number;
}

export interface TextState {
  /** Committed text of the current sentence. */
  text: string;
  /** Label currently being held, shown greyed out with progress. */
  pending: { label: string; progress: number } | null;
}

export type TextEvent =
  | { kind: "update"; state: TextState }
  | { kind: "final"; text: string };

export interface TextBuilderOptions {
  minConfidence: number;
  stableFrames: number;
  finalizeAfterMs: number;
}

const CONTROL = new Set(["space", "del", "nothing"]);

export class TextBuilder {
  private opts: TextBuilderOptions;
  private text = "";
  private candidate: string | null = null;
  private count = 0;
  private lastCommitted: string | null = null;
  private lastHandsAt: number | null = null;

  constructor(opts: Partial<TextBuilderOptions> = {}) {
    this.opts = { ...config.textBuilder, ...opts };
  }

  get state(): TextState {
    const pending =
      this.candidate && this.candidate !== "nothing" && this.count > 0 && this.candidate !== this.lastCommitted
        ? { label: this.candidate, progress: Math.min(1, this.count / this.opts.stableFrames) }
        : null;
    return { text: this.text, pending };
  }

  /** Feed one frame. `prediction` is null when no hands are visible. */
  push(prediction: Prediction | null, now: number): TextEvent[] {
    const events: TextEvent[] = [];

    if (!prediction) {
      this.candidate = null;
      this.count = 0;
      this.lastCommitted = null;
      if (this.lastHandsAt !== null && now - this.lastHandsAt >= this.opts.finalizeAfterMs) {
        const final = this.text.trim();
        this.lastHandsAt = null;
        this.text = "";
        if (final) events.push({ kind: "final", text: final });
        events.push({ kind: "update", state: this.state });
      }
      return events;
    }

    this.lastHandsAt = now;
    const { label, confidence } = prediction;

    if (confidence < this.opts.minConfidence) {
      this.count = 0;
      return events;
    }

    if (label === this.candidate) this.count++;
    else {
      this.candidate = label;
      this.count = 1;
    }

    if (label === "nothing") {
      this.lastCommitted = null;
      return events;
    }

    if (this.count === this.opts.stableFrames && label !== this.lastCommitted) {
      this.commit(label);
      this.lastCommitted = label;
    }
    events.push({ kind: "update", state: this.state });
    return events;
  }

  /** Undo / Clear buttons and "type instead" use these. */
  deleteLast(): TextState {
    this.text = this.text.slice(0, -1);
    return this.state;
  }

  clear(): TextState {
    this.text = "";
    this.candidate = null;
    this.count = 0;
    this.lastCommitted = null;
    return this.state;
  }

  private commit(label: string) {
    if (label === "space") {
      if (this.text && !this.text.endsWith(" ")) this.text += " ";
    } else if (label === "del") {
      this.text = this.text.slice(0, -1);
    } else if (!CONTROL.has(label)) {
      // Letters append directly; multi-character labels are whole words.
      if (label.length > 1 && this.text && !this.text.endsWith(" ")) this.text += " ";
      this.text += label;
      if (label.length > 1) this.text += " ";
    }
  }
}
