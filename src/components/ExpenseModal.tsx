import React, { useState, useEffect } from 'react';
import { Category, ExpenseItem, FamilyMember, PaymentMethod } from '../types/finance';
import { X, Check } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<ExpenseItem, 'id'>, id?: string) => void;
  expenseToEdit?: ExpenseItem | null;
  categories: Category[];
  members: FamilyMember[];
  selectedMonth: string;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  categories,
  members,
  selectedMonth,
}) => {
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [memberId, setMemberId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [isEssential, setIsEssential] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (expenseToEdit) {
      setName(expenseToEdit.name);
      setAmountStr(expenseToEdit.amount.toString());
      setCategoryId(expenseToEdit.categoryId);
      setDate(expenseToEdit.date);
      setMemberId(expenseToEdit.memberId);
      setPaymentMethod(expenseToEdit.paymentMethod);
      setIsEssential(expenseToEdit.isEssential);
      setNotes(expenseToEdit.notes || '');
    } else {
      setName('');
      setAmountStr('');
      setCategoryId(categories[0]?.id || 'alimentacao');
      // Set date to today or start of selected month
      const today = new Date().toISOString().split('T')[0];
      setDate(today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`);
      setMemberId(members[0]?.id || 'casa');
      setPaymentMethod('pix');
      setIsEssential(true);
      setNotes('');
    }
    setError('');
  }, [expenseToEdit, isOpen, categories, members, selectedMonth]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor informe o nome do item.');
      return;
    }

    const parsedAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor informe um valor numérico válido maior que zero.');
      return;
    }

    onSave(
      {
        name: name.trim(),
        amount: parsedAmount,
        categoryId,
        date,
        memberId,
        paymentMethod,
        isEssential,
        notes: notes.trim() || undefined,
      },
      expenseToEdit ? expenseToEdit.id : undefined
    );

    onClose();
  };

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
              {expenseToEdit ? 'Editar Gasto' : 'Novo Lançamento de Gasto'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Coloque o nome do item e o valor para atualizar os gráficos
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Nome do Item */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Nome do Item *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Supermercado Semanal, Conta de Luz, Farmácia"
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Valor Gasto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Valor Gasto (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Data do Gasto *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Categoria e Quem Gastou */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Categoria *
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Quem Gastou? (Membro)
              </label>
              <select
                value={memberId}
                onChange={e => setMemberId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'pix', label: 'Pix' },
                { id: 'cartao_credito', label: 'Crédito' },
                { id: 'cartao_debito', label: 'Débito' },
                { id: 'boleto', label: 'Boleto' },
                { id: 'dinheiro', label: 'Dinheiro' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentMethod(opt.id as PaymentMethod)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                    paymentMethod === opt.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle: Essencial vs Supérfluo (Corte) */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-3">
            <input
              type="checkbox"
              id="isEssential"
              checked={isEssential}
              onChange={e => setIsEssential(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="isEssential" className="cursor-pointer select-none">
              <span className="font-bold text-slate-900 dark:text-white block">
                Item Essencial da Família
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Desmarque esta opção se este item for flexível ou supérfluo (ex: lazer, delivery, compras por impulso). Isso alimenta a ferramenta "O que Cortar e Poupar".
              </span>
            </label>
          </div>

          {/* Observações / Detalhes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Comprado no atacado, aumento pela bandeira tarifária..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Buttons */}
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
              {expenseToEdit ? 'Atualizar Gasto' : 'Salvar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
