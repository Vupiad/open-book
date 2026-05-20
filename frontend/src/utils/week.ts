export const getWeekStart = (date: Date) => {
  const dayOfWeek = date.getDay();
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const start = new Date(date.getTime());
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const getWeekDays = (weekStart: Date) => {
  const days: number[] = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(weekStart.getTime());
    next.setDate(weekStart.getDate() + i);
    days.push(next.getDate());
  }
  return days;
};

export const formatMonthYear = (weekStart: Date) =>
  weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export const formatWeekStart = (weekStart: Date) =>
  weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
