// 避雷設備檢討（docs/lightning-spec.md）。
// 純計算模組：不依賴 React，可由 scripts/verify-lightning.ts 以 node 直接執行。

export const SOURCE = "建築技術規則建築設備編 第一章第五節 避雷設備";

export type AirTerminal = "unset" | "franklin" | "ese" | "multi" | "other";

export const TERMINAL_NAME: Record<AirTerminal, string> = {
  unset: "未選擇",
  franklin: "富蘭克林避雷針（傳統型）",
  ese: "ESE 提早放電型避雷針",
  multi: "多針式消雷針",
  other: "其他認可型式",
};

export interface LightningInput {
  /** 建築物高度（m，不含屋突，依建照） */
  height: number;
  hazmat: boolean;
  perimeterMode: "direct" | "rect";
  perimeter: number;
  length: number;
  width: number;
  terminal: AirTerminal;
  /** 富蘭克林：針體尖端高出受保護面之高度（m） */
  rodHeight: number;
  /** 富蘭克林：針體至最遠受保護點之水平距離（m，選填） */
  distance: number | null;
}

export interface Step {
  title: string;
  value: string;
  lines: string[];
  cite: string;
}

export interface Protection {
  angle: number;
  tan: number;
  radius: number;
  needed: number | null;
  ok: boolean | null;
  step: Step;
}

export interface LightningResult {
  input: LightningInput;
  required: boolean;
  requiredReason: string;
  conductor: number;
  perimeter: number;
  downs: number;
  spacing: number | null;
  protection: Protection | null;
  steps: Step[];
}

