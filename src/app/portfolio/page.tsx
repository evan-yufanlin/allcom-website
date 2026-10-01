import type { Metadata } from "next";
import { portfolio, portfolioCategories } from "@/data/portfolio";

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

      {portfolioCategories.map((category) => {
        const items = portfolio.filter((p) => p.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category} className="border-b border-line px-5 py-11 last:border-b-0">
            <div className="mx-auto max-w-2xl">
              <span className="eyebrow mb-4 block">{category}</span>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {items.map((p) => (
                  <div key={p.id} className="border border-line">
                    <div className="flex aspect-[4/3] items-end bg-[repeating-linear-gradient(45deg,var(--line)_0,var(--line)_1px,transparent_1px,transparent_14px)] bg-accent-soft p-2.5">
                      <span className="font-mono text-[0.68rem] text-muted">{p.id.toUpperCase()}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-[0.92rem] font-bold leading-snug">{p.title}</h3>
                      <p className="mt-1 text-[0.8rem] text-muted">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
