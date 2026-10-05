// 變壓器規格資料：士林電機「油浸式配電變壓器」「模鑄式變壓器」型錄（2019.05 版）。
// 由型錄 PDF 抽出後逐列核對；pages 為型錄印刷頁碼。修改後執行 `npm run verify:transformers`。

export type Kind = "oil" | "cast";
export type Secondary = "220" | "380Y";
export type SeriesId = "oil-sk" | "oil-he" | "oil-di" | "oil-dh" | "cast-evd3" | "cast-sd";

export interface SeriesInfo {
  id: SeriesId;
  kind: Kind;
  name: string;
  /** 外形尺寸取法（型錄代號） */
  sizeNote: string;
  note?: string;
}

export const CATALOGS: Record<Kind, string> = {
  oil: "士林電機 油浸式配電變壓器型錄（2019.05 版）",
  cast: "士林電機 模鑄式變壓器型錄（2019.05 版）",
};

export const KIND_NAME: Record<Kind, string> = { oil: "油浸式", cast: "模鑄式" };

export const SECONDARY_NAME: Record<Secondary, string> = { "220": "220V", "380Y": "380Y/220V" };

export const SERIES: SeriesInfo[] = [
  { id: "oil-sk", kind: "oil", name: "SK 型（抗諧波）", sizeNote: "寬 X × 深 Y × 高 ZS＋ZH；導口型 XD × Y × Z" },
  { id: "oil-he", kind: "oil", name: "高效率型", sizeNote: "寬 X × 深 Y × 高 ZS＋ZH；導口型 XD × Y × Z" },
  { id: "oil-di", kind: "oil", name: "DI 系列", sizeNote: "寬 X × 深 Y × 高 ZS＋ZH；導口型 XD × Y × Z" },
  { id: "oil-dh", kind: "oil", name: "DH 系列", sizeNote: "寬 X × 深 Y × 高 ZS＋ZH；導口型 XD × Y × Z" },
  {
    id: "cast-evd3",
    kind: "cast",
    name: "高效率型 EVD3",
    sizeNote: "本體（IP00）X × Y × Z；配電箱（IP20）XC × YC × ZC",
    note: "型錄外形尺寸表僅列 380Y/220V，220V 請洽廠商確認",
  },
  {
    id: "cast-sd",
    kind: "cast",
    name: "高壓模鑄 SD",
    sizeNote: "本體（IP00）L × W × H",
    note: "型錄外形尺寸表僅列 380(220)V，220V 請洽廠商確認；配電箱尺寸型錄未列，請洽廠商",
  },
];

export interface TransformerRow {
  series: SeriesId;
  kva: number;
  secondary: Secondary;
  /** 最外尺寸 [寬, 深, 高]（mm） */
  size: [number, number, number];
  /** 油浸式導口型最外尺寸 */
  ductSize?: [number, number, number];
  weight: number;
  ductWeight?: number;
  /** 油量（L） */
  oil?: number;
  /** 模鑄式配電箱（IP20）最外尺寸 */
  box?: [number, number, number];
  boxWeight?: number;
  /** 效率（%） */
  eff?: number;
  /** 阻抗電壓（%），型錄為範圍者以文字表示 */
  imp?: string;
  /** 噪音（dB） */
  noise?: number;
  /** 全損失（W） */
  fullLoss?: number;
  noLoadLoss?: number;
  loadLoss?: number;
  /** 無載電流（%） */
  nlc?: number;
  /** 電壓變動率（%，PF＝1.0） */
  reg?: number;
  /** 型錄頁碼 */
  pages: string;
  weightNote?: string;
}