export const fmt = (n: number, digits = 2) =>
  n.toLocaleString("zh-TW", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

const art = (n: string) => `設備編第${n}條`;

/** 第24條：銅導線斷面積（mm²）。 */
export function conductorSize(h: number) {
  if (h <= 30) return 30;
  if (h < 36) return 60;
  return 100;
}

/** 第25條第三款：至少 2 條；外周長超過 100 m，每超過 50 m 增設 1 條，不足 50 m 不計。 */
export function downConductors(perimeter: number) {
  return 2 + Math.max(0, Math.floor((perimeter - 100) / 50 + 1e-9));
}

export function calculateLightning(input: LightningInput): LightningResult {
  const h = input.height;
  const steps: Step[] = [];

  const byHeight = h >= 20;
  const byHazmat = input.hazmat && h >= 3;
  const required = byHeight || byHazmat;
  const requiredReason = byHeight
    ? `建築物高度 ${fmt(h)} m ≧ 20 m`
    : byHazmat
      ? `危險物品倉庫，建築物高度 ${fmt(h)} m ≧ 3 m`
      : input.hazmat
        ? `危險物品倉庫，建築物高度 ${fmt(h)} m ＜ 3 m`
        : `建築物高度 ${fmt(h)} m ＜ 20 m，且非危險物品倉庫`;
  steps.push({
    title: "是否應設避雷設備",
    value: required ? "應設" : "非強制",
    lines: [
      "第一款：建築物高度在 20 m 以上者。",
      "第二款：建築物高度在 3 m 以上並作危險物品倉庫使用者（火藥庫、可燃性液體倉庫、可燃性氣體倉庫等）。",
      `本案：${requiredReason}${required ? "，應設置。" : "，非強制設置；自願設置時依本節規定。"}`,
    ],
    cite: art("20"),
  });

  const conductor = conductorSize(h);
  steps.push({
    title: "避雷導線斷面積（銅導線）",
    value: `${conductor} mm² 以上`,
    lines: [
      `${conductor === 30 ? "▶" : "　"} 建築物高度 30 m 以下：30 mm² 以上`,
      `${conductor === 60 ? "▶" : "　"} 超過 30 m，未達 36 m：60 mm² 以上`,
      `${conductor === 100 ? "▶" : "　"} 36 m 以上：100 mm² 以上`,
      `本案建築物高度 ${fmt(h)} m → ${conductor} mm² 以上`,
      "導線裝置地點有被外物碰傷之虞時，應使用硬質塑膠管或非磁性金屬管保護。",
    ],
    cite: art("24"),
  });

  const perimeter = input.perimeterMode === "rect" ? 2 * (input.length + input.width) : input.perimeter;
  const downs = downConductors(perimeter);
  const spacing = perimeter > 0 ? perimeter / downs : null;
  const over = perimeter - 100;
  steps.push({
    title: "引下導線條數",
    value: `${downs} 條以上`,
    lines: [
      ...(input.perimeterMode === "rect"
        ? [`外周長 ＝ 2 ×（${fmt(input.length)} ＋ ${fmt(input.width)}）＝ ${fmt(perimeter)} m`]
        : [`外周長 ＝ ${fmt(perimeter)} m`]),
      over > 0
        ? `超過 100 m 部分 ${fmt(over)} m，每 50 m 增設 1 條（不足 50 m 不計）：2 ＋ ${downs - 2} ＝ ${downs} 條`
        : "外周長 100 m 以下：至少 2 條",
      ...(spacing !== null ? [`平均間距 ＝ ${fmt(perimeter)} ÷ ${downs} ＝ ${fmt(spacing)} m（各導線間距離應盡量平均）`] : []),
    ],
    cite: art("25第三款"),
  });

  let protection: Protection | null = null;
  if (input.terminal === "franklin") {
    const angle = input.hazmat ? 45 : 60;
    const tan = Math.tan((angle * Math.PI) / 180);
    const radius = input.rodHeight * tan;
    const d = input.distance;
    const needed = d !== null && d > 0 ? d / tan : null;
    const ok = needed !== null && input.rodHeight > 0 ? radius >= d! - 1e-9 : null;
    protection = {
      angle,
      tan,
      radius,
      needed,
      ok,
      step: {
        title: "富蘭克林避雷針保護角",
        value: `保護半徑 ${fmt(radius)} m`,
        lines: [
          `保護角上限：${input.hazmat ? "危險物品倉庫 45°" : "一般建築物 60°"}`,
          `保護半徑 r ＝ 針高 × tan ${angle}° ＝ ${fmt(input.rodHeight)} × ${fmt(tan, 3)} ＝ ${fmt(radius)} m`,
          ...(needed !== null
            ? [
                `最遠受保護點水平距離 d ＝ ${fmt(d!)} m`,
                `所需針高 ＝ d ÷ tan ${angle}° ＝ ${fmt(d!)} ÷ ${fmt(tan, 3)} ＝ ${fmt(needed)} m`,
              ]
            : []),
          "平屋頂之保護角應遮蔽屋頂突出物全部與屋角、邊緣；中間平坦部分除危險物品倉庫外得省略。",
        ],
        cite: `${art("21第一款")}、${art("25第十二款")}`,
      },
    };
  }

  return { input, required, requiredReason, conductor, perimeter, downs, spacing, protection, steps };
}

export function defaultLightningInput(): LightningInput {
  return {
    height: 0,
    hazmat: false,
    perimeterMode: "direct",
    perimeter: 0,
    length: 0,
    width: 0,
    terminal: "unset",
    rodHeight: 0,
    distance: null,
  };
}

// ---- 說明文字 ----

export const TERMINAL_NOTE =
  "ESE 提早放電型避雷針、多針式消雷針等富蘭克林避雷針以外之型式，依建築技術規則總則編第4條向中央主管建築機關申請認可後使用，保護範圍依認可書設計，不檢討保護角（設備編第21條第二款）。";

export const HEIGHT_NOTE = "建築物高度依建築技術規則檢討，以建照註明之高度為準（不含屋突），由建築師提供。";

export const CHECKLIST: { title: string; cite: string; items: string[] }[] = [
  {
    title: "受雷部",
    cite: art("22、23"),
    items: [
      "針體用直徑 12 mm 以上之銅棒；有腐蝕之虞者，銅棒外部應施以防蝕保護。",
      "支持棒為銅管：長 1 m 以下，外徑 25 mm、管壁 1.5 mm 以上；超過 1 m，外徑 31 mm、管壁 2 mm 以上。",
      "支持棒為鐵管：管徑 25 mm、管壁 3 mm 以上，不得將導線穿入管內。",
    ],
  },
  {
    title: "離隔與搭接",
    cite: art("25第一、二款"),
    items: [
      "避雷導線與電力線、電話線、燃氣設備之供氣管路離開 1 m 以上（有靜電隔離者不在此限）。",
      "距避雷導線 1 m 以內之金屬落水管、鐵樓梯、自來水管等，以 14 mm² 以上銅線接地。",
    ],
  },
  {
    title: "接地",
    cite: art("25第四～六款"),
    items: [
      "避雷系統總接地電阻 10 Ω 以下。",
      "接地銅板：厚 1.4 mm 以上、面積 0.35 m² 以上，頂部距地表 1.5 m 以上。",
      "接地棒：長 2.4 m、直徑 19 mm 之鋼心包銅接地棒，頂部距地表 1 m 以上。",
      "一條避雷導線以並聯方式連接二個以上接地電極時，電極相互間隔 2 m 以上。",
    ],
  },
  {
    title: "施工",
    cite: art("25第七～九款"),
    items: [
      "導線應盡量避免連接；連接須以銅焊或銀焊為之，不得僅以螺絲連接。",
      "導線轉彎時彎曲半徑 20 cm 以上。",
      "導線每隔 2 m 以適當之固定器固定於建築物上。",
    ],
  },
  {
    title: "其他",
    cite: art("25第十、十一款"),
    items: [
      "不適宜裝設針體之地點，得以與避雷導線相同斷面之裸銅線架空代替針體，保護角依第21條。",
      "鋼構造或鋼筋混凝土建築符合第25條第十一款者，得以鋼骨或鋼筋代替避雷導線（本工具未檢討）。",
    ],
  },
];

export const ASSUMPTIONS = [
  "本工具依建築技術規則建築設備編第19～25條檢討；未納入 CNS、IEC 62305 風險評估與滾球法。",
  "煙囪、鐵塔等面積甚小得僅設 1 條導線者，以及以鋼骨、鋼筋代替避雷導線之檢討，本工具未納入。",
];

export const DISCLAIMER = "本計算結果僅供規劃設計參考，實際避雷設備仍以主管建築機關審查及相關法規為準。";
