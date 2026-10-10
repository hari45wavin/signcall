/** Tunables in one place. Values follow docs/architecture.md. */
export const config = {
  livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "",
  inferenceWsUrl: process.env.NEXT_PUBLIC_INFERENCE_WS_URL ?? "ws://localhost:8000/ws/predict",

  /** Hand Landmarker sampling rate. */
  captureFps: 15,

  textBuilder: {
    /** Minimum confidence for a frame to count toward a letter. */
    minConfidence: 0.8,
    /** Consecutive confident frames before a letter is committed (~0.6 s at 15 fps). */
    stableFrames: 10,
    /** No hands for this long finalizes the sentence. */
    finalizeAfterMs: 1500,
  },

  captions: {
    topic: "captions",
    defaultSizePx: 28,
    minSizePx: 22,
    maxSizePx: 44,
  },
} as const;
