/**
 * Web Speech API wrapper for text-to-speech narration.
 *
 * Used by:
 *   - Per-card "Read this to me" toggle
 *   - Continuous Audio Mode (full feed playback)
 *
 * Falls back silently if the browser doesn't support speechSynthesis.
 */

export function isAudioSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

interface SpeakOptions {
  rate?: number;        // 0.5 - 2.0
  pitch?: number;       // 0 - 2
  voiceLang?: string;   // e.g. "en-US"
  onEnd?: () => void;
  onError?: () => void;
}

/**
 * Speak the given text. Cancels any in-progress speech first.
 * Returns a stop function to abort playback.
 */
export function speak(text: string, opts: SpeakOptions = {}): () => void {
  if (!isAudioSupported() || !text) return () => {};

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = opts.rate ?? 1.0;
  utter.pitch = opts.pitch ?? 1.0;
  utter.lang = opts.voiceLang ?? "en-US";

  // Pick the best matching voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith(utter.lang) && /natural|neural|premium/i.test(v.name)
  );
  if (preferred) utter.voice = preferred;
  else {
    const fallback = voices.find((v) => v.lang.startsWith(utter.lang));
    if (fallback) utter.voice = fallback;
  }

  if (opts.onEnd) utter.onend = opts.onEnd;
  if (opts.onError) utter.onerror = opts.onError;

  window.speechSynthesis.speak(utter);

  return () => {
    if (isAudioSupported()) window.speechSynthesis.cancel();
  };
}

export function stopSpeech(): void {
  if (isAudioSupported()) window.speechSynthesis.cancel();
}
