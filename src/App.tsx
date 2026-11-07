/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Category, ExpenseItem, FamilyMember, MonthlyConfig } from './types/finance';
import {
  INITIAL_CATEGORIES,
  INITIAL_EXPENSES,
  INITIAL_MEMBERS,
  INITIAL_MONTH_CONFIGS,
} from './data/initialData';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ExpenseListManager } from './components/ExpenseListManager';
import { TrendsAndBurnout } from './components/TrendsAndBurnout';
import { SavingsAdvisor } from './components/SavingsAdvisor';
import { ExpenseModal } from './components/ExpenseModal';
import { BudgetModal } from './components/BudgetModal';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('finfamilia_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('finfamilia_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('finfamilia_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'trends' | 'savings'>('overview');

  // Selected month
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');

  // Main Finance Data with localStorage persistence
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('finfamilia_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_EXPENSES;
      }
    }
    return INITIAL_EXPENSES;
  });

  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [members] = useState<FamilyMember[]>(INITIAL_MEMBERS);

  const [monthConfigs, setMonthConfigs] = useState<Record<string, MonthlyConfig>>(() => {
    const saved = localStorage.getItem('finfamilia_configs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_MONTH_CONFIGS;
      }
    }
    return INITIAL_MONTH_CONFIGS;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('finfamilia_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('finfamilia_configs', JSON.stringify(monthConfigs));
  }, [monthConfigs]);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseItem | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Expense CRUD Handlers
  const handleOpenNewExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (item: ExpenseItem) => {
    setExpenseToEdit(item);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (data: Omit<ExpenseItem, 'id'>, id?: string) => {
    if (id) {
      // Update
      setExpenses(prev =>
        prev.map(item => (item.id === id ? { ...data, id } : item))
      );
    } else {
      // Create new
      const newId = `exp-${Date.now()}`;
      setExpenses(prev => [{ ...data, id: newId }, ...prev]);
    }
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(item => item.id !== id));
  };

  const handleDuplicateExpense = (item: ExpenseItem) => {
    const duplicated: ExpenseItem = {
      ...item,
      id: `exp-${Date.now()}`,
      name: `${item.name} (Cópia)`,
      date: new Date().toISOString().split('T')[0],
    };
    setExpenses(prev => [duplicated, ...prev]);
  };

  const handleSaveBudget = (updatedConfig: MonthlyConfig) => {
    setMonthConfigs(prev => ({
      ...prev,
      [updatedConfig.monthKey]: updatedConfig,
    }));
  };

  const handleResetDefaultData = () => {
    setExpenses(INITIAL_EXPENSES);
    setMonthConfigs(INITIAL_MONTH_CONFIGS);
    localStorage.removeItem('finfamilia_expenses');
    localStorage.removeItem('finfamilia_configs');
  };

  const currentMonthConfig = monthConfigs[selectedMonth] || {
    monthKey: selectedMonth,
    label: selectedMonth,
    familyIncome: 8300,
    budgets: {},
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Header conforming to §2 */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewExpense={handleOpenNewExpense}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewDashboard
            expenses={expenses}
            categories={categories}
            members={members}
            monthConfigs={monthConfigs}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            onOpenNewExpense={handleOpenNewExpense}
            onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseListManager
            expenses={expenses}
            categories={categories}
            members={members}
            selectedMonth={selectedMonth}
            onOpenNewExpense={handleOpenNewExpense}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            onDuplicateExpense={handleDuplicateExpense}
            onResetDefaultData={handleResetDefaultData}
          />
        )}

        {activeTab === 'trends' && (
          <TrendsAndBurnout
            expenses={expenses}
            categories={categories}
            monthConfigs={monthConfigs}
            selectedMonth={selectedMonth}
          />
        )}

        {activeTab === 'savings' && (
          <SavingsAdvisor
            expenses={expenses}
            categories={categories}
            monthConfigs={monthConfigs}
            selectedMonth={selectedMonth}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">FinFamília</span>
            <span aria-hidden="true">·</span>
            <span>Controle Financeiro Pessoal & Familiar com Gráficos Intuitivos</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('savings')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            >
              Simulador de Economia
            </button>
            <span aria-hidden="true">·</span>
            <span>Dados salvos localmente</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        categories={categories}
        members={members}
        selectedMonth={selectedMonth}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        config={currentMonthConfig}
        categories={categories}
        onSave={handleSaveBudget}
      />

    </div>
  );
}
