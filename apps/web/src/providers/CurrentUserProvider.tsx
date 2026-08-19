"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_CURRENT_USER,
  type CurrentUserContext,
} from "@life-community-os/auth";

export type CurrentUserSession = CurrentUserContext & {
  configured: boolean;
  local: boolean;
  tenantDenied: boolean;
  memberships: Array<{ tenantId: string; membershipId: string; role: string }>;
};

const EMPTY_SESSION: CurrentUserSession = {
  ...EMPTY_CURRENT_USER,
  configured: false,
  local: false,
  tenantDenied: false,
  memberships: [],
};

type CurrentUserValue = {
  currentUser: CurrentUserSession;
  sessionReady: boolean;
  refreshSession: () => Promise<void>;
};

const CurrentUserReactContext = createContext<CurrentUserValue | null>(null);

function readTenantHint(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith("lcos-tenant-slug="));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice("lcos-tenant-slug=".length));
  } catch {
    return match.slice("lcos-tenant-slug=".length);
  }
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<CurrentUserSession>(EMPTY_SESSION);
  const [sessionReady, setSessionReady] = useState(false);

  const refreshSession = useCallback(async () => {
    const tenantHint = readTenantHint();
    const res = await fetch("/api/auth/session", {
      cache: "no-store",
      headers: tenantHint ? { "x-tenant-slug": tenantHint } : undefined,
    });
    const data = (await res.json()) as {
      configured?: boolean;
      authenticated?: boolean;
      local?: boolean;
      userId?: string | null;
      personId?: string | null;
      tenantId?: string | null;
      membershipId?: string | null;
      role?: CurrentUserContext["role"];
      permissions?: string[];
      email?: string | null;
      displayName?: string | null;
      hasMembership?: boolean;
      tenantDenied?: boolean;
      user?: { id: string; email: string | null } | null;
      memberships?: Array<{ tenantId: string; membershipId: string; role: string }>;
    };
    setCurrentUser({
      userId: data.userId ?? data.user?.id ?? null,
      personId: data.personId ?? null,
      tenantId: data.tenantId ?? null,
      membershipId: data.membershipId ?? null,
      role: data.role ?? null,
      permissions: data.permissions ?? [],
      email: data.email ?? data.user?.email ?? null,
      displayName: data.displayName ?? null,
      authenticated: Boolean(data.authenticated),
      hasMembership: Boolean(data.hasMembership),
      configured: Boolean(data.configured),
      local: Boolean(data.local),
      tenantDenied: Boolean(data.tenantDenied),
      memberships: data.memberships ?? [],
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refreshSession();
      } catch {
        if (!cancelled) setCurrentUser(EMPTY_SESSION);
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, refreshSession]);

  const value = useMemo(
    () => ({ currentUser, sessionReady, refreshSession }),
    [currentUser, sessionReady, refreshSession],
  );

  return (
    <CurrentUserReactContext.Provider value={value}>
      {children}
    </CurrentUserReactContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserReactContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return ctx;
}
