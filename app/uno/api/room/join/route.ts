import { NextRequest, NextResponse } from "next/server";
import { addPlayer, publicView } from "../../../lib/engine";
import { mutateRoom, getRoom } from "../../../lib/store";
import { broadcastUpdate } from "../../../lib/pusher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { roomId, playerId, playerName } = await req.json();
  if (!roomId || !playerId || !playerName) {
    return NextResponse.json({ error: "参数不全" }, { status: 400 });
  }
  const code = String(roomId).toUpperCase().trim();

  const exists = await getRoom(code);
  if (!exists) {
    return NextResponse.json({ error: "房间不存在或已过期" }, { status: 404 });
  }
  if (exists.phase !== "lobby" && !exists.players.find(p => p.id === playerId)) {
    return NextResponse.json({ error: "游戏已开始，无法加入" }, { status: 409 });
  }

  const next = await mutateRoom(code, s => addPlayer(s, { id: playerId, name: playerName }));
  if (!next) {
    return NextResponse.json({ error: "房间不存在" }, { status: 404 });
  }
  await broadcastUpdate(code);

  return NextResponse.json({
    roomId: code,
    state: publicView(next, playerId),
  });
}
