/**
 * Emoji catalog for Shared Product picker (Phase 2.5.3).
 * Categories + searchable set — not a 10-item stub.
 * No tenant data.
 */

export type EmojiCategoryId =
  | "recent"
  | "smileys"
  | "gestures"
  | "hearts"
  | "animals"
  | "food"
  | "travel"
  | "objects"
  | "symbols";

export type EmojiCategory = {
  id: EmojiCategoryId;
  label: string;
  emojis: readonly string[];
};

export const EMOJI_CATEGORIES: readonly EmojiCategory[] = [
  {
    id: "smileys",
    label: "Caras",
    emojis: [
      "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌",
      "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨",
      "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁",
      "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
      "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭",
      "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲",
      "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒",
      "🤕", "🤑", "🤠",
    ],
  },
  {
    id: "gestures",
    label: "Gestos",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘",
      "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛",
      "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "🦾", "💅", "🤳", "💃",
      "🕺", "🕴️", "🧍", "🧎", "🏃", "🧘",
    ],
  },
  {
    id: "hearts",
    label: "Corazones",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕",
      "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "💌", "💋", "💯", "💢",
      "💥", "💫", "💦", "💨", "🕳️", "💬", "🗨️", "🗯️", "💭", "💤",
    ],
  },
  {
    id: "animals",
    label: "Animales",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁",
      "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤",
      "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱",
      "🐛", "🦋", "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🐢",
      "🐍", "🦎", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳",
    ],
  },
  {
    id: "food",
    label: "Comida",
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒",
      "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️",
      "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖",
      "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭",
      "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🥗", "🥘", "🫕",
      "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘",
      "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂",
      "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "☕", "🍵", "🧃",
      "🥤", "🧋", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾",
    ],
  },
  {
    id: "travel",
    label: "Viajes",
    emojis: [
      "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️", "🚀", "🛸", "🚁", "🛶", "⛵", "🚤",
      "🛥️", "🛳️", "⛴️", "🚢", "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑",
      "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🛵", "🏍️", "🛺", "🚲", "🛴", "🛹",
      "🛼", "🚏", "⛽", "🚨", "🚥", "🚦", "🚧", "⚓", "🏠", "🏡", "🏢", "🏣",
      "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "💒",
      "🗼", "🗽", "⛪", "🕌", "🛕", "🕍", "⛩️", "🕋", "⛲", "⛺", "🌁", "🌃",
      "🏙️", "🌄", "🌅", "🌆", "🌇", "🌉", "♨️", "🎠", "🎡", "🎢", "💈", "🎪",
    ],
  },
  {
    id: "objects",
    label: "Objetos",
    emojis: [
      "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽",
      "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️",
      "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️",
      "⌛", "⏳", "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸",
      "💵", "💴", "💶", "💷", "🪙", "💰", "💳", "💎", "⚖️", "🪜", "🧰", "🪛",
      "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🪚", "🔩", "⚙️", "🪤", "🧱", "⛓️", "🧲",
      "🔫", "💣", "🧨", "🪓", "🔪", "🗡️", "⚔️", "🛡️", "🚬", "⚰️", "🪦", "⚱️",
      "🏺", "🔮", "📿", "🧿", "💈", "⚗️", "🔭", "🔬", "🕳️", "🩹", "🩺", "💊",
      "💉", "🩸", "🧬", "🦠", "🧫", "🧪", "🌡️", "🧹", "🪠", "🧺", "🧻", "🚽",
    ],
  },
  {
    id: "symbols",
    label: "Símbolos",
    emojis: [
      "✅", "☑️", "✔️", "❌", "❎", "➕", "➖", "➗", "✖️", "♾️", "‼️", "⁉️",
      "❓", "❔", "❕", "❗", "〰️", "💱", "💲", "⚕️", "♻️", "⚜️", "🔱", "📛",
      "🔰", "⭕", "🈯", "💹", "❇️", "✳️", "🌐", "💠", "Ⓜ️", "🌀",
      "♠️", "♥️", "♦️", "♣️", "🃏", "🎴", "🀄", "🕐", "🕑", "🕒", "🕓", "🕔",
      "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫", "⚪", "🟥", "🟧", "🟨",
      "🟩", "🟦", "🟪", "🟫", "⬛", "⬜", "◼️", "◻️", "◾", "◽", "▪️", "▫️",
      "🔶", "🔷", "🔸", "🔹", "🔺", "🔻", "🔘", "🔳", "🔲",
    ],
  },
] as const;

export const ALL_PICKER_EMOJIS: readonly string[] = Array.from(
  new Set(EMOJI_CATEGORIES.flatMap((c) => [...c.emojis])),
);

export function searchEmojis(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Direct glyph paste / partial emoji match
  const glyphHits = ALL_PICKER_EMOJIS.filter((e) => e.includes(query.trim()));
  if (glyphHits.length > 0 && /[^\w\s]/u.test(query.trim())) {
    return glyphHits.slice(0, 80);
  }

  const keywordMap: Record<string, EmojiCategoryId[]> = {
    cara: ["smileys"],
    caras: ["smileys"],
    smile: ["smileys"],
    sonrisa: ["smileys"],
    feliz: ["smileys"],
    happy: ["smileys"],
    triste: ["smileys"],
    sad: ["smileys"],
    risa: ["smileys"],
    mano: ["gestures"],
    manos: ["gestures"],
    hand: ["gestures"],
    gestos: ["gestures"],
    ok: ["gestures"],
    corazon: ["hearts"],
    corazón: ["hearts"],
    heart: ["hearts"],
    amor: ["hearts"],
    love: ["hearts"],
    animal: ["animals"],
    animales: ["animals"],
    perro: ["animals"],
    gato: ["animals"],
    dog: ["animals"],
    cat: ["animals"],
    food: ["food"],
    comida: ["food"],
    pizza: ["food"],
    cafe: ["food"],
    café: ["food"],
    travel: ["travel"],
    viaje: ["travel"],
    coche: ["travel"],
    avion: ["travel"],
    avión: ["travel"],
    object: ["objects"],
    objeto: ["objects"],
    objetos: ["objects"],
    telefono: ["objects"],
    teléfono: ["objects"],
    symbol: ["symbols"],
    simbolo: ["symbols"],
    símbolo: ["symbols"],
    check: ["symbols"],
  };

  for (const [key, cats] of Object.entries(keywordMap)) {
    if (q === key || q.startsWith(key) || key.startsWith(q)) {
      return Array.from(
        new Set(
          EMOJI_CATEGORIES.filter((c) => cats.includes(c.id)).flatMap((c) => [
            ...c.emojis,
          ]),
        ),
      );
    }
  }

  // Multi-token: match any category label
  const labelHits = EMOJI_CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(q),
  ).flatMap((c) => [...c.emojis]);
  if (labelHits.length > 0) return Array.from(new Set(labelHits));

  return glyphHits.slice(0, 64);
}

export const RECENT_EMOJIS_STORAGE_KEY = "lcos.emoji.recent.v1";
