export type Lang = "cn" | "en" | "ja";

// 全部支持的语言（含暂时隐藏的 cn，路由仍可访问）
export const LANGS: Lang[] = ["cn", "en", "ja"];

// 在 UI 上显示给用户切换的语言（cn 暂时隐藏）
export const VISIBLE_LANGS: Lang[] = ["ja", "en"];

export function isValidLang(s: string): s is Lang {
  return s === "cn" || s === "en" || s === "ja";
}

export type Translations = {
  // Brand / nav
  brandTag: string;
  navTest: string;
  navPK: string;

  // Main page · hero
  heroBadge: string;
  heroTitle: string;
  heroSub1: string;
  heroSub2: string;

  // Steps
  step1: string; // "select country"
  step1Hint: string; // "left/right swipe"
  step2: string; // "fill data"
  step3: string; // "your score"

  // InputCard
  inputWageLabel: string;
  inputWageMin: string; // "min"
  inputWageBelowMin: string; // "below min wage"
  inputHoursLabel: string;
  inputHoursStudentLimit: string; // "{n}h student limit"
  inputStudentTitle: string;
  inputStudentToggleLabel: string; // currently unused inline; for a11y
  inputSubmit: string;
  retest: string;
  cnyApprox: string; // "≈ ¥XX"

  // Result Card
  yourWSI: string;
  beat: string; // "beat"
  beatPeople: string; // "of workers"
  statWage: string;
  statHours: string;
  statMonthly: string;
  riskFreeTitle: string;
  riskFreeDesc: string;

  // Share
  shareSaveImg: string;
  shareSaving: string;
  shareSaved: string;
  shareCopyText: string;
  shareCopied: string;
  shareImgFailed: string;
  shareCardFooter: string; // "test yours →"

  // Detail panel
  detailBreakdown: string;
  detailBreakdownEn: string; // small caption text
  detailWageScore: string;
  detailIncomeScore: string;
  detailSafetyScore: string;
  detailCNYConvert: string;
  detailRateUpdated: string; // "updated at"
  detailRateFallback: string; // "reference rate"
  detailWage: string;
  detailMonthly: string;
  detailAnnual: string;
  detailSuggestions: string;
  detailFunFact: (countryName: string) => string;
  detailMethod: string;
  detailMethodLines: (country: { name: string; studentHourLimit: number; wallName?: string }) => string[];
  disclaimer: string;

  // CTA card
  ctaPKTitle: string;
  ctaPKDesc: string;

  // PK page
  pkHeroBadge: string;
  pkHeroTitle1: string;
  pkHeroTitle2: string;
  pkHeroSub1: string;
  pkHeroSub2: string;
  pkMarquee: string[];

  pkStepSelect1: string;
  pkStepSelect2: string;
  pkStepReady: string;
  pkSwap: string;
  pkSlot: (n: string) => string;
  pkSlotHint: string;
  pkStart: string;
  pkNeedSelect: (n: number) => string;
  pkBattleResult: string;
  pkReselect: string;

  // Battle card
  pkBattleTag: string;
  pkVS: string;
  pkDraw: string;
  pkVerdictHeader: string;
  pkBattleFooter: string;

  // Stats labels (PK)
  statKeyWage: string;
  statKeyHours: string;
  statKeyIncome: string;
  statKeyPower: string;
  statKeyCol: string;
  statKeyWSI: string;
  statNoteWage: string;
  statNoteHours: string;
  statNoteIncome: string;
  statNotePower: string;
  statNoteCol: string;
  statNoteWSI: string;
  statHoursPerWeek: string; // "h/wk"

  // PK detail
  pkDetailTitle: string;
  pkMethod: string;
  pkMethodLines: string[];

  // Footer
  footerCopyright: string;
  footerCopyrightPK: string;

  // Grade taglines
  gradeS: string;
  gradeA: string;
  gradeB: string;
  gradeC: string;
  gradeD: string;

  // Verdict / risk / suggestions builders
  verdictDraw: (a: string, b: string) => string;
  verdictWinner: (winner: { emoji: string; name: string }, score: number, lscore: number, advText: string) => string;
  // 当综合 WSI 大幅领先时（差距 >= 5 分）使用的判词
  verdictWSIDominant: (winner: { emoji: string; name: string }, gap: number, advText: string) => string;
  advWageHigher: string;
  advHoursWider: string;
  advPowerStronger: string;
  advWSIStable: string;
  advFallback: string;

  // Risks
  riskHoursTitle: (limit: number) => string;
  riskHoursDesc: (params: { hours: number; over: number; countryName: string }) => string;
  riskWallTitle: (wallName: string) => string;
  riskWallDesc: (params: { annual: string; wallDesc: string }) => string;

  // Suggestions
  sugBelowMin: (params: { countryName: string; symbol: string; min: number }) => string;
  sugWageOk: string;
  sugOverHours: (limit: number, longBreak: boolean) => string;
  sugNearLimit: (limit: number) => string;
  sugWallExceeded: (wallName: string, wallDesc: string) => string;
  sugHealthy: string;
  sugStable: string;
  sugLow: string;

  // Share text builder
  shareWSITitle: (params: { emoji: string; country: string; score: number; grade: string }) => string;
  shareWSIIncome: (params: { symbol: string; income: string; pct: number }) => string;
  shareCTA: string;
  shareWSIHashtags: (countryName: string) => string;
  sharePKTitle: (params: { left: { emoji: string; name: string }; right: { emoji: string; name: string } }) => string;
  sharePKScore: (params: {
    leftEmoji: string;
    leftScore: number;
    op: string;
    rightEmoji: string;
    rightScore: number;
  }) => string;
  sharePKCTA: string;
  sharePKHashtags: string;
};

