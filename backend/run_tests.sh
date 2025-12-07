#!/bin/bash

# Script para executar testes do backend

echo "=========================================="
echo "Executando Testes do Backend Mare Alta"
echo "=========================================="
echo ""

# Ativar ambiente virtual se existir
if [ -d "venv" ]; then
    echo "Ativando ambiente virtual..."
    source venv/bin/activate
elif [ -d "../.venv" ]; then
    echo "Ativando ambiente virtual..."
    source ../.venv/bin/activate
fi

# Instalar dependências de teste se necessário
echo "Verificando dependências de teste..."
pip install -q pytest pytest-cov httpx

echo ""
echo "=========================================="
echo "Executando testes..."
echo "=========================================="
echo ""

# Executar testes com diferentes níveis de verbosidade
pytest -v --cov=. --cov-report=term-missing --cov-report=html

echo ""
echo "=========================================="
echo "Resumo da cobertura de código"
echo "=========================================="
echo ""
echo "Relatório HTML gerado em: htmlcov/index.html"
echo ""

# Mostrar estatísticas
echo "Para ver o relatório detalhado, abra htmlcov/index.html no navegador"
echo ""
echo "Testes por categoria:"
echo "  - Auth: pytest -v -m auth"
echo "  - Routers: pytest -v -m routers"
echo "  - CRUD: pytest -v -m crud"
echo "  - Mercury: pytest -v -m mercury"
echo ""
