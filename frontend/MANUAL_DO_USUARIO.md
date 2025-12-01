# Manual do Usuário - Mare Alta Náutica Manager

## 📚 Índice

1. [Introdução](#introdução)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Tipos de Usuários](#tipos-de-usuários)
4. [Dashboard (Visão Geral)](#dashboard)
5. [Ordens de Serviço](#ordens-de-serviço)
6. [Estoque](#estoque)
7. [Clientes](#clientes)
8. [Embarcações](#embarcações)
9. [Marinas](#marinas)
10. [Financeiro](#financeiro)
11. [Agenda](#agenda)
12. [CRM & Fidelização](#crm)
13. [Usuários](#usuários)
14. [Configurações](#configurações)

---

## 📖 Introdução

O **Mare Alta Náutica Manager** é um sistema completo de gestão para oficinas náuticas. Controla:
- ✅ Ordens de Serviço (OS)
- 📦 Estoque de peças
- 💰 Financeiro (receitas e despesas)
- 🛥️ Cadastro de barcos e clientes
- 📅 Agenda de serviços
- 📊 Relatórios e análises

### Requisitos do Sistema
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conexão com internet (apenas para login inicial)
- Armazenamento local habilitado no navegador

---

## 🔐 Acesso ao Sistema

### Como Fazer Login

1. Acesse o sistema pelo navegador
2. **Opção 1 - Ambiente de Demonstração:**
   - Clique no card **Admin**, **Técnico** ou **Cliente**
   - O sistema faz login automaticamente
3. **Opção 2 - Login Manual:**
   - Digite seu email e senha
   - Clique em "Acessar Sistema"

### Credenciais de Demonstração

| Tipo | Email | Senha |
|------|-------|-------|
| Administrador | admin@marealta.com | 123456 |
| Técnico | tecnico@marealta.com | 123456 |
| Cliente | cliente@marealta.com | 123456 |

### Sair do Sistema
- Clique no botão "Encerrar Sessão" no rodapé da barra lateral

---

## 👥 Tipos de Usuários

### 🔴 Administrador
**O que pode fazer:**
- Criar, editar e concluir Ordens de Serviço
- Gerenciar estoque (entrada, saída, ajustes)
- Cadastrar clientes, barcos e marinas
- Lançar despesas e receitas
- Criar outros usuários
- Visualizar todos os relatórios

**Menu disponível:** Dashboard, Agenda, Ordens de Serviço, CRM, Clientes, Embarcações, Marinas, Estoque, Financeiro, Usuários, Configurações

### 🟢 Técnico
**O que pode fazer:**
- Ver suas Ordens de Serviço designadas
- Fazer check-in/check-out
- Preencher checklists
- Anexar fotos (antes/depois)
- Adicionar anotações técnicas

**Menu disponível:** Meus Serviços, Minha Agenda

### 🔵 Cliente
**O que pode fazer:**
- Solicitar serviços
- Ver status das suas ordens
- Ver histórico das suas embarcações
- Aprovar orçamentos

**Menu disponível:** Minhas Solicitações, Minha Frota

---

## 📊 Dashboard (Visão Geral)

### Cards de KPI (Indicadores)

1. **Receita Aprovada**
   - Soma de todas as OS concluídas ou aprovadas
   - Click para ir ao Financeiro

2. **Solicitações Pendentes**
   - Quantidade de OS aguardando ação
   - Click para ir às Ordens de Serviço

3. **Embarcações em Serviço**
   - Quantidade de OS em execução
   - Click para ir às Ordens de Serviço

4. **Alerta de Estoque**
   - Quantidade de peças abaixo do mínimo
   - Click para ir ao Estoque

### Gráfico de Volume
- Mostra quantidade de OS por status
- Cores:
  - 🟡 Pendente
  - 🔵 Em Orçamento
  - 🟣 Em Execução
  - 🟢 Concluído

### Últimas Atualizações
- Lista das 10 OS mais recentes
- Click em uma OS para abrir detalhes

---

## 🔧 Ordens de Serviço

### Criar Nova OS

1. Click no botão **"+ Nova OS"**
2. Selecione a embarcação
3. Digite a descrição do problema
4. (Opcional) Defina duração estimada em horas
5. Click em **"Criar"**

### Abas de uma OS

#### 1️⃣ Detalhes
- **Informações Básicas:**
  - Embarcação e motor
  - Cliente
  - Status atual
  - Técnico responsável
  
- **Ações Disponíveis:**
  - ⏰ **Check-in/Check-out**: Registra tempo trabalhado
  - 🤖 **Analisar com IA**: Gemini gera diagnóstico automático
  - ✅ **Concluir**: Finaliza OS (baixa estoque, gera receita)
  - ❌ **Cancelar**: Cancela OS
  - 🔄 **Reabrir**: Reabre OS concluída (devolve estoque)

- **Notas Internas:**
  - Digite anotações e click "Adicionar Nota"
  - Histórico visível para admin e técnico

#### 2️⃣ Peças & Serviços
- **Adicionar Peça:**
  1. Click "+ Peça"
  2. Selecione a peça do estoque
  3. Digite quantidade
  4. Sistema calcula total automaticamente
  
- **Adicionar Mão de Obra:**
  1. Click "+ Serviço"
  2. Selecione do catálogo ou digite manualmente
  3. Ajuste preço se necessário
  
- **Remover Item:**
  - Click no ❌ ao lado do item

- **Totais Exibidos:**
  - Subtotal de peças
  - Subtotal de serviços
  - **Total Geral**

#### 3️⃣ Checklist
- **Carregar Template:**
  1. Click em "Carregar Template"
  2. Selecione tipo (Revisão 100h, Elétrica Geral, etc)
  3. Lista é preenchida automaticamente
  
- **Marcar/Desmarcar:**
  - Click no checkbox ao lado de cada item
  
- **Adicionar Item Personalizado:**
  1. Digite no campo "Nova tarefa"
  2. Click "Adicionar"

#### 4️⃣ Mídia (Fotos)
- **Tipos de Foto:**
  - 🔧 Serviço
  - 🔩 Peça Substituída
  - ⏱️ Horímetro
  - 🔢 Número de Série
  - 📷 Outro
  
- **Anexar Foto:**
  1. Click no botão do tipo desejado
  2. Selecione foto do dispositivo
  3. (Opcional) Digite descrição
  4. Foto é salva automaticamente

- **Visualizar:**
  - Click na foto para ampliar

- **Deletar:**
  - Click no ❌ no canto da foto

#### 5️⃣ Relatório
- Resumo completo para impressão
- Inclui:
  - Dados da embarcação
  - Checklist preenchido
  - Peças e serviços
  - Fotos anexadas
  - Totais
  
- **Imprimir:**
  1. Click em "Imprimir"
  2. Use Ctrl+P (ou Cmd+P no Mac)

#### 6️⃣ Rentabilidade
- **Cálculo de Lucro:**
  - Custo das peças
  - Preço de venda
  - Margem %
  
- **Gráfico de Pizza:**
  - Verde: Lucro
  - Vermelho: Custo

### Mudança de Status

**Fluxo Normal:**
```
Pendente → Em Orçamento → Aprovado → Em Execução → Concluído
```

**Ações por Status:**

| Status | O que significa | Ações disponíveis |
|--------|----------------|-------------------|
| Pendente | Aguardando análise | Mudar para "Em Orçamento" |
| Em Orçamento | Admin calculando preços | Adicionar peças/serviços |
| Aprovado | Cliente aprovou | Iniciar execução |
| Em Execução | Técnico trabalhando | Check-in/out, anexar fotos |
| Concluído | Serviço finalizado | Reabrir (se necessário) |
| Cancelado | Serviço cancelado | Nenhuma |

⚠️ **Importante:** Ao concluir uma OS:
- Estoque é baixado automaticamente
- Receita é gerada no Financeiro
- OS é bloqueada para edição

---

## 📦 Estoque

### Abas do Estoque

#### 1️⃣ Visão Geral

**Tabela de Peças:**
- Mostra todas as peças cadastradas
- Cores:
  - ⚫ Normal: Estoque ok
  - 🔴 Vermelho: Abaixo do mínimo

**Buscar Peça:**
- Digite nome, SKU ou código de barras no campo de busca

**Nova Peça:**
1. Click "+ Novo Item"
2. Preencha:
   - Nome
   - SKU (código interno)
   - Código de barras (opcional)
   - Quantidade inicial
   - Custo (quanto comprou)
   - Preço (quanto vai vender)
   - Estoque mínimo (para alerta)
   - Localização física (ex: A1-02)
3. Click "Salvar Item"

**Editar Peça:**
1. Click no ✏️ ao lado da peça
2. Altere os campos
3. Click "Salvar"

#### 2️⃣ Entrada de Nota Fiscal

**Opção A - Upload de XML (NFe):**
1. Click "Upload XML da NFe"
2. Selecione arquivo XML recebido do fornecedor
3. Sistema lê automaticamente:
   - Número da nota
   - Fornecedor
   - Data de emissão
   - Itens (SKU, nome, quantidade, custo)
4. Vincule cada item a uma peça existente
   - Se peça não existe, será criada automaticamente
5. Click "Processar Nota Fiscal"

**Opção B - Entrada Manual:**
1. Click "Adicionar Item Manualmente"
2. Preencha:
   - SKU
   - Nome
   - Quantidade
   - Custo unitário
3. Repita para cada item
4. Preencha dados da nota (número, fornecedor, data)
5. Click "Processar Nota Fiscal"

⚠️ **O que acontece ao processar:**
- Quantidade é somada ao estoque
- Custo é atualizado (se diferente)
- Histórico é registrado no Kardex

#### 3️⃣ Contagem de Inventário

**Quando fazer:**
- Mensalmente ou trimestralmente
- Após suspeita de divergência
- Antes de fechamento de balanço

**Como fazer:**
1. Ative a aba "Inventário"
2. Imprima a lista de peças
3. Vá fisicamente ao estoque
4. Conte cada peça
5. Digite quantidade física no sistema
   - Ou use o scanner de código de barras
6. Repita para todas as peças
7. Click "Finalizar Contagem de Inventário"

**O que acontece:**
- Sistema compara físico vs. sistema
- Se diferente, gera ajuste automático
- Histórico completo no Kardex

**Scanner de Código de Barras:**
1. Click "Iniciar Scanner"
2. Permita acesso à câmera
3. Aponte para código de barras
4. Sistema preenche quantidade automaticamente

#### 4️⃣ Kardex (Histórico)

**Visualização:**
- Todas as movimentações de estoque
- Ordenadas da mais recente para a mais antiga

**Tipos de Movimento:**
- 🟢 **IN_INVOICE**: Entrada de nota fiscal
- 🔴 **OUT_OS**: Saída para ordem de serviço
- 🔵 **ADJUSTMENT_PLUS**: Ajuste positivo (contagem)
- 🟠 **ADJUSTMENT_MINUS**: Ajuste negativo (contagem)
- 🟣 **RETURN_OS**: Devolução de OS cancelada

**Filtros:**
- Por peça (busque SKU ou nome)
- Por tipo de movimento
- Por período

---

## 👤 Clientes

### Cadastrar Novo Cliente

1. Click "+ Novo Cliente"
2. Preencha:
   - Nome completo ou razão social
   - CPF/CNPJ
   - Telefone
   - Email
   - Endereço
   - Tipo: Particular, Empresa ou Governo
3. Click "Salvar"

### Editar Cliente

1. Localize o cliente na lista
2. Click em "Editar"
3. Altere os dados
4. Click "Salvar"

### Visualizar Histórico

- Click no card do cliente
- Ver todas as embarcações
- Ver todas as OS relacionadas

---

## 🛥️ Embarcações

### Cadastrar Nova Embarcação

1. Click "+ Nova Embarcação"
2. **Dados Básicos:**
   - Proprietário (selecione cliente)
   - Nome da embarcação
   - Identificação do casco (RENAVAM/Inscrição)
   - Modelo (ex: Phantom 303)
   - Uso: Lazer, Pesca, Comercial ou Governo
   
3. **Marina:**
   - Onde o barco está localizado
   - Deixe vazio se estiver na oficina
   
4. **Motor(es):**
   - Click "+ Adicionar Motor"
   - Número de série
   - Modelo (ex: Mercury Verado 300 V8)
   - Horas de uso (horímetro)
   - Ano de fabricação
   
5. Click "Salvar"

### Editar Embarcação

- Mesmo processo do cadastro
- Pode adicionar/remover motores

### Histórico de Manutenção

- Ao abrir uma embarcação, veja todas as OS relacionadas
- Útil para rastrear revisões periódicas

---

## ⚓ Marinas

### Cadastrar Marina

1. Click "+ Nova Marina"
2. Preencha:
   - Nome
   - Endereço completo
   - Nome do contato
   - Telefone
   - (Opcional) Coordenadas GPS
   - (Opcional) Horário de funcionamento
3. Click "Salvar"

### Por que cadastrar marinas?

- Saber onde cada barco está
- Facilita agendamento de serviços
- Coordena retirada/entrega
- Gerencia relacionamento com parceiros

---

## 💰 Financeiro

### Abas do Financeiro

#### 1️⃣ Resumo

**Cards de KPI:**
- Total de Receitas
- Total de Despesas
- Saldo (Receita - Despesa)
- Contas Pendentes

**Gráfico de Fluxo:**
- Verde: Receitas
- Vermelho: Despesas
- Linha: Saldo acumulado

#### 2️⃣ Receitas

**Tipos de Receita:**
- 🔧 **Serviços**: Gerada automaticamente ao concluir OS
- 💵 **Outras**: Adicionada manualmente

**Adicionar Receita Manual:**
1. Click "+ Nova Receita"
2. Preencha:
   - Descrição
   - Categoria (ex: Serviços, Venda de peças)
   - Valor
   - Data
   - Status: Pago, Pendente ou Cancelado
   - (Opcional) Número do documento
3. Click "Salvar"

#### 3️⃣ Despesas

**Adicionar Despesa:**
1. Click "+ Nova Despesa"
2. Preencha:
   - Descrição
   - Categoria (Aluguel, Energia, Peças, Impostos, etc)
   - Valor
   - Data
   - Status: Pago, Pendente ou Cancelado
   - (Opcional) Número do documento
3. Click "Salvar"

#### 4️⃣ Relatórios

**Filtros Disponíveis:**
- Por período (mês, trimestre, ano)
- Por categoria
- Por status (pago/pendente)

**Exportar:**
- Click "Exportar para Excel/PDF"

---

## 📅 Agenda

### Visualizações

- **Dia**: Agenda detalhada do dia
- **Semana**: Visão semanal
- **Mês**: Calendário mensal

### Cores por Status

- 🟡 Agendado
- 🔵 Em Execução
- 🟢 Concluído
- 🔴 Atrasado

### Agendar Serviço

1. Ao criar/editar uma OS
2. Defina:
   - Data e hora de início
   - Duração estimada
   - Técnico responsável
3. Aparece automaticamente na agenda

### Reagendar

- Click e arraste o evento no calendário
- Ou edite a OS e mude a data

---

## 🤝 CRM & Fidelização

### Visão Geral de Clientes

**Métricas Exibidas:**
- Total gasto (lifetime value)
- Quantidade de serviços
- Última visita
- Status: Ativo, Inativo ou VIP

### Segmentação

**Filtros:**
- Por valor gasto
- Por frequência
- Por tipo (particular, empresa, governo)

### Campanhas

**Enviar Comunicação:**
1. Selecione grupo de clientes
2. Escolha canal (email, WhatsApp)
3. Escreva mensagem
4. Agende ou envie imediatamente

**Ideias de Campanhas:**
- Lembrete de revisão 100 horas
- Promoção de troca de óleo
- Convite para evento
- Felicitações de aniversário

---

## 👥 Usuários

*(Apenas Administradores)*

### Criar Novo Usuário

1. Click "+ Novo Usuário"
2. Preencha:
   - Nome completo
   - Email (será o login)
   - Senha
   - Tipo: Admin, Técnico ou Cliente
   - (Se Cliente) Vincule ao cadastro de cliente
3. Click "Salvar"

### Editar Usuário

- Pode alterar nome, email e tipo
- Para redefinir senha, exclua e recrie

### Excluir Usuário

- Click no ❌ ao lado do usuário
- Confirme a exclusão

⚠️ **Atenção:** Não é possível excluir o último administrador

---

## ⚙️ Configurações

### Fabricantes de Barcos

**Adicionar Fabricante:**
1. Digite nome do fabricante
2. Click "Adicionar"

**Adicionar Modelo:**
1. Selecione fabricante
2. Digite modelo
3. Click "Adicionar"

### Fabricantes de Motores

- Mesmo processo dos barcos

### Catálogo de Serviços

**Criar Novo Serviço:**
1. Digite nome (ex: "Revisão 100 Horas")
2. Selecione categoria:
   - Mecânica
   - Elétrica
   - Hidráulica
   - Estética
   - Diagnóstico
3. Defina preço padrão
4. Click "Adicionar"

**Usar no Orçamento:**
- Ao adicionar serviço em uma OS
- Selecione do catálogo
- Preço é preenchido automaticamente

### Redefinir Dados

**Limpar Dados Operacionais:**
- Remove: OS, Transações, Movimentos de estoque
- Mantém: Clientes, Barcos, Peças, Usuários

**Restaurar Padrão de Fábrica:**
- Apaga TUDO
- Volta aos dados de demonstração

⚠️ **CUIDADO:** Essas ações são irreversíveis!

---

## 🆘 Perguntas Frequentes

### Como recuperar senha?

- Atualmente, apenas admin pode redefinir senhas
- Contate o administrador do sistema

### Os dados ficam salvos onde?

- LocalStorage do navegador
- Se limpar o cache, perde os dados
- Recomenda-se backup periódico (exportar relatórios)

### Funciona offline?

- Não precisa de internet para usar
- Exceto: Login inicial e IA (Gemini)

### Posso usar no celular?

- Sim! O sistema é responsivo
- Melhor experiência em tablet ou desktop

### Como fazer backup?

- Atualmente: Exportar relatórios manualmente
- Em produção: Usar backend com banco de dados real

### Quantos usuários posso ter?

- Sem limite no sistema de demonstração
- Em produção: Depende do plano contratado

### Scanner de código de barras não funciona

**Possíveis causas:**
- Navegador bloqueou câmera (conceda permissão)
- Site não está em HTTPS (use localhost ou servidor HTTPS)
- Código de barras ilegível (tente melhor iluminação)

---

## 📞 Suporte

### Contato
- **Email:** suporte@marealta.com
- **WhatsApp:** (41) 99999-9999
- **Horário:** Seg-Sex, 8h às 18h

### Documentação Técnica
- Guia de Desenvolvimento: `/GUIA_OrdersView.md`
- Guia de Estoque: `/GUIA_InventoryView.md`
- Código Comentado: Todos os arquivos `.tsx`

---

## 📋 Checklist de Primeiros Passos

- [ ] 1. Fazer login como Admin
- [ ] 2. Cadastrar 3 clientes
- [ ] 3. Cadastrar 2 embarcações
- [ ] 4. Adicionar 5 peças no estoque
- [ ] 5. Criar primeira OS
- [ ] 6. Adicionar peças e serviços à OS
- [ ] 7. Preencher checklist
- [ ] 8. Anexar foto
- [ ] 9. Concluir OS
- [ ] 10. Verificar estoque foi baixado
- [ ] 11. Verificar receita no Financeiro

**Boa sorte! 🚀**
