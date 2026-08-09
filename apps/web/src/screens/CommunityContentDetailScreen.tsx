"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  contentTypeLabel,
  formatContentWhen,
  getExperienceById,
} from "@life-community-os/tenant-life-panoramica";
import {
  Avatar,
  CommentPreview,
  EmptyState,
  FlowScreenHeader,
  InlineCommentComposer,
  MobileScreen,
  ReactionBar,
  ZoomableImage,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";

function detailChromeTitle(type: string, official: boolean): string {
  if (official) return "Aviso";
  if (type === "proposal") return "Propuesta";
  if (type === "discussion") return "Conversación";
  return "Publicación";
}

export function CommunityContentDetailScreen({
  contentId,
}: {
  contentId: string;
}) {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const {
    getContent,
    getMyReaction,
    isSaved,
    isReported,
    toggleReaction,
    toggleSave,
    reportContent,
    addComment,
  } = useCommunityInteractions();
  const [draft, setDraft] = useState("");

  if (!isFeatureEnabled("feed") && !isFeatureEnabled("interactions")) {
    return (
      <EmptyState
        title="La comunidad no está disponible"
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
  }

  if (!hasCapability(CAPABILITIES.contentView)) {
    return (
      <EmptyState
        title="Sin acceso"
        description="Este contenido no está disponible para tu cuenta."
      />
    );
  }

  const content = getContent(contentId);

  if (!content || content.status === "archived") {
    return (
      <EmptyState
        title="Contenido no encontrado"
        description="Puede haberse eliminado o aún no está publicado."
        actionLabel="Volver a Comunidad"
        onAction={() => router.push("/community")}
      />
    );
  }

  if (content.status === "pending_review") {
    return (
      <EmptyState
        title="Pendiente de revisión"
        description="Esta actualización aún no es visible para todos."
        actionLabel="Volver a Comunidad"
        onAction={() => router.push("/community")}
      />
    );
  }

  if (content.status !== "published" && content.status !== "expired") {
    return (
      <EmptyState
        title="No disponible"
        actionLabel="Volver a Comunidad"
        onAction={() => router.push("/community")}
      />
    );
  }

  const linked = content.linkedExperienceId
    ? getExperienceById(content.linkedExperienceId)
    : undefined;

  const canReact = hasCapability(CAPABILITIES.interactionReact);
  const canComment = hasCapability(CAPABILITIES.interactionComment);
  const canSave = hasCapability(CAPABILITIES.interactionSave);
  const canReport = hasCapability(CAPABILITIES.interactionReport);

  const zone =
    content.areaLabel && content.areaLabel !== "Life Panoramica"
      ? content.areaLabel
      : undefined;

  const visibleComments = content.comments.filter(
    (c) => c.body.trim().length >= 8,
  );

  const submitComment = () => {
    if (!canComment) return;
    const body = draft.trim();
    if (body.length < 8) return;
    addComment(content.id, body);
    setDraft("");
  };

  return (
    <MobileScreen dense>
      <FlowScreenHeader
        title={detailChromeTitle(content.type, content.isOfficial)}
        onBack={() => router.push("/community")}
        onExit={() => router.push("/community")}
      />

      {content.imageUrl ? (
        <ZoomableImage
          src={content.imageUrl}
          alt=""
          zoomable
          fill={false}
          className="aspect-[16/10] w-full rounded-[12px]"
          wrapperClassName="h-auto w-full overflow-hidden rounded-[12px]"
        />
      ) : null}

      <article className="space-y-3">
        <div className="flex items-center gap-2.5">
          {content.isOfficial ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-primary-subtle)] text-[13px] font-semibold text-[var(--color-action-primary)]">
              {content.author.name.slice(0, 1).toUpperCase()}
            </span>
          ) : (
            <Avatar
              src={content.author.avatarUrl}
              alt={content.author.name}
              size="sm"
              zoomable={false}
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
              {content.author.name}
              {content.isOfficial ? (
                <span className="ml-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-accent-official)]">
                  Oficial
                </span>
              ) : null}
            </p>
            <p className="text-[12px] text-[var(--color-text-tertiary)]">
              {[
                contentTypeLabel(content.type),
                formatContentWhen(content.publishedAt ?? content.createdAt),
                zone,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-[20px] font-semibold leading-snug text-[var(--color-text-primary)]">
            {content.title}
          </h2>
          <p className="mt-2 text-[15px] leading-6 text-[var(--color-text-secondary)]">
            {content.body}
          </p>
        </div>

        {linked ? (
          <button
            type="button"
            onClick={() => router.push(`/experiences/${linked.id}`)}
            className="text-left text-[14px] font-semibold text-[var(--color-action-primary)]"
          >
            {linked.title} →
          </button>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--color-border-subtle)] pt-2">
          <ReactionBar
            variant="quiet"
            acknowledgeCount={content.reactionCounts.acknowledge}
            supportCount={content.reactionCounts.support}
            myReaction={getMyReaction(content.id)}
            commentCount={content.commentCount}
            canReact={canReact}
            canComment={false}
            canSave={false}
            onAcknowledge={() => toggleReaction(content.id, "acknowledge")}
            onSupport={() => toggleReaction(content.id, "support")}
          />
          {canSave ? (
            <button
              type="button"
              onClick={() => toggleSave(content.id)}
              className="min-h-[32px] text-[12px] font-medium text-[var(--color-text-tertiary)]"
              aria-pressed={isSaved(content.id)}
            >
              {isSaved(content.id) ? "Guardado" : "Guardar"}
            </button>
          ) : null}
          {canReport ? (
            <button
              type="button"
              onClick={() => reportContent(content.id)}
              disabled={isReported(content.id)}
              className="min-h-[32px] text-[12px] font-medium text-[var(--color-text-tertiary)] disabled:opacity-50"
            >
              {isReported(content.id) ? "Avisado" : "Avisar"}
            </button>
          ) : null}
        </div>
      </article>

      <section className="space-y-2 border-t border-[var(--color-border-subtle)] pt-3">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          Conversación
          {visibleComments.length > 0 ? (
            <span className="ml-1.5 font-normal text-[var(--color-text-tertiary)]">
              {visibleComments.length}
            </span>
          ) : null}
        </h2>

        {visibleComments.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Sé el primero en responder.
          </p>
        ) : (
          <div className="space-y-2.5">
            {visibleComments.map((c) => (
              <CommentPreview
                key={c.id}
                authorName={c.author.name}
                body={c.body}
                avatarUrl={c.author.avatarUrl}
                meta={formatContentWhen(c.createdAt)}
              />
            ))}
          </div>
        )}

        {canComment ? (
          <InlineCommentComposer
            compact
            value={draft}
            onChange={setDraft}
            onSubmit={submitComment}
            placeholder="Escribe un comentario…"
          />
        ) : null}
      </section>
    </MobileScreen>
  );
}
