import { NextRequest, NextResponse } from "next/server";
import { applyAction, publicView } from "../../lib/engine";
import { mutateRoom } from "../../lib/store";
import { broadcastUpdate } from "../../lib/pusher";
import type { Action } from "../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { roomId, playerId, action } = body as {
    roomId: string;
    playerId: string;
    action: Action;
  };
  if (!roomId || !playerId || !action) {
    return NextResponse.json({ error: "参数不全" }, { status: 400 });
  }

  const next = await mutateRoom(roomId, s => applyAction(s, playerId, action));
  if (!next) return NextResponse.json({ error: "房间不存在" }, { status: 404 });

  await broadcastUpdate(roomId);
  return NextResponse.json({ state: publicView(next, playerId) });
}
