# Referência Rápida - Campos dos Modelos Mare Alta

## 👤 User (Usuário)
```python
User(
    name="Nome Completo",          # ✅ Usar 'name', não 'username' ou 'full_name'
    email="email@example.com",     # ✅ Email único
    hashed_password="hash...",      # ✅ Senha em hash
    role="ADMIN",                   # ✅ Enum: ADMIN, TECHNICIAN, CLIENT
    tenant_id=1,                    # ✅ ID do tenant (empresa)
    client_id=None                  # ✅ Opcional: ID do cliente associado
)
```

**Campos que NÃO existem:**
- ❌ `username`
- ❌ `full_name`
- ❌ `is_active`
- ❌ `is_superuser`

---

## 👥 Client (Cliente)
```python
Client(
    name="Nome do Cliente",         # ✅ Nome ou Razão Social
    document="12345678900",         # ✅ Usar 'document', não 'cpf_cnpj'
    email="cliente@example.com",    # ✅ Email do cliente
    phone="11999999999",            # ✅ Telefone
    address="Endereço completo",    # ✅ Endereço
    type="PARTICULAR",              # ✅ PARTICULAR, EMPRESA, GOVERNO
    tenant_id=1                     # ✅ ID do tenant
)
```

**Campos que NÃO existem:**
- ❌ `cpf_cnpj` (usar `document`)
- ❌ `document_type`

---

## ⛵ Boat (Embarcação)
```python
Boat(
    model="Modelo do Barco",        # ✅ Modelo da embarcação
    year=2024,                      # ✅ Ano de fabricação
    registration="ABC-1234",        # ✅ Registro/matrícula
    owner_id=1,                     # ✅ ID do cliente proprietário
    marina_id=None,                 # ✅ Opcional: ID da marina
    length=25.5,                    # ✅ Comprimento em pés
    manufacturer="Fabricante",      # ✅ Fabricante
    hull_number="ABC123",           # ✅ Número do casco
    tenant_id=1                     # ✅ ID do tenant
)
```

---

## 📦 Part (Peça)
```python
Part(
    sku="ABC-123",                  # ✅ Usar 'sku', não 'part_number'
    name="Nome da Peça",            # ✅ Nome/descrição (não há campo 'description' separado)
    barcode="7891234567890",        # ✅ Opcional: código de barras
    quantity=10.0,                  # ✅ Quantidade em estoque (Float)
    cost=50.00,                     # ✅ Custo unitário
    price=99.99,                    # ✅ Preço de venda
    min_stock=5.0,                  # ✅ Estoque mínimo
    location="Prateleira A1",       # ✅ Localização física
    tenant_id=1                     # ✅ ID do tenant
)
```

**Campos que NÃO existem:**
- ❌ `part_number` (usar `sku`)
- ❌ `description` (usar `name`)
- ❌ `unit_price` (usar `price`)

---

## 🔧 Engine (Motor)
```python
Engine(
    boat_id=1,                      # ✅ ID da embarcação
    serial_number="70380954",       # ✅ Número de série do motor
    model="V8 250HP",               # ✅ Modelo completo
    manufacturer="Mercury Marine",  # ✅ Fabricante
    hours=150,                      # ✅ Horas de uso
    year=2024,                      # ✅ Ano do motor
    warranty_status="Ativa",        # ✅ Status da garantia
    warranty_validity="2027-12",    # ✅ Validade da garantia
    client_name="Nome do Cliente",  # ✅ Nome do cliente (da garantia)
    tenant_id=1                     # ✅ ID do tenant
)
```

---

## 📋 ServiceOrder (Ordem de Serviço)
```python
ServiceOrder(
    boat_id=1,                      # ✅ ID da embarcação
    description="Descrição",        # ✅ Descrição do serviço
    status="Pendente",              # ✅ Status: Pendente, Em Orçamento, Aprovado, etc.
    os_number="OS-2024-001",        # ✅ Número da OS
    entry_date=datetime.now(),      # ✅ Data de entrada
    estimated_completion=None,      # ✅ Opcional: previsão de conclusão
    completion_date=None,           # ✅ Opcional: data de conclusão
    total_parts=0.0,                # ✅ Total em peças
    total_labor=0.0,                # ✅ Total em mão de obra
    discount=0.0,                   # ✅ Desconto
    technician_notes="",            # ✅ Observações do técnico
    tenant_id=1                     # ✅ ID do tenant
)
```

**Enum de Status:**
- `"Pendente"`
- `"Em Orçamento"`
- `"Aprovado"`
- `"Em Execução"`
- `"Concluído"`
- `"Cancelado"`

