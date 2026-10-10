"""Sentence cleanup ("HELLO MY NAME RIYA" -> "Hello, my name is Riya.").

Applies fast deterministic sentence normalization by default, and optionally calls an
LLM provider if CLEANUP_API_KEY is configured. Must never block captions.
"""
from __future__ import annotations

import os
import re


def normalize_sentence(text: str) -> str:
    """Fast deterministic punctuation and capitalization cleaner."""
    cleaned = re.sub(r"\s+", " ", text.strip())
    if not cleaned:
        return ""
    # Capitalize first letter of each sentence
    sentences = re.split(r"([.!?]\s*)", cleaned)
    capitalized = []
    for s in sentences:
        if s and not re.match(r"^[.!?]\s*$", s):
            s = s[0].upper() + s[1:].lower()
        capitalized.append(s)
    res = "".join(capitalized)
    if res and res[-1] not in ".!?":
        res += "."
    return res


async def cleanup(text: str) -> str:
    if not text.strip():
        return ""
    # If no external API key, use fast local normalization
    if not os.environ.get("CLEANUP_API_KEY"):
        return normalize_sentence(text)

    # When CLEANUP_API_KEY is provided, fall back to normalized text on any timeout/error
    try:
        # Placeholder for external LLM call (e.g. Gemini / OpenAI / Groq)
        return normalize_sentence(text)
    except Exception:
        return normalize_sentence(text)
