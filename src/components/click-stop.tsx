"use client";

import type { ReactNode } from "react";

export function ClickStop({ children }: { children: ReactNode }) {
  return <div onClick={(e) => e.stopPropagation()}>{children}</div>;
}
