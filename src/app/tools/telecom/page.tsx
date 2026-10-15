import type { Metadata } from "next";
import TelecomTool from "@/components/TelecomTool";

export const metadata: Metadata = {
  title: "電信室空間檢討",
  description: "依建築物電信設備設置技術規範，推估電話電纜對數、光纖心數，檢討電信室面積、引進管、主配線箱、總配線架與光終端配線架。",
};

export default function TelecomPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-4xl">
          <span className="eyebrow">Instant Planning</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold text-balance">電信室空間檢討</h1>
          <p className="mt-2.5 max-w-[52ch] text-[0.92rem] leading-relaxed text-muted">
            依建築物電信設備及空間設置使用管理規則與技術規範，由樓層用途與面積推估電話電纜對數、光纖心數，檢討電信室面積、引進管、主配線箱、總配線架（MDF）與光終端配線架（OLDF）。
          </p>
        </div>
      </section>

      <section className="px-5 py-10">
        <TelecomTool />
      </section>
    </>
  );
}
