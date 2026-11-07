import React, { useState } from 'react';
import { Category, ExpenseItem, FamilyMember, MonthlyConfig } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { calculateBurnoutVelocity, getMonthDaysInfo } from '../utils/calculations';
import { CategoryDonutChart } from './CategoryDonutChart';
import { DailySpendingChart } from './DailySpendingChart';
import { ArrowUpRight, AlertTriangle, Sparkles, SlidersHorizontal, Plus } from 'lucide-react';

interface OverviewDashboardProps {
  expenses: ExpenseItem[];
  categories: Category[];
  members: FamilyMember[];
  monthConfigs: Record<string, MonthlyConfig>;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  onOpenNewExpense: () => void;
  onOpenBudgetModal: () => void;
  onNavigateTab: (tab: 'expenses' | 'trends' | 'savings') => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  expenses,
  categories,
  members,
  monthConfigs,
  selectedMonth,
  setSelectedMonth,
  onOpenNewExpense,
  onOpenBudgetModal,
  onNavigateTab,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [highlightCategoryId, setHighlightCategoryId] = useState<string | null>(null);

  const currentConfig = monthConfigs[selectedMonth] || {
    monthKey: selectedMonth,
    label: selectedMonth,
    familyIncome: 8300,
    budgets: {},
  };

  const { currentDay, totalDays, percentMonthElapsed } = getMonthDaysInfo(selectedMonth);

  // Filter expenses by month and selected member
  const monthExpenses = expenses.filter(e => {
    const matchMonth = e.date.startsWith(selectedMonth);
    const matchMember = selectedMemberId === 'all' || e.memberId === selectedMemberId;
    return matchMonth && matchMember;
  });

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBalance = currentConfig.familyIncome - totalSpent;
  const percentBudgetUsed = currentConfig.familyIncome > 0 ? Math.round((totalSpent / currentConfig.familyIncome) * 100) : 0;

  // Essential vs Superfluous
  const essentialTotal = monthExpenses.filter(e => e.isEssential).reduce((sum, e) => sum + e.amount, 0);
  const superfluousTotal = monthExpenses.filter(e => !e.isEssential).reduce((sum, e) => sum + e.amount, 0);
  const essentialPercent = totalSpent > 0 ? Math.round((essentialTotal / totalSpent) * 100) : 0;
  const superfluousPercent = totalSpent > 0 ? Math.round((superfluousTotal / totalSpent) * 100) : 0;

  // Category totals for Donut
  const donutItems = categories.map(cat => {
    const val = monthExpenses
      .filter(e => e.categoryId === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      id: cat.id,
      name: cat.name,
      value: val,
      color: cat.color,
    };
  });

