"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type SpeakOptions = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (e: SpeechSynthesisErrorEvent) => void;
};

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1.0);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const currentUtterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Detect browser support + load Japanese voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      // Filter Japanese voices (ja-JP, ja, ja_JP)
      const ja = all.filter((v) => v.lang.toLowerCase().startsWith("ja"));
      setVoices(ja);
      if (ja.length > 0 && !voice) {
        // Prefer high-quality voices on macOS/iOS (Kyoko, Otoya), Windows (Haruka, Ayumi)
        const preferred =
          ja.find((v) => /kyoko|otoya|haruka|ayumi|sayaka/i.test(v.name)) ||
          ja.find((v) => v.localService) ||
          ja[0];
        setVoice(preferred);
      }
    };

    loadVoices();
    // Voices load asynchronously in Chrome
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [voice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (!supported || !text.trim()) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP";
      u.rate = rate;
      u.pitch = 1.0;
      u.volume = 1.0;
      if (voice) u.voice = voice;

      u.onstart = () => {
        setSpeaking(true);
        setPaused(false);
        opts.onStart?.();
      };
      u.onend = () => {
        setSpeaking(false);
        setPaused(false);
        currentUtterRef.current = null;
        opts.onEnd?.();
      };
      u.onerror = (e) => {
        setSpeaking(false);
        setPaused(false);
        currentUtterRef.current = null;
        opts.onError?.(e);
      };

      currentUtterRef.current = u;
      window.speechSynthesis.speak(u);
    },
    [supported, rate, voice]
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    currentUtterRef.current = null;
  }, [supported]);

  const pause = useCallback(() => {
    if (!supported || !speaking) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }, [supported, speaking]);

  const resume = useCallback(() => {
    if (!supported || !paused) return;
    window.speechSynthesis.resume();
    setPaused(false);
  }, [supported, paused]);

  return {
    supported,
    voices,
    voice,
    setVoice,
    rate,
    setRate,
    speaking,
    paused,
    speak,
    stop,
    pause,
    resume,
  };
}
