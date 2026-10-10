import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.cleanup import local_linguistic_translate, translate_sign_to_speech

client = TestClient(app)


def test_asl_idiom_translation():
    # Basic idioms
    assert "nice to meet you" in local_linguistic_translate("NICE MEET YOU", "conversational").lower()
    assert "pleasure" in local_linguistic_translate("NICE MEET YOU", "professional").lower()

    # Need/want
    res_want = local_linguistic_translate("ME WANT WATER", "conversational")
    assert "water" in res_want.lower() and "would like" in res_want.lower()

    # Introduction
    res_name = local_linguistic_translate("MY NAME ALEX", "conversational")
    assert "alex" in res_name.lower() and "my name is" in res_name.lower()

    # Question
    res_q = local_linguistic_translate("TIME WHAT", "conversational")
    assert "time" in res_q.lower() and res_q.endswith("?")


def test_shorthand_fingerspelling_correction():
    res = local_linguistic_translate("HELO HW R U", "conversational")
    assert "how are you" in res.lower()


@pytest.mark.anyio
async def test_async_translate_sign_to_speech():
    res = await translate_sign_to_speech("HELLO HOW YOU", tone="conversational")
    assert res["original"] == "HELLO HOW YOU"
    assert len(res["translated"]) > 0
    assert res["provider"] in ("local_linguistic", "gemini_2.5_flash", "openai_gpt4o_mini")


def test_translate_http_endpoint():
    r = client.post("/translate", json={"text": "ME WANT WATER PLEASE", "tone": "conversational"})
    assert r.status_code == 200
    data = r.json()
    assert "water" in data["translated"].lower()
    assert data["provider"] is not None
    assert data["tone"] == "conversational"
    assert "latency_ms" in data


def test_translate_tones_endpoint():
    r = client.get("/translate/tones")
    assert r.status_code == 200
    data = r.json()
    assert "tones" in data and len(data["tones"]) >= 4
    tone_ids = [t["id"] for t in data["tones"]]
    assert "conversational" in tone_ids
    assert "professional" in tone_ids
