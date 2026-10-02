"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/Logo";

const links = [
  { href: "/services", label: "服務項目" },
  { href: "/portfolio", label: "實績案例" },
  { href: "/about", label: "關於我們" },
  { href: "/news", label: "最新消息" },
  { href: "/tools", label: "即時規劃", highlight: true },
  { href: "/contact", label: "聯絡我們" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="h-7 w-11" />
          <span className="inline-grid leading-tight">
            <span className="whitespace-nowrap font-extrabold text-[1.02rem]">汎德</span>
            <span className="flex justify-between font-mono text-[0.6rem] font-medium text-muted">
              {"ALLCOM".split("").map((ch, i) => (
                <span key={i}>{ch}</span>
              ))}
            </span>
          </span>
        </Link>

        <nav className="hidden gap-6 text-sm text-muted md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={l.highlight ? "font-semibold text-accent hover:opacity-80" : "hover:text-accent"}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-expanded={open}
          aria-label="開啟選單"
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span className={`h-px w-5 bg-foreground transition ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
          <span className={`h-px w-5 bg-foreground transition ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col border-t border-line bg-surface px-5 py-3 text-sm md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`border-b border-line py-3 last:border-none ${
                l.highlight ? "font-semibold text-accent" : "text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
