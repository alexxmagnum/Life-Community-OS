/**
 * Person id alignment for Life Panoramica demo catalogs (Phase C.4).
 *
 * Maps legacy stub ids / display names → Person ids so contribution
 * aggregation can join on personId. Official / group actors resolve to null.
 */

import {
  DEMO_PERSON_ANA,
  DEMO_PERSON_CLARA,
  DEMO_PERSON_ELENA,
  DEMO_PERSON_INES,
  DEMO_PERSON_JOHN,
  DEMO_PERSON_JORDI,
  DEMO_PERSON_LUCIA,
  DEMO_PERSON_LUIS,
  DEMO_PERSON_MARTA,
  DEMO_PERSON_TOM,
} from "./demo-ids";

/** Legacy catalog author / organizer / participant ids → Person id. */
const LEGACY_ACTOR_TO_PERSON: Readonly<Record<string, string>> = {
  [DEMO_PERSON_MARTA]: DEMO_PERSON_MARTA,
  [DEMO_PERSON_JOHN]: DEMO_PERSON_JOHN,
  [DEMO_PERSON_LUCIA]: DEMO_PERSON_LUCIA,
  [DEMO_PERSON_ANA]: DEMO_PERSON_ANA,
  [DEMO_PERSON_INES]: DEMO_PERSON_INES,
  [DEMO_PERSON_ELENA]: DEMO_PERSON_ELENA,
  [DEMO_PERSON_JORDI]: DEMO_PERSON_JORDI,
  [DEMO_PERSON_LUIS]: DEMO_PERSON_LUIS,
  [DEMO_PERSON_CLARA]: DEMO_PERSON_CLARA,
  [DEMO_PERSON_TOM]: DEMO_PERSON_TOM,
  // Pre-alignment stubs
  "org-marta": DEMO_PERSON_MARTA,
  "org-ana": DEMO_PERSON_ANA,
  "org-ines": DEMO_PERSON_INES,
  "p-marta": DEMO_PERSON_MARTA,
  "p-ana": DEMO_PERSON_ANA,
  "p-ines": DEMO_PERSON_INES,
  "p-elena": DEMO_PERSON_ELENA,
  "p-jordi": DEMO_PERSON_JORDI,
  "p-luis": DEMO_PERSON_LUIS,
  "p-clara": DEMO_PERSON_CLARA,
  "p-tom": DEMO_PERSON_TOM,
  // Session author placeholder used before person-id alignment
  self: DEMO_PERSON_MARTA,
};

/** Display-name fallback when catalogs only stored authorName. */
const DISPLAY_NAME_TO_PERSON: Readonly<Record<string, string>> = {
  marta: DEMO_PERSON_MARTA,
  "marta ruiz": DEMO_PERSON_MARTA,
  john: DEMO_PERSON_JOHN,
  "john carter": DEMO_PERSON_JOHN,
  lucía: DEMO_PERSON_LUCIA,
  lucia: DEMO_PERSON_LUCIA,
  "lucía navarro": DEMO_PERSON_LUCIA,
  "lucia navarro": DEMO_PERSON_LUCIA,
  ana: DEMO_PERSON_ANA,
  "ana lópez": DEMO_PERSON_ANA,
  "ana lopez": DEMO_PERSON_ANA,
  inés: DEMO_PERSON_INES,
  ines: DEMO_PERSON_INES,
  "inés vidal": DEMO_PERSON_INES,
  "ines vidal": DEMO_PERSON_INES,
  elena: DEMO_PERSON_ELENA,
  jordi: DEMO_PERSON_JORDI,
  luis: DEMO_PERSON_LUIS,
  clara: DEMO_PERSON_CLARA,
  tom: DEMO_PERSON_TOM,
};

/** Non-person actors (official entity, group brand) — not contribution subjects. */
const NON_PERSON_ACTORS: ReadonlySet<string> = new Set([
  "org-community",
  "org-padel",
]);

/**
 * Resolve a catalog actor id to a Person id.
 * Returns undefined for official/group actors or unknown stubs.
 */
export function resolvePersonIdFromActorId(
  actorId: string | undefined | null,
): string | undefined {
  if (!actorId) return undefined;
  if (NON_PERSON_ACTORS.has(actorId)) return undefined;
  return LEGACY_ACTOR_TO_PERSON[actorId];
}

/**
 * Resolve a display name to a Person id when no actor id is present.
 * Case-insensitive; accent-tolerant for Lucía / Inés via explicit keys.
 */
export function resolvePersonIdFromDisplayName(
  name: string | undefined | null,
): string | undefined {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  return DISPLAY_NAME_TO_PERSON[key];
}

/**
 * Prefer explicit person id, then actor id, then display name.
 */
export function resolvePersonId(input: {
  personId?: string | null;
  actorId?: string | null;
  displayName?: string | null;
}): string | undefined {
  if (input.personId?.trim()) return input.personId.trim();
  return (
    resolvePersonIdFromActorId(input.actorId) ??
    resolvePersonIdFromDisplayName(input.displayName)
  );
}

/** True when the id is a known demo/catalog Person id. */
export function isAlignedPersonId(id: string): boolean {
  return id.startsWith("person-") && LEGACY_ACTOR_TO_PERSON[id] === id;
}