export const ROWS: TransformerRow[] = [
  { series: "oil-sk", kva: 150, secondary: "220", size: [705, 1380, 1212], ductSize: [1000, 1380, 1485], weight: 1120, ductWeight: 1200, oil: 330, eff: 98.2, imp: "3.0～4.5", fullLoss: 2749, nlc: 1.3, reg: 1.4, pages: "P.3、P.4" },
  { series: "oil-sk", kva: 200, secondary: "220", size: [695, 1255, 1287], ductSize: [900, 1255, 1560], weight: 1120, ductWeight: 1200, oil: 330, eff: 98.3, imp: "3.0～4.5", fullLoss: 3459, nlc: 1.3, reg: 1.4, pages: "P.3、P.4" },
  { series: "oil-sk", kva: 300, secondary: "220", size: [745, 1445, 1342], ductSize: [1000, 1445, 1615], weight: 1470, ductWeight: 1550, oil: 440, eff: 98.5, imp: "3.0～4.5", fullLoss: 4569, nlc: 1.2, reg: 1.3, pages: "P.3、P.4" },
  { series: "oil-sk", kva: 400, secondary: "220", size: [780, 1505, 1362], ductSize: [1000, 1505, 1635], weight: 1720, ductWeight: 1800, oil: 500, eff: 98.6, imp: "3.0～4.5", fullLoss: 5680, nlc: 1.2, reg: 1.2, pages: "P.3、P.4" },
  { series: "oil-sk", kva: 500, secondary: "220", size: [855, 1695, 1362], ductSize: [1100, 1695, 1635], weight: 1950, ductWeight: 2030, oil: 540, eff: 98.65, imp: "3.0～4.5", fullLoss: 6842, nlc: 1.2, reg: 1.2, pages: "P.3、P.4" },
  { series: "oil-sk", kva: 600, secondary: "220", size: [890, 1680, 1573], ductSize: [1100, 1680, 1875], weight: 2350, ductWeight: 2450, oil: 650, eff: 98.7, imp: "3.0～4.5", fullLoss: 7903, nlc: 1.2, reg: 1.2, pages: "P.3、P.4" },
  { series: "oil-sk", kva: 750, secondary: "220", size: [980, 1770, 1573], ductSize: [1200, 1770, 1875], weight: 2600, ductWeight: 2700, oil: 780, eff: 98.7, imp: "4.5～6.0", fullLoss: 9878, nlc: 1.2, reg: 1.2, pages: "P.3、P.4" },
  { series: "oil-sk", kva: 1000, secondary: "220", size: [1090, 2020, 1623], ductSize: [1300, 2020, 1925], weight: 3330, ductWeight: 3450, oil: 930, eff: 98.8, imp: "4.5～6.0", fullLoss: 12145, nlc: 1.2, reg: 1.2, pages: "P.3、P.4" },
  { series: "oil-sk", kva: 1250, secondary: "220", size: [1220, 2070, 1623], ductSize: [1500, 2070, 1925], weight: 3680, ductWeight: 3800, oil: 1000, eff: 98.8, imp: "4.5～6.0", fullLoss: 15182, nlc: 1.2, reg: 1.2, pages: "P.3、P.4" },
  { series: "oil-sk", kva: 1500, secondary: "220", size: [1250, 2160, 1773], ductSize: [1500, 2160, 2075], weight: 4130, ductWeight: 4250, oil: 1150, eff: 98.85, imp: "5.0～7.0", fullLoss: 17450, nlc: 1.2, reg: 1.2, pages: "P.3、P.4" },
  { series: "oil-sk", kva: 2000, secondary: "220", size: [1390, 2270, 1723], ductSize: [1600, 2270, 2025], weight: 4880, ductWeight: 5000, oil: 1250, eff: 98.9, imp: "5.0～7.0", fullLoss: 22245, nlc: 1.2, reg: 1.2, pages: "P.3、P.4" },
  { series: "oil-sk", kva: 150, secondary: "380Y", size: [705, 1380, 1212], ductSize: [1000, 1380, 1485], weight: 1120, ductWeight: 1200, oil: 330, eff: 98.2, imp: "3.0～4.5", fullLoss: 2749, nlc: 1.3, reg: 1.4, pages: "P.3、P.5" },
  { series: "oil-sk", kva: 200, secondary: "380Y", size: [695, 1255, 1287], ductSize: [900, 1255, 1560], weight: 1120, ductWeight: 1200, oil: 330, eff: 98.3, imp: "3.0～4.5", fullLoss: 3459, nlc: 1.3, reg: 1.4, pages: "P.3、P.5" },
  { series: "oil-sk", kva: 300, secondary: "380Y", size: [745, 1445, 1342], ductSize: [1000, 1445, 1615], weight: 1470, ductWeight: 1550, oil: 440, eff: 98.5, imp: "3.0～4.5", fullLoss: 4569, nlc: 1.2, reg: 1.3, pages: "P.3、P.5" },
  { series: "oil-sk", kva: 400, secondary: "380Y", size: [780, 1505, 1362], ductSize: [1000, 1505, 1635], weight: 1720, ductWeight: 1800, oil: 500, eff: 98.6, imp: "3.0～4.5", fullLoss: 5680, nlc: 1.2, reg: 1.2, pages: "P.3、P.5" },
  { series: "oil-sk", kva: 500, secondary: "380Y", size: [855, 1695, 1362], ductSize: [1100, 1695, 1635], weight: 1950, ductWeight: 2030, oil: 540, eff: 98.65, imp: "3.0～4.5", fullLoss: 6842, nlc: 1.2, reg: 1.2, pages: "P.3、P.5" },
  { series: "oil-sk", kva: 600, secondary: "380Y", size: [890, 1680, 1573], ductSize: [1100, 1680, 1875], weight: 2350, ductWeight: 2450, oil: 650, eff: 98.7, imp: "3.0～4.5", fullLoss: 7903, nlc: 1.2, reg: 1.2, pages: "P.3、P.5" },
  { series: "oil-sk", kva: 750, secondary: "380Y", size: [980, 1770, 1573], ductSize: [1200, 1770, 1875], weight: 2600, ductWeight: 2700, oil: 780, eff: 98.7, imp: "4.5～6.0", fullLoss: 9878, nlc: 1.2, reg: 1.2, pages: "P.3、P.5" },
  { series: "oil-sk", kva: 1000, secondary: "380Y", size: [1090, 2020, 1623], ductSize: [1300, 2020, 1925], weight: 3330, ductWeight: 3450, oil: 930, eff: 98.8, imp: "4.5～6.0", fullLoss: 12145, nlc: 1.2, reg: 1.2, pages: "P.3、P.5" },
  { series: "oil-sk", kva: 1250, secondary: "380Y", size: [1220, 2070, 1623], ductSize: [1500, 2070, 1925], weight: 3680, ductWeight: 3800, oil: 1000, eff: 98.8, imp: "4.5～6.0", fullLoss: 15182, nlc: 1.2, reg: 1.2, pages: "P.3、P.5" },
  { series: "oil-sk", kva: 1500, secondary: "380Y", size: [1250, 2160, 1773], ductSize: [1500, 2160, 2075], weight: 4130, ductWeight: 4250, oil: 1150, eff: 98.85, imp: "5.0～7.0", fullLoss: 17450, nlc: 1.2, reg: 1.2, pages: "P.3、P.5" },
  { series: "oil-sk", kva: 2000, secondary: "380Y", size: [1390, 2270, 1723], ductSize: [1600, 2270, 2025], weight: 4880, ductWeight: 5000, oil: 1250, eff: 98.9, imp: "5.0～7.0", fullLoss: 22245, nlc: 1.2, reg: 1.2, pages: "P.3、P.5" },
  { series: "oil-he", kva: 150, secondary: "220", size: [675, 1260, 1292], ductSize: [900, 1260, 1565], weight: 1100, ductWeight: 1180, oil: 320, eff: 98.77, imp: "2.8～4.0", fullLoss: 1868, noLoadLoss: 410, loadLoss: 1458, nlc: 2, reg: 1.15, pages: "P.6、P.7" },
  { series: "oil-he", kva: 200, secondary: "220", size: [725, 1320, 1292], ductSize: [1000, 1320, 1565], weight: 1270, ductWeight: 1350, oil: 370, eff: 98.9, imp: "2.8～4.0", fullLoss: 2224, noLoadLoss: 480, loadLoss: 1744, nlc: 2, reg: 1.1, pages: "P.6、P.7" },
  { series: "oil-he", kva: 300, secondary: "220", size: [735, 1390, 1312], ductSize: [1000, 1390, 1585], weight: 1470, ductWeight: 1550, oil: 410, eff: 98.96, imp: "2.8～4.0", fullLoss: 3153, noLoadLoss: 690, loadLoss: 2463, nlc: 1.6, reg: 1, pages: "P.6、P.7" },
  { series: "oil-he", kva: 400, secondary: "220", size: [775, 1505, 1362], ductSize: [1000, 1505, 1635], weight: 1720, ductWeight: 1800, oil: 500, eff: 99, imp: "3.0～4.5", fullLoss: 4040, noLoadLoss: 830, loadLoss: 3210, nlc: 1.6, reg: 1, pages: "P.6、P.7" },
  { series: "oil-he", kva: 500, secondary: "220", size: [805, 1565, 1362], ductSize: [1100, 1565, 1635], weight: 1950, ductWeight: 2050, oil: 540, eff: 99.01, imp: "3.0～4.5", fullLoss: 4999, noLoadLoss: 940, loadLoss: 4059, nlc: 1.6, reg: 1, pages: "P.6、P.7" },
  { series: "oil-he", kva: 600, secondary: "220", size: [780, 1700, 1573], ductSize: [1000, 1700, 1875], weight: 2320, ductWeight: 2400, oil: 640, eff: 99.03, imp: "3.5～5.0", fullLoss: 5877, noLoadLoss: 1130, loadLoss: 4747, nlc: 1.3, reg: 1, pages: "P.6、P.7" },
  { series: "oil-he", kva: 750, secondary: "220", size: [900, 1680, 1573], ductSize: [1100, 1680, 1875], weight: 2480, ductWeight: 2580, oil: 680, eff: 99.02, imp: "4.0～5.5", fullLoss: 7423, noLoadLoss: 1320, loadLoss: 6103, nlc: 1.3, reg: 1.1, pages: "P.6、P.7" },
  { series: "oil-he", kva: 1000, secondary: "220", size: [1140, 1830, 1623], ductSize: [1400, 1830, 1925], weight: 3030, ductWeight: 3150, oil: 870, eff: 99.01, imp: "4.0～5.5", fullLoss: 9999, noLoadLoss: 1590, loadLoss: 8409, nlc: 1.3, reg: 1.1, pages: "P.6、P.7" },
  { series: "oil-he", kva: 1250, secondary: "220", size: [1140, 1990, 1673], ductSize: [1400, 1990, 1975], weight: 3430, ductWeight: 3550, oil: 920, eff: 99.01, imp: "4.0～5.5", fullLoss: 12499, noLoadLoss: 1840, loadLoss: 10659, nlc: 1.1, reg: 1.1, pages: "P.6、P.7" },
  { series: "oil-he", kva: 1500, secondary: "220", size: [1160, 2050, 1773], ductSize: [1400, 2050, 2075], weight: 3930, ductWeight: 4050, oil: 1100, eff: 99.01, imp: "5.0～7.0", fullLoss: 14998, noLoadLoss: 2100, loadLoss: 12898, nlc: 1.1, reg: 1.15, pages: "P.6、P.7" },
  { series: "oil-he", kva: 2000, secondary: "220", size: [1280, 2160, 1773], ductSize: [1500, 2160, 2075], weight: 4680, ductWeight: 4800, oil: 1200, eff: 99.16, imp: "5.0～7.0", fullLoss: 16942, noLoadLoss: 2570, loadLoss: 14372, nlc: 1.1, reg: 1, pages: "P.6、P.7" },
  { series: "oil-he", kva: 150, secondary: "380Y", size: [675, 1260, 1292], ductSize: [900, 1260, 1565], weight: 1100, ductWeight: 1180, oil: 320, eff: 98.77, imp: "2.8～4.0", fullLoss: 1868, noLoadLoss: 410, loadLoss: 1458, nlc: 2, reg: 1.15, pages: "P.6、P.8" },
  { series: "oil-he", kva: 200, secondary: "380Y", size: [725, 1320, 1292], ductSize: [1000, 1320, 1565], weight: 1270, ductWeight: 1350, oil: 370, eff: 98.9, imp: "2.8～4.0", fullLoss: 2224, noLoadLoss: 480, loadLoss: 1744, nlc: 2, reg: 1.1, pages: "P.6、P.8" },
  { series: "oil-he", kva: 300, secondary: "380Y", size: [735, 1390, 1312], ductSize: [1000, 1390, 1585], weight: 1470, ductWeight: 1550, oil: 410, eff: 98.96, imp: "2.8～4.0", fullLoss: 3153, noLoadLoss: 690, loadLoss: 2463, nlc: 1.6, reg: 1, pages: "P.6、P.8" },
  { series: "oil-he", kva: 400, secondary: "380Y", size: [775, 1505, 1362], ductSize: [1000, 1505, 1635], weight: 1720, ductWeight: 1800, oil: 500, eff: 99, imp: "3.0～4.5", fullLoss: 4040, noLoadLoss: 830, loadLoss: 3210, nlc: 1.6, reg: 1, pages: "P.6、P.8" },
  { series: "oil-he", kva: 500, secondary: "380Y", size: [805, 1565, 1362], ductSize: [1100, 1565, 1635], weight: 1950, ductWeight: 2050, oil: 540, eff: 99.01, imp: "3.0～4.5", fullLoss: 4999, noLoadLoss: 940, loadLoss: 4059, nlc: 1.6, reg: 1, pages: "P.6、P.8" },
  { series: "oil-he", kva: 600, secondary: "380Y", size: [780, 1700, 1573], ductSize: [1000, 1700, 1875], weight: 2320, ductWeight: 2400, oil: 640, eff: 99.03, imp: "3.5～5.0", fullLoss: 5877, noLoadLoss: 1130, loadLoss: 4747, nlc: 1.3, reg: 1, pages: "P.6、P.8" },
  { series: "oil-he", kva: 750, secondary: "380Y", size: [900, 1680, 1573], ductSize: [1100, 1680, 1875], weight: 2480, ductWeight: 2580, oil: 680, eff: 99.02, imp: "4.0～5.5", fullLoss: 7423, noLoadLoss: 1320, loadLoss: 6103, nlc: 1.3, reg: 1.1, pages: "P.6、P.8" },
  { series: "oil-he", kva: 1000, secondary: "380Y", size: [1140, 1830, 1623], ductSize: [1400, 1830, 1925], weight: 3030, ductWeight: 3150, oil: 870, eff: 99.01, imp: "4.0～5.5", fullLoss: 9999, noLoadLoss: 1590, loadLoss: 8409, nlc: 1.3, reg: 1.1, pages: "P.6、P.8" },
  { series: "oil-he", kva: 1250, secondary: "380Y", size: [1140, 1990, 1673], ductSize: [1400, 1990, 1975], weight: 3430, ductWeight: 3550, oil: 920, eff: 99.01, imp: "4.0～5.5", fullLoss: 12499, noLoadLoss: 1840, loadLoss: 10659, nlc: 1.1, reg: 1.1, pages: "P.6、P.8" },
  { series: "oil-he", kva: 1500, secondary: "380Y", size: [1160, 2050, 1773], ductSize: [1400, 2050, 2075], weight: 3930, ductWeight: 4050, oil: 1100, eff: 99.01, imp: "5.0～7.0", fullLoss: 14998, noLoadLoss: 2100, loadLoss: 12898, nlc: 1.1, reg: 1.15, pages: "P.6、P.8" },
  { series: "oil-he", kva: 2000, secondary: "380Y", size: [1280, 2160, 1773], ductSize: [1500, 2160, 2075], weight: 4680, ductWeight: 4800, oil: 1200, eff: 99.16, imp: "5.0～7.0", fullLoss: 16942, noLoadLoss: 2570, loadLoss: 14372, nlc: 1.1, reg: 1, pages: "P.6、P.8" },
  { series: "oil-he", kva: 2500, secondary: "380Y", size: [2030, 1990, 1873], ductSize: [2300, 1990, 2175], weight: 3930, ductWeight: 5600, oil: 1350, eff: 99.16, imp: "5.5～7.5", fullLoss: 21178, noLoadLoss: 3000, loadLoss: 18178, nlc: 1.1, reg: 1, pages: "P.6、P.8", weightNote: "型錄重量與 1500、2000 kVA 相同，疑為誤植，請洽廠商確認" },
  { series: "oil-he", kva: 3000, secondary: "380Y", size: [2140, 2050, 1978], ductSize: [2400, 2050, 2280], weight: 4680, ductWeight: 6400, oil: 1500, eff: 99.16, imp: "6.0～8.0", fullLoss: 25413, noLoadLoss: 3500, loadLoss: 21913, nlc: 1.1, reg: 1, pages: "P.6、P.8", weightNote: "型錄重量與 1500、2000 kVA 相同，疑為誤植，請洽廠商確認" },
  { series: "oil-di", kva: 150, secondary: "220", size: [670, 1275, 1207], ductSize: [900, 1275, 1480], weight: 840, ductWeight: 920, oil: 300, eff: 98, imp: "3.5～4.5", fullLoss: 3061, nlc: 5, reg: 1.7, pages: "P.10、P.14" },
  { series: "oil-di", kva: 200, secondary: "220", size: [670, 1310, 1257], ductSize: [900, 1310, 1530], weight: 950, ductWeight: 1030, oil: 320, eff: 98.1, imp: "3.5～4.5", fullLoss: 3873, nlc: 5, reg: 1.7, pages: "P.10、P.14" },
  { series: "oil-di", kva: 300, secondary: "220", size: [760, 1340, 1292], ductSize: [1000, 1340, 1565], weight: 1120, ductWeight: 1200, oil: 340, eff: 98.2, imp: "3.5～4.5", fullLoss: 5498, nlc: 4.5, reg: 1.6, pages: "P.10、P.14" },
  { series: "oil-di", kva: 400, secondary: "220", size: [865, 1425, 1312], ductSize: [1100, 1425, 1585], weight: 1400, ductWeight: 1500, oil: 420, eff: 98.25, imp: "3.5～4.5", fullLoss: 7124, nlc: 4.5, reg: 1.5, pages: "P.10、P.14" },
  { series: "oil-di", kva: 500, secondary: "220", size: [895, 1595, 1312], ductSize: [1100, 1595, 1585], weight: 1600, ductWeight: 1700, oil: 460, eff: 98.35, imp: "3.5～4.5", fullLoss: 8388, nlc: 4.5, reg: 1.5, pages: "P.10、P.14" },
  { series: "oil-di", kva: 600, secondary: "220", size: [970, 1680, 1473], ductSize: [1200, 1680, 1775], weight: 2050, ductWeight: 2150, oil: 600, eff: 98.4, imp: "3.5～4.5", fullLoss: 9756, nlc: 4.5, reg: 1.5, pages: "P.10、P.14" },
  { series: "oil-di", kva: 750, secondary: "220", size: [970, 1700, 1573], ductSize: [1200, 1700, 1875], weight: 2200, ductWeight: 2300, oil: 650, eff: 98.45, imp: "4.5～5.5", fullLoss: 11808, nlc: 4, reg: 1.4, pages: "P.10、P.14" },
  { series: "oil-di", kva: 1000, secondary: "220", size: [1100, 1910, 1593], ductSize: [1300, 1910, 1895], weight: 2680, ductWeight: 2800, oil: 780, eff: 98.5, imp: "4.5～5.5", fullLoss: 15228, nlc: 3.5, reg: 1.4, pages: "P.10、P.14" },
  { series: "oil-di", kva: 1250, secondary: "220", size: [1230, 1960, 1593], ductSize: [1500, 1960, 1895], weight: 3180, ductWeight: 3300, oil: 900, eff: 98.55, imp: "4.0～5.0", fullLoss: 18391, nlc: 3.5, reg: 1.4, pages: "P.10、P.14" },
  { series: "oil-di", kva: 1500, secondary: "220", size: [1290, 2110, 1623], ductSize: [1500, 2110, 1925], weight: 3480, ductWeight: 3600, oil: 1030, eff: 98.6, imp: "5.5～6.5", fullLoss: 21298, nlc: 3, reg: 1.3, pages: "P.10、P.14" },
  { series: "oil-di", kva: 2000, secondary: "220", size: [1480, 2260, 1673], ductSize: [1700, 2260, 1975], weight: 4450, ductWeight: 4600, oil: 1150, eff: 98.7, imp: "5.5～6.5", fullLoss: 26342, nlc: 2.5, reg: 1.3, pages: "P.10、P.14" },
  { series: "oil-di", kva: 150, secondary: "380Y", size: [670, 1275, 1207], ductSize: [900, 1275, 1480], weight: 840, ductWeight: 920, oil: 300, eff: 98, imp: "3.5～4.5", fullLoss: 3061, nlc: 5, reg: 1.7, pages: "P.10、P.15" },
  { series: "oil-di", kva: 200, secondary: "380Y", size: [670, 1310, 1257], ductSize: [900, 1310, 1530], weight: 950, ductWeight: 1030, oil: 320, eff: 98.1, imp: "3.5～4.5", fullLoss: 3873, nlc: 5, reg: 1.7, pages: "P.10、P.15" },
  { series: "oil-di", kva: 300, secondary: "380Y", size: [760, 1340, 1292], ductSize: [1000, 1340, 1565], weight: 1120, ductWeight: 1200, oil: 340, eff: 98.2, imp: "3.5～4.5", fullLoss: 5498, nlc: 4.5, reg: 1.6, pages: "P.10、P.15" },
  { series: "oil-di", kva: 400, secondary: "380Y", size: [865, 1425, 1312], ductSize: [1100, 1425, 1585], weight: 1400, ductWeight: 1500, oil: 420, eff: 98.25, imp: "3.5～4.5", fullLoss: 7124, nlc: 4.5, reg: 1.5, pages: "P.10、P.15" },
  { series: "oil-di", kva: 500, secondary: "380Y", size: [895, 1595, 1312], ductSize: [1100, 1595, 1585], weight: 1600, ductWeight: 1700, oil: 460, eff: 98.35, imp: "3.5～4.5", fullLoss: 8388, nlc: 4.5, reg: 1.5, pages: "P.10、P.15" },
  { series: "oil-di", kva: 600, secondary: "380Y", size: [970, 1680, 1473], ductSize: [1200, 1680, 1775], weight: 2050, ductWeight: 2150, oil: 600, eff: 98.4, imp: "3.5～4.5", fullLoss: 9756, nlc: 4.5, reg: 1.5, pages: "P.10、P.15" },
  { series: "oil-di", kva: 750, secondary: "380Y", size: [970, 1700, 1573], ductSize: [1200, 1700, 1875], weight: 2200, ductWeight: 2300, oil: 650, eff: 98.45, imp: "4.5～5.5", fullLoss: 11808, nlc: 4, reg: 1.4, pages: "P.10、P.15" },
  { series: "oil-di", kva: 1000, secondary: "380Y", size: [1100, 1910, 1593], ductSize: [1300, 1910, 1895], weight: 2680, ductWeight: 2800, oil: 780, eff: 98.5, imp: "4.5～5.5", fullLoss: 15228, nlc: 3.5, reg: 1.4, pages: "P.10、P.15" },
  { series: "oil-di", kva: 1250, secondary: "380Y", size: [1230, 1960, 1593], ductSize: [1500, 1960, 1895], weight: 3180, ductWeight: 3300, oil: 900, eff: 98.55, imp: "4.0～5.0", fullLoss: 18391, nlc: 3.5, reg: 1.4, pages: "P.10、P.15" },
  { series: "oil-di", kva: 1500, secondary: "380Y", size: [1290, 2110, 1623], ductSize: [1500, 2110, 1925], weight: 3480, ductWeight: 3600, oil: 1030, eff: 98.6, imp: "5.5～6.5", fullLoss: 21298, nlc: 3, reg: 1.3, pages: "P.10、P.15" },
  { series: "oil-di", kva: 2000, secondary: "380Y", size: [1480, 2260, 1673], ductSize: [1700, 2260, 1975], weight: 4450, ductWeight: 4600, oil: 1150, eff: 98.7, imp: "5.5～6.5", fullLoss: 26342, nlc: 2.5, reg: 1.3, pages: "P.10、P.15" },
  { series: "oil-di", kva: 2500, secondary: "380Y", size: [2430, 1990, 1873], ductSize: [2700, 1990, 2175], weight: 5250, ductWeight: 5500, oil: 1350, eff: 98.75, imp: "5.5～6.5", fullLoss: 31645, nlc: 2.5, reg: 1.2, pages: "P.10、P.15" },
  { series: "oil-di", kva: 3000, secondary: "380Y", size: [2710, 2060, 1928], ductSize: [3000, 2060, 2230], weight: 6050, ductWeight: 6300, oil: 1500, eff: 98.8, imp: "6.0～8.0", fullLoss: 36437, nlc: 2.5, reg: 1.2, pages: "P.10、P.15" },
  { series: "oil-dh", kva: 500, secondary: "220", size: [865, 1515, 1392], ductSize: [1100, 1515, 1665], weight: 1680, ductWeight: 1780, oil: 520, eff: 98.35, imp: "3.5～4.5", fullLoss: 8388, nlc: 4.5, reg: 1.5, pages: "P.10、P.16" },
  { series: "oil-dh", kva: 600, secondary: "220", size: [930, 1730, 1623], ductSize: [1200, 1730, 1925], weight: 2200, ductWeight: 2300, oil: 700, eff: 98.4, imp: "3.5～4.5", fullLoss: 9756, nlc: 4.5, reg: 1.5, pages: "P.10、P.16" },
  { series: "oil-dh", kva: 750, secondary: "220", size: [990, 1790, 1623], ductSize: [1200, 1790, 1925], weight: 2300, ductWeight: 2400, oil: 730, eff: 98.45, imp: "4.5～5.5", fullLoss: 11808, nlc: 4, reg: 1.4, pages: "P.10、P.16" },
  { series: "oil-dh", kva: 1000, secondary: "220", size: [1010, 1960, 1673], ductSize: [1300, 1960, 1975], weight: 2760, ductWeight: 2880, oil: 900, eff: 98.5, imp: "4.5～5.5", fullLoss: 15228, nlc: 3.5, reg: 1.4, pages: "P.10、P.16" },
  { series: "oil-dh", kva: 1250, secondary: "220", size: [1140, 1930, 1723], ductSize: [1400, 1930, 2025], weight: 3200, ductWeight: 3320, oil: 1000, eff: 98.55, imp: "4.0～5.0", fullLoss: 18391, nlc: 3.5, reg: 1.4, pages: "P.10、P.16" },
  { series: "oil-dh", kva: 1500, secondary: "220", size: [1220, 2120, 1723], ductSize: [1500, 2120, 2025], weight: 3450, ductWeight: 3570, oil: 1080, eff: 98.6, imp: "5.5～6.5", fullLoss: 21298, nlc: 3, reg: 1.3, pages: "P.10、P.16" },
  { series: "oil-dh", kva: 2000, secondary: "220", size: [1460, 2320, 1823], ductSize: [1700, 2320, 2125], weight: 4300, ductWeight: 4450, oil: 1250, eff: 98.7, imp: "5.5～6.5", fullLoss: 26342, nlc: 2.5, reg: 1.3, pages: "P.10、P.16" },
  { series: "oil-dh", kva: 500, secondary: "380Y", size: [865, 1515, 1392], ductSize: [1100, 1515, 1665], weight: 1680, ductWeight: 1780, oil: 520, eff: 98.35, imp: "3.5～4.5", fullLoss: 8388, nlc: 4.5, reg: 1.5, pages: "P.10、P.17" },
  { series: "oil-dh", kva: 600, secondary: "380Y", size: [930, 1730, 1623], ductSize: [1200, 1730, 1925], weight: 2200, ductWeight: 2300, oil: 700, eff: 98.4, imp: "3.5～4.5", fullLoss: 9756, nlc: 4.5, reg: 1.5, pages: "P.10、P.17" },
  { series: "oil-dh", kva: 750, secondary: "380Y", size: [990, 1790, 1623], ductSize: [1200, 1790, 1925], weight: 2300, ductWeight: 2400, oil: 730, eff: 98.45, imp: "4.5～5.5", fullLoss: 11808, nlc: 4, reg: 1.4, pages: "P.10、P.17" },
  { series: "oil-dh", kva: 1000, secondary: "380Y", size: [1010, 1960, 1673], ductSize: [1300, 1960, 1975], weight: 2760, ductWeight: 2880, oil: 900, eff: 98.5, imp: "4.5～5.5", fullLoss: 15228, nlc: 3.5, reg: 1.4, pages: "P.10、P.17" },
  { series: "oil-dh", kva: 1250, secondary: "380Y", size: [1140, 1930, 1723], ductSize: [1400, 1930, 2025], weight: 3200, ductWeight: 3320, oil: 1000, eff: 98.55, imp: "4.0～5.0", fullLoss: 18391, nlc: 3.5, reg: 1.4, pages: "P.10、P.17" },
  { series: "oil-dh", kva: 1500, secondary: "380Y", size: [1220, 2120, 1723], ductSize: [1500, 2120, 2025], weight: 3450, ductWeight: 3570, oil: 1080, eff: 98.6, imp: "5.5～6.5", fullLoss: 21298, nlc: 3, reg: 1.3, pages: "P.10、P.17" },
  { series: "oil-dh", kva: 2000, secondary: "380Y", size: [1460, 2320, 1823], ductSize: [1700, 2320, 2125], weight: 4300, ductWeight: 4450, oil: 1250, eff: 98.7, imp: "5.5～6.5", fullLoss: 26342, nlc: 2.5, reg: 1.3, pages: "P.10、P.17" },
  { series: "oil-dh", kva: 2500, secondary: "380Y", size: [2320, 2100, 1923], ductSize: [2600, 2100, 2225], weight: 5550, ductWeight: 5800, oil: 1530, eff: 98.75, imp: "5.5～6.5", fullLoss: 31645, nlc: 2.5, reg: 1.2, pages: "P.10、P.17" },
  { series: "oil-dh", kva: 3000, secondary: "380Y", size: [2680, 2100, 1928], ductSize: [2900, 2100, 2230], weight: 5950, ductWeight: 6200, oil: 1600, eff: 98.8, imp: "6.0～8.0", fullLoss: 36437, nlc: 2.5, reg: 1.2, pages: "P.10、P.17" },
  { series: "cast-evd3", kva: 750, secondary: "220", size: [1500, 1060, 1780], weight: 2200, box: [2000, 1500, 2200], boxWeight: 2800, imp: "6.0", noise: 55, nlc: 1.5, pages: "P.3、P.4" },
  { series: "cast-evd3", kva: 1000, secondary: "220", size: [1600, 1060, 1900], weight: 2700, box: [2200, 1600, 2350], boxWeight: 3350, imp: "6.0", noise: 56, nlc: 1.5, pages: "P.3、P.4" },
  { series: "cast-evd3", kva: 1250, secondary: "220", size: [1700, 1160, 1820], weight: 3200, box: [2200, 1600, 2350], boxWeight: 3850, imp: "6.0", noise: 56, nlc: 1.5, pages: "P.3、P.4" },
  { series: "cast-evd3", kva: 1500, secondary: "220", size: [1750, 1160, 1880], weight: 3600, box: [2400, 1600, 2350], boxWeight: 4300, imp: "6.0", noise: 57, nlc: 1, pages: "P.3、P.4" },
  { series: "cast-evd3", kva: 2000, secondary: "220", size: [1850, 1160, 2060], weight: 4650, box: [2400, 1700, 2600], boxWeight: 5400, imp: "6.0", noise: 57, nlc: 1, pages: "P.3、P.4" },
  { series: "cast-evd3", kva: 2500, secondary: "220", size: [1950, 1260, 2180], weight: 5600, box: [2600, 1700, 2700], boxWeight: 6350, imp: "6.0", noise: 57, nlc: 1, pages: "P.3、P.4" },
  { series: "cast-evd3", kva: 750, secondary: "380Y", size: [1500, 1060, 1780], weight: 2200, box: [2000, 1500, 2200], boxWeight: 2800, imp: "6.0", noise: 55, nlc: 1.5, pages: "P.3、P.4" },
  { series: "cast-evd3", kva: 1000, secondary: "380Y", size: [1600, 1060, 1900], weight: 2700, box: [2200, 1600, 2350], boxWeight: 3350, imp: "6.0", noise: 56, nlc: 1.5, pages: "P.3、P.4" },
  { series: "cast-evd3", kva: 1250, secondary: "380Y", size: [1700, 1160, 1820], weight: 3200, box: [2200, 1600, 2350], boxWeight: 3850, imp: "6.0", noise: 56, nlc: 1.5, pages: "P.3、P.4" },
  { series: "cast-evd3", kva: 1500, secondary: "380Y", size: [1750, 1160, 1880], weight: 3600, box: [2400, 1600, 2350], boxWeight: 4300, imp: "6.0", noise: 57, nlc: 1, pages: "P.3、P.4" },
  { series: "cast-evd3", kva: 2000, secondary: "380Y", size: [1850, 1160, 2060], weight: 4650, box: [2400, 1700, 2600], boxWeight: 5400, imp: "6.0", noise: 57, nlc: 1, pages: "P.3、P.4" },
  { series: "cast-evd3", kva: 2500, secondary: "380Y", size: [1950, 1260, 2180], weight: 5600, box: [2600, 1700, 2700], boxWeight: 6350, imp: "6.0", noise: 57, nlc: 1, pages: "P.3、P.4" },
  { series: "cast-sd", kva: 100, secondary: "220", size: [1300, 860, 1310], weight: 1050, imp: "4", noise: 56, pages: "P.5" },
  { series: "cast-sd", kva: 150, secondary: "220", size: [1300, 860, 1310], weight: 1100, imp: "4", noise: 58, pages: "P.5" },
  { series: "cast-sd", kva: 200, secondary: "220", size: [1300, 860, 1330], weight: 1200, imp: "4", noise: 60, pages: "P.5" },
  { series: "cast-sd", kva: 250, secondary: "220", size: [1350, 860, 1470], weight: 1350, imp: "4", noise: 60, pages: "P.5" },
  { series: "cast-sd", kva: 300, secondary: "220", size: [1300, 860, 1475], weight: 1300, imp: "6", noise: 62, pages: "P.5" },
  { series: "cast-sd", kva: 400, secondary: "220", size: [1350, 860, 1470], weight: 1450, imp: "6", noise: 62, pages: "P.5" },
  { series: "cast-sd", kva: 500, secondary: "220", size: [1450, 960, 1515], weight: 1650, imp: "6", noise: 62, pages: "P.5" },
  { series: "cast-sd", kva: 600, secondary: "220", size: [1450, 960, 1615], weight: 1950, imp: "6", noise: 64, pages: "P.5" },
  { series: "cast-sd", kva: 750, secondary: "220", size: [1500, 1060, 1740], weight: 2050, imp: "6", noise: 64, pages: "P.5" },
  { series: "cast-sd", kva: 1000, secondary: "220", size: [1550, 1060, 1900], weight: 2400, imp: "6", noise: 64, pages: "P.5" },
  { series: "cast-sd", kva: 1250, secondary: "220", size: [1600, 1060, 2040], weight: 2950, imp: "6", noise: 65, pages: "P.5" },
  { series: "cast-sd", kva: 1500, secondary: "220", size: [1700, 1060, 2040], weight: 3250, imp: "6", noise: 65, pages: "P.5" },
  { series: "cast-sd", kva: 2000, secondary: "220", size: [1800, 1160, 2145], weight: 4050, imp: "6", noise: 66, pages: "P.5" },
  { series: "cast-sd", kva: 2500, secondary: "220", size: [1850, 1260, 2325], weight: 4900, imp: "6", noise: 68, pages: "P.5" },
  { series: "cast-sd", kva: 3000, secondary: "220", size: [2050, 1260, 2345], weight: 6050, imp: "6", noise: 68, pages: "P.5" },
  { series: "cast-sd", kva: 100, secondary: "380Y", size: [1300, 860, 1310], weight: 1050, imp: "4", noise: 56, pages: "P.5" },
  { series: "cast-sd", kva: 150, secondary: "380Y", size: [1300, 860, 1310], weight: 1100, imp: "4", noise: 58, pages: "P.5" },
  { series: "cast-sd", kva: 200, secondary: "380Y", size: [1300, 860, 1330], weight: 1200, imp: "4", noise: 60, pages: "P.5" },
  { series: "cast-sd", kva: 250, secondary: "380Y", size: [1350, 860, 1470], weight: 1350, imp: "4", noise: 60, pages: "P.5" },
  { series: "cast-sd", kva: 300, secondary: "380Y", size: [1300, 860, 1475], weight: 1300, imp: "6", noise: 62, pages: "P.5" },
  { series: "cast-sd", kva: 400, secondary: "380Y", size: [1350, 860, 1470], weight: 1450, imp: "6", noise: 62, pages: "P.5" },
  { series: "cast-sd", kva: 500, secondary: "380Y", size: [1450, 960, 1515], weight: 1650, imp: "6", noise: 62, pages: "P.5" },
  { series: "cast-sd", kva: 600, secondary: "380Y", size: [1450, 960, 1615], weight: 1950, imp: "6", noise: 64, pages: "P.5" },
  { series: "cast-sd", kva: 750, secondary: "380Y", size: [1500, 1060, 1740], weight: 2050, imp: "6", noise: 64, pages: "P.5" },
  { series: "cast-sd", kva: 1000, secondary: "380Y", size: [1550, 1060, 1900], weight: 2400, imp: "6", noise: 64, pages: "P.5" },
  { series: "cast-sd", kva: 1250, secondary: "380Y", size: [1600, 1060, 2040], weight: 2950, imp: "6", noise: 65, pages: "P.5" },
  { series: "cast-sd", kva: 1500, secondary: "380Y", size: [1700, 1060, 2040], weight: 3250, imp: "6", noise: 65, pages: "P.5" },
  { series: "cast-sd", kva: 2000, secondary: "380Y", size: [1800, 1160, 2145], weight: 4050, imp: "6", noise: 66, pages: "P.5" },
  { series: "cast-sd", kva: 2500, secondary: "380Y", size: [1850, 1260, 2325], weight: 4900, imp: "6", noise: 68, pages: "P.5" },
  { series: "cast-sd", kva: 3000, secondary: "380Y", size: [2050, 1260, 2345], weight: 6050, imp: "6", noise: 68, pages: "P.5" },
];

export const CAPACITIES = [...new Set(ROWS.map((r) => r.kva))].sort((a, b) => a - b);
