import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { newsWithPage } from "@/data/news";

export const dynamicParams = false;

export function generateStaticParams() {
  return newsWithPage.map((n) => ({ slug: n.slug }));
}

function findNews(slug: string) {
  return newsWithPage.find((n) => n.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const item = findNews((await params).slug);
  if (!item) return {};
  return { title: item.title, description: item.summary };
}

export default async function NewsDetailPage({ params }: PageProps<"/news/[slug]">) {
  const item = findNews((await params).slug);
  if (!item) notFound();

  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-2xl">
          <Link href="/news" className="font-mono text-[0.72rem] text-muted hover:text-accent">
            ← 最新消息
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-mono text-[0.72rem] text-muted">{item.date}</span>
            <span
              className={`px-2 py-0.5 font-mono text-[0.62rem] ${
                item.category === "公司動態" ? "border border-line text-muted" : "bg-accent-soft text-accent"
              }`}
            >
              {item.category}
            </span>
          </div>
          <h1 className="mt-2.5 text-[1.5rem] font-extrabold leading-snug text-balance">
            {/* 標題於逗號後斷行，避免手機上把詞拆開 */}
            {item.title.split(/(?<=，)/).map((part) => (
              <span key={part} className="inline-block">
                {part}
              </span>
            ))}
          </h1>
        </div>
      </section>

      <section className="px-5 py-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          {item.points && (
            <div>
              <h2 className="text-[1rem] font-bold">重點整理</h2>
              <ul className="mt-3 flex flex-col gap-2.5 text-[0.9rem] leading-relaxed">
                {item.points.map((p) => (
                  <li key={p.text} className="flex gap-2.5">
                    <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 bg-accent" />
                    <div>
                      {p.text}
                      {p.children && (
                        <ul className="mt-1.5 flex flex-col gap-1 text-muted">
                          {p.children.map((c) => (
                            <li key={c}>・{c}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.attachment && (
            <a
              href={item.attachment.href}
              download={item.attachment.fileName ?? true}
              className="inline-flex w-fit items-center gap-1.5 border border-accent px-3.5 py-2 text-[0.85rem] font-semibold text-accent hover:bg-accent-soft"
            >
              ↓ {item.attachment.label}
            </a>
          )}

          {item.pages && (
            <div>
              <h2 className="text-[1rem] font-bold">公文內容</h2>
              <p className="mt-1 text-[0.78rem] text-muted">點選圖片可開啟原尺寸。</p>
              <div className="mt-4 flex flex-col gap-4">
                {item.pages.map((pg, i) => (
                  <a key={pg.src} href={pg.src} target="_blank" rel="noopener" className="block">
                    <Image
                      src={pg.src}
                      width={pg.width}
                      height={pg.height}
                      sizes="(max-width: 672px) 100vw, 672px"
                      alt={`${item.title}　第 ${i + 1} 頁`}
                      className="h-auto w-full border border-line bg-white"
                      preload={i === 0}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
