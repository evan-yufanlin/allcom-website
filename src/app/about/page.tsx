import type { Metadata } from "next";
import ValuesBand from "@/components/ValuesBand";
import SectionHead from "@/components/SectionHead";
import { timeline } from "@/data/timeline";
import { team } from "@/data/team";

export const metadata: Metadata = {
  title: "關於我們 | 汎德工程顧問",
};

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-2xl">
          <span className="eyebrow">About</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold">關於汎德</h1>
        </div>
      </section>

      <section className="px-5 py-11">
        <div className="mx-auto max-w-2xl">
          <p className="text-[0.98rem] leading-[1.85]">
            汎德工程顧問股份有限公司成立於{" "}
            <b className="font-bold text-accent">2011 年</b>
            （前身「汎德電機冷凍空調技師事務所」），2016 年 5 月改制為工程顧問股份有限公司，由電機技師暨冷凍空調技師{" "}
            <b className="font-bold text-accent">林毓凡</b>{" "}
            主持。累積十四年以上實務經驗，服務範圍涵蓋半導體廠辦、公共工程、醫療院所與住宅開發。
          </p>
        </div>
      </section>

      <section className="border-y border-line px-5 py-10">
        <ValuesBand />
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto max-w-2xl">
          <span className="eyebrow mb-3.5 block">Timeline</span>
          <div className="flex flex-col">
            {timeline.map((t, i) => (
              <div
                key={t.year}
                className={`flex gap-4 py-4 ${i === 0 ? "border-t border-line" : ""} border-b border-line`}
              >
                <div className="w-16 shrink-0 font-mono text-[0.85rem] font-semibold text-accent">
                  {t.year}
                </div>
                <div className="text-[0.88rem] leading-relaxed">{t.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line px-5 py-12">
        <div className="mx-auto max-w-2xl">
          <SectionHead eyebrow="Team" title="主要技師團隊" />
          <div className="-mt-2 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
            {team.map((m) => (
              <div key={m.name} className="flex flex-col gap-1 bg-surface p-4.5">
                <div className="font-mono text-[0.66rem] tracking-wide text-accent">{m.role}</div>
                <div className="mt-0.5 text-[1rem] font-bold">{m.name}</div>
                <div className="mt-1 text-[0.78rem] leading-relaxed text-muted">{m.credentials}</div>
              </div>
            ))}
          </div>
          <p className="mt-3.5 text-[0.78rem] text-muted">
            另有設計工程團隊與行政管理支援，共同完成規劃設計與圖面繪製工作。
          </p>
        </div>
      </section>
    </>
  );
}
