// 台電配電場所面積檢討（低壓新設）。條文依據見 SOURCES。

export const SOURCES = {
  rules: "台灣電力股份有限公司營業規章",
  evLetter: "台灣電力公司配電處 111 年 12 月 13 日配字第 1118155991 號函",
  spec: "台灣電力股份有限公司新增設用戶配電場所設置規範（109 年 3 月修正）",
} as const;

export interface CalcStep {
  value: number;
  lines: string[];
  cite: string;
}

export interface SpecItem {
  item: string;
  requirement: string;
  cite: string;
}

export interface DistributionRoomResult {
  base: CalcStep;
  parking: CalcStep;
  total: number;
  specs: SpecItem[];
}

const fmt = (n: number) => n.toLocaleString("zh-TW", { maximumFractionDigits: 2 });

const BASE_TIERS = [
  { below: 2000, area: 12, label: "未滿 2,000 m²", formula: "3 m × 4 m 一處 = 12 m²" },
  { below: 4000, area: 16, label: "2,000 m² 以上未滿 4,000 m²", formula: "16 m² 一處" },
  { below: 6000, area: 20, label: "4,000 m² 以上未滿 6,000 m²", formula: "20 m² 一處" },
  { below: 8000, area: 28, label: "6,000 m² 以上未滿 8,000 m²", formula: "28 m² 一處" },
  { below: 10000, area: 40, label: "8,000 m² 以上未滿 10,000 m²", formula: "40 m² 一處" },
];

export function baseArea(floorArea: number): CalcStep {
  const cite = `${SOURCES.rules} 第67條第2項第1款`;
  const tier = BASE_TIERS.find((t) => floorArea < t.below);
  if (tier) {
    return {
      value: tier.area,
      lines: [
        `總樓地板面積 ${fmt(floorArea)} m²，屬「${tier.label}」級距`,
        `基本面積 = ${tier.formula}`,
      ],
      cite,
    };
  }

  const excess = floorArea - 10000;
  const blocks = Math.floor(excess / 2000);
  const remainder = excess - blocks * 2000;
  const n = blocks + (remainder >= 500 ? 1 : 0);
  const value = 40 + 3 * n;
  return {
    value,
    lines: [
      `總樓地板面積 ${fmt(floorArea)} m²，屬「10,000 m² 以上」級距`,
      `超出部分 = ${fmt(floorArea)} − 10,000 = ${fmt(excess)} m²`,
      `${fmt(excess)} ÷ 2,000 = ${blocks} 餘 ${fmt(remainder)} m²；餘數${
        remainder >= 500 ? " ≥ 500 m²，以 2,000 m² 計" : "未滿 500 m²，不予計算"
      } → 計 ${n} 個 2,000 m²`,
      `基本面積 = 40 + 3 × ${n} = ${value} m²`,
    ],
    cite,
  };
}

function byBaseArea(base: number, under60: number, under100: number, from100: number) {
  if (base < 60) return { value: under60, why: `基本面積 ${base} m² 未達 60 m²` };
  if (base < 100) return { value: under100, why: `基本面積 ${base} m² 為 60 m² 以上未達 100 m²` };
  return { value: from100, why: `基本面積 ${base} m² 為 100 m² 以上` };
}

