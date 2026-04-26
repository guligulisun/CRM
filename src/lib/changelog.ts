export type Release = {
  version: string;
  date: string;
  notes: string[];
};

// 新版直接加在最上面
export const CHANGELOG: Release[] = [
  {
    version: "1.0.1",
    date: "2026-04-26",
    notes: [
      "專案 Pipeline：客戶 / 業務 / PM / RD / 9+1 種狀態 / 金額 / 下次檢討日，可篩選、排序、匯出 Excel",
      "解鎖 AI Pipeline：獨立 kind，業務鎖定 JJ，匯入既有 240+ 筆資料",
      "通路 Pipeline：同 pipeline 設計，獨立資料",
      "進度追蹤：每筆專案自動 / 手動追蹤紀錄、過去 14 天列表 + 即時新增",
      "投入 RD 三狀態（- / 啟動 / 結束）+ 開發進度六階段（需求 / 開發 / 測試 / 完成 / 停止 / 擱置），雙向自動連動",
      "產品 / 專案開發列表：pipeline 投入 RD 自動帶入 + 可獨立新增內部專案 / 產品",
      "Milestone（日期 + 項目）+ 進度紀錄（日期 + 人 + 內容），大表可直接新增進度",
      "可拖移的修改 modal、欄位即時編輯、共用 modal 提升大表效能",
      "PM / RD / 業務 / SI Partner 設定頁，專案下拉直接帶入",
      "帳號管理：jimmy 主帳號 + admin / 一般帳號分權，頁面層級權限，選單依權限動態顯示",
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0]?.version ?? "0.0.0";
