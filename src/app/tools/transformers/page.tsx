import type { Metadata } from "next";
import TransformerCatalog from "@/components/TransformerCatalog";

export const metadata: Metadata = {
  title: "變壓器規格查詢",
  description: "參考士林電機型錄，依容量、一次側與二次側電壓查詢油浸式、模鑄式變壓器之尺寸、重量、效率、阻抗與噪音。",
};

export default function TransformersPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-5xl">
          <span className="eyebrow">Instant Planning</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold text-balance">變壓器規格查詢</h1>
          <p className="mt-2.5 max-w-[52ch] text-[0.92rem] leading-relaxed text-muted">
            變電站空間檢討時，依容量、一次側與二次側電壓查詢變壓器尺寸、重量、效率、阻抗與噪音；可比較同型式各容量，或同容量不同型式之規格差異。
          </p>
        </div>
      </section>

      <section className="px-5 py-10">
        <TransformerCatalog />
      </section>
    </>
  );
}
