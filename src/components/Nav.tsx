"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/services", label: "服務項目" },
  { href: "/portfolio", label: "實績案例" },
  { href: "/about", label: "關於我們" },
  { href: "/news", label: "最新消息" },
  { href: "/contact", label: "聯絡我們" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex flex-col leading-tight font-extrabold text-[1.02rem]">
          <span>
            汎德<span className="text-accent">・</span>工程顧問
          </span>
          <span className="font-mono text-[0.6rem] font-medium tracking-[0.16em] text-muted">
            ALLCOM
          </span>
        </Link>

        <nav className="hidden gap-6 text-sm text-muted md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-accent">
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
              className="border-b border-line py-3 text-foreground last:border-none"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
