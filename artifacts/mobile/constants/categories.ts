export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  emoji: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: "food", label: "Food & Drink", icon: "coffee", color: "#F37021", emoji: "🍔" },
  { id: "shopping", label: "Shopping", icon: "shopping-bag", color: "#92278F", emoji: "🛍️" },
  { id: "transport", label: "Transport", icon: "map-pin", color: "#2E3192", emoji: "🚗" },
  { id: "housing", label: "Housing", icon: "home", color: "#0EA5E9", emoji: "🏠" },
  { id: "health", label: "Health", icon: "heart", color: "#EF4444", emoji: "💊" },
  { id: "entertainment", label: "Fun", icon: "film", color: "#F59E0B", emoji: "🎬" },
  { id: "education", label: "Education", icon: "book-open", color: "#3B82F6", emoji: "📚" },
  { id: "bills", label: "Bills", icon: "zap", color: "#64748B", emoji: "⚡" },
  { id: "savings", label: "Savings", icon: "trending-up", color: "#22C55E", emoji: "💰" },
  { id: "travel", label: "Travel", icon: "map", color: "#8B5CF6", emoji: "✈️" },
  { id: "family", label: "Family", icon: "users", color: "#EC4899", emoji: "👨‍👩‍👧" },
  { id: "other", label: "Other", icon: "more-horizontal", color: "#94A3B8", emoji: "📌" },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: "salary", label: "Salary", icon: "briefcase", color: "#22C55E", emoji: "💼" },
  { id: "freelance", label: "Freelance", icon: "code", color: "#2E3192", emoji: "💻" },
  { id: "investment", label: "Investment", icon: "trending-up", color: "#F59E0B", emoji: "📈" },
  { id: "gift", label: "Gift", icon: "gift", color: "#EC4899", emoji: "🎁" },
  { id: "rental", label: "Rental", icon: "home", color: "#0EA5E9", emoji: "🏘️" },
  { id: "other_in", label: "Other", icon: "dollar-sign", color: "#94A3B8", emoji: "💵" },
];

export const EMOTION_TAGS = [
  { id: "planned", label: "Planned", emoji: "✅", color: "#22C55E" },
  { id: "impulse", label: "Impulse", emoji: "⚡", color: "#F37021" },
  { id: "routine", label: "Routine", emoji: "🔄", color: "#2E3192" },
  { id: "stressed", label: "Stressed", emoji: "😰", color: "#EF4444" },
  { id: "rewarded", label: "Reward", emoji: "🎉", color: "#F59E0B" },
  { id: "regret", label: "Regret", emoji: "😬", color: "#92278F" },
];

export function getCategoryById(id: string): Category | undefined {
  return [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((c) => c.id === id);
}
