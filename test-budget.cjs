const { format, parseISO, startOfMonth, endOfMonth, setDate, subMonths, subDays } = require('date-fns');

function getBudgetRange(monthStr, firstDay = 1) {
  const [year, month] = monthStr.split('-').map(Number);
  const budgetMonthDate = new Date(year, month - 1, 1);
  
  if (firstDay === 1) {
    return {
      start: startOfMonth(budgetMonthDate),
      end: endOfMonth(budgetMonthDate)
    };
  }

  const start = setDate(subMonths(budgetMonthDate, 1), firstDay);
  const end = subDays(setDate(budgetMonthDate, firstDay), 1);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

const { start, end } = getBudgetRange('2026-07', 1);
console.log(start, end);

const d = parseISO('2026-07-28');
console.log(d >= start && d <= end);

