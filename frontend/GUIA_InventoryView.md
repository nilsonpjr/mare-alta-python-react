# Guia de Estudo: InventoryView.tsx (Estoque)

## 📋 Visão Geral

O `InventoryView.tsx` gerencia todo o controle de estoque: entrada de notas fiscais, ajustes manuais, contagem de inventário e histórico (Kardex).

## 🧩 Estrutura do Componente

### 1. **Estados Principais**

```typescript
const [inventory, setInventory] = useState<Part[]>([]);              // Peças em estoque
const [invoices, setInvoices] = useState<Invoice[]>([]);            // Notas fiscais
const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]); // Itens da nota sendo criada
const [movements, setMovements] = useState<StockMovement[]>([]);    // Histórico de movimentações
const [activeTab, setActiveTab] = useState('overview');             // Aba ativa
```

### 2. **Funções Principais**

#### `handleXmlUpload(event)`
- **Lê arquivo XML da Nota Fiscal Eletrônica (NFe)**
- Extrai dados usando `DOMParser` (navegador)
- Parser XML:
  ```typescript
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const nfeElement = xmlDoc.querySelector('nfe');
  const numero = nfeElement.querySelector('nNF').textContent;
  ```
- Popula lista de `invoiceItems` automaticamente

#### `handleAddManualItem()`
- Adiciona item manualmente à nota (sem XML)
- Validação: SKU, nome e preço são obrigatórios
- Permite criar nota fiscal "manual" para pequenos fornecedores

#### `handleInvoiceSubmit()`
- Finaliza entrada da nota fiscal
- **Atualiza estoque**: Soma quantidades das peças
- **Gera movimentação**: Registra histórico com tipo 'IN_INVOICE'
- **Atualiza custo**: Se o custo na nota for diferente, atualiza o cadastro

#### `linkItemToPart(index, partId)`
- Vincula um item da nota a uma peça existente no sistema
- Permite autocomplete e busca por SKU/código de barras
- Crucial para não duplicar cadastro de peças

#### `handleSavePart()`
- Salva nova peça ou edita peça existente
- Validações: Quantidade, custo e preço devem ser números válidos
- Gera ID único: `p${Date.now()}`

#### `handleInventoryFinish()`
- Finaliza contagem de inventário
- Compara quantidade física vs. sistema
- Gera movimentações de ajuste (ADJUSTMENT_PLUS / ADJUSTMENT_MINUS)
- Atualiza quantidades reais

## 🗂️ Abas (Tabs) do Componente

### **Aba 1: Visão Geral**
- Tabela de todas as peças
- Filtros: Nome, SKU, código de barras
- Alertas de estoque baixo (vermelho se < mínimo)
- Botões: Novo Item, Editar, Deletar

### **Aba 2: Entrada de Nota Fiscal**
- **Modo XML**: Upload de arquivo NFe XML
- **Modo Manual**: Formulário item por item
- Vincular itens a peças existentes
- Botão "Processar Nota" (finaliza entrada)

### **Aba 3: Contagem de Inventário**
- Lista todas as peças
- Campo para digitar quantidade física contada
- Scanner de código de barras (usa câmera do celular!)
- Botão "Finalizar Contagem"

### **Aba 4: Kardex (Histórico)**
- Histórico completo de movimentações
- Tipos:
  - 🟢 IN_INVOICE: Entrada de nota
  - 🔴 OUT_OS: Saída para OS
  - 🔵 ADJUSTMENT_PLUS: Ajuste positivo (contagem)
  - 🟠 ADJUSTMENT_MINUS: Ajuste negativo (contagem)
  - 🟣 RETURN_OS: Devolução de OS cancelada

## 🎨 Layout Visual

