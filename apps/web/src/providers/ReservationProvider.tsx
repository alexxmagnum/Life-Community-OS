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
  experienceFromResource,
  reservationIsActive,
  spotsLeft,
  type CommunityResource,
  type Experience,
  type Reservation,
  type TimeSlot,
} from "@life-community-os/types";
import {
  createReservationRequest,
  fetchReservations,
  fetchResourceAvailability,
  fetchResources,
  patchReservationRequest,
} from "@/lib/reservations/reservations-client";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { useTenant } from "@/providers/TenantProvider";

type ReservationContextValue = {
  ready: boolean;
  resources: CommunityResource[];
  experiences: Experience[];
  reservations: Reservation[];
  upcoming: Reservation[];
  past: Reservation[];
  refresh: () => Promise<void>;
  getResource: (resourceId: string) => CommunityResource | undefined;
  getExperience: (experienceId: string) => Experience | undefined;
  getReservationsForResourceDate: (
    resourceId: string,
    date: string,
  ) => Reservation[];
  getSlots: (resourceId: string, date: string) => TimeSlot[];
  loadSlots: (resourceId: string, date: string) => Promise<TimeSlot[]>;
  reserve: (input: {
    resourceId: string;
    date: string;
    start: string;
    end: string;
    participantCount?: number;
  }) => Promise<Reservation | null>;
  cancel: (reservationId: string) => Promise<boolean>;
};

const ReservationContext = createContext<ReservationContextValue | null>(null);

export function ReservationProvider({ children }: { children: ReactNode }) {
  const { tenantSlug, hasMembership } = useTenant();
  const { sessionReady } = useCurrentUser();
  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [slotsByKey, setSlotsByKey] = useState<Record<string, TimeSlot[]>>({});
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!hasMembership) {
      setResources([]);
      setReservations([]);
      setReady(true);
      return;
    }
    const [nextResources, nextReservations] = await Promise.all([
      fetchResources({ tenantId: tenantSlug }),
      fetchReservations({ tenantId: tenantSlug }),
    ]);
    setResources(nextResources);
    setReservations(nextReservations);
    setReady(true);
  }, [tenantSlug, hasMembership]);

  useEffect(() => {
    if (!sessionReady) return;
    let cancelled = false;
    setReady(false);
    if (!hasMembership) {
      setResources([]);
      setReservations([]);
      setSlotsByKey({});
      setReady(true);
      return;
    }
    void (async () => {
      const [nextResources, nextReservations] = await Promise.all([
        fetchResources({ tenantId: tenantSlug }),
        fetchReservations({ tenantId: tenantSlug }),
      ]);
      if (cancelled) return;
      setResources(nextResources);
      setReservations(nextReservations);
      setSlotsByKey({});
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, hasMembership, sessionReady]);

  const participantCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of reservations) {
      if (!reservationIsActive(item.status)) continue;
      const key = item.experienceId ?? item.contextId ?? item.resourceId;
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + (item.participantCount ?? 1));
    }
    return counts;
  }, [reservations]);

  const experiences = useMemo(
    () =>
      resources
        .filter((item) => item.category === "activity")
        .map((item) =>
          experienceFromResource(item, participantCounts.get(item.id) ?? 0),
        ),
    [resources, participantCounts],
  );

  const upcoming = useMemo(
    () =>
      reservations
        .filter((item) => reservationIsActive(item.status))
        .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)),
    [reservations],
  );

  const past = useMemo(
    () =>
      reservations
        .filter((item) => !reservationIsActive(item.status))
        .sort((a, b) => `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`)),
    [reservations],
  );

  const getResource = useCallback(
    (resourceId: string) => resources.find((item) => item.id === resourceId),
    [resources],
  );

  const getExperience = useCallback(
    (experienceId: string) =>
      experiences.find((item) => item.id === experienceId),
    [experiences],
  );

  const getReservationsForResourceDate = useCallback(
    (resourceId: string, date: string) =>
      reservations.filter(
        (item) =>
          item.resourceId === resourceId &&
          item.date === date &&
          reservationIsActive(item.status),
      ),
    [reservations],
  );

  const getSlots = useCallback(
    (resourceId: string, date: string) => slotsByKey[`${resourceId}:${date}`] ?? [],
    [slotsByKey],
  );

  const loadSlots = useCallback(
    async (resourceId: string, date: string) => {
      const slots = await fetchResourceAvailability({
        tenantId: tenantSlug,
        resourceId,
        date,
      });
      setSlotsByKey((prev) => ({ ...prev, [`${resourceId}:${date}`]: slots }));
      return slots;
    },
    [tenantSlug],
  );

  const reserve = useCallback(
    async (input: {
      resourceId: string;
      date: string;
      start: string;
      end: string;
      participantCount?: number;
    }) => {
      const result = await createReservationRequest({
        tenantId: tenantSlug,
        resourceId: input.resourceId,
        date: input.date,
        start: input.start,
        end: input.end,
        participantCount: input.participantCount,
      });
      if ("error" in result) return null;
      await refresh();
      await loadSlots(input.resourceId, input.date);
      return result.reservation;
    },
    [tenantSlug, refresh, loadSlots],
  );

  const cancel = useCallback(
    async (reservationId: string) => {
      const result = await patchReservationRequest({
        tenantId: tenantSlug,
        reservationId,
        status: "cancelled",
      });
      if ("error" in result) return false;
      await refresh();
      return true;
    },
    [tenantSlug, refresh],
  );

  const value = useMemo(
    () => ({
      ready,
      resources,
      experiences,
      reservations,
      upcoming,
      past,
      refresh,
      getResource,
      getExperience,
      getReservationsForResourceDate,
      getSlots,
      loadSlots,
      reserve,
      cancel,
    }),
    [
      ready,
      resources,
      experiences,
      reservations,
      upcoming,
      past,
      refresh,
      getResource,
      getExperience,
      getReservationsForResourceDate,
      getSlots,
      loadSlots,
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

export function experienceSpotsLeft(experience: Experience): number {
  return spotsLeft(experience);
}
