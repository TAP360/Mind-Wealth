import type { TranslationKey } from "@/localization/en";

export type TransactionType = "expense" | "income";

interface TransactionAdviceInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  emotionTag?: string;
}

export function getLocalTransactionAdvice({
  type,
  amount,
  categoryId,
  emotionTag,
}: TransactionAdviceInput): TranslationKey[] {
  if (type === "income") {
    if (categoryId === "savings") return ["transaction.advice.incomeSavings"];
    if (amount >= 5000) return ["transaction.advice.incomeLarge"];
    if (emotionTag === "impulse" || emotionTag === "rewarded") {
      return ["transaction.advice.incomePause"];
    }
    return ["transaction.advice.income"];
  }

  let emotionAdvice: TranslationKey | undefined;
  if (emotionTag === "stressed") emotionAdvice = "transaction.advice.stressed";
  else if (emotionTag === "regret") emotionAdvice = "transaction.advice.regret";
  else if (emotionTag === "impulse") {
    emotionAdvice =
      amount >= 1000
        ? "transaction.advice.impulseLarge"
        : "transaction.advice.impulse";
  } else if (emotionTag === "planned") emotionAdvice = "transaction.advice.planned";
  else if (emotionTag === "routine") emotionAdvice = "transaction.advice.routine";
  else if (emotionTag === "rewarded") emotionAdvice = "transaction.advice.rewarded";

  let categoryAdvice: TranslationKey;
  switch (categoryId) {
    case "shopping":
      categoryAdvice = "transaction.advice.shopping";
      break;
    case "food":
      categoryAdvice = "transaction.advice.food";
      break;
    case "transport":
      categoryAdvice = "transaction.advice.transport";
      break;
    case "bills":
      categoryAdvice = "transaction.advice.bills";
      break;
    case "savings":
      categoryAdvice = "transaction.advice.savings";
      break;
    default:
      categoryAdvice = "transaction.advice.expense";
  }

  const advice: TranslationKey[] = [];
  if (emotionAdvice) advice.push(emotionAdvice);
  if (amount >= 5000 && emotionTag !== "impulse") {
    advice.push("transaction.advice.largeExpense");
  }
  advice.push(categoryAdvice);
  return advice;
}

export function getTransactionFeelingEmoji(
  type: TransactionType,
  amount: number,
  categoryId: string,
  emotionTag?: string,
) {
  switch (emotionTag) {
    case "stressed":
      return "🫶";
    case "regret":
      return "🌱";
    case "impulse":
      return "🧭";
    case "planned":
      return "✅";
    case "routine":
      return "🌿";
    case "rewarded":
      return "✨";
    default:
      if (amount >= 5000) return type === "income" ? "🎉" : "🧭";
      if (type === "income") {
        return categoryId === "gift" ? "🎁" : categoryId === "investment" ? "📈" : "💚";
      }
      switch (categoryId) {
        case "food":
          return "🍽️";
        case "shopping":
          return "🛍️";
        case "transport":
          return "🚗";
        case "housing":
          return "🏠";
        case "health":
          return "💚";
        case "entertainment":
          return "🎟️";
        case "bills":
          return "🧾";
        case "savings":
          return "🌱";
        default:
          return "✨";
      }
  }
}