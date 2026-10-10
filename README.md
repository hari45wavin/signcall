# SignCall

> **SignCall** is a real-time video conferencing platform featuring an intelligent **Sign Language Mode**. The signer's hand gestures are recognized live at 30 FPS, rendered as captions to everyone in the room, and spoken aloud with natural text-to-speech.

---

## ✨ Features

- 📹 **Google Meet Interface**:
  - Clean **White (Light) default theme** with 1-click toggle to **Theater Black (Dark) theme**.
  - Circular Meet toolbar, intuitive layouts, and full screen toggling.
- 🖐️ **Real-Time Hand Tracking & Sign Recognition**:
  - In-browser 30 FPS landmark tracking using Google MediaPipe Hand Landmarker.
  - Aspect-fit bounding overlay with skeleton visualization matching selfie camera reflection.
  - Interactive ASL alphabet & signs guide modal with word builder controls (`[␣ space]`, `[⌫ undo]`, `[✕ clear]`).
- 💬 **Live Captions & Text-to-Speech**:
  - Dedicated captions strip docked below the video stage.
  - Integrated browser Web Speech API with asynchronous voice engine and instant voice test preview.
- 🔲 **Google Meet "Adjust View" (Change Layout)**:
  - **Auto**: Automatically balances between Spotlight and Tiled views.
  - **Tiled**: Equal-sized participant tiles with adjustable slider (6 to 49 tiles).
  - **Spotlight**: Active speaker or signer takes the entire stage.
  - **Sidebar**: Stage presenter with clean participant filmstrip.
- 🛡️ **Host Management System**:
  - Master host controls toggle.
  - One-click **Mute All** participants.
  - Per-participant mute and remove (kick) controls with confirmation.
  - Granular permission switches: allow video, allow microphone, allow in-call chat.
- 📱 **Mobile Phone Wi-Fi Join**:
  - Instant QR code and LAN URL generator for joining on mobile devices over the same local network.
- ⚡ **Multi-Party WebRTC with LiveKit**:
  - Low-latency media streaming with persistent track binding to prevent blackouts when switching layouts.

---

## 🏗️ Architecture

```
Signer Camera (Browser)
       │
       ├─► MediaPipe Hand Landmarker (30 FPS, 21 keypoints per hand)
       │         │
       │         └─► Feature Extraction (126 normalized floats)
       │                   │
       │                   └─► Sign Recognition Engine (FastAPI / Client)
       │                             │
       │                             └─► Live Caption Strip & TTS Read-Aloud
       │
       └─► LiveKit SFU (WebRTC Audio / Video / Data Channels)
                 │
                 ▼
       Remote Participants (Receive video + real-time sign captions)
```

---

## 📁 Repository Layout

| Directory | Description |
|---|---|
| [`web/`](web/) | Next.js 16 app router frontend (Google Meet UI, LiveKit client, MediaPipe tracking) |
| [`inference/`](inference/) | FastAPI server running WebSocket (`/ws/predict`) and REST (`/predict`, `/health`) APIs |
| [`ml/`](ml/) | Hand landmark feature extraction, data augmentation, and PyTorch training pipeline |
| [`shared/`](shared/) | Shared contracts: labels vocabulary, 126-feature specifications, test vectors |
| [`docs/`](docs/) | Architecture specifications, technical decision logs, and demo scripts |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- LiveKit Server (local or cloud)

### 1. Backend Service
```bash
cd inference
python -m venv .venv
# Windows: .venv\Scripts\activate | Unix: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Web App
```bash
cd web
npm install
npm run dev
# App launches at http://localhost:3000
```

### 3. Running with Docker
```bash
docker compose up --build
```

---

## 🧪 Testing

```bash
# Frontend Unit Tests
cd web
npm test
npm run typecheck

# Backend Tests
cd inference
pytest tests/
```

---

## 📄 License
MIT License. Created by [Hariom Joshi (hari45wavin)](https://github.com/hari45wavin).
