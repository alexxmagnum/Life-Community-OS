/**
 * Experience Composer — declarative field config by Experience.kind.
 * One create surface; UI adapts. Not a universal form engine.
 */

import {
  EXPERIENCE_KINDS,
  experienceKindProductLabel,
  normalizeExperienceKind,
  type ExperienceKind,
} from "../domain/experience";

export const EXPERIENCE_COMPOSER_FIELD_IDS = [
  "title",
  "description",
  "category",
  "whenPreset",
  "date",
  "time",
  "endTime",
  "location",
  "resource",
  "capacity",
  "audience",
  "format",
] as const;

export type ExperienceComposerFieldId =
  (typeof EXPERIENCE_COMPOSER_FIELD_IDS)[number];

export type ExperienceComposerKindConfig = {
  kind: ExperienceKind;
  label: string;
  question: string;
  titlePlaceholder: string;
  primaryCta: string;
  draftCta: string;
  /** Fields always visible for this kind. */
  visible: readonly ExperienceComposerFieldId[];
  /** Fields that live under “Detalles opcionales”. */
  optionalDetails: readonly ExperienceComposerFieldId[];
  /** Required before publish (draft may omit some). */
  requiredForPublish: readonly ExperienceComposerFieldId[];
  /** Required before draft save. */
  requiredForDraft: readonly ExperienceComposerFieldId[];
  showWhenPresets: boolean;
  minCapacity: number;
};

const PLAN_CONFIG: ExperienceComposerKindConfig = {
  kind: "plan",
  label: experienceKindProductLabel("plan"),
  question: "¿Qué te apetece hacer?",
  titlePlaceholder: "Ej. Jugar al pádel",
  primaryCta: "Crear plan",
  draftCta: "Guardar como borrador",
  visible: [
    "title",
    "category",
    "whenPreset",
    "date",
    "time",
    "location",
    "capacity",
  ],
  optionalDetails: ["description", "endTime", "resource", "audience"],
  requiredForPublish: ["title", "date", "time", "location", "capacity"],
  requiredForDraft: ["title"],
  showWhenPresets: true,
  minCapacity: 2,
};

const EXPERIENCE_CONFIG: ExperienceComposerKindConfig = {
  kind: "experience",
  label: experienceKindProductLabel("experience"),
  question: "¿Qué experiencia quieres crear?",
  titlePlaceholder: "Ej. Clase de yoga al atardecer",
  primaryCta: "Crear experiencia",
  draftCta: "Guardar como borrador",
  visible: [
    "title",
    "description",
    "category",
    "date",
    "time",
    "location",
    "capacity",
  ],
  optionalDetails: ["endTime", "resource", "audience"],
  requiredForPublish: [
    "title",
    "description",
    "date",
    "time",
    "location",
    "capacity",
  ],
  requiredForDraft: ["title"],
  showWhenPresets: false,
  minCapacity: 2,
};

const EVENT_CONFIG: ExperienceComposerKindConfig = {
  kind: "event",
  label: experienceKindProductLabel("event"),
  question: "¿Qué quieres organizar?",
  titlePlaceholder: "Ej. Noche de música en directo",
  primaryCta: "Crear evento",
  draftCta: "Guardar como borrador",
  visible: [
    "title",
    "category",
    "format",
    "date",
    "time",
    "location",
    "capacity",
  ],
  optionalDetails: ["description", "endTime", "resource", "audience"],
  requiredForPublish: ["title", "date", "time", "location"],
  requiredForDraft: ["title"],
  showWhenPresets: false,
  minCapacity: 2,
};

const BY_KIND: Record<ExperienceKind, ExperienceComposerKindConfig> = {
  plan: PLAN_CONFIG,
  experience: EXPERIENCE_CONFIG,
  event: EVENT_CONFIG,
};

export function experienceComposerConfigForKind(
  kind: string | null | undefined,
): ExperienceComposerKindConfig {
  return BY_KIND[normalizeExperienceKind(kind)];
}

export function listExperienceComposerKindOptions(): readonly {
  id: ExperienceKind;
  label: string;
}[] {
  return EXPERIENCE_KINDS.map((id) => ({
    id,
    label: experienceKindProductLabel(id),
  }));
}

