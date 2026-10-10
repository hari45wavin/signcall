"""Mirrors shared/messages.md section 2."""
from typing import Literal

from pydantic import BaseModel, Field

FEATURE_SIZE = 126


class PredictRequest(BaseModel):
    seq: int
    ts: float | None = None
    mode: Literal["static", "sequence"] = "static"
    features: list[float] = Field(min_length=FEATURE_SIZE)


class PredictResponse(BaseModel):
    seq: int
    label: str
    confidence: float
    top3: list[tuple[str, float]]


class ErrorResponse(BaseModel):
    seq: int | None = None
    error: str
