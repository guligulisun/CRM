"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { EditProjectModal } from "./edit-project-modal";

type ProjectInput = {
  id: string;
  customer: string;
  name: string;
  description: string;
  source: string;
  siPartner: string;
  sales: string;
  pm: string;
  rd: string;
  status: string;
  amount: number;
  rdStatus: string;
};

type TrackingInput = {
  id: string;
  date: string;
  content: string;
  kind: "auto" | "manual";
  changedField?: string;
};

type People = {
  pms: string[];
  rds: string[];
  sales: string[];
  siPartners: string[];
};

type ModalEntry = { project: ProjectInput; tracking: TrackingInput[] };

const Ctx = createContext<((id: string) => void) | null>(null);

export function ProjectModalManager({
  modals,
  statuses,
  people,
  lockedSales,
  updateAction,
  deleteAction,
  updateTrackingAction,
  deleteTrackingAction,
  children,
}: {
  modals: Record<string, ModalEntry>;
  statuses: readonly string[];
  people: People;
  lockedSales?: string;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  updateTrackingAction: (formData: FormData) => Promise<void>;
  deleteTrackingAction: (id: string, projectId: string) => Promise<void>;
  children: ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const data = openId ? modals[openId] : null;

  return (
    <Ctx.Provider value={setOpenId}>
      {children}
      {data && (
        <EditProjectModal
          key={openId}
          project={data.project}
          tracking={data.tracking}
          statuses={statuses}
          people={people}
          controlledOpen={true}
          lockedSales={lockedSales}
          onClose={() => setOpenId(null)}
          updateAction={updateAction}
          deleteAction={deleteAction}
          updateTrackingAction={updateTrackingAction}
          deleteTrackingAction={deleteTrackingAction}
        />
      )}
    </Ctx.Provider>
  );
}

export function useOpenProject() {
  return useContext(Ctx);
}

export function ProjectNameTrigger({
  id,
  label,
  title,
  className,
}: {
  id: string;
  label: string;
  title?: string;
  className?: string;
}) {
  const open = useContext(Ctx);
  return (
    <button
      type="button"
      onClick={() => open?.(id)}
      title={title}
      className={
        className ??
        "block w-full truncate text-left font-medium text-blue-600 hover:text-blue-700 hover:underline"
      }
    >
      {label}
    </button>
  );
}
