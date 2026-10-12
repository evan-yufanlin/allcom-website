import type { Metadata } from "next";
import SubstationTool from "@/components/SubstationTool";

export const metadata: Metadata = {
  title: "自設變電站空間檢討",
  description: "依配電盤、變壓器排列與通道條件，即時概估自設變電站室內淨長、淨深與面積，並畫出平面示意圖。",
};

export default function SubstationPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-4xl">
          <span className="eyebrow">Instant Planning</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold text-balance">自設變電站空間檢討</h1>
          <p className="mt-2.5 max-w-[50ch] text-[0.92rem] leading-relaxed text-muted">
            依配電盤、變壓器之排列與通道條件，即時概估室內淨長、淨深與面積，畫出平面示意圖並提醒門扇干涉。
          </p>
        </div>
      </section>

      <section className="px-5 py-10">
        <SubstationTool />
      </section>
    </>
  );
}
