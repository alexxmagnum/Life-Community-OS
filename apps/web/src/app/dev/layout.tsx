import type { ReactNode } from "react";

/**
 * Dev tooling shell — no member navigation / product chrome.
 */
export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1115] text-[#e8eaed] antialiased">
      {children}
    </div>
  );
}
