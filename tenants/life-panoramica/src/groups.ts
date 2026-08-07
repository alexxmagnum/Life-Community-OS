/**
 * Community Groups — ADR-029 shape, tenant mock catalog.
 */

export type CommunityGroup = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  imageUrl: string;
  areaLabel?: string;
  categoryLabel: string;
};

export const groupCatalog: CommunityGroup[] = [
  {
    id: "g-padel",
    name: "Pádel mañanas",
    description: "Partidos amistosos entre semana. Todos los niveles.",
    memberCount: 28,
    imageUrl:
      "https://images.unsplash.com/photo-1626224582411-c8120bdb77e2?auto=format&fit=crop&w=800&q=80",
    areaLabel: "Aldea Golf",
    categoryLabel: "Deporte",
  },
  {
    id: "g-walk",
    name: "Círculo de paseos",
    description: "Caminatas suaves al atardecer por pinos y caminos.",
    memberCount: 41,
    imageUrl:
      "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=800&q=80",
    areaLabel: "Valle Golf",
    categoryLabel: "Ocio",
  },
  {
    id: "g-parents",
    name: "Familias Panoramica",
    description: "Planes con niños, trueques y apoyo entre vecinos.",
    memberCount: 36,
    imageUrl:
      "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=800&q=80",
    categoryLabel: "Familia",
  },
  {
    id: "g-garden",
    name: "Huertos y jardín",
    description: "Consejos de riego, plantas y trueque de esquejes.",
    memberCount: 19,
    imageUrl:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80",
    areaLabel: "Pinar",
    categoryLabel: "Afición",
  },
];

export function listGroups(): CommunityGroup[] {
  return groupCatalog;
}

export function getGroupById(id: string): CommunityGroup | undefined {
  return groupCatalog.find((g) => g.id === id);
}
