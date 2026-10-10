import { NextResponse } from "next/server";
import { localClientTranslate, type TranslationTone } from "@/lib/translate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body.text || "").trim();
    const tone = (body.tone || "conversational") as TranslationTone;

    if (!text) {
      return NextResponse.json({
        original: "",
        translated: "",
        provider: "none",
        tone,
        latency_ms: 0,
      });
    }

    // Try forwarding to local/tunneled FastAPI server
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const fastapiRes = await fetch("http://127.0.0.1:8000/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tone, mode: "asl_to_english" }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (fastapiRes.ok) {
        const data = await fastapiRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Server offline/timeout, proceed to local linguistic fallback
    }

    // Fallback: fast Node.js linguistic engine
    const translated = localClientTranslate(text, tone);
    return NextResponse.json({
      original: text,
      translated,
      provider: "nextjs_linguistic_fallback",
      tone,
      latency_ms: 1,
    });
  } catch (error) {
    return NextResponse.json({ error: "Translation error" }, { status: 500 });
  }
}
