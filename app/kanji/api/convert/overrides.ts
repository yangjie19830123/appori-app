/**
 * Override dictionary for fixing kuromoji misreadings.
 *
 * kuromoji uses IPADIC (frozen ~2007), so words created/popularized after that
 * are often misread because the analyzer falls back to single-character readings.
 *
 * Key: the surface form (kanji string as it appears in text)
 * Value: { reading: correct hiragana reading, pos?: optional 品詞 }
 *
 * Add new entries here as you encounter them.
 */

export type Override = {
  reading: string; // ふりがな (hiragana)
  pos?: string;    // 品詞 (optional)
};

export const OVERRIDES: Record<string, Override> = {
  // ─── 年号 (Era names) ───
  "令和": { reading: "れいわ", pos: "名詞" },
  "平成": { reading: "へいせい", pos: "名詞" },
  "昭和": { reading: "しょうわ", pos: "名詞" },
  "大正": { reading: "たいしょう", pos: "名詞" },
  "明治": { reading: "めいじ", pos: "名詞" },

  // ─── 令和 + 数字 (commonly written together in official documents) ───
  // These appear as "令和八年" "令和五年" etc. in notices. kuromoji often
  // splits this awkwardly. We handle the base "令和" — combinations should
  // be tokenized correctly once 令和 is right.

  // ─── 新冠 / 医疗 / 政府类 (Post-2020 vocab) ───
  "新型コロナ": { reading: "しんがたコロナ", pos: "名詞" },
  "新型コロナウイルス": { reading: "しんがたコロナウイルス", pos: "名詞" },
  "コロナ禍": { reading: "コロナか", pos: "名詞" },
  "厚労省": { reading: "こうろうしょう", pos: "名詞" },
  "経産省": { reading: "けいさんしょう", pos: "名詞" },
  "文科省": { reading: "もんかしょう", pos: "名詞" },
  "国交省": { reading: "こっこうしょう", pos: "名詞" },
  "総務省": { reading: "そうむしょう", pos: "名詞" },
  "防衛省": { reading: "ぼうえいしょう", pos: "名詞" },

  // ─── マイナンバー関連 ───
  "マイナンバー": { reading: "マイナンバー", pos: "名詞" },
  "マイナカード": { reading: "マイナカード", pos: "名詞" },
  "個人番号": { reading: "こじんばんごう", pos: "名詞" },

  // ─── 区役所・市役所 (often correct but defensive) ───
  "区役所": { reading: "くやくしょ", pos: "名詞" },
  "市役所": { reading: "しやくしょ", pos: "名詞" },
  "町役場": { reading: "まちやくば", pos: "名詞" },
  "村役場": { reading: "むらやくば", pos: "名詞" },

  // ─── 健康保険関連 ───
  "国民健康保険": { reading: "こくみんけんこうほけん", pos: "名詞" },
  "社会保険": { reading: "しゃかいほけん", pos: "名詞" },
  "後期高齢者": { reading: "こうきこうれいしゃ", pos: "名詞" },
  "介護保険": { reading: "かいごほけん", pos: "名詞" },
  "年金手帳": { reading: "ねんきんてちょう", pos: "名詞" },

  // ─── 难读地名 (Common tricky place names) ───
  "日本橋": { reading: "にほんばし", pos: "名詞" },
  "御茶ノ水": { reading: "おちゃのみず", pos: "名詞" },
  "秋葉原": { reading: "あきはばら", pos: "名詞" },
  "上野": { reading: "うえの", pos: "名詞" },
  "渋谷": { reading: "しぶや", pos: "名詞" },
  "新宿": { reading: "しんじゅく", pos: "名詞" },
  "池袋": { reading: "いけぶくろ", pos: "名詞" },
  "六本木": { reading: "ろっぽんぎ", pos: "名詞" },
  "原宿": { reading: "はらじゅく", pos: "名詞" },
  "代々木": { reading: "よよぎ", pos: "名詞" },
  "築地": { reading: "つきじ", pos: "名詞" },
  "豊洲": { reading: "とよす", pos: "名詞" },
  "羽田": { reading: "はねだ", pos: "名詞" },
  "成田": { reading: "なりた", pos: "名詞" },
  "中野": { reading: "なかの", pos: "名詞" },
  "目黒": { reading: "めぐろ", pos: "名詞" },
  "品川": { reading: "しながわ", pos: "名詞" },
  "横浜": { reading: "よこはま", pos: "名詞" },
  "鎌倉": { reading: "かまくら", pos: "名詞" },
  "藤沢": { reading: "ふじさわ", pos: "名詞" },
  "湘南": { reading: "しょうなん", pos: "名詞" },
  "京都": { reading: "きょうと", pos: "名詞" },
  "大阪": { reading: "おおさか", pos: "名詞" },
  "神戸": { reading: "こうべ", pos: "名詞" },
  "名古屋": { reading: "なごや", pos: "名詞" },
  "札幌": { reading: "さっぽろ", pos: "名詞" },
  "仙台": { reading: "せんだい", pos: "名詞" },
  "福岡": { reading: "ふくおか", pos: "名詞" },

  // ─── 教育・学校関連 ───
  "小学校": { reading: "しょうがっこう", pos: "名詞" },
  "中学校": { reading: "ちゅうがっこう", pos: "名詞" },
  "高等学校": { reading: "こうとうがっこう", pos: "名詞" },
  "幼稚園": { reading: "ようちえん", pos: "名詞" },
  "保育園": { reading: "ほいくえん", pos: "名詞" },
  "学童保育": { reading: "がくどうほいく", pos: "名詞" },
  "放課後": { reading: "ほうかご", pos: "名詞" },
  "保護者会": { reading: "ほごしゃかい", pos: "名詞" },
  "授業参観": { reading: "じゅぎょうさんかん", pos: "名詞" },
  "通学路": { reading: "つうがくろ", pos: "名詞" },

  // ─── 不動産・住宅 ───
  "一戸建て": { reading: "いっこだて", pos: "名詞" },
  "戸建て": { reading: "こだて", pos: "名詞" },
  "賃貸": { reading: "ちんたい", pos: "名詞" },
  "敷金": { reading: "しききん", pos: "名詞" },
  "礼金": { reading: "れいきん", pos: "名詞" },
  "管理費": { reading: "かんりひ", pos: "名詞" },
  "築年数": { reading: "ちくねんすう", pos: "名詞" },

  // ─── IT / Internet (post-IPADIC vocab) ───
  "情報通信": { reading: "じょうほうつうしん", pos: "名詞" },
  "個人情報": { reading: "こじんじょうほう", pos: "名詞" },

  // ─── 金融 / 税金 ───
  "確定申告": { reading: "かくていしんこく", pos: "名詞" },
  "源泉徴収": { reading: "げんせんちょうしゅう", pos: "名詞" },
  "住民税": { reading: "じゅうみんぜい", pos: "名詞" },
  "所得税": { reading: "しょとくぜい", pos: "名詞" },
  "消費税": { reading: "しょうひぜい", pos: "名詞" },
};

