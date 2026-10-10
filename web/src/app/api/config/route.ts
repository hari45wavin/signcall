import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const reqHost = req.headers.get("host")?.split(":")[0] || "localhost";
  const isHttps = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https://");

  const inferenceWsUrl =
    process.env.NEXT_PUBLIC_INFERENCE_WS_URL ||
    (isHttps ? "wss://around-swap-chairman-mens.trycloudflare.com/ws/predict" : `ws://${reqHost}:8000/ws/predict`);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || (isHttps ? "demo://signcall" : `ws://${reqHost}:7880`);

  return NextResponse.json({
    inferenceWsUrl,
    livekitUrl,
    isHttps,
    host: reqHost,
  });
}
