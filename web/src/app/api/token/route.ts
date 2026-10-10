import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { isValidRoomId } from "@/lib/roomId";

export const runtime = "nodejs";

/** POST { roomId, name, host? } -> { token, identity, url } */
export async function POST(req: Request) {
  const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";
  const reqHost = req.headers.get("host")?.split(":")[0] || "localhost";
  const isHttps = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https://");
  const isTunnelOrRemote = !reqHost.includes("localhost") && !reqHost.startsWith("127.") && !reqHost.startsWith("192.168.") && !reqHost.startsWith("10.");

  let livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!livekitUrl) {
    if (isHttps && isTunnelOrRemote) {
      livekitUrl = "demo://signcall";
    } else {
      livekitUrl = `ws://${reqHost}:7880`;
    }
  }

  const body = await req.json().catch(() => null);
  const roomId = String(body?.roomId ?? "");
  const name = String(body?.name ?? "").trim().slice(0, 40);
  if (!isValidRoomId(roomId)) return NextResponse.json({ error: "Invalid room id" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const identity = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${crypto.randomUUID().slice(0, 6)}`;
  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: "4h",
    // TODO(web): host flag should be proven (e.g. a secret returned on room creation), not self-declared.
    metadata: JSON.stringify({ host: Boolean(body?.host) }),
  });
  at.addGrant({ room: roomId, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });

  return NextResponse.json({ token: await at.toJwt(), identity, url: livekitUrl });
}
