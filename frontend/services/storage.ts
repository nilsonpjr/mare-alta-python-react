import { Boat, Part, ServiceOrder, OSStatus, Client, Transaction, Marina, SystemConfig, User, UserRole, ServiceItem, Invoice, StockMovement, ServiceDefinition } from '../types';

// Chaves usadas para salvar os dados no LocalStorage do navegador
// O LocalStorage funciona como um pequeno banco de dados dentro do navegador do usuário
const KEYS = {
  BOATS: 'marealta_boats',
  INVENTORY: 'marealta_inventory',
  INVOICES: 'marealta_invoices',
  MOVEMENTS: 'marealta_movements',
  ORDERS: 'marealta_orders',
  CLIENTS: 'marealta_clients',
  FINANCE: 'marealta_finance',
  MARINAS: 'marealta_marinas',
  CONFIG: 'marealta_config',
  USERS: 'marealta_users',
  SERVICES: 'marealta_services_catalog',
};

// --- FUNÇÕES AUXILIARES (HELPERS) ---

// Gera uma data futura ou passada baseada no dia de hoje
const getDate = (dayOffset: number, hour: number = 9): string => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString(); // Retorna em formato de texto ISO (ex: 2023-10-25T09:00:00.000Z)
};

// Pega um item aleatório de uma lista (usado para gerar dados de teste)
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// Gera um número inteiro aleatório entre min e max
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- DADOS INICIAIS (SEED DATA) ---
// Estes dados são carregados automaticamente se o sistema estiver vazio (primeiro acesso)

const seedUsers: User[] = [
  { id: 'u1', name: 'Administrador Mare Alta', email: 'admin@marealta.com', password: '123456', role: UserRole.ADMIN },
  { id: 'u2', name: 'João Técnico', email: 'tecnico@marealta.com', password: '123456', role: UserRole.TECHNICIAN },
  { id: 'u3', name: 'Roberto Cliente', email: 'cliente@marealta.com', password: '123456', role: UserRole.CLIENT, clientId: 'c2' }
];

const seedServicesCatalog: ServiceDefinition[] = [
  { id: 's1', name: 'Revisão Básica (Troca de Óleo e Filtros)', category: 'MECANICA', defaultPrice: 450.00 },
  { id: 's2', name: 'Revisão 100 Horas (Completa)', category: 'MECANICA', defaultPrice: 1200.00 },
  { id: 's3', name: 'Troca de Rotor da Bomba D\'água', category: 'MECANICA', defaultPrice: 350.00 },
  { id: 's4', name: 'Limpeza de Bicos Injetores (Ultrassom)', category: 'MECANICA', defaultPrice: 600.00 },
  { id: 's5', name: 'Montagem de Motor (Bloco Parcial)', category: 'MECANICA', defaultPrice: 2500.00 },
  { id: 's6', name: 'Instalação de Bomba de Porão', category: 'HIDRAULICA', defaultPrice: 250.00 },
  { id: 's7', name: 'Diagnóstico Scanner Mercury (G3)', category: 'DIAGNOSTICO', defaultPrice: 300.00 },
  { id: 's8', name: 'Instalação de GPS/Sonar', category: 'ELETRICA', defaultPrice: 400.00 },
  { id: 's9', name: 'Revisão de Elétrica Geral', category: 'ELETRICA', defaultPrice: 500.00 },
  { id: 's10', name: 'Polimento de Casco (por pé)', category: 'ESTETICA', defaultPrice: 80.00 },
  { id: 's11', name: 'Troca de Anodos de Sacrifício', category: 'MECANICA', defaultPrice: 150.00 },
];

