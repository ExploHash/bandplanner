// Month helpers. offset is relative to the current month: 1 = next month.

export function monthInfo(offset) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return {
    year: first.getFullYear(),
    month: first.getMonth(), // 0-based
    daysInMonth: new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(),
    title: first.toLocaleDateString("en", { month: "long", year: "numeric" }),
    firstWeekday: (first.getDay() + 6) % 7, // Monday = 0
  };
}

export function dayISO(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
