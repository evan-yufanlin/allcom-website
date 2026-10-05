import type { Metadata } from "next";
import LightningTool from "@/components/LightningTool";

export const metadata: Metadata = {
  title: "避雷設備檢討",
  description: "依建築技術規則建築設備編，即時檢討避雷設備應設與否、避雷導線斷面、引下導線條數及富蘭克林避雷針保護角。",
};

export default function LightningPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Instant Planning</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold text-balance">避雷設備檢討</h1>
          <p className="mt-2.5 max-w-[48ch] text-[0.92rem] leading-relaxed text-muted">
            依建築技術規則建築設備編第一章第五節，檢討避雷設備應設與否、避雷導線斷面、引下導線條數，及富蘭克林避雷針保護角。
          </p>
        </div>
      </section>

      <section className="px-5 py-10">
        <LightningTool />
      </section>
    </>
  );
}
