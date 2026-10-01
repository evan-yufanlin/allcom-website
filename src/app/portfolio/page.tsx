import type { Metadata } from "next";
import { portfolio } from "@/data/portfolio";

export const metadata: Metadata = {
  title: "實績案例 | 汎德工程顧問",
};

export default function PortfolioPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-2xl">
          <span className="eyebrow">Portfolio</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold">實績案例</h1>
          <p className="mt-2.5 max-w-[44ch] text-[0.92rem] leading-relaxed text-muted">
            精選近年代表案件，涵蓋半導體廠辦、公共工程與住宅開發。
          </p>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {portfolio.map((p) => (
            <div key={p.id} className="border border-line">
              <div className="flex aspect-[4/3] items-end bg-[repeating-linear-gradient(45deg,var(--line)_0,var(--line)_1px,transparent_1px,transparent_14px)] bg-accent-soft p-2.5">
                <span className="font-mono text-[0.68rem] text-muted">{p.id.toUpperCase()}</span>
              </div>
              <div className="p-4">
                <div className="text-[0.7rem] font-semibold tracking-wide text-accent">{p.category}</div>
                <h3 className="mt-1 text-[0.92rem] font-bold">{p.title}</h3>
                <p className="mt-1 text-[0.8rem] text-muted">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
