"use client";

import { useState } from "react";
import { ChevronIcon } from "@/components/icons";
import type { Service } from "@/data/services";

export default function ServiceAccordion({ services }: { services: Service[] }) {
  const [openId, setOpenId] = useState<string | null>(
    services.find((s) => s.tier === "core")?.id ?? null
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-2.5">
      {services.map((s) => {
        const open = openId === s.id;
        return (
          <div key={s.id} className="border border-line bg-surface">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : s.id)}
              className="flex w-full items-center gap-3 px-4 py-4 text-left"
            >
              <span
                className={`shrink-0 px-2 py-0.5 font-mono text-[0.62rem] tracking-wide ${
                  s.tier === "core"
                    ? "border border-accent text-accent"
                    : "border border-line text-muted"
                }`}
              >
                {s.tier === "core" ? "核心服務" : "配套服務"}
              </span>
              <span className="flex-1 text-[1rem] font-bold">{s.name}</span>
              <ChevronIcon className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            <div
              className="grid transition-[grid-template-rows] duration-200 ease-out"
              style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-3 px-4 pb-4.5">
                  <p className="text-[0.88rem] leading-relaxed text-muted">{s.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.tags.map((tag) => (
                      <span key={tag} className="bg-accent-soft px-2.5 py-1 font-mono text-[0.68rem]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {s.reference && (
                    <div className="border-t border-dashed border-line pt-2.5 text-[0.76rem] text-muted">
                      {s.reference}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
