// 給水水理計算：法規參數與對照表。規格見 docs/water-supply-spec.md。

export type Jurisdiction = "taiwan" | "taipei";

export const JURISDICTION_NAME: Record<Jurisdiction, string> = {
  taiwan: "台灣自來水公司",
  taipei: "臺北自來水事業處",
};

export const SOURCES = {
  standard: "自來水用戶用水設備標準",
  twRules: "台灣自來水股份有限公司用戶用水設備申裝作業要點（115年3月版）",
  twForm: "台水申裝作業要點附件十一「內線設備水力計算表」",
  twBaseline:
    "台灣自來水股份有限公司住宅類用戶新裝用水設備蓄水池及水塔合計容量基準值（111年10月26日台水營字第1110037083號公告修正）",
  twHighland: "台水申裝作業要點附件九「建案供水高程查對表」",
  tpRules: "臺北自來水事業處自來水用水設備設計、審圖、檢驗及給水申請作業規範（114年1月修編）",
  planRules: "用水計畫審核管理辦法（113年1月3日修正）",
  planFormat: "用水計畫書件內容及格式（111年5月2日經授水字第11120206070號令修正）",
  parkGuide: "竹科園區用水計畫書及用水平衡圖填寫說明（113年7月10日）",
} as const;

// ---- 轄區判定 ----

export const TAIPEI_XIZHI_VILLAGES = ["北山里", "環河里", "橫科里", "福山里", "宜興里", "忠山里", "東勢里"];

export type DistrictRule =
  | { kind: "taipei" }
  | { kind: "taipei-partial"; note: string }
  | { kind: "xizhi" };

/** 北水轄區內（或部分）的新北市行政區；其餘縣市、行政區皆屬台水。 */
export const NEW_TAIPEI_RULES: Record<string, DistrictRule> = {
  新店區: { kind: "taipei" },
  永和區: { kind: "taipei" },
  三重區: { kind: "taipei-partial", note: "二重疏洪道以西屬台水" },
  中和區: { kind: "taipei-partial", note: "中和路、中山路三段後靠近板橋區屬台水" },
  汐止區: { kind: "xizhi" },
};

// ---- 台水住宅類蓄水量基準值（111.10.26）與附件九高地供水地區 ----

export interface BaselineArea {
  county: string;
  district: string;
  places: string;
  /** 合計蓄水量（日）；null 表示依審查訂定 */
  days: number | null;
  reason: string;
}

const H = "高地供水";
const E = "管線末端";
const S = "水量不足";

