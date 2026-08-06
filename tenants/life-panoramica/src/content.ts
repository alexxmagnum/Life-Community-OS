/**
 * Reference content for Life Panoramica foundation UI.
 * Not production data — photography-led placeholders for the first experience.
 */

export type AreaId =
  | "all"
  | "aldea-golf"
  | "detinsa"
  | "pinar"
  | "golfmar"
  | "hacienda"
  | "valle-golf";

export const areas: { id: AreaId; label: string }[] = [
  { id: "all", label: "All Panoramica" },
  { id: "aldea-golf", label: "Aldea Golf" },
  { id: "detinsa", label: "Detinsa" },
  { id: "pinar", label: "Pinar" },
  { id: "valle-golf", label: "Valle Golf" },
];

export const currentMember = {
  displayName: "Marta",
  fullName: "Marta Ruiz",
  membershipLabel: "Member · Life Panoramica",
  areaLabel: "Aldea Golf",
  interests: ["Walking", "Padel"],
  avatarUrl:
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
};

export const pulseItems = [
  {
    id: "p1",
    time: "09:30",
    title: "Padel with neighbours",
    place: "Court 2",
    kind: "reservation" as const,
  },
  {
    id: "p2",
    time: "18:00",
    title: "Terrace gathering",
    place: "Aldea Golf",
    kind: "experience" as const,
  },
  {
    id: "p3",
    time: "Sat",
    title: "Sunrise walk",
    place: "Valle Golf",
    kind: "experience" as const,
  },
];

export const announcement = {
  id: "a1",
  title: "Water maintenance Saturday",
  preview:
    "Works from 10:00–14:00 in Aldea Golf. Thank you for your patience.",
  area: "Aldea Golf",
  imageUrl:
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
};

export const experiences = [
  {
    id: "e1",
    title: "Sunrise walk along the pines",
    when: "Sat 8:00",
    where: "Valle Golf",
    meta: "12 going",
    imageUrl:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=80",
    cta: "Register",
  },
  {
    id: "e2",
    title: "Mediterranean stretch class",
    when: "Sun 10:00",
    where: "Terrace · Hacienda",
    meta: "8 spots left",
    imageUrl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
    cta: "Register",
  },
  {
    id: "e3",
    title: "Neighbour coffee morning",
    when: "Fri 11:00",
    where: "Aldea Golf",
    meta: "Open",
    imageUrl:
      "https://images.unsplash.com/photo-1511632765481-a929fcf8e8f4?auto=format&fit=crop&w=900&q=80",
    cta: "Join",
  },
];

export const recommendations = [
  {
    id: "r1",
    quote: "Best same-day keys — ask for Costa Locksmith.",
    author: "Elena",
    imageUrl:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
  },
];

export const services = [
  {
    id: "s1",
    name: "Panoramica Garden Care",
    category: "Outdoors",
    verified: true,
    imageUrl:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "s2",
    name: "Costa Locksmith",
    category: "Home help",
    verified: true,
    imageUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  },
];

export const places = [
  {
    id: "pl1",
    name: "Padel Court 2",
    availability: "Today 17:00",
    area: "Aldea Golf",
    imageUrl:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "pl2",
    name: "Community room",
    availability: "Tomorrow 10:00",
    area: "Detinsa",
    imageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
  },
];

export const calendarItems = [
  {
    id: "c1",
    day: "Today · Thursday",
    time: "09:30–10:30",
    title: "Padel with neighbours",
    place: "Court 2",
    status: "Reserved",
    kind: "reservation" as const,
  },
  {
    id: "c2",
    day: "Today · Thursday",
    time: "18:00",
    title: "Community BBQ",
    place: "Aldea Golf",
    status: "Going",
    kind: "experience" as const,
    imageUrl:
      "https://images.unsplash.com/photo-1555939596-19271ee170b3?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "c3",
    day: "Tomorrow · Friday",
    time: "11:00",
    title: "Neighbour coffee morning",
    place: "Aldea Golf",
    status: "Open",
    kind: "experience" as const,
  },
];

export const feedPosts = [
  {
    id: "f1",
    kind: "official" as const,
    title: "Pathway lighting update",
    body: "Phase 2 is complete around Aldea Golf paths.",
    meta: "2h · Aldea Golf",
  },
  {
    id: "f2",
    kind: "neighbour" as const,
    author: "Ana",
    title: "Anyone for an evening walk?",
    body: "Toward Detinsa around 19:00 — join if you’d like.",
    meta: "Today",
    reactions: 12,
    comments: 4,
  },
];

export const groups = [
  {
    id: "g1",
    name: "Padel mornings",
    members: 28,
    imageUrl:
      "https://images.unsplash.com/photo-1626224582411-c8120bdb77e2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "g2",
    name: "Walking circle",
    members: 41,
    imageUrl:
      "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=600&q=80",
  },
];

export const proposals = [
  {
    id: "pr1",
    title: "Extend pool summer hours",
    status: "Closing soon",
    meta: "Closes Friday",
  },
];

export const profileShortcuts = {
  going: 2,
  reservations: 1,
  requests: 1,
  saves: 8,
};
