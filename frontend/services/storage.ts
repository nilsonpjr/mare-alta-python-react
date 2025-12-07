import { Boat, Part, ServiceOrder, OSStatus, Client, Transaction, Marina, SystemConfig, User, UserRole, ServiceItem, Invoice, StockMovement, ServiceDefinition } from '../types';

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

// --- HELPER FUNCTIONS ---
const getDate = (dayOffset: number, hour: number = 9): string => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- SEED DATA (STATIC) ---
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
  // MERCURY VERADO V8 & DIESEL
  { id: 'p1', sku: '8M0123456', barcode: '', name: 'Filtro de Óleo Mercury Verado/Diesel', quantity: 10, cost: 78.00, price: 120.00, minStock: 3, location: 'A1-MERCURY' },
  { id: 'p2', sku: '92-858037K01', barcode: '', name: 'Óleo Motor 25W40 (Quart) / TCW3 OptiMax', quantity: 50, cost: 55.25, price: 85.00, minStock: 20, location: 'A1-MERCURY' },
  { id: 'p3', sku: '8M0000001', barcode: '', name: 'Filtro de Combustível Baixa Pressão', quantity: 8, cost: 97.50, price: 150.00, minStock: 5, location: 'A1-MERCURY' },
  { id: 'p4', sku: '8M0000002', barcode: '', name: 'Kit Anodos Rabeta Verado', quantity: 5, cost: 292.50, price: 450.00, minStock: 3, location: 'D4-ANODOS' },
  { id: 'p5', sku: '92-858064K01', barcode: '', name: 'Óleo de Rabeta High Performance', quantity: 30, cost: 71.50, price: 110.00, minStock: 10, location: 'A1-MERCURY' },
  { id: 'p6', sku: '8M0000123', barcode: '', name: 'Velas de Ignição Iridium V8', quantity: 24, cost: 117.00, price: 180.00, minStock: 8, location: 'C1-VELAS' },
  { id: 'p7', sku: '8M0000456', barcode: '', name: 'Kit Reparo Bomba D\'água Verado', quantity: 4, cost: 247.00, price: 380.00, minStock: 2, location: 'B2-KITS' },
  { id: 'p8', sku: '8M0000789', barcode: '', name: 'Correia do Alternador Verado', quantity: 3, cost: 273.00, price: 420.00, minStock: 2, location: 'E2-CORREIAS' },

  // MERCURY PORTÁTEIS (3.5-9.9 HP)
  { id: 'p10', sku: '8M0071840', barcode: '', name: 'Óleo Motor 10W-30 (Quart)', quantity: 20, cost: 42.25, price: 65.00, minStock: 8, location: 'A1-MERCURY' },
  { id: 'p11', sku: '8M0065104', barcode: '', name: 'Filtro de Óleo Pequeno/SeaPro', quantity: 15, cost: 55.25, price: 85.00, minStock: 8, location: 'A1-MERCURY' },
  { id: 'p12', sku: '35-879885T', barcode: '', name: 'Vela de Ignição NGK', quantity: 20, cost: 29.25, price: 45.00, minStock: 10, location: 'C1-VELAS' },
  { id: 'p13', sku: '8M0100633', barcode: '', name: 'Óleo de Rabeta SAE 90', quantity: 12, cost: 55.25, price: 85.00, minStock: 6, location: 'A1-MERCURY' },

  // MERCRUISER (4.5L & 6.2L)
  { id: 'p20', sku: '8M0078630', barcode: '', name: 'Óleo Motor 25W-40 (Quart)', quantity: 80, cost: 52.00, price: 80.00, minStock: 30, location: 'A1-MERCURY' },
  { id: 'p21', sku: '35-866340Q03', barcode: '', name: 'Filtro de Óleo MerCruiser', quantity: 12, cost: 71.50, price: 110.00, minStock: 6, location: 'A1-MERCURY' },
  { id: 'p22', sku: '35-60494A1', barcode: '', name: 'Filtro de Combustível MerCruiser', quantity: 10, cost: 84.50, price: 130.00, minStock: 5, location: 'A1-MERCURY' },
  { id: 'p23', sku: '8M0105237', barcode: '', name: 'Velas de Ignição NGK/IGX (Jogo)', quantity: 15, cost: 61.75, price: 95.00, minStock: 6, location: 'C1-VELAS' },
  { id: 'p24', sku: '8M0100526', barcode: '', name: 'Kit Reparo Bomba D\'água', quantity: 6, cost: 208.00, price: 320.00, minStock: 3, location: 'B2-KITS' },
  { id: 'p25', sku: '8M0100456', barcode: '', name: 'Correia do Alternador', quantity: 5, cost: 273.00, price: 420.00, minStock: 3, location: 'E2-CORREIAS' },

  // MERCURY DIESEL (3.0L)
  { id: 'p30', sku: '35-8M0065104', barcode: '', name: 'Filtro de Óleo Diesel', quantity: 8, cost: 91.00, price: 140.00, minStock: 4, location: 'A1-MERCURY' },
  { id: 'p31', sku: '8M0059687', barcode: '', name: 'Filtro de Combustível Primário/OptiMax', quantity: 12, cost: 117.00, price: 180.00, minStock: 6, location: 'A1-MERCURY' },
  { id: 'p32', sku: '8M0059688', barcode: '', name: 'Filtro de Combustível Secundário', quantity: 10, cost: 117.00, price: 180.00, minStock: 5, location: 'A1-MERCURY' },
  { id: 'p33', sku: '8M0100789', barcode: '', name: 'Kit Reparo Bomba D\'água Diesel/OptiMax', quantity: 4, cost: 338.00, price: 520.00, minStock: 2, location: 'B2-KITS' },
  { id: 'p34', sku: '8M0100790', barcode: '', name: 'Correia Poly-V', quantity: 4, cost: 247.00, price: 380.00, minStock: 2, location: 'E2-CORREIAS' },

  // SEAPRO & OPTIMAX
  { id: 'p40', sku: 'NGK-IZFR5G', barcode: '', name: 'Velas de Ignição Iridium', quantity: 18, cost: 97.50, price: 150.00, minStock: 12, location: 'C1-VELAS' },
  { id: 'p41', sku: 'ANODO-KIT-V6', barcode: '', name: 'Kit Anodos Comercial/V6', quantity: 8, cost: 227.50, price: 350.00, minStock: 4, location: 'D4-ANODOS' },
  { id: 'p42', sku: '35-879984T', barcode: '', name: 'Vela de Ignição OptiMax', quantity: 15, cost: 78.00, price: 120.00, minStock: 12, location: 'C1-VELAS' },

  // YAMAHA F300
  { id: 'p50', sku: '69J-13440-03', barcode: '', name: 'Filtro de Óleo Yamaha', quantity: 10, cost: 91.00, price: 140.00, minStock: 5, location: 'A2-YAMAHA' },
  { id: 'p51', sku: 'YAM-LUBE-4M', barcode: '', name: 'Yamalube 4M 10W-30', quantity: 40, cost: 58.50, price: 90.00, minStock: 20, location: 'A2-YAMAHA' },
  { id: 'p52', sku: '6P2-WS24A-01', barcode: '', name: 'Elemento Filtro Combustível Yamaha', quantity: 8, cost: 117.00, price: 180.00, minStock: 4, location: 'A2-YAMAHA' },
  { id: 'p53', sku: '90430-08003', barcode: '', name: 'Gaxeta Dreno Óleo Yamaha', quantity: 25, cost: 9.75, price: 15.00, minStock: 10, location: 'A2-YAMAHA' },
];

