# Message formats (v1)

TypeScript types: `web/src/types/messages.ts`. Python types: `inference/app/schemas.py`.

## 1. Caption message (LiveKit data channel, topic `captions`)

```json
{
  "type": "caption",
  "id": "c_8f2a1c",
  "sender": "riya-identity",
  "text": "HELLO MY NAME",
  "final": false,
  "ts": 1760073600000
}
```

| Field | Type | Notes |
|---|---|---|
| `type` | `"caption"` | |
| `id` | string | Same id for every update of one sentence |
| `sender` | string | LiveKit participant identity |
| `text` | string | Full text so far, not a diff |
| `final` | boolean | `false`: interim, send **lossy**. `true`: finished, send **reliable** and read aloud |
| `ts` | number | Unix ms on the sender |
| `source` | `"signed" \| "typed" \| "spoken"` | Optional, defaults to `"signed"` |

Receivers keep the latest message per `id`, and speak it once when `final` is `true`.

## 2. Inference WebSocket (`/ws/predict`)

Client → server, one per frame:

```json
{ "seq": 412, "ts": 1760073600123, "mode": "static", "features": [0.0, 0.12, "... 126 floats"] }
```

- `mode`: `"static"` (one frame, 126 floats) or `"sequence"` (30 × 126 = 3780 floats, oldest frame first). Defaults to `"static"`.

Server → client:

```json
{ "seq": 412, "label": "A", "confidence": 0.94, "top3": [["A", 0.94], ["S", 0.03], ["E", 0.01]] }
```

On a bad request the server replies `{ "seq": 412, "error": "message" }` and keeps the socket open.

The client drops any response whose `seq` is older than the last one it handled.

## 3. Health check

`GET /health` → `{ "ok": true, "model": "dummy" | "<model file name>", "labels_version": "0.1.0-draft" }`