  // Top 5 largest expenses
  const topExpenses = [...monthExpenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Burnout velocity check
  const burnouts = calculateBurnoutVelocity(expenses, selectedMonth, currentConfig, categories);
  const criticalBurnouts = burnouts.filter(b => b.status === 'critical');

  return (
    <div className="space-y-8">
      {/* Top Filter and Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Painel da Família
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Orçamento Geral</span>
            <span aria-hidden="true">·</span>
            <span>Dia {currentDay} de {totalDays} ({percentMonthElapsed}% do mês)</span>
            <span aria-hidden="true">·</span>
            <span>{monthExpenses.length} lançamentos</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="2026-11">Novembro 2026 (Atual)</option>
            <option value="2026-10">Outubro 2026</option>
            <option value="2026-09">Setembro 2026</option>
          </select>

          {/* Member filter */}
          <select
            value={selectedMemberId}
            onChange={e => setSelectedMemberId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todos os Membros</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* Edit Budget & Income button */}
          <button
            onClick={onOpenBudgetModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Ajustar Renda & Limites</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Renda */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Renda Familiar Total
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {formatCurrency(currentConfig.familyIncome)}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>Soma dos membros da casa</span>
          </div>
        </div>

        {/* Card 2: Total Gasto */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Gasto no Mês
            </span>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
              {percentBudgetUsed}% da renda
            </span>
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1">
            {formatCurrency(totalSpent)}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>{monthExpenses.length} despesas contabilizadas</span>
          </div>
        </div>

        {/* Card 3: Saldo Restante */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Saldo Disponível
          </span>
          <p className={`text-2xl font-bold tabular-nums mt-1 ${
            remainingBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(remainingBalance)}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>{remainingBalance >= 0 ? 'Sobrando para reserva' : 'Atenção: déficit familiar'}</span>
          </div>
        </div>

        {/* Card 4: Ritmo do Mês */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Velocidade Geral do Mês
            </span>
            <span className={`text-xs font-semibold tabular-nums ${
              percentBudgetUsed > percentMonthElapsed ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {percentBudgetUsed > percentMonthElapsed ? 'Acima do ritmo' : 'Dentro do ritmo'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {percentBudgetUsed}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              gasto em {percentMonthElapsed}% dos dias
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${
                percentBudgetUsed > percentMonthElapsed ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, percentBudgetUsed)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Critical Alert Banner if Burnout is fast */}
      {criticalBurnouts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-500/15 text-slate-900 dark:text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Alerta de Consumo Acelerado
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                {criticalBurnouts.length === 1 ? (
                  <>A categoria <strong>{criticalBurnouts[0].categoryName}</strong> já consumiu <strong>{criticalBurnouts[0].percentSpent}%</strong> do orçamento em apenas {percentMonthElapsed}% do mês decorrido.</>
                ) : (
                  <><strong>{criticalBurnouts.length} categorias</strong> estão queimando o limite mais rápido do que o ritmo saudável do mês.</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('trends')}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/40 rounded-lg hover:bg-amber-300/80 transition-colors whitespace-nowrap shrink-0"
          >
            Ver Análise de Queima
          </button>
        </div>
      )}

      {/* Main Charts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Donut Chart: Onde estou gastando mais */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Onde Você Está Gastando Mais
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribuição das despesas por categoria no mês
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('trends')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Ver Tendências</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <CategoryDonutChart
            items={donutItems}
            total={totalSpent}
            selectedCategoryId={highlightCategoryId}
            onSelectCategory={setHighlightCategoryId}
          />

          {/* Essential vs Superfluous breakdown bar */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Divisão de Prioridade:
              </span>
              <span className="tabular-nums text-slate-500 dark:text-slate-400">
                Essencial ({essentialPercent}%) · Supérfluo ({superfluousPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full flex overflow-hidden">
              <div
                className="bg-emerald-600 dark:bg-emerald-500 h-full"
                style={{ width: `${essentialPercent}%` }}
                title={`Essencial: ${formatCurrency(essentialTotal)}`}
              />
              <div
                className="bg-amber-500 dark:bg-amber-400 h-full"
                style={{ width: `${superfluousPercent}%` }}
                title={`Supérfluo: ${formatCurrency(superfluousTotal)}`}
              />
            </div>
          </div>
        </div>

        {/* Daily Spending Evolution Chart */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Evolução dos Gastos Dia a Dia
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Identifique picos de gastos e compras no mês
                </p>
              </div>
              <button
                onClick={onOpenNewExpense}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>+ Lançar</span>
              </button>
            </div>

            <DailySpendingChart expenses={monthExpenses} monthKey={selectedMonth} />
          </div>

          {/* Top 5 expenses list */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Top 5 Maiores Gastos do Mês
              </span>
              <button
                onClick={() => onNavigateTab('expenses')}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-2">
              {topExpenses.map(item => {
                const cat = categories.find(c => c.id === item.categoryId);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat?.color || '#94a3b8' }}
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </span>
                      {!item.isEssential && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium shrink-0">
                          (Flexível)
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums shrink-0">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Action Grid: Shortcuts to Trends and Savings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        
        <div
          onClick={() => onNavigateTab('trends')}
          className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Análise de Tendências
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            Qual categoria aumentou ou diminuiu?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Compare os valores deste mês com o mês passado e veja qual orçamento está acabando mais rápido.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('savings')}
          className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Consultor de Economia
            </span>
            <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            O que deixar ou pagar mais barato?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Simulador interativo de cortes e substituição de marcas no supermercado para poupar mais.
          </p>
        </div>

      </div>

    </div>
  );
};
