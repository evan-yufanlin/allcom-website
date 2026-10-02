import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "即時規劃",
  description: "機電空間與設備規劃線上工具：台電配電場所面積檢討、給水水理計算。",
};

const tools = [
  {
    href: "/tools/distribution-room",
    title: "台電配電場所面積檢討",
    tag: "電機",
    summary: "輸入總樓地板面積與汽車停車位數，檢討低壓新設配電場所面積與規格需求。",
  },
  {
    href: "/tools/water-supply",
    title: "給水水理計算",
    tag: "給排水",
    summary: "依台水、北水審查計算表，計算一日用水量、總表口徑、蓄水池與水塔容量及揚水管口徑。",
  },
];

export default function ToolsPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-2xl">
          <span className="eyebrow">Instant Planning</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold">即時規劃</h1>
          <p className="mt-2.5 max-w-[44ch] text-[0.92rem] leading-relaxed text-muted">
            輸入建案關鍵參數，依法規即時檢討機電空間與設備需求，並可下載計算書。
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
      </section>
    </>
  );
}
