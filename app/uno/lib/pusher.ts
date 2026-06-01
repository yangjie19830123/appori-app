import Pusher from "pusher";

let _pusher: Pusher | null = null;

export function pusherServer(): Pusher {
  if (_pusher) return _pusher;
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;
  if (!appId || !key || !secret || !cluster) {
    throw new Error("Missing PUSHER_* env vars");
  }
  _pusher = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
  return _pusher;
}

export const channelOf = (roomId: string) => `room-${roomId}`;

export async function broadcastUpdate(roomId: string): Promise<void> {
  // 仅触发一个 "update" 信号，客户端收到后自行 GET 最新 state
  await pusherServer().trigger(channelOf(roomId), "update", { ts: Date.now() });
}
