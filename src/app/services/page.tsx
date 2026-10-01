import type { Metadata } from "next";
import ServiceAccordion from "@/components/ServiceAccordion";
import { services } from "@/data/services";

export const metadata: Metadata = {
  title: "服務項目 | 汎德工程顧問",
};

export default function ServicesPage() {
  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-2xl">
          <span className="eyebrow">Services</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold text-balance">服務項目</h1>
          <p className="mt-2.5 max-w-[44ch] text-[0.92rem] leading-relaxed text-muted">
            以電機、空調兩大專業為核心，給排水與消防作為配套整合，提供規劃設計到現場監造的一站服務。
          </p>
        </div>
      </section>

      <section className="px-5 py-12">
        <ServiceAccordion services={services} />
      </section>
    </>
  );
}
