/** Read-aloud with the browser Web Speech API with reliable async voice loading. */

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/** Asynchronously ensures voices are retrieved once browser initializes synthesis engine */
export async function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  if (!ttsSupported()) return [];
  const current = window.speechSynthesis.getVoices();
  if (current.length > 0) return current;

  return new Promise((resolve) => {
    let resolved = false;
    const handler = () => {
      if (resolved) return;
      resolved = true;
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    // Timeout fallback if voiceschanged doesn't trigger
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve(window.speechSynthesis.getVoices());
      }
    }, 1000);
  });
}

export function speak(
  text: string,
  opts: { voice?: SpeechSynthesisVoice; voiceName?: string; rate?: number; pitch?: number; lang?: string } = {}
) {
  if (!ttsSupported() || !text.trim()) return;
  window.speechSynthesis.cancel(); // Stop any pending utterance to avoid queue lag

  const u = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  if (opts.voice) {
    u.voice = opts.voice;
  } else if (opts.voiceName) {
    const matched = voices.find((v) => v.name === opts.voiceName);
    if (matched) u.voice = matched;
  }

  u.rate = opts.rate ?? 1.0;
  u.pitch = opts.pitch ?? 1.0;
  u.lang = opts.lang ?? u.voice?.lang ?? "en-US";
  window.speechSynthesis.speak(u);
}

export function testVoice(voiceName?: string, rate: number = 1.0) {
  speak("Hello! This is your SignCall voice preview.", { voiceName, rate });
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}