export const I18N: Record<Lang, Translations> = {
  cn: {
    brandTag: "在日 H5 工具",
    navTest: "🎯 测指数",
    navPK: "⚔️ 国家 PK",

    heroBadge: "🌍 6 国实测",
    heroTitle: "打工生存\n指数 WSI",
    heroSub1: "你出国能不能活得下去？",
    heroSub2: "选个国家、输入时薪和工时，立刻出分。",

    step1: "① 选个国家",
    step1Hint: "← 左右滑动 →",
    step2: "② 填基础数据",
    step3: "③ 你的指数",

    inputWageLabel: "⚡ 时薪",
    inputWageMin: "最低",
    inputWageBelowMin: "⚠️ 低于本国最低时薪",
    inputHoursLabel: "⏱ 每周工时",
    inputHoursStudentLimit: "↑ {n}h 学生上限",
    inputStudentTitle: "🎓 留学生身份",
    inputStudentToggleLabel: "切换留学生身份",
    inputSubmit: "测一下我的 WSI →",
    retest: "← 再测一次",
    cnyApprox: "≈",

    yourWSI: "YOUR WSI",
    beat: "击败",
    beatPeople: "打工人",
    statWage: "时薪",
    statHours: "周工时",
    statMonthly: "月收入",
    riskFreeTitle: "合规无风险",
    riskFreeDesc: "工时 / 收入均在安全范围。",

    shareSaveImg: "📸 保存图片",
    shareSaving: "生成中",
    shareSaved: "✓ 已保存",
    shareCopyText: "📝 复制文案",
    shareCopied: "✓ 已复制",
    shareImgFailed: "生成图片失败，长按结果卡截图也可以。",
    shareCardFooter: "测你的 →",

    detailBreakdown: "📊 评分构成",
    detailBreakdownEn: "SCORE BREAKDOWN",
    detailWageScore: "时薪水平",
    detailIncomeScore: "月度收入",
    detailSafetyScore: "合规安全",
    detailCNYConvert: "💱 人民币换算",
    detailRateUpdated: "更新于",
    detailRateFallback: "参考汇率",
    detailWage: "时薪",
    detailMonthly: "月收入",
    detailAnnual: "年收入",
    detailSuggestions: "💡 给你的建议",
    detailFunFact: (n) => `🎯 ${n}打工小知识`,
    detailMethod: "📐 计算口径",
    detailMethodLines: (c) => [
      `· 月收入 = 时薪 × 周工时 × 4.33`,
      `· 时薪分（40）：以${c.name}本地基准评分`,
      `· 月收分（30）：归一化跨国可比`,
      `· 安全分（30）：超${c.studentHourLimit}h${c.wallName ? ` / 超${c.wallName}` : ""}扣分`,
      `· 人民币：实时汇率（open.er-api.com）`,
    ],
    disclaimer: "仅作参考，不构成法律 / 税务建议。",

    ctaPKTitle: "⚔️ 国家 PK 大乱斗",
    ctaPKDesc: "两个国家正面对决，看谁更适合打工",

    pkHeroBadge: "⚡ 6 国大乱斗",
    pkHeroTitle1: "国家 PK",
    pkHeroTitle2: "大 乱 斗",
    pkHeroSub1: "选两个国家正面对决，",
    pkHeroSub2: "看哪边更适合留学打工。",
    pkMarquee: ["🥊 选两国 PK", "📊 6 项指标对决", "💴 实时人民币换算", "📸 一键出战报"],

    pkStepSelect1: "① 选第一个国家",
    pkStepSelect2: "② 选第二个国家",
    pkStepReady: "✓ 两国就位，可重选",
    pkSwap: "⇄ 交换",
    pkSlot: (n) => `空 位 ${n}`,
    pkSlotHint: "↓ 点选 ↓",
    pkStart: "🥊 开始 PK →",
    pkNeedSelect: (n) => `还需要选 ${n} 个国家`,
    pkBattleResult: "⚔️ 战斗结果",
    pkReselect: "← 重新选择",

    pkBattleTag: "国家 PK 战",
    pkVS: "VS",
    pkDraw: "🤝 平 局",
    pkVerdictHeader: "🏆 综 合 判 定",
    pkBattleFooter: "来 PK 你的 →",

    statKeyWage: "时薪基准",
    statKeyHours: "学生工时",
    statKeyIncome: "月收潜力",
    statKeyPower: "实际购买力",
    statKeyCol: "物价压力",
    statKeyWSI: "综合 WSI",
    statNoteWage: "「不错时薪」换人民币后比",
    statNoteHours: "学生签证周工时上限",
    statNoteIncome: "顶格工时 × 不错时薪（人民币）",
    statNotePower: "月收 × 物价调整",
    statNoteCol: "美国 = 100，越低越省",
    statNoteWSI: "档案分（满血假设）",
    statHoursPerWeek: "h/週",

    pkDetailTitle: "📊 详细对比",
    pkMethod: "📐 PK 计算口径",
    pkMethodLines: [
      "· 时薪 / 月收：当地「不错时薪」基准换成人民币后比较",
      "· 月收潜力：学生顶格工时 × 不错时薪",
      "· 实际购买力：人民币月收 × 物价调整系数",
      "· 综合 WSI：「档案分」用满血假设跑出的总分",
      "· 汇率 / 物价指数会变，结果仅作大致参考。",
    ],

    footerCopyright: "© 2026 Appori · 数据仅作参考，不构成法律 / 税务建议",
    footerCopyrightPK: "© 2026 Appori · 6 国数据来自公开资料，仅作参考",

    gradeS: "打工神级",
    gradeA: "状态拉满",
    gradeB: "中规中矩",
    gradeC: "略显疲惫",
    gradeD: "亟需调整",

    verdictDraw: (a, b) => `${a} 和 ${b} 各有千秋，看你更看重时薪还是合规空间。`,
    verdictWinner: (w, s, l, adv) => `${w.emoji} ${w.name} 以 ${s}:${l} 拿下 PK ——${adv}。`,
    verdictWSIDominant: (w, gap, adv) => `${w.emoji} ${w.name} 综合 WSI 领先 ${gap} 分，整体更适合${adv ? "——" + adv : ""}。`,
    advWageHigher: "时薪更高",
    advHoursWider: "学生工时更宽",
    advPowerStronger: "购买力更强",
    advWSIStable: "综合更稳",
    advFallback: "整体更胜一筹",

    riskHoursTitle: (limit) => `超过 ${limit}h 上限`,
    riskHoursDesc: (p) => `周工时 ${p.hours}h，超出${p.countryName}留学生工签上限 ${p.over}h，被查到可能影响签证。`,
    riskWallTitle: (wn) => `突破 ${wn}`,
    riskWallDesc: (p) => `年收预估 ${p.annual}，超过${p.wallDesc}，可能涉及税务处理。`,

    sugBelowMin: (p) => `时薪低于${p.countryName}最低时薪 ${p.symbol}${p.min}，先看看其他岗位。`,
    sugWageOk: "时薪一般，可以多对比同地区岗位，深夜 / 周末班通常加 15-25%。",
    sugOverHours: (limit, longBreak) => `先把周工时压回 ${limit}h 内，${longBreak ? "长假期可以申请放宽" : "周期性合规更重要"}。`,
    sugNearLimit: (limit) => `已在 ${limit}h 红线附近，注意交叉周不要超出。`,
    sugWallExceeded: (wn, wd) => `年收已超 ${wn}，建议确认${wd}对你和家人的影响。`,
    sugHealthy: "整体很健康，保持节奏。",
    sugStable: "状态不错，可以小幅优化时薪。",
    sugLow: "综合分偏低，先优先提升时薪而非堆工时。",

    shareWSITitle: (p) => `${p.emoji} 我在${p.country}的打工生存指数 WSI = ${p.score}/100（${p.grade} 级）`,
    shareWSIIncome: (p) => `💴 月收 ${p.symbol}${p.income} · 击败 ${p.pct}% 打工人`,
    shareCTA: "👉 测测你的打工生存指数 / 还能 PK 不同国家",
    shareWSIHashtags: (n) => `#留学生打工 #打工生存指数 #${n}打工`,
    sharePKTitle: (p) => `⚔️ 出国打工 PK：${p.left.emoji}${p.left.name} VS ${p.right.emoji}${p.right.name}`,
    sharePKScore: (p) =>
      `综合 WSI：${p.leftEmoji} ${p.leftScore} ${p.op} ${p.rightEmoji} ${p.rightScore}`,
    sharePKCTA: "👉 测测你出国打工能拿几分 / 任意 2 国 PK",
    sharePKHashtags: "#出国打工 #打工生存指数 #留学生兼职",
  },

  en: {
    brandTag: "Working Abroad H5",
    navTest: "🎯 Test",
    navPK: "⚔️ PK",

    heroBadge: "🌍 6 countries",
    heroTitle: "Work Survival\nIndex (WSI)",
    heroSub1: "Can you survive working abroad?",
    heroSub2: "Pick a country, enter wage & hours, get scored.",

    step1: "① Pick a country",
    step1Hint: "← swipe →",
    step2: "② Fill in details",
    step3: "③ Your score",

    inputWageLabel: "⚡ Hourly Wage",
    inputWageMin: "Min",
    inputWageBelowMin: "⚠️ Below local minimum wage",
    inputHoursLabel: "⏱ Weekly Hours",
    inputHoursStudentLimit: "↑ {n}h student limit",
    inputStudentTitle: "🎓 Student Status",
    inputStudentToggleLabel: "Toggle student status",
    inputSubmit: "Get my WSI →",
    retest: "← Retest",
    cnyApprox: "≈",

    yourWSI: "YOUR WSI",
    beat: "Beat",
    beatPeople: "of workers",
    statWage: "Wage",
    statHours: "Hours/wk",
    statMonthly: "Monthly",
    riskFreeTitle: "All clear",
    riskFreeDesc: "Hours and income are both within safe limits.",

    shareSaveImg: "📸 Save Image",
    shareSaving: "Saving",
    shareSaved: "✓ Saved",
    shareCopyText: "📝 Copy Text",
    shareCopied: "✓ Copied",
    shareImgFailed: "Couldn't save image. Try long-pressing the card to screenshot.",
    shareCardFooter: "Try yours →",

    detailBreakdown: "📊 Score Breakdown",
    detailBreakdownEn: "BREAKDOWN",
    detailWageScore: "Wage Level",
    detailIncomeScore: "Monthly Income",
    detailSafetyScore: "Compliance",
    detailCNYConvert: "💱 USD Conversion",
    detailRateUpdated: "updated",
    detailRateFallback: "ref. rate",
    detailWage: "Hourly",
    detailMonthly: "Monthly",
    detailAnnual: "Annual",
    detailSuggestions: "💡 Tips for You",
    detailFunFact: (n) => `🎯 Quick fact: ${n}`,
    detailMethod: "📐 Methodology",
    detailMethodLines: (c) => [
      `· Monthly = Hourly × Weekly hrs × 4.33`,
      `· Wage score (40): based on local benchmarks`,
      `· Income score (30): normalized for cross-country comparison`,
      `· Safety score (30): deducted if over ${c.studentHourLimit}h${c.wallName ? ` or ${c.wallName}` : ""}`,
      `· USD: live FX rate (open.er-api.com)`,
    ],
    disclaimer: "For reference only. Not legal or tax advice.",

    ctaPKTitle: "⚔️ Country PK Battle",
    ctaPKDesc: "Two countries head-to-head — which suits you better?",

    pkHeroBadge: "⚡ 6-country battle",
    pkHeroTitle1: "Country PK",
    pkHeroTitle2: "B A T T L E",
    pkHeroSub1: "Pick two countries to face off,",
    pkHeroSub2: "find out which is better for student work.",
    pkMarquee: ["🥊 Pick 2 countries", "📊 6 metrics", "💴 Live USD rates", "📸 One-tap report"],

    pkStepSelect1: "① Pick country #1",
    pkStepSelect2: "② Pick country #2",
    pkStepReady: "✓ Both ready — tap to change",
    pkSwap: "⇄ Swap",
    pkSlot: (n) => `Slot ${n}`,
    pkSlotHint: "↓ tap below ↓",
    pkStart: "🥊 Start PK →",
    pkNeedSelect: (n) => `Pick ${n} more ${n === 1 ? "country" : "countries"}`,
    pkBattleResult: "⚔️ Battle Result",
    pkReselect: "← Reselect",

    pkBattleTag: "Country PK Battle",
    pkVS: "VS",
    pkDraw: "🤝 D R A W",
    pkVerdictHeader: "🏆 V E R D I C T",
    pkBattleFooter: "PK yours →",

    statKeyWage: "Wage Bench",
    statKeyHours: "Student Hrs",
    statKeyIncome: "Monthly Pot.",
    statKeyPower: "Buying Power",
    statKeyCol: "Cost of Living",
    statKeyWSI: "Total WSI",
    statNoteWage: "good-tier wage in USD",
    statNoteHours: "weekly cap on student visa",
    statNoteIncome: "max student hrs × good wage (USD)",
    statNotePower: "income × COL adjustment",
    statNoteCol: "USA = 100, lower is cheaper",
    statNoteWSI: "profile score (best-case)",
    statHoursPerWeek: "h/wk",

    pkDetailTitle: "📊 Full Comparison",
    pkMethod: "📐 PK Methodology",
    pkMethodLines: [
      "· Wage / income: local good-tier wage converted to USD",
      "· Monthly potential: max student hours × good wage",
      "· Buying power: USD monthly × cost-of-living factor",
      "· Total WSI: profile score under best-case assumption",
      "· FX and COL data shift over time — values are approximate.",
    ],

    footerCopyright: "© 2026 Appori · Reference only. Not legal or tax advice.",
    footerCopyrightPK: "© 2026 Appori · Public data sources. Reference only.",

    gradeS: "Elite",
    gradeA: "Solid",
    gradeB: "Decent",
    gradeC: "Tired",
    gradeD: "Struggle",

    verdictDraw: (a, b) => `${a} and ${b} each have their edges — depends what you value most.`,
    verdictWinner: (w, s, l, adv) => `${w.emoji} ${w.name} wins ${s}-${l} — ${adv}.`,
    verdictWSIDominant: (w, gap, adv) => `${w.emoji} ${w.name} leads by ${gap} WSI points overall${adv ? " — " + adv : ""}.`,
    advWageHigher: "higher wages",
    advHoursWider: "more student hours allowed",
    advPowerStronger: "stronger buying power",
    advWSIStable: "stronger overall",
    advFallback: "stronger across the board",

    riskHoursTitle: (limit) => `Over ${limit}h limit`,
    riskHoursDesc: (p) => `Working ${p.hours}h/wk, ${p.over}h over ${p.countryName}'s student visa cap. Could affect renewal if caught.`,
    riskWallTitle: (wn) => `Past ${wn} threshold`,
    riskWallDesc: (p) => `Annual income est. ${p.annual} exceeds ${p.wallDesc} — may trigger tax implications.`,

    sugBelowMin: (p) => `Wage below ${p.countryName}'s minimum (${p.symbol}${p.min}). Worth shopping around.`,
    sugWageOk: "Wage is mid-tier. Late-night / weekend shifts often pay 15-25% more.",
    sugOverHours: (limit, longBreak) => `Drop weekly hours under ${limit}h${longBreak ? " — long breaks usually allow more" : ""}.`,
    sugNearLimit: (limit) => `Right at the ${limit}h line — watch for cross-week overflow.`,
    sugWallExceeded: (wn, wd) => `Past ${wn}. Check how ${wd} affects you and your family.`,
    sugHealthy: "Looks healthy — keep your rhythm.",
    sugStable: "Solid setup — minor wage tuning could push it higher.",
    sugLow: "Score is low. Prioritize raising wage over piling on hours.",

    shareWSITitle: (p) => `${p.emoji} My WSI in ${p.country} = ${p.score}/100 (${p.grade})`,
    shareWSIIncome: (p) => `💴 Monthly ${p.symbol}${p.income} · Beat ${p.pct}% of workers`,
    shareCTA: "👉 Test yours / PK any 2 countries",
    shareWSIHashtags: (n) => `#WorkAbroad #WSI #${n}`,
    sharePKTitle: (p) => `⚔️ Work Abroad PK: ${p.left.emoji}${p.left.name} VS ${p.right.emoji}${p.right.name}`,
    sharePKScore: (p) =>
      `Total WSI: ${p.leftEmoji} ${p.leftScore} ${p.op} ${p.rightEmoji} ${p.rightScore}`,
    sharePKCTA: "👉 Test your score / pick any 2 countries to PK",
    sharePKHashtags: "#WorkAbroad #WSI #StudentJobs",
  },

  ja: {
    brandTag: "海外バイト H5 ツール",
    navTest: "🎯 スコア診断",
    navPK: "⚔️ 国別バトル",

    heroBadge: "🌍 6 ヶ国対応",
    heroTitle: "海外バイト\n生存スコア",
    heroSub1: "海外で本当に生活できる？",
    heroSub2: "国を選び、時給と週の労働時間を入力するだけ。",

    step1: "① 国を選ぶ",
    step1Hint: "← 左右にスワイプ →",
    step2: "② 基本データを入力",
    step3: "③ あなたのスコア",

    inputWageLabel: "⚡ 時給",
    inputWageMin: "最低",
    inputWageBelowMin: "⚠️ 現地の最低時給を下回っています",
    inputHoursLabel: "⏱ 週の労働時間",
    inputHoursStudentLimit: "↑ 留学生上限 {n}h",
    inputStudentTitle: "🎓 留学生ステータス",
    inputStudentToggleLabel: "留学生ステータス切替",
    inputSubmit: "WSI を診断する →",
    retest: "← もう一度診断",
    cnyApprox: "≈",

    yourWSI: "YOUR WSI",
    beat: "上位",
    beatPeople: "の労働者",
    statWage: "時給",
    statHours: "週時間",
    statMonthly: "月収",
    riskFreeTitle: "リスクなし",
    riskFreeDesc: "労働時間・収入ともに安全な範囲内です。",

    shareSaveImg: "📸 画像を保存",
    shareSaving: "生成中",
    shareSaved: "✓ 保存しました",
    shareCopyText: "📝 文章をコピー",
    shareCopied: "✓ コピーしました",
    shareImgFailed: "画像の生成に失敗しました。長押しでカードをスクショしてください。",
    shareCardFooter: "あなたも診断 →",

    detailBreakdown: "📊 スコア構成",
    detailBreakdownEn: "SCORE BREAKDOWN",
    detailWageScore: "時給レベル",
    detailIncomeScore: "月収レベル",
    detailSafetyScore: "コンプライアンス",
    detailCNYConvert: "💱 円換算",
    detailRateUpdated: "更新日",
    detailRateFallback: "参考レート",
    detailWage: "時給",
    detailMonthly: "月収",
    detailAnnual: "年収",
    detailSuggestions: "💡 アドバイス",
    detailFunFact: (n) => `🎯 ${n}バイト豆知識`,
    detailMethod: "📐 計算方法",
    detailMethodLines: (c) => [
      `· 月収 = 時給 × 週時間 × 4.33`,
      `· 時給スコア（40点）：${c.name}の現地基準で評価`,
      `· 月収スコア（30点）：国際比較用に正規化`,
      `· 安全スコア（30点）：${c.studentHourLimit}h 超過${c.wallName ? ` / ${c.wallName} 超過` : ""}で減点`,
      `· 円：リアルタイム為替（open.er-api.com）`,
    ],
    disclaimer: "参考情報です。法律・税務上のアドバイスではありません。",

    ctaPKTitle: "⚔️ 国別 PK バトル",
    ctaPKDesc: "2 つの国を直接対決させて、自分に合うのはどっち？",

    pkHeroBadge: "⚡ 6 ヶ国バトル",
    pkHeroTitle1: "国別 PK",
    pkHeroTitle2: "バ ト ル",
    pkHeroSub1: "2 つの国を選んで対決、",
    pkHeroSub2: "留学バイトに合うのはどちらかを判定。",
    pkMarquee: ["🥊 2 ヶ国を選ぶ", "📊 6 項目で対決", "💴 円リアルタイム換算", "📸 ワンタップ戦報"],

    pkStepSelect1: "① 1 つ目の国を選ぶ",
    pkStepSelect2: "② 2 つ目の国を選ぶ",
    pkStepReady: "✓ 準備完了 — タップで変更",
    pkSwap: "⇄ 交換",
    pkSlot: (n) => `スロット ${n}`,
    pkSlotHint: "↓ タップ ↓",
    pkStart: "🥊 PK 開始 →",
    pkNeedSelect: (n) => `あと ${n} ヶ国選んでください`,
    pkBattleResult: "⚔️ バトル結果",
    pkReselect: "← 選び直す",

    pkBattleTag: "国別 PK バトル",
    pkVS: "VS",
    pkDraw: "🤝 引 き 分 け",
    pkVerdictHeader: "🏆 総 合 判 定",
    pkBattleFooter: "あなたも PK →",

    statKeyWage: "時給ベンチ",
    statKeyHours: "学生労働時間",
    statKeyIncome: "月収ポテンシャル",
    statKeyPower: "実質購買力",
    statKeyCol: "物価圧力",
    statKeyWSI: "総合 WSI",
    statNoteWage: "「悪くない時給」を円換算",
    statNoteHours: "学生ビザの週労働時間上限",
    statNoteIncome: "上限時間 × 悪くない時給（円）",
    statNotePower: "月収 × 物価調整",
    statNoteCol: "米国 = 100、低いほど安い",
    statNoteWSI: "プロファイルスコア（理想値）",
    statHoursPerWeek: "h/週",

    pkDetailTitle: "📊 詳細比較",
    pkMethod: "📐 PK 計算方法",
    pkMethodLines: [
      "· 時給 / 月収：現地の「悪くない時給」を円換算で比較",
      "· 月収ポテンシャル：学生の上限時間 × 悪くない時給",
      "· 実質購買力：円月収 × 物価調整係数",
      "· 総合 WSI：「プロファイルスコア」を理想値で算出",
      "· 為替や物価は変動するため参考値です。",
    ],

    footerCopyright: "© 2026 Appori · 参考情報です。法律・税務上のアドバイスではありません。",
    footerCopyrightPK: "© 2026 Appori · 6 ヶ国データは公開資料に基づく参考値です。",

    gradeS: "神レベル",
    gradeA: "絶好調",
    gradeB: "標準",
    gradeC: "やや疲労",
    gradeD: "要改善",

    verdictDraw: (a, b) => `${a} と ${b} はそれぞれ強みがあり、時給とコンプラのどちらを重視するかで決まります。`,
    verdictWinner: (w, s, l, adv) => `${w.emoji} ${w.name} が ${s}:${l} で勝利 ——${adv}。`,
    verdictWSIDominant: (w, gap, adv) => `${w.emoji} ${w.name} は総合 WSI で ${gap} 点リード${adv ? "——" + adv : ""}。`,
    advWageHigher: "時給が高い",
    advHoursWider: "学生労働時間に余裕がある",
    advPowerStronger: "購買力が強い",
    advWSIStable: "総合的に安定",
    advFallback: "全体的に優勢",

    riskHoursTitle: (limit) => `${limit}h 上限超過`,
    riskHoursDesc: (p) => `週 ${p.hours}h は ${p.countryName} の留学生ビザ上限を ${p.over}h 超えており、ビザ更新に影響する可能性があります。`,
    riskWallTitle: (wn) => `${wn} 超過`,
    riskWallDesc: (p) => `年収予測 ${p.annual} は ${p.wallDesc} を超えており、税務上の処理が必要になる可能性があります。`,

    sugBelowMin: (p) => `時給が ${p.countryName} の最低時給 ${p.symbol}${p.min} を下回っています。他の求人も検討を。`,
    sugWageOk: "時給は標準的です。深夜・週末シフトは通常 15-25% 加算されます。",
    sugOverHours: (limit, longBreak) => `週の労働時間を ${limit}h 以内に抑えましょう${longBreak ? "（長期休暇中は緩和の場合あり）" : "（コンプライアンス重視）"}。`,
    sugNearLimit: (limit) => `${limit}h のレッドラインに近いです。週またぎで超えないよう注意。`,
    sugWallExceeded: (wn, wd) => `年収が ${wn} を超えています。${wd}が自分や家族に与える影響を確認しましょう。`,
    sugHealthy: "全体的に健全です。このペースで継続を。",
    sugStable: "良好な状態です。時給を少し見直すとさらに伸びます。",
    sugLow: "総合スコアが低めです。時間を増やすより時給アップを優先しましょう。",

    shareWSITitle: (p) => `${p.emoji} ${p.country}での海外バイト生存スコア WSI = ${p.score}/100（${p.grade} ランク）`,
    shareWSIIncome: (p) => `💴 月収 ${p.symbol}${p.income} · 上位 ${p.pct}% にランクイン`,
    shareCTA: "👉 あなたの海外バイト生存スコアを診断 / 国別 PK もできる",
    shareWSIHashtags: (n) => `#留学生バイト #海外バイト #${n}バイト`,
    sharePKTitle: (p) => `⚔️ 海外バイト PK：${p.left.emoji}${p.left.name} VS ${p.right.emoji}${p.right.name}`,
    sharePKScore: (p) =>
      `総合 WSI：${p.leftEmoji} ${p.leftScore} ${p.op} ${p.rightEmoji} ${p.rightScore}`,
    sharePKCTA: "👉 海外バイト診断 / 任意の 2 ヶ国 PK",
    sharePKHashtags: "#海外バイト #留学生バイト #ワーホリ",
  },
};

export function getT(lang: Lang): Translations {
  return I18N[lang];
}
