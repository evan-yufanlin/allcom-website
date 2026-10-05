// 消防水池容量檢討（docs/fire-water-spec.md）。
// 純計算模組：不依賴 React，可由 scripts/verify-fire.ts 以 node 直接執行。

export const SOURCES = {
  standard: "各類場所消防安全設備設置標準（113年4月24日修正）",
  evGuide: "建築物附屬停車空間電動車輛充電使用安全指引（115年6月3日修正）",
} as const;

export type FlowBasis = "pump" | "legal";
export type HydrantKind = "first" | "second";
export type HeadKind = "general" | "rack" | "small" | "side";
export type FoamAgent = "synthetic" | "protein" | "afff";
export type ReservoirClause = 1 | 2 | 3;

export interface SprinklerZone {
  name: string;
  head: HeadKind;
  heads: number;
  dry: boolean;
}

export interface Pool {
  label: string;
  area: number;
  /** 有效高度（m）；null 表示採共用參數試算之有效高度 */
  depth: number | null;
  count: number;
}

export interface FireInput {
  basis: FlowBasis;
  indoor: { on: boolean; kind: HydrantKind; single: boolean };
  outdoor: { on: boolean };
  sprinkler: { on: boolean; zones: SprinklerZone[] };
  foam: { on: boolean; area: number; agent: FoamAgent; pipeFill: number };
  reservoir: { on: boolean; clause: ReservoirClause; floor12: number; total: number; shared: boolean };
  /** 實設水池（選填）；池高、底部、頂部單位 m，吸水管徑單位 mm */
  poolSpec: { height: number; bottom: number; top: number; suction: number };
  pools: Pool[];
}

export interface Step {
  title: string;
  value: string;
  lines: string[];
  cite: string;
}

export interface SystemLine {
  key: "indoor" | "outdoor" | "sprinkler" | "foam" | "reservoir";
  name: string;
  formula: string;
  m3: number;
  cite: string;
}

export interface ZoneResult extends SprinklerZone {
  flow: number;
  countedHeads: number;
  m3: number;
  max: boolean;
}

export interface ReservoirResult {
  byFloor12: number;
  byTotal: number;
  m3: number;
  inlets: number;
  outlets: number;
  step: Step;
}

export interface PoolResult extends Pool {
  usedDepth: number;
  m3: number;
}

export interface FireResult {
  input: FireInput;
  lines: SystemLine[];
  zones: ZoneResult[];
  reservoir: ReservoirResult | null;
  /** 消防水池應設容量（消防專用蓄水池共用時併入） */
  required: number;
  /** 消防專用蓄水池獨立設置時之應設容量 */
  separate: number | null;
  roofTank: { m3: number; step: Step } | null;
  defaultDepth: number;
  pools: PoolResult[];
  poolTotal: number;
  poolOk: boolean | null;
  steps: Step[];
}

// ---- 法規參數 ----

/** 室內消防栓：幫浦出水量（第37條）、法定放水量（第34條），L/min・支 */
export const INDOOR_FLOW: Record<HydrantKind, { name: string; pump: number; legal: number; roofTank: number }> = {
  first: { name: "第一種消防栓", pump: 150, legal: 130, roofTank: 0.5 },
  second: { name: "第二種消防栓", pump: 90, legal: 80, roofTank: 0.3 },
};

/** 室外消防栓：幫浦出水量（第42條）、法定放水量（第40條），L/min・支 */
export const OUTDOOR_FLOW = { pump: 400, legal: 350 };

/** 撒水頭：幫浦出水量（第58條）、法定放水量（第50條），L/min・個 */
export const HEAD_FLOW: Record<HeadKind, { name: string; pump: number; legal: number }> = {
  general: { name: "密閉式一般反應型、快速反應型", pump: 90, legal: 80 },
  rack: { name: "高架儲存倉庫", pump: 130, legal: 114 },
  small: { name: "小區劃型", pump: 60, legal: 50 },
  side: { name: "側壁型", pump: 90, legal: 80 },
};

/** 泡沫噴頭放射量（第72條），L/min・m² */
export const FOAM_RATE: Record<FoamAgent, { name: string; rate: number }> = {
  synthetic: { name: "合成界面活性泡沫液", rate: 8 },
  protein: { name: "蛋白質泡沫液", rate: 6.5 },
  afff: { name: "水成膜泡沫液", rate: 3.7 },
};

