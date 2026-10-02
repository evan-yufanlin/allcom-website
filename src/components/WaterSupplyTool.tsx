"use client";

import { useState } from "react";
import PdfSaveButton from "@/components/PdfSaveButton";
import { Card, Check as CheckBox, Num, RemoveButton, Select, SmallButton, Text } from "@/components/ToolFields";
import { dateStamp } from "@/lib/dateStamp";
import {
  ASSUMPTIONS,
  DISCLAIMER,
  NEXT_VERSION_NOTE,
  REMINDERS,
  calculateWaterSupply,
  fmt,
  type Check,
  type DemandRow,
  type OtherUse,
  type ProjectInput,
  type Step,
  type SystemInput,
  type Tank,
  type WaterSupplyResult,
} from "@/lib/waterSupply";
import {
  AREA_USES,
  COUNTIES,
  FIXTURES,
  FIXTURE_BUILDINGS,
  JURISDICTION_NAME,
  NEW_TAIPEI_RULES,
  PARK_HEADCOUNT,
  PER_CAPITA,
  SOURCES,
  TAIPEI_XIZHI_VILLAGES,
  TONGLUO_FACTOR,
  areasOf,
  districtsOf,
  type Jurisdiction,
} from "@/lib/waterSupplyData";

// ---- 畫面狀態（在計算輸入上加 id 與選單狀態） ----

type RowUI = DemandRow & { id: number; preset: string; building: number };
type OtherUI = OtherUse & { id: number };
type TankUI = Tank & { id: number };
type SystemUI = Omit<SystemInput, "rows" | "others" | "tanks"> & {
  id: number;
  rows: RowUI[];
  others: OtherUI[];
  tanks: TankUI[];
  tongluo: boolean;
};

const OTHER_DISTRICT = "其他行政區";
const GENERAL_AREA = "general";
const NON_RESIDENTIAL = "non-residential";

let nextId = 1;
const newId = () => nextId++;

function newSystem(name: string): SystemUI {
  return {
    id: newId(),
    name,
    suites: 0,
    houses: 0,
    townhouses: 0,
    perSuite: 2,
    perHouse: 3,
    perTownhouse: 6,
    rows: [],
    v2Factor: 1,
    others: [],
    tanks: [],
    tongluo: false,
  };
}

function areaRowUI(j: Jurisdiction): RowUI {
  const u = AREA_USES[j][0];
  return {
    id: newId(),
    kind: "area",
    label: u.name,
    preset: u.id,
    building: 0,
    area: 0,
    ratio: u.ratio[0],
    density: u.density[1],
    litres: u.litres,
  };
}

function fixtureRowUI(building = 0): RowUI {
  const f = FIXTURES[0];
  return { id: newId(), kind: "fixture", label: f.name, preset: f.name, building, count: 0, litres: f.litres[building] ?? 0 };
}

function peopleRowUI(tongluo: boolean): RowUI {
  const p = PARK_HEADCOUNT[0];
  return {
    id: newId(),
    kind: "people",
    label: p.name,
    preset: p.id,
    building: 0,
    people: 0,
    litres: p.litres * (tongluo && p.tongluo ? TONGLUO_FACTOR : 1),
  };
}

// ---- 主元件 ----

