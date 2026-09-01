"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminCard, AdminOperationsShell } from "@/components/admin/AdminOperationsShell";
import { fetchCommunityCommunication } from "@/lib/community/communication-client";
import { useTenant } from "@/providers/TenantProvider";
import type { CommunityCommunicationContext } from "@life-community-os/types";

export function AdminCommunicationScreen() {
  const { tenantSlug } = useTenant();
  const [communication, setCommunication] =
    useState<CommunityCommunicationContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const data = await fetchCommunityCommunication({
        tenantId: tenantSlug,
      });
      if (active) {
        setCommunication(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [tenantSlug]);

  const admin = communication?.adminSummary;

  return (
    <AdminOperationsShell title="Comunicación territorial" section="communication">
      <AdminCard title="Resumen">
        {loading ? (
          <p className="text-sm text-neutral-500">Cargando comunicación…</p>
        ) : (
          <ul className="space-y-2 text-sm">
            <li>Avisos activos: {admin?.activeAnnouncements ?? 0}</li>
            <li>Canales territoriales: {admin?.territoryChannels ?? 0}</li>
            <li>Moderación pendiente: {admin?.pendingReports ?? 0}</li>
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Avisos oficiales">
        <p className="mb-3 text-sm text-neutral-600">
          Publica avisos territoriales visibles para la comunidad. No incluye mensajes privados.
        </p>
        <Link
          href="/admin/community"
          className="text-sm font-medium text-emerald-700 underline"
        >
          Gestionar avisos en Comunidad
        </Link>
      </AdminCard>

      <AdminCard title="Canales territoriales">
        {!loading && communication?.channels.length ? (
          <ul className="space-y-2 text-sm">
            {communication.channels.map((channel) => (
              <li key={channel.id} className="flex justify-between gap-2">
                <span>{channel.title}</span>
                <span className="text-neutral-500">{channel.kind}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">Sin canales activos en este territorio.</p>
        )}
      </AdminCard>

      <AdminCard title="Moderación">
        <p className="mb-3 text-sm text-neutral-600">
          Los mensajes privados no son accesibles para administración. El reportante permanece protegido.
        </p>
        <Link
          href="/admin/moderation"
          className="text-sm font-medium text-emerald-700 underline"
        >
          Abrir centro de moderación
        </Link>
      </AdminCard>

      <AdminCard title="Preferencias de comunicación">
        <p className="text-sm text-neutral-600">
          Los vecinos controlan quién puede contactarles y qué notificaciones reciben desde su perfil y privacidad.
        </p>
        <Link
          href="/admin/privacy"
          className="mt-2 inline-block text-sm font-medium text-emerald-700 underline"
        >
          Ver políticas de privacidad
        </Link>
      </AdminCard>
    </AdminOperationsShell>
  );
}
