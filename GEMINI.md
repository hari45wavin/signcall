# SignCall — Antigravity Agent Guidelines

## Agent Execution & Permissions
- **Autonomous Mode**: The user has granted full permission to Antigravity. Proactively make edits, run tests, execute build commands, and inspect files without pausing for manual confirmation.
- **Auto-Approval**: Proceed with command execution and file edits directly.

## Project Structure & Architecture
- **`web/`**: Next.js client (LiveKit room, MediaPipe Hand Landmarker, Text-to-Speech, Sign Mode UI).
- **`inference/`**: FastAPI WebSocket server hosting the real-time gesture classification model.
- **`ml/`**: Machine learning pipeline (landmark extraction, PyTorch training, model exports).
- **`shared/`**: Common types, feature vectors (126 landmarks per frame), and label contracts.
- **`docs/`**: Architecture diagrams and specifications.

## Development Workflows
- **Frontend**: In `web/`, run `npm install`, `npm run dev` (starts on port 3000), `npm test`.
- **Inference**: In `inference/`, run FastAPI server with Uvicorn.
- **Environment**: Copy `.env.example` to `web/.env.local` for LiveKit credentials.
