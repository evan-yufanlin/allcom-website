import type { Metadata } from "next";
import ParkingVentTool from "@/components/ParkingVentTool";

export const metadata: Metadata = {
  title: "停車場通風",
  description: "依停車樓地板面積計算通風量，估算風機台數、通風管道間及進、排氣百葉面積。",
};

export default function ParkingVentPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Instant Planning</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold text-balance">停車場通風</h1>
          <p className="mt-2.5 max-w-[48ch] text-[0.92rem] leading-relaxed text-muted">
            依停車樓地板面積計算通風量（每平方公尺每小時 25 立方公尺），估算風機台數、通風管道間及進、排氣百葉面積。
          </p>
        </div>
      </section>

      <section className="px-5 py-10">
        <ParkingVentTool />
      </section>
    </>
  );
}
