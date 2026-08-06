"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppShell,
  CreateSheet,
  type CreateAction,
  type NavItem,
  type NavItemId,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

const navItems: NavItem[] = [
  { id: "home", label: "Home", href: "/", icon: "⌂" },
  { id: "discover", label: "Discover", href: "/discover", icon: "◎" },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: "▦" },
  { id: "community", label: "Community", href: "/community", icon: "◌" },
  { id: "me", label: "Me", href: "/me", icon: "☺" },
];

function activeFromPath(pathname: string): NavItemId {
  if (pathname.startsWith("/discover")) return "discover";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/me")) return "me";
  return "home";
}

export function MemberShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, hasCapability, isFeatureEnabled } = useTenant();
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const createActions = useMemo(() => {
    const actions: CreateAction[] = [];

    if (
      isFeatureEnabled("experiences") &&
      hasCapability(CAPABILITIES.experienceCreate)
    ) {
      actions.push({
        id: "experience",
        title: "Create experience",
        description: "Host a walk, class, or meetup",
        icon: "✦",
        onSelect: () => showToast("Experience composer coming next"),
      });
    }

    if (
      isFeatureEnabled("feed") &&
      hasCapability(CAPABILITIES.contentPostCreate)
    ) {
      actions.push({
        id: "post",
        title: "Share an update",
        description: "Post for neighbours",
        icon: "✎",
        onSelect: () => showToast("Post composer coming next"),
      });
    }

    if (
      isFeatureEnabled("incidents") &&
      hasCapability(CAPABILITIES.incidentCreate)
    ) {
      actions.push({
        id: "report",
        title: "Report a problem",
        description: "Take a photo and tell us",
        icon: "📷",
        onSelect: () => router.push("/report"),
      });
    }

    if (
      isFeatureEnabled("decide") &&
      hasCapability(CAPABILITIES.proposalCreate)
    ) {
      actions.push({
        id: "proposal",
        title: "Start a proposal",
        description: "Ask the community to decide",
        icon: "◈",
        onSelect: () => showToast("Proposal composer coming next"),
      });
    }

    if (isFeatureEnabled("resources")) {
      actions.push({
        id: "reserve",
        title: "Reserve a place",
        description: "Courts, rooms, shared spaces",
        icon: "▣",
        onSelect: () => router.push("/discover?segment=places"),
      });
    }

    if (
      isFeatureEnabled("recommendations") &&
      hasCapability(CAPABILITIES.recommendationCreate)
    ) {
      actions.push({
        id: "tip",
        title: "Recommend something",
        description: "Tip neighbours locally",
        icon: "★",
        onSelect: () => showToast("Recommendation composer coming next"),
      });
    }

    if (
      isFeatureEnabled("feed") &&
      hasCapability(CAPABILITIES.announcementPublishOfficial)
    ) {
      actions.push({
        id: "official",
        title: "Official notice",
        description: "Community announcement",
        icon: "⚑",
        onSelect: () => showToast("Official publish coming next"),
      });
    }

    return actions;
  }, [hasCapability, isFeatureEnabled, router]);

  return (
    <>
      <AppShell
        brandName={theme.logoText}
        items={navItems}
        activeId={activeFromPath(pathname)}
        onNavigate={(item) => router.push(item.href)}
        onCreate={() => setCreateOpen(true)}
        showCreateFab={createActions.length > 0}
      >
        {children}
      </AppShell>
      <CreateSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        actions={createActions}
      />
      {toast ? (
        <div
          className="fixed bottom-28 left-1/2 z-[60] max-w-sm -translate-x-1/2 rounded-[var(--radius-md)] bg-[var(--color-text-primary)] px-4 py-3 text-center text-[15px] text-[var(--color-text-inverse)] shadow-[var(--shadow-elev-2)] md:bottom-10"
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
