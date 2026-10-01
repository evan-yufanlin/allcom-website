export type ServiceTier = "core" | "secondary";

export interface Service {
  id: string;
  name: string;
  tier: ServiceTier;
  summary: string;
  description: string;
  tags: string[];
  reference?: string;
}

// 代表案件匿名化處理，不具名呈現。
export const services: Service[] = [
  {
    id: "electrical",
    name: "電機工程",
    tier: "core",
    summary: "低壓/高壓配電、照明動力系統規劃設計與監造。",
    description:
      "低壓/高壓配電、照明動力系統規劃設計與監造，具半導體廠辦與無塵室電力系統實績。",
    tags: ["高壓受電", "照明動力", "無塵室電力", "弱電系統"],
    reference: "代表案件：半導體廠區辦公大樓、化合物半導體廠電氣工程",
  },
  {
    id: "hvac",
    name: "空調工程",
    tier: "core",
    summary: "空調通風節能系統規劃設計與監造。",
    description:
      "空調通風節能系統規劃設計與監造，具無塵室機電工程與綠建築候選標章評估實績。",
    tags: ["無塵室空調", "節能評估", "綠建築候選", "通風換氣"],
    reference:
      "代表案件：電子零組件廠新建工程（無塵室10K）、集合住宅新建工程（銀級候選）",
  },
  {
    id: "water",
    name: "給排水工程",
    tier: "secondary",
    summary: "給水加壓、儲水系統與污水雨水排放系統規劃設計。",
    description:
      "給水加壓、儲水系統與污水雨水排放系統規劃設計，配合建築整體管線整合。",
    tags: ["加壓給水", "污水排放", "雨水系統"],
  },
  {
    id: "fire",
    name: "消防工程",
    tier: "secondary",
    summary: "消防栓、灑水、警報系統規劃設計。",
    description:
      "消防栓、灑水、警報系統規劃設計，配合消防法規審查與現場會勘。",
    tags: ["灑水系統", "火警受信", "法規審查"],
  },
];
