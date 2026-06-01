import { NextRequest, NextResponse } from "next/server";
import { publicView } from "../../../lib/engine";
import { getRoom } from "../../../lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId")?.toUpperCase().trim();
  const playerId = searchParams.get("playerId");
  if (!roomId || !playerId) {
    return NextResponse.json({ error: "参数不全" }, { status: 400 });
  }
  const s = await getRoom(roomId);
  if (!s) return NextResponse.json({ error: "房间不存在" }, { status: 404 });
  return NextResponse.json({ state: publicView(s, playerId) });
}
