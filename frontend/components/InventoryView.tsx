import React, { useState, useEffect, useRef } from 'react';
import { Part, Invoice, InvoiceItem, StockMovement } from '../types';
import { StorageService } from '../services/storage';
import {
    Plus, Search, AlertTriangle, ShoppingCart, UploadCloud, FileText,
    Barcode, CheckCircle, Package, History, ArrowRight, Printer, Camera, X, RefreshCw
} from 'lucide-react';
import { ApiService } from '../services/api';

// Declaration for the external library loaded via script tag/importmap
declare const Html5QrcodeScanner: any;

export const InventoryView: React.FC = () => {
    const [parts, setParts] = useState<Part[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Tabs: 'overview', 'entry', 'count', 'kardex'
    const [activeTab, setActiveTab] = useState('overview');

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isPartModalOpen, setIsPartModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);

    // Forms Data
    const [newPart, setNewPart] = useState<Partial<Part>>({});
    const [editingPart, setEditingPart] = useState<Part | null>(null);
    const [bulkMarkup, setBulkMarkup] = useState<number>(60); // Default 60%

    // Invoice Entry State
    const [invoiceForm, setInvoiceForm] = useState<Partial<Invoice>>({ items: [] });

    // Inventory Count State
    const [inventoryCounts, setInventoryCounts] = useState<Record<string, number>>({});

    // Mercury Search State
    const [isMercuryModalOpen, setIsMercuryModalOpen] = useState(false);
    const [mercurySearchTerm, setMercurySearchTerm] = useState('');
    const [mercuryResults, setMercuryResults] = useState<any[]>([]);
    const [isLoadingMercury, setIsLoadingMercury] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Initialize Scanner when modal opens
    useEffect(() => {
        let scanner: any = null;

        if (isCameraOpen && typeof Html5QrcodeScanner !== 'undefined') {
            scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
            );

            scanner.render(
                (decodedText: string) => {
                    setSearchTerm(decodedText);
                    setIsCameraOpen(false);
                    scanner.clear();
                },
                (error: any) => {
                    // Ignore errors during scanning
                }
            );
        }

        return () => {
            if (scanner) {
                try { scanner.clear(); } catch (e) { /* ignore cleanup errors */ }
            }
        };
    }, [isCameraOpen]);

    const loadData = () => {
        setParts(StorageService.getInventory());
        setMovements(StorageService.getMovements());
        setInvoices(StorageService.getInvoices());
    };

    // --- XML PARSER LOGIC ---
    const handleXmlUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "text/xml");

                // Extract NFe Data (Basic extraction based on standard NFe layout)
                const number = xmlDoc.getElementsByTagName('nNF')[0]?.textContent || '';
                const supplier = xmlDoc.getElementsByTagName('xNome')[0]?.textContent || '';
                const date = xmlDoc.getElementsByTagName('dhEmi')[0]?.textContent?.split('T')[0] || new Date().toISOString().split('T')[0];

                // Extract Items
                const detNodes = xmlDoc.getElementsByTagName('det');
                const items: InvoiceItem[] = [];

                for (let i = 0; i < detNodes.length; i++) {
                    const prod = detNodes[i].getElementsByTagName('prod')[0];
                    const sku = prod.getElementsByTagName('cProd')[0]?.textContent || '';
                    const name = prod.getElementsByTagName('xProd')[0]?.textContent || '';
                    const qCom = parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || '0');
                    const vUnCom = parseFloat(prod.getElementsByTagName('vUnCom')[0]?.textContent || '0');

                    // Try to find matching part in system
                    const existingPart = parts.find(p => p.sku === sku || p.barcode === sku);

                    items.push({
                        sku,
                        name,
                        quantity: qCom,
                        unitCost: vUnCom,
                        total: qCom * vUnCom,
                        partId: existingPart ? existingPart.id : undefined // Link if found
                    });
                }

                const totalValue = items.reduce((acc, curr) => acc + curr.total, 0);

                setInvoiceForm({
                    number,
                    supplier,
                    date,
                    items,
                    totalValue,
                    xmlKey: 'IMPORTED_FROM_XML'
                });

                alert(`XML Importado com sucesso! ${items.length} itens encontrados. Verifique a associação dos produtos.`);

            } catch (error) {
                alert("Erro ao ler XML. Verifique se é uma NFe válida.");
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    const handleInvoiceSubmit = () => {
        if (!invoiceForm.number || !invoiceForm.supplier || !invoiceForm.items?.length) {
            alert("Preencha os dados obrigatórios da nota.");
            return;
        }

        // Check if all items are linked to a system part
        const unlinkedItems = invoiceForm.items.filter(i => !i.partId);
        if (unlinkedItems.length > 0) {
            if (!window.confirm(`Existem ${unlinkedItems.length} itens não vinculados ao cadastro de produtos. Eles serão ignorados no estoque. Deseja continuar?`)) {
                return;
            }
        }

        const invoice: Invoice = {
            id: Date.now().toString(),
            number: invoiceForm.number,
            supplier: invoiceForm.supplier,
            date: invoiceForm.date || new Date().toISOString(),
            items: invoiceForm.items,
            totalValue: invoiceForm.items.reduce((acc, curr) => acc + curr.total, 0),
            importedAt: new Date().toISOString()
        };

        StorageService.processInvoice(invoice, 'Admin'); // Hardcoded user for now
        loadData();
        setInvoiceForm({ items: [] });
        setActiveTab('overview');
        alert("Nota fiscal processada! Estoque atualizado.");
    };

    const linkItemToPart = (index: number, partId: string) => {
        if (!invoiceForm.items) return;
        const newItems = [...invoiceForm.items];
        newItems[index].partId = partId;
        setInvoiceForm({ ...invoiceForm, items: newItems });
    };

    // --- PART CRUD ---
    const handleSavePart = () => {
        if (!newPart.name || !newPart.sku || !newPart.price) return;

        const part: Part = {
            id: Date.now().toString(),
            name: newPart.name,
            sku: newPart.sku,
            barcode: newPart.barcode,
            quantity: newPart.quantity || 0,
            cost: newPart.cost || 0,
            price: newPart.price,
            minStock: newPart.minStock || 0,
            location: newPart.location
        };

        const updated = [...parts, part];
        setParts(updated);
        StorageService.saveInventory(updated);
        setIsPartModalOpen(false);
        setNewPart({});
    };

    // --- INVENTORY COUNT LOGIC ---
    const handleInventoryFinish = () => {
        const adjustments: StockMovement[] = [];
        const updatedParts = [...parts];

        updatedParts.forEach(part => {
            const counted = inventoryCounts[part.id];
            if (counted !== undefined && counted !== part.quantity) {
                const diff = counted - part.quantity;
                part.quantity = counted; // Update Stock

                adjustments.push({
                    id: Date.now().toString() + Math.random(),
                    partId: part.id,
                    type: diff > 0 ? 'ADJUSTMENT_PLUS' : 'ADJUSTMENT_MINUS',
                    quantity: Math.abs(diff),
                    date: new Date().toISOString(),
                    description: 'Ajuste de Inventário Físico',
                    user: 'Admin'
                });
            }
        });

        if (adjustments.length > 0) {
            StorageService.saveInventory(updatedParts);
            const currentMovements = StorageService.getMovements();
            StorageService.saveMovements([...currentMovements, ...adjustments]);

            alert(`${adjustments.length} itens ajustados com sucesso.`);
            loadData();
            setInventoryCounts({});
            setActiveTab('overview');
        } else {
            alert("Nenhuma divergência encontrada.");
        }
    };

    // --- MERCURY INTEGRATION ---
    const parseCurrency = (value: string) => {
        if (!value) return 0;
        // Remove "R$", remove dots (thousands), replace comma with dot (decimal)
        return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
    };

    const handleMercurySearch = async (term: string) => {
        if (!term) return;
        setIsLoadingMercury(true);
        try {
            const response = await ApiService.searchMercuryProduct(term);
            if (response.status === 'success') {
                setMercuryResults(response.results);
            } else {
                setMercuryResults([]);
                alert('Nenhum resultado encontrado no portal Mercury.');
            }
        } catch (error) {
            console.error("Erro na busca Mercury:", error);
            alert("Erro ao buscar no portal Mercury. Verifique as credenciais ou a conexão.");
        } finally {
            setIsLoadingMercury(false);
        }
    };

    const handleUpdateFromMercury = (mercuryItem: any) => {
        // Find part by SKU/Code
        const existingPart = parts.find(p => p.sku === mercuryItem.codigo);

        if (existingPart) {
            if (window.confirm(`Deseja atualizar o preço da peça ${existingPart.name}?\nNovo Custo: ${mercuryItem.valorCusto}\nNova Venda: ${mercuryItem.valorVenda}`)) {
                const updatedPart = {
                    ...existingPart,
                    cost: parseCurrency(mercuryItem.valorCusto),
                    price: parseCurrency(mercuryItem.valorVenda)
                };
                const updatedParts = parts.map(p => p.id === existingPart.id ? updatedPart : p);
                setParts(updatedParts);
                StorageService.saveInventory(updatedParts);
                alert("Preços atualizados com sucesso!");
            }
        } else {
            // Open New Part Modal pre-filled
            setNewPart({
                sku: mercuryItem.codigo,
                name: mercuryItem.descricao,
                cost: parseCurrency(mercuryItem.valorCusto),
                price: parseCurrency(mercuryItem.valorVenda),
                quantity: 0,
                minStock: 1,
                barcode: '',
                location: ''
            });
            setIsMercuryModalOpen(false);
            setIsPartModalOpen(true);
        }
    };

    const autoFillFromMercury = async () => {
        if (!newPart.sku) {
            alert("Digite um SKU para pesquisar.");
            return;
        }
        setIsLoadingMercury(true);
        try {
            const response = await ApiService.searchMercuryProduct(newPart.sku);
            if (response.status === 'success' && response.results.length > 0) {
                // Take the first match or exact match
                const item = response.results[0];
                setNewPart({
                    ...newPart,
                    name: item.descricao,
                    cost: parseCurrency(item.valorCusto),
                    price: parseCurrency(item.valorVenda)
                });
                alert("Dados encontrados e preenchidos!");
            } else {
                alert("Peça não encontrada no portal Mercury.");
            }
        } catch (error) {
            alert("Erro ao buscar no portal Mercury.");
        } finally {
            setIsLoadingMercury(false);
        }
    };

    // --- EDIT PART ---
    const handleEditPart = (part: Part) => {
        setEditingPart({ ...part });
        setIsEditModalOpen(true);
    };

    const handleSaveEditedPart = () => {
        if (!editingPart) return;

        // Auto-apply markup if cost and price are equal
        let updatedPart = { ...editingPart };
        if (updatedPart.cost === updatedPart.price && updatedPart.cost > 0) {
            updatedPart.price = updatedPart.cost * 1.60; // 60% markup
        }

        const updatedParts = parts.map(p => p.id === updatedPart.id ? updatedPart : p);
        setParts(updatedParts);
        StorageService.saveInventory(updatedParts);
        setIsEditModalOpen(false);
        setEditingPart(null);
        alert("Peça atualizada com sucesso!");
    };

    // --- BULK PRICE UPDATE ---
    const handleBulkPriceUpdate = () => {
        if (!window.confirm(`Aplicar ${bulkMarkup}% de margem sobre o custo em TODAS as peças do estoque?`)) {
            return;
        }

        const updatedParts = parts.map(p => ({
            ...p,
            price: p.cost * (1 + bulkMarkup / 100)
        }));

        setParts(updatedParts);
        StorageService.saveInventory(updatedParts);
        setIsBulkPriceModalOpen(false);
        alert(`Preços atualizados! ${bulkMarkup}% de margem aplicada em ${parts.length} itens.`);
    };

    // --- SEARCH HELPERS ---
    const filteredParts = parts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.includes(searchTerm)
    );

    const lowStockItems = parts.filter(p => p.quantity <= p.minStock);

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="w-6 h-6 text-cyan-600" />
                        Controle de Estoque & Logística
                    </h2>
                    <p className="text-sm text-slate-500">Gestão de peças, entradas de notas e inventário.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsPurchaseModalOpen(true)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium border border-amber-200 text-sm"
                    >
                        <ShoppingCart className="w-4 h-4" /> Compras
                        {lowStockItems.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{lowStockItems.length}</span>}
                    </button>
                    <button
                        onClick={() => setIsPartModalOpen(true)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm"
                    >
                        <Plus className="w-4 h-4" /> Novo Item
                    </button>
                    <button
                        onClick={() => setIsMercuryModalOpen(true)}
                        className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm"
                    >
                        <RefreshCw className="w-4 h-4" /> Consulta Mercury
                    </button>
                    <button
                        onClick={() => setIsBulkPriceModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm"
                        title="Atualizar preços em massa"
                    >
                        <RefreshCw className="w-4 h-4" /> Atualizar Preços
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-lg overflow-x-auto">
                {[
                    { id: 'overview', label: 'Visão Geral', icon: Search },
                    { id: 'entry', label: 'Entrada de Nota (NFe)', icon: UploadCloud },
                    { id: 'count', label: 'Inventário / Balanço', icon: CheckCircle },
                    { id: 'kardex', label: 'Histórico (Kardex)', icon: History },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-cyan-500 text-cyan-700 bg-cyan-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 bg-white rounded-b-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

                {/* --- TAB: OVERVIEW --- */}
                {activeTab === 'overview' && (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50 items-center">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, SKU ou Código de Barras..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={() => setIsCameraOpen(true)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-2 rounded-lg"
                                title="Ler Código de Barras (Câmera)"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">SKU / Barcode</th>
                                        <th className="px-6 py-4">Descrição</th>
                                        <th className="px-6 py-4">Local</th>
                                        <th className="px-6 py-4 text-center">Estoque</th>
                                        <th className="px-6 py-4 text-right">Custo Médio</th>
                                        <th className="px-6 py-4 text-right">Venda</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredParts.map((part) => (
                                        <tr key={part.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                                                <div>{part.sku}</div>
                                                {part.barcode && <div className="text-[10px] flex items-center gap-1"><Barcode className="w-3 h-3" /> {part.barcode}</div>}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{part.name}</td>
                                            <td className="px-6 py-4 text-slate-600 text-xs">{part.location || '-'}</td>
                                            <td className="px-6 py-4 text-center font-bold">{part.quantity}</td>
                                            <td className="px-6 py-4 text-right text-slate-500">R$ {part.cost.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-900">R$ {part.price.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center">
                                                {part.quantity <= part.minStock ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                                        <AlertTriangle className="w-3 h-3" /> Baixo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                                        Normal
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleEditPart(part)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                                                >
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB: INVOICE ENTRY --- */}
                {activeTab === 'entry' && (
                    <div className="flex flex-col h-full p-6 overflow-y-auto">
                        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center mb-6">
                            <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-600 font-medium">Importar XML da Nota Fiscal</p>
                            <p className="text-xs text-slate-400 mb-4">Arraste o arquivo ou clique para selecionar</p>
                            <input
                                type="file"
                                accept=".xml"
                                className="hidden"
                                id="xmlUpload"
                                onChange={handleXmlUpload}
                            />
                            <label
                                htmlFor="xmlUpload"
                                className="bg-cyan-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-cyan-700 text-sm font-medium"
                            >
                                Selecionar Arquivo XML
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Número da Nota</label>
                                <input
                                    className="w-full p-2 border rounded bg-white text-slate-900"
                                    value={invoiceForm.number || ''}
                                    onChange={e => setInvoiceForm({ ...invoiceForm, number: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Fornecedor</label>
                                <input
                                    className="w-full p-2 border rounded bg-white text-slate-900"
                                    value={invoiceForm.supplier || ''}
                                    onChange={e => setInvoiceForm({ ...invoiceForm, supplier: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Data Emissão</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded bg-white text-slate-900"
                                    value={invoiceForm.date || ''}
                                    onChange={e => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <h3 className="font-bold text-slate-700 mb-2">Itens da Nota</h3>
                        <div className="border rounded-lg overflow-hidden mb-6">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="p-3">Código (NF)</th>
                                        <th className="p-3">Produto (Descrição na Nota)</th>
                                        <th className="p-3 text-right">Qtd</th>
                                        <th className="p-3 text-right">V. Unit</th>
                                        <th className="p-3 text-right">Total</th>
                                        <th className="p-3">Vincular ao Produto do Sistema</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoiceForm.items?.map((item, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="p-3 font-mono text-xs">{item.sku}</td>
                                            <td className="p-3">{item.name}</td>
                                            <td className="p-3 text-right">{item.quantity}</td>
                                            <td className="p-3 text-right">R$ {item.unitCost.toFixed(2)}</td>
                                            <td className="p-3 text-right font-bold">R$ {item.total.toFixed(2)}</td>
                                            <td className="p-3">
                                                <select
                                                    className={`w-full p-1.5 border rounded text-xs bg-white text-slate-900 ${!item.partId ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}
                                                    value={item.partId || ''}
                                                    onChange={(e) => linkItemToPart(idx, e.target.value)}
                                                >
                                                    <option value="">-- Selecione ou Cadastre --</option>
                                                    {parts.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!invoiceForm.items || invoiceForm.items.length === 0) && (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhum item adicionado. Importe um XML ou adicione manualmente.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setInvoiceForm({ items: [] })} className="px-4 py-2 text-slate-600 border rounded hover:bg-slate-50">Limpar</button>
                            <button onClick={handleInvoiceSubmit} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold shadow">
                                Processar Entrada de Estoque
                            </button>
                        </div>
                    </div>
                )}

                {/* --- TAB: INVENTORY COUNT --- */}
                {activeTab === 'count' && (
                    <div className="flex flex-col h-full">
                        <div className="p-4 bg-amber-50 border-b border-amber-100 text-amber-900 text-sm flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                <span>Modo Balanço: As alterações aqui ajustarão o estoque imediatamente.</span>
                            </div>
                            <button
                                onClick={handleInventoryFinish}
                                className="bg-amber-600 text-white px-4 py-2 rounded font-bold hover:bg-amber-700"
                            >
                                Finalizar Balanço
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">Produto</th>
                                        <th className="px-6 py-4">Local</th>
                                        <th className="px-6 py-4 text-center">Estoque Sistema</th>
                                        <th className="px-6 py-4 text-center">Contagem Física</th>
                                        <th className="px-6 py-4 text-center">Diferença</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {parts.map(part => {
                                        const counted = inventoryCounts[part.id] ?? part.quantity;
                                        const diff = counted - part.quantity;
                                        return (
                                            <tr key={part.id} className={diff !== 0 ? 'bg-red-50' : ''}>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold">{part.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{part.sku}</div>
                                                </td>
                                                <td className="px-6 py-4 text-xs">{part.location}</td>
                                                <td className="px-6 py-4 text-center font-medium text-slate-500">{part.quantity}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <input
                                                        type="number"
                                                        className="w-20 p-1 border rounded text-center font-bold bg-white text-slate-900"
                                                        value={counted}
                                                        onChange={(e) => setInventoryCounts({ ...inventoryCounts, [part.id]: Number(e.target.value) })}
                                                    />
                                                </td>
                                                <td className={`px-6 py-4 text-center font-bold ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                                                    {diff > 0 ? '+' : ''}{diff}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB: KARDEX --- */}
                {activeTab === 'kardex' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">Data/Hora</th>
                                        <th className="px-6 py-4">Produto</th>
                                        <th className="px-6 py-4">Tipo Movimento</th>
                                        <th className="px-6 py-4">Histórico</th>
                                        <th className="px-6 py-4 text-right">Qtd</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {movements.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma movimentação registrada.</td></tr>}
                                    {[...movements].reverse().map(mov => { // Show newest first
                                        const part = parts.find(p => p.id === mov.partId);
                                        return (
                                            <tr key={mov.id}>
                                                <td className="px-6 py-4 text-xs text-slate-500">
                                                    {new Date(mov.date).toLocaleString('pt-BR')}
                                                </td>
                                                <td className="px-6 py-4 font-medium">{part?.name || 'Item Excluído'}</td>
                                                <td className="px-6 py-4 text-xs">
                                                    <span className={`px-2 py-1 rounded-full font-bold ${mov.type.includes('IN') || mov.type === 'ADJUSTMENT_PLUS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {mov.type === 'IN_INVOICE' ? 'ENTRADA (NF)' :
                                                            mov.type === 'OUT_OS' ? 'SAÍDA (OS)' :
                                                                mov.type === 'ADJUSTMENT_PLUS' ? 'AJUSTE (+)' : 'AJUSTE (-)'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-xs">{mov.description} <span className="text-slate-400">({mov.user})</span></td>
                                                <td className="px-6 py-4 text-right font-mono font-bold">
                                                    {mov.type.includes('OUT') || mov.type.includes('MINUS') ? '-' : '+'}{mov.quantity}
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

            {/* --- MODALS --- */}

            {/* Camera/Barcode Modal */}
            {
                isCameraOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
                            <Camera className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Ler Código de Barras</h3>

                            {/* HTML5 QR Code Render Area */}
                            <div id="reader" className="w-full mb-4 bg-slate-100 rounded"></div>

                            <input
                                type="text"
                                placeholder="Ou digite manualmente..."
                                className="w-full p-2 border rounded mb-4 bg-white text-slate-900"
                                autoFocus
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                }}
                            />
                            <button onClick={() => setIsCameraOpen(false)} className="w-full bg-slate-200 p-2 rounded text-slate-700">Fechar</button>
                        </div>
                    </div>
                )
            }

            {/* Purchase Order Modal */}
            {
                isPurchaseModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Sugestão de Pedido de Compra</h3>
                            <p className="text-sm text-slate-500 mb-4">Itens abaixo do estoque mínimo que precisam de reposição.</p>

                            <div className="max-h-96 overflow-y-auto border rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="p-3">SKU</th>
                                            <th className="p-3">Produto</th>
                                            <th className="p-3 text-center">Atual</th>
                                            <th className="p-3 text-center">Mínimo</th>
                                            <th className="p-3 text-right">Sugestão Compra</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowStockItems.map(p => (
                                            <tr key={p.id} className="border-b">
                                                <td className="p-3 font-mono text-xs">{p.sku}</td>
                                                <td className="p-3">{p.name}</td>
                                                <td className="p-3 text-center text-red-600 font-bold">{p.quantity}</td>
                                                <td className="p-3 text-center">{p.minStock}</td>
                                                <td className="p-3 text-right font-bold text-blue-600">
                                                    {Math.max(10, p.minStock * 2) - p.quantity} un
                                                </td>
                                            </tr>
                                        ))}
                                        {lowStockItems.length === 0 && (
                                            <tr><td colSpan={5} className="p-6 text-center text-green-600 font-medium">Estoque saudável! Nada a comprar.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={() => setIsPurchaseModalOpen(false)} className="px-4 py-2 border rounded hover:bg-slate-50 text-slate-900 bg-white">Fechar</button>
                                <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 flex items-center gap-2">
                                    <Printer className="w-4 h-4" /> Imprimir Lista
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* New Part Modal */}
            {
                isPartModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
                            <h3 className="text-lg font-bold mb-4">Cadastrar Nova Peça</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Nome da Peça</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded bg-white text-slate-900"
                                        value={newPart.name || ''}
                                        onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">SKU (Código Interno)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 p-2 border rounded bg-white text-slate-900"
                                            value={newPart.sku || ''}
                                            onChange={e => setNewPart({ ...newPart, sku: e.target.value })}
                                            onBlur={() => { }} // Optional: auto search on blur? better explicit button
                                            placeholder="Ex: 8M000000"
                                        />
                                        <button
                                            onClick={autoFillFromMercury}
                                            disabled={isLoadingMercury || !newPart.sku}
                                            className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                            title="Buscar dados no Mercury"
                                        >
                                            {isLoadingMercury ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Código de Barras (EAN)</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded bg-white text-slate-900"
                                        value={newPart.barcode || ''}
                                        onChange={e => setNewPart({ ...newPart, barcode: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Qtd. Inicial</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded bg-white text-slate-900"
                                        value={newPart.quantity || ''}
                                        onChange={e => setNewPart({ ...newPart, quantity: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Localização (Estante)</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded bg-white text-slate-900"
                                        value={newPart.location || ''}
                                        onChange={e => setNewPart({ ...newPart, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Preço Custo</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded bg-white text-slate-900"
                                        value={newPart.cost || ''}
                                        onChange={e => setNewPart({ ...newPart, cost: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Preço Venda</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded bg-white text-slate-900"
                                        value={newPart.price || ''}
                                        onChange={e => setNewPart({ ...newPart, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded bg-white text-slate-900"
                                        value={newPart.minStock || ''}
                                        onChange={e => setNewPart({ ...newPart, minStock: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsPartModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSavePart}
                                    className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
                                >
                                    Salvar Peça
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Mercury Search Modal */}
            {
                isMercuryModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-xl h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <RefreshCw className="w-6 h-6 text-slate-800" />
                                    Consulta Portal Mercury
                                </h3>
                                <button onClick={() => setIsMercuryModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    className="flex-1 p-3 border rounded-lg bg-white text-slate-900 focus:ring-2 ring-cyan-500 outline-none"
                                    placeholder="Digite o código da peça (Ex: 8M0123456)..."
                                    value={mercurySearchTerm}
                                    onChange={(e) => setMercurySearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleMercurySearch(mercurySearchTerm)}
                                />
                                <button
                                    onClick={() => handleMercurySearch(mercurySearchTerm)}
                                    disabled={isLoadingMercury}
                                    className="bg-cyan-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isLoadingMercury ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                    Pesquisar
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto border rounded-lg">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="p-4">Código</th>
                                            <th className="p-4">Descrição</th>
                                            <th className="p-4 text-center">Disp. Mercury</th>
                                            <th className="p-4 text-right">Custo Mercury</th>
                                            <th className="p-4 text-right">Venda Tabelada</th>
                                            <th className="p-4 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {mercuryResults.map((item, idx) => {
                                            const inStock = parts.some(p => p.sku === item.codigo);
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="p-4 font-mono font-bold text-slate-700">{item.codigo}</td>
                                                    <td className="p-4">{item.descricao}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.qtdaEst.includes('+') ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {item.qtdaEst}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right text-slate-600">{item.valorCusto}</td>
                                                    <td className="p-4 text-right font-medium">{item.valorVenda}</td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => handleUpdateFromMercury(item)}
                                                            className={`px-3 py-1.5 rounded text-xs font-bold shadow-sm transition-colors ${inStock
                                                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'
                                                                : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                                                                }`}
                                                        >
                                                            {inStock ? 'Atualizar Estoque' : 'Cadastrar Peça'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {mercuryResults.length === 0 && !isLoadingMercury && (
                                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">Nenhum resultado para exibir.</td></tr>
                                        )}
                                        {isLoadingMercury && (
                                            <tr><td colSpan={6} className="p-12 text-center text-slate-500">Buscando informações no portal...</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Part Modal */}
            {isEditModalOpen && editingPart && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Editar Peça: {editingPart.name}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded bg-white text-slate-900"
                                    value={editingPart.name}
                                    onChange={e => setEditingPart({ ...editingPart, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Custo (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2 border rounded bg-white text-slate-900"
                                    value={editingPart.cost}
                                    onChange={e => {
                                        const newCost = parseFloat(e.target.value) || 0;
                                        setEditingPart({ ...editingPart, cost: newCost });
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Preço Venda (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2 border rounded bg-white text-slate-900"
                                    value={editingPart.price}
                                    onChange={e => setEditingPart({ ...editingPart, price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="col-span-2 bg-blue-50 p-3 rounded text-sm text-blue-800">
                                <strong>💡 Dica:</strong> Se custo e preço forem iguais, será aplicado +60% automaticamente no preço.
                                <div className="mt-1 text-xs">
                                    Markup Atual: <strong>{editingPart.cost > 0 ? ((editingPart.price / editingPart.cost - 1) * 100).toFixed(0) : '0'}%</strong>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingPart(null);
                                }}
                                className="flex-1 px-4 py-2 border rounded hover:bg-slate-50 text-slate-900"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEditedPart}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Price Update Modal */}
            {isBulkPriceModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold mb-4 text-green-700">💰 Atualizar Preços em Massa</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Aplique uma margem de lucro sobre o custo de todas as peças do estoque de uma vez.
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-medium text-slate-700 mb-2">
                                Margem de Lucro (%)
                            </label>
                            <input
                                type="number"
                                step="1"
                                className="w-full p-3 border rounded bg-white text-slate-900 text-lg font-bold"
                                value={bulkMarkup}
                                onChange={e => setBulkMarkup(parseFloat(e.target.value) || 0)}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Exemplo: 60% significa que uma peça de custo R$ 100 será vendida por R$ 160
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm text-amber-900 mb-4">
                            <strong>⚠️ Atenção:</strong> Esta ação irá modificar o preço de venda de <strong>{parts.length} peças</strong>.
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsBulkPriceModalOpen(false)}
                                className="flex-1 px-4 py-2 border rounded hover:bg-slate-50 text-slate-900"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBulkPriceUpdate}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
                            >
                                Aplicar Margem
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};