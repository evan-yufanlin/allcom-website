"use client";

import { useState, type ReactNode } from "react";

/** 數字輸入：保留使用者輸入的原始字串，數值改由外部變更時同步顯示。空白視為 0。 */
export function Num({
  value,
  onChange,
  unit,
  label,
  className = "",
  placeholder,
  integer = false,
  allowEmpty = false,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  unit?: string;
  label?: string;
  className?: string;
  placeholder?: string;
  integer?: boolean;
  allowEmpty?: boolean;
}) {
  const show = (v: number | null) => (v === null || (v === 0 && !allowEmpty) ? "" : String(v));
  const [raw, setRaw] = useState(show(value));
  const parsed = raw.trim() === "" ? (allowEmpty ? null : 0) : Number(raw);
  const invalid = raw.trim() !== "" && (!Number.isFinite(parsed) || (parsed ?? 0) < 0 || (integer && !Number.isInteger(parsed)));

  // 數值由外部變更（例如切換預設值）時同步顯示
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    if (!invalid && parsed !== value) setRaw(show(value));
  }

  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      {label && <span className="text-[0.72rem] text-muted">{label}</span>}
      <span
        className={`flex items-center border bg-background focus-within:border-accent ${
          invalid ? "border-[var(--phase-r)]" : "border-line"
        }`}
      >
        <input
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          value={raw}
          placeholder={placeholder ?? "0"}
          aria-invalid={invalid}
          onChange={(e) => {
            const next = e.target.value.replace(/,/g, "");
            setRaw(next);
            const n = next.trim() === "" ? (allowEmpty ? null : 0) : Number(next);
            if (n === null || (Number.isFinite(n) && n >= 0 && (!integer || Number.isInteger(n)))) onChange(n);
          }}
          className="w-full min-w-0 bg-transparent px-2 py-1.5 font-mono text-[0.85rem] tabular-nums outline-none"
        />
        {unit && <span className="shrink-0 px-2 text-[0.72rem] text-muted">{unit}</span>}
      </span>
    </label>
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label?: string;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      {label && <span className="text-[0.72rem] text-muted">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full min-w-0 border border-line bg-background px-2 py-1.5 text-[0.85rem] outline-none focus:border-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Text({
  value,
  onChange,
  label,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      {label && <span className="text-[0.72rem] text-muted">{label}</span>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 border border-line bg-background px-2 py-1.5 text-[0.85rem] outline-none focus:border-accent"
      />
    </label>
  );
}

export function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-start gap-2 text-[0.8rem] leading-relaxed">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-[0.3em] accent-[var(--accent)]"
      />
      <span>{children}</span>
    </label>
  );
}

export function SmallButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-line bg-background px-2.5 py-1 text-[0.75rem] text-accent hover:border-accent"
    >
      {children}
    </button>
  );
}

export function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="self-end px-2 py-1.5 text-[0.9rem] text-muted hover:text-[var(--phase-r)]"
    >
      ×
    </button>
  );
}

export function Card({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[0.95rem] font-extrabold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
