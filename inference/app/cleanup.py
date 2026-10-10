"""Real-time LLM Sign Language to Spoken English Translation Engine.

Translates terse sign language glosses, fingerspelled sequences, and gestures
(e.g. "ME WANT WATER", "NICE MEET YOU", "NAME YOU WHAT", "HELO HW R U")
into fluent, natural, grammatically complete conversational spoken English.

Architecture:
1. Fast local linguistic NLP engine with ASL grammar realignment, typo correction,
   and idiomatic phrase expansion (works 100% offline, 0ms latency, zero API keys required).
2. Cloud LLM support (Google Gemini 2.5 Flash / OpenAI / Groq) via asynchronous httpx.
3. Sub-second timeout fallback ensures video call captions and TTS audio never stall.
"""
from __future__ import annotations

import os
import re
import time
from typing import Literal

import httpx

Tone = Literal["conversational", "professional", "concise", "casual"]

# Common ASL glosses to fluent conversational spoken English mappings
ASL_IDIOMS: dict[str, dict[Tone, str]] = {
    "HELLO": {
        "conversational": "Hello everyone!",
        "professional": "Good day, everyone.",
        "concise": "Hello.",
        "casual": "Hey there!",
    },
    "HI": {
        "conversational": "Hi!",
        "professional": "Greetings.",
        "concise": "Hi.",
        "casual": "Hey!",
    },
    "NICE MEET YOU": {
        "conversational": "It's nice to meet you.",
        "professional": "It is a pleasure to meet you.",
        "concise": "Nice to meet you.",
        "casual": "Great meeting you!",
    },
    "NAME YOU WHAT": {
        "conversational": "What is your name?",
        "professional": "May I ask what your name is?",
        "concise": "What's your name?",
        "casual": "What's your name?",
    },
    "YOU NAME WHAT": {
        "conversational": "What is your name?",
        "professional": "May I have your name, please?",
        "concise": "What's your name?",
        "casual": "What's your name?",
    },
    "HOW YOU": {
        "conversational": "How are you doing?",
        "professional": "How are you today?",
        "concise": "How are you?",
        "casual": "How's it going?",
    },
    "YOU HOW": {
        "conversational": "How are you doing?",
        "professional": "How are you doing today?",
        "concise": "How are you?",
        "casual": "How's it going?",
    },
    "THANK YOU": {
        "conversational": "Thank you so much.",
        "professional": "Thank you very much for your time.",
        "concise": "Thank you.",
        "casual": "Thanks a lot!",
    },
    "THANKS": {
        "conversational": "Thanks a lot.",
        "professional": "Thank you.",
        "concise": "Thanks.",
        "casual": "Thanks!",
    },
    "YOU WELCOME": {
        "conversational": "You are very welcome.",
        "professional": "It is my pleasure.",
        "concise": "You're welcome.",
        "casual": "Anytime!",
    },
    "PLEASE HELP": {
        "conversational": "Could you please help me?",
        "professional": "I would appreciate your assistance with this.",
        "concise": "Please help me.",
        "casual": "Can you give me a hand?",
    },
    "CAN HELP ME": {
        "conversational": "Could you please help me?",
        "professional": "Could you assist me with this, please?",
        "concise": "Can you help me?",
        "casual": "Can you help me out?",
    },
    "SORRY LATE": {
        "conversational": "I'm sorry for being late.",
        "professional": "I apologize for my delayed arrival.",
        "concise": "Sorry I'm late.",
        "casual": "My apologies for being late!",
    },
    "AGAIN PLEASE": {
        "conversational": "Could you please repeat that?",
        "professional": "Could you kindly repeat what you just said?",
        "concise": "Please repeat that.",
        "casual": "Can you say that again?",
    },
    "SAY AGAIN": {
        "conversational": "Could you say that once more?",
        "professional": "Would you mind repeating that statement?",
        "concise": "Say that again.",
        "casual": "Come again?",
    },
    "ME DEAF": {
        "conversational": "I am deaf, communicating via sign language.",
        "professional": "I am deaf and participating using real-time sign language translation.",
        "concise": "I am deaf, using sign language.",
        "casual": "I'm deaf, using sign language here!",
    },
    "ME MUTE": {
        "conversational": "I am non-verbal, communicating via sign language.",
        "professional": "I am non-verbal and communicating using real-time sign language captions.",
        "concise": "I am non-verbal, using sign language.",
        "casual": "I'm non-verbal, signing through this app!",
    },
    "WHERE RESTROOM": {
        "conversational": "Where is the restroom located?",
        "professional": "Could you direct me to the nearest restroom?",
        "concise": "Where is the restroom?",
        "casual": "Where's the bathroom?",
    },
    "TIME WHAT": {
        "conversational": "What time is it right now?",
        "professional": "Could you tell me the current time?",
        "concise": "What time is it?",
        "casual": "What time is it?",
    },
    "WHAT TIME": {
        "conversational": "What time is it right now?",
        "professional": "Could you please confirm the current time?",
        "concise": "What time is it?",
        "casual": "What time is it?",
    },
    "I AGREE": {
        "conversational": "I completely agree with that.",
        "professional": "I concur with this proposal.",
        "concise": "I agree.",
        "casual": "Totally agree with that!",
    },
    "NO AGREE": {
        "conversational": "I don't quite agree with that.",
        "professional": "I have reservations regarding this point.",
        "concise": "I disagree.",
        "casual": "I don't really agree.",
    },
    "SEE YOU LATER": {
        "conversational": "See you later!",
        "professional": "I look forward to speaking with you again soon.",
        "concise": "See you later.",
        "casual": "Catch you later!",
    },
    "GOOD BYE": {
        "conversational": "Goodbye, have a great day!",
        "professional": "Goodbye, thank you all.",
        "concise": "Goodbye.",
        "casual": "Bye everyone!",
    },
    "BYE": {
        "conversational": "Bye everyone!",
        "professional": "Goodbye.",
        "concise": "Bye.",
        "casual": "Bye!",
    },
}

