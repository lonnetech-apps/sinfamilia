import { Category, CategoryBurnout, CategoryTrend, ExpenseItem, MonthlyConfig, SavingsItem } from '../types/finance';

export function getMonthDaysInfo(monthKey: string): { currentDay: number; totalDays: number; percentMonthElapsed: number } {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  
  // Total days in that month
  const totalDays = new Date(year, month, 0).getDate();
  
  // Real or simulated current day for the month
  const now = new Date();
  const isCurrentMonth = (now.getFullYear() === year && now.getMonth() + 1 === month);
  
  let currentDay = totalDays;
  if (isCurrentMonth) {
    currentDay = Math.min(now.getDate(), totalDays);
  } else if (monthKey === '2026-11') {
    // Current simulated date is Nov 6-7, 2026
    currentDay = 7;
  }
  
  const percentMonthElapsed = Math.round((currentDay / totalDays) * 100);
  
  return { currentDay, totalDays, percentMonthElapsed };
}

export function filterExpensesByMonth(expenses: ExpenseItem[], monthKey: string): ExpenseItem[] {
  return expenses.filter(exp => exp.date.startsWith(monthKey));
}

export function calculateCategoryTotals(expenses: ExpenseItem[], monthKey: string): Record<string, number> {
  const monthExpenses = filterExpensesByMonth(expenses, monthKey);
  const totals: Record<string, number> = {};
  
  monthExpenses.forEach(exp => {
    totals[exp.categoryId] = (totals[exp.categoryId] || 0) + exp.amount;
  });
  
  return totals;
}

export function calculateCategoryTrends(
  expenses: ExpenseItem[],
  currentMonthKey: string,
  categories: Category[]
): CategoryTrend[] {
  // Determine previous month key (e.g. 2026-11 -> 2026-10)
  const [yearStr, monthStr] = currentMonthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  
  if (month === 1) {
    month = 12;
    year -= 1;
  } else {
    month -= 1;
  }
  const prevMonthKey = `${year}-${String(month).padStart(2, '0')}`;

  const currentTotals = calculateCategoryTotals(expenses, currentMonthKey);
  const prevTotals = calculateCategoryTotals(expenses, prevMonthKey);

  const currentMonthExpenses = filterExpensesByMonth(expenses, currentMonthKey);

  return categories.map(cat => {
    const cur = currentTotals[cat.id] || 0;
    const prev = prevTotals[cat.id] || 0;
    const diff = cur - prev;
    
    let percentageChange = 0;
    if (prev > 0) {
      percentageChange = Math.round(((cur - prev) / prev) * 100 * 10) / 10;
    } else if (cur > 0) {
      percentageChange = 100;
    }

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (percentageChange > 3) {
      trend = 'up';
    } else if (percentageChange < -3) {
      trend = 'down';
    }

    // Get key item names for this category in current month
    const topItems = currentMonthExpenses
      .filter(e => e.categoryId === cat.id)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map(e => e.name);

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
      iconName: cat.iconName,
      currentAmount: cur,
      previousAmount: prev,
      difference: diff,
      percentageChange,
      trend,
      keyContributors: topItems,
    };
  });
}

export function calculateBurnoutVelocity(
  expenses: ExpenseItem[],
  monthKey: string,
  config: MonthlyConfig,
  categories: Category[]
): CategoryBurnout[] {
  const { currentDay, totalDays, percentMonthElapsed } = getMonthDaysInfo(monthKey);
  const currentTotals = calculateCategoryTotals(expenses, monthKey);
  const daysLeftInMonth = Math.max(0, totalDays - currentDay);

  return categories.map(cat => {
    const budget = config.budgets[cat.id] || cat.defaultBudget;
    const spent = currentTotals[cat.id] || 0;
    const remaining = Math.max(0, budget - spent);
    const percentSpent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    
    // Status based on percent spent vs percent month elapsed
    let status: 'critical' | 'warning' | 'normal' | 'under' = 'normal';
    
    if (budget > 0) {
      if (percentSpent >= 90 && currentDay < totalDays * 0.8) {
        status = 'critical';
      } else if (percentSpent > percentMonthElapsed * 1.35) {
        status = 'critical';
      } else if (percentSpent > percentMonthElapsed * 1.1) {
        status = 'warning';
      } else if (percentSpent < percentMonthElapsed * 0.65) {
        status = 'under';
      } else {
        status = 'normal';
      }
    }

    // Daily run rate
    const dailySpendRate = currentDay > 0 ? spent / currentDay : 0;
    const projectedEndAmount = dailySpendRate * totalDays;

    let estimatedDaysToExhaust: number | undefined = undefined;
    if (dailySpendRate > 0 && remaining > 0) {
      estimatedDaysToExhaust = Math.round(remaining / dailySpendRate);
    } else if (remaining <= 0) {
      estimatedDaysToExhaust = 0;
    }

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
      iconName: cat.iconName,
      budget,
      spent,
      remaining,
      percentSpent,
      expectedPacePercent: percentMonthElapsed,
      status,
      daysLeftInMonth,
      currentDay,
      totalDays,
      projectedEndAmount,
      estimatedDaysToExhaust,
    };
  }).sort((a, b) => {
    // Sort critical and highest percent spent first so user sees what's burning out quickest!
    if (a.status === 'critical' && b.status !== 'critical') return -1;
    if (b.status === 'critical' && a.status !== 'critical') return 1;
    return b.percentSpent - a.percentSpent;
  });
}

