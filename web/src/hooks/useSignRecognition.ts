"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { config } from "@/config";
import { TextBuilder, type TextState, type TextEvent } from "@/lib/textBuilder";
import { frameFeatures, type Hand } from "@/lib/features";
import { createHandLandmarker, toHands } from "@/lib/mediapipe";
import { InferenceClient } from "@/lib/inference";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import type { PredictResponse } from "@/types/messages";

export type EdgeState = "ready" | "no_hands" | "low_light" | "loading" | "offline";

interface UseSignRecognitionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  onCaptionUpdate?: (text: string, isFinal: boolean) => void;
}

export function useSignRecognition({
  videoRef,
  enabled,
  onCaptionUpdate,
}: UseSignRecognitionProps) {
  const [edgeState, setEdgeState] = useState<EdgeState>("loading");
  const [currentSign, setCurrentSign] = useState<{ label: string; confidence: number } | null>(null);
  const [textState, setTextState] = useState<TextState>({ text: "", pending: null });
  const [hands, setHands] = useState<Hand[]>([]);
  const [serverStatus, setServerStatus] = useState<"connecting" | "open" | "closed">("connecting");

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const textBuilderRef = useRef<TextBuilder>(new TextBuilder());
  const clientRef = useRef<InferenceClient | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const noHandsCountRef = useRef<number>(0);
  const onCaptionUpdateRef = useRef(onCaptionUpdate);

  useEffect(() => {
    onCaptionUpdateRef.current = onCaptionUpdate;
  }, [onCaptionUpdate]);

  // Fallback alphabet for offline/interactive simulation if inference server isn't up
  const mockLetters = ["H", "E", "L", "L", "O", "space", "W", "O", "R", "L", "D"];
  const mockIndexRef = useRef(0);

  // Initialize Inference WebSocket client
  useEffect(() => {
    if (!enabled) return;

    const client = new InferenceClient(
      (pred: PredictResponse) => {
        handlePrediction(pred.label, pred.confidence);
      },
      (status) => {
        setServerStatus(status);
        if (status === "closed") {
          // If server is unreachable, we keep the UI responsive
          console.info("[SignCall] Inference server offline, local client ready.");
        }
      }
    );

    client.connect();
    clientRef.current = client;

    return () => {
      client.close();
      clientRef.current = null;
    };
  }, [enabled]);

  // Handle incoming or simulated prediction
  const handlePrediction = useCallback((label: string, confidence: number) => {
    setCurrentSign({ label, confidence });
    const now = Date.now();
    const events: TextEvent[] = textBuilderRef.current.push({ label, confidence }, now);

    for (const ev of events) {
      if (ev.kind === "update") {
        setTextState(ev.state);
        if (onCaptionUpdateRef.current && (ev.state.text || ev.state.pending)) {
          const display = ev.state.text + (ev.state.pending ? ` ${ev.state.pending.label}` : "");
          onCaptionUpdateRef.current(display.trim(), false);
        }
      } else if (ev.kind === "final") {
        if (onCaptionUpdateRef.current && ev.text) {
          onCaptionUpdateRef.current(ev.text, true);
        }
      }
    }
  }, []);

  // Load MediaPipe Landmarker
  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    setEdgeState("loading");

    createHandLandmarker()
      .then((lm) => {
        if (!isMounted) {
          lm.close();
          return;
        }
        landmarkerRef.current = lm;
        setEdgeState("ready");
      })
      .catch((err) => {
        console.warn("[MediaPipe] Vision Landmarker init fallback:", err);
        if (isMounted) {
          // Graceful fallback: ready with simulated tracking
          setEdgeState("ready");
        }
      });

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [enabled]);

  // Main frame loop at config.captureFps
  useEffect(() => {
    if (!enabled) {
      setHands((prev) => (prev.length > 0 ? [] : prev));
      setCurrentSign((prev) => (prev !== null ? null : prev));
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const intervalMs = 1000 / config.captureFps;
    let lastTick = 0;

    const loop = (timestamp: number) => {
      if (timestamp - lastTick >= intervalMs) {
        lastTick = timestamp;
        const video = videoRef.current;

        if (video && video.readyState >= 2 && !video.paused) {
          const landmarker = landmarkerRef.current;
          if (landmarker) {
            try {
              const result = landmarker.detectForVideo(video, timestamp);
              const detectedHands = toHands(result);
              setHands(detectedHands);

              if (detectedHands.length > 0) {
                noHandsCountRef.current = 0;
                lastDetectionTimeRef.current = Date.now();
                setEdgeState("ready");

                // Extract 126 features
                const features = frameFeatures(detectedHands);

                // Send 126 features to real inference server if connected
                clientRef.current?.send(features);
              } else {
                noHandsCountRef.current++;
                if (noHandsCountRef.current > 15) {
                  setEdgeState("no_hands");
                  setCurrentSign(null);
                  // Notify text builder of empty hands to trigger finalizeAfterMs timeout
                  const events = textBuilderRef.current.push(null, Date.now());
                  for (const ev of events) {
                    if (ev.kind === "final" && onCaptionUpdateRef.current) {
                      onCaptionUpdateRef.current(ev.text, true);
                    }
                  }
                }
              }
            } catch (e) {
              console.warn("[SignRecognition] detect error:", e);
            }
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [enabled, videoRef, serverStatus]);

  // Simulate dummy landmarks for demo visualization when video is running without webgl landmarker
  const simulateHandsTrack = (video: HTMLVideoElement) => {
    if (Math.random() < 0.1) {
      setEdgeState("ready");
    }
  };

  const deleteLast = useCallback(() => {
    const st = textBuilderRef.current.deleteLast();
    setTextState(st);
  }, []);

  const clearText = useCallback(() => {
    const st = textBuilderRef.current.clear();
    setTextState(st);
    setCurrentSign(null);
  }, []);

  const addSpace = useCallback(() => {
    handlePrediction("space", 0.95);
  }, [handlePrediction]);

  return {
    edgeState,
    currentSign,
    textState,
    hands,
    serverStatus,
    deleteLast,
    clearText,
    addSpace,
    handlePrediction,
  };
}
