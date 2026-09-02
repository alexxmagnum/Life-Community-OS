"use client";

/**
 * CommunityLaunchChecklist — admin guide to activate a real territory.
 * Manual checklist only — no automation, no fake data.
 */

import { useRouter } from "next/navigation";

const CHECKLIST_ITEMS = [
  {
    id: "places",
    label: "Configurar lugares",
    href: "/admin/territory",
  },
  {
    id: "public-info",
    label: "Añadir información pública",
    href: "/admin/territory",
  },
  {
    id: "announcement",
    label: "Publicar primer aviso",
    href: "/community/announcements/create",
  },
  {
    id: "experience",
    label: "Crear primera experiencia",
    href: "/experiences/create",
  },
  {
    id: "services",
    label: "Revisar servicios locales",
    href: "/admin/businesses",
  },
  {
    id: "invite",
    label: "Invitar residentes",
    href: "/admin/members",
  },
] as const;

export function CommunityLaunchChecklist() {
  const router = useRouter();

  return (
    <div className="rounded-[16px] border border-[var(--color-border-subtle)] p-4">
      <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
        Checklist de lanzamiento
      </p>
      <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
        Pasos para activar un territorio real. Marca mentalmente al completar cada
        uno — no se genera contenido automáticamente.
      </p>
      <ul className="mt-3 space-y-2">
        {CHECKLIST_ITEMS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => router.push(item.href)}
              className="flex w-full items-start gap-2 rounded-[12px] border border-[var(--color-border-subtle)] px-3 py-2.5 text-left"
            >
              <span
                className="mt-0.5 inline-flex h-4 w-4 shrink-0 rounded border border-[var(--color-border-strong)]"
                aria-hidden
              />
              <span className="text-[14px] text-[var(--color-text-primary)]">
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
