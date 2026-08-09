/**
 * Demo Person profiles for residency / access validation UI (ADR-037 / ADR-038).
 * Switchable in Profile — not production identity.
 */

import {
  DEMO_PERSON_JOHN,
  DEMO_PERSON_LUCIA,
  DEMO_PERSON_MARTA,
  DEMO_PERSON_OWNER_ALDEA,
} from "./demo-ids";
import { residencyDemoNarratives } from "./residency-demo";

export type DemoMemberProfile = {
  personId: string;
  displayName: string;
  fullName: string;
  membershipLabel: string;
  areaLabel: string;
  interests: string[];
  avatarUrl: string;
  /** Short Spanish UI line for residency verification state. */
  residencyStatusLabel: string;
  residencyStatusKind: "verified" | "pending" | "other_area";
  narrativeKey: keyof typeof residencyDemoNarratives;
};

export const demoMemberCatalog: DemoMemberProfile[] = [
  {
    personId: DEMO_PERSON_MARTA,
    displayName: "Marta",
    fullName: "Marta Ruiz",
    membershipLabel: "Miembro · Life Panoramica",
    areaLabel: "Aldea Golf",
    interests: ["Caminar", "Pádel"],
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    residencyStatusLabel: "Verificado · Aldea Golf",
    residencyStatusKind: "verified",
    narrativeKey: "marta",
  },
  {
    personId: DEMO_PERSON_JOHN,
    displayName: "John",
    fullName: "John Carter",
    membershipLabel: "Miembro · verificación pendiente",
    areaLabel: "Aldea Golf (reclamada)",
    interests: ["Pádel"],
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    residencyStatusLabel: "Verificación pendiente · sin acceso restringido",
    residencyStatusKind: "pending",
    narrativeKey: "john",
  },
  {
    personId: DEMO_PERSON_LUCIA,
    displayName: "Lucía",
    fullName: "Lucía Navarro",
    membershipLabel: "Miembro · Life Panoramica",
    areaLabel: "Zona Verde",
    interests: ["Natación", "Café"],
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    residencyStatusLabel: "Verificado · Zona Verde",
    residencyStatusKind: "other_area",
    narrativeKey: "lucia",
  },
  {
    personId: DEMO_PERSON_OWNER_ALDEA,
    displayName: "Elena",
    fullName: "Elena Owner",
    membershipLabel: "Miembro · propietaria",
    areaLabel: "Aldea Golf",
    interests: ["Comunidad", "Golf"],
    avatarUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    residencyStatusLabel: "Propiedad verificada · Aldea Golf",
    residencyStatusKind: "verified",
    narrativeKey: "owner",
  },
];

export function getDemoMemberByPersonId(
  personId: string,
): DemoMemberProfile | undefined {
  return demoMemberCatalog.find((m) => m.personId === personId);
}

export function listDemoMembers(): DemoMemberProfile[] {
  return demoMemberCatalog;
}