```
┌─────────────────────────────────────────┐
│ [Overview] [Nota Fiscal] [Inventário]   │
├─────────────────────────────────────────┤
│ Estoque:                                 │
│ [Novo Item] [Buscar: _______]  [Alertas]│
│ ┌─────────────────────────────────────┐ │
│ │ SKU      │ Nome         │ Qtd │ Loc │ │
│ │ 8M015478 │ Óleo 25W-40  │ 150 │ A1  │ │
│ │ ROTOR-01 │ Rotor Bomba  │  3  │ B2  │ │ ⚠️
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🔄 Fluxos de Trabalho

### **Fluxo 1: Receber Mercadoria (com NFe XML)**

1. Fornecedor envia NFe por email
2. Admin baixa arquivo XML
3. Click em "Upload XML"
4. Sistema lê e popula tabela automaticamente
5. Admin vincula itens novos ou existentes
6. Click em "Processar Nota"
7. Estoque é atualizado

### **Fluxo 2: Receber Mercadoria (Manual)**

1. Admin click "Adicionar Item Manualmente"
2. Digita: SKU, Nome, Quantidade, Custo
3. Repete para cada item
4. Preenche dados da nota (número, fornecedor, data)
5. Click "Processar Nota"

### **Fluxo 3: Contagem de Inventário**

1. Admin vai na aba "Inventário"
2. Imprime lista de peças
3. Vai fisicamente ao estoque
4. Conta peças e anota
5. Digita quantidade no sistema (ou usa scanner)
6. Click "Finalizar Contagem"
7. Sistema ajusta diferenças automaticamente

## 💡 Conceitos Técnicos Usados

### **1. Parsing de XML**
```typescript
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
const valor = xmlDoc.querySelector('tag > subtag')?.textContent || '0';
```

### **2. FileReader (Leitura de Arquivos)**
```typescript
const reader = new FileReader();
reader.onload = (e) => {
  const texto = e.target?.result as string;
  // Processa texto
};
reader.readAsText(file); // Para XML
reader.readAsDataURL(file); // Para imagens (Base64)
```

### **3. Html5QrcodeScanner (Leitor de Código de Barras)**
```typescript
const scanner = new Html5QrcodeScanner("reader-div", { fps: 10, qrbox: 250 });
scanner.render((decodedText) => {
  console.log("Código lido:", decodedText);
  // Busca peça por código de barras
});
```

## 🔧 Integração com Serviços

```typescript
// Busca estoque
const parts = StorageService.getInventory();

// Salva peças atualizadas
StorageService.saveInventory(updatedParts);

// Processa nota (atualiza estoque + gera movimentação)
StorageService.processInvoice(invoice, userName);

// Busca histórico
const movements = StorageService.getMovements();
```

## 📖 Dicas para Estudar

1. **Entenda o XML**: Pesquise sobre "NFe XML estrutura" para ver como os dados são organizados
2. **Teste o Scanner**: Abra a aba Inventário e teste com código de barras de produtos reais
3. **Siga o fluxo de dados**: XML → Parser → Invoice Items → Vinculação → Estoque atualizado
4. **Veja o Kardex**: Confira como cada ação gera um registro de movimento
5. **Teste ajustes manuais**: Mude quantidade de uma peça e veja o movimento criado

## 🚨 Pontos Importantes

- **Conversão de tipos**: Sempre use `Number()` ao manipular quantidades (evita concatenação de strings)
- **Validação antes de salvar**: Verifica se campos obrigatórios estão preenchidos
- **Movimentações são permanentes**: Cada ação gera histórico (importante para auditoria)
- **Vinculação é crucial**: Evite duplicar peças; sempre vincule itens de nota a peças existentes
- **Scanner precisa de HTTPS**: Scanner de código de barras só funciona em localhost ou HTTPS

## 🆚 Diferença entre Peça e Item de Nota

| Conceito | Part (Peça) | InvoiceItem (Item de Nota) |
|----------|-------------|----------------------------|
| Onde vive | Cadastro permanente | Temporário (só na nota) |
| Quantidade | Estoque atual | Quantidade comprada |
| Custo | Custo médio atualizado | Custo nesta compra |
| ID | Permanente (p1, p2...) | Gerado na hora |
| Objetivo | Controle de estoque | Registro de compra |

**Fluxo**: InvoiceItem → Vinculado a Part → Atualiza Part.quantity
