import { describe, it, expect } from "vitest";

describe("WebRTC cross-network signaling setup", () => {
  it("derives proper WebSocket signaling URL from HTTP/HTTPS inference URL", () => {
    function deriveSignalingUrl(inferenceWsUrl: string, roomId: string, peerId: string, name: string): string {
      let wsBase = inferenceWsUrl.replace(/\/ws\/predict\/?$/, "");
      if (wsBase.startsWith("http://")) wsBase = wsBase.replace("http://", "ws://");
      if (wsBase.startsWith("https://")) wsBase = wsBase.replace("https://", "wss://");
      return `${wsBase}/ws/room/${encodeURIComponent(roomId)}?peer_id=${encodeURIComponent(peerId)}&name=${encodeURIComponent(name)}`;
    }

    const localUrl = deriveSignalingUrl("ws://localhost:8000/ws/predict", "demo", "p-1", "Alice");
    expect(localUrl).toBe("ws://localhost:8000/ws/room/demo?peer_id=p-1&name=Alice");

    const cloudflareUrl = deriveSignalingUrl(
      "wss://around-swap-chairman-mens.trycloudflare.com/ws/predict",
      "team-call",
      "p-mobile",
      "Hari"
    );
    expect(cloudflareUrl).toBe(
      "wss://around-swap-chairman-mens.trycloudflare.com/ws/room/team-call?peer_id=p-mobile&name=Hari"
    );
  });

  it("handles glare prevention deterministically via peer ID ordering", () => {
    function shouldInitiateOffer(myPeerId: string, remotePeerId: string): boolean {
      return myPeerId > remotePeerId;
    }

    expect(shouldInitiateOffer("peer-b", "peer-a")).toBe(true);
    expect(shouldInitiateOffer("peer-a", "peer-b")).toBe(false);
  });
});
