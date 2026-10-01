export interface TeamMember {
  name: string;
  role: string;
  credentials: string;
}

// 僅列出常駐技師/主管，專案合作技師（如個案外部協力人員）不在此列出。
export const team: TeamMember[] = [
  {
    name: "林毓凡",
    role: "主持技師・規劃統合",
    credentials:
      "電機技師・冷凍空調技師｜交通大學控制工程研究所碩士｜約19年設計實務",
  },
  {
    name: "邱祥坤",
    role: "電機技師・設計監造",
    credentials: "電機技師｜職業安全管理師｜約26年設計實務",
  },
  {
    name: "陳文升",
    role: "資深經理",
    credentials: "電機、弱電、空調設計監造｜政府採購人員｜約20年實務",
  },
];
