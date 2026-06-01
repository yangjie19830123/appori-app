"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Action, PublicGameState } from "./types";
import { pusherClient } from "./pusherClient";

export function useRoomSync(roomId: string, playerId: string) {
  const [state, setState] = useState<PublicGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const r = await fetch(
        `/uno/api/room/state?roomId=${encodeURIComponent(roomId)}&playerId=${encodeURIComponent(playerId)}`,
        { cache: "no-store" },
      );
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "加载失败");
      } else {
        setState(d.state);
        setError(null);
      }
    } catch (e: any) {
      setError(e?.message || "网络错误");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [roomId, playerId]);

  useEffect(() => {
    if (!roomId || !playerId) return;
    refresh();
    const p = pusherClient();
    const ch = p.subscribe(`room-${roomId}`);
    ch.bind("update", () => {
      refresh();
    });
    return () => {
      ch.unbind_all();
      p.unsubscribe(`room-${roomId}`);
    };
  }, [roomId, playerId, refresh]);

  const dispatch = useCallback(
    async (action: Action) => {
      const r = await fetch("/uno/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, playerId, action }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "操作失败");
        // 短暂展示后清掉
        setTimeout(() => setError(null), 2000);
      } else {
        setState(d.state);
      }
      return r.ok;
    },
    [roomId, playerId],
  );

  return { state, error, loading, refresh, dispatch };
}
