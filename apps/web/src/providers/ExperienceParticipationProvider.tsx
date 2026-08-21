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
  deriveExperienceViewerState,
  minutesToHhmm,
  hhmmToMinutes,
  reservationIsActive,
  splitIsoToDateTime,
  type Experience,
  type ExperienceViewerState,
} from "@life-community-os/types";
import { useReservations } from "@/providers/ReservationProvider";
import { useTenant } from "@/providers/TenantProvider";

const SAVED_STORAGE_KEY = "lcos:experience-saves";

export type ParticipationRecord = {
  experienceId: string;
  state: "registered" | "waitlisted";
  joinedAt: string;
  reminders: boolean;
};

type ParticipationMap = Record<string, ParticipationRecord>;

type ExperienceParticipationContextValue = {
  records: ParticipationMap;
  getParticipation: (experienceId: string) => ParticipationRecord | undefined;
  getViewerState: (experience: Experience) => ExperienceViewerState;
  join: (
    experienceId: string,
    options?: { reminders?: boolean; waitlist?: boolean },
  ) => Promise<ParticipationRecord | null> | ParticipationRecord | null;
  leave: (experienceId: string) => void;
  setReminders: (experienceId: string, reminders: boolean) => void;
  joinedExperiences: Experience[];
  savedExperiences: Experience[];
  isSaved: (experienceId: string) => boolean;
  toggleSave: (experienceId: string) => void;
};

const ExperienceParticipationContext =
  createContext<ExperienceParticipationContextValue | null>(null);

function readSavedIds(tenantSlug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      window.localStorage.getItem(`${SAVED_STORAGE_KEY}:${tenantSlug}`) ??
      window.localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedIds(ids: string[], tenantSlug: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${SAVED_STORAGE_KEY}:${tenantSlug}`,
    JSON.stringify(ids),
  );
}

export function ExperienceParticipationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { tenantSlug } = useTenant();
  const { experiences, reservations, reserve, cancel, getExperience } =
    useReservations();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSavedIds(readSavedIds(tenantSlug));
    setHydrated(true);
  }, [tenantSlug]);

  useEffect(() => {
    if (!hydrated) return;
    writeSavedIds(savedIds, tenantSlug);
  }, [savedIds, hydrated, tenantSlug]);

  const records = useMemo(() => {
    const map: ParticipationMap = {};
    for (const item of reservations) {
      const experienceId = item.experienceId ?? item.resourceId;
      if (!reservationIsActive(item.status)) continue;
      if (!getExperience(experienceId) && !experiences.some((e) => e.id === experienceId)) {
        continue;
      }
      map[experienceId] = {
        experienceId,
        state: item.status === "pending" ? "waitlisted" : "registered",
        joinedAt: item.createdAt ?? new Date().toISOString(),
        reminders: true,
      };
    }
    return map;
  }, [reservations, experiences, getExperience]);

  const getParticipation = useCallback(
    (experienceId: string) => records[experienceId],
    [records],
  );

  const getViewerState = useCallback(
    (experience: Experience): ExperienceViewerState => {
      const p = records[experience.id];
      return deriveExperienceViewerState(
        experience,
        p?.state === "registered"
          ? "registered"
          : p?.state === "waitlisted"
            ? "waitlisted"
            : "none",
      );
    },
    [records],
  );

  const join = useCallback(
    async (
      experienceId: string,
      options?: { reminders?: boolean; waitlist?: boolean },
    ) => {
      void options;
      const experience = getExperience(experienceId);
      if (!experience) return null;
      const startParts = splitIsoToDateTime(experience.startsAt);
      const endParts = experience.endsAt
        ? splitIsoToDateTime(experience.endsAt)
        : {
            date: startParts.date,
            start: minutesToHhmm(hhmmToMinutes(startParts.start) + 60),
          };
      const created = await reserve({
        resourceId: experience.id,
        date: startParts.date,
        start: startParts.start,
        end: endParts.start,
      });
      if (!created) return null;
      return {
        experienceId,
        state: created.status === "pending" ? "waitlisted" : "registered",
        joinedAt: created.createdAt ?? new Date().toISOString(),
        reminders: options?.reminders ?? true,
      } satisfies ParticipationRecord;
    },
    [getExperience, reserve],
  );

  const leave = useCallback(
    (experienceId: string) => {
      const mine = reservations.find(
        (item) =>
          (item.experienceId === experienceId || item.resourceId === experienceId) &&
          reservationIsActive(item.status),
      );
      if (!mine) return;
      void cancel(mine.id);
    },
    [reservations, cancel],
  );

  const setReminders = useCallback((_experienceId: string, _reminders: boolean) => {
    void _experienceId;
    void _reminders;
  }, []);

  const joinedExperiences = useMemo(() => {
    return experiences
      .filter((item) => records[item.id]?.state === "registered")
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }, [experiences, records]);

  const isSaved = useCallback(
    (experienceId: string) => savedIds.includes(experienceId),
    [savedIds],
  );

  const toggleSave = useCallback((experienceId: string) => {
    setSavedIds((prev) =>
      prev.includes(experienceId)
        ? prev.filter((id) => id !== experienceId)
        : [...prev, experienceId],
    );
  }, []);

  const savedExperiences = useMemo(() => {
    return savedIds
      .map((id) => getExperience(id) ?? experiences.find((item) => item.id === id))
      .filter((item): item is Experience => Boolean(item));
  }, [savedIds, getExperience, experiences]);

  const value = useMemo(
    () => ({
      records,
      getParticipation,
      getViewerState,
      join,
      leave,
      setReminders,
      joinedExperiences,
      savedExperiences,
      isSaved,
      toggleSave,
    }),
    [
      records,
      getParticipation,
      getViewerState,
      join,
      leave,
      setReminders,
      joinedExperiences,
      savedExperiences,
      isSaved,
      toggleSave,
    ],
  );

  return (
    <ExperienceParticipationContext.Provider value={value}>
      {children}
    </ExperienceParticipationContext.Provider>
  );
}

export function useExperienceParticipation() {
  const ctx = useContext(ExperienceParticipationContext);
  if (!ctx) {
    throw new Error(
      "useExperienceParticipation must be used within ExperienceParticipationProvider",
    );
  }
  return ctx;
}
