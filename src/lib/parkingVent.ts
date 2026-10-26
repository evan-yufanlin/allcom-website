// 停車場通風（docs/parking-ventilation-spec.md）。
// 純計算模組：不依賴 React，可由 scripts/verify-parking-vent.ts 以 node 直接執行。

export interface VentFloor {
  label: string;
  floors: number;
  /** 每層停車樓地板面積（m²） */
  area: number;
}

export interface VentInput {
  floors: VentFloor[];
  /** 通風量（m³/h·m²） */
  rate: number;
  /** 單台風機風量（m³/h），選填 */
  fanFlow: number | null;
  /** 管道風速（m/s） */
  ductVelocity: number;
  /** 進氣百葉表面風速（m/s，ASHRAE Table 8） */
  intakeVelocity: number;
  /** 排氣百葉表面風速（m/s，ASHRAE Table 8） */
  exhaustVelocity: number;
  /** 百葉開口率（0～1，推算自由面積用） */
  freeRatio: number;
  /** 各層同時運轉（否則分時運轉，風量不累計） */
  simultaneous: boolean;
}

export interface FloorResult extends VentFloor {
  flow: number;
  fans: number | null;
  /** 同時運轉時：該層以下累計風量（由上而下累計至最上段） */
  cumulative: number;
  ductArea: number;
}

export interface Louver {
  /** 表面風速（m/s） */
  velocity: number;
  /** 百葉面積（m²，含外框）＝ 風量 ÷ 表面風速 */
  grossArea: number;
  /** 自由面積（m²）＝ 百葉面積 × 開口率 */
  freeArea: number;
  /** 自由面積風速（m/s，參考） */
  freeVelocity: number;
}

export interface VentResult {
  input: VentInput;
  rows: FloorResult[];
  totalFlow: number;
  maxFlow: number;
  /** 管道與百葉之計算風量 */
  designFlow: number;
  ductArea: number;
  exhaust: Louver;
  intake: Louver;
  totalFans: number | null;
}

