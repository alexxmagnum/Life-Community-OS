"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  canAccessChannel,
  formatContentWhen,
  getOfficialEntityBySlug,
  listChannelsForOfficialEntity,
  listContentForOfficialEntity,
  officialEntityKindLabel,
} from "@life-community-os/tenant-life-panoramica";
import {
  CommunityPostCard,
  EmptyState,
  MobileScreen,
  ScreenBack,
  ZoomableImage,
} from "@life-community-os/ui";
import { useTenant } from "@/providers/TenantProvider";
import { channelAccessLabel } from "@/lib/demo-access-copy";

function contentTypeLabel(
  type: "announcement" | "news" | "discussion" | "proposal" | "member_update",
): string {
  switch (type) {
    case "announcement":
      return "Aviso";
    case "news":
      return "Novedad";
    case "discussion":
      return "Conversación";
    case "proposal":
      return "Propuesta";
    case "member_update":
      return "Actualización";
    default:
      return "Información";
  }
}

/**
 * Official Entity hub — reliable information from the entity responsible
 * for the territory. Not a business, service marketplace, or community chat.
 */
export function OfficialEntityDetailScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const { theme, demoPersonId, isFeatureEnabled } = useTenant();

  const entity = useMemo(() => getOfficialEntityBySlug(slug), [slug]);

  const channels = useMemo(
    () => (entity ? listChannelsForOfficialEntity(entity.id) : []),
    [entity],
  );
  const communications = useMemo(
    () => (entity ? listContentForOfficialEntity(entity.id) : []),
    [entity],
  );

  if (!entity) {
    return (
      <MobileScreen>
        <ScreenBack onClick={() => router.back()} />
        <EmptyState
          title="Entidad no encontrada"
          description="Esta entidad oficial no forma parte de tu comunidad."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  const contact = entity.contact;
  const hasContact = Boolean(
    contact?.email || contact?.phone || contact?.website || contact?.hours,
  );

  return (
    <MobileScreen>
      <ScreenBack label="Oficial" onClick={() => router.back()} />

      {/* 1. Identity */}
      <section className="overflow-hidden rounded-[24px] bg-[var(--color-surface-muted)]">
        {entity.imageUrl ? (
          <div className="relative aspect-[16/10]">
            <ZoomableImage
              src={entity.imageUrl}
              alt={entity.name}
              wrapperClassName="absolute inset-0 h-full w-full"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(transparent 40%, rgba(20,28,24,0.72))",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-[13px] font-semibold text-white/80">
                {theme.logoText} · Oficial
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8 text-white">
                {entity.name}
              </h1>
            </div>
          </div>
        ) : (
          <div className="space-y-2 px-4 pt-4">
            <p className="text-[13px] font-semibold text-[var(--color-text-tertiary)]">
              {theme.logoText} · Oficial
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8 text-[var(--color-text-primary)]">
              {entity.name}
            </h1>
          </div>
        )}
        <div className="space-y-2 px-4 py-4">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-official)]">
            {officialEntityKindLabel(entity.kind)}
          </p>
          <p className="text-[15px] leading-6 text-[var(--color-text-secondary)]">
            {entity.description}
          </p>
        </div>
      </section>

      {/* 2. Information / communications */}
      {isFeatureEnabled("feed") || isFeatureEnabled("officialChannels") ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
            Información
          </h2>
          <p className="text-[13px] text-[var(--color-text-tertiary)]">
            Avisos y comunicaciones de esta entidad.
          </p>
          {communications.length === 0 ? (
            <EmptyState title="No hay información publicada todavía." />
          ) : (
            <div className="flex flex-col gap-4">
              {communications.map((item) => (
                <CommunityPostCard
                  key={item.id}
                  title={item.title}
                  body={item.body}
                  typeLabel={contentTypeLabel(item.type)}
                  official
                  authorName={item.author.name}
                  authorAvatarUrl={item.author.avatarUrl}
                  meta={formatContentWhen(item.publishedAt ?? item.createdAt)}
                  areaLabel={item.areaLabel}
                  imageUrl={item.imageUrl}
                  onOpen={() => router.push(`/community/content/${item.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* 3. Contact */}
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
          Contacto
        </h2>
        {!hasContact ? (
          <EmptyState title="No hay información publicada todavía." />
        ) : (
          <div className="space-y-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 py-3.5 shadow-[var(--shadow-elev-1)]">
            {contact?.hours ? (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  Horario
                </p>
                <p className="mt-0.5 text-[15px] text-[var(--color-text-primary)]">
                  {contact.hours}
                </p>
              </div>
            ) : null}
            {contact?.phone ? (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  Teléfono
                </p>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="mt-0.5 block text-[15px] font-medium text-[var(--color-action-primary)]"
                >
                  {contact.phone}
                </a>
              </div>
            ) : null}
            {contact?.email ? (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  Email
                </p>
                <a
                  href={`mailto:${contact.email}`}
                  className="mt-0.5 block text-[15px] font-medium text-[var(--color-action-primary)]"
                >
                  {contact.email}
                </a>
              </div>
            ) : null}
            {contact?.website ? (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  Web
                </p>
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block text-[15px] font-medium text-[var(--color-action-primary)]"
                >
                  {contact.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* 4. Related community spaces (channels) */}
      {isFeatureEnabled("officialChannels") ||
      isFeatureEnabled("communityChannels") ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
            Espacios comunitarios
          </h2>
          <p className="text-[13px] text-[var(--color-text-tertiary)]">
            Canales vinculados a esta entidad.
          </p>
          {channels.length === 0 ? (
            <EmptyState title="No hay información publicada todavía." />
          ) : (
            <div className="space-y-3">
              {channels.map((ch) => {
                const access = canAccessChannel(ch, demoPersonId);
                const label = channelAccessLabel({
                  allowed: access.allowed,
                  reason: access.reason,
                  requiresVerifiedResidency: ch.requiresVerifiedResidency,
                  type: ch.type,
                });
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => router.push("/community?tab=canales")}
                    className="w-full rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)]"
                  >
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-accent-official)]">
                      {ch.type === "official" ? "Canal oficial" : "Espacio"}
                    </p>
                    <p className="mt-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
                      {ch.name}
                    </p>
                    {ch.description ? (
                      <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                        {ch.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[12px] text-[var(--color-text-tertiary)]">
                      {label.badge}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </MobileScreen>
  );
}
