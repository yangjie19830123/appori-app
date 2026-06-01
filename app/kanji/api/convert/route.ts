import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { applyOverrides } from "./overrides";

let tokenizerPromise: Promise<any> | null = null;

function findDictPath(): string {
  const testFile = "base.dat.gz";
  const candidates = [
    path.join(process.cwd(), "dict"),
    "/var/task/dict",
    path.join(process.cwd(), "node_modules", "kuromoji", "dict"),
    "/var/task/node_modules/kuromoji/dict",
  ];
  try {
    const pkgPath = require.resolve("kuromoji/package.json");
    candidates.push(path.join(path.dirname(pkgPath), "dict"));
  } catch {}
  try {
    candidates.push(path.resolve(__dirname, "dict"));
    candidates.push(path.resolve(__dirname, "..", "dict"));
    candidates.push(path.resolve(__dirname, "..", "..", "dict"));
    candidates.push(path.resolve(__dirname, "..", "..", "..", "dict"));
  } catch {}
  console.log("[kuromoji] Searching for dict in candidates:", candidates);
  for (const p of candidates) {
    try {
      const fullPath = path.join(p, testFile);
      if (fs.existsSync(fullPath)) {
        console.log("[kuromoji] ✅ Found dict at:", p);
        return p;
      } else {
        console.log("[kuromoji] ❌ Not at:", p);
      }
    } catch (e) {
      console.log("[kuromoji] ❌ Error checking:", p, e);
    }
  }
  try {
    const taskDir = fs.readdirSync("/var/task").join(", ");
    console.log("[kuromoji] /var/task contents:", taskDir);
  } catch {}
  try {
    const cwdDir = fs.readdirSync(process.cwd()).join(", ");
    console.log("[kuromoji] cwd contents:", cwdDir);
  } catch {}
  const fallback = path.join(process.cwd(), "dict");
  console.log("[kuromoji] ⚠️ Using fallback:", fallback);
  return fallback;
}

function getTokenizer() {
  if (tokenizerPromise) return tokenizerPromise;
  tokenizerPromise = new Promise((resolve, reject) => {
    const kuromoji = require("kuromoji");
    const dicPath = findDictPath();
    kuromoji.builder({ dicPath }).build((err: any, tokenizer: any) => {
      if (err) {
        console.error("[kuromoji] Build error:", err.message);
        tokenizerPromise = null;
        reject(err);
      } else {
        console.log("[kuromoji] ✅ Tokenizer ready");
        resolve(tokenizer);
      }
    });
  });
  return tokenizerPromise;
}

function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

function hasKanji(str: string): boolean {
  return /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(str);
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "テキストが必要です" }, { status: 400 });
    }
    if (text.length > 5000) {
      return NextResponse.json({ error: "5000文字以内にしてください" }, { status: 400 });
    }
    const tokenizer = await getTokenizer();
    const tokens = tokenizer.tokenize(text);
    const results: any[] = [];
    for (const token of tokens) {
      const surface = token.surface_form;
      let reading = surface;
      if (token.reading && token.reading !== "*") {
        reading = katakanaToHiragana(token.reading);
      }
      results.push({
        surface,
        reading,
        hasKanji: hasKanji(surface),
        pos: token.pos || "",
      });
    }

    // Apply override dictionary to fix known misreadings (令和, 地名, 政府用語など)
    const fixedResults = applyOverrides(results);

    // Build hiragana string from the fixed tokens
    const fullHiragana = fixedResults.map((t) => t.reading).join("");

    return NextResponse.json({ tokens: fixedResults, hiragana: fullHiragana, original: text });
  } catch (err: any) {
    console.error("[Convert]", err);
    return NextResponse.json({ error: err.message || "変換に失敗しました" }, { status: 500 });
  }
}
