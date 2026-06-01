"use client";

import PusherClient from "pusher-js";

let _client: PusherClient | null = null;

export function pusherClient(): PusherClient {
  if (_client) return _client;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) {
    throw new Error(
      "Missing NEXT_PUBLIC_PUSHER_KEY / NEXT_PUBLIC_PUSHER_CLUSTER",
    );
  }
  _client = new PusherClient(key, { cluster });
  return _client;
}
