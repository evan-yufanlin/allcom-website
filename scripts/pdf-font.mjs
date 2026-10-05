// PDF 用思源黑體子集化與缺字檢查。
//   產生子集：node scripts/pdf-font.mjs subset <含 NotoSansTC_400Regular.ttf / NotoSansTC_700Bold.ttf 的資料夾>
//             （原始字型可由 npm 套件 @expo-google-fonts/noto-sans-tc 取得）
//   檢查缺字：node scripts/pdf-font.mjs check   （npm run build 前自動執行）
import fs from "node:fs";
import path from "node:path";

const TEXT_SOURCES = [
  "src/lib/distributionRoom.ts",
  "src/components/DistributionRoomPdf.tsx",
  "src/components/pdfCommon.tsx",
  "src/lib/waterSupply.ts",
  "src/lib/waterSupplyData.ts",
  "src/components/WaterSupplyPdf.tsx",
  "src/lib/fireWater.ts",
  "src/components/FireWaterPdf.tsx",
  "src/lib/lightning.ts",
  "src/components/LightningPdf.tsx",
  "src/data/contact.ts",
];
const OUT_DIR = "public/fonts";
const CHARS_FILE = path.join(OUT_DIR, "pdf-font-chars.txt");
// 標準字重另含 Big5 常用字（使用者輸入的工程名稱、系統名稱等以標準字重呈現）；粗體只含固定文字。
const FONTS = [
  { src: "NotoSansTC_400Regular.ttf", out: "NotoSansTC-Regular-pdf.ttf", common: true },
  { src: "NotoSansTC_700Bold.ttf", out: "NotoSansTC-Bold-pdf.ttf", common: false },
];

/** Big5 常用字（A440–C67E）與全形符號（A140–A3BF）。 */
function commonChars() {
  const decoder = new TextDecoder("big5");
  const out = new Set();
  const ranges = [
    [0xa1, 0xa3],
    [0xa4, 0xc6],
  ];
  for (const [hiStart, hiEnd] of ranges) {
    for (let hi = hiStart; hi <= hiEnd; hi++) {
      for (const lo of [...Array(0x3f).keys()].map((i) => 0x40 + i).concat([...Array(0x5e).keys()].map((i) => 0xa1 + i))) {
        if (hi === 0xc6 && lo > 0x7e) continue;
        const c = decoder.decode(new Uint8Array([hi, lo]));
        if (c && c !== "\ufffd") out.add(c);
      }
    }
  }
  return out;
}

function requiredChars() {
  const set = new Set();
  for (let c = 0x20; c <= 0x7e; c++) set.add(String.fromCharCode(c));
  for (const file of TEXT_SOURCES) {
    for (const ch of fs.readFileSync(file, "utf8")) {
      if (ch.codePointAt(0) > 0x7e) set.add(ch);
    }
  }
  return [...set].sort().join("");
}

async function subset(srcDir) {
  if (!srcDir) throw new Error("請指定原始字型資料夾");
  const { default: subsetFont } = await import("subset-font");
  const fontkit = await import("fontkit");
  const text = requiredChars();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const f of FONTS) {
    const source = fs.readFileSync(path.join(srcDir, f.src));
    let chars = text;
    if (f.common) {
      // 常用字中原始字型沒有的字略過；固定文字則必須全部具備
      const srcFont = fontkit.create(source);
      const extra = [...commonChars()].filter((c) => !text.includes(c) && srcFont.hasGlyphForCodePoint(c.codePointAt(0)));
      chars = text + extra.join("");
    }
    const out = await subsetFont(source, chars, { targetFormat: "truetype" });
    fs.writeFileSync(path.join(OUT_DIR, f.out), out);
    const font = fontkit.create(out);
    const missing = [...text].filter((ch) => !font.hasGlyphForCodePoint(ch.codePointAt(0)));
    if (missing.length) throw new Error(`${f.out} 原始字型缺字：${missing.join(" ")}`);
    console.log(`${f.out}: ${(out.length / 1024).toFixed(1)} KB, ${[...chars].length} 字`);
  }
  fs.writeFileSync(CHARS_FILE, text);
}

function check() {
  const have = new Set(fs.readFileSync(CHARS_FILE, "utf8"));
  const missing = [...requiredChars()].filter((ch) => !have.has(ch));
  if (missing.length) {
    console.error(`PDF 字型缺少以下字元：${missing.join(" ")}\n請執行 npm run pdf-font:subset -- <原始字型資料夾>`);
    process.exit(1);
  }
  console.log("PDF 字型檢查通過");
}

const [mode, arg] = process.argv.slice(2);
if (mode === "subset") await subset(arg);
else if (mode === "check") check();
else {
  console.error("用法：node scripts/pdf-font.mjs subset <dir> | check");
  process.exit(1);
}
