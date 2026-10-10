"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { config } from "@/config";

export interface RemotePeer {
  id: string;
  name: string;
  stream: MediaStream;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isSigning?: boolean;
}

interface UseWebRtcRoomProps {
  roomId: string;
  peerId: string;
  name: string;
  localStream: MediaStream | null;
  enabled: boolean;
  onRemoteCaption?: (sender: string, text: string, isFinal: boolean) => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

export function useWebRtcRoom({
  roomId,
  peerId,
  name,
  localStream,
  enabled,
  onRemoteCaption,
}: UseWebRtcRoomProps) {
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");

  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const peerNamesRef = useRef<Map<string, string>>(new Map());
  const onRemoteCaptionRef = useRef(onRemoteCaption);

  useEffect(() => {
    onRemoteCaptionRef.current = onRemoteCaption;
  }, [onRemoteCaption]);

  // Derive public or local WebSocket URL for signaling
  const getSignalingUrl = useCallback(() => {
    let wsBase = config.inferenceWsUrl.replace(/\/ws\/predict\/?$/, "");
    if (wsBase.startsWith("http://")) wsBase = wsBase.replace("http://", "ws://");
    if (wsBase.startsWith("https://")) wsBase = wsBase.replace("https://", "wss://");
    return `${wsBase}/ws/room/${encodeURIComponent(roomId)}?peer_id=${encodeURIComponent(peerId)}&name=${encodeURIComponent(name)}`;
  }, [roomId, peerId, name]);

  const updatePeersState = useCallback(() => {
    const list: RemotePeer[] = [];
    remoteStreamsRef.current.forEach((stream, pid) => {
      list.push({
        id: pid,
        name: peerNamesRef.current.get(pid) || "Participant",
        stream,
      });
    });
    setRemotePeers(list);
  }, []);

  const createPeerConnection = useCallback((targetPid: string, targetName: string) => {
    peerNamesRef.current.set(targetPid, targetName);

    // Close any previous connection
    const existing = peerConnectionsRef.current.get(targetPid);
    if (existing) {
      existing.close();
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionsRef.current.set(targetPid, pc);

    // Track remote stream
    const remoteStream = new MediaStream();
    remoteStreamsRef.current.set(targetPid, remoteStream);

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
          remoteStream.addTrack(track);
        }
      });
      updatePeersState();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "signal",
            target: targetPid,
            signal: { candidate: event.candidate.toJSON() },
          })
        );
      }
    };

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    return pc;
  }, [localStream, updatePeersState]);

  // Send SDP offer to peer
  const initiateOffer = useCallback(async (targetPid: string, targetName: string) => {
    const pc = createPeerConnection(targetPid, targetName);
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "signal",
            target: targetPid,
            signal: { sdp: pc.localDescription?.toJSON() },
          })
        );
      }
    } catch (err) {
      console.warn(`[WebRTC] Failed to create offer for ${targetPid}:`, err);
    }
  }, [createPeerConnection]);

  // Main room signaling connection
  useEffect(() => {
    if (!enabled || !roomId) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");
    const wsUrl = getSignalingUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        // 1. Existing peers list
        if (msg.type === "room-peers") {
          const peers: Array<{ peerId: string; name: string }> = msg.peers || [];
          peers.forEach((p) => {
            peerNamesRef.current.set(p.peerId, p.name);
            // Glare prevention: alphabetical initiator
            if (peerId > p.peerId) {
              initiateOffer(p.peerId, p.name);
            }
          });
        }

        // 2. New peer joined
        else if (msg.type === "peer-joined") {
          const { peerId: remotePid, name: remoteName } = msg;
          peerNamesRef.current.set(remotePid, remoteName);
          if (peerId > remotePid) {
            initiateOffer(remotePid, remoteName);
          }
        }

        // 3. WebRTC signaling payload (Offer / Answer / Candidate)
        else if (msg.type === "signal") {
          const { sender: senderPid, name: senderName, signal } = msg;
          let pc = peerConnectionsRef.current.get(senderPid);
          if (!pc) {
            pc = createPeerConnection(senderPid, senderName || "Participant");
          }

          if (signal?.sdp) {
            const desc = new RTCSessionDescription(signal.sdp);
            await pc.setRemoteDescription(desc);

            if (desc.type === "offer") {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "signal",
                    target: senderPid,
                    signal: { sdp: pc.localDescription?.toJSON() },
                  })
                );
              }
            }
          } else if (signal?.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (candErr) {
              console.warn("[WebRTC] Candidate error:", candErr);
            }
          }
        }

        // 4. Remote peer left
        else if (msg.type === "peer-left") {
          const { peerId: leftPid } = msg;
          const pc = peerConnectionsRef.current.get(leftPid);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(leftPid);
          }
          remoteStreamsRef.current.delete(leftPid);
          peerNamesRef.current.delete(leftPid);
          updatePeersState();
        }

        // 5. Broadcast message (e.g. live sign captions or translations)
        else if (msg.type === "broadcast") {
          if (msg.event === "caption" && msg.data) {
            const senderName = peerNamesRef.current.get(msg.sender) || "Peer";
            onRemoteCaptionRef.current?.(senderName, msg.data.text || "", Boolean(msg.data.final));
          }
        }
      } catch (err) {
        console.warn("[WebRTC] Signaling message parse notice:", err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
    };

    return () => {
      ws.close();
      wsRef.current = null;
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      remoteStreamsRef.current.clear();
      peerNamesRef.current.clear();
      setRemotePeers([]);
    };
  }, [enabled, roomId, peerId, getSignalingUrl, initiateOffer, createPeerConnection, updatePeersState]);

  // Keep local stream tracks in sync across active peer connections
  useEffect(() => {
    if (!localStream) return;
    peerConnectionsRef.current.forEach((pc) => {
      const senders = pc.getSenders();
      localStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch(() => {});
        } else {
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  // Broadcast function to publish captions or status to all peers in the room
  const broadcast = useCallback((event: string, data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "broadcast",
          event,
          data,
        })
      );
    }
  }, []);

  return {
    remotePeers,
    connectionStatus,
    broadcast,
  };
}
