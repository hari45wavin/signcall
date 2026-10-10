/** Mirrors shared/messages.md. Change both together. */

export type CaptionSource = "signed" | "typed" | "spoken";

export interface CaptionMessage {
  type: "caption";
  id: string;
  sender: string;
  text: string;
  final: boolean;
  ts: number;
  source?: CaptionSource;
}

export interface PredictRequest {
  seq: number;
  ts: number;
  mode?: "static" | "sequence";
  features: number[];
}

export interface PredictResponse {
  seq: number;
  label: string;
  confidence: number;
  top3: [string, number][];
}

export interface PredictError {
  seq?: number;
  error: string;
}

export interface TokenResponse {
  token: string;
  identity: string;
  url: string;
}
