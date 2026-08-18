"use client";

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
  deriveReservationStatus,
  getAvailabilitySlots,
  getResourceById,
  type CommunityResource,
  type Reservation,
  type ReservationStatus,
  type TimeSlot,
} from "@life-community-os/tenant-life-panoramica";
import {
  hydrateDurableState,
  pushDurableState,
} from "@/lib/durable/client";
import { useCatalogDomain } from "@/providers/CatalogProvider";
import { useTenant } from "@/providers/TenantProvider";

const STORAGE_KEY = "lcos:resource-reservations";
const DURABLE_KEY = "reservations";

type ReservationStore = {
  reservations: Reservation[];
};

type ReservationContextValue = {
  reservations: Reservation[];
  upcoming: Reservation[];
  past: Reservation[];
  getReservationsForResourceDate: (
    resourceId: string,
    date: string,
  ) => Reservation[];
  getSlots: (resourceId: string, date: string) => TimeSlot[];
  reserve: (input: {
    resourceId: string;
    date: string;
    start: string;
    end: string;
  }) => Reservation | null;
  cancel: (reservationId: string) => void;
};

const ReservationContext = createContext<ReservationContextValue | null>(null);

function readStore(tenantSlug: string): ReservationStore {
  if (typeof window === "undefined") return { reservations: [] };
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}:${tenantSlug}`);
    if (!raw) return { reservations: [] };
    return JSON.parse(raw) as ReservationStore;
  } catch {
    return { reservations: [] };
  }
}

function writeStore(store: ReservationStore, tenantSlug: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${STORAGE_KEY}:${tenantSlug}`,
    JSON.stringify(store),
  );
  pushDurableState(DURABLE_KEY, store, tenantSlug);
}

function withDerivedStatus(r: Reservation): Reservation {
  return { ...r, status: deriveReservationStatus(r) };
}

export function ReservationProvider({ children }: { children: ReactNode }) {
  const { tenantSlug } = useTenant();
  const { items: catalogResources } =
    useCatalogDomain<CommunityResource>("resources");
  const [store, setStore] = useState<ReservationStore>({ reservations: [] });
  const [hydrated, setHydrated] = useState(false);

  const resolveResource = useCallback(
    (resourceId: string) =>
      catalogResources.find((r) => r.id === resourceId) ??
      (tenantSlug === "life-panoramica"
        ? getResourceById(resourceId)
        : undefined),
    [catalogResources, tenantSlug],
  );

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    void (async () => {
      const remote = await hydrateDurableState<ReservationStore>(
        DURABLE_KEY,
        tenantSlug,
      );
      if (cancelled) return;
      if (remote?.reservations) {
        setStore(remote);
        window.localStorage.setItem(
          `${STORAGE_KEY}:${tenantSlug}`,
          JSON.stringify(remote),
        );
      } else {
        setStore(readStore(tenantSlug));
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  useEffect(() => {
    if (!hydrated) return;
    writeStore(store, tenantSlug);
  }, [store, hydrated, tenantSlug]);

  const reservations = useMemo(
    () => store.reservations.map(withDerivedStatus),
    [store.reservations],
  );

  const upcoming = useMemo(
    () =>
      reservations
        .filter((r) => r.status === "reserved" || r.status === "pending")
        .sort((a, b) =>
          `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`),
        ),
    [reservations],
  );

  const past = useMemo(
    () =>
      reservations
        .filter((r) => r.status === "expired" || r.status === "cancelled")
        .sort((a, b) =>
          `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`),
        ),
    [reservations],
  );

  const getReservationsForResourceDate = useCallback(
    (resourceId: string, date: string) =>
      reservations.filter(
        (r) =>
          r.resourceId === resourceId &&
          r.date === date &&
          (r.status === "reserved" || r.status === "pending"),
      ),
    [reservations],
  );

  const getSlots = useCallback(
    (resourceId: string, date: string) => {
      const mine = getReservationsForResourceDate(resourceId, date).map(
        (r) => r.start,
      );
      return getAvailabilitySlots(resourceId, date, mine);
    },
    [getReservationsForResourceDate],
  );

  const reserve = useCallback(
    (input: {
      resourceId: string;
      date: string;
      start: string;
      end: string;
    }) => {
      const resource = resolveResource(input.resourceId);
      if (!resource) return null;

      const slots = getAvailabilitySlots(
        input.resourceId,
        input.date,
        store.reservations
          .filter(
            (r) =>
              r.resourceId === input.resourceId &&
              r.date === input.date &&
              r.status !== "cancelled",
          )
          .map((r) => r.start),
      );
      const slot = slots.find((s) => s.start === input.start);
      if (!slot || slot.status === "occupied") return null;

      const status: ReservationStatus = resource.requiresApproval
        ? "pending"
        : "reserved";

      const reservation: Reservation = {
        id: `rv-${Date.now()}`,
        resourceId: resource.id,
        date: input.date,
        start: input.start,
        end: input.end,
        status,
        createdAt: new Date().toISOString(),
        resourceName: resource.name,
        resourceImageUrl: resource.imageUrl,
        location: resource.location,
        areaLabel: resource.areaLabel,
      };

      setStore((prev) => ({
        reservations: [reservation, ...prev.reservations],
      }));
      return reservation;
    },
    [store.reservations, resolveResource],
  );

  const cancel = useCallback((reservationId: string) => {
    setStore((prev) => ({
      reservations: prev.reservations.map((r) =>
        r.id === reservationId ? { ...r, status: "cancelled" as const } : r,
      ),
    }));
  }, []);

  const value = useMemo(
    () => ({
      reservations,
      upcoming,
      past,
      getReservationsForResourceDate,
      getSlots,
      reserve,
      cancel,
    }),
    [
      reservations,
      upcoming,
      past,
      getReservationsForResourceDate,
      getSlots,
      reserve,
      cancel,
    ],
  );

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservations() {
  const ctx = useContext(ReservationContext);
  if (!ctx) {
    throw new Error("useReservations must be used within ReservationProvider");
  }
  return ctx;
}
