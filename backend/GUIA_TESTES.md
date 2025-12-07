# Guia de Testes - Backend Mare Alta

## Estrutura de Testes

O sistema de testes do backend está organizado da seguinte forma:

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Fixtures e configurações
│   ├── test_auth.py             # Testes de autenticação
│   ├── test_auth_router.py      # Testes do router de auth
│   ├── test_clients_router.py   # Testes do router de clientes
│   ├── test_boats_router.py     # Testes do router de barcos
│   ├── test_inventory_router.py # Testes do router de inventário
│   ├── test_orders_router.py    # Testes do router de ordens
│   └── test_crud.py             # Testes de operações CRUD
├── pytest.ini                   # Configuração do pytest
└── run_tests.sh                 # Script para executar testes
```

## Como Executar os Testes

### Todos os testes
```bash
cd backend
./run_tests.sh
```

ou

```bash
pytest -v
```

### Testes por categoria (markers)

- **Testes de Autenticação:**
  ```bash
  pytest -v -m auth
  ```

- **Testes de Routers:**
  ```bash
  pytest -v -m routers
  ```

- **Testes CRUD:**
  ```bash
  pytest -v -m crud
  ```

- **Testes de Integração:**
  ```bash
  pytest -v -m integration
  ```

### Testes específicos

- **Um arquivo específico:**
  ```bash
  pytest tests/test_auth.py -v
  ```

- **Uma classe específica:**
  ```bash
  pytest tests/test_auth.py::TestPasswordHashing -v
  ```

- **Um teste específico:**
  ```bash
  pytest tests/test_auth.py::TestPasswordHashing::test_password_hash_and_verify -v
  ```

## Cobertura de Código

### Gerar relatório de cobertura
```bash
pytest --cov=. --cov-report=html
```

O relatório HTML será gerado em `htmlcov/index.html`

### Ver cobertura no terminal
```bash
pytest --cov=. --cov-report=term-missing
```

## Fixtures Disponíveis

As fixtures estão definidas em `tests/conftest.py`:

- **db**: Sessão de banco de dados em memória para testes
- **client**: Cliente de teste FastAPI
- **test_tenant**: Tenant de teste
- **test_user**: Usuário de teste padrão
- **test_admin_user**: Usuário administrador de teste
- **auth_token**: Token de autenticação para usuário padrão
- **admin_auth_token**: Token de autenticação para admin
- **auth_headers**: Headers com autenticação (usuário padrão)
- **admin_auth_headers**: Headers com autenticação (admin)

## Categorias de Testes

### 1. Testes Unitários (Unit Tests)

Testam funções e métodos individuais isoladamente:

- `test_auth.py`: Funções de hash de senha e JWT
- Partes do `test_crud.py`: Operações individuais de CRUD

### 2. Testes de Integração (Integration Tests)

Testam a integração entre diferentes componentes:

- `test_auth_router.py`: Login e autenticação
- `test_clients_router.py`: Endpoints de clientes
- `test_boats_router.py`: Endpoints de barcos
- `test_inventory_router.py`: Endpoints de inventário
- `test_orders_router.py`: Endpoints de ordens de serviço

### 3. Testes de CRUD

Testam operações de banco de dados:

- `test_crud.py`: Criar, ler, atualizar e deletar registros

## Melhores Práticas

1. **Isolamento**: Cada teste deve ser independente
2. **Dados de Teste**: Use fixtures para criar dados consistentes
3. **Limpeza**: O banco de dados é recriado para cada teste
4. **Nomenclatura**: Use nomes descritivos (test_should_do_something)
5. **Asserções**: Seja específico nas verificações

## Exemplo de Teste

```python
@pytest.mark.routers
def test_create_client(self, client: TestClient, auth_headers):
    """Test creating a new client"""
    client_data = {
        "name": "New Client",
        "cpf_cnpj": "98765432100",
        "email": "newclient@example.com"
    }
    
    response = client.post(
        "/api/clients",
        json=client_data,
        headers=auth_headers
    )
    
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["name"] == "New Client"
```

## Troubleshooting

### Erro de importação
```bash
# Certifique-se de estar no diretório correto
cd backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Banco de dados não limpo entre testes
- Os testes usam SQLite em memória que é recriado a cada teste
- Verifique se está usando a fixture `db` corretamente

### Testes falhando por autenticação
- Verifique se está usando `auth_headers` ou `admin_auth_headers`
- Confira se a SECRET_KEY no .env está configurada

## Próximos Passos

Para expandir os testes:

1. Adicionar testes para Mercury router
2. Adicionar testes para Config router
3. Adicionar testes para Fiscal service
4. Adicionar testes de performance
5. Adicionar testes end-to-end
