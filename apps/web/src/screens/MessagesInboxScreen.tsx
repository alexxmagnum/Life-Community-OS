"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { conversationHref, type ConversationListItem } from "@life-community-os/types";
import {
  EmptyState,
  ExploreLink,
  MobileScreen,
  ScreenHeader,
} from "@life-community-os/ui";
import { fetchMyConversations } from "@/lib/communication/communication-client";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

function preview(item: ConversationListItem): string {
  const body = item.lastMessage?.content ?? item.lastMessage?.body ?? "";
  if (!body.trim()) return "Sin mensajes todavía";
  return body.length > 90 ? `${body.slice(0, 87)}…` : body;
}

export function MessagesInboxScreen() {
  const router = useRouter();
  const { hasCapability } = useTenant();
  const { currentUser, sessionReady } = useCurrentUser();
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionReady) return;
    if (!hasCapability(CAPABILITIES.contentView) || !currentUser.personId) {
      setItems([]);
      setReady(true);
      return;
    }
    void fetchMyConversations().then((list) => {
      setItems(list);
      setReady(true);
    });
  }, [currentUser.personId, hasCapability, sessionReady]);

  return (
    <MobileScreen>
      <ScreenHeader title="Mensajes" />
      {ready && items.length === 0 ? (
        <EmptyState
          title="No hay conversaciones"
          description="Cuando contactes con un vecino, un grupo o un anuncio, el hilo aparecerá aquí."
        />
      ) : (
        items.map((item) => (
          <ExploreLink
            key={item.conversation.id}
            label={
              item.conversation.title ||
              item.conversation.contextType ||
              "Conversación"
            }
            hint={preview(item)}
            onClick={() =>
              router.push(
                conversationHref(item.conversation) ||
                  `/messages/${item.conversation.id}`,
              )
            }
          />
        ))
      )}
    </MobileScreen>
  );
}
