import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "即時規劃",
  description: "建築初步規劃階段的機電空間線上檢討：台電配電場所、避雷設備、給水水理計算、消防水池容量等。",
};

const tools = [
  {
    href: "/tools/distribution-room",
    title: "台電配電場所面積檢討",
    tag: "電機",
    summary: "輸入總樓地板面積與汽車停車位數，檢討低壓新設配電場所面積與規格需求。",
  },
  {
    href: "/tools/lightning",
    title: "避雷設備檢討",
    tag: "電機",
    summary: "依建築物高度與外周長，檢討應設與否、避雷導線斷面、引下導線條數及富蘭克林避雷針保護角。",
  },
  {
    href: "/tools/water-supply",
    title: "給水水理計算",
    tag: "給排水",
    summary: "依台水、北水審查計算表，計算一日用水量、總表口徑、蓄水池與水塔容量及揚水管口徑。",
  },
  {
    href: "/tools/fire-water",
    title: "消防水池容量檢討",
    tag: "消防",
    summary: "勾選消防栓、撒水、泡沫及消防專用蓄水池，計算消防水池應設容量、屋頂水箱與實設有效水量。",
  },
];

// 建置中：依以往「設備空間概估」案例整理之重要機電空間（管道間不列入初步規劃）。
const upcoming: { tag: string; items: { title: string; summary: string }[] }[] = [
  {
    tag: "電機",
    items: [
      { title: "受電箱、電錶箱", summary: "依用電戶數估算箱體組數與排列寬度，前方 1 m 通道。" },
      { title: "自設電氣室", summary: "依受電方式與設備估算尺寸，鄰近台電配電場所。" },
      { title: "緊急發電機室", summary: "依發電機容量估算機房尺寸、進排氣百葉面積與防火門。" },
    ],
  },
  {
    tag: "電信",
    items: [{ title: "電信室", summary: "依引進對數估算面積，最窄寬度、淨高與設置樓層原則。" }],
  },
  {
    tag: "給排水",
    items: [
      { title: "污水處理機房與處理池", summary: "依每日污水量估算處理池容量與機房尺寸。" },
      { title: "雨水貯集（回收）水池", summary: "依綠建築雨水貯集設施規定估算容量與機房。" },
      { title: "雨水滯留池", summary: "依基地面積估算流出抑制設施容量。" },
    ],
  },
  {
    tag: "消防",
    items: [
      { title: "消防泵浦室", summary: "依消防系統與幫浦台數估算泵浦室尺寸，鄰接消防水池。" },
      { title: "屋頂消防水箱與中繼設備", summary: "屋頂消防水箱容量；高層建築之中繼機房與中繼水箱。" },
      { title: "防災中心", summary: "高層建築物防災中心面積與防火時效。" },
    ],
  },
  {
    tag: "停車場・其他",
    items: [
      { title: "停車場通風", summary: "依停車場面積與換氣量估算進、排氣風機空間。" },
      { title: "垃圾冷藏與資源回收空間", summary: "依戶數估算垃圾冷藏及資源回收空間面積。" },
    ],
  },
];

export default function ToolsPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-2xl">
          <span className="eyebrow">Instant Planning</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold">即時規劃</h1>
          <p className="mt-2.5 max-w-[46ch] text-[0.92rem] leading-relaxed text-muted">
            提供建築師初步規劃時，即時檢討重要機電空間的面積與設置需求，並可下載計算書。
          </p>
        </div>
      </section>

      <section className="px-5 py-10">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3.5 sm:grid-cols-2">
          {tools.map((t) => (
            <Link key={t.href} href={t.href} className="group flex flex-col gap-2 border border-line bg-surface p-5 hover:border-accent">
              <span className="self-start bg-accent-soft px-2 py-0.5 font-mono text-[0.62rem] text-accent">{t.tag}</span>
              <span className="text-[1rem] font-bold group-hover:text-accent">{t.title} →</span>
              <span className="text-[0.8rem] leading-relaxed text-muted">{t.summary}</span>
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-[1.05rem] font-extrabold">其他重要機電空間</h2>
            <span className="border border-line px-2 py-0.5 font-mono text-[0.62rem] text-muted">建置中</span>
          </div>
          <p className="mt-1.5 text-[0.8rem] leading-relaxed text-muted">以下項目陸續開放，敬請期待。</p>

          <div className="mt-5 flex flex-col gap-6">
            {upcoming.map((g) => (
              <div key={g.tag} className="flex flex-col gap-2">
                <span className="eyebrow">{g.tag}</span>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {g.items.map((it) => (
                    <div key={it.title} className="flex flex-col gap-1 border border-dashed border-line p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[0.9rem] font-bold text-muted">{it.title}</span>
                        <span className="shrink-0 font-mono text-[0.6rem] text-muted">建置中</span>
                      </div>
                      <span className="text-[0.76rem] leading-relaxed text-muted">{it.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
