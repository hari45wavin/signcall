/** WebSocket client for inference/ (/ws/predict). Drops stale responses and reconnects. */
import { config } from "@/config";
import type { PredictError, PredictResponse } from "@/types/messages";

type Status = "connecting" | "open" | "closed";

export class InferenceClient {
  private ws: WebSocket | null = null;
  private seq = 0;
  private lastHandled = -1;
  private closedByUser = false;
  private retryMs = 500;

  constructor(
    private onPrediction: (p: PredictResponse) => void,
    private onStatus: (s: Status) => void = () => {},
    private url: string = config.inferenceWsUrl,
  ) {}

  connect() {
    this.closedByUser = false;
    this.onStatus("connecting");
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onopen = () => {
      this.retryMs = 500;
      this.onStatus("open");
    };
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as PredictResponse | PredictError;
      if ("error" in msg) return console.warn("[inference]", msg.error);
      if (msg.seq <= this.lastHandled) return;
      this.lastHandled = msg.seq;
      this.onPrediction(msg);
    };
    ws.onclose = () => {
      this.onStatus("closed");
      if (!this.closedByUser) setTimeout(() => this.connect(), (this.retryMs = Math.min(this.retryMs * 2, 8000)));
    };
  }

  /** Returns false if the frame was skipped (socket not open or backed up). */
  send(features: number[], mode: "static" | "sequence" = "static"): boolean {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN || ws.bufferedAmount > 64_000) return false;
    ws.send(JSON.stringify({ seq: ++this.seq, ts: Date.now(), mode, features }));
    return true;
  }

  close() {
    this.closedByUser = true;
    this.ws?.close();
    this.ws = null;
  }
}
