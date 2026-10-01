import Link from "next/link";
import ValuesBand from "@/components/ValuesBand";
import SectionHead from "@/components/SectionHead";
import { BoltIcon, HvacIcon, WaterIcon, FireIcon } from "@/components/icons";
import { services } from "@/data/services";
import { industries } from "@/data/industries";
import { portfolio } from "@/data/portfolio";
import { news } from "@/data/news";

const heroIcons = [
  { Icon: BoltIcon, label: "電機" },
  { Icon: HvacIcon, label: "空調" },
  { Icon: WaterIcon, label: "給排水" },
  { Icon: FireIcon, label: "消防" },
];

const coreServices = services.filter((s) => s.tier === "core");
const secondaryServices = services.filter((s) => s.tier === "secondary");

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line pt-16">
        <div className="blueprint-grid absolute inset-0 opacity-55" />
        <div className="relative mx-auto flex max-w-2xl flex-col gap-4.5 px-5">
          <span className="eyebrow">Since 2011 · MEP Engineering Consultancy</span>
          <h1 className="text-[2.05rem] leading-[1.3] font-extrabold text-balance">
            機電系統的
            <br />
            <em className="not-italic text-accent">規劃者</em>與
            <em className="not-italic text-accent">監造者</em>
          </h1>
          <p className="max-w-[36ch] text-[0.98rem] leading-[1.75] text-muted">
            專注電機、空調系統規劃設計與監造，服務涵蓋廠辦、公共工程與住宅開發。
          </p>
          <p className="pt-1.5 text-[0.78rem] text-muted">
            主持技師 <b className="font-bold text-foreground">林毓凡</b>　電機技師・冷凍空調技師
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1.5">
            <Link
              href="/portfolio"
              className="rounded-[2px] bg-accent px-5 py-2.75 text-[0.85rem] font-bold text-white"
            >
              查看實績案例
            </Link>
            <Link
              href="/contact"
              className="rounded-[2px] border border-line px-5 py-2.75 text-[0.85rem] font-bold"
            >
              洽詢服務
            </Link>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
            {heroIcons.map(({ Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 bg-surface px-2 py-4">
                <Icon className="h-5.5 w-5.5" />
                <span className="text-[0.68rem] text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-b border-line px-5 py-10">
        <ValuesBand />
      </section>

      {/* Services preview */}
      <section className="border-b border-line px-5 py-13">
        <SectionHead
          eyebrow="Services"
          title="服務項目"
          description="以電機、空調兩大專業為核心，整合機電系統規劃設計與監造。"
        />
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
          {[...coreServices, ...secondaryServices].map((s) => (
            <div
              key={s.id}
              className={`flex flex-col gap-2 p-4.5 ${s.tier === "core" ? "bg-accent-soft" : "bg-surface"}`}
            >
              <div className="text-[0.92rem] font-bold">{s.name}</div>
              <div className="text-[0.78rem] leading-relaxed text-muted">{s.summary}</div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-5 max-w-2xl text-right">
          <Link href="/services" className="text-[0.82rem] font-semibold text-accent hover:underline">
            查看完整服務項目 →
          </Link>
        </div>
      </section>

      {/* Industries */}
      <section className="border-b border-line px-5 py-11">
        <div className="mx-auto max-w-2xl">
          <SectionHead eyebrow="Industries Served" title="服務產業" />
          <div className="-mt-4 flex flex-wrap gap-2.5">
            {industries.map((c) => (
              <span
                key={c}
                className="border border-line bg-surface px-3 py-1.75 font-mono text-[0.74rem]"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio highlights */}
      <section className="border-b border-line px-5 py-13">
        <SectionHead eyebrow="Portfolio" title="精選實績" description="近期案件節錄，完整案例請見實績頁。" />
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3.5 sm:grid-cols-2">
          {portfolio.slice(0, 2).map((p) => (
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
        <div className="mx-auto mt-5 max-w-2xl text-right">
          <Link href="/portfolio" className="text-[0.82rem] font-semibold text-accent hover:underline">
            查看完整實績案例 →
          </Link>
        </div>
      </section>

      {/* News preview */}
      <section className="px-5 py-13">
        <SectionHead eyebrow="News" title="最新消息" description="產業法規異動與技術動態。" />
        <div className="mx-auto flex max-w-2xl flex-col">
          {news.map((n, i) => (
            <div
              key={n.title}
              className={`flex gap-4 py-3.5 ${i === 0 ? "border-t border-line" : ""} border-b border-line`}
            >
              <span className="w-18 shrink-0 font-mono text-[0.72rem] text-muted">{n.date}</span>
              <div className="flex flex-col gap-1.25">
                <span
                  className={`self-start px-2 py-0.5 font-mono text-[0.62rem] ${
                    n.category === "公司動態"
                      ? "border border-line text-muted"
                      : "bg-accent-soft text-accent"
                  }`}
                >
                  {n.category}
                </span>
                <span className="text-[0.9rem] font-semibold leading-relaxed">{n.title}</span>
                {n.attachment && (
                  <a
                    href={n.attachment.href}
                    download
                    className="mt-0.5 inline-flex w-fit items-center gap-1.5 border border-line px-2.5 py-1 font-mono text-[0.7rem] text-accent hover:border-accent"
                  >
                    ↓ {n.attachment.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-5 max-w-2xl text-right">
          <Link href="/news" className="text-[0.82rem] font-semibold text-accent hover:underline">
            查看所有消息 →
          </Link>
        </div>
      </section>
    </>
  );
}
