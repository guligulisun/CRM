export type Region = "TW" | "US" | "JP" | "HK" | "CN" | "SG" | "OTHER";

export type Customer = {
  id: string;
  name: string;
  region: Region;
  contact: string;
  note: string;
  createdAt: string;
};

export const PROJECT_STATUSES = [
  "提案",
  "POC",
  "報價",
  "簽約",
  "開案",
  "驗收",
  "維護",
  "修改",
  "擱置",
  "中止",
  "結案",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_KINDS = ["project", "ai", "channel", "dev"] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

export const PROJECT_KIND_LABEL: Record<ProjectKind, string> = {
  project: "專案Pipeline",
  ai: "解鎖AI Pipeline",
  channel: "通路 Pipeline",
  dev: "開發",
};

export type Project = {
  id: string;
  kind: ProjectKind;
  customer: string;
  name: string;
  description: string;
  source: string;
  siPartner: string;
  sales: string;
  pm: string;
  rd: string;
  status: ProjectStatus;
  amount: number;
  nextReviewDate: string;
  rdStatus: RdStatus;
  devStage?: string;
  createdAt: string;
  updatedAt: string;
};

export const RD_STATUSES = ["", "啟動", "結束"] as const;
export type RdStatus = (typeof RD_STATUSES)[number];

export const DEV_STAGES = ["需求", "開發", "測試", "完成", "停止", "擱置"] as const;
export type DevStage = (typeof DEV_STAGES)[number];

export type TrackingKind = "auto" | "manual";

export type TrackingEntry = {
  id: string;
  projectId: string;
  date: string;
  content: string;
  kind: TrackingKind;
  changedField?: string;
  person?: string;
};

export const PERSON_KINDS = ["pm", "rd", "sales", "siPartner"] as const;
export type PersonKind = (typeof PERSON_KINDS)[number];

export const PERSON_KIND_LABEL: Record<PersonKind, string> = {
  pm: "PM",
  rd: "RD",
  sales: "業務",
  siPartner: "SI Partner",
};

export type Person = {
  id: string;
  kind: PersonKind;
  name: string;
};

export type Milestone = {
  id: string;
  projectId: string;
  date: string;
  content: string;
};

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  allowedPages: string[];
};

export const APP_PAGES = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "專案Pipeline" },
  { href: "/ai-projects", label: "解鎖AI Pipeline" },
  { href: "/channel", label: "通路 Pipeline" },
  { href: "/dev-list", label: "產品/專案開發列表" },
  { href: "/customers", label: "客戶" },
  { href: "/products", label: "產品推廣" },
  { href: "/settings", label: "設定" },
];

export type ProductStage = "Discovery" | "Validation" | "Build" | "Launch" | "Scale" | "Sunset";

export type Product = {
  id: string;
  name: string;
  targetMarket: string;
  owner: string;
  stage: ProductStage;
  milestone: string;
  progressPct: number;
  nextAction: string;
  note: string;
  updatedAt: string;
};
