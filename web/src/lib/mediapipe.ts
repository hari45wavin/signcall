/** MediaPipe Hand Landmarker in the browser. Feed it the UNMIRRORED video frame. */
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import type { Hand } from "@/lib/features";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm"; // keep in sync with package.json;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";

export async function createHandLandmarker(): Promise<HandLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  try {
    return await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numHands: 2,
    });
  } catch (err) {
    console.warn("[MediaPipe] GPU delegate unavailable on this mobile/browser platform, falling back to CPU:", err);
    return await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
      runningMode: "VIDEO",
      numHands: 2,
    });
  }
}

export function toHands(result: HandLandmarkerResult): Hand[] {
  return result.landmarks.map((lms, i) => {
    const cat = result.handedness[i]?.[0];
    return {
      landmarks: lms.map((p) => [p.x, p.y, p.z]),
      handedness: cat?.categoryName ?? "Right",
      score: cat?.score ?? 0,
    };
  });
}

// TODO(web): hooks/useSignRecognition.ts — run detectForVideo() at config.captureFps,
// frameFeatures() -> InferenceClient.send() -> TextBuilder.push() -> publish captions.