export function parkingIncrement(spaces: number, base: number): CalcStep {
  const cite = `${SOURCES.evLetter}（附件1）`;
  const head = `汽車停車位 ${spaces} 格`;

  if (spaces <= 30) {
    return { value: 0, lines: [`${head}，屬「30 格以下」級距`, "原則不需另行增加 → +0 m²"], cite };
  }
  if (spaces <= 60) {
    return { value: 3, lines: [`${head}，屬「31～60 格」級距`, "增加 3 m²"], cite };
  }
  if (spaces <= 150) {
    return { value: 10, lines: [`${head}，屬「61～150 格」級距`, "增加 10 m²"], cite };
  }
  if (spaces <= 300) {
    const t = byBaseArea(base, 18, 14, 10);
    return { value: t.value, lines: [`${head}，屬「151～300 格」級距`, `${t.why} → 增加 ${t.value} m²`], cite };
  }
  const t = byBaseArea(base, 25, 21, 15);
  if (spaces <= 450) {
    return { value: t.value, lines: [`${head}，屬「301～450 格」級距`, `${t.why} → 增加 ${t.value} m²`], cite };
  }

  const over = spaces - 450;
  const k = Math.ceil(over / 150);
  const value = t.value + 5 * k;
  return {
    value,
    lines: [
      `${head}，屬「451 格以上」級距`,
      `301～450 格級距增量：${t.why} → ${t.value} m²`,
      `超過 450 格部分 = ${spaces} − 450 = ${over} 格，每 150 格計一次（不足 150 格以 150 格計）→ ${k} 次`,
      `增加面積 = ${t.value} + 5 × ${k} = ${value} m²`,
    ],
    cite,
  };
}

export function specsFor(total: number, fixedThreeByFour: boolean): SpecItem[] {
  const spec = SOURCES.spec;
  const lights = total <= 20 ? 1 : 1 + Math.ceil((total - 20) / 20);
  const pipes = total <= 12 ? 4 : total <= 20 ? 6 : 8;

  return [
    {
      item: "平面尺寸",
      requirement: fixedThreeByFour ? "3 m × 4 m（淨尺寸）" : "長、寬均不得小於 3.5 m（淨尺寸）",
      cite: `${SOURCES.rules} 第67條第2項第6款`,
    },
    {
      item: "淨高",
      requirement: "2.5 m 以上（樑下不影響設備設置及維護者得酌予降低）",
      cite: `${spec} 第6條`,
    },
    {
      item: "防火門寬度與數量",
      requirement:
        total < 20
          ? "寬度 1.2 m 以上，1 處"
          : total < 100
            ? "寬度 1.8 m 以上，1 處"
            : "寬度 1.8 m 以上，2 處（其中一處得為 0.9 m 以上扇門式或軌道拉門式）",
      cite: `${spec} 第3條二(二)2.(6)`,
    },
    {
      item: "防火門構造",
      requirement:
        "防火時效 1 小時以上、常時自動關閉、淨高 2 m 以上、不銹鋼或鋼製、與分間牆空隙 5 mm 以下",
      cite: `${spec} 第3條二(二)2.(1)～(5)`,
    },
    {
      item: "通風窗（65 cm × 65 cm）",
      requirement: total < 40 ? "2 處" : total < 80 ? "4 處" : "6 處以上",
      cite: `${spec} 第3條二(三)2`,
    },
    {
      item: "防火閘板",
      requirement: "附熔鍊或感溫裝置之不銹材質防火閘板及不銹鋼網，防火時效 1.5 小時以上",
      cite: `${spec} 第3條二(二)3`,
    },
    {
      item: "地板活載重",
      requirement: `${total < 20 ? 400 : total < 40 ? 600 : 900} kg/m² 以上`,
      cite: `${spec} 第8條`,
    },
    {
      item: "燈具出線盒",
      requirement: `${lights} 處（20 m² 以下 1 處，每增加 20 m² 增加 1 處，未滿 20 m² 以 20 m² 計）`,
      cite: `${spec} 第3條二(四)2`,
    },
    {
      item: "預埋管路",
      requirement: `標稱管徑 150 mm（6 吋）ES-1 級塑膠硬管 ${pipes} 管，埋設至建築線外 0.3 m`,
      cite: `${spec} 第3條二(五)1`,
    },
    {
      item: "設置方式",
      requirement:
        total >= 40 ? "得集中或分散設置；分散設置時每處不得小於 12 m²" : "以一處集中設置",
      cite: `${spec} 第9條`,
    },
    {
      item: "隔間",
      requirement:
        "雙磚（1B）疊砌或 12 cm 以上鋼筋混凝土，不得與水槽或衛浴設備共用牆，室內不得有用戶自備管線穿過",
      cite: `${spec} 第3條二(一)1、2`,
    },
    {
      item: "地板與門檻",
      requirement: "地板以 1/50～1/100 斜度傾向門口或集水孔，門口設 10 cm 以上無筋混凝土門檻",
      cite: `${spec} 第3條二(一)3`,
    },
    {
      item: "接地",
      requirement: "至少 2 處，於灌注底層地板前埋設",
      cite: `${spec} 第3條二(七)`,
    },
    {
      item: "搬運通道",
      requirement: "淨寬 1.2 m 以上，具適當強度且出入不受限制",
      cite: `${spec} 第5條`,
    },
  ];
}

