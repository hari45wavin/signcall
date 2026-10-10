"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMaybeRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { config } from "@/config";
import { decodeCaption, encodeCaption, isReliable, newCaptionId } from "@/lib/livekit";
import { speak } from "@/lib/tts";
import type { CaptionMessage, CaptionSource } from "@/types/messages";

/**
 * Receives captions from the LiveKit room, reads final ones aloud, and lets you publish your own.
 * Safely handles both live LiveKit calls and demo/offline preview mode without throwing "No room provided".
 */
export function useCaptions({ readAloud }: { readAloud: boolean }) {
  const [captions, setCaptions] = useState<CaptionMessage[]>([]);
  const spoken = useRef(new Set<string>());
  const room = useMaybeRoomContext();

  const upsert = useCallback(
    (msg: CaptionMessage, isLocal: boolean) => {
      setCaptions((prev) => {
        const rest = prev.filter((c) => c.id !== msg.id);
        return [...rest, msg].slice(-50);
      });
      if (msg.final && !isLocal && readAloud && !spoken.current.has(msg.id)) {
        spoken.current.add(msg.id);
        speak(msg.text);
      }
    },
    [readAloud]
  );

  // Subscribe to room data channel if inside a LiveKit room
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      _participant?: unknown,
      _kind?: unknown,
      topic?: string
    ) => {
      if (topic && topic !== config.captions.topic) return;
      const msg = decodeCaption(payload);
      if (msg) upsert(msg, false);
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, upsert]);

  const publish = useCallback(
    (text: string, opts: { final: boolean; id?: string; source?: CaptionSource }) => {
      const identity = room?.localParticipant?.identity || "You";
      const msg: CaptionMessage = {
        type: "caption",
        id: opts.id ?? newCaptionId(),
        sender: identity,
        text,
        final: opts.final,
        ts: Date.now(),
        source: opts.source ?? "signed",
      };

      upsert(msg, true);

      // If connected to a real LiveKit room, publish across the data channel
      if (room?.localParticipant) {
        try {
          const payload = encodeCaption(msg);
          void room.localParticipant.publishData(payload as any, {
            reliable: isReliable(msg),
            topic: config.captions.topic,
          });
        } catch (e) {
          console.warn("[LiveKit] publishData notice:", e);
        }
      }

      return msg.id;
    },
    [room, upsert]
  );

  return { captions, publish };
}
