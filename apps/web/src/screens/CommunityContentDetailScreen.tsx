"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  contentTypeLabel,
  formatContentWhen,
  getExperienceById,
} from "@life-community-os/tenant-life-panoramica";
import {
  AuthorCard,
  Button,
  CommentPreview,
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ReactionBar,
  ZoomableImage,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";

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

  const submitComment = () => {
    if (!canComment) return;
    addComment(content.id, draft);
    setDraft("");
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={content.title}
        onBack={() => router.push("/community")}
        onExit={() => router.push("/community")}
      />

      <article className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]">
        {content.imageUrl ? (
          <ZoomableImage
            src={content.imageUrl}
            alt=""
            zoomable
            fill={false}
            className="aspect-[16/9] w-full"
            wrapperClassName="h-auto w-full"
          />
        ) : null}
        <div className="space-y-4 p-5">
          <AuthorCard
            name={content.author.name}
            avatarUrl={content.author.avatarUrl}
            official={content.isOfficial}
            meta={[
              contentTypeLabel(content.type),
              formatContentWhen(content.publishedAt ?? content.createdAt),
              content.areaLabel,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
          <p className="text-[17px] leading-7 text-[var(--color-text-secondary)]">
            {content.body}
          </p>
          {linked ? (
            <button
              type="button"
              onClick={() => router.push(`/experiences/${linked.id}`)}
              className="w-full rounded-[var(--radius-md)] bg-[var(--color-action-primary-subtle)] px-4 py-3 text-left text-[15px] font-semibold text-[var(--color-action-primary)]"
            >
              Actividad relacionada · {linked.title}
            </button>
          ) : null}
          <ReactionBar
            acknowledgeCount={content.reactionCounts.acknowledge}
            supportCount={content.reactionCounts.support}
            myReaction={getMyReaction(content.id)}
            commentCount={content.commentCount}
            saved={isSaved(content.id)}
            reported={isReported(content.id)}
            canReact={canReact}
            canComment={canComment}
            canSave={canSave}
            onAcknowledge={() => toggleReaction(content.id, "acknowledge")}
            onSupport={() => toggleReaction(content.id, "support")}
            onComment={() => undefined}
            onSave={() => toggleSave(content.id)}
            onReport={
              canReport ? () => reportContent(content.id) : undefined
            }
          />
        </div>
      </article>

      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold">Conversación</h2>
        {content.comments.length === 0 ? (
          <p className="text-[15px] text-[var(--color-text-secondary)]">
            Empieza una conversación útil — cercana y de buen tono.
          </p>
        ) : (
          <div className="space-y-3">
            {content.comments.map((c) => (
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
          <div className="space-y-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
            <label className="block">
              <span className="mb-1 block text-[15px] font-semibold">
                Añadir un comentario
              </span>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder="Responde o menciona con @Nombre…"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3 text-[16px] leading-6 outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
              />
            </label>
            <Button
              fullWidth
              disabled={draft.trim().length < 2}
              onClick={submitComment}
            >
              Publicar comentario
            </Button>
          </div>
        ) : null}
      </section>
    </MobileScreen>
  );
}
