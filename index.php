<?php
/**
 * FinFamília - Controle Financeiro Pessoal & Familiar
 * Sistema completo em PHP 8.x com PDO (SQLite / MySQL) e Chart.js
 */
require_once __DIR__ . '/db.php';

$pdo = getDbConnection();

// Mês selecionado (padrão: mês atual YYYY-MM)
$selectedMonth = $_GET['month'] ?? date('Y-m');
$prevMonth = date('Y-m', strtotime($selectedMonth . '-01 -1 month'));

// Processar inclusão de novo gasto via POST
$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_expense') {
    $nome = trim($_POST['nome'] ?? '');
    $valor = floatval(str_replace(',', '.', $_POST['valor'] ?? '0'));
    $categoriaId = $_POST['categoria_id'] ?? '';
    $data = $_POST['data'] ?? date('Y-m-d');
    $membro = $_POST['membro'] ?? 'Geral';
    $essencial = isset($_POST['essencial']) ? 1 : 0;
    $pagamento = $_POST['pagamento'] ?? 'pix';
    $notas = trim($_POST['notas'] ?? '');

    if (!empty($nome) && $valor > 0 && !empty($categoriaId)) {
        $stmt = $pdo->prepare("INSERT INTO despesas (nome, valor, categoria_id, data_gasto, membro, essencial, forma_pagamento, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$nome, $valor, $categoriaId, $data, $membro, $essencial, $pagamento, $notas]);
        header("Location: index.php?month=" . urlencode($selectedMonth) . "&saved=1");
        exit;
    } else {
        $message = "Por favor preencha o nome do item e um valor válido.";
    }
}

// Deletar gasto
if (isset($_GET['delete_id'])) {
    $stmt = $pdo->prepare("DELETE FROM despesas WHERE id = ?");
    $stmt->execute([intval($_GET['delete_id'])]);
    header("Location: index.php?month=" . urlencode($selectedMonth));
    exit;
}

// Consultar categorias
$stmtCat = $pdo->query("SELECT * FROM categorias ORDER BY nome ASC");
$categorias = $stmtCat->fetchAll(PDO::FETCH_ASSOC);
$catMap = [];
foreach ($categorias as $c) {
    $catMap[$c['id']] = $c;
}

// Consultar despesas do mês selecionado
$stmtExp = $pdo->prepare("SELECT * FROM despesas WHERE data_gasto LIKE ? ORDER BY data_gasto DESC, id DESC");
$stmtExp->execute([$selectedMonth . '%']);
$despesas = $stmtExp->fetchAll(PDO::FETCH_ASSOC);

// Totais e cálculos
$totalGasto = 0;
$totalEssencial = 0;
$totalSuperfluo = 0;
$gastosPorCategoria = [];

foreach ($despesas as $d) {
    $val = floatval($d['valor']);
    $totalGasto += $val;
    if ($d['essencial']) {
        $totalEssencial += $val;
    } else {
        $totalSuperfluo += $val;
    }
    $cId = $d['categoria_id'];
    $gastosPorCategoria[$cId] = ($gastosPorCategoria[$cId] ?? 0) + $val;
}

// Despesas do mês anterior para gráfico de tendências (aumentou ou diminuiu)
$stmtPrev = $pdo->prepare("SELECT categoria_id, SUM(valor) as total FROM despesas WHERE data_gasto LIKE ? GROUP BY categoria_id");
$stmtPrev->execute([$prevMonth . '%']);
$prevGastosPorCategoria = [];
foreach ($stmtPrev->fetchAll(PDO::FETCH_ASSOC) as $row) {
    $prevGastosPorCategoria[$row['categoria_id']] = floatval($row['total']);
}

// Dados para os gráficos Chart.js
$chartLabels = [];
$chartDataCurrent = [];
$chartDataPrev = [];
$chartColors = [];

