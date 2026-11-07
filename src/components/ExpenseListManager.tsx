import React, { useState } from 'react';
import { Category, ExpenseItem, FamilyMember } from '../types/finance';
import { formatCurrency, formatDateBR, getPaymentMethodLabel } from '../utils/formatters';
import { Search, Plus, Trash2, Edit2, Copy, Download, RotateCcw, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExpenseListManagerProps {
  expenses: ExpenseItem[];
  categories: Category[];
  members: FamilyMember[];
  selectedMonth: string;
  onOpenNewExpense: () => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onDuplicateExpense: (expense: ExpenseItem) => void;
  onResetDefaultData: () => void;
}

export const ExpenseListManager: React.FC<ExpenseListManagerProps> = ({
  expenses,
  categories,
  members,
  selectedMonth,
  onOpenNewExpense,
  onEditExpense,
  onDeleteExpense,
  onDuplicateExpense,
  onResetDefaultData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all'); // all, essential, superfluous

  // Filter current month and search terms
  const filteredExpenses = expenses.filter(item => {
    const matchMonth = item.date.startsWith(selectedMonth);
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategory = filterCategory === 'all' || item.categoryId === filterCategory;
    const matchMember = filterMember === 'all' || item.memberId === filterMember;
    const matchPriority =
      filterPriority === 'all' ||
      (filterPriority === 'essential' && item.isEssential) ||
      (filterPriority === 'superfluous' && !item.isEssential);

    return matchMonth && matchSearch && matchCategory && matchMember && matchPriority;
  });

  const totalFiltered = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Data', 'Nome do Item', 'Valor (R$)', 'Categoria', 'Membro da Família', 'Essencial?', 'Forma de Pagamento', 'Notas'];
    const rows = filteredExpenses.map(e => {
      const cat = categories.find(c => c.id === e.categoryId)?.name || e.categoryId;
      const mem = members.find(m => m.id === e.memberId)?.name || e.memberId;
      return [
        e.date,
        `"${e.name.replace(/"/g, '""')}"`,
        e.amount.toFixed(2),
        `"${cat}"`,
        `"${mem}"`,
        e.isEssential ? 'Sim' : 'Não (Supérfluo)',
        e.paymentMethod,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `despesas-familia-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Lançamentos de Gastos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastre o nome do item e o valor gasto para alimentar os gráficos do mês.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Deseja restaurar os dados de exemplo da família padrão?')) {
                onResetDefaultData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Recarregar dados demonstrativos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            onClick={onOpenNewExpense}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Adicionar Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do item (ex: arroz, conta de luz, farmácia)..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Todas as Categorias</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Member filter */}
        <select
          value={filterMember}
          onChange={e => setFilterMember(e.target.value)}
          className="px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Quem Gastou</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Prioridade</option>
          <option value="essential">Apenas Essenciais</option>
          <option value="superfluous">Apenas Supérfluos / Corte</option>
        </select>
      </div>

      {/* Summary line */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Mostrando <strong>{filteredExpenses.length}</strong> itens cadastrados em {selectedMonth}
        </span>
        <span className="tabular-nums">
          Subtotal filtrado: <strong className="text-slate-900 dark:text-white font-mono">{formatCurrency(totalFiltered)}</strong>
        </span>
      </div>

      {/* Table of expenses */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm font-medium">Nenhum gasto encontrado para os filtros selecionados.</p>
            <p className="text-xs mt-1">Clique no botão acima para adicionar um novo item ou limpe a busca.</p>
            <button
              onClick={onOpenNewExpense}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              + Adicionar Primeiro Gasto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item & Observações</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Membro</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4 text-right">Valor Gasto</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExpenses.map(item => {
                  const cat = categories.find(c => c.id === item.categoryId);
                  const mem = members.find(m => m.id === item.memberId);
                  const pay = getPaymentMethodLabel(item.paymentMethod);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Name & Priority */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {item.name}
                          </span>
                          {!item.isEssential && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                              Candidato a Corte
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs">
                            {item.notes}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || '#94a3b8' }}
                          />
                          {cat?.name || item.categoryId}
                        </span>
                      </td>

                      {/* Member */}
                      <td className="py-3 px-4">
                        <span className="text-slate-600 dark:text-slate-400">
                          {mem?.name || 'Família'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatDateBR(item.date)}
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {pay.label}
                      </td>

                      {/* Value */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums font-mono text-sm">
                        {formatCurrency(item.amount)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditExpense(item)}
                            title="Editar lançamento"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDuplicateExpense(item)}
                            title="Duplicar gasto"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Excluir o gasto "${item.name}"?`)) {
                                onDeleteExpense(item.id);
                              }
                            }}
                            title="Excluir gasto"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