/** Fields that survive a kind switch without reset. */
export const EXPERIENCE_COMPOSER_COMPATIBLE_FIELDS = [
  "title",
  "description",
  "category",
  "date",
  "time",
  "endTime",
  "location",
  "resource",
  "capacity",
  "audience",
  "format",
] as const;

export type ExperienceComposerAudience = "territory" | "members";

export const EXPERIENCE_COMPOSER_AUDIENCE_OPTIONS: readonly {
  id: ExperienceComposerAudience;
  label: string;
}[] = [
  { id: "territory", label: "Cualquiera en el territorio" },
  { id: "members", label: "Solo miembros" },
];

export type ExperienceComposerWhenPreset =
  | "today"
  | "tomorrow"
  | "weekend"
  | "custom";

export function dateFromWhenPreset(
  preset: ExperienceComposerWhenPreset,
  now = new Date(),
): string {
  const d = new Date(now);
  if (preset === "tomorrow") {
    d.setDate(d.getDate() + 1);
  } else if (preset === "weekend") {
    const day = d.getDay();
    const add = day === 6 ? 0 : day === 0 ? 6 : 6 - day;
    d.setDate(d.getDate() + add);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseExperienceComposerKindParam(
  value: string | null | undefined,
): ExperienceKind {
  return normalizeExperienceKind(value);
}

/**
 * Maps Action Composer intention → Experience.kind query.
 * plan_create / experience_create / event_create converge here.
 */
export function experienceKindForCreationAction(
  actionType: string,
): ExperienceKind | null {
  switch (actionType) {
    case "plan_create":
      return "plan";
    case "experience_create":
      return "experience";
    case "event_create":
      return "event";
    default:
      return null;
  }
}

export const EXPERIENCE_COMPOSER_CATEGORY_OPTIONS: readonly {
  id: string;
  label: string;
}[] = [
  { id: "sport", label: "Deporte" },
  { id: "social", label: "Social" },
  { id: "food", label: "Gastronomía" },
  { id: "outdoor", label: "Aire libre" },
  { id: "wellness", label: "Bienestar" },
  { id: "custom", label: "Otro" },
];

export type ExperienceComposerFormState = {
  title: string;
  description: string;
  category: string;
  activitySlug: string;
  format: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  resourceId: string;
  capacity: string;
  audience: ExperienceComposerAudience;
};

export type ExperienceComposerInitialValues = Partial<
  ExperienceComposerFormState & { kind: ExperienceKind }
>;

export function validateExperienceComposer(
  config: ExperienceComposerKindConfig,
  state: ExperienceComposerFormState,
  mode: "publish" | "draft",
): string | null {
  const required =
    mode === "draft" ? config.requiredForDraft : config.requiredForPublish;
  const title = state.title.trim();
  const description = state.description.trim();
  const location = state.location.trim();
  const cap = Number(state.capacity);

  for (const field of required) {
    if (field === "title" && !title) {
      return mode === "draft"
        ? "Pon un título para guardar el borrador."
        : "Pon un título.";
    }
    if (field === "description" && !description) {
      return "Añade una descripción.";
    }
    if (field === "date" && !state.date.trim()) {
      return "Elige una fecha.";
    }
    if (field === "time" && !state.time.trim()) {
      return "Elige una hora.";
    }
    if (field === "location" && !location) {
      return "Indica dónde.";
    }
    if (field === "capacity") {
      if (!Number.isFinite(cap) || cap < config.minCapacity) {
        return `Indica cuántas personas (mínimo ${config.minCapacity}).`;
      }
    }
  }

  if (mode === "publish" && state.date && state.time) {
    const starts = new Date(`${state.date}T${state.time}:00`);
    if (Number.isNaN(starts.getTime())) {
      return "La fecha u hora no es válida.";
    }
    if (state.endTime.trim()) {
      const ends = new Date(`${state.date}T${state.endTime}:00`);
      if (ends.getTime() <= starts.getTime()) {
        return "La hora de fin debe ser posterior al inicio.";
      }
    }
  }

  return null;
}