const ORDER_DESCRIPTIONS = [
  "Revisão de 100 horas", "Troca de óleo e filtros", "Motor falhando em alta", "Barulho estranho na rabeta",
  "Instalação de GPS/Sonar", "Troca de anodos de sacrifício", "Limpeza de bicos injetores", "Verificação elétrica geral",
  "Motor não dá partida", "Troca de rotor da bomba d'água", "Revisão de garantia (20h)", "Instalação de rádio VHF",
  "Polimento de casco", "Reparo no trim", "Troca de hélice", "Diagnóstico com scanner", "Vazamento de óleo no porão"
];

const TECHNICIANS = ["João Técnico", "Pedro Santos", "Carlos Eletricista", "Marcos Mecânico"];

const generatedOrders: ServiceOrder[] = [];
const generatedTransactions: Transaction[] = [];

// Create 100 Orders
for (let i = 0; i < 100; i++) {
  const isPast = i < 70; // 70 Completed/Past orders
  const isFuture = i > 85; // 15 Future orders

  let status: OSStatus;
  let dayOffset: number;

  if (isPast) {
    status = Math.random() > 0.1 ? OSStatus.COMPLETED : OSStatus.CANCELED;
    dayOffset = getRandomInt(-180, -1); // Last 6 months
  } else if (isFuture) {
    status = Math.random() > 0.5 ? OSStatus.APPROVED : OSStatus.PENDING;
    dayOffset = getRandomInt(1, 60); // Next 2 months
  } else {
    // Current
    status = getRandomItem([OSStatus.IN_PROGRESS, OSStatus.PENDING, OSStatus.QUOTATION]);
    dayOffset = getRandomInt(-5, 5);
  }

  const boat = getRandomItem(seedBoats);
  const date = getDate(dayOffset, getRandomInt(8, 17));
  const desc = getRandomItem(ORDER_DESCRIPTIONS);

  // Generate random items for value
  const items: ServiceItem[] = [];
  let totalValue = 0;
  if (status !== OSStatus.PENDING && status !== OSStatus.CANCELED) {
    const laborCost = getRandomInt(200, 1500);
    items.push({ id: `i_l_${i}`, type: 'LABOR', description: 'Mão de Obra Especializada', quantity: 1, unitPrice: laborCost, total: laborCost });

    const part = getRandomItem(seedParts);
    const qty = getRandomInt(1, 4);
    items.push({
      id: `i_p_${i}`,
      type: 'PART',
      description: part.name,
      partId: part.id,
      quantity: qty,
      unitPrice: part.price,
      unitCost: part.cost,
      total: part.price * qty
    });

    totalValue = laborCost + (part.price * qty);
  }

  const orderId = `OS-2024-${(100 + i).toString()}`;

  generatedOrders.push({
    id: orderId,
    boatId: boat.id,
    engineId: boat.engines[0]?.id,
    description: desc,
    status: status,
    items: items,
    totalValue: totalValue,
    createdAt: date,
    requester: getRandomItem(['Cliente', 'Marinha', 'Gerente Pátio', 'Whatsapp']),
    technicianName: status === OSStatus.PENDING ? undefined : getRandomItem(TECHNICIANS),
    scheduledAt: date,
    estimatedDuration: getRandomInt(2, 8),
    notes: [],
    checklist: [],
    timeLogs: status === OSStatus.IN_PROGRESS ? [{ start: getDate(0, 8) }] : []
  });

  // Generate Transaction for Completed Orders
  if (status === OSStatus.COMPLETED) {
    generatedTransactions.push({
      id: `t_inc_${i}`,
      type: 'INCOME',
      category: 'Serviços',
      description: `Receita OS #${orderId} - ${boat.name}`,
      amount: totalValue,
      date: date,
      status: 'PAID',
      orderId: orderId,
      documentNumber: `NFS-${1000 + i}`
    });
  }
}