export default function WaterSupplyTool() {
  const [projectName, setProjectName] = useState("");
  const [county, setCounty] = useState("臺北市");
  const [district, setDistrict] = useState(OTHER_DISTRICT);
  const [partialTaiwan, setPartialTaiwan] = useState(false);
  const [xizhiVillage, setXizhiVillage] = useState("other");
  const [areaKey, setAreaKey] = useState(GENERAL_AREA);
  const [highlandDays, setHighlandDays] = useState<number | null>(1.5);
  const [legacy, setLegacy] = useState(false);
  const [systems, setSystems] = useState<SystemUI[]>(() => [newSystem("生活用水")]);
  const [activeId, setActiveId] = useState(() => systems[0].id);
  const [plan, setPlan] = useState<ProjectInput["plan"]>({
    manual: false,
    planned: null,
    prior: 0,
    basis: "planned",
    otherStorage: 0,
  });
  const [today] = useState(() => new Date());

  // 轄區判定
  const rule = county === "新北市" ? NEW_TAIPEI_RULES[district] : undefined;
  const jurisdiction: Jurisdiction =
    county === "臺北市"
      ? "taipei"
      : rule?.kind === "taipei"
        ? "taipei"
        : rule?.kind === "taipei-partial"
          ? partialTaiwan
            ? "taiwan"
            : "taipei"
          : rule?.kind === "xizhi"
            ? xizhiVillage === "other"
              ? "taiwan"
              : "taipei"
            : "taiwan";
  const j = jurisdiction;

  const districts = districtsOf(county);
  const areas = j === "taiwan" ? areasOf(county, district) : [];
  const selectedArea = areaKey.startsWith("area-") ? areas[Number(areaKey.slice(5))] : undefined;

  let baselineDays: number | null = null;
  let baselineLabel = "";
  if (j === "taiwan" && !legacy && areaKey !== NON_RESIDENTIAL) {
    if (selectedArea) {
      baselineDays = selectedArea.days ?? highlandDays ?? null;
      baselineLabel = `${selectedArea.county}${selectedArea.district} ${selectedArea.places}（${selectedArea.reason}${
        selectedArea.days === null ? "，附件九高地供水地區，日數依審查訂定" : ""
      }）`;
    } else {
      baselineDays = 1;
      baselineLabel = "一般供水區";
    }
  }

  const input: ProjectInput = {
    jurisdiction: j,
    county,
    baselineDays,
    baselineLabel,
    legacyUrbanRenewal: j === "taipei" && legacy,
    systems,
    plan,
  };
  const result = calculateWaterSupply(input);

  const hasDemand = result.meter.v > 0;
  const active = systems.find((s) => s.id === activeId) ?? systems[0];

  function updateSystem(id: number, patch: Partial<SystemUI> | ((s: SystemUI) => Partial<SystemUI>)) {
    setSystems((list) => list.map((s) => (s.id === id ? { ...s, ...(typeof patch === "function" ? patch(s) : patch) } : s)));
  }

  function changeCounty(c: string) {
    setCounty(c);
    setDistrict(OTHER_DISTRICT);
    setAreaKey(GENERAL_AREA);
    setPartialTaiwan(false);
    setXizhiVillage("other");
  }

  const fileName = hasDemand
    ? `給水水理計算_${j === "taiwan" ? "台水" : "北水"}_${fmt(result.meter.v)}m3-${dateStamp(today, "")}`
    : "";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* 基本資料 */}
      <Card title="① 基本資料與供水轄區">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Text label="工程名稱（選填）" value={projectName} onChange={setProjectName} className="sm:col-span-3" />
          <Select
            label="縣市"
            value={county}
            onChange={changeCounty}
            options={COUNTIES.map((c) => ({ value: c, label: c }))}
          />
          <Select
            label="行政區"
            value={district}
            onChange={(d) => {
              setDistrict(d);
              setAreaKey(GENERAL_AREA);
              setPartialTaiwan(false);
              setXizhiVillage("other");
            }}
            options={[
              ...districts.map((d) => ({ value: d, label: d })),
              { value: OTHER_DISTRICT, label: county === "臺北市" ? "全區" : OTHER_DISTRICT },
            ]}
          />
          {rule?.kind === "xizhi" && (
            <Select
              label="里別"
              value={xizhiVillage}
              onChange={setXizhiVillage}
              options={[
                ...TAIPEI_XIZHI_VILLAGES.map((v) => ({ value: v, label: `${v}（北水）` })),
                { value: "other", label: "其他里（台水）" },
              ]}
            />
          )}
        </div>
        {rule?.kind === "taipei-partial" && (
          <CheckBox checked={partialTaiwan} onChange={setPartialTaiwan}>
            位於台水供水範圍（{rule.note}）
          </CheckBox>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[0.82rem]">
          <span className="text-muted">供水轄區：</span>
          <span className="bg-accent-soft px-2 py-0.5 font-bold text-accent">{JURISDICTION_NAME[j]}</span>
          <span className="text-[0.72rem] text-muted">住宅每人每日 {PER_CAPITA[j]} L</span>
        </div>

        {j === "taiwan" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select
              label="住宅類蓄水量基準值（供水區域）"
              value={areaKey}
              onChange={setAreaKey}
              className="sm:col-span-2"
              options={[
                { value: GENERAL_AREA, label: "一般供水區（1.0 日）" },
                ...areas.map((a, i) => ({
                  value: `area-${i}`,
                  label: `${a.places}（${a.days === null ? "附件九，依審查訂定" : `${a.days} 日`}，${a.reason}）`,
                })),
                { value: NON_RESIDENTIAL, label: "非住宅類（不檢核基準值）" },
              ]}
            />
            {selectedArea?.days === null && (
              <Num label="依審查訂定之日數" value={highlandDays} onChange={setHighlandDays} unit="日" allowEmpty />
            )}
          </div>
        )}
        <CheckBox checked={legacy} onChange={setLegacy}>
          {j === "taiwan"
            ? "105年12月5日基準值公告前已申請建照，或已報核之都市更新案（依各地區原有作業方式，不檢核基準值）"
            : "105年12月15日前報核之都市更新案（水池＋水塔合計下限改為 0.4 Vd）"}
        </CheckBox>
      </Card>

      {/* 用水系統 */}
      <Card
        title="② 用水量與水池、水塔"
        aside={
          <SmallButton
            onClick={() => {
              const s = newSystem(`系統 ${systems.length + 1}`);
              setSystems((l) => [...l, s]);
              setActiveId(s.id);
            }}
          >
            ＋ 新增系統
          </SmallButton>
        }
      >
        {systems.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="tablist">
            {systems.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={s.id === active.id}
                onClick={() => setActiveId(s.id)}
                className={`border px-3 py-1 text-[0.8rem] ${
                  s.id === active.id ? "border-accent bg-accent-soft font-bold text-accent" : "border-line text-muted"
                }`}
              >
                {s.name || "（未命名）"}
              </button>
            ))}
          </div>
        )}
        <SystemEditor
          key={active.id}
          j={j}
          sys={active}
          update={(patch) => updateSystem(active.id, patch)}
          remove={
            systems.length > 1
              ? () => {
                  const rest = systems.filter((s) => s.id !== active.id);
                  setSystems(rest);
                  setActiveId(rest[0].id);
                }
              : undefined
          }
        />
        {systems.length > 1 && (
          <p className="text-[0.72rem] text-muted">各系統分別檢核水池、水塔容量；總表口徑以各系統一日用水量合計計算。</p>
        )}
      </Card>

      {/* 用水計畫 */}
      <Card title="③ 用水計畫緊急蓄水量（3 日）">
        <p className="text-[0.75rem] leading-relaxed text-muted">
          計畫用水量達每日 300 m³ 以上須提用水計畫，原則上開發基地內總蓄水容量應能滿足三天之用水需求。未達 300 m³
          者可自行勾選檢討（例如科學園區、工業區廠房）。
        </p>
        <CheckBox checked={plan.manual} onChange={(manual) => setPlan({ ...plan, manual })}>
          未達每日 300 m³ 仍進行 3 日檢討
        </CheckBox>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Num
            label={`計畫用水量（空白則以 V 無條件進位 ＝ ${Math.ceil(result.meter.v - 1e-9)} 估算）`}
            value={plan.planned}
            onChange={(planned) => setPlan({ ...plan, planned })}
            unit="m³/日"
            allowEmpty
            placeholder={String(Math.ceil(result.meter.v - 1e-9))}
          />
          <Num
            label="分期開發：前期已核定計畫用水量"
            value={plan.prior}
            onChange={(prior) => setPlan({ ...plan, prior: prior ?? 0 })}
            unit="m³/日"
          />
          <Select
            label="檢核基準"
            value={plan.basis}
            onChange={(basis) => setPlan({ ...plan, basis })}
            options={[
              { value: "planned", label: "3 × 計畫用水量（依法規原文）" },
              { value: "vd", label: "3 × 一日設計用水量 Vd（較保守）" },
            ]}
          />
          <Num
            label="其他蓄水設施（製程水池、回收水池、雨水貯留池等）"
            value={plan.otherStorage}
            onChange={(otherStorage) => setPlan({ ...plan, otherStorage: otherStorage ?? 0 })}
            unit="m³"
          />
        </div>
      </Card>

      {hasDemand ? (
        <Results
          result={result}
          projectName={projectName}
          fileName={fileName}
          generatedOn={dateStamp(today, "/")}
        />
      ) : (
        <p className="border border-dashed border-line p-5 text-center text-[0.85rem] text-muted">
          輸入住宅戶數、非住宅用水或其他用水後，即顯示計算結果
        </p>
      )}
    </div>
  );
}

