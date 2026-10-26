import type { Metadata } from "next";
import GeneratorTool from "@/components/GeneratorTool";

export const metadata: Metadata = {
  title: "緊急發電機室",
  description: "依東元、中興電工型錄選定柴油發電機組，概估機房尺寸並畫出平面圖，檢討日用油箱、防液堤、儲油槽與進、排氣百葉。",
};

export default function GeneratorPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Instant Planning</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold text-balance">緊急發電機室</h1>
          <p className="mt-2.5 max-w-[48ch] text-[0.92rem] leading-relaxed text-muted">
            依需求容量自東元、中興電工型錄選定機組，概估機房尺寸並畫出平面圖，檢討日用油箱、防液堤、儲油槽與進、排氣百葉。
          </p>
        </div>
      </section>

      <section className="px-5 py-10">
        <GeneratorTool />
      </section>
    </>
  );
}