/**
 * Maximum length of an override key (in characters).
 * Used for the max-match scanning algorithm.
 */
export const MAX_OVERRIDE_LENGTH = Math.max(
  ...Object.keys(OVERRIDES).map((k) => k.length)
);

/**
 * Apply overrides to a tokenized result.
 * Uses longest-match scanning: at each position, try to match the longest
 * possible override key. If found, merge those tokens into one.
 *
 * Example:
 *   Input tokens:  [令(りょう), 和(わ), 八(はち), 年(ねん)]
 *   After fix:    [令和(れいわ), 八(はち), 年(ねん)]
 */
export function applyOverrides<
  T extends { surface: string; reading: string; hasKanji: boolean; pos: string }
>(tokens: T[]): T[] {
  const result: T[] = [];
  let i = 0;

  while (i < tokens.length) {
    let matched = false;

    // Try longest possible match first
    const maxLookahead = Math.min(MAX_OVERRIDE_LENGTH, tokens.length - i);

    for (let span = maxLookahead; span >= 1; span--) {
      // Try concatenating up to `span` tokens
      let concatSurface = "";
      let concatLen = 0;
      let tokensInSpan = 0;

      for (let j = 0; j < tokens.length - i && concatLen < MAX_OVERRIDE_LENGTH * 2; j++) {
        concatSurface += tokens[i + j].surface;
        concatLen = concatSurface.length;
        tokensInSpan = j + 1;
        if (concatLen >= span) break;
      }

      // Find any override key that exactly matches a prefix of concatSurface
      // (we want to consume an integer number of tokens, not split mid-token)
      let found: { key: string; consumedTokens: number } | null = null;

      // Build up surface progressively and check
      let progressiveSurface = "";
      for (let j = 0; j < tokensInSpan; j++) {
        progressiveSurface += tokens[i + j].surface;
        if (OVERRIDES[progressiveSurface]) {
          found = { key: progressiveSurface, consumedTokens: j + 1 };
          // Don't break — keep looking for longer matches in this span
        }
      }

      if (found) {
        const override = OVERRIDES[found.key];
        // Build merged token (use first token as template, override surface/reading/pos)
        const merged = {
          ...tokens[i],
          surface: found.key,
          reading: override.reading,
          hasKanji: /[\u4e00-\u9fff]/.test(found.key),
          pos: override.pos ?? tokens[i].pos,
        };
        result.push(merged);
        i += found.consumedTokens;
        matched = true;
        break;
      }
    }

    if (!matched) {
      result.push(tokens[i]);
      i++;
    }
  }

  return result;
}
