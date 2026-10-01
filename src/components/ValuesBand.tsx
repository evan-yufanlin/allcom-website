const values = [
  { label: "專業", caption: "雙證照技師主持" },
  { label: "踏實", caption: "14年+ 工程實務" },
  { label: "熱忱", caption: "從規劃到監造深度參與" },
];

export default function ValuesBand() {
  return (
    <div className="mx-auto grid max-w-2xl grid-cols-3 gap-3.5 text-center">
      {values.map((v) => (
        <div key={v.label}>
          <div className="text-xl font-extrabold text-accent sm:text-2xl">{v.label}</div>
          <div className="mt-1 text-[0.72rem] text-muted">{v.caption}</div>
        </div>
      ))}
    </div>
  );
}
