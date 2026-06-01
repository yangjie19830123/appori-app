"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayerId, getPlayerName, setPlayerName } from "./lib/identity";

export default function UnoLobbyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(getPlayerName());
  }, []);

  const validName = (name?: string) => {
    const v = (name ?? "").trim();
    return v.length >= 1 && v.length <= 12;
  };

  const handleCreate = async () => {
    if (!validName(name)) {
      setError("请输入 1–12 字昵称");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      setPlayerName(name.trim());
      const r = await fetch("/uno/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: getPlayerId(), playerName: name.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "创建失败");
      router.push(`/uno/${d.roomId}`);
    } catch (e: any) {
      setError(e.message || "创建失败");
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!validName(name)) {
      setError("请输入 1–12 字昵称");
      return;
    }
    if (roomCode.trim().length < 4) {
      setError("请输入完整的房间号");
      return;
    }
    setError(null);
    setJoining(true);
    try {
      setPlayerName(name.trim());
      const r = await fetch("/uno/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: roomCode.trim().toUpperCase(),
          playerId: getPlayerId(),
          playerName: name.trim(),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "加入失败");
      router.push(`/uno/${d.roomId}`);
    } catch (e: any) {
      setError(e.message || "加入失败");
      setJoining(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-5 pt-14 pb-10 max-w-md mx-auto">
      {/* Logo */}
      <div className="relative mb-2 select-none">
        <div className="uno-font-display italic text-[88px] leading-none uno-text-red drop-shadow-[6px_6px_0_#000]">
          UNO
        </div>
        <div className="absolute -right-3 top-2 px-2 py-0.5 rounded-full uno-bg-yellow uno-text-ink text-[10px] font-bold rotate-12 border-2 border-black shadow-md">
          APPORI
        </div>
      </div>
      <p className="uno-text-cream/70 text-sm tracking-wide mb-10">
        在线多人 · 标准规则 · 输入房间号即可
      </p>

      {/* 昵称 */}
      <label className="w-full">
        <span className="block text-xs uppercase tracking-widest uno-text-cream/60 mb-2">
          你的昵称
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={12}
          placeholder="例如：阿毛"
          className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 focus:uno-border-yellow focus:outline-none text-lg font-bold"
        />
      </label>

      {/* 创建房间 */}
      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        className="w-full mt-6 py-4 rounded-2xl uno-bg-red text-white uno-font-display italic text-2xl border-4 border-black shadow-[6px_6px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000] transition disabled:opacity-60"
      >
        {creating ? "创建中…" : "开新房间"}
      </button>

      <div className="my-5 w-full flex items-center gap-3 uno-text-cream/40 text-xs">
        <div className="flex-1 h-px bg-white/10" />
        或加入已有房间
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* 加入 */}
      <input
        type="text"
        value={roomCode}
        onChange={(e) =>
          setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
        }
        maxLength={6}
        placeholder="6 位房间号"
        className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 focus:uno-border-blue focus:outline-none text-2xl uno-font-display italic tracking-[0.4em] text-center uppercase"
      />
      <button
        type="button"
        onClick={handleJoin}
        disabled={joining}
        className="w-full mt-3 py-4 rounded-2xl uno-bg-blue text-white uno-font-display italic text-2xl border-4 border-black shadow-[6px_6px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000] transition disabled:opacity-60"
      >
        {joining ? "加入中…" : "加入房间"}
      </button>

      {error && (
        <div className="mt-5 px-4 py-2.5 rounded-xl uno-bg-red/20 border uno-border-red/40 text-sm font-bold uno-anim-shake">
          {error}
        </div>
      )}

      <div className="mt-auto pt-12 text-xs uno-text-cream/40 text-center leading-relaxed">
        昵称会保存在你的浏览器里。<br />
        房间 6 小时无活动会自动清理。
      </div>
    </main>
  );
}
