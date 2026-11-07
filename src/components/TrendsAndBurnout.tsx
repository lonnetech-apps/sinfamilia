import React, { useState } from 'react';
import { Category, CategoryBurnout, CategoryTrend, ExpenseItem, MonthlyConfig } from '../types/finance';
import { calculateBurnoutVelocity, calculateCategoryTrends, getMonthDaysInfo } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Clock, Zap, CheckCircle2, Flame } from 'lucide-react';

interface TrendsAndBurnoutProps {
  expenses: ExpenseItem[];
  categories: Category[];
  monthConfigs: Record<string, MonthlyConfig>;
  selectedMonth: string;
}

export const TrendsAndBurnout: React.FC<TrendsAndBurnoutProps> = ({
  expenses,
  categories,
  monthConfigs,
  selectedMonth,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'trends' | 'burnout'>('trends');

  const currentConfig = monthConfigs[selectedMonth] || {
    monthKey: selectedMonth,
    label: selectedMonth,
    familyIncome: 8300,
    budgets: {},
  };

  const { currentDay, totalDays, percentMonthElapsed } = getMonthDaysInfo(selectedMonth);

  // Calculate trends (comparing to previous month)
  const trends: CategoryTrend[] = calculateCategoryTrends(expenses, selectedMonth, categories);

  // Calculate burnout rate
  const burnouts: CategoryBurnout[] = calculateBurnoutVelocity(expenses, selectedMonth, currentConfig, categories);

  // Determine previous month label
  const [yearStr, monthStr] = selectedMonth.split('-');
  let prevYear = parseInt(yearStr, 10);
  let prevMonth = parseInt(monthStr, 10) - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

  const increasedCategories = trends.filter(t => t.trend === 'up');
  const decreasedCategories = trends.filter(t => t.trend === 'down');
  const criticalBurnouts = burnouts.filter(b => b.status === 'critical');

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tendências & Velocidade de Gastos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Saiba com precisão quais categorias subiram ou desceram de valor e quais orçamentos estão acabando mais rápido.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveSubTab('trends')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'trends'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tendências (Aumentou / Diminuiu)
          </button>
          <button
            onClick={() => setActiveSubTab('burnout')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'burnout'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Velocidade de Queima</span>
            {criticalBurnouts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: TENDÊNCIAS MÊS A MÊS */}
      {activeSubTab === 'trends' && (
        <div className="space-y-6">
          
          {/* Quick diagnostic strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  {increasedCategories.length} Categorias Aumentaram
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Gastos maiores do que no mês anterior ({prevMonthKey}). Requer atenção!
                </p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {decreasedCategories.length} Categorias Diminuíram
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Economia conquistada em relação ao mês anterior.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed comparative list */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Comparativo Detalhado de Categorias ({prevMonthKey} vs {selectedMonth})
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Valores consolidados em Reais (R$)
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {trends.map(item => {
                const maxVal = Math.max(item.currentAmount, item.previousAmount, 100);
                const prevBarWidth = (item.previousAmount / maxVal) * 100;
                const curBarWidth = (item.currentAmount / maxVal) * 100;

                return (
                  <div key={item.categoryId} className="p-5 space-y-3">
                    
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.categoryColor }}
                        />
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {item.categoryName}
                        </span>
                      </div>

                      {/* Trend Badge */}
                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs">
                          <span className="text-slate-400 dark:text-slate-500">Diferença: </span>
                          <span className={`font-bold tabular-nums ${
                            item.difference > 0 ? 'text-rose-600 dark:text-rose-400' : item.difference < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600'
                          }`}>
                            {item.difference > 0 ? `+${formatCurrency(item.difference)}` : formatCurrency(item.difference)}
                          </span>
                        </div>

                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${
                          item.trend === 'up'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                            : item.trend === 'down'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {item.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                          {item.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                          {item.trend === 'stable' && <Minus className="w-3 h-3" />}
                          <span>
                            {item.trend === 'up' ? `▲ +${item.percentageChange}%` : item.trend === 'down' ? `▼ ${item.percentageChange}%` : '➔ Estável'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Dual Comparative Bars */}
                    <div className="space-y-1.5 pt-1">
                      {/* Previous month bar */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="w-24 text-slate-400 dark:text-slate-500 truncate shrink-0">
                          Mês Anterior
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-400 dark:bg-slate-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${prevBarWidth}%` }}
                          />
                        </div>
                        <span className="w-24 text-right font-semibold text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                          {formatCurrency(item.previousAmount)}
                        </span>
                      </div>

                      {/* Current month bar */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="w-24 text-slate-700 dark:text-slate-300 font-medium truncate shrink-0">
                          Mês Atual
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${curBarWidth}%`,
                              backgroundColor: item.categoryColor,
                            }}
                          />
                        </div>
                        <span className="w-24 text-right font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
                          {formatCurrency(item.currentAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Contributors / Explanation */}
                    {item.keyContributors.length > 0 && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-0.5">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Principais itens lançados:</span>
                        <span className="truncate">{item.keyContributors.join(', ')}</span>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: VELOCIDADE DE QUEIMA DO ORÇAMENTO (Qual acaba mais rápido?) */}
      {activeSubTab === 'burnout' && (
        <div className="space-y-6">
          
          {/* Diagnostic banner */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Relógio de Consumo do Mês
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Hoje é dia {currentDay} de {totalDays} ({percentMonthElapsed}% do mês decorrido)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Categorias que já gastaram mais do que <strong>{percentMonthElapsed}%</strong> do seu orçamento estão queimando limite mais rápido do que deveriam e podem estourar antes do dia 30.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-semibold">
                  🚨 Esgotando Rápido
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-semibold">
                  ⚠️ Atenção
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold">
                  ✅ Ritmo Normal
                </span>
              </div>
            </div>
          </div>

          {/* Cards for each category burnout speed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {burnouts.map(b => {
              const isOverBudget = b.spent > b.budget && b.budget > 0;
              const burnBadge = 
                b.status === 'critical'
                  ? { label: '🚨 Queimando Rápido', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300' }
                  : b.status === 'warning'
                  ? { label: '⚠️ Ritmo Acelerado', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300' }
                  : b.status === 'under'
                  ? { label: '🌱 Super Econômico', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300' }
                  : { label: '✅ Ritmo Saudável', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300' };

              return (
                <div
                  key={b.categoryId}
                  className={`p-5 rounded-xl border bg-white dark:bg-slate-900 transition-all ${
                    b.status === 'critical'
                      ? 'border-rose-300 dark:border-rose-900 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Category Title & Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: b.categoryColor }}
                      />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {b.categoryName}
                      </h4>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${burnBadge.color}`}>
                      {burnBadge.label}
                    </span>
                  </div>

                  {/* Numbers */}
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Gasto: <strong className="text-slate-900 dark:text-white font-mono">{formatCurrency(b.spent)}</strong>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Orçamento: <strong className="text-slate-900 dark:text-white font-mono">{formatCurrency(b.budget)}</strong>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverBudget
                          ? 'bg-rose-600'
                          : b.status === 'critical'
                          ? 'bg-rose-500'
                          : b.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, b.percentSpent)}%` }}
                    />
                  </div>

                  {/* Pace comparison note */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    <span className="tabular-nums">
                      <strong>{b.percentSpent}% consumido</strong> vs {b.expectedPacePercent}% do mês
                    </span>
                    <span className="tabular-nums font-medium">
                      Resta: {formatCurrency(b.remaining)}
                    </span>
                  </div>

                  {/* Estimation / Burnout diagnostic text */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    {isOverBudget ? (
                      <p className="text-rose-600 dark:text-rose-400 font-semibold">
                        ❌ Orçamento estourado em {formatCurrency(b.spent - b.budget)}!
                      </p>
                    ) : b.status === 'critical' && b.estimatedDaysToExhaust !== undefined ? (
                      <p className="text-rose-600 dark:text-rose-400 font-semibold">
                        🚨 Neste ritmo, o teto esgotará em aprox. {b.estimatedDaysToExhaust} dias (por volta do dia {Math.min(30, currentDay + b.estimatedDaysToExhaust)})!
                      </p>
                    ) : b.status === 'warning' ? (
                      <p className="text-amber-600 dark:text-amber-400">
                        ⚠️ Consumo ligeiramente acima da média diária. Controle novas compras.
                      </p>
                    ) : (
                      <p className="text-emerald-600 dark:text-emerald-400">
                        ✅ Ritmo excelente. Projeção de fechar o mês com folga no orçamento.
                      </p>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
