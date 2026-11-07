export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'boleto';

export type RoleType = 'pai' | 'mae' | 'filho' | 'filha' | 'familia';

export interface Category {
  id: string;
  name: string;
  iconName: string;
  color: string;
  bgLight: string;
  defaultBudget: number;
  description: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  avatarText: string;
  monthlyContribution: number;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  memberId: string;
  paymentMethod: PaymentMethod;
  isEssential: boolean; // true = Essencial (aluguel, arroz, remédio); false = Supérfluo/Flexível (delivery, cinema)
  notes?: string;
  unitPriceInfo?: string; // ex: "3x de R$ 45", "R$ 38/kg", "Pacote mensal"
}

export interface MonthlyConfig {
  monthKey: string; // YYYY-MM
  label: string; // "Novembro 2026"
  familyIncome: number;
  budgets: Record<string, number>; // categoryId -> budget in R$
}

export interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  iconName: string;
  currentAmount: number;
  previousAmount: number;
  difference: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  keyContributors: string[];
}

export interface CategoryBurnout {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  iconName: string;
  budget: number;
  spent: number;
  remaining: number;
  percentSpent: number;
  expectedPacePercent: number;
  status: 'critical' | 'warning' | 'normal' | 'under';
  daysLeftInMonth: number;
  currentDay: number;
  totalDays: number;
  projectedEndAmount: number;
  estimatedDaysToExhaust?: number;
}

export interface SavingsItem {
  id: string;
  title: string;
  category: string;
  currentMonthlyCost: number;
  potentialSaving: number;
  difficulty: 'facil' | 'medio' | 'planejado';
  suggestion: string;
  type: 'corte' | 'marca_barata' | 'renegociacao' | 'habito';
}
