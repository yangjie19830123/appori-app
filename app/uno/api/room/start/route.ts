import { NextRequest, NextResponse } from "next/server";
import { startGame, publicView } from "../../../lib/engine";
import { mutateRoom, getRoom } from "../../../lib/store";
import { broadcastUpdate } from "../../../lib/pusher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { roomId, playerId } = await req.json();
  if (!roomId || !playerId) {
    return NextResponse.json({ error: "参数不全" }, { status: 400 });
  }

  const cur = await getRoom(roomId);
  if (!cur) return NextResponse.json({ error: "房间不存在" }, { status: 404 });
  if (cur.hostId !== playerId) {
    return NextResponse.json({ error: "只有房主能开始游戏" }, { status: 403 });
  }
  if (cur.players.length < 2) {
    return NextResponse.json({ error: "至少需要 2 名玩家" }, { status: 400 });
  }

  const next = await mutateRoom(roomId, s => startGame(s));
  if (!next) return NextResponse.json({ error: "房间不存在" }, { status: 404 });

  await broadcastUpdate(roomId);
  return NextResponse.json({ state: publicView(next, playerId) });
}
