# Architecture

**Core idea:** video goes through the call platform; recognition runs beside it in the signer's browser; the result travels back into the call as text.

## Pipeline

1. **Capture.** The signer's camera feeds the LiveKit call. In Sign Mode the same stream also feeds MediaPipe Hand Landmarker in the browser at ~15 fps (21 keypoints per hand).
2. **Features.** `web/src/lib/features.ts` turns landmarks into 126 numbers (see `shared/feature-spec.md`).
3. **Classify.**
   - **Option B (default):** features go over WebSocket to the FastAPI server (`inference/`), which runs the Python model.
   - **Option A (upgrade):** the model is exported to ONNX Runtime Web or TensorFlow.js and runs in the browser.
4. **Build text.** `web/src/lib/textBuilder.ts` commits a letter only after ~10 consecutive confident frames (~0.6 s), handles `space` / `del` / `nothing`, and finalizes a sentence after ~1.5 s with no hands.
5. **Broadcast.** Captions go out on the LiveKit data channel: interim updates lossy, final captions reliable (`shared/messages.md`).
6. **Show and speak.** Receivers show a caption bar and read final captions with the Web Speech API (`speechSynthesis`).
7. **Optional:** LLM sentence cleanup on the server with a short timeout, falling back to raw text.
8. **Stretch:** inject TTS audio into the signer's mic track; speech-to-text captions for the deaf signer.

## Why landmarks, not pixels

Small fast models, better generalization across backgrounds and skin tones, and no second video upload.

## Latency budget

| Step | Target |
|---|---|
| Capture interval | ~66 ms |
| Inference | < 30 ms |
| Smoothing | ~600 ms |
| Network (caption) | < 150 ms |

## Access

No accounts. Guest join with a display name and a random, hard-to-guess room id. The Next.js route `api/token` mints LiveKit tokens with the secret kept server-side. The room creator gets a host flag.

## Hosting

Web on Vercel. Inference on Render, Railway or Hugging Face Spaces. HTTPS is required for camera access.
