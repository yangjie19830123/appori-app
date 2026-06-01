import { Redis } from "@upstash/redis";
import type { GameState } from "./types";

let _redis: Redis | null = null;
function redis(): Redis {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN env vars",
    );
  }
  _redis = new Redis({ url, token });
  return _redis;
}

const TTL_SECONDS = 60 * 60 * 6; // 6 小时无更新自动过期

const key = (roomId: string) => `uno:room:${roomId}`;

export async function getRoom(roomId: string): Promise<GameState | null> {
  const v = await redis().get<GameState>(key(roomId));
  return v ?? null;
}

export async function setRoom(state: GameState): Promise<void> {
  await redis().set(key(state.roomId), state, { ex: TTL_SECONDS });
}

export async function deleteRoom(roomId: string): Promise<void> {
  await redis().del(key(roomId));
}

// 简易 mutate：读取 → 变更 → 写回。
// 注意：无锁，并发激烈时后写覆盖前写；UNO 游戏通常不会高并发，可接受。
// 如要严格一致性可改为 WATCH/MULTI 或 Redis Lua 脚本。
export async function mutateRoom(
  roomId: string,
  fn: (s: GameState) => GameState,
): Promise<GameState | null> {
  const cur = await getRoom(roomId);
  if (!cur) return null;
  const next = fn(cur);
  await setRoom(next);
  return next;
}
