<?php
/**
 * Conexão com banco de dados via PDO (SQLite com inicialização automática)
 */
function getDbConnection() {
    $dbFile = __DIR__ . '/finfamilia.sqlite';
    $isNewDb = !file_exists($dbFile);

    try {
        $pdo = new PDO("sqlite:" . $dbFile);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        if ($isNewDb || filesize($dbFile) === 0) {
            initializeDatabase($pdo);
        }

        return $pdo;
    } catch (PDOException $e) {
        die("Erro ao conectar ao banco de dados: " . $e->getMessage());
    }
}

function initializeDatabase($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS categorias (
        id VARCHAR(50) PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        cor VARCHAR(20) NOT NULL,
        orcamento_padrao DECIMAL(10,2) NOT NULL DEFAULT 0.00
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS despesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(255) NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        categoria_id VARCHAR(50) NOT NULL,
        data_gasto DATE NOT NULL,
        membro VARCHAR(50) NOT NULL DEFAULT 'Geral',
        essencial INTEGER NOT NULL DEFAULT 1,
        forma_pagamento VARCHAR(30) NOT NULL DEFAULT 'pix',
        notas TEXT
    )");

    $catData = [
        ['alimentacao', 'Alimentação & Mercado', '#059669', 2200.00],
        ['moradia', 'Moradia & Condomínio', '#2563eb', 2100.00],
        ['contas', 'Contas & Utilidades', '#d97706', 750.00],
        ['transporte', 'Transporte & Combustível', '#0891b2', 850.00],
        ['saude', 'Saúde & Farmácia', '#dc2626', 600.00],
        ['educacao', 'Educação & Filhos', '#7c3aed', 950.00],
        ['lazer', 'Lazer & Restaurantes', '#f97316', 500.00],
        ['servicos', 'Assinaturas & Conexão', '#4f46e5', 220.00],
        ['outros', 'Outros & Imprevistos', '#64748b', 350.00]
    ];

    $stmt = $pdo->prepare("INSERT OR IGNORE INTO categorias (id, nome, cor, orcamento_padrao) VALUES (?, ?, ?, ?)");
    foreach ($catData as $cat) {
        $stmt->execute($cat);
    }

    $curMonth = date('Y-m');
    $prevMonth = date('Y-m', strtotime('-1 month'));

    $demoExpenses = [
        ['Aluguel Apartamento', 1750.00, 'moradia', $curMonth . '-05', 'Casa / Geral', 1, 'pix', 'Fixo mensal'],
        ['Supermercado Mensal', 1145.80, 'alimentacao', $curMonth . '-02', 'Mariana (Mãe)', 1, 'cartao_credito', 'Carnes e limpeza'],
        ['Açougue e Frango Semanal', 210.50, 'alimentacao', $curMonth . '-06', 'Carlos (Pai)', 1, 'cartao_debito', 'Carnes da semana'],
        ['Conta de Luz Enel', 285.40, 'contas', $curMonth . '-03', 'Casa / Geral', 1, 'pix', 'Ar condicionado'],
        ['Gasolina Posto Ipiranga', 265.00, 'transporte', $curMonth . '-01', 'Carlos (Pai)', 1, 'cartao_credito', '45 litros'],
        ['Escola Lucas', 820.00, 'educacao', $curMonth . '-05', 'Mariana (Mãe)', 1, 'boleto', 'Mensalidade escolar'],
        ['Farmácia Medicamentos', 198.60, 'saude', $curMonth . '-03', 'Mariana (Mãe)', 1, 'cartao_credito', 'Remédios do mês'],
        ['Pizzaria Domingo', 145.00, 'lazer', $curMonth . '-02', 'Carlos (Pai)', 0, 'cartao_debito', 'Lazer família'],
        ['Netflix + Spotify', 94.80, 'servicos', $curMonth . '-01', 'Carlos (Pai)', 0, 'cartao_credito', 'Streaming'],
        ['Aluguel Apartamento', 1750.00, 'moradia', $prevMonth . '-05', 'Casa / Geral', 1, 'pix', ''],
        ['Supermercado Mês Passado', 1820.00, 'alimentacao', $prevMonth . '-10', 'Mariana (Mãe)', 1, 'cartao_credito', ''],
        ['Conta de Luz Mês Passado', 215.00, 'contas', $prevMonth . '-04', 'Casa / Geral', 1, 'pix', ''],
        ['Gasolina Mês Passado', 580.00, 'transporte', $prevMonth . '-18', 'Carlos (Pai)', 1, 'cartao_credito', '']
    ];

    $stmtExp = $pdo->prepare("INSERT INTO despesas (nome, valor, categoria_id, data_gasto, membro, essencial, forma_pagamento, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($demoExpenses as $exp) {
        $stmtExp->execute($exp);
    }
}
