import React, { useState, useEffect } from 'react';
import { Part, StockMovement, Invoice, InvoiceItem, PartCreate, PartUpdate, StockMovementCreate } from '../types';
import { ApiService } from '../services/api';
import {
    Package, Search, Plus, Filter, ArrowUpRight, ArrowDownLeft,
    AlertTriangle, History, Barcode, FileText, CheckCircle, X,
    Printer, ShoppingCart, Camera, Upload
} from 'lucide-react';
import { ScannerModal } from './ScannerModal';

export const InventoryView: React.FC = () => {
    // --- ESTADOS ---
    const [parts, setParts] = useState<Part[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [activeTab, setActiveTab] = useState('overview'); // overview, invoice, count, kardex
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para Modais e Ações
    const [isPartModalOpen, setIsPartModalOpen] = useState(false);
    const [newPart, setNewPart] = useState<Partial<Part>>({});
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    // Estados para Nota Fiscal (Invoice)
    const [invoiceXml, setInvoiceXml] = useState<string | null>(null);
    const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({ items: [] });
    const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);

    // Estados para Contagem de Inventário
    const [inventoryCount, setInventoryCount] = useState<{ partId: string, counted: number, system: number }[]>([]);
    const [isCounting, setIsCounting] = useState(false);

    // --- CARREGAMENTO INICIAL ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [partsData, movementsData] = await Promise.all([
                ApiService.getParts(),
                ApiService.getMovements()
            ]);
            setParts(partsData);
            setMovements(movementsData);
        } catch (error) {
            console.error("Erro ao carregar estoque:", error);
            alert("Erro ao carregar dados do estoque.");
        } finally {
            setIsLoading(false);
        }
    };

    const [mercurySearchTerm, setMercurySearchTerm] = useState('');

    const handleSearchMercury = async () => {
        if (!mercurySearchTerm) {
            alert('Digite um código para buscar na Mercury');
            return;
        }

        try {
            const result = await ApiService.searchMercuryProduct(mercurySearchTerm);
            if (result.status === 'success' && result.results.length > 0) {
                const mercuryItem = result.results[0];
                setNewPart({
                    ...newPart,
                    sku: mercuryItem.codigo,
                    name: mercuryItem.descricao,
                    price: parseFloat(mercuryItem.valorVenda.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0,
                    cost: parseFloat(mercuryItem.valorCusto.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0
                });
                alert(`Produto encontrado: ${mercuryItem.descricao}`);
            } else {
                alert('Nenhum produto encontrado na Mercury com esse código');
            }
        } catch (error) {
            alert('Erro ao buscar produto na Mercury');
            console.error(error);
        }
    };

    // --- LEITOR DE CÓDIGO DE BARRAS ---
    const handleScan = (decodedText: string) => {
        setSearchTerm(decodedText);
        setIsCameraOpen(false);
        // Tenta encontrar o produto
        const part = parts.find(p => p.barcode === decodedText || p.sku === decodedText);
        if (part) {
            // Se estiver no modo de contagem, incrementa
            if (isCounting) {
                handleCountItem(part.id.toString());
            } else {
                // Se não, abre modal de edição
                handleEditPart(part);
            }
        } else {
            if (confirm(`Produto não encontrado: ${decodedText}. Deseja cadastrar?`)) {
                setNewPart({ barcode: decodedText });
                setIsPartModalOpen(true);
            }
        }
    };

    // --- AÇÕES DE PRODUTO ---
    const handleEditPart = (part: Part) => {
        setNewPart({ ...part });
        setIsPartModalOpen(true);
    };

    const handleSavePart = async () => {
        if (!newPart.name || !newPart.sku) {
            alert("Nome e SKU são obrigatórios.");
            return;
        }

        try {
            if (newPart.id) {
                // Edição
                const updateData: PartUpdate = {
                    name: newPart.name,
                    sku: newPart.sku,
                    barcode: newPart.barcode,
                    cost: newPart.cost,
                    price: newPart.price,
                    minStock: newPart.minStock,
                    location: newPart.location
                };
                await ApiService.updatePart(Number(newPart.id), updateData);
            } else {
                // Criação
                const createData: PartCreate = {
                    name: newPart.name!,
                    sku: newPart.sku!,
                    barcode: newPart.barcode,
                    quantity: newPart.quantity || 0,
                    cost: newPart.cost || 0,
                    price: newPart.price || 0,
                    minStock: newPart.minStock || 0,
                    location: newPart.location
                };
                await ApiService.createPart(createData);
            }
            await loadData();
            setIsPartModalOpen(false);
            setNewPart({});
        } catch (error) {
            console.error("Erro ao salvar produto:", error);
            alert("Erro ao salvar produto. Verifique se o SKU já existe.");
        }
    };

    // --- IMPORTAÇÃO DE XML (NFe) ---
    const handleXmlUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setInvoiceXml(text);
            parseNfe(text);
        };
        reader.readAsText(file);
    };

    const parseNfe = (xml: string) => {
        // Simulação de parser XML (na vida real usaria uma lib como fast-xml-parser)
        // Aqui vamos extrair dados fictícios ou usar regex simples para demonstração
        const mockItems: InvoiceItem[] = [
            { sku: 'OLEO-25W40', name: 'Óleo Mercury 25W40', quantity: 12, unitCost: 45.00, total: 540.00 },
            { sku: 'FILTRO-OLEO', name: 'Filtro de Óleo Verado', quantity: 6, unitCost: 60.00, total: 360.00 }
        ];

        setCurrentInvoice({
            number: '12345',
            supplier: 'Mercury Marine do Brasil',
            date: new Date().toISOString(),
            items: mockItems,
            totalValue: 900.00
        });
    };

    const handleInvoiceSubmit = async () => {
        setIsProcessingInvoice(true);
        try {
            // Para cada item da nota, atualiza o estoque
            for (const item of currentInvoice.items || []) {
                // Tenta achar o produto pelo SKU
                let part = parts.find(p => p.sku === item.sku);

                if (part) {
                    // Atualiza quantidade e custo
                    // O backend não tem endpoint específico para "entrada de nota" que atualize o custo automaticamente
                    // Então vamos fazer um update manual e criar um movimento

                    // 1. Cria movimento de entrada
                    await ApiService.createMovement({
                        partId: Number(part.id),
                        type: 'IN_INVOICE',
                        quantity: item.quantity,
                        description: `NF ${currentInvoice.number} - ${currentInvoice.supplier}`,
                        referenceId: currentInvoice.number,
                        user: 'Admin' // Pegar do contexto de usuário se possível
                    });

                    // 2. Atualiza custo e preço (opcional, regra de negócio)
                    // Vamos atualizar apenas o custo médio se necessário, mas aqui vamos simplificar
                    await ApiService.updatePart(Number(part.id), {
                        cost: item.unitCost,
                        // Atualiza quantidade somando
                        quantity: part.quantity + item.quantity
                    });

                } else {
                    // Produto novo, cria
                    const newPartData: PartCreate = {
                        sku: item.sku,
                        name: item.name,
                        quantity: item.quantity,
                        cost: item.unitCost,
                        price: item.unitCost * 1.5, // Margem padrão de 50%
                        minStock: 5
                    };
                    const createdPart = await ApiService.createPart(newPartData);

                    // Cria movimento inicial
                    await ApiService.createMovement({
                        partId: Number(createdPart.id),
                        type: 'IN_INVOICE',
                        quantity: item.quantity,
                        description: `NF ${currentInvoice.number} - ${currentInvoice.supplier} (Cadastro Inicial)`,
                        referenceId: currentInvoice.number,
                        user: 'Admin'
                    });
                }
            }

            alert("Nota Fiscal processada com sucesso!");
            setCurrentInvoice({ items: [] });
            setInvoiceXml(null);
            await loadData();
            setActiveTab('overview');
        } catch (error) {
            console.error("Erro ao processar nota:", error);
            alert("Erro ao processar nota fiscal.");
        } finally {
            setIsProcessingInvoice(false);
        }
    };

    // --- CONTAGEM DE INVENTÁRIO ---
    const startInventory = () => {
        setInventoryCount(parts.map(p => ({ partId: p.id, counted: 0, system: p.quantity })));
        setIsCounting(true);
        setActiveTab('count');
    };

    const handleCountItem = (partId: string, qty: number = 1) => {
        setInventoryCount(prev => prev.map(item =>
            item.partId === partId ? { ...item, counted: item.counted + qty } : item
        ));
    };

    const handleInventoryFinish = async () => {
        if (!confirm("Deseja finalizar a contagem e ajustar o estoque?")) return;

        try {
            for (const item of inventoryCount) {
                const diff = item.counted - item.system;
                if (diff !== 0) {
                    await ApiService.createMovement({
                        partId: Number(item.partId),
                        type: diff > 0 ? 'ADJUSTMENT_PLUS' : 'ADJUSTMENT_MINUS',
                        quantity: Math.abs(diff),
                        description: 'Ajuste de Inventário',
                        user: 'Admin'
                    });

                    // Atualiza a quantidade na peça
                    await ApiService.updatePart(Number(item.partId), {
                        quantity: item.counted
                    });
                }
            }
            alert("Inventário atualizado com sucesso!");
            setIsCounting(false);
            await loadData();
            setActiveTab('overview');
        } catch (error) {
            console.error("Erro ao finalizar inventário:", error);
            alert("Erro ao finalizar inventário.");
        }
    };

    // --- RENDERIZAÇÃO ---

    // Filtros
    const filteredParts = parts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.includes(searchTerm)
    );

    const lowStockItems = parts.filter(p => p.quantity <= p.minStock);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="w-6 h-6 text-cyan-600" /> Gestão de Estoque
                    </h2>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsPurchaseModalOpen(true)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-slate-50 relative">
                        <ShoppingCart className="w-4 h-4" /> Compras
                        {lowStockItems.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                {lowStockItems.length}
                            </span>
                        )}
                    </button>
                    <button onClick={() => { setNewPart({}); setIsPartModalOpen(true); }} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium">
                        <Plus className="w-4 h-4" /> Novo Produto
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200 mb-6">
                <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Visão Geral</button>
                <button onClick={() => setActiveTab('invoice')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'invoice' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Entrada NFe</button>
                <button onClick={() => setActiveTab('count')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'count' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Inventário</button>
                <button onClick={() => setActiveTab('kardex')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'kardex' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Kardex</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="flex flex-col h-full">
                        <div className="flex gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar produto..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button onClick={() => setIsCameraOpen(true)} className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200">
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">SKU</th>
                                        <th className="px-6 py-4">Produto</th>
                                        <th className="px-6 py-4 text-center">Estoque</th>
                                        <th className="px-6 py-4 text-right">Custo</th>
                                        <th className="px-6 py-4 text-right">Venda</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredParts.map((part) => (
                                        <tr key={part.id} onClick={() => handleEditPart(part)} className="hover:bg-cyan-50 cursor-pointer transition-colors">
                                            <td className="px-6 py-4 font-mono text-slate-500">{part.sku}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{part.name}</td>
                                            <td className="px-6 py-4 text-center font-bold">{part.quantity}</td>
                                            <td className="px-6 py-4 text-right text-slate-500">R$ {part.cost.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-700">R$ {part.price.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center">
                                                {part.quantity <= part.minStock ? (
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Baixo</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">OK</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* INVOICE TAB */}
                {activeTab === 'invoice' && (
                    <div className="h-full overflow-y-auto">
                        {!currentInvoice.items?.length ? (
                            <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
                                <Upload className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-700 mb-2">Importar Nota Fiscal (XML)</h3>
                                <p className="text-slate-500 mb-6">Arraste o arquivo XML ou clique para selecionar</p>
                                <label className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-bold cursor-pointer transition-colors inline-block">
                                    Selecionar Arquivo
                                    <input type="file" accept=".xml" className="hidden" onChange={handleXmlUpload} />
                                </label>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex justify-between items-start mb-6 border-b pb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">NF-e {currentInvoice.number}</h3>
                                        <p className="text-slate-500">{currentInvoice.supplier}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500">Valor Total</p>
                                        <p className="text-2xl font-bold text-cyan-700">R$ {currentInvoice.totalValue?.toFixed(2)}</p>
                                    </div>
                                </div>

                                <table className="w-full text-left text-sm mb-6">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="p-3">SKU</th>
                                            <th className="p-3">Produto</th>
                                            <th className="p-3 text-center">Qtd</th>
                                            <th className="p-3 text-right">Unitário</th>
                                            <th className="p-3 text-right">Total</th>
                                            <th className="p-3 text-center">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {currentInvoice.items.map((item, idx) => {
                                            const exists = parts.some(p => p.sku === item.sku);
                                            return (
                                                <tr key={idx}>
                                                    <td className="p-3 font-mono">{item.sku}</td>
                                                    <td className="p-3">{item.name}</td>
                                                    <td className="p-3 text-center">{item.quantity}</td>
                                                    <td className="p-3 text-right">R$ {item.unitCost.toFixed(2)}</td>
                                                    <td className="p-3 text-right font-bold">R$ {item.total.toFixed(2)}</td>
                                                    <td className="p-3 text-center">
                                                        {exists ? (
                                                            <span className="text-emerald-600 text-xs font-bold flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Atualizar</span>
                                                        ) : (
                                                            <span className="text-blue-600 text-xs font-bold flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Cadastrar</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setCurrentInvoice({ items: [] })} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                                    <button onClick={handleInvoiceSubmit} disabled={isProcessingInvoice} className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-bold shadow-lg shadow-cyan-200">
                                        {isProcessingInvoice ? 'Processando...' : 'Processar Entrada'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* COUNT TAB */}
                {activeTab === 'count' && (
                    <div className="h-full flex flex-col">
                        {!isCounting ? (
                            <div className="flex-1 flex items-center justify-center flex-col text-center">
                                <div className="bg-cyan-50 p-6 rounded-full mb-6">
                                    <Barcode className="w-16 h-16 text-cyan-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Iniciar Inventário</h3>
                                <p className="text-slate-500 max-w-md mb-8">O modo de inventário permite conferir o estoque físico. As diferenças serão ajustadas automaticamente ao finalizar.</p>
                                <button onClick={startInventory} className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-cyan-200 transition-transform hover:scale-105">
                                    Começar Contagem
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div>
                                        <h3 className="font-bold text-slate-800">Contagem em Andamento</h3>
                                        <p className="text-sm text-slate-500">{inventoryCount.filter(i => i.counted > 0).length} itens contados de {inventoryCount.length}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setIsCameraOpen(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                                            <Camera className="w-4 h-4" /> Ler Código
                                        </button>
                                        <button onClick={handleInventoryFinish} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold shadow-md">
                                            Finalizar
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="p-3">Produto</th>
                                                <th className="p-3 text-center">Sistema</th>
                                                <th className="p-3 text-center">Contagem</th>
                                                <th className="p-3 text-center">Diferença</th>
                                                <th className="p-3 text-center">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {inventoryCount.map(item => {
                                                const part = parts.find(p => p.id === item.partId);
                                                const diff = item.counted - item.system;
                                                return (
                                                    <tr key={item.partId} className={item.counted > 0 ? 'bg-cyan-50/30' : ''}>
                                                        <td className="p-3 font-medium">{part?.name}</td>
                                                        <td className="p-3 text-center text-slate-500">{item.system}</td>
                                                        <td className="p-3 text-center font-bold text-lg">{item.counted}</td>
                                                        <td className={`p-3 text-center font-bold ${diff === 0 ? 'text-slate-300' : diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {diff > 0 ? `+${diff}` : diff}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button onClick={() => handleCountItem(item.partId, -1)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold">-</button>
                                                                <button onClick={() => handleCountItem(item.partId, 1)} className="w-8 h-8 rounded-full bg-cyan-100 hover:bg-cyan-200 text-cyan-700 flex items-center justify-center font-bold">+</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* KARDEX TAB */}
                {activeTab === 'kardex' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold sticky top-0">
                                <tr>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Produto</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Descrição</th>
                                    <th className="p-4 text-center">Qtd</th>
                                    <th className="p-4">Usuário</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {movements.map(mov => {
                                    const part = parts.find(p => p.id === mov.partId);

                                    return (
                                        <tr key={mov.id}>
                                            <td className="p-4 text-slate-500">{new Date(mov.date).toLocaleString()}</td>
                                            <td className="p-4 font-bold text-slate-700">{part?.name || 'Desconhecido'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${mov.type.includes('IN') || mov.type.includes('PLUS') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {mov.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-600">{mov.description}</td>
                                            <td className="p-4 text-center font-bold">{mov.quantity}</td>
                                            <td className="p-4 text-slate-500 text-xs">{mov.user}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modais */}
            <ScannerModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onScan={handleScan}
            />

            {isPartModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
                        <h3 className="text-lg font-bold mb-4">{newPart.id ? 'Editar Produto' : 'Novo Produto'}</h3>

                        {/* Mercury Search Section */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                            <label className="block text-xs font-bold text-blue-700 mb-2 uppercase">Buscar na Mercury Marine</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Digite o código do produto..."
                                    className="flex-1 p-2 border border-blue-300 rounded bg-white text-sm"
                                    value={mercurySearchTerm}
                                    onChange={(e) => setMercurySearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearchMercury()}
                                />
                                <button
                                    onClick={handleSearchMercury}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm font-medium"
                                    title="Buscar na Mercury Marine"
                                >
                                    🔍 Buscar
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Produto</label>
                                <input className="w-full p-2 border rounded bg-white text-slate-900" value={newPart.name || ''} onChange={e => setNewPart({ ...newPart, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Código SKU</label>
                                <input className="w-full p-2 border rounded bg-white text-slate-900" value={newPart.sku || ''} onChange={e => setNewPart({ ...newPart, sku: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Código de Barras (EAN)</label>
                                <input className="w-full p-2 border rounded bg-white text-slate-900" value={newPart.barcode || ''} onChange={e => setNewPart({ ...newPart, barcode: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Custo (R$)</label>
                                <input type="number" className="w-full p-2 border rounded bg-white text-slate-900" value={newPart.cost || ''} onChange={e => setNewPart({ ...newPart, cost: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Preço Venda (R$)</label>
                                <input type="number" className="w-full p-2 border rounded bg-white text-slate-900" value={newPart.price || ''} onChange={e => setNewPart({ ...newPart, price: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Estoque Inicial</label>
                                <input type="number" className="w-full p-2 border rounded bg-white text-slate-900" value={newPart.quantity || ''} onChange={e => setNewPart({ ...newPart, quantity: Number(e.target.value) })} disabled={!!newPart.id} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Estoque Mínimo</label>
                                <input type="number" className="w-full p-2 border rounded bg-white text-slate-900" value={newPart.minStock || ''} onChange={e => setNewPart({ ...newPart, minStock: Number(e.target.value) })} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Localização (Prateleira)</label>
                                <input className="w-full p-2 border rounded bg-white text-slate-900" value={newPart.location || ''} onChange={e => setNewPart({ ...newPart, location: e.target.value })} />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setIsPartModalOpen(false)} className="px-4 py-2 text-slate-600 border rounded hover:bg-slate-50">Cancelar</button>
                            <button onClick={handleSavePart} className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 font-bold">Salvar Item</button>
                        </div>
                    </div>
                </div>
            )}

            {isPurchaseModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-amber-600" /> Lista de Compras Sugerida
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">Itens abaixo do estoque mínimo.</p>

                        <table className="w-full text-left text-sm mb-6">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="p-2">Produto</th>
                                    <th className="p-2 text-center">Atual</th>
                                    <th className="p-2 text-center">Mínimo</th>
                                    <th className="p-2 text-center">Sugestão Compra</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {lowStockItems.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">Estoque saudável. Nada a comprar.</td></tr>}
                                {lowStockItems.map(p => (
                                    <tr key={p.id}>
                                        <td className="p-2 font-medium">{p.name}</td>
                                        <td className="p-2 text-center text-red-600 font-bold">{p.quantity}</td>
                                        <td className="p-2 text-center">{p.minStock}</td>
                                        <td className="p-2 text-center font-bold">{(p.minStock - p.quantity) + 5}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => window.print()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex items-center gap-2">
                                <Printer className="w-4 h-4" /> Imprimir Lista
                            </button>
                            <button onClick={() => setIsPurchaseModalOpen(false)} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};