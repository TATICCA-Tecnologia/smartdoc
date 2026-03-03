export type CalendarCellStatus = "safe" | "warning" | "danger" | "expired";

export const getStatusClasses = (status: CalendarCellStatus | null) => {
  if (!status) return "border border-dashed border-muted";

  switch (status) {
    case "expired":
      return "bg-red-100 border-red-300 text-red-800";
    case "danger":
      return "bg-orange-100 border-orange-300 text-orange-800";
    case "warning":
      return "bg-yellow-100 border-yellow-300 text-yellow-800";
    case "safe":
    default:
      return "bg-emerald-50 border-emerald-200 text-emerald-800";
  }
};

export const STATUS_PRIORITY: Record<CalendarCellStatus, number> = {
  safe: 0,
  warning: 1,
  danger: 2,
  expired: 3,
};

export function getMonthMetadata(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Converte para semana começando na segunda-feira (0 = Monday)
  const firstWeekday = (firstDay.getDay() + 6) % 7;

  return { year, month, daysInMonth, firstWeekday };
}