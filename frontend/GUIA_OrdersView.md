# Guia de Estudo: OrdersView.tsx (Ordens de Serviço)

## 📋 Visão Geral

O arquivo `OrdersView.tsx` é o componente mais complexo do sistema. Ele gerencia todo o ciclo de vida de uma Ordem de Serviço (OS), desde a criação até a conclusão.

## 🧩 Estrutura do Componente

### 1. **Estados (useState) - Armazenam os Dados**

```typescript
const [orders, setOrders] = useState<ServiceOrder[]>([]);  // Lista de todas as OS
const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null); // OS selecionada
const [activeTab, setActiveTab] = useState('details');     // Aba ativa (Detalhes, Peças, Checklist, etc)
const [isCreating, setIsCreating] = useState(false);       // Se está criando nova OS
const [boats, setBoats] = useState<Boat[]>([]);            // Lista de barcos
const [inventory, setParts] = useState<Part[]>([]);        // Peças disponíveis
```

### 2. **Funções Principais**

#### `refreshData()`
- Carrega dados novos do StorageService
- Chamada sempre que algo muda (criar, editar, excluir OS)

#### `handleCreateOrder(boatId, description)`
- Cria uma nova Ordem de Serviço
- Gera ID único
- Salva no LocalStorage

#### `handleStatusChange(id, newStatus)`
- Muda o status da OS (Pendente → Em Execução → Concluído)
- Quando muda para "Concluído":
  - Baixa peças do estoque
  - Gera receita financeira
  - Bloqueia edições futuras

#### `handleReopenOrder(id)`
- Reabre uma OS concluída
- Devolve peças ao estoque
- Remove receita financeira

#### `handleAddItem(type)`
- Adiciona Peça ou Mão de Obra à OS
- Recalcula valor total
- Verifica estoque disponível (se for peça)

#### `handleTimeLog(action)`
- Registra Check-in / Check-out do técnico
- Controla tempo trabalhado na OS

#### `handleAiAnalysis()`
- Chama API do Google Gemini
- Gera diagnóstico automático baseado em fotos/descrição

## 🗂️ Abas (Tabs) do Componente

### **Aba 1: Detalhes**
- Informações básicas: Barco, descrição, status, técnico
- Botões de ação: Concluir, Cancelar, Check-in/out
- Histórico de notas

### **Aba 2: Peças & Serviços**
- Lista de itens (peças e mão de obra)
- Adicionar/remover itens
- Cálculo de totais e lucro

### **Aba 3: Checklist**
- Lista de verificação (templates prontos)
- Marca/desmarca itens
- Exemplo: "Óleo trocado ✓", "Filtro verificado ✓"

### **Aba 4: Mídia**
- Upload de fotos (antes/depois, peças trocadas, horímetro)
- Visualização de anexos
- Conversão de imagem para Base64 (armazenamento local)

### **Aba 5: Relatório**
- Visão resumida para impressão
- Inclui checklist, peças, fotos
- Botão de impressão

### **Aba 6: Rentabilidade**
- Cálculo de custo vs. preço de venda
- Margem de lucro
- Gráfico de pizza

## 🎨 Layout Visual

```
┌─────────────────────────────────────────┐
│ [Nova OS]  [Buscar...]  [Filtros]       │
├─────────────────────────────────────────┤
│ Lista de OS:                             │
│ ┌─────────────────────────────────────┐ │
│ │ OS #1001 - Revisão 100h    [Abrir] │ │
│ │ OS #1002 - Troca de óleo   [Abrir] │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Detalhes da OS Selecionada:             │
│ [Detalhes] [Peças] [Checklist] [Mídia] │
│ ┌─────────────────────────────────────┐ │
│ │ Conteúdo da aba ativa               │ │
│ │ (Formulários, tabelas, botões)      │ │
│ └─────────────────────────────────────┘ │
│ [Salvar] [Concluir] [Cancelar]          │
└─────────────────────────────────────────┘
```

## 🔄 Fluxo de Trabalho Típico

1. **Criar OS**: Cliente liga → Admin cria OS → Seleciona barco → Descreve problema
2. **Orçamento**: Admin adiciona peças e serviços → Gera orçamento
3. **Aprovar**: Cliente aprova → Status muda para "Aprovado"
4. **Executar**: Técnico faz check-in → Trabalha → Preenche checklist → Anexa fotos
5. **Concluir**: Admin clica "Concluir" → Sistema baixa estoque → Gera receita
6. **Entregar**: Cliente retira barco

## 💡 Conceitos de React Usados

- **useState**: Guarda dados que podem mudar (lista de OS, OS selecionada, etc)
- **useEffect**: Carrega dados quando o componente aparece na tela
- **Renderização Condicional**: `{isCreating && <FormularioCriacao />}` (só mostra se isCreating for true)
- **Map**: Transforma uma lista em componentes visuais: `orders.map(order => <div>{order.id}</div>)`
- **Componentes Reutilizáveis**: Modal, Tabs, Botões customizados

## 🔧 Integração com Serviços

```typescript
// Carrega OS do LocalStorage
const orders = StorageService.getOrders();

// Salva OS atualizada
StorageService.saveOrder(updatedOrder);

// Finaliza OS (baixa estoque + gera receita)
const completedOrder = StorageService.completeServiceOrder(id);

// Chama IA para diagnóstico
const resultado = await GeminiService.analisarOS(descricao, fotos);
```

## 📖 Dicas para Estudar

1. **Comece pelas funções simples**: `refreshData()`, `handleAddItem()`
2. **Entenda o fluxo de estado**: Como `selectedOrder` muda quando você clica em uma OS
3. **Veja como as abas funcionam**: `activeTab` controla qual conteúdo aparece
4. **Estude um fluxo completo**: Siga o código de criar → adicionar peças → concluir
5. **Use o console.log**: Adicione `console.log(orders)` para ver os dados em tempo real

## 🚨 Pontos Importantes

- **Nunca edite OS concluída**: Status "Concluído" bloqueia alterações
- **Validação de estoque**: Antes de adicionar peça, verifica se tem em estoque
- **Recálculo automático**: Quando adiciona/remove item, `totalValue` é recalculado
- **Base64 para fotos**: Imagens são convertidas para texto e salvas no LocalStorage (não recomendado para produção real)
