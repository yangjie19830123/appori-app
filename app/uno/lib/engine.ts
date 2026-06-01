import type {
  Action,
  Card,
  Color,
  GameState,
  Player,
  PublicGameState,
  Value,
} from "./types";
import { buildDeck, shuffle } from "./deck";

// ────────────────────────────────────────────────────────────────────────────
// 房间码（6 位大写字母，去除易混 I/O）
const ROOM_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeRoomCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += ROOM_ALPHA[Math.floor(Math.random() * ROOM_ALPHA.length)];
  }
  return s;
}

// ────────────────────────────────────────────────────────────────────────────
// 房间初始化（只创建空房间，开始时再发牌）
export function createRoom(roomId: string, host: { id: string; name: string }): GameState {
  const now = Date.now();
  return {
    roomId,
    hostId: host.id,
    phase: "lobby",
    players: [
      {
        id: host.id,
        name: host.name,
        hand: [],
        saidUno: false,
        connected: true,
      },
    ],
    drawPile: [],
    discardPile: [],
    currentColor: "wild",
    turnIndex: 0,
    direction: 1,
    pendingDraw: 0,
    winnerId: null,
    log: [{ ts: now, text: `房间已创建，房主：${host.name}` }],
    createdAt: now,
    updatedAt: now,
  };
}

export function addPlayer(state: GameState, p: { id: string; name: string }): GameState {
  if (state.phase !== "lobby") return state;
  if (state.players.find(x => x.id === p.id)) return state;     // 同 id 已在
  if (state.players.length >= 10) return state;                 // 上限 10 人
  const player: Player = {
    id: p.id,
    name: p.name,
    hand: [],
    saidUno: false,
    connected: true,
  };
  return {
    ...state,
    players: [...state.players, player],
    log: pushLog(state.log, `${p.name} 加入了房间`),
    updatedAt: Date.now(),
  };
}