export function reviewDistributionRoom(floorArea: number, parkingSpaces: number): DistributionRoomResult {
  const base = baseArea(floorArea);
  const parking = parkingIncrement(parkingSpaces, base.value);
  const total = base.value + parking.value;
  const fixedThreeByFour = floorArea < 2000 && parking.value === 0;
  return { base, parking, total, specs: specsFor(total, fixedThreeByFour) };
}

export const ASSUMPTIONS = [
  "本檢討適用於低壓新設、且依營業規章第66條須設置配電場所之建案（例如採三相四線式 220/380 V 供電，或位於地下配電地區、六樓以上達一定樓地板面積者）。",
  "五樓以下一棟一戶連棟、採單相三線式 110/220 V 供電者，得依營業規章第67條第2項第2款以較小面積計算，本檢討未納入。",
  "停車位擴增面積依台電配電處函文辦理，營業規章尚未納入；起造人如不配合，須填具切結書併入配電場所圖審資料。",
  "規格需求依合計面積（基本面積＋停車位擴增）判斷，擴增部分為未來可能增設變壓器之空間，載重、散熱等均應一併考量。",
];

export const REFERENCES = [
  `${SOURCES.rules}：第66條、第67條`,
  `${SOURCES.evLetter}（附件1：建築物停車位數量對應擴大配電場所面積對照表）`,
  `${SOURCES.spec}：第3條、第4條、第5條、第6條、第8條、第9條`,
];

export const DISCLAIMER =
  "本檢討結果僅供規劃初期參考，實際配電場所面積、位置及規格，仍以台灣電力公司各區營業處審查結果為準。";

export const LOCATION_NOTES: SpecItem[] = [
  {
    item: "設置樓層",
    requirement: "應設置於地面或以上樓層；確有困難時僅能設於地下一樓，且地面層應設防水或擋水設施",
    cite: `${SOURCES.rules} 第67條第1項；${SOURCES.spec} 第4條三`,
  },
  {
    item: "優先位置",
    requirement: "以面臨道路之地面一樓或建造執照範圍內之法定空地為原則",
    cite: `${SOURCES.spec} 第4條一`,
  },
  {
    item: "二樓以上",
    requirement: "須有載重 1.5 公噸以上、自備可靠緊急電源之永久性吊運設備",
    cite: `${SOURCES.spec} 第4條二`,
  },
  {
    item: "禁止位置",
    requirement: "不得佔用防空避難室及停車空間，不得設置於屋頂",
    cite: `${SOURCES.spec} 第4條五、六`,
  },
  {
    item: "上下樓層",
    requirement: "以公共空間為宜；如位於住宅空間正上、下方，應出具承諾書",
    cite: `${SOURCES.spec} 第4條九`,
  },
  {
    item: "十六樓以上建築物",
    requirement: "依用電性質、供電技術及實際需要個案檢討設置位置，必要時於中間樓層增設",
    cite: `${SOURCES.rules} 第67條第2項第7款；${SOURCES.spec} 第4條四`,
  },
  {
    item: "面積酌減",
    requirement: "設置於面臨道路之地面一樓或法定空地者，在不影響設備裝置及維護下，面積得酌予縮減",
    cite: `${SOURCES.rules} 第67條第2項第9款`,
  },
];
