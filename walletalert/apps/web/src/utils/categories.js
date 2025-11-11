const CATEGORY_CONFIG = {
  "college/education": { color: "#8b5cf6", initials: "CE", emoji: "🎓", label: "College/Education" },
  "apartment/housing": { color: "#f59e0b", initials: "AH", emoji: "🏠", label: "Apartment/Housing" },
  "phone/internet": { color: "#0ea5e9", initials: "PI", emoji: "📱", label: "Phone/Internet" },
  groceries: { color: "#10b981", initials: "GR", emoji: "🛒", label: "Groceries" },
  transportation: { color: "#6366f1", initials: "TR", emoji: "🚗", label: "Transportation" },
  entertainment: { color: "#ec4899", initials: "EN", emoji: "🎬", label: "Entertainment" },
  other: { color: "#94a3b8", initials: "OT", emoji: "📦", label: "Other" },
  uncategorized: { color: "#1e293b", initials: "UN", emoji: "📁", label: "Uncategorized" },
};

const FALLBACK_COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#22c55e",
  "#db2777",
  "#7c3aed",
  "#0284c7",
];

const hashStringToNumber = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getFallbackColor = (name) => {
  if (!name) return CATEGORY_CONFIG.other.color;
  const index = hashStringToNumber(name) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[index];
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_CONFIG);

export const getCategoryPresentation = (name, options = {}) => {
  const { emojiOverrides = {}, colorOverrides = {} } = options;

  if (!name) {
    return {
      key: "uncategorized",
      label: CATEGORY_CONFIG.uncategorized.label,
      color:
        colorOverrides.uncategorized ||
        CATEGORY_CONFIG.uncategorized.color,
      initials: CATEGORY_CONFIG.uncategorized.initials,
      emoji:
        (emojiOverrides.uncategorized &&
          emojiOverrides.uncategorized.emoji) ||
        CATEGORY_CONFIG.uncategorized.emoji,
      originalName: "Uncategorized",
    };
  }

  const trimmed = name.trim();
  const key = trimmed.toLowerCase();
  const base = CATEGORY_CONFIG[key] || CATEGORY_CONFIG.other;
  const initials =
    base.initials || trimmed.slice(0, 2).toUpperCase() || CATEGORY_CONFIG.other.initials;
  const emoji =
    (emojiOverrides[key] && emojiOverrides[key].emoji) ||
    base.emoji ||
    CATEGORY_CONFIG.other.emoji;
  const color =
    colorOverrides[key] ||
    (CATEGORY_CONFIG[key] ? base.color : getFallbackColor(trimmed));

  return {
    key,
    label: base.label || trimmed,
    color,
    initials,
    emoji,
    originalName: trimmed,
  };
};

export const getCategoryColor = (name, options) =>
  getCategoryPresentation(name, options).color;

export const CATEGORY_CONFIG_MAP = CATEGORY_CONFIG;
