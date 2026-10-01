export default function SectionHead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-6 flex max-w-2xl flex-col gap-1.5">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="text-[1.3rem] font-extrabold">{title}</h2>
      {description && <p className="text-[0.88rem] text-muted">{description}</p>}
    </div>
  );
}