export const TW_BASELINE: BaselineArea[] = [
  { county: "基隆市", district: "中正區", places: "和平島（全區）、調和街、新豐街、武昌街104巷", days: 2, reason: H },
  { county: "基隆市", district: "七堵區", places: "大同街、東新街、泰安路、大華三路", days: 2, reason: H },
  { county: "基隆市", district: "信義區", places: "深澳坑路", days: 2, reason: H },
  { county: "基隆市", district: "仁愛區", places: "南新街、龍安街", days: 2, reason: H },
  { county: "基隆市", district: "中山區", places: "中和路", days: 2, reason: H },
  { county: "新北市", district: "淡水區", places: "新義里、新民里、樹興里、正德里、新春里、坪頂里、北新里、崁頂里、新興里", days: 2, reason: H },
  { county: "新北市", district: "汐止區", places: "水源路2段、秀山路、勤進路、新台五路2段170號以後、汐萬路3段、伯爵街、湖前路100號以後", days: 2, reason: H },
  { county: "新北市", district: "貢寮區", places: "和美里", days: 2, reason: H },
  { county: "新北市", district: "烏來區", places: "全區", days: 2, reason: H },
  { county: "新北市", district: "平溪區", places: "嶺腳里", days: 2, reason: H },
  { county: "新北市", district: "深坑區", places: "土庫里", days: 2, reason: H },
  { county: "新北市", district: "瑞芳區", places: "九份地區（福住里、崇文里、基山里、頌德里、永慶里）", days: 2, reason: H },
  { county: "新北市", district: "瑞芳區", places: "金瓜石地區（新山里、銅山里、石山里、瓜山里）", days: 2, reason: H },
  { county: "新北市", district: "瑞芳區", places: "濱海地區（鼻頭里、濂新里、濂洞里、南雅里、海濱里、瑞濱里、深澳里）", days: 2, reason: H },
  { county: "新北市", district: "瑞芳區", places: "猴硐地區（猴硐里、光復里、弓橋里、碩仁里）", days: 2, reason: H },
  { county: "新北市", district: "瑞芳區", places: "瑞芳工業區（大寮路上天橋路口至頂坪路止、頂坪路、頂坪一路至頂坪五路）", days: 2, reason: H },
  { county: "新北市", district: "林口區", places: "頂福里、下福里、南勢里、麗林里、麗園里、東勢里、西林里、林口里、東林里", days: 2, reason: H },
  { county: "宜蘭縣", district: "頭城鎮", places: "石城里濱海路7段", days: 2, reason: E },
  { county: "宜蘭縣", district: "礁溪鄉", places: "大忠路（路口以西）、五峰路", days: 1.5, reason: H },
  { county: "桃園市", district: "桃園區", places: "國聖二街、宏昌十三街、宏昌十二街、宏昌八街、大同路、南山街、大同西路、青田街、永美街、慈文路、中正五街、同德十一街、中正路、富國路646巷、大林里、福安里、大豐里、雲林里、福林里", days: 1.5, reason: H },
  { county: "桃園市", district: "龜山區", places: "文青里、樂善里、長庚里（文化一路以東）", days: 2, reason: E },
  { county: "臺中市", district: "沙鹿區", places: "竹林里中山路以北、正英路以南、公明里、西勢里、清泉里、晉江里（11鄰）", days: 1.5, reason: H },
  { county: "臺中市", district: "龍井區", places: "大肚龍井山頂區", days: 1.5, reason: H },
  { county: "臺中市", district: "大肚區", places: "大肚龍井山頂區、沙田路3段以南至沙田路1段王田里一帶、自由路、華山路（自由路以東部分）", days: 1.5, reason: H },
  { county: "臺中市", district: "北屯區", places: "民政里、大坑里、東山里、部子里", days: 1.5, reason: H },
  { county: "臺中市", district: "南屯區", places: "春社里、春安里、文山里、寶山里", days: 1.5, reason: H },
  { county: "臺中市", district: "西屯區", places: "廣福路", days: 1.5, reason: E },
  { county: "臺中市", district: "大雅區", places: "中山高國道1號以西", days: 1.5, reason: E },
  { county: "臺中市", district: "神岡區", places: "新庄里、神岡里、圳前里、庄前里、庄後里、北庄里、山皮里、社口里", days: 1.5, reason: E },
  { county: "臺中市", district: "清水區", places: "楊厝里、吳厝里、海風里、東山里", days: 1.5, reason: E },
  { county: "南投縣", district: "信義鄉", places: "新開巷", days: 1.5, reason: E },
  { county: "南投縣", district: "魚池鄉", places: "日月村、水社村", days: 1.5, reason: H },
  { county: "南投縣", district: "埔里鎮", places: "南村里、水頭里、蜈蚣里、大湳里、牛眠里、史港里、珠格里、溪南里", days: 1.5, reason: H },
  { county: "南投縣", district: "仁愛鄉", places: "大同村、春陽村", days: 1.5, reason: H },
  { county: "南投縣", district: "國姓鄉", places: "南港村、北山村、福龜村", days: 1.5, reason: H },
  { county: "彰化縣", district: "彰化市", places: "全區", days: 2, reason: S },
  { county: "彰化縣", district: "和美鎮", places: "全區", days: 2, reason: S },
  { county: "彰化縣", district: "永靖鄉", places: "浮圳村", days: 1.5, reason: `${H}與${E}` },
  { county: "彰化縣", district: "田尾鄉", places: "南鎮村、新興村", days: 1.5, reason: `${H}與${E}` },
  { county: "彰化縣", district: "二水鄉", places: "倡和村、合和村", days: 1.2, reason: H },
  { county: "彰化縣", district: "社頭鄉", places: "清水村、埤斗村", days: 1.2, reason: H },
  { county: "彰化縣", district: "鹿港鎮", places: "彰濱工業區-鹿港區、東崎里、溝墘里、頭崙里、山崙里、草中里、頂番里、頭南里、洋厝里、海埔里", days: 1.5, reason: `${S}與${E}` },
  { county: "彰化縣", district: "福興鄉", places: "番婆村、大崙村、麥厝村、三和村、鎮平村、福寶村、福南村、同安村、頂粘村、廈粘村", days: 1.5, reason: `${S}與${E}` },
  { county: "彰化縣", district: "秀水鄉", places: "秀水村、陝西村、金興村、下崙村", days: 1.5, reason: S },
  { county: "彰化縣", district: "埔心鄉", places: "埤霞村、埤腳村、油車村", days: 1.5, reason: S },
  { county: "彰化縣", district: "花壇鄉", places: "花壇村、金墩村、中庄村、劉厝村、崙雅村、南口村、中口村、北口村、長沙村、文德村、白沙村、橋頭村、灣東村、三春村、長春村", days: 1.5, reason: S },
  { county: "彰化縣", district: "花壇鄉", places: "岩竹村、三芬路（永春村、灣雅村）", days: 2, reason: `${H}與${E}` },
  { county: "彰化縣", district: "大村鄉", places: "大村村、茄苳村、南勢村、田洋村、新興村、過溝村、平和村、貢旗村、加錫村、村上村、大橋村、大崙村", days: 1.5, reason: S },
  { county: "彰化縣", district: "大村鄉", places: "福興二巷（福興村）", days: 2, reason: `${H}與${E}` },
  { county: "彰化縣", district: "大村鄉", places: "擺塘村、美港村、黃厝村", days: 2, reason: S },
  { county: "彰化縣", district: "員林市", places: "全區", days: 2, reason: S },
  { county: "雲林縣", district: "虎尾鎮", places: "中部科學園區虎尾園區、興南里", days: 2, reason: E },
  { county: "雲林縣", district: "林內鄉", places: "坪頂村", days: 2, reason: `${H}與${E}` },
  { county: "雲林縣", district: "斗六市", places: "湖山里", days: 2, reason: `${H}與${E}` },
  { county: "嘉義縣", district: "竹崎鄉", places: "文峰村、白杞村、塘興村、昇平村", days: 2, reason: H },
  { county: "嘉義縣", district: "番路鄉", places: "民和村、公田村、公興村", days: 2, reason: H },
  { county: "嘉義縣", district: "東石鄉", places: "鰲鼓村、蔦松村、溪下村", days: 2, reason: E },
  { county: "嘉義縣", district: "鹿草鄉", places: "下麻村、施家村、豐稠村、後堀村", days: 2, reason: E },
  { county: "嘉義縣", district: "布袋鎮", places: "好美里", days: 2, reason: E },
  { county: "臺南市", district: "白河區", places: "關嶺里、仙草里、虎山里、六溪里、崎內里、汴頭里", days: 2, reason: H },
  { county: "臺南市", district: "東山區", places: "南溪里、水雲里、林安里、東原里、嶺南里、南勢里、青山里、高原里", days: 2, reason: H },
  { county: "高雄市", district: "田寮區", places: "田寮里、南安里、七星里", days: 2, reason: H },
  { county: "高雄市", district: "燕巢區", places: "牧場路", days: 2, reason: H },
  { county: "高雄市", district: "梓官區", places: "赤崁北路", days: 2, reason: H },
  { county: "高雄市", district: "彌陀區", places: "舊港里、新庄路", days: 2, reason: H },
  { county: "屏東縣", district: "新園鄉", places: "全區", days: 2, reason: S },
  { county: "屏東縣", district: "崁頂鄉", places: "全區", days: 2, reason: S },
  { county: "屏東縣", district: "琉球鄉", places: "全區", days: 2, reason: S },
  { county: "屏東縣", district: "南州鄉", places: "同安村、南安村", days: 2, reason: S },
  ...["馬公市", "湖西鄉", "白沙鄉", "西嶼鄉", "望安鄉", "七美鄉"].map((district) => ({
    county: "澎湖縣",
    district,
    places: "全區",
    days: 2,
    reason: S,
  })),
];