// ---- 系統編輯 ----

function SystemEditor({
  j,
  sys,
  update,
  remove,
}: {
  j: Jurisdiction;
  sys: SystemUI;
  update: (patch: Partial<SystemUI> | ((s: SystemUI) => Partial<SystemUI>)) => void;
  remove?: () => void;
}) {
  const setRow = (id: number, patch: Partial<RowUI>) =>
    update((s) => ({ rows: s.rows.map((r) => (r.id === id ? ({ ...r, ...patch } as RowUI) : r)) }));
  const setOther = (id: number, patch: Partial<OtherUI>) =>
    update((s) => ({ others: s.others.map((o) => (o.id === id ? ({ ...o, ...patch } as OtherUI) : o)) }));
  const setTank = (id: number, patch: Partial<TankUI>) =>
    update((s) => ({ tanks: s.tanks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const hasPeople = sys.rows.some((r) => r.kind === "people");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end gap-2">
        <Text label="系統名稱" value={sys.name} onChange={(name) => update({ name })} className="flex-1" />
        {remove && <SmallButton onClick={remove}>刪除此系統</SmallButton>}
      </div>

      {/* 住宅 */}
      <Group title="住宅（由人口數推算）" hint={`每人每日 ${PER_CAPITA[j]} L；每戶人數可依審查版本修改`}>
        <div className={`grid grid-cols-2 gap-3 ${j === "taipei" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <UnitInput label="套房" n={sys.suites} per={sys.perSuite} onN={(suites) => update({ suites })} onPer={(perSuite) => update({ perSuite })} />
          <UnitInput label="一般住宅" n={sys.houses} per={sys.perHouse} onN={(houses) => update({ houses })} onPer={(perHouse) => update({ perHouse })} />
          {j === "taipei" && (
            <UnitInput
              label="透天厝、透天別墅"
              n={sys.townhouses}
              per={sys.perTownhouse}
              onN={(townhouses) => update({ townhouses })}
              onPer={(perTownhouse) => update({ perTownhouse })}
            />
          )}
        </div>
      </Group>

      {/* 非住宅 */}
      <Group title="非住宅 V2′">
        {sys.rows.map((r) => (
          <div key={r.id} className="grid grid-cols-2 gap-2 border-l-2 border-line pl-3 sm:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto]">
            {r.kind === "area" && (
              <>
                <Select
                  label="面積推算：用途"
                  value={r.preset}
                  className="col-span-2 sm:col-span-1"
                  onChange={(preset) => {
                    const u = AREA_USES[j].find((x) => x.id === preset);
                    setRow(r.id, u ? { preset, label: u.name, ratio: u.ratio[0], density: u.density[1], litres: u.litres } : { preset });
                  }}
                  options={[...AREA_USES[j].map((u) => ({ value: u.id, label: u.name })), { value: "custom", label: "其他（自訂）" }]}
                />
                <Num label="樓地板面積" unit="m²" value={r.area} onChange={(area) => setRow(r.id, { area: area ?? 0 })} />
                <Num label={`有效面積比${rangeHint(AREA_USES[j].find((u) => u.id === r.preset)?.ratio)}`} value={r.ratio} onChange={(ratio) => setRow(r.id, { ratio: ratio ?? 0 })} />
                <Num label={`人/m²${rangeHint(AREA_USES[j].find((u) => u.id === r.preset)?.density)}`} value={r.density} onChange={(density) => setRow(r.id, { density: density ?? 0 })} />
                <Num label="L/人·日" value={r.litres} onChange={(litres) => setRow(r.id, { litres: litres ?? 0 })} />
              </>
            )}
            {r.kind === "fixture" && (
              <>
                <Select
                  label="衛生器具"
                  value={r.preset}
                  className="col-span-2 sm:col-span-1"
                  onChange={(preset) => {
                    const f = FIXTURES.find((x) => x.name === preset);
                    setRow(r.id, { preset, label: preset, litres: f?.litres[r.building] ?? r.litres });
                  }}
                  options={FIXTURES.map((f) => ({ value: f.name, label: f.name }))}
                />
                <Select
                  label="建物類別（表2-8）"
                  value={String(r.building)}
                  onChange={(b) => {
                    const building = Number(b);
                    const f = FIXTURES.find((x) => x.name === r.preset);
                    setRow(r.id, { building, litres: f?.litres[building] ?? r.litres });
                  }}
                  options={FIXTURE_BUILDINGS.map((b, i) => ({ value: String(i), label: b }))}
                />
                <Num label="數量" integer value={r.count} onChange={(count) => setRow(r.id, { count: count ?? 0 })} />
                <Num label="L/日" value={r.litres} onChange={(litres) => setRow(r.id, { litres: litres ?? 0 })} />
                <span className="hidden sm:block" />
              </>
            )}
            {r.kind === "people" && (
              <>
                <Select
                  label="人數：對象"
                  value={r.preset}
                  className="col-span-2 sm:col-span-1"
                  onChange={(preset) => {
                    const p = PARK_HEADCOUNT.find((x) => x.id === preset);
                    setRow(
                      r.id,
                      p
                        ? { preset, label: p.name, litres: p.litres * (sys.tongluo && p.tongluo ? TONGLUO_FACTOR : 1) }
                        : { preset, label: "其他人員" },
                    );
                  }}
                  options={[...PARK_HEADCOUNT.map((p) => ({ value: p.id, label: p.name })), { value: "custom", label: "其他（自訂）" }]}
                />
                <Num label="人數" integer value={r.people} onChange={(people) => setRow(r.id, { people: people ?? 0 })} />
                <Num label="L/人·日" value={r.litres} onChange={(litres) => setRow(r.id, { litres: litres ?? 0 })} />
                <span className="hidden sm:block" />
                <span className="hidden sm:block" />
              </>
            )}
            <RemoveButton label="刪除此列" onClick={() => update((s) => ({ rows: s.rows.filter((x) => x.id !== r.id) }))} />
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <SmallButton onClick={() => update((s) => ({ rows: [...s.rows, areaRowUI(j)] }))}>＋ 面積推算</SmallButton>
          {j === "taipei" && <SmallButton onClick={() => update((s) => ({ rows: [...s.rows, fixtureRowUI()] }))}>＋ 衛生器具</SmallButton>}
          <SmallButton onClick={() => update((s) => ({ rows: [...s.rows, peopleRowUI(s.tongluo)] }))}>＋ 人數（科學園區建議值）</SmallButton>
        </div>
        {hasPeople && (
          <CheckBox
            checked={sys.tongluo}
            onChange={(tongluo) =>
              update((s) => ({
                tongluo,
                rows: s.rows.map((r) => {
                  const p = PARK_HEADCOUNT.find((x) => x.id === r.preset);
                  return r.kind === "people" && p?.tongluo ? { ...r, litres: p.litres * (tongluo ? TONGLUO_FACTOR : 1) } : r;
                }),
              }))
            }
          >
            銅鑼園區、未設生活用水回收設備（員工用水 × 0.65，30 → 19.5 L）
          </CheckBox>
        )}
        {sys.rows.length > 0 && (
          <div className="max-w-[14rem]">
            <Num
              label="V2 變動係數（1.0～1.1）"
              value={sys.v2Factor}
              onChange={(v2Factor) => update({ v2Factor: v2Factor ?? 1 })}
            />
          </div>
        )}
      </Group>

      {/* 其他用水 */}
      <Group title="其他用水">
        {sys.others.map((o) => (
          <div key={o.id} className="grid grid-cols-2 gap-2 border-l-2 border-line pl-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Text label="項目" value={o.label} onChange={(label) => setOther(o.id, { label })} className="col-span-2 sm:col-span-1" />
            {o.kind === "fixed" ? (
              <>
                <Num label="每日用水量" unit="m³" value={o.m3} onChange={(m3) => setOther(o.id, { m3: m3 ?? 0 })} />
                <span className="hidden sm:block" />
              </>
            ) : (
              <>
                <Num label="泳池容量" unit="m³" value={o.volume} onChange={(volume) => setOther(o.id, { volume: volume ?? 0 })} />
                <Select
                  label="形式"
                  value={o.indoor ? "indoor" : "outdoor"}
                  onChange={(v) => setOther(o.id, { indoor: v === "indoor" })}
                  options={[
                    { value: "outdoor", label: "室外循環式 0.24V" },
                    { value: "indoor", label: "室內循環式 0.20V" },
                  ]}
                />
              </>
            )}
            <RemoveButton label="刪除此列" onClick={() => update((s) => ({ others: s.others.filter((x) => x.id !== o.id) }))} />
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <SmallButton onClick={() => update((s) => ({ others: [...s.others, { id: newId(), kind: "fixed", label: "冷卻水塔補給水", m3: 0 }] }))}>
            ＋ 冷卻水塔、製程等（m³/日）
          </SmallButton>
          <SmallButton onClick={() => update((s) => ({ others: [...s.others, { id: newId(), kind: "pool", label: "游泳池", volume: 0, indoor: false }] }))}>
            ＋ 游泳池
          </SmallButton>
        </div>
      </Group>

      {/* 水池水塔 */}
      <Group title="蓄水池、水塔（選填，用於容量檢核）" hint="容量 ＝ 長 × 寬 × 有效水深 × 座數">
        {sys.tanks.map((t) => (
          <div key={t.id} className="grid grid-cols-2 gap-2 border-l-2 border-line pl-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_repeat(4,minmax(0,0.8fr))_auto]">
            <Select
              label="種類"
              value={t.kind}
              onChange={(kind) => setTank(t.id, { kind })}
              options={[
                { value: "pool", label: "蓄水池" },
                { value: "tower", label: "水塔" },
              ]}
            />
            <Text label="名稱／位置" value={t.label} onChange={(label) => setTank(t.id, { label })} />
            <Num label="長" unit="m" value={t.length} onChange={(length) => setTank(t.id, { length: length ?? 0 })} />
            <Num label="寬" unit="m" value={t.width} onChange={(width) => setTank(t.id, { width: width ?? 0 })} />
            <Num label="有效水深" unit="m" value={t.depth} onChange={(depth) => setTank(t.id, { depth: depth ?? 0 })} />
            <Num label="座數" integer value={t.count} onChange={(count) => setTank(t.id, { count: count ?? 0 })} />
            <RemoveButton label="刪除此列" onClick={() => update((s) => ({ tanks: s.tanks.filter((x) => x.id !== t.id) }))} />
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <SmallButton onClick={() => update((s) => ({ tanks: [...s.tanks, { id: newId(), kind: "pool", label: "B1F 蓄水池", length: 0, width: 0, depth: 0, count: 1 }] }))}>
            ＋ 蓄水池
          </SmallButton>
          <SmallButton onClick={() => update((s) => ({ tanks: [...s.tanks, { id: newId(), kind: "tower", label: "RF 水塔", length: 0, width: 0, depth: 0, count: 1 }] }))}>
            ＋ 水塔
          </SmallButton>
        </div>
      </Group>
    </div>
  );
}

function rangeHint(r?: [number, number]) {
  return r && r[0] !== r[1] ? `（${r[0]}～${r[1]}）` : "";
}

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h3 className="text-[0.85rem] font-bold">{title}</h3>
        {hint && <span className="text-[0.72rem] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function UnitInput({
  label,
  n,
  per,
  onN,
  onPer,
}: {
  label: string;
  n: number;
  per: number;
  onN: (n: number) => void;
  onPer: (n: number) => void;
}) {
  return (
    <div className="flex gap-1.5">
      <Num label={`${label}戶數`} unit="戶" integer value={n} onChange={(v) => onN(v ?? 0)} className="flex-[1.4]" />
      <Num label="人/戶" value={per} onChange={(v) => onPer(v ?? 0)} className="flex-1" />
    </div>
  );
}

// ---- 結果 ----

function Results({
  result,
  projectName,
  fileName,
  generatedOn,
}: {
  result: WaterSupplyResult;
  projectName: string;
  fileName: string;
  generatedOn: string;
}) {
  const j = result.input.jurisdiction;
  const multi = result.systems.length > 1;
  const refs = references(result);

  return (
    <div className="flex flex-col gap-6">
      <section className="border border-accent bg-accent-soft p-5">
        <span className="eyebrow">計算結果｜{JURISDICTION_NAME[j]}</span>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label={multi ? "一日用水量 V（合計）" : "一日用水量 V"} value={fmt(result.meter.v)} unit="m³" />
          <Metric label="一日設計用水量 Vd" value={fmt(result.meter.vd)} unit="m³" />
          <Metric label="總表口徑（建議）" value={result.meter.size ? String(result.meter.size) : "—"} unit="mm" strong />
          <Metric
            label="揚水管口徑（建議）"
            value={result.systems.map((s) => (s.dpSize ? String(s.dpSize) : "—")).join(" / ")}
            unit="mm"
          />
        </div>
      </section>

      {result.systems.map((s) => (
        <section key={s.name} className="flex flex-col gap-3">
          <h2 className="text-[1.05rem] font-extrabold">{multi ? `系統：${s.name}` : "計算式"}</h2>
          {s.steps.map((st, i) => (
            <StepBox key={st.title} n={i + 1} step={st} />
          ))}
          <p className="-mt-1.5 text-[0.72rem] text-muted/60">{NEXT_VERSION_NOTE}</p>
          {s.checks.length > 0 ? (
            <CheckTable checks={s.checks} />
          ) : (
            <p className="text-[0.75rem] text-muted">未輸入蓄水池、水塔尺寸，略過容量檢核。</p>
          )}
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <h2 className="text-[1.05rem] font-extrabold">總表口徑</h2>
        <StepBox step={result.meter.step} />
        {result.plan.active && <StepBox step={result.plan.step} warn={!result.plan.ok} />}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">水箱設置提醒</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed">
          {REMINDERS[j].map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">適用範圍與說明</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed text-muted">
          {ASSUMPTIONS.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">引用法規</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed">
          {refs.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </section>

      <p className="border-t border-dashed border-line pt-4 text-[0.75rem] leading-relaxed text-muted">{DISCLAIMER(j)}</p>

      <PdfSaveButton
        fileName={fileName}
        label="下載計算書 PDF"
        build={async () => {
          const [{ pdf }, { default: WaterSupplyPdf }, { registerPdfFonts }] = await Promise.all([
            import("@react-pdf/renderer"),
            import("@/components/WaterSupplyPdf"),
            import("@/components/pdfCommon"),
          ]);
          registerPdfFonts(window.location.origin);
          return pdf(
            <WaterSupplyPdf result={result} projectName={projectName} generatedOn={generatedOn} references={refs} />,
          ).toBlob();
        }}
      />
    </div>
  );
}

export function references(r: WaterSupplyResult) {
  const j = r.input.jurisdiction;
  const list: string[] =
    j === "taiwan"
      ? [`${SOURCES.standard}：第6條`, `${SOURCES.twRules}：附件十一、附件十一之一`]
      : [`${SOURCES.standard}：第6條`, `${SOURCES.tpRules}：2-4、2-5、2-6、2-7、表2-8～表2-11`];
  if (j === "taiwan" && r.input.baselineDays !== null) list.push(SOURCES.twBaseline);
  if (j === "taiwan" && r.input.baselineLabel.includes("附件九")) list.push(SOURCES.twHighland);
  if (r.plan.active) list.push(`${SOURCES.planRules}：第3條、第5條`, `${SOURCES.planFormat}：五、缺水應變措施`);
  if (r.input.systems.some((s) => s.rows.some((x) => x.kind === "people"))) list.push(`${SOURCES.parkGuide}：民生用水建議值`);
  return list;
}

function Metric({ label, value, unit, strong }: { label: string; value: string; unit: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[0.72rem] text-muted">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={`font-mono font-semibold tabular-nums text-accent ${strong ? "text-[1.9rem] leading-none" : "text-[1.25rem]"}`}>
          {value}
        </span>
        <span className="text-[0.8rem] font-bold">{unit}</span>
      </span>
    </div>
  );
}

function StepBox({ step, n, warn }: { step: Step; n?: number; warn?: boolean }) {
  return (
    <div className={`border bg-surface p-4 ${warn ? "border-[var(--phase-r)]" : "border-line"}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.85rem] font-bold">
          {n ? `${"①②③④⑤⑥"[n - 1]} ` : ""}
          {step.title}
        </span>
        <span className="shrink-0 font-mono text-[0.95rem] font-semibold tabular-nums text-accent">{step.value}</span>
      </div>
      <ul className="mt-2 flex flex-col gap-1 font-mono text-[0.78rem] leading-relaxed tabular-nums">
        {step.lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <p className="mt-2 text-[0.7rem] text-muted">依據：{step.cite}</p>
    </div>
  );
}

function CheckTable({ checks }: { checks: Check[] }) {
  return (
    <div className="flex flex-col border border-line">
      {checks.map((c, i) => (
        <div
          key={c.item}
          className={`grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 bg-surface p-3 sm:grid-cols-[8rem_1fr_5.5rem_3rem] ${
            i > 0 ? "border-t border-line" : ""
          }`}
        >
          <span className="text-[0.8rem] font-bold">{c.item}</span>
          <span className="order-last col-span-2 text-[0.8rem] leading-relaxed sm:order-none sm:col-span-1">
            {c.requirement}
            {c.note && <span className="block text-[0.7rem] text-muted">{c.note}</span>}
            <span className="block text-[0.68rem] text-muted">依據：{c.cite}</span>
          </span>
          <span className="hidden font-mono text-[0.8rem] tabular-nums sm:block">{c.actual}</span>
          <span
            className={`text-right text-[0.8rem] font-bold ${
              c.ok === null ? "text-muted" : c.ok ? "text-[#15803d] dark:text-[#4ade80]" : "text-[var(--phase-r)]"
            }`}
          >
            <span className="mr-1 font-mono font-normal text-foreground sm:hidden">{c.actual}</span>
            {c.ok === null ? "—" : c.ok ? "OK" : (c.failLabel ?? "不足")}
          </span>
        </div>
      ))}
    </div>
  );
}