export const BASIS_NAME: Record<FlowBasis, string> = { pump: "幫浦出水量", legal: "法定放水量" };

export const CLAUSE_TEXT: Record<ReservoirClause, string> = {
  1: "第一款：基地面積 20,000 m² 以上，且任一層樓地板面積 1,500 m² 以上",
  2: "第二款：高度超過 31 m，且總樓地板面積 25,000 m² 以上",
  3: "第三款：同一基地二棟以上，外牆與中心線水平距離第一層 3 m、第二層 5 m 以下，且各棟第一、二層樓地板面積合計 10,000 m² 以上",
};

const SPRINKLER_ROOF_TANK = 1;
const FOAM_ROOF_TANK = 1;

export const fmt = (n: number, digits = 1) =>
  n.toLocaleString("zh-TW", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

const art = (...n: (number | string)[]) => `設置標準第${n.join("、")}條`;

// ---- 計算 ----

/** 共用參數試算之有效高度：池高 − 底部 − 1.65D（以公分無條件進位）− 頂部。 */
export function effectiveDepth(spec: FireInput["poolSpec"]) {
  const suctionCm = Math.ceil((1.65 * spec.suction) / 10 - 1e-9);
  return { suctionCm, depth: Math.max(0, spec.height - spec.bottom - suctionCm / 100 - spec.top) };
}

export function calculateFireWater(input: FireInput): FireResult {
  const b = input.basis;
  const lines: SystemLine[] = [];
  const steps: Step[] = [];

  if (input.indoor.on) {
    const f = INDOOR_FLOW[input.indoor.kind];
    const n = input.indoor.single ? 1 : 2;
    const m3 = (f[b] * n * 20) / 1000;
    lines.push({
      key: "indoor",
      name: `室內消防栓（${f.name}）`,
      formula: `${f[b]} L/min × ${n} 支 × 20 min`,
      m3,
      cite: art(36, b === "pump" ? 37 : 34),
    });
  }

  if (input.outdoor.on) {
    const q = OUTDOOR_FLOW[b];
    lines.push({
      key: "outdoor",
      name: "室外消防栓",
      formula: `${q} L/min × 2 支 × 30 min`,
      m3: (q * 2 * 30) / 1000,
      cite: art(41, b === "pump" ? 42 : 40),
    });
  }

  let zones: ZoneResult[] = [];
  if (input.sprinkler.on) {
    zones = input.sprinkler.zones.map((z) => {
      const flow = HEAD_FLOW[z.head][b];
      const countedHeads = z.dry ? Math.ceil(z.heads * 1.5 - 1e-9) : z.heads;
      return { ...z, flow, countedHeads, m3: (flow * countedHeads * 20) / 1000, max: false };
    });
    const top = zones.reduce((best, z, i) => (z.m3 > (zones[best]?.m3 ?? -1) ? i : best), -1);
    if (top >= 0) {
      zones[top].max = true;
      const z = zones[top];
      lines.push({
        key: "sprinkler",
        name: `自動撒水（${z.name || "最大區域"}）`,
        formula: `${z.flow} L/min × ${z.countedHeads} 個 × 20 min`,
        m3: z.m3,
        cite: art(57, b === "pump" ? 58 : 50),
      });
    }
  }

  if (input.foam.on) {
    const f = FOAM_RATE[input.foam.agent];
    const base = (input.foam.area * f.rate * 20) / 1000;
    const m3 = (base + input.foam.pipeFill) * 1.2;
    lines.push({
      key: "foam",
      name: `泡沫滅火（${f.name}）`,
      formula: `(${fmt(input.foam.area, 2)} m² × ${f.rate} L/min・m² × 20 min${
        input.foam.pipeFill > 0 ? ` ＋ 配管 ${fmt(input.foam.pipeFill, 2)} m³` : ""
      }) × 1.2`,
      m3,
      cite: art(72, 75, 76),
    });
  }

  let reservoir: ReservoirResult | null = null;
  if (input.reservoir.on) {
    const r = input.reservoir;
    const n12 = Math.ceil(r.floor12 / 7500 - 1e-9);
    const nTotal = Math.ceil(r.total / 12500 - 1e-9);
    const byFloor12 = n12 * 20;
    const byTotal = nTotal * 20;
    const useTotal = r.clause === 2;
    const m3 = useTotal ? byTotal : byFloor12;
    const inlets = m3 <= 0 ? 0 : m3 < 80 ? 1 : 2;
    const outlets = m3 < 20 ? 0 : m3 < 40 ? 1 : m3 < 120 ? 2 : 3;
    reservoir = {
      byFloor12,
      byTotal,
      m3,
      inlets,
      outlets,
      step: {
        title: "消防專用蓄水池有效水量",
        value: `${fmt(m3)} m³`,
        lines: [
          `適用第27條${["", "第一款", "第二款", "第三款"][r.clause]}`,
          `${useTotal ? "　" : "▶"} 第一層＋第二層 ${fmt(r.floor12, 2)} m² ÷ 7,500 m²（包括未滿）＝ ${n12} × 20 m³ ＝ ${fmt(byFloor12)} m³（第一、三款）`,
          `${useTotal ? "▶" : "　"} 總樓地板面積 ${fmt(r.total, 2)} m² ÷ 12,500 m²（包括未滿）＝ ${nTotal} × 20 m³ ＝ ${fmt(byTotal)} m³（第二款）`,
          `投入孔 ${inlets} 個以上、採水口 ${outlets} 個以上`,
        ],
        cite: art(27, 185),
      },
    };
    if (r.shared) {
      lines.push({
        key: "reservoir",
        name: "消防專用蓄水池（共用）",
        formula: useTotal ? `${nTotal} × 20 m³` : `${n12} × 20 m³`,
        m3,
        cite: art(27, 185),
      });
    }
  }

  const required = lines.reduce((sum, l) => sum + l.m3, 0);
  const separate = reservoir && !input.reservoir.shared ? reservoir.m3 : null;

  // 屋頂水箱：與其他設備並用時取最大值（第32條）
  const tankItems: { name: string; m3: number; cite: string }[] = [];
  if (input.indoor.on)
    tankItems.push({ name: `室內消防栓（${INDOOR_FLOW[input.indoor.kind].name}）`, m3: INDOOR_FLOW[input.indoor.kind].roofTank, cite: "第32條" });
  if (input.sprinkler.on) tankItems.push({ name: "自動撒水設備", m3: SPRINKLER_ROOF_TANK, cite: "第44條" });
  if (input.foam.on) tankItems.push({ name: "泡沫滅火設備", m3: FOAM_ROOF_TANK, cite: "第74條準用第44條" });
  const roofTank = tankItems.length
    ? (() => {
        const m3 = Math.max(...tankItems.map((t) => t.m3));
        return {
          m3,
          step: {
            title: "屋頂水箱容量",
            value: `${fmt(m3)} m³`,
            lines: [
              ...tankItems.map((t) => `${t.name}：${fmt(t.m3)} m³ 以上（${t.cite}）`),
              ...(tankItems.length > 1 ? [`並用時取最大值 ＝ ${fmt(m3)} m³`] : []),
            ],
            cite: art(32, 44, 74),
          },
        };
      })()
    : null;

  const eff = effectiveDepth(input.poolSpec);
  const defaultDepth = eff.depth;
  const pools = input.pools.map((p) => {
    const usedDepth = p.depth ?? defaultDepth;
    return { ...p, usedDepth, m3: p.area * usedDepth * p.count };
  });
  const poolTotal = pools.reduce((sum, p) => sum + p.m3, 0);
  const hasPools = pools.some((p) => p.m3 > 0);
  const poolOk = hasPools && required > 0 ? poolTotal >= required - 1e-9 : null;

  steps.push({
    title: "消防水池應設容量",
    value: `${fmt(required)} m³`,
    lines: lines.length
      ? [
          ...lines.map((l) => `${l.name}：${l.formula} ＝ ${fmt(l.m3)} m³`),
          `合計 ＝ ${lines.map((l) => fmt(l.m3)).join(" ＋ ")} ＝ ${fmt(required)} m³`,
        ]
      : ["尚未勾選消防系統"],
    cite: `${art(36)}第3項（併設時水源容量應在各設備應設水量合計以上）`,
  });

  return {
    input,
    lines,
    zones,
    reservoir,
    required,
    separate,
    roofTank,
    defaultDepth,
    pools,
    poolTotal,
    poolOk,
    steps,
  };
}

export function defaultFireInput(): FireInput {
  return {
    basis: "pump",
    indoor: { on: false, kind: "first", single: false },
    outdoor: { on: false },
    sprinkler: { on: false, zones: [] },
    foam: { on: false, area: 100, agent: "synthetic", pipeFill: 0 },
    reservoir: { on: false, clause: 1, floor12: 0, total: 0, shared: true },
    poolSpec: { height: 0, bottom: 0.3, top: 0.2, suction: 150 },
    pools: [],
  };
}

/** 引用法規（依勾選系統）。 */
export function references(r: FireResult) {
  const i = r.input;
  const arts = new Set<number>();
  if (i.indoor.on) [32, 34, 36, 37].forEach((n) => arts.add(n));
  if (i.outdoor.on) [40, 41, 42].forEach((n) => arts.add(n));
  if (i.sprinkler.on) [44, 50, 57, 58].forEach((n) => arts.add(n));
  if (i.foam.on) [72, 74, 75, 76].forEach((n) => arts.add(n));
  if (i.reservoir.on) [27, 185].forEach((n) => arts.add(n));
  const list = [`${SOURCES.standard}：第${[...arts].sort((a, b) => a - b).join("、")}條`];
  if (i.sprinkler.on) list.push(`${SOURCES.evGuide}：第三點（六）`);
  return list;
}

// ---- 說明文字 ----

export const HINTS = {
  indoorFlow:
    "第36條僅規定最多樓層全部消防栓（超過 2 支以 2 支計）繼續放水 20 分鐘，未定每支流量；預設以第37條幫浦出水量計，亦可切換為第34條放水量。",
  indoorFirst: "第12條第二款第十一目（倉庫、傢俱展示販售場）及第四款（丁類場所）應設第一種消防栓（第34條）。",
  outdoor: "室外消防栓以 2 支同時放水 30 分鐘計算（第41條）。",
  sprinklerHeads:
    "撒水頭數量依第57條表列數量以上；實設撒水頭較少者，得依實際數量計算。側壁型、小區劃型：10 層以下 8 個、11 層以上 12 個。",
  sprinklerDry: "使用乾式或預動式流水檢知裝置時，撒水頭數量追加 50%（第57條第2項），以無條件進位計。",
  foamArea: "泡沫噴頭每一放射區域 50～100 m²（第75條），以最大一個放射區域計算。",
  foamTotal: "水溶液量應加算充滿配管所需量，並加算總泡沫水溶液量之 20%（第76條第2項）。",
  reservoirFloor: "第一層樓地板面積含同基地附屬建築物（如警衛室、廢品倉、涼亭）之第一層面積。",
  reservoirDepth: "有效水量指基地地面下 4.5 m 範圍內之水量；採機械方式引水者不在此限（第185條第2項）。",
  pools: "有效高度 ＝ 池高 − 底部 − 1.65D（吸水管徑，以公分無條件進位）− 頂部；各池可另行填入。",
};

export const REMINDERS = [
  "消防水池宜設於消防幫浦室下方或鄰近處，吸水管底閥距池底及水面應保持足夠距離。",
  "消防專用蓄水池應設於消防車能接近至其 2 m 範圍內，任一蓄水池至建築物各部分水平距離 100 m 以下（第185條）。",
  "投入孔為邊長或直徑 60 cm 以上；水量未滿 80 m³ 設 1 個以上，80 m³ 以上設 2 個以上。採水口口徑 100 mm，距地面 0.5～1 m（第185條）。",
  "公共危險物品等場所（第四編）之室內、室外消防栓水源另依第209條、第210條計算，本工具未納入。",
  "停車空間依電動車輛充電使用安全指引，得依場所風險屬性選設自動撒水設備，撒水頭數量及放水量依設置標準一般規定計算。",
];

export const ASSUMPTIONS = [
  "本工具依勾選之消防系統計算各系統水源量並合計；不判定依用途、樓層、面積應設置之設備。",
  "不同系統之水源加總；同一撒水系統有多個區域時，取最大值。",
  "數值計算保留全精度，顯示至小數 1 位；與審查圖說取整之結果可能略有差異。",
];

export const DISCLAIMER =
  "本計算結果僅供規劃設計參考，實際消防水源容量仍以消防主管機關審查結果為準。";

export const NEXT_VERSION_NOTE = "消防泵浦室尺寸、中繼水箱及依用途判定應設設備將於下一版提供";