/** 僅列於附件九（高地供水、須附供水計畫書）而未列入基準值表的地區：日數依審查訂定（1.5～2.0 日）。 */
export const TW_HIGHLAND_ONLY: BaselineArea[] = [
  { county: "新北市", district: "土城區", places: "廷寮里、清化里、大安里、永寧里、祖田里", days: null, reason: H },
  { county: "新北市", district: "三峽區", places: "五寮里、金圳里、插角里、安坑里、有木里、竹崙路、紫薇路、紫新路、成福路202號以後、白雞路（白雞山莊至行修宮）", days: null, reason: H },
  { county: "新北市", district: "鶯歌區", places: "中湖路、東湖路、湖山街、大湖里", days: null, reason: H },
  { county: "新北市", district: "八里區", places: "長坑里、荖阡里、舊城里（中華路二段以南山區一帶及八里療養院、新北市愛維養護中心一帶）、埤頭里（華富山路全線）、大崁里（渡船頭路全線）、下罟里（台15線以南山區帶）", days: null, reason: H },
  { county: "新北市", district: "新莊區", places: "新北大道七段312號至772號（含巷弄）、壽山路、青山路", days: null, reason: H },
  { county: "新北市", district: "林口區", places: "太平里（台61線以南山區一帶）", days: null, reason: H },
  { county: "新竹縣", district: "竹北市", places: "溪洲里、新庄里、東海里", days: null, reason: H },
  { county: "新竹縣", district: "新埔鎮", places: "上寮里", days: null, reason: H },
  { county: "新竹縣", district: "關西鎮", places: "東平里、北斗里、玉山里、錦山里", days: null, reason: H },
  { county: "新竹縣", district: "芎林鄉", places: "全區", days: null, reason: H },
  { county: "新竹縣", district: "寶山鄉", places: "三峰村、大崎村", days: null, reason: H },
  { county: "新竹市", district: "東區", places: "科園里、水仙里、龍山里、關東里", days: null, reason: H },
  { county: "新竹市", district: "香山區", places: "內湖里、大湖里、鹽水里、南隘里、中隘里", days: null, reason: H },
  { county: "苗栗縣", district: "西湖鄉", places: "湖東村、金獅村、龍洞村、五湖村、二湖村、三湖村、四湖村、下埔村、高埔村", days: null, reason: H },
  { county: "苗栗縣", district: "通霄鎮", places: "坪頂里", days: null, reason: H },
  { county: "苗栗縣", district: "苗栗市", places: "福星里", days: null, reason: H },
  { county: "苗栗縣", district: "公館鄉", places: "石墻村、福基村、福星村", days: null, reason: H },
  { county: "屏東縣", district: "牡丹鄉", places: "四林村", days: null, reason: H },
  { county: "屏東縣", district: "獅子鄉", places: "丹路村、內文村、獅子村中心崙部落", days: null, reason: H },
  { county: "屏東縣", district: "滿州鄉", places: "長樂村", days: null, reason: H },
  { county: "屏東縣", district: "恆春鎮", places: "鵝鑾里、頭溝里大坪頂", days: null, reason: H },
];