const seedMarinas: Marina[] = [
  { id: 'm_icc', name: 'Iate Clube de Caiobá (ICC)', address: 'Av. do Contorno, s/n - Caiobá', contactName: 'Secretaria', phone: '(41) 3452-1011', operatingHours: 'Fecha às Terças' },
  { id: 'm_icg', name: 'Iate Clube de Guaratuba (ICG)', address: 'R. José Bonifácio, 18 - Guaratuba', contactName: 'Gerência Pátio', phone: '(41) 3442-1230', operatingHours: 'Fecha às Segundas' },
  { id: 'm_bora_bora', name: 'Marina Bora Bora', address: 'Rod. PR 412, Km 1 - Pontal do Sul', contactName: 'Atendimento', phone: '(41) 3455-1555', operatingHours: 'Aberto Todos os dias' },
  { id: 'm_morena', name: 'Marina Morena', address: 'R. Dr. Caetano Marchesini - Guaratuba', contactName: 'Recepção', phone: '(41) 3472-1588', operatingHours: 'Plantão Verão' },
  { id: 'm_ycp', name: 'Yacht Club de Paranaguá', address: 'Rua Benjamin Constant - Paranaguá', contactName: 'Secretaria', phone: '(41) 3423-3333', operatingHours: 'Segunda a Sábado' },
  { id: 'm_sol', name: 'Marina do Sol', address: 'Ilha dos Valadares - Paranaguá', contactName: 'Seu Zé', phone: '(41) 9999-1111', operatingHours: 'Todos os dias' },
  { id: 'm_garagem', name: 'Garagem Náutica Pontal', address: 'Pontal do Paraná', contactName: 'Marcos', phone: '(41) 9888-2222', operatingHours: 'Comercial' }
];

const seedClients: Client[] = [
  { id: 'c1', name: 'Marinha do Brasil - Capitania PR', document: '00.394.502/0001-44', phone: '(41) 3721-1500', email: 'logistica.pr@marinha.mil.br', address: 'Paranaguá - PR', type: 'GOVERNO' },
  { id: 'c2', name: 'Roberto Náutica', document: '123.456.789-00', phone: '(41) 99999-8888', email: 'roberto@email.com', address: 'Caiobá - PR', type: 'PARTICULAR' },
  { id: 'c3', name: 'Transportes Ilha do Mel Ltda', document: '05.111.222/0001-99', phone: '(41) 3455-9090', email: 'contato@ilhadomel.com', address: 'Ilha do Mel', type: 'EMPRESA' },
  { id: 'c4', name: 'Pousada O Pescador', document: '08.777.666/0001-55', phone: '(41) 98888-7777', email: 'adm@pescador.com', address: 'Guaratuba', type: 'EMPRESA' },
  { id: 'c5', name: 'Dr. Fernando Mendes', document: '987.654.321-11', phone: '(41) 99111-2222', email: 'fmendes@clinica.com', address: 'Curitiba', type: 'PARTICULAR' },
  { id: 'c6', name: 'Construtora Horizonte', document: '10.222.333/0001-00', phone: '(41) 3333-4444', email: 'compras@horizonte.com', address: 'Curitiba', type: 'EMPRESA' },
  { id: 'c7', name: 'Miguel Arcanjo', document: '111.222.333-44', phone: '(41) 99777-6666', email: 'miguel@gmail.com', address: 'Matinhos', type: 'PARTICULAR' },
  { id: 'c8', name: 'Associação de Pesca', document: '22.333.444/0001-22', phone: '(41) 3422-5555', email: 'pesca@associacao.com', address: 'Pontal do Sul', type: 'EMPRESA' }
];

