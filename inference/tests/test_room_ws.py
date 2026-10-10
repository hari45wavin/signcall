from fastapi.testclient import TestClient
from app.main import app


def test_room_peers_endpoint_empty():
    client = TestClient(app)
    res = client.get("/room/test-empty-room/peers")
    assert res.status_code == 200
    data = res.json()
    assert data["room_id"] == "test-empty-room"
    assert data["count"] == 0
    assert data["peers"] == []


def test_room_websocket_signaling_flow():
    client = TestClient(app)

    # Peer 1 connects to room "room-101"
    with client.websocket_connect("/ws/room/room-101?peer_id=peer-1&name=Alice") as ws1:
        # Initial message to Peer 1: room-peers (should be empty initially)
        msg1 = ws1.receive_json()
        assert msg1["type"] == "room-peers"
        assert msg1["peers"] == []

        # Peer 2 connects to the same room
        with client.websocket_connect("/ws/room/room-101?peer_id=peer-2&name=Bob") as ws2:
            # Peer 2 gets existing peers (Alice)
            msg2 = ws2.receive_json()
            assert msg2["type"] == "room-peers"
            assert len(msg2["peers"]) == 1
            assert msg2["peers"][0]["peerId"] == "peer-1"
            assert msg2["peers"][0]["name"] == "Alice"

            # Peer 1 receives notification that Bob joined
            joined_msg = ws1.receive_json()
            assert joined_msg["type"] == "peer-joined"
            assert joined_msg["peerId"] == "peer-2"
            assert joined_msg["name"] == "Bob"

            # Check HTTP endpoint reflects both peers
            res = client.get("/room/room-101/peers")
            assert res.status_code == 200
            assert res.json()["count"] == 2

            # Signal from Bob to Alice (e.g. WebRTC SDP offer)
            ws2.send_json({
                "type": "signal",
                "target": "peer-1",
                "signal": {"sdp": "mock-offer-sdp"}
            })
            signal_received = ws1.receive_json()
            assert signal_received["type"] == "signal"
            assert signal_received["sender"] == "peer-2"
            assert signal_received["signal"]["sdp"] == "mock-offer-sdp"

            # Broadcast caption from Alice to room
            ws1.send_json({
                "type": "broadcast",
                "event": "caption",
                "data": {"text": "Hello world", "final": True}
            })
            broadcast_received = ws2.receive_json()
            assert broadcast_received["type"] == "broadcast"
            assert broadcast_received["sender"] == "peer-1"
            assert broadcast_received["event"] == "caption"
            assert broadcast_received["data"]["text"] == "Hello world"

        # Peer 2 disconnected: Peer 1 should receive peer-left
        left_msg = ws1.receive_json()
        assert left_msg["type"] == "peer-left"
        assert left_msg["peerId"] == "peer-2"

    # Both disconnected: room is clean
    res = client.get("/room/room-101/peers")
    assert res.json()["count"] == 0