export const COUNTIES = [
  "臺北市", "新北市", "基隆市", "桃園市", "新竹市", "新竹縣", "苗栗縣", "臺中市", "彰化縣", "南投縣",
  "雲林縣", "嘉義市", "嘉義縣", "臺南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "臺東縣", "澎湖縣",
  "金門縣", "連江縣",
];

/** 縣市內需要個別判斷的行政區（北水轄區、基準值表、附件九）；其餘行政區以「其他行政區」代表。 */
export function districtsOf(county: string): string[] {
  const set = new Set<string>();
  if (county === "新北市") Object.keys(NEW_TAIPEI_RULES).forEach((d) => set.add(d));
  for (const a of [...TW_BASELINE, ...TW_HIGHLAND_ONLY]) if (a.county === county) set.add(a.district);
  return [...set];
}

export function areasOf(county: string, district: string): BaselineArea[] {
  return [...TW_BASELINE, ...TW_HIGHLAND_ONLY].filter((a) => a.county === county && a.district === district);
}

// ---- 一日用水量參數 ----

export const PER_CAPITA: Record<Jurisdiction, number> = { taiwan: 250, taipei: 225 };

export const PERSONS_PER_UNIT = {
  suite: 2,
  house: 3,
  townhouse: 6,
} as const;

export interface AreaUse {
  id: string;
  name: string;
  /** 有效面積比範圍 */
  ratio: [number, number];
  /** 人員密度範圍（人/m²） */
  density: [number, number];
  /** 每人每日用水量（L） */
  litres: number;
  densityNote?: string;
}