const seedBoats: Boat[] = [
  { id: 'b1', name: 'Patrulha Costeira 01', hullId: 'MB-PR-001', model: 'DGS 888 Raptor', clientId: 'c1', marinaId: 'm_ycp', usageType: 'GOVERNO', engines: [{ id: 'e1', serialNumber: '2B567890', model: 'Mercury Verado 300 V8', hours: 150, year: 2023 }] },
  { id: 'b2', name: 'Lancha Interceptadora', hullId: 'MB-PR-002', model: 'Flexboat SR 620', clientId: 'c1', marinaId: 'm_bora_bora', usageType: 'GOVERNO', engines: [{ id: 'e2', serialNumber: '3C123456', model: 'Mercury SeaPro 150', hours: 450, year: 2021 }] },
  { id: 'b3', name: 'Phantom 303 (Sereia)', hullId: 'PR-2022-005', model: 'Schaefer Phantom 303', clientId: 'c2', marinaId: 'm_icc', usageType: 'LAZER', engines: [{ id: 'e3', serialNumber: '2B998877', model: 'Mercury Mercruiser 6.2L', hours: 80, year: 2022 }] },
  { id: 'b4', name: 'Taxi Boat 04', hullId: 'TB-ILHA-04', model: 'Levefort Marajó 19', clientId: 'c3', marinaId: 'm_bora_bora', usageType: 'COMERCIAL', engines: [{ id: 'e4', serialNumber: '1F445566', model: 'Mercury 60hp 4-Stroke', hours: 1200, year: 2019 }] },
  { id: 'b5', name: 'Pesca Pesada I', hullId: 'GUA-7788', model: 'Coral 26 Pesca', clientId: 'c4', marinaId: 'm_morena', usageType: 'PESCA', engines: [{ id: 'e5', serialNumber: '2C998811', model: 'Mercury SeaPro 115', hours: 650, year: 2020 }] },
  { id: 'b6', name: 'Azimut Grande', hullId: 'AZ-60-BR', model: 'Azimut 60', clientId: 'c5', marinaId: 'm_icg', usageType: 'LAZER', engines: [{ id: 'e6', serialNumber: 'VO-998877', model: 'Volvo Penta D13', hours: 250, year: 2022 }] },
  { id: 'b7', name: 'Horizonte Azul', hullId: 'PR-999-A', model: 'Focker 240', clientId: 'c6', marinaId: 'm_sol', usageType: 'LAZER', engines: [{ id: 'e7', serialNumber: '2B111222', model: 'Mercury 150hp', hours: 50, year: 2023 }] },
  { id: 'b8', name: 'Triton Flyer', hullId: 'TRI-300-X', model: 'Triton 300', clientId: 'c7', marinaId: 'm_garagem', usageType: 'LAZER', engines: [{ id: 'e8', serialNumber: '2B333444', model: 'Mercury Mercruiser 4.5L', hours: 120, year: 2021 }] },
  { id: 'b9', name: 'Pesca & Cia', hullId: 'PES-555', model: 'Alumínio 6m', clientId: 'c8', marinaId: 'm_sol', usageType: 'PESCA', engines: [{ id: 'e9', serialNumber: '1F777888', model: 'Mercury 40hp', hours: 2000, year: 2018 }] },
  { id: 'b10', name: 'Jet Ski Patrulha', hullId: 'MB-JET-01', model: 'SeaDoo GTI 130', clientId: 'c1', marinaId: 'm_ycp', usageType: 'GOVERNO', engines: [{ id: 'e10', serialNumber: 'R-998877', model: 'Rotax 1503', hours: 300, year: 2020 }] }
];

const seedParts: Part[] = [
  { id: 'p1', sku: '8M0154789', barcode: '789111222333', name: 'Óleo 25W-40 Synthetic', quantity: 150, cost: 45.00, price: 85.00, minStock: 20, location: 'A1-01' },
  { id: 'p2', sku: '35-8M0065104', barcode: '789444555666', name: 'Filtro de Óleo Verado', quantity: 5, cost: 60.00, price: 120.00, minStock: 10, location: 'A1-02' },
  { id: 'p3', sku: '47-43026T2', barcode: '789777888999', name: 'Rotor da Bomba D\'água', quantity: 8, cost: 90.00, price: 180.00, minStock: 5, location: 'B2-10' },
  { id: 'p4', sku: '8M0059687', barcode: '789000111222', name: 'Filtro de Combustível', quantity: 12, cost: 55.00, price: 110.00, minStock: 10, location: 'A2-05' },
  { id: 'p5', sku: 'NGK-IZFR5G', barcode: '789333444555', name: 'Vela de Ignição Iridium', quantity: 24, cost: 80.00, price: 150.00, minStock: 20, location: 'C1-15' },
  { id: 'p6', sku: '92-858064K01', barcode: '789666777888', name: 'Óleo de Rabeta High Perf.', quantity: 4, cost: 50.00, price: 95.00, minStock: 10, location: 'A1-03' },
  { id: 'p7', sku: 'ANODO-KIT-V6', barcode: '789999000111', name: 'Kit Anodos Alumínio V6', quantity: 10, cost: 150.00, price: 320.00, minStock: 5, location: 'D4-01' },
  { id: 'p8', sku: 'CORREIA-ALT', barcode: '789222333444', name: 'Correia do Alternador', quantity: 2, cost: 80.00, price: 190.00, minStock: 3, location: 'E2-02' },
  { id: 'p9', sku: 'ROTOR-BOMBA', barcode: '789555666777', name: 'Reparo Bomba Combustível', quantity: 1, cost: 200.00, price: 450.00, minStock: 2, location: 'F1-05' }
];