export const fmt = (n: number, digits = 2) => n.toLocaleString("zh-TW", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

const ceil = (x: number) => Math.ceil(x - 1e-9);

function louver(flow: number, velocity: number, ratio: number): Louver {
  const grossArea = velocity > 0 ? flow / 3600 / velocity : 0;
  const freeArea = grossArea * ratio;
  return { velocity, grossArea, freeArea, freeVelocity: freeArea > 0 ? flow / 3600 / freeArea : 0 };
}

export function calculateVent(i: VentInput): VentResult {
  const duct = (q: number) => (i.ductVelocity > 0 ? q / 3600 / i.ductVelocity : 0);
  const base = i.floors.map((f) => ({ ...f, flow: f.area * i.rate }));
  // 樓層由上而下排列；最上列為通往戶外之最上段，累計其下（含）各層之風量
  let acc = 0;
  const cum: number[] = [];
  for (let k = base.length - 1; k >= 0; k--) {
    acc += base[k].flow * Math.max(1, base[k].floors);
    cum[k] = acc;
  }
  const rows: FloorResult[] = base.map((f, k) => ({
    ...f,
    fans: i.fanFlow && i.fanFlow > 0 ? ceil(f.flow / i.fanFlow) : null,
    cumulative: cum[k],
    ductArea: duct(i.simultaneous ? cum[k] : f.flow),
  }));
  const totalFlow = cum[0] ?? 0;
  const maxFlow = Math.max(0, ...rows.map((r) => r.flow));
  const designFlow = i.simultaneous ? totalFlow : maxFlow;
  const totalFans = i.fanFlow && i.fanFlow > 0 ? rows.reduce((s, r) => s + (r.fans ?? 0) * Math.max(1, r.floors), 0) : null;
  return {
    input: i,
    rows,
    totalFlow,
    maxFlow,
    designFlow,
    ductArea: duct(designFlow),
    exhaust: louver(designFlow, i.exhaustVelocity, i.freeRatio),
    intake: louver(designFlow, i.intakeVelocity, i.freeRatio),
    totalFans,
  };
}

export function defaultVentInput(): VentInput {
  return {
    floors: [],
    rate: 25,
    fanFlow: null,
    ductVelocity: 8,
    intakeVelocity: 2,
    exhaustVelocity: 2.5,
    freeRatio: 0.4,
    simultaneous: false,
  };
}

// ---- 說明文字 ----

export const SOURCES = {
  equipment: "建築技術規則建築設備編（111年12月29日修正）",
  design: "建築技術規則建築設計施工編（115年2月23日修正）",
  louver: "Airolite（Greenheck）Louver Fundamentals 應用指南",
  ashrae: "ASHRAE Handbook—Fundamentals 2009（SI）Ch. 21 Duct Design",
} as const;

export const LAW_REFS: { cite: string; text: string }[] = [
  { cite: "設備編第 102 條", text: "建築物供各種用途使用之空間設置機械通風設備時，汽車庫通風量不得小於樓地板面積每平方公尺每小時 25 立方公尺（自然送風及機械排風）。" },
  { cite: "設計施工編第 139 條第 1 款", text: "車庫部分之樓地板面積超過 500 平方公尺者，應設置能供給樓地板面積每一平方公尺每小時 25 立方公尺以上換氣量之機械通風設備；但設有各層樓地板面積十分之一以上有效通風之開口面積者，不在此限。" },
  { cite: "設計施工編第 62 條第 2 款", text: "停車空間設置戶外空氣之窗戶或開口，其有效通風面積不得小於該層供停車使用之樓地板面積百分之五或依規定設置機械通風設備。" },
  { cite: "設計施工編第 138 條第 2 款", text: "車庫地板如在地面以下時，應有二面以上直通戶外之通風口，或有代替之機械通風設備。" },
  { cite: "設計施工編第 144 條第 8 款", text: "防空避難設備應設置能供給樓地板面積每一平方公尺每小時 25 立方公尺以上換氣量之機械通風設備，機械通風設備應連接至緊急電源。" },
  { cite: "設備編第 97 條", text: "鼓風機應設置於與其他使用空間隔離之防火構造機房內（防火時效 1 小時以上），並應在適當位置裝置緊急開關；鼓風機風量每分鐘超過 560 立方公尺者，應裝設感溫裝置。" },
];

export const DEFINITIONS: { term: string; def: string; basis: string }[] = [
  { term: "百葉面積（louver face area）", def: "百葉之寬 × 高（gross louver opening，逐片計並含外框），即外牆應留設之開口大小。", basis: "Louver Fundamentals P.1；ASHRAE 2009 p.21.15" },
  { term: "表面風速（face velocity）", def: "風量 ÷ 百葉面積；本工具輸入之百葉風速即為表面風速。ASHRAE 建議進氣 2 m/s（單片 3.3 m³/s 以上）、排氣 2.5 m/s（單片 2.4 m³/s 以上），較小風量依 Fig. 14。", basis: "ASHRAE 2009 Ch. 21 Table 8" },
  { term: "自由面積（free area）", def: "百葉面積扣除葉片及邊框阻擋後，空氣可自由通過之面積；ASHRAE Fig. 14 以 45% 以上為基準。", basis: "Louver Fundamentals P.1；ASHRAE Fig. 14" },
  { term: "開口率", def: "自由面積 ÷ 百葉面積，常以百分比表示。", basis: "Louver Fundamentals P.1" },
  { term: "自由面積風速（free area velocity）", def: "風量 ÷ 自由面積 ＝ 表面風速 ÷ 開口率；AMCA 500-L 進水測試之風速基準，應低於所選百葉之開始滲水點。", basis: "Louver Fundamentals P.3" },
];

export const REMINDERS = [
  "百葉表面風速預設依 ASHRAE 2009 Ch. 21 Table 8（進氣 2 m/s、排氣 2.5 m/s，以含外框之百葉面積計）；地面層鄰人行之進氣百葉表面風速不超過 0.5 m/s；最終依 AMCA 500-L 廠商資料選型。風速、開口率非法規值。",
  "停車場通風通常為各層共用管道間，並以計時器分時運轉（各層不同時運轉）；如各層同時運轉或各層獨立管道，風量另依實際檢討。",
  "管道間面積為風道淨斷面，未含管道間結構、保溫及檢修空間。",
  "進、排氣百葉宜避開人行動線，並避免進、排氣口相互短路。",
  "鼓風機應設於防火構造機房並設緊急開關；風量每分鐘超過 560 m³ 者應裝設感溫裝置（設備編第 97 條）。",
  "兼作防空避難設備者，機械通風設備應連接緊急電源（設計施工編第 144 條）。",
  "排煙設備依消防法規另行檢討。",
];

export const DISCLAIMER = "本計算結果僅供規劃設計參考，實際通風設備仍應依相關法規及設備廠商資料檢討。";
