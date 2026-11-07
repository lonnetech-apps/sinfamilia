import React, { useState, useEffect } from 'react';
import { Category, MonthlyConfig } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { X, Check } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MonthlyConfig;
  categories: Category[];
  onSave: (updatedConfig: MonthlyConfig) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  config,
  categories,
  onSave,
}) => {
  const [incomeStr, setIncomeStr] = useState('');
  const [budgets, setBudgets] = useState<Record<string, string>>({});

  useEffect(() => {
    if (config) {
      setIncomeStr(config.familyIncome.toString());
      const initialBudgets: Record<string, string> = {};
      categories.forEach(cat => {
        initialBudgets[cat.id] = (config.budgets[cat.id] ?? cat.defaultBudget).toString();
      });
      setBudgets(initialBudgets);
    }
  }, [config, categories, isOpen]);

  if (!isOpen) return null;

  const handleBudgetChange = (catId: string, val: string) => {
    setBudgets(prev => ({ ...prev, [catId]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedIncome = parseFloat(incomeStr.replace(',', '.')) || 0;
    const numericBudgets: Record<string, number> = {};

    categories.forEach(cat => {
      const bStr = budgets[cat.id] || '0';
      numericBudgets[cat.id] = parseFloat(bStr.replace(',', '.')) || cat.defaultBudget;
    });

    onSave({
      ...config,
      familyIncome: parsedIncome,
      budgets: numericBudgets,
    });

    onClose();
  };

  const totalAllocatedBudget = Object.values(budgets).reduce((sum, val) => {
    return sum + (parseFloat(val.replace(',', '.')) || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Ajustar Renda & Limites de Orçamento
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize a renda familiar e os tetos de cada categoria
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* Renda Familiar */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <label className="block font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Renda Familiar Total (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                value={incomeStr}
                onChange={e => setIncomeStr(e.target.value)}
                placeholder="8300,00"
                required
                className="w-full pl-9 pr-3 py-2 text-sm font-bold font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Salários líquidos somados + fontes de renda extras da família.
            </p>
          </div>

          {/* Categorias e Tetos */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Limites por Categoria (Teto de Gasto Mensal)
              </span>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                Total planejado: {formatCurrency(totalAllocatedBudget)}
              </span>
            </div>

            <div className="space-y-2">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="relative w-32 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">
                      R$
                    </span>
                    <input
                      type="text"
                      value={budgets[cat.id] ?? ''}
                      onChange={e => handleBudgetChange(cat.id, e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-8 pr-2 py-1.5 text-xs font-mono font-bold tabular-nums text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg shadow-sm transition"
            >
              Salvar Orçamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