---

## 📊 StockMovement (Movimento de Estoque)
```python
StockMovement(
    part_id=1,                      # ✅ ID da peça
    quantity=5.0,                   # ✅ Quantidade do movimento (Float)
    movement_type="IN_INVOICE",     # ✅ Tipo de movimento (enum)
    description="Compra",           # ✅ Descrição do movimento
    reference="NF-123",             # ✅ Referência (NF, OS, etc)
    cost=50.00,                     # ✅ Custo unitário
    date=datetime.now(),            # ✅ Data do movimento
    user_id=1,                      # ✅ ID do usuário responsável
    tenant_id=1                     # ✅ ID do tenant
)
```

**Enum de Tipos:**
- `"IN_INVOICE"` - Entrada por nota fiscal
- `"OUT_OS"` - Saída por ordem de serviço
- `"ADJUSTMENT_PLUS"` - Ajuste positivo
- `"ADJUSTMENT_MINUS"` - Ajuste negativo
- `"RETURN_OS"` - Retorno de OS

---

## 🏢 Tenant (Multi-tenancy)
```python
Tenant(
    name="Nome da Empresa",         # ✅ Nome da empresa/marina
    cnpj="12.345.678/0001-00",     # ✅ Opcional: CNPJ
    subdomain="empresa",            # ✅ Subdomínio único
    is_active=True,                 # ✅ Status ativo/inativo
    created_at=datetime.now()       # ✅ Data de criação
)
```

---

## 🏢 Marina (Marina)
```python
Marina(
    name="Nome da Marina",          # ✅ Nome da marina
    address="Endereço",             # ✅ Endereço completo
    contact_name="Responsável",     # ✅ Nome do contato
    phone="11999999999",            # ✅ Telefone
    coordinates="lat,lng",          # ✅ Coordenadas GPS
    operating_hours="8h-18h",       # ✅ Horário de funcionamento
    tenant_id=1                     # ✅ ID do tenant
)
```

---

## 💡 Dicas de Uso nos Testes

### ✅ Criar um Cliente:
```python
client = Client(
    name="Cliente Teste",
    document="12345678900",  # NÃO usar cpf_cnpj!
    email="teste@example.com",
    tenant_id=test_tenant.id
)
db.add(client)
db.commit()
```

### ✅ Criar uma Peça:
```python
part = Part(
    sku="PART-001",  # NÃO usar part_number!
    name="Filtro de Óleo",  # name serve como descrição
    quantity=10.0,
    price=49.99,
    tenant_id=test_tenant.id
)
db.add(part)
db.commit()
```

### ✅ Autenticação:
```python
# Login usa email, não username
response = client.post(
    "/api/auth/login",
    data={
        "username": "test@example.com",  # Sim, 'username' no form, mas valor é o email!
        "password": "senha123"
    }
)
```

---

## 🎨 Padrões de Nomenclatura

### Timestamps
- `created_at` - Data de criação
- `updated_at` - Data de atualização
- `entry_date` - Data de entrada
- `completion_date` - Data de conclusão

### IDs e Referências
- Sempre termina com `_id`: `tenant_id`, `user_id`, `boat_id`
- ForeignKeys sempre apontam para a tabela no plural + .id

### Booleanos
- Sempre começam com `is_`: `is_active`, `is_deleted`

### Enums
- Usam strings em maiúsculas: `"ADMIN"`, `"IN_INVOICE"`
- Alguns status são em português: `"Pendente"`, `"Concluído"`

---

## 🚫 Erros Comuns a Evitar

1. ✗ Usar `cpf_cnpj` → ✓ Usar `document`
2. ✗ Usar `part_number` → ✓ Usar `sku`
3. ✗ Usar `username` no User → ✓ Usar `name`
4. ✗ Usar `full_name` → ✓ Usar `name`
5. ✗ Usar `unit_price` → ✓ Usar `price`
6. ✗ Esperar campo `description` separado em Part → ✓ Usar `name`
7. ✗ Usar `is_active` no User → ✓ Campo não existe
8. ✗ Passar inteiro para `quantity` → ✓ Usar Float

---

## 📚 Referências

Para ver a definição completa de cada modelo:
```bash
cat backend/models.py
```

Para ver os schemas de validação:
```bash
cat backend/schemas.py
```

Para rodar testes com um modelo específico:
```bash
pytest -k "Client" -v
pytest -k "Part" -v
pytest -k "Boat" -v
```
