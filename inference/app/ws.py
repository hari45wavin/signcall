from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from .model import Predictor
from .schemas import ErrorResponse, PredictRequest, PredictResponse

router = APIRouter()
predictor = Predictor()


@router.websocket("/ws/predict")
async def ws_predict(ws: WebSocket) -> None:
    await ws.accept()
    try:
        while True:
            raw = await ws.receive_text()
            try:
                req = PredictRequest.model_validate_json(raw)
            except ValidationError as e:
                await ws.send_text(ErrorResponse(error=e.errors()[0]["msg"]).model_dump_json())
                continue
            label, conf, top3 = predictor.predict(req.features, req.mode)
            await ws.send_text(PredictResponse(seq=req.seq, label=label, confidence=conf, top3=top3).model_dump_json())
    except WebSocketDisconnect:
        pass
