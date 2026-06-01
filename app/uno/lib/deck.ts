import type { Card, Color, Value } from "./types";

const COLORS: Color[] = ["red", "yellow", "green", "blue"];

// 标准 UNO 108 张：
// 每色：1 个 0 + 2 个 1-9 + 2 个 skip + 2 个 reverse + 2 个 draw2
// 共 25*4 = 100 张 + 4 张 wild + 4 张 wild_draw4 = 108
export function buildDeck(): Card[] {
  const deck: Card[] = [];
  let n = 0;
  const push = (color: Color, value: Value) => {
    deck.push({ id: `c${n++}`, color, value });
  };

  for (const color of COLORS) {
    push(color, "0");
    for (const v of ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as Value[]) {
      push(color, v);
      push(color, v);
    }
    for (const v of ["skip", "reverse", "draw2"] as Value[]) {
      push(color, v);
      push(color, v);
    }
  }
  for (let i = 0; i < 4; i++) {
    push("wild", "wild");
    push("wild", "wild_draw4");
  }
  return deck;
}

// Fisher–Yates，可注入随机源（便于测试和"伪随机"种子）
export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
