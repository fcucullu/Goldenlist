import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getReminderStatus(nextReminderAt: string | null) {
  if (!nextReminderAt) return { overdue: false, label: "No reminder set", daysUntil: 0 };

  const date = new Date(nextReminderAt);
  const overdue = isPast(date);
  const days = Math.abs(differenceInDays(new Date(), date));

  if (overdue) {
    return {
      overdue: true,
      label: days === 0 ? "Due today" : `${days} day${days === 1 ? "" : "s"} overdue`,
      daysUntil: -days,
    };
  }

  return {
    overdue: false,
    label: days === 0 ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`,
    daysUntil: days,
  };
}

export function formatRelativeDate(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export const FREQUENCY_OPTIONS = [
  { value: 2, label: "Every other day" },
  { value: 7, label: "Weekly" },
  { value: 14, label: "Every 2 weeks" },
  { value: 30, label: "Monthly" },
  { value: 90, label: "Quarterly" },
] as const;