const ORDER_DESCRIPTIONS = [
  "Revisão de 100 horas", "Troca de óleo e filtros", "Motor falhando em alta", "Barulho estranho na rabeta",
  "Instalação de GPS/Sonar", "Troca de anodos de sacrifício", "Limpeza de bicos injetores", "Verificação elétrica geral",
  "Motor não dá partida", "Troca de rotor da bomba d'água", "Revisão de garantia (20h)", "Instalação de rádio VHF",
  "Polimento de casco", "Reparo no trim", "Troca de hélice", "Diagnóstico com scanner", "Vazamento de óleo no porão"
];

const TECHNICIANS = ["João Técnico", "Maria Elétrica", "Carlos Mecânico"];

// --- INICIALIZAÇÃO DO ARMAZENAMENTO ---
// Esta função verifica se o LocalStorage está vazio e, se estiver, preenche com os dados de teste acima.
const initStorage = () => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(KEYS.BOATS)) {
    localStorage.setItem(KEYS.BOATS, JSON.stringify(seedBoats));
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(seedParts));
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(seedClients));
    localStorage.setItem(KEYS.MARINAS, JSON.stringify(seedMarinas));
    localStorage.setItem(KEYS.USERS, JSON.stringify(seedUsers));
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(seedServicesCatalog));

    // Configurações iniciais de fabricantes
    const config: SystemConfig = {
      boatManufacturers: {
        'Schaefer Yachts': ['Phantom 303', 'Phantom 375', 'Phantom 400', 'V33'],
        'Focker (Fibrafort)': ['Focker 240', 'Focker 255', 'Focker 333', 'Style 215'],
        'Coral Lanchas': ['Coral 26', 'Coral 33', 'Coral 19'],
        'DGS Defence': ['DGS 888', 'DGS 650', 'DGS 999 Raptor'],
        'Flexboat': ['SR 500', 'SR 620', 'SR 760'],
        'Triton Yachts': ['Triton 300', 'Triton 350', 'Triton 440'],
        'Azimut': ['Azimut 50', 'Azimut 60', 'Azimut 27 Metri'],
        'Levefort': ['Marajó 19', 'Marajó 17', 'Metalglass 600']
      },
      engineManufacturers: {
        'Mercury': ['Verado 300 V8', 'SeaPro 115', 'SeaPro 150', 'Mercruiser 6.2L', 'Mercruiser 4.5L', '60hp 4-Stroke', '40hp 2-Stroke', 'Racing 450R'],
        'Yamaha': ['F115 BET', 'F150 DET', 'F300 V6'],
        'Volvo Penta': ['D4-260', 'D6-370', 'D13-900', 'V8-350'],
        'Rotax': ['1503 NA', '1630 ACE']
      }
    };
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));

    // Gera Ordens de Serviço e Transações aleatórias para popular o dashboard
    const orders: ServiceOrder[] = [];
    const transactions: Transaction[] = [];
    const movements: StockMovement[] = [];

    for (let i = 0; i < 25; i++) {
      const boat = getRandomItem(seedBoats);
      const description = getRandomItem(ORDER_DESCRIPTIONS);
      const status = getRandomItem(Object.values(OSStatus));
      const date = getDate(-getRandomInt(0, 30));

      // Lógica de Itens da OS
      const items: ServiceItem[] = [];
      let total = 0;

      // Adiciona peças aleatórias
      if (Math.random() > 0.3) {
        const part = getRandomItem(seedParts);
        const qty = getRandomInt(1, 3);
        const itemTotal = part.price * qty;
        items.push({
          id: `si-${i}-p`,
          type: 'PART',
          description: part.name,
          partId: part.id,
          quantity: qty,
          unitCost: part.cost,
          unitPrice: part.price,
          total: itemTotal
        });
        total += itemTotal;

        if (status === OSStatus.COMPLETED) {
          // Se a OS já nasce concluída, gera o movimento de saída de estoque
          movements.push({
            id: `mov-${i}`,
            partId: part.id,
            type: 'OUT_OS',
            quantity: qty,
            date: date,
            description: `Saída OS #${100 + i}`,
            user: 'Sistema'
          });
        }
      }

      // Adiciona mão de obra aleatória
      const laborPrice = getRandomInt(200, 1500);
      items.push({
        id: `si-${i}-l`,
        type: 'LABOR',
        description: 'Mão de Obra Especializada',
        quantity: 1,
        unitPrice: laborPrice,
        total: laborPrice
      });
      total += laborPrice;

      const order: ServiceOrder = {
        id: (1000 + i).toString(),
        boatId: boat.id,
        engineId: boat.engines[0]?.id,
        description,
        status,
        items,
        totalValue: total,
        createdAt: date,
        requester: 'Seed Script',
        notes: [],
        technicianName: getRandomItem(TECHNICIANS),
        scheduledAt: status !== OSStatus.COMPLETED ? getDate(getRandomInt(0, 7), getRandomInt(8, 16)) : undefined,
        estimatedDuration: getRandomInt(2, 8)
      };
      orders.push(order);

      if (status === OSStatus.COMPLETED) {
        transactions.push({
          id: `tr-${i}`,
          type: 'INCOME',
          category: 'Serviços',
          description: `Recebimento OS #${order.id}`,
          amount: total,
          date: date,
          status: 'PAID',
          orderId: order.id
        });
      }
    }

    // Gera Despesas aleatórias
    for (let i = 0; i < 5; i++) {
      const val = getRandomInt(500, 3000);
      transactions.push({
        id: `exp-${i}`,
        type: 'EXPENSE',
        category: getRandomItem(['Aluguel', 'Energia', 'Peças', 'Impostos']),
        description: getRandomItem(['Conta de Luz', 'Aluguel Pátio', 'Compra de Peças', 'Imposto ISS']),
        amount: val,
        date: getDate(-getRandomInt(0, 30)),
        status: 'PAID'
      });
    }

    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    localStorage.setItem(KEYS.FINANCE, JSON.stringify(transactions));
    localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(movements));
  }
};