foreach ($categorias as $cat) {
    $cId = $cat['id'];
    $cur = $gastosPorCategoria[$cId] ?? 0;
    $prev = $prevGastosPorCategoria[$cId] ?? 0;
    
    if ($cur > 0 || $prev > 0) {
        $chartLabels[] = $cat['nome'];
        $chartDataCurrent[] = $cur;
        $chartDataPrev[] = $prev;
        $chartColors[] = $cat['cor'] ?? '#3b82f6';
    }
}

// Renda familiar padrão
$rendaFamiliar = 8300.00;
$saldoRestante = $rendaFamiliar - $totalGasto;

// Dias no mês para cálculo de velocidade de queima
$currentDay = intval(date('d'));
$totalDaysInMonth = intval(date('t', strtotime($selectedMonth . '-01')));
$percentMonthElapsed = round(($currentDay / $totalDaysInMonth) * 100);
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FinFamília - Controle Financeiro em PHP</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .tabular-nums { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen">

    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
            <div class="flex items-center gap-3">
                <span class="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <span class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black">F</span>
                    FinFamília <span class="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-medium">PHP 8</span>
                </span>
            </div>
            
            <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                <a href="#graficos" class="hover:text-slate-900 transition-colors">Gráficos do Mês</a>
                <a href="#tendencias" class="hover:text-slate-900 transition-colors">Tendências (▲/▼)</a>
                <a href="#queima" class="hover:text-slate-900 transition-colors">Velocidade de Queima</a>
                <a href="#despesas" class="hover:text-slate-900 transition-colors">Lançamentos</a>
            </nav>

            <div>
                <a href="#novo-gasto" class="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition shadow-sm">
                    + Novo Gasto
                </a>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Controle Financeiro Familiar</h1>
                <p class="text-sm text-slate-500">Mês de referência: <?= date('F / Y', strtotime($selectedMonth . '-01')) ?></p>
            </div>
            <form method="GET" class="flex items-center gap-2">
                <label for="month-select" class="text-xs font-semibold text-slate-600 uppercase">Mês:</label>
                <input type="month" id="month-select" name="month" value="<?= htmlspecialchars($selectedMonth) ?>" onchange="this.form.submit()" class="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500">
            </form>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Renda Familiar</span>
                <p class="text-2xl font-bold text-slate-900 tabular-nums mt-1">R$ <?= number_format($rendaFamiliar, 2, ',', '.') ?></p>
                <span class="text-xs text-slate-400 mt-2 block">Padrão família Silva</span>
            </div>

            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Gasto no Mês</span>
                <p class="text-2xl font-bold text-rose-600 tabular-nums mt-1">R$ <?= number_format($totalGasto, 2, ',', '.') ?></p>
                <span class="text-xs text-slate-500 mt-2 block"><?= count($despesas) ?> lançamentos</span>
            </div>

            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Saldo Restante</span>
                <p class="text-2xl font-bold <?= $saldoRestante >= 0 ? 'text-emerald-600' : 'text-rose-600' ?> tabular-nums mt-1">
                    R$ <?= number_format($saldoRestante, 2, ',', '.') ?>
                </p>
                <span class="text-xs text-slate-500 mt-2 block"><?= $saldoRestante >= 0 ? 'Dentro do orçamento' : 'Atenção: déficit familiar' ?></span>
            </div>

            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Essencial vs Supérfluo</span>
                <p class="text-lg font-bold text-slate-900 tabular-nums mt-1">
                    <?= $totalGasto > 0 ? round(($totalEssencial / $totalGasto) * 100) : 0 ?>% / <?= $totalGasto > 0 ? round(($totalSuperfluo / $totalGasto) * 100) : 0 ?>%
                </p>
                <span class="text-xs text-slate-500 mt-2 block">Corte supérfluos para poupar</span>
            </div>
        </div>

        <div id="graficos" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <h2 class="text-lg font-bold text-slate-900 mb-1">Onde Você Está Gastando Mais</h2>
                <p class="text-xs text-slate-500 mb-4">Divisão proporcional das despesas no mês de <?= htmlspecialchars($selectedMonth) ?></p>
                <div class="h-64 flex items-center justify-center">
                    <canvas id="categoryDonutChart"></canvas>
                </div>
            </div>

            <div id="tendencias" class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <h2 class="text-lg font-bold text-slate-900 mb-1">Qual Categoria Aumentou ou Diminuiu?</h2>
                <p class="text-xs text-slate-500 mb-4">Comparativo direto com <?= htmlspecialchars($prevMonth) ?></p>
                <div class="h-64">
                    <canvas id="trendBarChart"></canvas>
                </div>
            </div>
        </div>

        <div id="queima" class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-lg font-bold text-slate-900">Quais Categorias Estão Acabando Mais Rápido?</h2>
                    <p class="text-xs text-slate-500">
                        Dia <?= $currentDay ?> de <?= $totalDaysInMonth ?> (<?= $percentMonthElapsed ?>% do mês). Categorias acima desta média estão esgotando rápido.
                    </p>
                </div>
            </div>

            <div class="space-y-4">
                <?php foreach ($categorias as $cat): 
                    $cId = $cat['id'];
                    $budget = floatval($cat['orcamento_padrao']);
                    $spent = $gastosPorCategoria[$cId] ?? 0;
                    $percentSpent = $budget > 0 ? round(($spent / $budget) * 100) : 0;
                    $isCritical = $percentSpent > ($percentMonthElapsed * 1.3) && $budget > 0;
                    $isWarning = $percentSpent > $percentMonthElapsed && !$isCritical && $budget > 0;
                ?>
                <div>
                    <div class="flex items-center justify-between text-xs mb-1">
                        <span class="font-semibold text-slate-800"><?= htmlspecialchars($cat['nome']) ?></span>
                        <span class="tabular-nums text-slate-600">
                            R$ <?= number_format($spent, 2, ',', '.') ?> / R$ <?= number_format($budget, 2, ',', '.') ?>
                            (<strong><?= $percentSpent ?>%</strong>)
                            <?php if ($isCritical): ?>
                                <span class="ml-2 text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">🚨 Queimando Rápido!</span>
                            <?php elseif ($isWarning): ?>
                                <span class="ml-2 text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">⚠️ Atenção</span>
                            <?php else: ?>
                                <span class="ml-2 text-emerald-600 font-medium">✅ Ritmo Normal</span>
                            <?php endif; ?>
                        </span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div class="h-2.5 rounded-full <?= $isCritical ? 'bg-rose-500' : ($isWarning ? 'bg-amber-500' : 'bg-emerald-500') ?>" style="width: <?= min(100, $percentSpent) ?>%"></div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div id="novo-gasto" class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs h-fit">
                <h2 class="text-lg font-bold text-slate-900 mb-1">+ Colocar Nome do Item e Valor</h2>
                <p class="text-xs text-slate-500 mb-4">Adicione qualquer gasto familiar rapidamente</p>

                <?php if (!empty($message)): ?>
                    <div class="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                        <?= htmlspecialchars($message) ?>
                    </div>
                <?php endif; ?>

                <form method="POST" action="index.php?month=<?= urlencode($selectedMonth) ?>" class="space-y-4">
                    <input type="hidden" name="action" value="add_expense">
                    
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Nome do Item *</label>
                        <input type="text" name="nome" placeholder="Ex: Supermercado, Conta de Luz" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Valor Gasto (R$) *</label>
                        <input type="number" step="0.01" name="valor" placeholder="0,00" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold tabular-nums focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Categoria *</label>
                        <select name="categoria_id" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                            <?php foreach ($categorias as $cat): ?>
                                <option value="<?= htmlspecialchars($cat['id']) ?>"><?= htmlspecialchars($cat['nome']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Data</label>
                            <input type="date" name="data" value="<?= date('Y-m-d') ?>" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Quem Gastou?</label>
                            <select name="membro" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500">
                                <option value="Carlos (Pai)">Carlos (Pai)</option>
                                <option value="Mariana (Mãe)">Mariana (Mãe)</option>
                                <option value="Lucas (Filho)">Lucas (Filho)</option>
                                <option value="Casa / Geral" selected>Casa / Geral</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="essencial" name="essencial" value="1" checked class="w-4 h-4 text-emerald-600 rounded">
                        <label for="essencial" class="text-xs text-slate-700">Este item é <strong>Essencial</strong> (desmarque se for supérfluo)</label>
                    </div>

                    <button type="submit" class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition shadow-sm">
                        Salvar Lançamento
                    </button>
                </form>
            </div>

            <div id="despesas" class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold text-slate-900">Histórico de Gastos do Mês</h2>
                    <span class="text-xs font-medium text-slate-500 tabular-nums">Total: <?= count($despesas) ?> itens</span>
                </div>

                <?php if (empty($despesas)): ?>
                    <p class="text-sm text-slate-500 py-8 text-center">Nenhum gasto cadastrado para este mês ainda.</p>
                <?php else: ?>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                                <tr>
                                    <th class="py-2.5 px-3">Item</th>
                                    <th class="py-2.5 px-3">Categoria</th>
                                    <th class="py-2.5 px-3">Membro</th>
                                    <th class="py-2.5 px-3">Data</th>
                                    <th class="py-2.5 px-3 text-right">Valor</th>
                                    <th class="py-2.5 px-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <?php foreach ($despesas as $item): 
                                    $catInfo = $catMap[$item['categoria_id']] ?? ['nome' => $item['categoria_id']];
                                ?>
                                <tr class="hover:bg-slate-50 transition">
                                    <td class="py-3 px-3">
                                        <div class="font-medium text-slate-900"><?= htmlspecialchars($item['nome']) ?></div>
                                        <?php if (!$item['essencial']): ?>
                                            <span class="text-[10px] text-amber-600 font-semibold">Candidato a corte</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="py-3 px-3 text-slate-600"><?= htmlspecialchars($catInfo['nome']) ?></td>
                                    <td class="py-3 px-3 text-slate-600"><?= htmlspecialchars($item['membro']) ?></td>
                                    <td class="py-3 px-3 text-slate-500 tabular-nums"><?= date('d/m/Y', strtotime($item['data_gasto'])) ?></td>
                                    <td class="py-3 px-3 text-right font-bold text-slate-900 tabular-nums">
                                        R$ <?= number_format($item['valor'], 2, ',', '.') ?>
                                    </td>
                                    <td class="py-3 px-3 text-center">
                                        <a href="index.php?month=<?= urlencode($selectedMonth) ?>&delete_id=<?= $item['id'] ?>" onclick="return confirm('Deseja realmente remover este gasto?');" class="text-rose-500 hover:text-rose-700 font-medium">
                                            Excluir
                                        </a>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>

    </main>

    <script>
        const ctxDonut = document.getElementById('categoryDonutChart').getContext('2d');
        new Chart(ctxDonut, {
            type: 'doughnut',
            data: {
                labels: <?= json_encode($chartLabels) ?>,
                datasets: [{
                    data: <?= json_encode($chartDataCurrent) ?>,
                    backgroundColor: <?= json_encode($chartColors) ?>,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                }
            }
        });

        const ctxTrend = document.getElementById('trendBarChart').getContext('2d');
        new Chart(ctxTrend, {
            type: 'bar',
            data: {
                labels: <?= json_encode($chartLabels) ?>,
                datasets: [
                    {
                        label: 'Mês Anterior (<?= $prevMonth ?>)',
                        data: <?= json_encode($chartDataPrev) ?>,
                        backgroundColor: '#cbd5e1',
                        borderRadius: 4
                    },
                    {
                        label: 'Mês Atual (<?= $selectedMonth ?>)',
                        data: <?= json_encode($chartDataCurrent) ?>,
                        backgroundColor: '#059669',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
                }
            }
        });
    </script>
</body>
</html>
