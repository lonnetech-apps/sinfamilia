import { PaymentMethod } from '../types/finance';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function getPaymentMethodLabel(method: PaymentMethod): { label: string; icon: string } {
  switch (method) {
    case 'pix':
      return { label: 'Pix Instantâneo', icon: 'Zap' };
    case 'cartao_credito':
      return { label: 'Cartão de Crédito', icon: 'CreditCard' };
    case 'cartao_debito':
      return { label: 'Cartão de Débito', icon: 'CreditCard' };
    case 'boleto':
      return { label: 'Boleto Bancário', icon: 'FileText' };
    case 'dinheiro':
      return { label: 'Dinheiro / Espécie', icon: 'Banknote' };
    default:
      return { label: method, icon: 'DollarSign' };
  }
}
