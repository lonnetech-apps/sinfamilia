-- Estrutura do Banco de Dados para FinFamília (MySQL / MariaDB / SQLite)

CREATE TABLE IF NOT EXISTS categorias (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(20) NOT NULL,
    orcamento_padrao DECIMAL(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS despesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    categoria_id VARCHAR(50) NOT NULL,
    data_gasto DATE NOT NULL,
    membro VARCHAR(50) NOT NULL DEFAULT 'Casa / Geral',
    essencial TINYINT(1) NOT NULL DEFAULT 1,
    forma_pagamento VARCHAR(30) NOT NULL DEFAULT 'pix',
    notas TEXT NULL,
    INDEX idx_data (data_gasto),
    INDEX idx_categoria (categoria_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO categorias (id, nome, cor, orcamento_padrao) VALUES
('alimentacao', 'Alimentação & Mercado', '#059669', 2200.00),
('moradia', 'Moradia & Condomínio', '#2563eb', 2100.00),
('contas', 'Contas & Utilidades', '#d97706', 750.00),
('transporte', 'Transporte & Combustível', '#0891b2', 850.00),
('saude', 'Saúde & Farmácia', '#dc2626', 600.00),
('educacao', 'Educação & Filhos', '#7c3aed', 950.00),
('lazer', 'Lazer & Restaurantes', '#f97316', 500.00),
('servicos', 'Assinaturas & Conexão', '#4f46e5', 220.00),
('outros', 'Outros & Imprevistos', '#64748b', 350.00);