// Generate Random Expenses
for (let i = 0; i < 30; i++) {
  const dayOffset = getRandomInt(-90, 0);
  const amount = getRandomInt(100, 2000);
  const category = getRandomItem(['Combustível', 'Alimentação', 'Peças (Compra)', 'Energia', 'Aluguel', 'Ferramentas']);

  generatedTransactions.push({
    id: `t_exp_${i}`,
    type: 'EXPENSE',
    category: category,
    description: `${category} - Lançamento Diverso`,
    amount: amount,
    date: getDate(dayOffset),
    status: 'PAID'
  });
}

// Ensure essential pending expenses exist
generatedTransactions.push(
  { id: 't_pending_1', type: 'EXPENSE', category: 'Infraestrutura', description: 'Aluguel Galpão (A Vencer)', amount: 4500.00, date: getDate(5), status: 'PENDING' },
  { id: 't_pending_2', type: 'EXPENSE', category: 'Estoque', description: 'Pedido Mercury #4459', amount: 8200.00, date: getDate(2), status: 'PENDING' }
);


const seedConfig: SystemConfig = {
  boatManufacturers: {
    "Schaefer Yachts": ["Phantom 303", "Phantom 400", "Schaefer 510", "Schaefer 660"],
    "Intermarine": ["Intermarine 42", "Intermarine 60", "Intermarine 80"],
    "Fibrafort (Focker)": ["Focker 210", "Focker 240", "Focker 255", "Focker 333"],
    "NX Boats": ["NX 250", "NX 270", "NX 340", "NX 400"],
    "Azimut Yachts": ["Azimut 50", "Azimut 60", "Azimut 83"],
    "Coral": ["Coral 26", "Coral 30", "Coral 43"],
    "Triton Yachts": ["Triton 300", "Triton 370", "Triton 520"],
    "Levefort": ["Marajó 17", "Marajó 19"],
    "SeaDoo": ["GTI 130", "RXP-X 300", "Spark"],
    "Yamaha (Jet)": ["VX Cruiser", "GP1800R"]
  },
  engineManufacturers: {
    "Mercury (Outboard)": ["15hp", "40hp", "60hp", "90hp", "115hp", "150hp", "200hp", "300hp V8", "400hp V10", "600hp V12"],
    "Mercury MerCruiser": ["4.5L V6", "6.2L V8", "8.2L MAG"],
    "Mercury Diesel": ["2.0L", "3.0L V6", "4.2L V8"],
    "Volvo Penta": ["D4", "D6", "V6", "V8"],
    "Yamaha": ["40hp", "60hp", "115hp", "250hp"],
    "Rotax": ["1503", "1630 ACE"]
  }
};

