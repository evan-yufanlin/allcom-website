import type { Metadata } from "next";
import WaterSupplyTool from "@/components/WaterSupplyTool";

export const metadata: Metadata = {
  title: "給水水理計算",
  description: "依台水、北水審查計算表，即時計算一日用水量、總表口徑、蓄水池與水塔容量及揚水管口徑。",
};

export default function WaterSupplyPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Instant Planning</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold text-balance">給水水理計算</h1>
          <p className="mt-2.5 max-w-[48ch] text-[0.92rem] leading-relaxed text-muted">
            依台灣自來水公司「內線設備水力計算表」與臺北自來水事業處「內線工程審查計算表」，計算一日用水量、總表口徑、蓄水池與水塔容量及揚水管口徑。
          </p>
        </div>
      </section>

      <section className="px-5 py-10">
        <WaterSupplyTool />
      </section>
    </>
  );
}
