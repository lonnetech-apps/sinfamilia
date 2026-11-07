import React, { useState } from 'react';
import { Category, ExpenseItem, MonthlyConfig, SavingsItem } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { getSavingsOpportunities } from '../utils/calculations';
import { Sparkles, Check, Scissors, ShoppingCart, Zap, DollarSign, Calculator, HelpCircle } from 'lucide-react';

interface SavingsAdvisorProps {
  expenses: ExpenseItem[];
  categories: Category[];
  monthConfigs: Record<string, MonthlyConfig>;
  selectedMonth: string;
}

export const SavingsAdvisor: React.FC<SavingsAdvisorProps> = ({
  expenses,
  categories,
  monthConfigs,
  selectedMonth,
}) => {
  const currentConfig = monthConfigs[selectedMonth] || {
    monthKey: selectedMonth,
    label: selectedMonth,
    familyIncome: 8300,
    budgets: {},
  };

  const monthExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const currentBalance = currentConfig.familyIncome - totalSpent;

  // Potential savings opportunities
  const suggestions = getSavingsOpportunities(expenses, selectedMonth);

  // User simulation state: which savings opportunities are selected
  const [selectedSavings, setSelectedSavings] = useState<Record<string, boolean>>({
    'sav-mercado': true,
    'sav-delivery': true,
    'sav-stream': true,
    'sav-energia': false,
    'sav-combustivel': false,
  });

  // User item cut simulation: items checked to cut or reduce
  const [cutItems, setCutItems] = useState<Record<string, number>>({}); // expenseId -> percentage reduction (50 or 100)

  const toggleSavings = (id: string) => {
    setSelectedSavings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setItemCutPercentage = (id: string, pct: number) => {
    setCutItems(prev => {
      const copy = { ...prev };
      if (pct === 0) {
        delete copy[id];
      } else {
        copy[id] = pct;
      }
      return copy;
    });
  };

  // Calculate simulated monthly savings from suggestions
  const suggestionsSavingsTotal = suggestions.reduce((sum, item) => {
    return selectedSavings[item.id] ? sum + item.potentialSaving : sum;
  }, 0);

  // Calculate simulated cuts from custom items
  const customItemsSavingsTotal = Object.entries(cutItems).reduce((sum, [id, pct]) => {
    const exp = monthExpenses.find(e => e.id === id);
    if (!exp) return sum;
    return sum + (exp.amount * (pct / 100));
  }, 0);

  const totalSimulatedSavings = suggestionsSavingsTotal + customItemsSavingsTotal;
  const newSimulatedBalance = currentBalance + totalSimulatedSavings;
  const yearlySavings = totalSimulatedSavings * 12;

  // Filter superfluous items candidates for cutting
  const superfluousItems = monthExpenses.filter(e => !e.isEssential);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Consultor de Economia: O que Deixar ou Pagar Mais Barato
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulador prático para identificar gastos dispensáveis, marcas mais acessíveis e potencial de poupança familiar.
          </p>
        </div>
      </div>

      {/* Simulator Hero Card */}
      <div className="p-6 bg-emerald-950 text-white rounded-2xl border border-emerald-900 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <Calculator className="w-4 h-4" />
              <span>Resultado da Sua Simulação de Economia</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums font-mono">
                +{formatCurrency(totalSimulatedSavings)}
              </span>
              <span className="text-xs text-emerald-200">
                poupados por mês
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-1">
              Equivale a <strong>{formatCurrency(yearlySavings)}</strong> acumulados em 1 ano na reserva da família!
            </p>
          </div>

          <div className="bg-emerald-900/60 p-4 rounded-xl border border-emerald-800 text-xs space-y-2 shrink-0 min-w-[240px]">
            <div className="flex items-center justify-between text-emerald-200">
              <span>Saldo Atual:</span>
              <span className="font-bold tabular-nums font-mono text-white">{formatCurrency(currentBalance)}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-300 font-semibold border-t border-emerald-800/80 pt-1.5">
              <span>Novo Saldo Previsto:</span>
              <span className="font-bold tabular-nums font-mono text-emerald-300 text-sm">{formatCurrency(newSimulatedBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Sugestões Prontas vs Corte de Itens Reais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Recomendações Estruturadas (Marcas mais baratas / Renegociação) */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Oportunidades de Substituição e Hábitos</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Marque as opções que você e sua família aceitam aplicar:
            </p>
          </div>

          <div className="space-y-3">
            {suggestions.map(sug => {
              const isChecked = !!selectedSavings[sug.id];

              return (
                <div
                  key={sug.id}
                  onClick={() => toggleSavings(sug.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {sug.title}
                        </h4>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono whitespace-nowrap">
                          +{formatCurrency(sug.potentialSaving)}/mês
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {sug.suggestion}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                        <span>Categoria: {sug.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{sug.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Corte e Redução de Itens Reais Lançados */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Simular Redução nos Seus Itens Reais</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Escolha se quer pagar mais barato (-20%, -50%) ou deixar de gastar (-100%):
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {monthExpenses.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-500">Nenhum item lançado neste mês.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                {monthExpenses.map(item => {
                  const cutPct = cutItems[item.id] || 0;
                  const itemSaving = item.amount * (cutPct / 100);

                  return (
                    <div key={item.id} className="p-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                              {item.name}
                            </span>
                            {!item.isEssential && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium shrink-0">
                                (Supérfluo)
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                            Valor atual: {formatCurrency(item.amount)}
                          </span>
                        </div>

                        {/* Reduction Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setItemCutPercentage(item.id, cutPct === 20 ? 0 : 20)}
                            className={`px-2 py-1 text-[11px] font-semibold rounded transition ${
                              cutPct === 20
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                            title="Pagar mais barato / negociar (-20%)"
                          >
                            -20%
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemCutPercentage(item.id, cutPct === 50 ? 0 : 50)}
                            className={`px-2 py-1 text-[11px] font-semibold rounded transition ${
                              cutPct === 50
                                ? 'bg-amber-200 text-amber-950 dark:bg-amber-800 dark:text-amber-100'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                            title="Reduzir pela metade (-50%)"
                          >
                            -50%
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemCutPercentage(item.id, cutPct === 100 ? 0 : 100)}
                            className={`px-2 py-1 text-[11px] font-semibold rounded transition ${
                              cutPct === 100
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-700'
                            }`}
                            title="Deixar de gastar / cortar totalmente (-100%)"
                          >
                            Cortar
                          </button>
                        </div>
                      </div>

                      {cutPct > 0 && (
                        <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-between">
                          <span>Simulando redução de {cutPct}%</span>
                          <span className="tabular-nums font-mono">Economiza +{formatCurrency(itemSaving)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
