import type { ReactNode } from "react";

import { MemberShell } from "@/components/MemberShell";

export default function MemberLayout({ children }: { children: ReactNode }) {
  return <MemberShell>{children}</MemberShell>;
}