// --- SERVIÇO DE ARMAZENAMENTO (API LOCAL) ---
// Este objeto contém todas as funções para ler e gravar dados.
// Em um sistema real, estas funções fariam chamadas de rede (fetch/axios) para um backend.

export const StorageService = {
  // --- Configurações ---
  getConfig: (): SystemConfig => {
    initStorage();
    const data = localStorage.getItem(KEYS.CONFIG);
    return data ? JSON.parse(data) : { boatManufacturers: {}, engineManufacturers: {} };
  },
  saveConfig: (config: SystemConfig) => {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
  },

  // --- Autenticação ---
  getUsers: (): User[] => {
    initStorage();
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },
  login: (email: string, pass: string): User | undefined => {
    initStorage();
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    return users.find((u: User) => u.email === email && u.password === pass);
  },

  // --- Dados Básicos (CRUDs) ---
  getBoats: (): Boat[] => {
    initStorage();
    return JSON.parse(localStorage.getItem(KEYS.BOATS) || '[]');
  },
  saveBoats: (boats: Boat[]) => {
    localStorage.setItem(KEYS.BOATS, JSON.stringify(boats));
  },
  getClients: (): Client[] => {
    initStorage();
    return JSON.parse(localStorage.getItem(KEYS.CLIENTS) || '[]');
  },
  saveClients: (clients: Client[]) => {
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  },
  getMarinas: (): Marina[] => {
    initStorage();
    return JSON.parse(localStorage.getItem(KEYS.MARINAS) || '[]');
  },
  saveMarinas: (marinas: Marina[]) => {
    localStorage.setItem(KEYS.MARINAS, JSON.stringify(marinas));
  },
  getServices: (): ServiceDefinition[] => {
    initStorage();
    return JSON.parse(localStorage.getItem(KEYS.SERVICES) || '[]');
  },

  // --- Estoque ---
  getInventory: (): Part[] => {
    initStorage();
    return JSON.parse(localStorage.getItem(KEYS.INVENTORY) || '[]');
  },
  saveInventory: (parts: Part[]) => {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(parts));
  },
  getMovements: (): StockMovement[] => {
    initStorage();
    return JSON.parse(localStorage.getItem(KEYS.MOVEMENTS) || '[]');
  },
  saveMovements: (movements: StockMovement[]) => {
    localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(movements));
  },
  getInvoices: (): Invoice[] => {
    initStorage();
    return JSON.parse(localStorage.getItem(KEYS.INVOICES) || '[]');
  },
  // Processa uma Nota Fiscal: Salva a nota e atualiza o estoque (soma quantidades)
  processInvoice: (invoice: Invoice, user: string) => {
    // 1. Salva a Nota
    const invoices = JSON.parse(localStorage.getItem(KEYS.INVOICES) || '[]');
    invoices.push(invoice);
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));

    // 2. Atualiza Estoque
    const parts = JSON.parse(localStorage.getItem(KEYS.INVENTORY) || '[]');
    const movements = JSON.parse(localStorage.getItem(KEYS.MOVEMENTS) || '[]');

    invoice.items.forEach(item => {
      if (item.partId) {
        const partIndex = parts.findIndex((p: Part) => p.id === item.partId);
        if (partIndex >= 0) {
          // Converte para número para evitar erros de concatenação de string
          const currentQty = Number(parts[partIndex].quantity) || 0;
          const addedQty = Number(item.quantity) || 0;

          parts[partIndex].quantity = currentQty + addedQty;

          // Atualiza o custo se vier na nota
          const newCost = Number(item.unitCost) || 0;
          if (newCost > 0) {
            parts[partIndex].cost = newCost;
          }

          // Registra o movimento de entrada
          movements.push({
            id: `mov-${Date.now()}-${item.sku}`,
            partId: item.partId,
            type: 'IN_INVOICE',
            quantity: addedQty,
            date: new Date().toISOString(),
            referenceId: invoice.number,
            description: `Entrada NF ${invoice.number}`,
            user
          });
        }
      }
    });

    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(parts));
    localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(movements));
  },

  // --- Ordens de Serviço ---
  getOrders: (): ServiceOrder[] => {
    initStorage();
    const orders = JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]');
    // Retorna ordenado por data (mais recente primeiro)
    return orders.sort((a: ServiceOrder, b: ServiceOrder) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  saveOrder: (order: ServiceOrder) => {
    const orders = JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]');
    const index = orders.findIndex((o: ServiceOrder) => o.id === order.id);
    if (index >= 0) {
      orders[index] = order; // Atualiza existente
    } else {
      orders.push(order); // Cria nova
    }
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  },
  saveOrders: (orders: ServiceOrder[]) => {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  },
  updateOrderStatus: (id: string, status: OSStatus): ServiceOrder | null => {
    const orders = JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]');
    const index = orders.findIndex((o: ServiceOrder) => o.id === id);
    if (index >= 0) {
      orders[index].status = status;
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
      return orders[index];
    }
    return null;
  },
  // Finaliza uma OS: Gera receita e baixa estoque
  completeServiceOrder: (id: string): ServiceOrder | null => {
    const orders = JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]');
    const index = orders.findIndex((o: ServiceOrder) => o.id === id);

    if (index >= 0 && orders[index].status !== OSStatus.COMPLETED) {
      const order = orders[index];
      order.status = OSStatus.COMPLETED;

      // 1. Gera Transação Financeira (Receita)
      const transactions = JSON.parse(localStorage.getItem(KEYS.FINANCE) || '[]');
      transactions.push({
        id: `inc-${Date.now()}`,
        type: 'INCOME',
        category: 'Serviços',
        description: `Recebimento OS #${order.id} - ${order.boatId}`,
        amount: Number(order.totalValue),
        date: new Date().toISOString(),
        status: 'PENDING', // Fica pendente até confirmar pagamento
        orderId: order.id
      });
      localStorage.setItem(KEYS.FINANCE, JSON.stringify(transactions));

      // 2. Baixa Estoque (apenas peças)
      const parts = JSON.parse(localStorage.getItem(KEYS.INVENTORY) || '[]');
      const movements = JSON.parse(localStorage.getItem(KEYS.MOVEMENTS) || '[]');

      order.items.forEach((item: ServiceItem) => {
        if (item.type === 'PART' && item.partId) {
          const pIdx = parts.findIndex((p: Part) => p.id === item.partId);
          if (pIdx >= 0) {
            const currentQty = Number(parts[pIdx].quantity) || 0;
            const deductQty = Number(item.quantity) || 0;
            parts[pIdx].quantity = Math.max(0, currentQty - deductQty);

            movements.push({
              id: `mov-${Date.now()}-${item.partId}`,
              partId: item.partId,
              type: 'OUT_OS',
              quantity: deductQty,
              date: new Date().toISOString(),
              referenceId: order.id,
              description: `Saída OS #${order.id}`,
              user: 'Sistema'
            });
          }
        }
      });

      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(parts));
      localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(movements));
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));

      return order;
    }
    return null;
  },
  // Reabre uma OS: Estorna financeiro e devolve estoque
  reopenServiceOrder: (id: string): ServiceOrder | null => {
    const orders = JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]');
    const index = orders.findIndex((o: ServiceOrder) => o.id === id);

    if (index >= 0 && orders[index].status === OSStatus.COMPLETED) {
      const order = orders[index];
      order.status = OSStatus.IN_PROGRESS; // Volta para em execução

      // 1. Cancela/Remove Transação Financeira
      let transactions = JSON.parse(localStorage.getItem(KEYS.FINANCE) || '[]');
      transactions = transactions.filter((t: Transaction) => t.orderId !== order.id);
      localStorage.setItem(KEYS.FINANCE, JSON.stringify(transactions));

      // 2. Devolve Estoque
      const parts = JSON.parse(localStorage.getItem(KEYS.INVENTORY) || '[]');
      const movements = JSON.parse(localStorage.getItem(KEYS.MOVEMENTS) || '[]');

      order.items.forEach((item: ServiceItem) => {
        if (item.type === 'PART' && item.partId) {
          const pIdx = parts.findIndex((p: Part) => p.id === item.partId);
          if (pIdx >= 0) {
            const currentQty = Number(parts[pIdx].quantity) || 0;
            const returnQty = Number(item.quantity) || 0;
            parts[pIdx].quantity = currentQty + returnQty;

            movements.push({
              id: `mov-ret-${Date.now()}-${item.partId}`,
              partId: item.partId,
              type: 'RETURN_OS',
              quantity: returnQty,
              date: new Date().toISOString(),
              referenceId: order.id,
              description: `Estorno OS #${order.id}`,
              user: 'Sistema'
            });
          }
        }
      });

      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(parts));
      localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(movements));
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));

      return order;
    }
    return null;
  },

  // --- Financeiro ---
  getTransactions: (): Transaction[] => {
    initStorage();
    const trans = JSON.parse(localStorage.getItem(KEYS.FINANCE) || '[]');
    return trans.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  saveTransactions: (transactions: Transaction[]) => {
    localStorage.setItem(KEYS.FINANCE, JSON.stringify(transactions));
  },

  // --- Utils ---
  // Limpa apenas dados operacionais (mantém cadastros básicos)
  clearOperationalData: () => {
    localStorage.removeItem(KEYS.ORDERS);
    localStorage.removeItem(KEYS.FINANCE);
    localStorage.removeItem(KEYS.MOVEMENTS);
    localStorage.removeItem(KEYS.INVOICES);
    window.location.reload();
  },
  // Reseta TUDO (volta ao estado zero)
  factoryReset: () => {
    localStorage.clear();
    window.location.reload();
  }
};