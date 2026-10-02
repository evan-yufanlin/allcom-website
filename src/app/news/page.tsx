import type { Metadata } from "next";
import Link from "next/link";
import { news } from "@/data/news";

export const metadata: Metadata = {
  title: "最新消息",
};

export default function NewsPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-2xl">
          <span className="eyebrow">News</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold">最新消息</h1>
          <p className="mt-2.5 max-w-[44ch] text-[0.92rem] leading-relaxed text-muted">
            產業法規異動、政策動態與公司動態。
          </p>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto flex max-w-2xl flex-col">
          {news.map((n, i) => (
            <div
              key={n.title}
              className={`flex gap-4 py-4 ${i === 0 ? "border-t border-line" : ""} border-b border-line`}
            >
              <span className="w-18 shrink-0 font-mono text-[0.72rem] text-muted">{n.date}</span>
              <div className="flex flex-col gap-1.5">
                <span
                  className={`self-start px-2 py-0.5 font-mono text-[0.62rem] ${
                    n.category === "公司動態"
                      ? "border border-line text-muted"
                      : "bg-accent-soft text-accent"
                  }`}
                >
                  {n.category}
                </span>
                {n.slug ? (
                  <Link
                    href={`/news/${n.slug}`}
                    className="text-[0.92rem] font-semibold leading-relaxed hover:text-accent"
                  >
                    {n.title} →
                  </Link>
                ) : (
                  <span className="text-[0.92rem] font-semibold leading-relaxed">{n.title}</span>
                )}
                {n.summary && (
                  <p className="text-[0.82rem] leading-relaxed text-muted">{n.summary}</p>
                )}
                {n.attachment && (
                  <a
                    href={n.attachment.href}
                    download={n.attachment.fileName ?? true}
                    className="mt-0.5 inline-flex w-fit items-center gap-1.5 border border-line px-2.5 py-1 font-mono text-[0.7rem] text-accent hover:border-accent"
                  >
                    ↓ {n.attachment.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
