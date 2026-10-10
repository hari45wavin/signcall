import os
import time
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .cleanup import translate_sign_to_speech, Tone
from .ws import predictor, router

START_TIME = time.time()

app = FastAPI(
    title="SignCall Inference Service",
    description="Real-time ASL and gesture prediction engine with WebSocket streaming, REST fallbacks, and LLM sign-to-speech translation.",
    version="1.0.0",
)

# Robust CORS middleware supporting local development and LAN testing
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://0.0.0.0:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in ALLOWED_ORIGINS else ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


class HttpPredictRequest(BaseModel):
    features: list[float]
    mode: str = "static"


class HttpPredictResponse(BaseModel):
    label: str
    confidence: float
    top3: list[tuple[str, float]]
    latency_ms: float


class HttpTranslateRequest(BaseModel):
    text: str
    tone: str = "conversational"
    mode: str = "asl_to_english"


class HttpTranslateResponse(BaseModel):
    original: str
    translated: str
    provider: str
    tone: str
    latency_ms: float


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "healthy",
        "ok": True,
        "model": predictor.name,
        "labels_version": predictor.labels.get("version", "1.0.0"),
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "classes_count": len(predictor.classes),
        "llm_translation": True,
    }


@app.get("/labels")
def get_labels() -> dict[str, Any]:
    """Returns supported sign language gesture labels and vocabulary."""
    return predictor.labels


@app.post("/predict", response_model=HttpPredictResponse)
def predict_http(payload: HttpPredictRequest) -> HttpPredictResponse:
    """HTTP inference endpoint for batch testing and clients without WebSocket support."""
    t0 = time.time()
    if not payload.features or len(payload.features) < 126:
        raise HTTPException(status_code=400, detail="Expected 126-dimensional landmark features vector")

    label, conf, top3 = predictor.predict(payload.features, payload.mode)
    latency = round((time.time() - t0) * 1000, 2)
    return HttpPredictResponse(
        label=label,
        confidence=conf,
        top3=top3,
        latency_ms=latency,
    )


@app.post("/translate", response_model=HttpTranslateResponse)
async def translate_http(payload: HttpTranslateRequest) -> HttpTranslateResponse:
    """Translates raw ASL glosses/signs into fluent spoken English using local NLP or cloud LLM."""
    if not payload.text:
        return HttpTranslateResponse(
            original="",
            translated="",
            provider="none",
            tone=payload.tone,
            latency_ms=0.0,
        )
    tone_arg: Tone = (
        payload.tone  # type: ignore
        if payload.tone in ("conversational", "professional", "concise", "casual")
        else "conversational"
    )
    res = await translate_sign_to_speech(payload.text, tone=tone_arg)
    return HttpTranslateResponse(
        original=str(res["original"]),
        translated=str(res["translated"]),
        provider=str(res["provider"]),
        tone=str(res["tone"]),
        latency_ms=float(res["latency_ms"]),
    )


@app.get("/translate/tones")
def get_tones() -> dict[str, Any]:
    """Returns supported translation tone styles."""
    return {
        "tones": [
            {
                "id": "conversational",
                "name": "Conversational",
                "description": "Natural, friendly, everyday spoken English.",
            },
            {
                "id": "professional",
                "name": "Professional",
                "description": "Polite, formal tone for workplace meetings and interviews.",
            },
            {
                "id": "concise",
                "name": "Concise",
                "description": "Direct and brief statements.",
            },
            {
                "id": "casual",
                "name": "Casual",
                "description": "Warm, relaxed, informal chat.",
            },
        ],
        "default": "conversational",
    }
