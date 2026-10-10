import os
import time
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .ws import predictor, router

START_TIME = time.time()

app = FastAPI(
    title="SignCall Inference Service",
    description="Real-time ASL and gesture prediction engine with WebSocket streaming and REST fallbacks.",
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


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "healthy",
        "ok": True,
        "model": predictor.name,
        "labels_version": predictor.labels.get("version", "1.0.0"),
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "classes_count": len(predictor.classes),
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
