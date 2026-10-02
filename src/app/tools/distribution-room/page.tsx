import type { Metadata } from "next";
import DistributionRoomTool from "@/components/DistributionRoomTool";

export const metadata: Metadata = {
  title: "台電配電場所面積檢討",
  description: "輸入總樓地板面積與汽車停車位數，即時檢討台電低壓新設配電場所面積與規格需求。",
};

export default function DistributionRoomPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-2xl">
          <span className="eyebrow">Instant Planning</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold text-balance">台電配電場所面積檢討</h1>
          <p className="mt-2.5 max-w-[44ch] text-[0.92rem] leading-relaxed text-muted">
            輸入新建案關鍵參數，依台電營業規章與相關規範，檢討低壓新設配電場所面積、算式與規格需求。
          </p>
        </div>
      </section>

      <section className="px-5 py-10">
        <DistributionRoomTool />
      </section>
    </>
  );
}
