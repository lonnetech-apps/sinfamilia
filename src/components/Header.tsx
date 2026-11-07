import React from 'react';
import { Plus, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'expenses' | 'trends' | 'savings';
  setActiveTab: (tab: 'overview' | 'expenses' | 'trends' | 'savings') => void;
  onOpenNewExpense: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewExpense,
  isDark,
  toggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setActiveTab('overview')}
            className="text-left flex items-center gap-2.5 focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
              F
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              FinFamília
            </span>
          </button>
        </div>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Visão Geral
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'expenses'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Lançamentos & Itens
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'trends'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Tendências & Queima
          </button>

          <button
            onClick={() => setActiveTab('savings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'savings'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            O que Cortar & Poupar
          </button>
        </nav>

        {/* Zone 3: 1 primary action button + Theme Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema claro e escuro"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenNewExpense}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Novo Gasto</span>
          </button>
        </div>

      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-200 dark:border-slate-800 gap-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Lançamentos
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'trends'
              ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Tendências & Ritmo
        </button>
        <button
          onClick={() => setActiveTab('savings')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'savings'
              ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Dicas de Corte
        </button>
      </div>
    </header>
  );
};