// Helper to deep copy defaults if not found in storage
const getOrSeed = <T>(key: string, seed: T): T => {
  const data = localStorage.getItem(key);
  if (data) return JSON.parse(data);
  // Important: Return a deep copy of the seed to prevent reference issues
  return JSON.parse(JSON.stringify(seed));
};

export const StorageService = {
  getClients: (): Client[] => getOrSeed(KEYS.CLIENTS, seedClients),
  saveClients: (clients: Client[]) => localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients)),

  getMarinas: (): Marina[] => getOrSeed(KEYS.MARINAS, seedMarinas),
  saveMarinas: (marinas: Marina[]) => localStorage.setItem(KEYS.MARINAS, JSON.stringify(marinas)),

  getBoats: (): Boat[] => getOrSeed(KEYS.BOATS, seedBoats),
  saveBoats: (boats: Boat[]) => localStorage.setItem(KEYS.BOATS, JSON.stringify(boats)),

  getInventory: (): Part[] => getOrSeed(KEYS.INVENTORY, seedParts),
  saveInventory: (parts: Part[]) => localStorage.setItem(KEYS.INVENTORY, JSON.stringify(parts)),

  getInvoices: (): Invoice[] => getOrSeed(KEYS.INVOICES, []),
  saveInvoices: (invoices: Invoice[]) => localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices)),

  getMovements: (): StockMovement[] => getOrSeed(KEYS.MOVEMENTS, []),
  saveMovements: (movements: StockMovement[]) => localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(movements)),

  addMovement: (movement: StockMovement) => {
    const movements = StorageService.getMovements();
    movements.push(movement);
    localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(movements));
  },

  // Process a new Invoice (Updates stock and adds movement)
  processInvoice: (invoice: Invoice, user: string) => {
    const parts = StorageService.getInventory();
    const invoices = StorageService.getInvoices();
    const movements = StorageService.getMovements();
    const transactions = StorageService.getTransactions();

    // 1. Update Inventory and Create Movements
    invoice.items.forEach(item => {
      if (!item.partId) return;

      const partIndex = parts.findIndex(p => p.id === item.partId);
      if (partIndex >= 0) {
        const part = parts[partIndex];
        // Update Quantity
        const oldQty = part.quantity;
        part.quantity += item.quantity;

        // Update Cost (Weighted Average)
        // (Old Cost * Old Qty + New Cost * New Qty) / Total Qty
        const totalValue = (part.cost * oldQty) + (item.unitCost * item.quantity);
        part.cost = totalValue / part.quantity;

        // Add Movement Log
        movements.push({
          id: Date.now().toString() + Math.random(),
          partId: part.id,
          type: 'IN_INVOICE',
          quantity: item.quantity,
          date: new Date().toISOString(),
          referenceId: invoice.id,
          description: `Entrada via NF ${invoice.number} - ${invoice.supplier}`,
          user: user
        });
      }
    });

    // 2. Add Invoice to History
    invoices.push(invoice);

    // 3. Create Expense Transaction
    transactions.push({
      id: Date.now().toString(),
      type: 'EXPENSE',
      category: 'Peças (Compra)',
      description: `Compra NF ${invoice.number} - ${invoice.supplier}`,
      amount: invoice.totalValue,
      date: invoice.date,
      status: 'PAID', // Assuming paid for simplicity, could be PENDING
      documentNumber: invoice.number
    });

    // Save All
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(parts));
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
    localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(movements));
    localStorage.setItem(KEYS.FINANCE, JSON.stringify(transactions));
  },

  getOrders: (): ServiceOrder[] => getOrSeed(KEYS.ORDERS, generatedOrders),
  saveOrders: (orders: ServiceOrder[]) => localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders)),

  // -- ADVANCED ORDER MANAGEMENT --

  completeServiceOrder: (orderId: string): boolean => {
    console.log("Tentando concluir ordem: ", orderId);
    try {
      const orders = StorageService.getOrders();
      const orderIndex = orders.findIndex(o => o.id === orderId);

      if (orderIndex < 0) {
        console.error("Ordem não encontrada: " + orderId);
        return false;
      }

      const order = orders[orderIndex];

      // Prevent double completion
      if (order.status === OSStatus.COMPLETED) {
        console.log("Ordem já estava concluída.");
        return true;
      }

      const parts = StorageService.getInventory();
      const movements = StorageService.getMovements();
      const transactions = StorageService.getTransactions();
      const boats = StorageService.getBoats();
      const boat = boats.find(b => b.id === order.boatId);

      // 1. Deduct Stock for Used Parts
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          if (item.type === 'PART' && item.partId) {
            const partIndex = parts.findIndex(p => p.id === item.partId);
            if (partIndex >= 0) {
              console.log(`Baixando estoque: Peça ${parts[partIndex].name}, Qtd ${item.quantity}`);
              parts[partIndex].quantity -= item.quantity;
              movements.push({
                id: Date.now().toString() + Math.random(),
                partId: item.partId,
                type: 'OUT_OS',
                quantity: item.quantity,
                date: new Date().toISOString(),
                referenceId: order.id,
                description: `Saída OS #${order.id} - ${item.description}`,
                user: 'Sistema'
              });
            } else {
              console.warn(`Peça ID ${item.partId} não encontrada no inventário.`);
            }
          }
        });
      }

      // 2. Generate Income Transaction
      const exists = transactions.some(t => t.orderId === order.id && t.status !== 'CANCELED');
      if (!exists) {
        transactions.push({
          id: Date.now().toString(),
          type: 'INCOME',
          category: 'Serviços',
          description: `Receita OS #${order.id} - ${boat?.name || 'Embarcação'}`,
          amount: order.totalValue,
          date: new Date().toISOString(),
          status: 'PAID',
          orderId: order.id,
          documentNumber: `NFS-${order.id}`
        });
      }

      // 3. Update Order Status
      order.status = OSStatus.COMPLETED;
      orders[orderIndex] = order;

      // Save Everything Explicitly
      StorageService.saveInventory(parts);
      StorageService.saveMovements(movements);
      StorageService.saveTransactions(transactions);
      StorageService.saveOrders(orders);

      console.log("Ordem concluída e salva com sucesso.");
      return true;
    } catch (e) {
      console.error("Erro ao concluir ordem (Exception):", e);
      return false;
    }
  },

  reopenServiceOrder: (orderId: string): boolean => {
    const orders = StorageService.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex < 0) return false;

    const order = orders[orderIndex];
    // Only can reopen Completed orders
    if (order.status !== OSStatus.COMPLETED) return false;

    const parts = StorageService.getInventory();
    const movements = StorageService.getMovements();
    const transactions = StorageService.getTransactions();

    // 1. Return Stock (Reverse Deduction)
    order.items.forEach(item => {
      if (item.type === 'PART' && item.partId) {
        const partIndex = parts.findIndex(p => p.id === item.partId);
        if (partIndex >= 0) {
          parts[partIndex].quantity += item.quantity;
          movements.push({
            id: Date.now().toString() + Math.random(),
            partId: item.partId,
            type: 'RETURN_OS', // New Type or use ADJUSTMENT_PLUS
            quantity: item.quantity,
            date: new Date().toISOString(),
            referenceId: order.id,
            description: `Estorno (Reabertura) OS #${order.id} - ${item.description}`,
            user: 'Admin'
          });
        }
      }
    });

    // 2. Cancel Financial Transaction
    const transIndex = transactions.findIndex(t => t.orderId === order.id && t.status === 'PAID');
    if (transIndex >= 0) {
      transactions[transIndex].status = 'CANCELED';
      transactions[transIndex].description += ' (ESTORNADO)';
    }

    // 3. Update Order Status
    order.status = OSStatus.IN_PROGRESS;
    orders[orderIndex] = order;

    StorageService.saveInventory(parts);
    StorageService.saveMovements(movements);
    StorageService.saveTransactions(transactions);
    StorageService.saveOrders(orders);
    return true;
  },

  getTransactions: (): Transaction[] => getOrSeed(KEYS.FINANCE, generatedTransactions),
  saveTransactions: (transactions: Transaction[]) => localStorage.setItem(KEYS.FINANCE, JSON.stringify(transactions)),

  getConfig: (): SystemConfig => getOrSeed(KEYS.CONFIG, seedConfig),
  saveConfig: (config: SystemConfig) => localStorage.setItem(KEYS.CONFIG, JSON.stringify(config)),

  getUsers: (): User[] => getOrSeed(KEYS.USERS, seedUsers),
  saveUsers: (users: User[]) => localStorage.setItem(KEYS.USERS, JSON.stringify(users)),

  // --- SERVICE CATALOG METHODS ---
  getServices: (): ServiceDefinition[] => getOrSeed(KEYS.SERVICES, seedServicesCatalog),
  saveServices: (services: ServiceDefinition[]) => localStorage.setItem(KEYS.SERVICES, JSON.stringify(services)),

  login: (email: string, pass: string): User | null => {
    const users = StorageService.getUsers();
    return users.find(u => u.email === email && u.password === pass) || null;
  },

  // Initialize all storage with seed data if empty
  initialize: () => {
    StorageService.getUsers();
    StorageService.getClients();
    StorageService.getMarinas();
    StorageService.getBoats();
    StorageService.getInventory();
    StorageService.getOrders();
    StorageService.getTransactions();
    StorageService.getConfig();
    StorageService.getServices();
  },

  reset: () => {
    localStorage.clear();
    window.location.reload();
  }
};