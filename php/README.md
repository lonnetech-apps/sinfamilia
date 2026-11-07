# FinFamília - Sistema de Controle Financeiro em PHP

Arquivos do backend em PHP 8.x para execução em servidores Apache, Nginx, XAMPP, Laragon ou Docker.

## Como Executar Localmente
Abra o terminal dentro desta pasta `/php/` e rode:

```bash
php -S localhost:8000
```

Abra no navegador: **http://localhost:8000**
O banco de dados SQLite `finfamilia.sqlite` é criado automaticamente no primeiro acesso.

## Arquivos Disponíveis
- `index.php`: Painel completo com formulários e gráficos em Chart.js.
- `db.php`: Conexão PDO segura com criação automática de tabelas e categorias da família.
- `api.php`: Endpoints RESTful para consultar e registrar gastos via JSON.
- `schema.sql`: Script SQL DDL caso deseje utilizar MySQL / MariaDB no phpMyAdmin.
