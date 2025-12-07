// Seed data for Mercury Parts extracted from Maintenance Kits
// Add these to seedParts in storage.ts

export const MERCURY_MAINTENANCE_PARTS = [
    // Mercury Verado V8
    { id: 'p100', sku: '8M0123456', barcode: '', name: 'Filtro de Óleo Mercury Verado / Diesel', quantity: 10, cost: 78.00, price: 120.00, minStock: 3, location: 'A1-MERCURY' },
    { id: 'p101', sku: '92-858037K01', barcode: '', name: 'Óleo Motor 25W40 (Quart) / TCW3 OptiMax', quantity: 50, cost: 55.25, price: 85.00, minStock: 20, location: 'A1-MERCURY' },
    { id: 'p102', sku: '8M0000001', barcode: '', name: 'Filtro de Combustível Baixa Pressão', quantity: 8, cost: 97.50, price: 150.00, minStock: 5, location: 'A1-MERCURY' },
    { id: 'p103', sku: '8M0000002', barcode: '', name: 'Kit Anodos Rabeta Verado', quantity: 5, cost: 292.50, price: 450.00, minStock: 3, location: 'D4-ANODOS' },
    { id: 'p104', sku: '92-858064K01', barcode: '', name: 'Óleo de Rabeta High Performance', quantity: 30, cost: 71.50, price: 110.00, minStock: 10, location: 'A1-MERCURY' },
    { id: 'p105', sku: '8M0000123', barcode: '', name: 'Velas de Ignição Iridium V8', quantity: 24, cost: 117.00, price: 180.00, minStock: 8, location: 'C1-VELAS' },
    { id: 'p106', sku: '8M0000456', barcode: '', name: 'Kit Reparo Bomba D\'água Verado', quantity: 4, cost: 247.00, price: 380.00, minStock: 2, location: 'B2-KITS' },
    { id: 'p107', sku: '8M0000789', barcode: '', name: 'Correia do Alternador Verado', quantity: 3, cost: 273.00, price: 420.00, minStock: 2, location: 'E2-CORREIAS' },

    // Mercury Portáteis
    { id: 'p110', sku: '8M0071840', barcode: '', name: 'Óleo Motor 10W-30 (Quart)', quantity: 20, cost: 42.25, price: 65.00, minStock: 8, location: 'A1-MERCURY' },
    { id: 'p111', sku: '8M0065104', barcode: '', name: 'Filtro de Óleo Pequeno / SeaPro', quantity: 15, cost: 55.25, price: 85.00, minStock: 8, location: 'A1-MERCURY' },
    { id: 'p112', sku: '35-879885T', barcode: '', name: 'Vela de Ignição NGK', quantity: 20, cost: 29.25, price: 45.00, minStock: 10, location: 'C1-VELAS' },
    { id: 'p113', sku: '8M0100633', barcode: '', name: 'Óleo de Rabeta SAE 90', quantity: 12, cost: 55.25, price: 85.00, minStock: 6, location: 'A1-MERCURY' },

    // MerCruiser
    { id: 'p120', sku: '8M0078630', barcode: '', name: 'Óleo Motor 25W-40 (Quart)', quantity: 80, cost: 52.00, price: 80.00, minStock: 30, location: 'A1-MERCURY' },
    { id: 'p121', sku: '35-866340Q03', barcode: '', name: 'Filtro de Óleo MerCruiser', quantity: 12, cost: 71.50, price: 110.00, minStock: 6, location: 'A1-MERCURY' },
    { id: 'p122', sku: '35-60494A1', barcode: '', name: 'Filtro de Combustível MerCruiser', quantity: 10, cost: 84.50, price: 130.00, minStock: 5, location: 'A1-MERCURY' },
    { id: 'p123', sku: '8M0105237', barcode: '', name: 'Velas de Ignição NGK/IGX (Jogo)', quantity: 15, cost: 61.75, price: 95.00, minStock: 6, location: 'C1-VELAS' },
    { id: 'p124', sku: '8M0100526', barcode: '', name: 'Kit Reparo Bomba D\'água', quantity: 6, cost: 208.00, price: 320.00, minStock: 3, location: 'B2-KITS' },
    { id: 'p125', sku: '8M0100456', barcode: '', name: 'Correia do Alternador', quantity: 5, cost: 273.00, price: 420.00, minStock: 3, location: 'E2-CORREIAS' },

    // Mercury Diesel
    { id: 'p130', sku: '35-8M0065104', barcode: '', name: 'Filtro de Óleo Diesel', quantity: 8, cost: 91.00, price: 140.00, minStock: 4, location: 'A1-MERCURY' },
    { id: 'p131', sku: '8M0059687', barcode: '', name: 'Filtro de Combustível Primário / OptiMax', quantity: 12, cost: 117.00, price: 180.00, minStock: 6, location: 'A1-MERCURY' },
    { id: 'p132', sku: '8M0059688', barcode: '', name: 'Filtro de Combustível Secundário', quantity: 10, cost: 117.00, price: 180.00, minStock: 5, location: 'A1-MERCURY' },
    { id: 'p133', sku: '8M0100789', barcode: '', name: 'Kit Reparo Bomba D\'água Diesel/OptiMax', quantity: 4, cost: 338.00, price: 520.00, minStock: 2, location: 'B2-KITS' },
    { id: 'p134', sku: '8M0100790', barcode: '', name: 'Correia Poly-V', quantity: 4, cost: 247.00, price: 380.00, minStock: 2, location: 'E2-CORREIAS' },

    // SeaPro & OptiMax
    { id: 'p140', sku: 'NGK-IZFR5G', barcode: '', name: 'Velas de Ignição Iridium', quantity: 18, cost: 97.50, price: 150.00, minStock: 12, location: 'C1-VELAS' },
    { id: 'p141', sku: 'ANODO-KIT-V6', barcode: '', name: 'Kit Anodos Comercial/V6', quantity: 8, cost: 227.50, price: 350.00, minStock: 4, location: 'D4-ANODOS' },
    { id: 'p142', sku: '35-879984T', barcode: '', name: 'Vela de Ignição OptiMax', quantity: 15, cost: 78.00, price: 120.00, minStock: 12, location: 'C1-VELAS' },

    // Yamaha
    { id: 'p150', sku: '69J-13440-03', barcode: '', name: 'Filtro de Óleo Yamaha', quantity: 10, cost: 91.00, price: 140.00, minStock: 5, location: 'A2-YAMAHA' },
    { id: 'p151', sku: 'YAM-LUBE-4M', barcode: '', name: 'Yamalube 4M 10W-30', quantity: 40, cost: 58.50, price: 90.00, minStock: 20, location: 'A2-YAMAHA' },
    { id: 'p152', sku: '6P2-WS24A-01', barcode: '', name: 'Elemento Filtro Combustível Yamaha', quantity: 8, cost: 117.00, price: 180.00, minStock: 4, location: 'A2-YAMAHA' },
    { id: 'p153', sku: '90430-08003', barcode: '', name: 'Gaxeta Dreno Óleo Yamaha', quantity: 25, cost: 9.75, price: 15.00, minStock: 10, location: 'A2-YAMAHA' },
];
