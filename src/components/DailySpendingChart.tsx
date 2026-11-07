import React, { useState } from 'react';
import { ExpenseItem } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface DailySpendingChartProps {
  expenses: ExpenseItem[];
  monthKey: string;
}

export const DailySpendingChart: React.FC<DailySpendingChartProps> = ({ expenses, monthKey }) => {
  const [hoveredDay, setHoveredDay] = useState<{ day: number; amount: number; count: number } | null>(null);

  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const totalDays = new Date(year, month, 0).getDate();

  // Aggregate expenses per day
  const dailyTotals: Record<number, { amount: number; count: number }> = {};
  for (let d = 1; d <= totalDays; d++) {
    dailyTotals[d] = { amount: 0, count: 0 };
  }

  expenses.forEach(exp => {
    if (exp.date.startsWith(monthKey)) {
      const dayNum = parseInt(exp.date.split('-')[2], 10);
      if (dailyTotals[dayNum]) {
        dailyTotals[dayNum].amount += exp.amount;
        dailyTotals[dayNum].count += 1;
      }
    }
  });

  const maxDailyAmount = Math.max(...Object.values(dailyTotals).map(d => d.amount), 50);

  return (
    <div className="space-y-3">
      {/* Tooltip info header */}
      <div className="h-6 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          Distribuição dos gastos dia a dia no mês
        </span>
        {hoveredDay ? (
          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
            Dia {String(hoveredDay.day).padStart(2, '0')}: {formatCurrency(hoveredDay.amount)} ({hoveredDay.count} itens)
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">
            Passe o mouse nas barras para detalhar
          </span>
        )}
      </div>

      {/* Bar container */}
      <div className="h-40 flex items-end gap-1 pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
          const dayData = dailyTotals[day];
          const heightPercent = maxDailyAmount > 0 ? (dayData.amount / maxDailyAmount) * 100 : 0;
          const hasSpending = dayData.amount > 0;
          const isHovered = hoveredDay?.day === day;

          return (
            <div
              key={day}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              onMouseEnter={() => setHoveredDay({ day, amount: dayData.amount, count: dayData.count })}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div
                className={`w-full rounded-t-sm transition-all duration-150 ${
                  isHovered
                    ? 'bg-emerald-500 dark:bg-emerald-400'
                    : hasSpending
                    ? 'bg-emerald-600/80 dark:bg-emerald-500/70 hover:bg-emerald-600'
                    : 'bg-slate-200/50 dark:bg-slate-800/50'
                }`}
                style={{ height: `${Math.max(hasSpending ? 8 : 2, heightPercent)}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Axis day numbers (sample every 5 days) */}
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 tabular-nums px-0.5">
        <span>01</span>
        <span>05</span>
        <span>10</span>
        <span>15</span>
        <span>20</span>
        <span>25</span>
        <span>{totalDays}</span>
      </div>
    </div>
  );
};
