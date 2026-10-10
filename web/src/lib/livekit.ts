/** Caption encoding for the LiveKit data channel (shared/messages.md section 1). */
import type { CaptionMessage } from "@/types/messages";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeCaption(msg: CaptionMessage): Uint8Array {
  return encoder.encode(JSON.stringify(msg));
}

export function decodeCaption(payload: Uint8Array): CaptionMessage | null {
  try {
    const msg = JSON.parse(decoder.decode(payload));
    return msg?.type === "caption" && typeof msg.text === "string" ? (msg as CaptionMessage) : null;
  } catch {
    return null;
  }
}

/** Interim captions are lossy; final captions must arrive. */
export function isReliable(msg: CaptionMessage): boolean {
  return msg.final;
}

export function newCaptionId(): string {
  return "c_" + Math.random().toString(36).slice(2, 10);
}