export const AREA_USES: Record<Jurisdiction, AreaUse[]> = {
  taiwan: [
    { id: "office", name: "辦公室", ratio: [0.6, 0.6], density: [0.2, 0.2], litres: 100 },
    { id: "general-office", name: "一般事務所", ratio: [0.55, 0.57], density: [0.2, 0.2], litres: 100 },
    { id: "factory", name: "工廠", ratio: [0.58, 0.6], density: [0.1, 0.2], litres: 60, densityNote: "座作業 0.2、立作業 0.1" },
    { id: "school", name: "中小學校", ratio: [0.58, 0.6], density: [0.14, 0.2], litres: 40 },
    { id: "shop", name: "店舖", ratio: [0.55, 0.6], density: [0.16, 0.16], litres: 40 },
  ],
  taipei: [
    { id: "office", name: "辦公室", ratio: [0.6, 0.6], density: [0.2, 0.2], litres: 100 },
    { id: "restaurant", name: "餐廳", ratio: [0.55, 0.6], density: [1.0, 1.0], litres: 15 },
    { id: "factory", name: "工廠", ratio: [0.58, 0.6], density: [0.1, 0.2], litres: 60, densityNote: "座作業 0.2、立作業 0.1" },
    { id: "school", name: "中小學校", ratio: [0.58, 0.6], density: [0.14, 0.2], litres: 40 },
    { id: "shop", name: "店舖", ratio: [0.55, 0.6], density: [0.16, 0.16], litres: 100 },
    { id: "parking", name: "停車場", ratio: [0.58, 0.6], density: [0.1, 0.1], litres: 3 },
  ],
};

export const FIXTURE_BUILDINGS = ["辦公處所", "學校", "醫院", "公共宿舍", "工廠", "俱樂部、銀行", "戲院、電影院"] as const;

/** 北水表2-8 衛生器具每日平均自來水使用量（L/日），依建物類別；null 為表列空白。 */
export const FIXTURES: { name: string; litres: (number | null)[] }[] = [
  { name: "大便器（水箱）", litres: [900, 600, 750, 200, 750, 600, 750] },
  { name: "大便器（沖水閥）", litres: [1200, 800, 1000, 240, 1000, 800, 1000] },
  { name: "小便器（水箱）", litres: [400, 240, 480, 150, 420, 320, 480] },
  { name: "小便器（沖水閥）", litres: [400, 240, 480, 150, 420, 320, 480] },
  { name: "洗手盆", litres: [240, 140, 180, 120, null, 160, 300] },
  { name: "洗臉盆", litres: [960, 900, 400, 200, null, 640, 3200] },
  { name: "廚房水槽", litres: [1200, 720, 600, 550, null, 960, null] },
  { name: "拖布盆", litres: [510, 440, 610, 270, null, 440, null] },
  { name: "浴缸", litres: [null, null, null, 760, null, null, null] },
  { name: "淋浴蓮蓬頭", litres: [null, null, null, 200, null, null, null] },
];

