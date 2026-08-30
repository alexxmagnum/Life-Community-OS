"use client";

import { useCallback, useEffect, useState } from "react";
import type { MembershipRole } from "@life-community-os/types";
import { AdminCard, AdminOperationsShell } from "@/components/admin/AdminOperationsShell";
import { useTenant } from "@/providers/TenantProvider";

type MemberRow = {
  membershipId: string;
  personId: string;
  role: MembershipRole;
  status: string;
  email: string | null;
  displayName: string | null;
};

const ROLES: MembershipRole[] = [
  "member",
  "group_manager",
  "moderator",
  "administrator",
];

export function AdminMembersScreen() {
  const { tenantSlug } = useTenant();
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(
      `/api/admin/memberships${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      { cache: "no-store", headers: { "x-tenant-slug": tenantSlug } },
    );
    if (!res.ok) return;
    const data = (await res.json()) as { members?: MemberRow[] };
    setMembers(data.members ?? []);
  }, [query, tenantSlug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminOperationsShell title="Miembros" section="members">
      <input
        className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-subtle)] bg-transparent px-3"
        placeholder="Buscar por nombre o email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <AdminCard title={`Directorio (${members.length})`}>
        <ul className="space-y-3">
          {members.map((member) => (
            <li
              key={member.membershipId}
              className="rounded-[12px] border border-[var(--color-border-subtle)] px-3 py-2"
            >
              <p className="text-[15px] font-medium">
                {member.displayName || member.email || member.personId}
              </p>
              <p className="text-[12px] text-[var(--color-text-tertiary)]">
                {member.status} · {member.email || member.personId}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  className="min-h-[36px] flex-1 rounded-[10px] border border-[var(--color-border-subtle)] bg-transparent px-2"
                  value={member.role}
                  onChange={(e) =>
                    void (async () => {
                      const res = await fetch("/api/admin/memberships", {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          "x-tenant-slug": tenantSlug,
                        },
                        body: JSON.stringify({
                          personId: member.personId,
                          role: e.target.value,
                        }),
                      });
                      setMessage(
                        res.status === 403
                          ? "Cambio de rol denegado."
                          : res.ok
                            ? "Rol actualizado."
                            : "No se pudo actualizar.",
                      );
                      await refresh();
                    })()
                  }
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="min-h-[36px] rounded-full border px-3 text-[13px]"
                  onClick={() =>
                    void (async () => {
                      await fetch("/api/admin/memberships", {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          "x-tenant-slug": tenantSlug,
                        },
                        body: JSON.stringify({
                          personId: member.personId,
                          status:
                            member.status === "active" ? "inactive" : "active",
                        }),
                      });
                      await refresh();
                    })()
                  }
                >
                  {member.status === "active" ? "Bloquear" : "Reactivar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>
      <AdminCard title="Invitar">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              const res = await fetch("/api/admin/memberships", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-tenant-slug": tenantSlug,
                },
                body: JSON.stringify({ email, role: "member" }),
              });
              setMessage(res.ok ? "Invitación registrada." : "No se pudo invitar.");
              setEmail("");
            })();
          }}
        >
          <input
            className="min-h-[44px] flex-1 rounded-[12px] border border-[var(--color-border-subtle)] px-3"
            type="email"
            required
            placeholder="email@comunidad.test"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="min-h-[44px] rounded-[12px] bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white"
          >
            Invitar
          </button>
        </form>
        {message ? (
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            {message}
          </p>
        ) : null}
      </AdminCard>
    </AdminOperationsShell>
  );
}
