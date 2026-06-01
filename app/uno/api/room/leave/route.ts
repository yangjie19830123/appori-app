import { NextRequest, NextResponse } from "next/server";
import { removePlayer } from "../../../lib/engine";
import { mutateRoom, deleteRoom } from "../../../lib/store";
import { broadcastUpdate } from "../../../lib/pusher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { roomId, playerId } = await req.json();
  if (!roomId || !playerId) {
    return NextResponse.json({ error: "参数不全" }, { status: 400 });
  }
  const next = await mutateRoom(roomId, s => removePlayer(s, playerId));
  if (!next) return NextResponse.json({ ok: true });

  // 没人了 → 删房间
  if (next.players.length === 0) {
    await deleteRoom(roomId);
    return NextResponse.json({ ok: true });
  }
  await broadcastUpdate(roomId);
  return NextResponse.json({ ok: true });
}
