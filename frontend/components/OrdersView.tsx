import React, { useState, useEffect } from 'react';
import { useCallback } from 'react';
import {
    ServiceOrder, UserRole, OSStatus, Boat, Part, ServiceItemCreate,
    ItemType, ServiceOrderCreate, Client
} from '../types';
import { ApiService } from '../services/api';
import {
    Wrench, Plus, Search, Filter, Clock, CheckCircle, AlertCircle,
    FileText, DollarSign, Calendar, User, Ship, Settings, ChevronRight,
    Printer, Save, X, Trash2, Image as ImageIcon, MessageSquare, Camera,
    ChevronLeft, ArrowRight
} from 'lucide-react';
import { ScannerModal } from './ScannerModal';
import { FiscalSelectionModal } from './FiscalSelectionModal'; // [NEW]

import { FiscalDataPayload } from '../types'; // [NEW]

interface OrdersViewProps {
    role: UserRole;
    onNavigateToFiscal?: (data: FiscalDataPayload) => void; // [NEW]
}

export const OrdersView: React.FC<OrdersViewProps> = ({ role, onNavigateToFiscal }) => {
    // --- ESTADOS ---
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [boats, setBoats] = useState<Boat[]>([]);
    const [parts, setParts] = useState<Part[]>([]);
    const [clients, setClients] = useState<Client[]>([]); // [NEW]

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Add Item Modal State
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [itemSearchTerm, setItemSearchTerm] = useState('');
    const [newItem, setNewItem] = useState<Partial<ServiceItemCreate>>({
        type: ItemType.PART,
        quantity: 1,
        unitPrice: 0,
        unitCost: 0,
        description: ''
    });

    // Fiscal Modal State
    const [isFiscalModalOpen, setIsFiscalModalOpen] = useState(false);

    const isTechnician = role === UserRole.TECHNICIAN;
    const isClient = role === UserRole.CLIENT;

    // --- CARREGAMENTO DE DADOS ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [ordersData, boatsData, partsData, clientsData] = await Promise.all([
                ApiService.getOrders(),
                ApiService.getBoats(),
                ApiService.getParts(),
                ApiService.getClients() // [NEW]
            ]);
            setOrders(Array.isArray(ordersData) ? ordersData : []);
            setBoats(boatsData);
            setParts(partsData);
            setClients(clientsData); // [NEW]
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Erro ao carregar dados. Verifique a conexão.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- AÇÕES ---
    const handleCreateOrder = async (boatId: string, description: string, duration: number) => {
        setIsSaving(true);
        try {
            const newOrder: ServiceOrderCreate = {
                boatId: parseInt(boatId),
                description,
                estimatedDuration: duration,
                status: OSStatus.PENDING,
                diagnosis: ''
            };
            await ApiService.createOrder(newOrder);
            await loadData(); // Recarrega lista
            setIsCreating(false);
        } catch (error) {
            console.error("Erro ao criar OS:", error);
            alert("Erro ao criar ordem de serviço.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusChange = async (orderId: number, newStatus: OSStatus) => {
        try {
            await ApiService.updateOrder(orderId, { status: newStatus });
            // Atualiza localmente para feedback rápido
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status.");
        }
    };

    const handleSearchMercury = async () => {
        if (!itemSearchTerm) {
            alert('Digite um código para buscar na Mercury');
            return;
        }

        try {
            const result = await ApiService.searchMercuryProduct(itemSearchTerm);
            if (result.status === 'success' && result.results.length > 0) {
                const mercuryItem = result.results[0];
                setNewItem({
                    ...newItem,
                    description: mercuryItem.descricao,
                    unitPrice: parseFloat(mercuryItem.valorVenda.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0,
                    unitCost: parseFloat(mercuryItem.valorCusto.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0
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

    const handlePrint = useCallback(() => {
        const printable = document.getElementById('printable-order');
        if (!printable) return;

        const newWin = window.open('', '_blank');
        if (!newWin) return;

        // Get all stylesheets from current document to replicate styling
        const styles = Array.from(document.styleSheets)
            .map(styleSheet => {
                try {
                    return Array.from(styleSheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('');
                } catch (e) {
                    return '';
                }
            })
            .join('\n');

        newWin.document.write(`
            <!doctype html>
            <html>
            <head>
                <title>Ordem #${selectedOrder?.id}</title>
                <style>
                    ${styles}
                    body { font-family: sans-serif; margin: 0; padding: 2rem; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @media print { 
                        .no-print { display: none !important; } 
                        body { padding: 0; }
                    }
                </style>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body>
                ${printable.innerHTML}
                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        newWin.document.close();
    }, [selectedOrder]);

    const handleAddItem = async (orderId: number, item: ServiceItemCreate) => {
        try {
            const updatedOrder = await ApiService.addOrderItem(orderId, item);
            setSelectedOrder(updatedOrder);
            // Atualiza na lista principal também
            setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        } catch (error) {
            console.error("Erro ao adicionar item:", error);
            alert("Erro ao adicionar item.");
        }
    };

    const handleAddNote = async (orderId: number, text: string) => {
        try {
            await ApiService.addOrderNote(orderId, { text });
            // Recarrega ordem para pegar a nota com ID e data corretos
            const updatedOrder = await ApiService.getOrder(orderId);
            setSelectedOrder(updatedOrder);
        } catch (error) {
            console.error("Erro ao adicionar nota:", error);
            alert("Erro ao adicionar nota.");
        }
    };

    const handleScan = (decodedText: string) => {
        setIsScannerOpen(false);
        setItemSearchTerm(decodedText);

        // Tenta encontrar a peça
        const part = parts.find(p => p.barcode === decodedText || p.sku === decodedText);
        if (part) {
            setNewItem({
                ...newItem,
                type: ItemType.PART,
                partId: part.id,
                description: part.name,
                unitPrice: part.price,
                unitCost: part.cost,
                quantity: 1
            });
        } else {
            alert(`Produto com código ${decodedText} não encontrado.`);
        }
    };

    const handleSearchPart = (term: string) => {
        setItemSearchTerm(term);
        const part = parts.find(p => p.barcode === term || p.sku === term);
        if (part) {
            setNewItem({
                ...newItem,
                type: ItemType.PART,
                partId: part.id,
                description: part.name,
                unitPrice: part.price,
                unitCost: part.cost,
                quantity: 1
            });
        }
    };

    const handleDeleteItem = (itemId: number) => {
        alert('Funcionalidade de exclusão de item ainda não implementada no backend.');
        // TODO: Implement API call to delete item
    };

    const handleSaveItem = async () => {
        if (!selectedOrder || !newItem.description || !newItem.unitPrice) {
            alert("Preencha descrição e preço.");
            return;
        }

        try {
            const itemToCreate: ServiceItemCreate = {
                type: newItem.type || ItemType.PART,
                description: newItem.description,
                quantity: newItem.quantity || 1,
                unitPrice: newItem.unitPrice,
                unitCost: newItem.unitCost || 0,
                total: (newItem.quantity || 1) * newItem.unitPrice,
                partId: newItem.partId
            };

            await handleAddItem(selectedOrder.id, itemToCreate);
            setIsAddItemModalOpen(false);
            setNewItem({
                type: ItemType.PART,
                quantity: 1,
                unitPrice: 0,
                unitCost: 0,
                description: ''
            });
        } catch (error) {
            console.error("Erro ao salvar item:", error);
            alert("Erro ao salvar item.");
        }
    };

    // --- RENDERIZAÇÃO ---

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    // --- DETAIL VIEW ---
    if (selectedOrder) {
        const boat = boats.find(b => b.id === selectedOrder.boatId);
        const orderTotal = selectedOrder.totalValue || 0;

        return (
            <div id="printable-order" className="flex flex-col h-full bg-slate-50">
                {/* Header Detalhes */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ChevronLeft className="w-6 h-6 text-slate-400" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-slate-800">OS #{selectedOrder.id}</h2>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedOrder.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                                    selectedOrder.status === OSStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {selectedOrder.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <Ship className="w-4 h-4" />
                                <span>{boat?.name || 'Embarcação Desconhecida'}</span>
                                <span className="mx-2">•</span>
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {!isClient && (
                            <>
                                {/* [NEW] Botão Fiscal */}
                                {onNavigateToFiscal && (
                                    <button
                                        onClick={() => {
                                            if (!selectedOrder) return;
                                            setIsFiscalModalOpen(true);
                                        }}
                                        className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                        title="Emitir Nota Fiscal"
                                    >
                                        <FileText className="w-5 h-5" />
                                    </button>
                                )}

                                <button onClick={handlePrint} className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors" title="Imprimir">
                                    <Printer className="w-5 h-5" />
                                </button>
                                {selectedOrder.status !== OSStatus.COMPLETED && (
                                    <button
                                        onClick={() => handleStatusChange(selectedOrder.id, OSStatus.COMPLETED)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Concluir OS
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 print:overflow-visible print:h-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Coluna Esquerda: Informações e Diagnóstico */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Card Descrição */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-cyan-600" /> Descrição do Problema
                                </h3>
                                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    {selectedOrder.description}
                                </p>
                            </div>

                            {/* Card Itens (Peças e Serviços) */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Wrench className="w-5 h-5 text-cyan-600" /> Peças e Serviços
                                    </h3>
                                    {!isClient && selectedOrder.status !== OSStatus.COMPLETED && (
                                        <button onClick={() => {
                                            setItemSearchTerm('');
                                            setIsAddItemModalOpen(true);
                                        }} className="text-sm text-cyan-600 font-bold hover:underline flex items-center gap-1">
                                            <Plus className="w-4 h-4" /> Adicionar Item
                                        </button>
                                    )}
                                </div>

                                <div className="overflow-hidden rounded-lg border border-slate-100">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                <th className="px-4 py-3">Descrição</th>
                                                <th className="px-4 py-3 text-center">Qtd</th>
                                                <th className="px-4 py-3 text-right">Unitário</th>
                                                <th className="px-4 py-3 text-right">Total</th>
                                                {!isClient && <th className="px-4 py-3 w-10"></th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedOrder.items?.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-slate-800">{item.description}</div>
                                                        <div className="text-xs text-slate-400">{item.type === 'PART' ? 'Peça' : 'Serviço'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-700">R$ {item.total.toFixed(2)}</td>
                                                    {!isClient && (
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                                title="Excluir Item"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                            {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                                                        Nenhum item adicionado.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-slate-50 font-bold text-slate-800">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-right">Total Geral:</td>
                                                <td className="px-4 py-3 text-right text-cyan-700">R$ {orderTotal.toFixed(2)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Coluna Direita: Status e Notas */}
                        <div className="space-y-6">
                            {/* Card Status */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4">Status da Ordem</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="text-sm text-slate-600">Criado em</span>
                                        <span className="text-sm font-medium text-slate-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="text-sm text-slate-600">Técnico</span>
                                        <span className="text-sm font-medium text-slate-900">{selectedOrder.technicianName || 'Não atribuído'}</span>
                                    </div>
                                    {!isClient && (
                                        <div className="pt-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Alterar Status</label>
                                            <select
                                                value={selectedOrder.status}
                                                onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OSStatus)}
                                                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-sm"
                                            >
                                                {Object.values(OSStatus).map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card Notas */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-96">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-cyan-600" /> Notas e Observações
                                </h3>
                                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                                    {selectedOrder.notes?.map((note: any) => (
                                        <div key={note.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                                            <p className="text-slate-700 mb-1">{note.text}</p>
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>{note.userName || 'Sistema'}</span>
                                                <span>{new Date(note.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedOrder.notes || selectedOrder.notes.length === 0) && (
                                        <p className="text-center text-slate-400 italic text-sm mt-10">Nenhuma nota registrada.</p>
                                    )}
                                </div>
                                {!isClient && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Adicionar nota..."
                                            className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddNote(selectedOrder.id, e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                        <button className="p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {isAddItemModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
                            <h3 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Adicionar Item</h3>
                            <div className="space-y-4">
                            </div>

                            {newItem.type === ItemType.PART && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Buscar por Código / SKU</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Digite SKU ou Código de Barras..."
                                            className="flex-1 p-2 border border-slate-300 rounded bg-white text-sm"
                                            value={itemSearchTerm}
                                            onChange={(e) => handleSearchPart(e.target.value)}
                                        />
                                        <button
                                            onClick={() => setIsScannerOpen(true)}
                                            className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors"
                                            title="Ler Código de Barras"
                                        >
                                            <Camera className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleSearchMercury}
                                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm font-medium"
                                            title="Buscar na Mercury Marine"
                                        >
                                            🔍 Mercury
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tipo</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="itemType"
                                            checked={newItem.type === ItemType.PART}
                                            onChange={() => setNewItem({ ...newItem, type: ItemType.PART })}
                                        />
                                        <span>Peça</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="itemType"
                                            checked={newItem.type === ItemType.LABOR}
                                            onChange={() => setNewItem({ ...newItem, type: ItemType.LABOR })}
                                        />
                                        <span>Serviço / Mão de Obra</span>
                                    </label>
                                </div>
                            </div>

                            {newItem.type === ItemType.PART && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Selecionar Peça do Estoque</label>
                                    <select
                                        className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none"
                                        value={newItem.partId || ''}
                                        onChange={(e) => {
                                            const part = parts.find(p => p.id === Number(e.target.value));
                                            if (part) {
                                                setNewItem({
                                                    ...newItem,
                                                    partId: part.id,
                                                    description: part.name,
                                                    unitPrice: part.price,
                                                    unitCost: part.cost
                                                });
                                            }
                                        }}
                                    >                   <option value="">Selecione...</option>
                                        {parts.filter(p => p.name.toLowerCase().includes(itemSearchTerm.toLowerCase())).map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (Estoque: {p.quantity})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Descrição</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none"
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Quantidade</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none"
                                        value={newItem.quantity}
                                        min="0.1"
                                        step="0.1"
                                        onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Preço Unitário (R$)</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none"
                                        value={newItem.unitPrice}
                                        min="0"
                                        step="0.01"
                                        onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg text-right">
                                <span className="text-sm text-slate-500">Total Estimado:</span>
                                <span className="ml-2 text-xl font-bold text-cyan-700">
                                    R$ {((newItem.quantity || 0) * (newItem.unitPrice || 0)).toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button onClick={() => setIsAddItemModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                                <button onClick={handleSaveItem} className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-bold shadow-lg shadow-cyan-200 transition-all transform active:scale-95">
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScan={handleScan}
                />

                <FiscalSelectionModal
                    isOpen={isFiscalModalOpen}
                    onClose={() => setIsFiscalModalOpen(false)}
                    order={selectedOrder}
                    onConfirm={(data) => {
                        if (onNavigateToFiscal) {
                            onNavigateToFiscal(data);
                        }
                    }}
                    client={(() => {
                        const boat = boats.find(b => b.id === selectedOrder?.boatId);
                        const client = clients.find(c => c.id === boat?.clientId);
                        return client ? { name: client.name, doc: client.document } : undefined;
                    })()}
                />
            </div>
        );
    }

    // --- LIST VIEW ---
    const safeOrders = Array.isArray(orders) ? orders : [];
    const filteredOrders = safeOrders.filter(o =>
        (statusFilter === 'ALL' || o.status === statusFilter) &&
        (
            o.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.id.toString().includes(searchTerm) || // id is number now
            boats.find(b => b.id === o.boatId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-cyan-600" /> Ordens de Serviço
                    </h2>
                </div>
                {!isTechnician && !isClient && (
                    <button onClick={() => setIsCreating(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" /> Nova Ordem
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por ID, descrição ou barco..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="p-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Todos os Status</option>
                        {Object.values(OSStatus).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4">OS #</th>
                                <th className="px-6 py-4">Embarcação</th>
                                <th className="px-6 py-4">Descrição</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrders.map((order) => {
                                const boat = boats.find(b => b.id === order.boatId);
                                return (
                                    <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-cyan-50 cursor-pointer transition-colors group">
                                        <td className="px-6 py-4 font-mono font-bold text-slate-700 group-hover:text-cyan-700">#{order.id}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800">{boat?.name || 'Desconhecido'}</td>
                                        <td className="px-6 py-4 text-slate-600 truncate max-w-xs">{order.description}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                                                order.status === OSStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-400 text-xs font-mono">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                );
                            })}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Nenhuma ordem de serviço encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl transform transition-all">
                        <h3 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Nova Ordem de Serviço</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            handleCreateOrder(fd.get('boatId') as string, fd.get('description') as string, Number(fd.get('duration')));
                        }} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Embarcação</label>
                                <select name="boatId" className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none" required autoFocus>
                                    <option value="">Selecione uma embarcação...</option>
                                    {boats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Descrição do Serviço</label>
                                <textarea name="description" className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-900 h-32 focus:ring-2 focus:ring-cyan-500 outline-none resize-none" placeholder="Descreva o problema ou serviço solicitado..." required></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Duração Estimada (horas)</label>
                                <input type="number" name="duration" className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none" min="1" defaultValue="1" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-bold shadow-lg shadow-cyan-200 transition-all transform active:scale-95 flex items-center gap-2">
                                    {isSaving ? 'Criando...' : 'Criar OS'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
};
