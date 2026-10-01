import type { Metadata } from "next";
import { contactInfo } from "@/data/contact";

export const metadata: Metadata = {
  title: "聯絡我們",
};

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-2xl">
          <span className="eyebrow">Contact</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold">聯絡我們</h1>
          <p className="mt-2.5 max-w-[44ch] text-[0.92rem] leading-relaxed text-muted">
            歡迎洽詢規劃設計、監造或鑑定評估相關服務。
          </p>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto flex max-w-2xl flex-col gap-px border border-line bg-line">
          {contactInfo.map((c) => (
            <div key={c.label} className="flex gap-4 bg-surface px-4.5 py-4">
              <span className="w-16 shrink-0 font-mono text-[0.72rem] text-accent">{c.label}</span>
              <span className="text-[0.9rem]">{c.value}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
