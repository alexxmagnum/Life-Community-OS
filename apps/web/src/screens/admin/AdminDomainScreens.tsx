"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CommunityGovernanceContext,
  Property,
  PublicGovernanceReport,
} from "@life-community-os/types";
import { AdminCard, AdminOperationsShell } from "@/components/admin/AdminOperationsShell";
import { useTenant } from "@/providers/TenantProvider";
import {
  applySafetyAction,
  createCommunityRule,
  fetchGovernanceContext,
  fetchGovernanceReports,
  reviewGovernanceReport,
} from "@/lib/governance/governance-client";

export function AdminHousingScreen() {
  const { tenantSlug } = useTenant();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/housing?tenantId=${encodeURIComponent(tenantSlug)}`, {
        cache: "no-store",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { properties?: Property[] };
      setProperties(data.properties ?? []);
    })();
  }, [tenantSlug]);

  return (
    <AdminOperationsShell title="Housing" section="housing">
      <AdminCard title="Propiedades del tenant">
        {properties.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            No hay viviendas registradas.
          </p>
        ) : (
          <ul className="space-y-2">
            {properties.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full rounded-[12px] border px-3 py-2 text-left"
                  onClick={() => router.push(`/housing/${item.id}`)}
                >
                  <span className="block text-[15px] font-medium">{item.title ?? item.name}</span>
                  <span className="block text-[13px] text-[var(--color-text-tertiary)]">
                    {item.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </AdminOperationsShell>
  );
}

export function AdminCommunityScreen() {
  const { tenantSlug } = useTenant();
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);
  const [context, setContext] = useState<CommunityGovernanceContext | null>(null);
  const [reports, setReports] = useState<PublicGovernanceReport[]>([]);
  const [ruleTitle, setRuleTitle] = useState("");
  const [ruleBody, setRuleBody] = useState("");

  const refresh = useCallback(() => {
    void (async () => {
      const res = await fetch("/api/admin/moderation", {
        cache: "no-store",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (res.ok) {
        const data = (await res.json()) as { posts?: unknown[] };
        setCount(data.posts?.length ?? 0);
      }
    })();
    void fetchGovernanceContext({ tenantId: tenantSlug }).then(setContext);
    void fetchGovernanceReports({ tenantId: tenantSlug }).then(setReports);
  }, [tenantSlug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pending = reports.filter(
    (item) => item.status === "open" || item.status === "reviewing",
  );

  return (
    <AdminOperationsShell title="Gestión de la comunidad" section="community">
      <AdminCard title="Reportes pendientes">
        {context && !context.permissions.reviewReports ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Tu rol territorial no revisa reportes.
          </p>
        ) : pending.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            No hay avisos abiertos en este territorio.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.map((item) => (
              <li
                key={item.id}
                className="rounded-[12px] border border-[var(--color-border-subtle)] px-3 py-2"
              >
                <p className="text-[15px] font-medium">
                  {item.entityType} · {item.reason}
                </p>
                <p className="text-[12px] text-[var(--color-text-tertiary)]">
                  Reportante protegido · {item.status}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="min-h-[32px] rounded-full border px-3 text-[12px]"
                    onClick={() =>
                      void reviewGovernanceReport({
                        tenantId: tenantSlug,
                        reportId: item.id,
                        status: "dismissed",
                      }).then(refresh)
                    }
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    className="min-h-[32px] rounded-full border px-3 text-[12px]"
                    onClick={() =>
                      void applySafetyAction({
                        tenantId: tenantSlug,
                        type: "hide",
                        entityType: item.entityType,
                        entityId: item.entityId,
                        reportId: item.id,
                      }).then(() =>
                        reviewGovernanceReport({
                          tenantId: tenantSlug,
                          reportId: item.id,
                          status: "resolved",
                        }).then(refresh),
                      )
                    }
                  >
                    Ocultar contenido
                  </button>
                  <button
                    type="button"
                    className="min-h-[32px] rounded-full border px-3 text-[12px]"
                    onClick={() =>
                      void reviewGovernanceReport({
                        tenantId: tenantSlug,
                        reportId: item.id,
                        status: "resolved",
                        contactCreator: true,
                      }).then(refresh)
                    }
                  >
                    Contactar creador
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
      <AdminCard title="Normas activas">
        {(context?.rules.filter((rule) => rule.active) ?? []).length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Este territorio aún no ha definido normas. No hay reglas globales.
          </p>
        ) : (
          <ul className="space-y-2">
            {context?.rules
              .filter((rule) => rule.active)
              .map((rule) => (
                <li key={rule.id}>
                  <p className="text-[15px] font-medium">{rule.title}</p>
                  <p className="text-[13px] text-[var(--color-text-secondary)]">
                    {rule.description}
                  </p>
                </li>
              ))}
          </ul>
        )}
        {context?.permissions.manageLocalRules ? (
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              void createCommunityRule({
                tenantId: tenantSlug,
                title: ruleTitle,
                description: ruleBody,
              }).then((ok) => {
                if (ok) {
                  setRuleTitle("");
                  setRuleBody("");
                  refresh();
                }
              });
            }}
          >
            <input
              className="min-h-[44px] w-full rounded-[12px] border px-3"
              placeholder="Título de la norma"
              value={ruleTitle}
              onChange={(event) => setRuleTitle(event.target.value)}
            />
            <input
              className="min-h-[44px] w-full rounded-[12px] border px-3"
              placeholder="Descripción"
              value={ruleBody}
              onChange={(event) => setRuleBody(event.target.value)}
            />
            <button
              type="submit"
              className="min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white"
            >
              Añadir norma territorial
            </button>
          </form>
        ) : null}
      </AdminCard>
      <AdminCard title="Moderadores">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {context?.roles.administrator
            ? "TerritoryAdministrator · configuración, roles y seguridad."
            : context?.roles.moderator
              ? "TerritoryModerator · revisa reportes de este territorio."
              : context?.roles.groupManager
                ? "GroupManager · gestiona su grupo, sin salir del territorio."
                : "Los roles se asignan en Members. No existe un moderador global."}
        </p>
      </AdminCard>
      <AdminCard title="Actividad territorial">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {count == null
            ? "Cargando publicaciones del territorio…"
            : `${count} publicaciones. La confianza no se usa como castigo.`}
        </p>
        <button
          type="button"
          className="mt-3 min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white"
          onClick={() => router.push("/admin/moderation")}
        >
          Abrir moderación de contenido
        </button>
        <button
          type="button"
          className="mt-2 min-h-[40px] w-full rounded-full border px-4 text-[13px]"
          onClick={() => router.push("/community")}
        >
          Ver comunidad
        </button>
      </AdminCard>
    </AdminOperationsShell>
  );
}

export function AdminMarketplaceScreen() {
  const { tenantSlug } = useTenant();
  const router = useRouter();
  const [listings, setListings] = useState<number | null>(null);
  const [help, setHelp] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/moderation", {
        cache: "no-store",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        listings?: unknown[];
        help?: unknown[];
      };
      setListings(data.listings?.length ?? 0);
      setHelp(data.help?.length ?? 0);
    })();
  }, [tenantSlug]);

  return (
    <AdminOperationsShell title="Marketplace" section="marketplace">
      <AdminCard title="Anuncios y ayuda">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {listings == null
            ? "Cargando…"
            : `${listings} anuncios · ${help} solicitudes de ayuda.`}
        </p>
        <button
          type="button"
          className="mt-3 min-h-[40px] rounded-full border px-4 text-[13px]"
          onClick={() => router.push("/admin/moderation")}
        >
          Moderar contenido
        </button>
      </AdminCard>
    </AdminOperationsShell>
  );
}
