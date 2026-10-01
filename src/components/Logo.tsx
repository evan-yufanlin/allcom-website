// 三相半波波形標誌：R 相紅、S 相黑（深色模式自動轉白）、T 相藍（沿用品牌主色）
// 配色依 CNS 13542 勘誤表(1)（109.05.06）三相電路規定。
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 60" className={className} aria-hidden="true">
      <path
        d="M 16,48 Q 26,30 36,48"
        fill="none"
        stroke="var(--phase-r)"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <path
        d="M 28,48 Q 48,2 68,48"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <path
        d="M 60,48 Q 70,30 80,48"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