/** 竹科說明 p.28 民生用水建議值（L/人·日）。 */
export const PARK_HEADCOUNT = [
  { id: "staff", name: "員工（日用、餐廳、沖廁）", litres: 30, tongluo: true },
  { id: "staff-kitchen", name: "員工（有中央廚房）", litres: 60, tongluo: true },
  { id: "visitor", name: "非常駐人員", litres: 10, tongluo: false },
  { id: "dorm", name: "住宿員工", litres: 250, tongluo: false },
] as const;

/** 銅鑼園區未設生活用水回收設備：需降低用水量 35% 以上。 */
export const TONGLUO_FACTOR = 0.65;

// ---- 安全係數與口徑 ----

export interface SafetyBand {
  max: number;
  factor: number;
  meter: number | null;
  label: string;
}

export const SAFETY_BANDS: Record<Jurisdiction, SafetyBand[]> = {
  taiwan: [
    { max: 13.5, factor: 1.5, meter: 20, label: "V＜13.5" },
    { max: 24.5, factor: 1.4, meter: 25, label: "V＝13.6～24.5" },
    { max: 68.5, factor: 1.2, meter: 40, label: "V＝24.6～68.5" },
    { max: Infinity, factor: 1.1, meter: null, label: "V＞68.6" },
  ],
  taipei: [
    { max: 15.5, factor: 1.5, meter: 20, label: "V＜15.5" },
    { max: 29.0, factor: 1.4, meter: 25, label: "V＝15.6～29.0" },
    { max: 82.0, factor: 1.2, meter: 40, label: "V＝29.1～82.0" },
    { max: Infinity, factor: 1.1, meter: null, label: "V＞82.1" },
  ],
};

export const TW_DI_COEF = 4.59;

export const TP_K_BANDS = [
  { min: 0.4, max: 0.8, coef: 4.21, label: "0.4≦K＜0.8" },
  { min: 0.8, max: 1.2, coef: 3.43, label: "0.8≦K＜1.2" },
  { min: 1.2, max: 2.0, coef: 2.97, label: "1.2≦K≦2.0" },
];

/** 北水一般住宅間接給水進水管口徑（依戶數）。 */
export const TP_HOUSEHOLD_METER = [
  { max: 17, meter: 20, label: "1～17 戶" },
  { max: 32, meter: 25, label: "18～32 戶" },
  { max: 91, meter: 40, label: "33～91 戶" },
];

export const DP_COEF = 6.65;

export const METER_SIZES = [20, 25, 40, 50, 75, 100, 150, 200];
export const RISER_SIZES = [20, 25, 32, 40, 50, 65, 75, 100, 125, 150];

// ---- 游泳池 ----

export const POOL_FACTOR = { outdoor: 0.24, indoor: 0.2 } as const;

// ---- 用水計畫 ----

export const PLAN_THRESHOLD = 300;
export const PLAN_AGENCY_THRESHOLD = 3000;
export const PLAN_DAYS = 3;

export const WRA_BRANCH: Record<string, string> = {
  ...Object.fromEntries(
    ["花蓮縣", "宜蘭縣", "基隆市", "臺北市", "新北市", "桃園市", "新竹縣", "新竹市", "連江縣"].map((c) => [c, "經濟部水利署北區水資源分署"]),
  ),
  ...Object.fromEntries(
    ["苗栗縣", "臺中市", "彰化縣", "雲林縣", "南投縣", "金門縣"].map((c) => [c, "經濟部水利署中區水資源分署"]),
  ),
  ...Object.fromEntries(
    ["嘉義縣", "嘉義市", "臺南市", "高雄市", "屏東縣", "臺東縣", "澎湖縣"].map((c) => [c, "經濟部水利署南區水資源分署"]),
  ),
};