export function removePlayer(state: GameState, playerId: string): GameState {
  const p = state.players.find(x => x.id === playerId);
  if (!p) return state;

  if (state.phase === "lobby") {
    let players = state.players.filter(x => x.id !== playerId);
    let hostId = state.hostId;
    if (hostId === playerId && players.length > 0) hostId = players[0].id;
    return {
      ...state,
      players,
      hostId,
      log: pushLog(state.log, `${p.name} 离开了房间`),
      updatedAt: Date.now(),
    };
  }

  // 游戏中：标记掉线，不直接踢出，避免破坏顺序
  return {
    ...state,
    players: state.players.map(x =>
      x.id === playerId ? { ...x, connected: false } : x,
    ),
    log: pushLog(state.log, `${p.name} 掉线了`),
    updatedAt: Date.now(),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 开局：洗牌 + 每人发 7 张 + 翻起首张（避开 wild_draw4 作为首张）
export function startGame(state: GameState): GameState {
  if (state.phase !== "lobby") return state;
  if (state.players.length < 2) return state;

  let deck = shuffle(buildDeck());
  const players = state.players.map(p => ({ ...p, hand: [] as Card[], saidUno: false }));

  // 发牌
  for (let r = 0; r < 7; r++) {
    for (const p of players) {
      p.hand.push(deck.pop()!);
    }
  }

  // 翻一张当首张，避开 wild_draw4（按官方规则）
  let first: Card | undefined;
  while (deck.length) {
    const c = deck.pop()!;
    if (c.value !== "wild_draw4") {
      first = c;
      break;
    }
    // 是 wild_draw4，塞回中间，继续翻
    deck.splice(Math.floor(deck.length / 2), 0, c);
  }
  if (!first) {
    // 极小概率，重洗
    return startGame(state);
  }

  let direction: 1 | -1 = 1;
  let turnIndex = 0;
  let currentColor: Color = first.color === "wild" ? "wild" : first.color;
  const log = pushLog(state.log, `游戏开始！`);

  // 首张如果是动作牌，按规则处理（首张为 wild：当前玩家选色，但简化处理：随机指定）
  let pendingDraw = 0;
  if (first.value === "skip") turnIndex = (turnIndex + 1) % players.length;
  if (first.value === "reverse") direction = -1;
  if (first.value === "draw2") pendingDraw = 2;
  if (first.value === "wild") currentColor = "red"; // 简化：默认红色，实际可让首位玩家选

  return {
    ...state,
    phase: "playing",
    players,
    drawPile: deck,
    discardPile: [first],
    currentColor,
    turnIndex,
    direction,
    pendingDraw,
    winnerId: null,
    log,
    updatedAt: Date.now(),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 出牌合法性
export function canPlay(card: Card, top: Card, currentColor: Color): boolean {
  if (card.color === "wild") return true;
  if (card.color === currentColor) return true;
  if (card.value === top.value) return true;
  return false;
}

// 推进到下一位玩家
function nextIndex(state: GameState, step = 1): number {
  const n = state.players.length;
  return ((state.turnIndex + state.direction * step) % n + n) % n;
}

// 把弃牌堆除顶张外洗回抽牌堆
function reshuffleIfNeeded(state: GameState): GameState {
  if (state.drawPile.length > 0) return state;
  if (state.discardPile.length <= 1) return state;
  const top = state.discardPile[state.discardPile.length - 1];
  const rest = state.discardPile.slice(0, -1).map(c => {
    // 重洗时把万能牌的颜色重置为 wild
    if (c.value === "wild" || c.value === "wild_draw4") {
      return { ...c, color: "wild" as Color };
    }
    return c;
  });
  return {
    ...state,
    drawPile: shuffle(rest),
    discardPile: [top],
    log: pushLog(state.log, `弃牌堆已洗回抽牌堆`),
  };
}

// 抽 n 张给玩家
function drawNTo(state: GameState, playerId: string, n: number): GameState {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = reshuffleIfNeeded(s);
    if (s.drawPile.length === 0) break;
    const card = s.drawPile[s.drawPile.length - 1];
    s = {
      ...s,
      drawPile: s.drawPile.slice(0, -1),
      players: s.players.map(p =>
        p.id === playerId ? { ...p, hand: [...p.hand, card] } : p,
      ),
    };
  }
  return s;
}

// ────────────────────────────────────────────────────────────────────────────
// 主入口：reduce 一个动作
export function applyAction(state: GameState, playerId: string, action: Action): GameState {
  if (state.phase !== "playing") return state;

  // call_uno 和 catch_uno 不限定回合
  if (action.type === "call_uno") {
    return {
      ...state,
      players: state.players.map(p =>
        p.id === playerId && p.hand.length === 1 ? { ...p, saidUno: true } : p,
      ),
      log: pushLog(
        state.log,
        `${nameOf(state, playerId)} 喊了 UNO！`,
      ),
      updatedAt: Date.now(),
    };
  }

  if (action.type === "catch_uno") {
    const target = state.players.find(p => p.id === action.targetId);
    if (!target) return state;
    if (target.hand.length === 1 && !target.saidUno) {
      // 抓到了，target 罚抽 2
      let s = drawNTo(state, target.id, 2);
      s = {
        ...s,
        log: pushLog(s.log, `${nameOf(s, playerId)} 抓到 ${target.name} 没喊 UNO，罚抽 2`),
        updatedAt: Date.now(),
      };
      return s;
    }
    return state;
  }

  // 以下动作必须是当前回合玩家
  const current = state.players[state.turnIndex];
  if (current.id !== playerId) return state;

  if (action.type === "draw") {
    let s = drawNTo(state, playerId, 1);
    // 抽到的牌是否能立即出？官方规则允许，但简化：抽完进入"可出可过"状态。
    // 这里我们直接结束回合，让玩家通过 pass 主动结束，或在下一次 play 出掉。
    // 为了流程更顺，抽完后判定：若新抽的能出 → 可继续 play 那张牌；否则自动 pass。
    const drawn = s.players.find(p => p.id === playerId)!.hand.slice(-1)[0];
    const top = s.discardPile[s.discardPile.length - 1];
    if (drawn && canPlay(drawn, top, s.currentColor)) {
      // 留给玩家选择，加一条日志即可
      s = {
        ...s,
        log: pushLog(s.log, `${current.name} 抽了一张牌`),
        updatedAt: Date.now(),
      };
      return s;
    }
    // 不能出，自动结束回合
    s = {
      ...s,
      turnIndex: nextIndex(s),
      log: pushLog(s.log, `${current.name} 抽了一张牌`),
      updatedAt: Date.now(),
    };
    return s;
  }

  if (action.type === "pass") {
    // 结束当前回合（仅在已抽过牌的情况下允许，从前端控制）
    return {
      ...state,
      turnIndex: nextIndex(state),
      log: pushLog(state.log, `${current.name} 跳过了回合`),
      updatedAt: Date.now(),
    };
  }

  if (action.type === "play") {
    const player = state.players[state.turnIndex];
    const cardIdx = player.hand.findIndex(c => c.id === action.cardId);
    if (cardIdx < 0) return state;
    const card = player.hand[cardIdx];
    const top = state.discardPile[state.discardPile.length - 1];

    if (!canPlay(card, top, state.currentColor)) return state;
    if (card.color === "wild" && !action.chosenColor) return state;
    if (action.chosenColor && action.chosenColor === "wild") return state;

    // 从手牌中移除
    const newHand = player.hand.slice(0, cardIdx).concat(player.hand.slice(cardIdx + 1));
    let players = state.players.map((p, i) =>
      i === state.turnIndex ? { ...p, hand: newHand } : p,
    );
    let discardPile = [...state.discardPile, card];
    let direction: 1 | -1 = state.direction;
    let currentColor: Color =
      card.color === "wild" ? action.chosenColor! : card.color;
    let log = pushLog(state.log, `${player.name} 出 ${cardLabel(card)}`);

    // 出牌后：先看是否胜利
    if (newHand.length === 0) {
      // 胜利前检查最后一张是 +2/+4：依然要让下家罚抽再结束
      let s: GameState = {
        ...state,
        players,
        discardPile,
        currentColor,
        log,
        updatedAt: Date.now(),
      };
      if (card.value === "draw2") {
        const nextIdx = ((state.turnIndex + state.direction) % state.players.length + state.players.length) % state.players.length;
        const targetId = s.players[nextIdx].id;
        s = drawNTo(s, targetId, 2);
      } else if (card.value === "wild_draw4") {
        const nextIdx = ((state.turnIndex + state.direction) % state.players.length + state.players.length) % state.players.length;
        const targetId = s.players[nextIdx].id;
        s = drawNTo(s, targetId, 4);
      }
      s = {
        ...s,
        phase: "ended",
        winnerId: player.id,
        log: pushLog(s.log, `🏆 ${player.name} 获胜！`),
      };
      return s;
    }

    // 喊 UNO 状态：剩 1 张时把 saidUno 重置为 false（要重新喊）
    if (newHand.length === 1) {
      players = players.map(p =>
        p.id === player.id ? { ...p, saidUno: false } : p,
      );
    } else {
      players = players.map(p =>
        p.id === player.id ? { ...p, saidUno: false } : p,
      );
    }

    // 处理动作牌效果
    let turnIndex = state.turnIndex;
    let s2: GameState = {
      ...state,
      players,
      discardPile,
      currentColor,
      direction,
      log,
      updatedAt: Date.now(),
    };

    switch (card.value) {
      case "skip": {
        // 跳过下家
        s2.turnIndex = nextStep(s2, 2);
        s2.log = pushLog(s2.log, `下一位玩家被跳过`);
        break;
      }
      case "reverse": {
        if (s2.players.length === 2) {
          // 二人时 reverse 等同 skip
          s2.turnIndex = nextStep(s2, 2);
          s2.log = pushLog(s2.log, `方向反转（二人=跳过）`);
        } else {
          s2.direction = (s2.direction === 1 ? -1 : 1) as 1 | -1;
          s2.turnIndex = nextStepWithDir(s2, 1, s2.direction);
          s2.log = pushLog(s2.log, `方向反转`);
        }
        break;
      }
      case "draw2": {
        const nextIdx = nextStep(s2, 1);
        const targetId = s2.players[nextIdx].id;
        s2 = drawNTo(s2, targetId, 2);
        s2.turnIndex = nextStep(s2, 2);
        s2.log = pushLog(s2.log, `${s2.players[nextIdx].name} 罚抽 2 并被跳过`);
        break;
      }
      case "wild_draw4": {
        const nextIdx = nextStep(s2, 1);
        const targetId = s2.players[nextIdx].id;
        s2 = drawNTo(s2, targetId, 4);
        s2.turnIndex = nextStep(s2, 2);
        s2.log = pushLog(s2.log, `${s2.players[nextIdx].name} 罚抽 4 并被跳过`);
        break;
      }
      default: {
        s2.turnIndex = nextStep(s2, 1);
      }
    }
    return s2;
  }

  return state;
}

// 在已变更的 state 上算下家（用 state.direction）
function nextStep(s: GameState, step: number): number {
  const n = s.players.length;
  return ((s.turnIndex + s.direction * step) % n + n) % n;
}
function nextStepWithDir(s: GameState, step: number, dir: 1 | -1): number {
  const n = s.players.length;
  return ((s.turnIndex + dir * step) % n + n) % n;
}

// ────────────────────────────────────────────────────────────────────────────
// 工具
function pushLog(log: GameState["log"], text: string): GameState["log"] {
  const next = [...log, { ts: Date.now(), text }];
  return next.slice(-50); // 最多保留 50 条
}

function nameOf(state: GameState, id: string): string {
  return state.players.find(p => p.id === id)?.name ?? "?";
}

export function cardLabel(c: Card): string {
  const v: Record<Value, string> = {
    "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
    "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
    skip: "跳过", reverse: "反转", draw2: "+2",
    wild: "变色", wild_draw4: "+4变色",
  };
  const colorMap: Partial<Record<Color, string>> = {
    red: "红", yellow: "黄", green: "绿", blue: "蓝",
  };
  if (c.color === "wild") return v[c.value];
  return `${colorMap[c.color] ?? ""}${v[c.value]}`;
}

// ────────────────────────────────────────────────────────────────────────────
// 给某玩家"脱敏"的 state
export function publicView(state: GameState, viewerId: string): PublicGameState {
  const me = state.players.find(p => p.id === viewerId);
  return {
    roomId: state.roomId,
    hostId: state.hostId,
    phase: state.phase,
    currentColor: state.currentColor,
    turnIndex: state.turnIndex,
    direction: state.direction,
    pendingDraw: state.pendingDraw,
    winnerId: state.winnerId,
    log: state.log,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    discardPile: state.discardPile.slice(-3), // 只暴露顶上 3 张
    players: state.players.map(p => ({
      id: p.id,
      name: p.name,
      handCount: p.hand.length,
      saidUno: p.saidUno,
      connected: p.connected,
    })),
    drawPileCount: state.drawPile.length,
    yourHand: me?.hand ?? [],
    yourId: viewerId,
  };
}
