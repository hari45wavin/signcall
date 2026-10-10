/**
 * Client-side Sign Language to Spoken English Translation API.
 * Calls /api/translate or FastAPI inference server directly with instant fallback.
 */

export type TranslationTone = "conversational" | "professional" | "concise" | "casual";

export interface TranslationResult {
  original: string;
  translated: string;
  provider: string;
  tone: TranslationTone;
  latency_ms: number;
}

// Client-side instant linguistic rules for offline fallback
const ASL_FALLBACK_IDIOMS: Record<string, Record<TranslationTone, string>> = {
  "HELLO": {
    conversational: "Hello everyone!",
    professional: "Good day, everyone.",
    concise: "Hello.",
    casual: "Hey there!",
  },
  "NICE MEET YOU": {
    conversational: "It's nice to meet you.",
    professional: "It is a pleasure to meet you.",
    concise: "Nice to meet you.",
    casual: "Great meeting you!",
  },
  "NAME YOU WHAT": {
    conversational: "What is your name?",
    professional: "May I ask what your name is?",
    concise: "What's your name?",
    casual: "What's your name?",
  },
  "HOW YOU": {
    conversational: "How are you doing?",
    professional: "How are you today?",
    concise: "How are you?",
    casual: "How's it going?",
  },
  "THANK YOU": {
    conversational: "Thank you so much.",
    professional: "Thank you very much for your time.",
    concise: "Thank you.",
    casual: "Thanks a lot!",
  },
  "ME DEAF": {
    conversational: "I am deaf, communicating via sign language.",
    professional: "I am deaf and participating using real-time sign language translation.",
    concise: "I am deaf, using sign language.",
    casual: "I'm deaf, using sign language here!",
  },
  "ME MUTE": {
    conversational: "I am non-verbal, communicating via sign language.",
    professional: "I am non-verbal and communicating using real-time sign language captions.",
    concise: "I am non-verbal, using sign language.",
    casual: "I'm non-verbal, signing through this app!",
  },
};

export function localClientTranslate(text: string, tone: TranslationTone = "conversational"): string {
  const raw = text.trim().toUpperCase();
  if (!raw) return "";

  if (ASL_FALLBACK_IDIOMS[raw]) {
    return ASL_FALLBACK_IDIOMS[raw][tone] || ASL_FALLBACK_IDIOMS[raw].conversational;
  }

  // Want / Need patterns
  if (raw.startsWith("ME WANT ") || raw.startsWith("I WANT ")) {
    const item = raw.replace(/^(?:ME|I)\s+WANT\s+/i, "").replace(/\b(?:PLEASE|PLS|PLZ)\b/gi, "").trim().toLowerCase();
    if (tone === "professional") return `I would appreciate ${item}, please.`;
    if (tone === "casual") return `I'd love some ${item}!`;
    return `I would like ${item}, please.`;
  }

  // My name pattern
  if (raw.startsWith("MY NAME ") || raw.startsWith("ME NAME ")) {
    const name = raw.replace(/^(?:MY|ME)\s+NAME\s+/i, "").trim();
    const formatted = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    return `My name is ${formatted}.`;
  }

  // General capitalization & punctuation
  let res = text.trim();
  res = res.charAt(0).toUpperCase() + res.slice(1).toLowerCase();
  if (!/[.!?]$/.test(res)) {
    if (/^(what|where|when|who|why|how|can|could|is|are)\b/i.test(res)) {
      res += "?";
    } else {
      res += ".";
    }
  }
  return res;
}

export async function translateSignText(
  text: string,
  tone: TranslationTone = "conversational"
): Promise<TranslationResult> {
  const t0 = performance.now();
  const stripped = text.trim();
  if (!stripped) {
    return {
      original: "",
      translated: "",
      provider: "none",
      tone,
      latency_ms: 0,
    };
  }

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: stripped, tone }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.translated) {
        return {
          original: data.original || stripped,
          translated: data.translated,
          provider: data.provider || "server_llm",
          tone: data.tone || tone,
          latency_ms: Math.round(performance.now() - t0),
        };
      }
    }
  } catch (err) {
    console.warn("[SignCall AI] Translation network notice, using local engine:", err);
  }

  // Instant local rule-based fallback
  const translated = localClientTranslate(stripped, tone);
  return {
    original: stripped,
    translated,
    provider: "client_linguistic",
    tone,
    latency_ms: Math.round(performance.now() - t0),
  };
}
