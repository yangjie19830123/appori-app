"use client";

const PID_KEY = "uno:playerId";
const NAME_KEY = "uno:playerName";

function uuid(): string {
  // 优先使用 crypto.randomUUID
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "p_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  let v = window.localStorage.getItem(PID_KEY);
  if (!v) {
    v = uuid();
    window.localStorage.setItem(PID_KEY, v);
  }
  return v;
}

export function getPlayerName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

export function setPlayerName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, name);
}