# Slang & Fingerspelling shorthand expansions
SHORTHAND_MAP: dict[str, str] = {
    "HW": "how",
    "R": "are",
    "U": "you",
    "UR": "your",
    "THX": "thanks",
    "TY": "thank you",
    "PLS": "please",
    "PLZ": "please",
    "HLP": "help",
    "SRY": "sorry",
    "IDK": "I don't know",
    "TBH": "to be honest",
    "BRB": "be right back",
    "WTR": "water",
    "GM": "good morning",
    "GN": "good night",
}


def local_linguistic_translate(text: str, tone: Tone = "conversational") -> str:
    """Translates raw ASL tokens and fingerspelling into natural conversational English using NLP rules."""
    raw = re.sub(r"\s+", " ", text.strip()).upper()
    if not raw:
        return ""

    # 1. Exact or normalized idiom match
    if raw in ASL_IDIOMS:
        return ASL_IDIOMS[raw].get(tone, ASL_IDIOMS[raw]["conversational"])

    # 2. Expand shorthand tokens
    tokens = raw.split()
    expanded_tokens: list[str] = []
    for t in tokens:
        expanded_tokens.append(SHORTHAND_MAP.get(t, t.lower()))
    sentence = " ".join(expanded_tokens)

    # 3. Handle common ASL grammatical patterns
    # Pattern: "me want [something]" -> "I would like [something]"
    m_want = re.match(r"^(?:me|i)\s+want\s+(.+)$", sentence, re.IGNORECASE)
    if m_want:
        item = re.sub(r"\b(?:please|pls|plz)\b", "", m_want.group(1), flags=re.IGNORECASE).strip()
        if tone == "professional":
            return f"I would appreciate {item}, please."
        if tone == "concise":
            return f"I want {item}."
        if tone == "casual":
            return f"I'd love some {item}!"
        return f"I would like {item}, please."

    # Pattern: "me need [something]" -> "I need [something]"
    m_need = re.match(r"^(?:me|i)\s+need\s+(.+)$", sentence, re.IGNORECASE)
    if m_need:
        item = re.sub(r"\b(?:please|pls|plz)\b", "", m_need.group(1), flags=re.IGNORECASE).strip()
        if tone == "professional":
            return f"I require {item} at your earliest convenience."
        return f"I need {item}, please."

    # Pattern: "my name [something]" or "me name [something]"
    m_name = re.match(r"^(?:my|me)\s+name\s+([a-zA-Z]+)$", sentence, re.IGNORECASE)
    if m_name:
        name_val = m_name.group(1).capitalize()
        if tone == "professional":
            return f"My name is {name_val}."
        if tone == "casual":
            return f"Hey, my name's {name_val}!"
        return f"Hello, my name is {name_val}."

    # Pattern: "me happy" / "me sad" / "me tired"
    m_state = re.match(r"^(?:me|i)\s+(happy|sad|tired|ready|busy|confused)(?:\s+(?:to|for)\s+(.+))?$", sentence, re.IGNORECASE)
    if m_state:
        adj = m_state.group(1).lower()
        extra = m_state.group(2) or ""
        extra_str = f" to {extra}" if extra else ""
        if tone == "professional":
            return f"I am {adj}{extra_str}."
        if tone == "casual":
            return f"I'm feeling {adj}{extra_str}!"
        return f"I am {adj}{extra_str}."

    # Pronoun subject realignment ("me go store" -> "I go store")
    words = sentence.split()
    if words and words[0].lower() == "me":
        words[0] = "I"
    sentence = " ".join(words)

    # 4. Standard capitalization & terminal punctuation
    res = sentence[0].upper() + sentence[1:] if sentence else ""
    if res and res[-1] not in ".!?":
        # Question words check
        if re.match(r"^(what|where|when|who|why|how|can|could|would|will|is|are|do|does)\b", res, re.IGNORECASE):
            res += "?"
        else:
            res += "."

    return res


