# Decisions log

Newest at the top. One line for the decision, one for why.

## Decided

- **Guest join, no Google sign-in.** Display name + random room id; LiveKit tokens control access. Accounts are a "next steps" item.
- **Landmarks, not pixels.** MediaPipe Hand Landmarker in the browser; models see 126 numbers per frame.
- **Server inference first (Option B), in-browser later (Option A).** Python model is fastest to ship; export to ONNX/TF.js if time allows.
- **LiveKit Cloud** for calls; captions over its data channel.
- **Browser `speechSynthesis`** for read-aloud.
- **Design: minimal light.** White/soft grey, accent `#2F62E8`, coral Leave button, Plus Jakarta Sans (UI), Atkinson Hyperlegible (captions).
- **Split train/validation by signer**, not by random frame.

## Open

- [ ] **Sign language:** ASL or ISL? (ASL has a big alphabet dataset; ISL is more relevant locally but many letters are two-handed.)
- [ ] **Vocabulary:** final 10–20 words. Then freeze `shared/labels.json`.
- [ ] **Inference location:** stay on server, or move to browser after the hour-6 checkpoint?
- [ ] **Work split** across the 8 team members.
