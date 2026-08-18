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
  deriveViewerState,
  getExperienceById,
  type Experience,
  type ExperienceViewerState,
} from "@life-community-os/tenant-life-panoramica";
import {
  hydrateDurableState,
  pushDurableState,
} from "@/lib/durable/client";
import { useCatalogDomain } from "@/providers/CatalogProvider";
import { useTenant } from "@/providers/TenantProvider";

const STORAGE_KEY = "lcos:experience-participations";
const SAVED_STORAGE_KEY = "lcos:experience-saves";
const DURABLE_KEY = "experience-participation";

export type ParticipationRecord = {
  experienceId: string;
  state: "registered" | "waitlisted";
  joinedAt: string;
  reminders: boolean;
};

type ParticipationMap = Record<string, ParticipationRecord>;

type ExperienceParticipationContextValue = {
  records: ParticipationMap;
  getParticipation: (
    experienceId: string,
  ) => ParticipationRecord | undefined;
  getViewerState: (experience: Experience) => ExperienceViewerState;
  join: (
    experienceId: string,
    options?: { reminders?: boolean; waitlist?: boolean },
  ) => ParticipationRecord | null;
  leave: (experienceId: string) => void;
  setReminders: (experienceId: string, reminders: boolean) => void;
  joinedExperiences: Experience[];
  savedExperiences: Experience[];
  isSaved: (experienceId: string) => boolean;
  toggleSave: (experienceId: string) => void;
};

const ExperienceParticipationContext =
  createContext<ExperienceParticipationContextValue | null>(null);

function readStorage(): ParticipationMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ParticipationMap;
  } catch {
    return {};
  }
}

function writeStorage(map: ParticipationMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function readSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedIds(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(ids));
}

function pushExperienceDurable(
  records: ParticipationMap,
  savedIds: string[],
  tenantSlug: string,
) {
  pushDurableState(DURABLE_KEY, { records, savedIds }, tenantSlug);
}

export function ExperienceParticipationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { tenantSlug } = useTenant();
  const { items: catalogExperiences } = useCatalogDomain<Experience>("experiences");
  const [records, setRecords] = useState<ParticipationMap>({});
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const resolveExperience = useCallback(
    (id: string): Experience | undefined => {
      return (
        catalogExperiences.find((e) => e.id === id) ?? getExperienceById(id)
      );
    },
    [catalogExperiences],
  );

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    void (async () => {
      const remote = await hydrateDurableState<{
        records?: ParticipationMap;
        savedIds?: string[];
      }>(DURABLE_KEY, tenantSlug);
      if (cancelled) return;
      if (remote?.records) {
        setRecords(remote.records);
        window.localStorage.setItem(
          `${STORAGE_KEY}:${tenantSlug}`,
          JSON.stringify(remote.records),
        );
      } else {
        setRecords(readStorage());
      }
      if (remote?.savedIds) {
        setSavedIds(remote.savedIds);
      } else {
        setSavedIds(readSavedIds());
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(records);
    pushExperienceDurable(records, savedIds, tenantSlug);
  }, [records, savedIds, hydrated, tenantSlug]);

  useEffect(() => {
    if (!hydrated) return;
    writeSavedIds(savedIds);
  }, [savedIds, hydrated]);

  const getParticipation = useCallback(
    (experienceId: string) => records[experienceId],
    [records],
  );

  const getViewerState = useCallback(
    (experience: Experience): ExperienceViewerState => {
      const p = records[experience.id];
      return deriveViewerState(
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
    (
      experienceId: string,
      options?: { reminders?: boolean; waitlist?: boolean },
    ) => {
      const experience = resolveExperience(experienceId);
      if (!experience) return null;
      const record: ParticipationRecord = {
        experienceId,
        state: options?.waitlist ? "waitlisted" : "registered",
        joinedAt: new Date().toISOString(),
        reminders: options?.reminders ?? true,
      };
      setRecords((prev) => ({ ...prev, [experienceId]: record }));
      return record;
    },
    [resolveExperience],
  );

  const leave = useCallback((experienceId: string) => {
    setRecords((prev) => {
      const next = { ...prev };
      delete next[experienceId];
      return next;
    });
  }, []);

  const setReminders = useCallback(
    (experienceId: string, reminders: boolean) => {
      setRecords((prev) => {
        const existing = prev[experienceId];
        if (!existing) return prev;
        return {
          ...prev,
          [experienceId]: { ...existing, reminders },
        };
      });
    },
    [],
  );

  const joinedExperiences = useMemo(() => {
    return catalogExperiences
      .concat(
        Object.keys(records)
          .map((id) => resolveExperience(id))
          .filter((e): e is Experience => Boolean(e)),
      )
      .filter(
        (e, index, arr) =>
          records[e.id]?.state === "registered" &&
          arr.findIndex((x) => x.id === e.id) === index,
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }, [records, catalogExperiences, resolveExperience]);

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
      .map((id) => resolveExperience(id))
      .filter((e): e is Experience => Boolean(e));
  }, [savedIds, resolveExperience]);

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
