from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["ok"] is True


def test_predict_roundtrip():
    with client.websocket_connect("/ws/predict") as ws:
        ws.send_text('{"seq": 1, "features": ' + str([0.0] * 126) + "}")
        msg = ws.receive_json()
        assert msg["seq"] == 1 and "label" in msg and len(msg["top3"]) >= 1


def test_bad_request_keeps_socket_open():
    with client.websocket_connect("/ws/predict") as ws:
        ws.send_text('{"seq": 2, "features": [1, 2]}')
        assert "error" in ws.receive_json()
        ws.send_text('{"seq": 3, "features": ' + str([0.0] * 126) + "}")
        assert ws.receive_json()["seq"] == 3


def test_labels():
    r = client.get("/labels")
    assert r.status_code == 200
    data = r.json()
    assert "static" in data or "version" in data


def test_http_predict():
    r = client.post("/predict", json={"features": [0.0] * 126, "mode": "static"})
    assert r.status_code == 200
    res = r.json()
    assert "label" in res and "confidence" in res and "latency_ms" in res

