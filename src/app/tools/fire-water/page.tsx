import type { Metadata } from "next";
import FireWaterTool from "@/components/FireWaterTool";

export const metadata: Metadata = {
  title: "消防水池容量檢討",
  description: "勾選室內消防栓、室外消防栓、自動撒水、泡沫及消防專用蓄水池，即時計算消防水池應設容量與實設有效水量。",
};

export default function FireWaterPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Instant Planning</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold text-balance">消防水池容量檢討</h1>
          <p className="mt-2.5 max-w-[48ch] text-[0.92rem] leading-relaxed text-muted">
            依「各類場所消防安全設備設置標準」，勾選本案設置之消防系統，計算各系統水源量、消防水池應設容量、消防專用蓄水池及屋頂水箱容量。
          </p>
        </div>
      </section>

      <section className="px-5 py-10">
        <FireWaterTool />
      </section>
    </>
  );
}
