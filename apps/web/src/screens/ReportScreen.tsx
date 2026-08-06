"use client";

import { MediaCapturePlaceholder, Button } from "@life-community-os/ui";
import { useRouter } from "next/navigation";

/** Incident report foundation — camera pattern prepared (ADR-020), no storage. */
export function ReportScreen() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-[15px] font-semibold text-[var(--color-action-primary)]"
      >
        ← Back
      </button>
      <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold">
        Report a problem
      </h1>
      <p className="text-[16px] leading-6 text-[var(--color-text-secondary)]">
        Take a photo and tell us what’s wrong. We’ll keep you updated.
      </p>
      <MediaCapturePlaceholder />
      <label className="block">
        <span className="mb-2 block text-[14px] font-semibold">Where</span>
        <select className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-3 text-[16px]">
          <option>Aldea Golf</option>
          <option>Detinsa</option>
          <option>Valle Golf</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-[14px] font-semibold">
          What happened
        </span>
        <textarea
          rows={4}
          placeholder="Short description…"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-3 text-[16px] leading-6 outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
        />
      </label>
      <Button fullWidth type="button" onClick={() => router.push("/")}>
        Submit
      </Button>
    </div>
  );
}