export function getSavingsOpportunities(
  expenses: ExpenseItem[],
  monthKey: string
): SavingsItem[] {
  const monthExpenses = filterExpensesByMonth(expenses, monthKey);

  // Check specific spending patterns
  const deliveryTotal = monthExpenses
    .filter(e => e.categoryId === 'lazer' && !e.isEssential)
    .reduce((sum, e) => sum + e.amount, 0);

  const marketExpenses = monthExpenses
    .filter(e => e.categoryId === 'alimentacao');
  const marketTotal = marketExpenses.reduce((sum, e) => sum + e.amount, 0);

  const streamingTotal = monthExpenses
    .filter(e => e.categoryId === 'servicos')
    .reduce((sum, e) => sum + e.amount, 0);

  const energyExpense = monthExpenses.find(e => e.categoryId === 'contas' && e.name.toLowerCase().includes('energia'));

  const suggestions: SavingsItem[] = [
    {
      id: 'sav-mercado',
      title: 'Substituição Inteligente em Supermercado & Marcas Próprias',
      category: 'Alimentação & Mercado',
      currentMonthlyCost: marketTotal > 0 ? marketTotal : 1480,
      potentialSaving: 220,
      difficulty: 'facil',
      suggestion: 'Trocar produtos de limpeza e itens básicos por marcas próprias de atacadistas/supermercados gera em média 15% a 20% de economia sem perder qualidade.',
      type: 'marca_barata',
    },
    {
      id: 'sav-delivery',
      title: 'Reduzir 2 Pedidos de Delivery (iFood / Pizzas) no Mês',
      category: 'Lazer & Restaurantes',
      currentMonthlyCost: deliveryTotal > 0 ? deliveryTotal : 230,
      potentialSaving: 140,
      difficulty: 'facil',
      suggestion: 'Preparar hambúrguer caseiro ou lanche em família em 2 noites substitui a taxa de entrega e o valor elevado dos apps, economizando mais de R$ 140 por mês.',
      type: 'corte',
    },
    {
      id: 'sav-energia',
      title: 'Eficiência Energética & Ar-Condicionado / Chuveiro',
      category: 'Contas & Utilidades',
      currentMonthlyCost: energyExpense ? energyExpense.amount : 285,
      potentialSaving: 65,
      difficulty: 'medio',
      suggestion: 'Ajustar o ar-condicionado para 23°C (em vez de 19°C) e reduzir banhos em 3 minutos corta cerca de 22% da tarifa elétrica mensal.',
      type: 'habito',
    },
    {
      id: 'sav-stream',
      title: 'Auditoria de Assinaturas & Streaming Duplicados',
      category: 'Assinaturas & Conexão',
      currentMonthlyCost: streamingTotal > 0 ? streamingTotal : 95,
      potentialSaving: 45,
      difficulty: 'facil',
      suggestion: 'Alternar serviços (manter 1 streaming ativo por vez ou migrar para plano família compartilhado) evita pagar mensalidades não aproveitadas.',
      type: 'renegociacao',
    },
    {
      id: 'sav-combustivel',
      title: 'Otimização de Rotas & App de Abastecimento com Cashback',
      category: 'Transporte & Combustível',
      currentMonthlyCost: 265,
      potentialSaving: 55,
      difficulty: 'facil',
      suggestion: 'Usar apps com desconto de posto (como Shell Box, Premmia ou Ipiranga) + calibrar pneus semanalmente gera até 8% de rendimento de combustível.',
      type: 'marca_barata',
    },
  ];

  return suggestions;
}
