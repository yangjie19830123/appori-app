"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Card, Color } from "../lib/types";
import { getPlayerId, getPlayerName } from "../lib/identity";
import { useRoomSync } from "../lib/useRoomSync";
import { canPlay } from "../lib/engine";
import { UnoCard } from "../components/UnoCard";
import { Hand } from "../components/Hand";
import { Table } from "../components/Table";
import { PlayersBar } from "../components/PlayersBar";
import { ColorPicker } from "../components/ColorPicker";
import { GameLog } from "../components/GameLog";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = String(params?.room ?? "").toUpperCase();

  const [pid, setPid] = useState("");
  const [name, setName] = useState("");
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);

  // 客户端身份
  useEffect(() => {
    const id = getPlayerId();
    const nm = getPlayerName();
    setPid(id);
    setName(nm);
    // 没昵称就回大厅
    if (!nm) router.replace("/uno");
  }, [router]);

  // 重新进入或刷新时若不在房间内则尝试加入
  useEffect(() => {
    if (!pid || !name || !roomId) return;
    (async () => {
      // 直接尝试 join，已在房间则后端会返回幂等结果
      await fetch("/uno/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, playerId: pid, playerName: name }),
      });
    })();
  }, [pid, name, roomId]);

  const { state, error, loading, dispatch } = useRoomSync(roomId, pid);

  // 离开
  const handleLeave = async () => {
    await fetch("/uno/api/room/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, playerId: pid }),
    });
    router.push("/uno");
  };

  const handleStart = async () => {
    await fetch("/uno/api/room/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, playerId: pid }),
    });
  };

  const copyRoom = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
    } catch {}
  };

  const isMyTurn = useMemo(() => {
    if (!state) return false;
    return state.players[state.turnIndex]?.id === state.yourId;
  }, [state]);

  const myCardCount = state?.yourHand.length ?? 0;

  // 出牌处理：万能牌弹出选色
  const handlePlay = async (card: Card) => {
    if (!state) return;
    if (card.color === "wild") {
      setPendingWildCard(card);
      return;
    }
    await dispatch({ type: "play", cardId: card.id });
  };

  const handlePickColor = async (c: Color) => {
    if (!pendingWildCard) return;
    await dispatch({
      type: "play",
      cardId: pendingWildCard.id,
      chosenColor: c,
    });
    setPendingWildCard(null);
  };

  // ── Loading / Error ──────────────────────────────────────────────
  if (loading || !state) {
    return (
      <main className="min-h-screen flex items-center justify-center uno-text-cream/70">
        {error ? (
          <div className="text-center">
            <div className="uno-text-red font-bold mb-3">{error}</div>
            <button
              type="button"
              onClick={() => router.push("/uno")}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm"
            >
              返回大厅
            </button>
          </div>
        ) : (
          <div className="uno-font-display italic text-2xl uno-anim-pulse">加载中…</div>
        )}
      </main>
    );
  }

  // ── 大厅（等待开始） ────────────────────────────────────────────
  if (state.phase === "lobby") {
    const isHost = state.hostId === state.yourId;
    return (
      <main className="min-h-screen px-5 pt-8 pb-10 max-w-md mx-auto flex flex-col">
        <button
          type="button"
          onClick={handleLeave}
          className="self-start uno-text-cream/60 text-sm mb-4"
        >
          ← 离开
        </button>

        <div className="text-center">
          <div className="text-xs uppercase tracking-widest uno-text-cream/60">
            房间号
          </div>
          <button
            type="button"
            onClick={copyRoom}
            className="uno-font-display italic text-[56px] tracking-[0.15em] leading-none mt-1 uno-text-yellow drop-shadow-[4px_4px_0_#000] active:scale-95 transition"
          >
            {state.roomId}
          </button>
          <div className="text-xs uno-text-cream/50 mt-2">点击复制 · 分享给朋友</div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm uppercase tracking-widest uno-text-cream/60 mb-3">
            玩家 · {state.players.length} / 10
          </h3>
          <ul className="space-y-2">
            {state.players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="w-8 h-8 rounded-full uno-bg-cream uno-text-ink grid place-items-center font-bold">
                  {p.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-bold flex items-center gap-2">
                    {p.name}
                    {p.id === state.hostId && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded uno-bg-yellow uno-text-ink font-bold">
                        房主
                      </span>
                    )}
                    {p.id === state.yourId && (
                      <span className="text-[10px] uno-text-cream/60">（你）</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto pt-8">
          {isHost ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={state.players.length < 2}
              className="w-full py-4 rounded-2xl uno-bg-green text-white uno-font-display italic text-2xl border-4 border-black shadow-[6px_6px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000] transition disabled:opacity-50"
            >
              {state.players.length < 2 ? "等待玩家加入…" : "开 始 游 戏"}
            </button>
          ) : (
            <div className="text-center uno-text-cream/60 text-sm">
              等待房主开始游戏…
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── 游戏结束 ───────────────────────────────────────────────────
  if (state.phase === "ended") {
    const winner = state.players.find((p) => p.id === state.winnerId);
    const isHost = state.hostId === state.yourId;
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="uno-font-display italic text-7xl uno-text-yellow drop-shadow-[6px_6px_0_#000] uno-anim-deal">
          🏆
        </div>
        <h1 className="uno-font-display italic text-4xl mt-4">{winner?.name}</h1>
        <p className="uno-text-cream/70 mt-2">获 胜</p>
        <div className="mt-10 w-full max-w-xs space-y-3">
          {isHost && (
            <button
              type="button"
              onClick={handleStart}
              className="w-full py-3.5 rounded-2xl uno-bg-green text-white uno-font-display italic text-xl border-4 border-black shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000] transition"
            >
              再来一局
            </button>
          )}
          <button
            type="button"
            onClick={handleLeave}
            className="w-full py-3.5 rounded-2xl bg-white/10 border border-white/20 font-bold"
          >
            离开房间
          </button>
        </div>
      </main>
    );
  }

  // ── 游戏中 ────────────────────────────────────────────────────
  return (
    <main className="h-[100dvh] flex flex-col">
      {/* 顶部：房间号小标 + 离开 */}
      <div className="flex items-center justify-between px-3 pt-2 text-xs">
        <button
          type="button"
          onClick={handleLeave}
          className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 uno-text-cream/70"
        >
          离开
        </button>
        <button
          type="button"
          onClick={copyRoom}
          className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 uno-font-display italic tracking-widest"
        >
          {state.roomId}
        </button>
      </div>

      <PlayersBar state={state} onCatchUno={(id) => dispatch({ type: "catch_uno", targetId: id })} />

      <Table
        state={state}
        onDraw={() => dispatch({ type: "draw" })}
        canDraw={isMyTurn}
      />

      {/* 操作行：UNO / 跳过 */}
      <div className="px-3 pb-1 flex items-center gap-2">
        <button
          type="button"
          disabled={myCardCount !== 1}
          onClick={() => dispatch({ type: "call_uno" })}
          className="px-4 py-2 rounded-full uno-bg-red text-white uno-font-display italic text-lg border-2 border-black disabled:opacity-40"
        >
          UNO!
        </button>
        {isMyTurn && (
          <button
            type="button"
            onClick={() => dispatch({ type: "pass" })}
            className="ml-auto px-3 py-2 rounded-full bg-white/10 border border-white/20 text-sm"
          >
            跳过回合
          </button>
        )}
      </div>

      <Hand state={state} onPlay={handlePlay} isMyTurn={isMyTurn} />

      <ColorPicker
        open={!!pendingWildCard}
        onPick={handlePickColor}
        onCancel={() => setPendingWildCard(null)}
      />

      <GameLog log={state.log} />

      {error && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-full uno-bg-red text-white text-xs font-bold">
          {error}
        </div>
      )}
    </main>
  );
}