async def call_gemini_llm(text: str, tone: Tone, api_key: str) -> str | None:
    """Invokes Google Gemini 2.5 Flash / 1.5 Flash for high-precision sign translation."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    system_prompt = (
        "You are SignCall AI, an expert accessibility interpreter assisting deaf and non-verbal speakers "
        "in live video conferences. Translate the input sign language glosses, gestures, or fingerspelled text "
        f"into natural, fluent, grammatically complete spoken English in a {tone} tone. "
        "Preserve the speaker's true intent. Output ONLY the final spoken sentence. No quotes, no markdown, no explanation."
    )
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_prompt}\n\nSign Language Input: {text}\nSpoken English:"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 60,
        },
    }

    async with httpx.AsyncClient(timeout=0.85) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts and "text" in parts[0]:
                    cleaned = parts[0]["text"].strip()
                    if cleaned:
                        return cleaned
    return None


async def call_openai_compatible_llm(text: str, tone: Tone, api_key: str, base_url: str = "https://api.openai.com/v1") -> str | None:
    """Invokes OpenAI or Groq chat completions endpoint for real-time sign translation."""
    model_name = "gpt-4o-mini" if "openai" in base_url else "llama-3.1-8b-instant"
    system_prompt = (
        "You are SignCall AI, an accessibility interpreter translating American Sign Language (ASL) "
        f"glosses and fingerspelled signs into natural spoken English in a {tone} tone. "
        "Output ONLY the translated sentence with no preamble."
    )
    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text},
        ],
        "temperature": 0.2,
        "max_tokens": 60,
    }

    async with httpx.AsyncClient(timeout=0.85) as client:
        resp = await client.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload,
        )
        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                content = choices[0].get("message", {}).get("content", "").strip()
                if content:
                    return content
    return None


async def translate_sign_to_speech(text: str, tone: Tone = "conversational") -> dict[str, str | float]:
    """Translates sign language into natural spoken English with sub-second fallback."""
    t0 = time.time()
    stripped = text.strip()
    if not stripped:
        return {
            "original": "",
            "translated": "",
            "provider": "none",
            "tone": tone,
            "latency_ms": 0.0,
        }

    gemini_key = os.environ.get("GEMINI_API_KEY") or (
        os.environ.get("CLEANUP_API_KEY", "") if os.environ.get("CLEANUP_API_KEY", "").startswith("AIza") else ""
    )
    openai_key = os.environ.get("OPENAI_API_KEY")
    groq_key = os.environ.get("GROQ_API_KEY")

    translated: str | None = None
    provider = "local_linguistic"

    # Attempt cloud LLM if configured
    if gemini_key:
        try:
            translated = await call_gemini_llm(stripped, tone, gemini_key)
            if translated:
                provider = "gemini_2.5_flash"
        except Exception:
            pass

    if not translated and openai_key:
        try:
            translated = await call_openai_compatible_llm(stripped, tone, openai_key)
            if translated:
                provider = "openai_gpt4o_mini"
        except Exception:
            pass

    if not translated and groq_key:
        try:
            translated = await call_openai_compatible_llm(stripped, tone, groq_key, base_url="https://api.groq.com/openai/v1")
            if translated:
                provider = "groq_llama3"
        except Exception:
            pass

    # Instant deterministic linguistic engine fallback
    if not translated:
        translated = local_linguistic_translate(stripped, tone)
        provider = "local_linguistic"

    latency = round((time.time() - t0) * 1000, 2)
    return {
        "original": stripped,
        "translated": translated,
        "provider": provider,
        "tone": tone,
        "latency_ms": latency,
    }


# Backwards compatibility for existing imports
normalize_sentence = local_linguistic_translate


async def cleanup(text: str) -> str:
    res = await translate_sign_to_speech(text, tone="conversational")
    return str(res["translated"])
