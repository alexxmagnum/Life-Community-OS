"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  canAccessAdminOperations,
  canAccessAdminSection,
  type AdminOperationsSection,
} from "@life-community-os/types";
import { EmptyState, FlowScreenHeader, MobileScreen } from "@life-community-os/ui";
import { useTenant } from "@/providers/TenantProvider";

const NAV: { href: string; label: string; section: AdminOperationsSection }[] = [
  { href: "/admin", label: "Dashboard", section: "dashboard" },
  { href: "/admin/operations", label: "Operaciones", section: "operations" },
  { href: "/admin/community", label: "Comunidad", section: "community" },
  { href: "/admin/members", label: "Members", section: "members" },
  { href: "/admin/businesses", label: "Businesses", section: "businesses" },
  { href: "/admin/housing", label: "Housing", section: "housing" },
  { href: "/admin/resources", label: "Resources", section: "resources" },
  { href: "/admin/reservations", label: "Reservations", section: "reservations" },
  { href: "/admin/marketplace", label: "Marketplace", section: "marketplace" },
  { href: "/admin/moderation", label: "Moderation", section: "moderation" },
  { href: "/admin/communication", label: "Comunicación", section: "communication" },
  { href: "/admin/territory", label: "Territory", section: "territory" },
  { href: "/admin/settings", label: "Settings", section: "settings" },
  { href: "/admin/privacy", label: "Privacy", section: "privacy" },
];

export function AdminOperationsShell({
  title,
  section,
  children,
}: {
  title: string;
  section: AdminOperationsSection;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, authenticated, configuration, tenantSlug } = useTenant();

  if (!canAccessAdminOperations(role)) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Operations Center"
          onBack={() => router.push("/")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Sin acceso de administración"
          description={
            authenticated
              ? "Este espacio es para gestores, moderadores y administradores de la comunidad. No crea tenants ni cambia planes."
              : "Inicia sesión con una membresía de staff."
          }
          actionLabel="Ir a perfil"
          onAction={() => router.push("/me")}
        />
      </MobileScreen>
    );
  }

  if (!canAccessAdminSection(role, section)) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Operations Center"
          onBack={() => router.push("/admin")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Permiso insuficiente"
          description="Tu rol no puede abrir esta sección."
          actionLabel="Volver al dashboard"
          onAction={() => router.push("/admin")}
        />
      </MobileScreen>
    );
  }

  const items = NAV.filter((item) => canAccessAdminSection(role, item.section));

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={title}
        subtitle={configuration.branding.name || tenantSlug}
        onBack={() => router.push(section === "dashboard" ? "/" : "/admin")}
        onExit={() => router.push("/")}
      />
      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "whitespace-nowrap rounded-full bg-[var(--color-action-primary)] px-3 py-2 text-[13px] font-semibold text-white"
                  : "whitespace-nowrap rounded-full bg-[var(--color-surface-muted)] px-3 py-2 text-[13px] font-semibold text-[var(--color-text-secondary)]"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <section className="mt-4 space-y-4 pb-24">{children}</section>
    </MobileScreen>
  );
}

export function AdminCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-[var(--color-border-subtle)] p-4">
      <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
