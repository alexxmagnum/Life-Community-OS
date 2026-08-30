"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminCard, AdminOperationsShell } from "@/components/admin/AdminOperationsShell";
import { useTenant } from "@/providers/TenantProvider";

type PostRow = { id: string; title: string; status: string; body: string };
type CommentRow = { id: string; body: string; status: string };
type ListingRow = { id: string; title: string; status: string };
type HelpRow = { id: string; title: string; status: string };

export function AdminModerationScreen() {
  const { tenantSlug } = useTenant();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [help, setHelp] = useState<HelpRow[]>([]);
  const [reason, setReason] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/moderation", {
      cache: "no-store",
      headers: { "x-tenant-slug": tenantSlug },
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      posts?: PostRow[];
      comments?: CommentRow[];
      listings?: ListingRow[];
      help?: HelpRow[];
    };
    setPosts(data.posts ?? []);
    setComments(data.comments ?? []);
    setListings(data.listings ?? []);
    setHelp(data.help ?? []);
  }, [tenantSlug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminOperationsShell title="Moderation Center" section="moderation">
      <input
        className="min-h-[44px] w-full rounded-[12px] border px-3"
        placeholder="Motivo (quién / cuándo se registra en audit log)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <AdminCard title="Publicaciones">
        <ModerationList
          items={posts}
          onAction={(id, status) =>
            void fetch(`/api/community/posts/${id}/moderate`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-tenant-slug": tenantSlug,
              },
              body: JSON.stringify({ status, reason, tenantId: tenantSlug }),
            }).then(() => refresh())
          }
        />
      </AdminCard>
      <AdminCard title="Comentarios">
        <ModerationList
          items={comments.map((item) => ({ ...item, title: item.body }))}
          onAction={(id, status) =>
            void fetch(`/api/community/comments/${id}/moderate`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-tenant-slug": tenantSlug,
              },
              body: JSON.stringify({ status, reason, tenantId: tenantSlug }),
            }).then(() => refresh())
          }
        />
      </AdminCard>
      <AdminCard title="Marketplace">
        <ModerationList
          items={listings}
          restore={false}
          onAction={(id, status) =>
            void fetch(
              status === "archived"
                ? `/api/marketplace/${id}/archive`
                : `/api/marketplace/${id}`,
              {
                method: status === "archived" ? "POST" : "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "x-tenant-slug": tenantSlug,
                },
                body: JSON.stringify(
                  status === "archived" ? {} : { status: "published" },
                ),
              },
            ).then(() => refresh())
          }
        />
      </AdminCard>
      <AdminCard title="Ayuda">
        <ModerationList
          items={help}
          restore={false}
          onAction={(id) =>
            void fetch(`/api/help/${id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "x-tenant-slug": tenantSlug,
              },
              body: JSON.stringify({ status: "closed" }),
            }).then(() => refresh())
          }
        />
      </AdminCard>
    </AdminOperationsShell>
  );
}

function ModerationList({
  items,
  onAction,
  restore = true,
}: {
  items: { id: string; title: string; status: string }[];
  onAction: (id: string, status: "hidden" | "archived" | "published") => void;
  restore?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="text-[13px] text-[var(--color-text-secondary)]">
        No hay elementos.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-[12px] border border-[var(--color-border-subtle)] px-3 py-2"
        >
          <p className="text-[15px] font-medium">{item.title}</p>
          <p className="text-[12px] text-[var(--color-text-tertiary)]">{item.status}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-[32px] rounded-full border px-3 text-[12px]"
              onClick={() => onAction(item.id, "hidden")}
            >
              Ocultar
            </button>
            <button
              type="button"
              className="min-h-[32px] rounded-full border px-3 text-[12px]"
              onClick={() => onAction(item.id, "archived")}
            >
              Archivar
            </button>
            {restore ? (
              <button
                type="button"
                className="min-h-[32px] rounded-full border px-3 text-[12px]"
                onClick={() => onAction(item.id, "published")}
              >
                Restaurar
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
