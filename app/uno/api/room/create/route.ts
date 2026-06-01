import { NextRequest, NextResponse } from "next/server";
import { createRoom, makeRoomCode, publicView } from "../../../lib/engine";
import { getRoom, setRoom } from "../../../lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { playerId, playerName } = await req.json();
  if (!playerId || !playerName) {
    return NextResponse.json({ error: "缺少 playerId / playerName" }, { status: 400 });
  }

  // 生成不冲突的房间号（最多 5 次重试）
  let roomId = makeRoomCode();
  for (let i = 0; i < 5; i++) {
    const exists = await getRoom(roomId);
    if (!exists) break;
    roomId = makeRoomCode();
  }

  const state = createRoom(roomId, { id: playerId, name: playerName });
  await setRoom(state);

  return NextResponse.json({
    roomId,
    state: publicView(state, playerId),
  });
}
