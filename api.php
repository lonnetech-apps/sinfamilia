<?php
/**
 * API RESTful JSON em PHP
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

$pdo = getDbConnection();
$action = $_GET['action'] ?? 'summary';
$month = $_GET['month'] ?? date('Y-m');

switch ($action) {
    case 'summary':
        $stmt = $pdo->prepare("SELECT categoria_id, SUM(valor) as total FROM despesas WHERE data_gasto LIKE ? GROUP BY categoria_id");
        $stmt->execute([$month . '%']);
        $totals = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        echo json_encode([
            'status' => 'success',
            'month' => $month,
            'totals_by_category' => $totals
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        break;

    case 'add_expense':
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        if (!empty($input['nome']) && floatval($input['valor']) > 0) {
            $stmt = $pdo->prepare("INSERT INTO despesas (nome, valor, categoria_id, data_gasto, membro, essencial, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['nome'],
                floatval($input['valor']),
                $input['categoria_id'],
                $input['data'] ?? date('Y-m-d'),
                $input['membro'] ?? 'Geral',
                !empty($input['essencial']) ? 1 : 0,
                $input['forma_pagamento'] ?? 'pix'
            ]);
            echo json_encode(['status' => 'success', 'id' => $pdo->lastInsertId()]);
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Dados incompletos']);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Ação não encontrada']);
}
