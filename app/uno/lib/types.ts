// 颜色：四基本色 + 万能牌占位 wild
export type Color = "red" | "yellow" | "green" | "blue" | "wild";

// 牌面值
export type Value =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "skip" | "reverse" | "draw2"
  | "wild" | "wild_draw4";

export interface Card {
  id: string;       // 唯一 id（同一面值多张要区分）
  color: Color;     // wild / wild_draw4 时为 "wild"
  value: Value;
}

export type Direction = 1 | -1;

export type Phase =
  | "lobby"          // 房间未开始
  | "playing"        // 游戏中
  | "ended";         // 已分胜负

export interface Player {
  id: string;        // 客户端生成的唯一 id
  name: string;      // 昵称
  hand: Card[];      // 手牌（仅自己可见，下行有 sanitize 处理）
  saidUno: boolean;  // 是否已喊 UNO
  connected: boolean;
}

export interface GameState {
  roomId: string;
  hostId: string;             // 房主
  phase: Phase;
  players: Player[];          // 顺序即座次
  drawPile: Card[];
  discardPile: Card[];        // 顶张是 last
  currentColor: Color;        // wild 牌出后会改成具体颜色
  turnIndex: number;
  direction: Direction;
  // 待结算的累积罚抽（叠加 +2 / +4 用，本期默认不开启叠加，先保留字段）
  pendingDraw: number;
  winnerId: string | null;
  // 最近一次系统消息（用于 toast）
  log: { ts: number; text: string }[];
  createdAt: number;
  updatedAt: number;
}

// 发给客户端的"脱敏"状态：别的玩家手牌只暴露数量
export interface PublicGameState
  extends Omit<GameState, "players" | "drawPile"> {
  players: PublicPlayer[];
  drawPileCount: number;
  // 给当前请求方的私有手牌
  yourHand: Card[];
  yourId: string;
}

export interface PublicPlayer {
  id: string;
  name: string;
  handCount: number;
  saidUno: boolean;
  connected: boolean;
}

// 客户端动作
export type Action =
  | { type: "play"; cardId: string; chosenColor?: Color }
  | { type: "draw" }
  | { type: "pass" }      // 抽牌后若不能/不想出，结束回合
  | { type: "call_uno" }  // 主动喊 UNO
  | { type: "catch_uno"; targetId: string }; // 抓没喊 UNO 的人
