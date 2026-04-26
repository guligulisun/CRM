"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { DevDetailModal } from "./dev-detail-modal";

type ProjectInfo = {
  id: string;
  kind: string;
  customer: string;
  name: string;
  description: string;
  sales: string;
  pm: string;
  rd: string;
  status: string;
  devStage: string;
  updatedAt: string;
};

type Entry = { id: string; date: string; content: string; person?: string };

type ModalEntry = {
  project: ProjectInfo;
  milestones: Entry[];
  tracking: Entry[];
};

const Ctx = createContext<((id: string) => void) | null>(null);

export function DevModalManager({
  modals,
  pms,
  rds,
  progressPeople,
  updateProjectAction,
  updateDevStageAction,
  removeAction,
  addMilestoneAction,
  updateMilestoneAction,
  deleteMilestoneAction,
  addDevTrackingAction,
  updateDevTrackingAction,
  deleteDevTrackingAction,
  children,
}: {
  modals: Record<string, ModalEntry>;
  pms: string[];
  rds: string[];
  progressPeople: string[];
  updateProjectAction: (formData: FormData) => Promise<void>;
  updateDevStageAction: (formData: FormData) => Promise<void>;
  removeAction: (id: string) => Promise<void>;
  addMilestoneAction: (formData: FormData) => Promise<void>;
  updateMilestoneAction: (formData: FormData) => Promise<void>;
  deleteMilestoneAction: (id: string) => Promise<void>;
  addDevTrackingAction: (formData: FormData) => Promise<void>;
  updateDevTrackingAction: (formData: FormData) => Promise<void>;
  deleteDevTrackingAction: (id: string) => Promise<void>;
  children: ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const data = openId ? modals[openId] : null;

  return (
    <Ctx.Provider value={setOpenId}>
      {children}
      {data && (
        <DevDetailModal
          key={openId}
          project={data.project}
          milestones={data.milestones}
          tracking={data.tracking}
          pms={pms}
          rds={rds}
          progressPeople={progressPeople}
          controlledOpen={true}
          onClose={() => setOpenId(null)}
          updateProjectAction={updateProjectAction}
          updateDevStageAction={updateDevStageAction}
          removeAction={async (id) => {
            await removeAction(id);
            setOpenId(null);
          }}
          addMilestoneAction={addMilestoneAction}
          updateMilestoneAction={updateMilestoneAction}
          deleteMilestoneAction={deleteMilestoneAction}
          addDevTrackingAction={addDevTrackingAction}
          updateDevTrackingAction={updateDevTrackingAction}
          deleteDevTrackingAction={deleteDevTrackingAction}
        />
      )}
    </Ctx.Provider>
  );
}

export function DevNameTrigger({
  id,
  label,
  title,
}: {
  id: string;
  label: string;
  title?: string;
}) {
  const open = useContext(Ctx);
  return (
    <button
      type="button"
      onClick={() => open?.(id)}
      title={title}
      className="block w-full truncate text-left font-medium text-blue-600 hover:text-blue-700 hover:underline"
    >
      {label}
    </button>
  );
}
