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


# Active WebRTC P2P signaling rooms: room_id -> { peer_id: (WebSocket, name) }
from collections import defaultdict
from fastapi import WebSocket, WebSocketDisconnect

_active_rooms: dict[str, dict[str, tuple[WebSocket, str]]] = defaultdict(dict)


@app.get("/room/{room_id}/peers")
def get_room_peers(room_id: str) -> dict[str, Any]:
    """Returns list of connected peers in a room."""
    peers = [
        {"peerId": pid, "name": name}
        for pid, (_, name) in _active_rooms.get(room_id, {}).items()
    ]
    return {"room_id": room_id, "count": len(peers), "peers": peers}


@app.websocket("/ws/room/{room_id}")
async def room_signaling_endpoint(
    websocket: WebSocket,
    room_id: str,
    peer_id: str,
    name: str = "Participant",
):
    """
    Real-time WebRTC room signaling endpoint.
    Connects devices across different Wi-Fi and mobile cellular networks.
    Exchanges SDP offers, answers, ICE candidates, and caption broadcasts.
    """
    await websocket.accept()
    room = _active_rooms[room_id]
    room[peer_id] = (websocket, name)

    # 1. Send currently connected peers to the newly joined peer
    existing_peers = [
        {"peerId": pid, "name": pname}
        for pid, (_, pname) in room.items()
        if pid != peer_id
    ]
    await websocket.send_json({"type": "room-peers", "peers": existing_peers})

    # 2. Notify all existing peers that a new peer joined
    for pid, (peer_ws, _) in list(room.items()):
        if pid != peer_id:
            try:
                await peer_ws.send_json(
                    {"type": "peer-joined", "peerId": peer_id, "name": name}
                )
            except Exception:
                pass

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "signal":
                target = data.get("target")
                if target and target in room:
                    target_ws, _ = room[target]
                    try:
                        await target_ws.send_json(
                            {
                                "type": "signal",
                                "sender": peer_id,
                                "name": name,
                                "signal": data.get("signal"),
                            }
                        )
                    except Exception:
                        pass

            elif msg_type == "broadcast":
                # Broadcast caption, translation, or state update to all other room peers
                for pid, (peer_ws, _) in list(room.items()):
                    if pid != peer_id:
                        try:
                            await peer_ws.send_json(
                                {
                                    "type": "broadcast",
                                    "sender": peer_id,
                                    "event": data.get("event"),
                                    "data": data.get("data"),
                                }
                            )
                        except Exception:
                            pass

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        room.pop(peer_id, None)
        if not room:
            _active_rooms.pop(room_id, None)

        # Notify remaining peers that this peer left
        for pid, (peer_ws, _) in list(_active_rooms.get(room_id, {}).items()):
            try:
                await peer_ws.send_json({"type": "peer-left", "peerId": peer_id})
            except Exception:
                pass

