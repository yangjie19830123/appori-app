// app/jp/verb/lib/useSpeech.ts
//
// Minimal Japanese TTS hook using Web Speech API.
// Same pattern as the kanji tool's hook, simplified.

"use client";

import { useCallback, useEffect, useState } from "react";

type SpeakOptions = {
  rate?: number;        // 0.5 - 2.0
  onEnd?: () => void;
  onError?: () => void;
};

export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    setSupported(true);

    // Load voices (some browsers populate them asynchronously)
    const load = () => {
      const all = speechSynthesis.getVoices();
      // Prefer Japanese voices
      const ja = all.filter((v) => v.lang.startsWith("ja"));
      setVoices(ja.length > 0 ? ja : all);
    };
    load();
    speechSynthesis.onvoiceschanged = load;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (!supported || !text) return;
      speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP";
      u.rate = opts.rate ?? 1.0;
      // Prefer a Japanese voice if available
      const jaVoice = voices.find((v) => v.lang.startsWith("ja"));
      if (jaVoice) u.voice = jaVoice;

      u.onstart = () => setSpeaking(true);
      u.onend = () => {
        setSpeaking(false);
        opts.onEnd?.();
      };
      u.onerror = () => {
        setSpeaking(false);
        opts.onError?.();
      };

      speechSynthesis.speak(u);
    },
    [supported, voices]
  );

  const stop = useCallback(() => {
    if (!supported) return;
    speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { supported, speaking, speak, stop, voices };
}
