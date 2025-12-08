import React, { useState, useEffect, useRef } from 'react';
import { ServiceOrder, OSStatus, Boat, Part, ServiceItem, UserRole, Client, Marina, ChecklistItem, AttachmentType, ServiceDefinition, ItemType } from '../types';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { GeminiService } from '../services/geminiService';
import {
    Plus, FileText, CheckCircle, Clock,
    BrainCircuit, Printer, Search, Ban, AlertOctagon,
    ArrowLeft,
    Wrench,
    Package,
    Lock,
    Unlock,
    DollarSign,
    MessageCircle,
    User,
    CheckSquare,
    Clipboard,
    AlertTriangle,
    Camera,
    Trash2,
    Pencil
} from 'lucide-react';

interface OrdersViewProps {
    role: UserRole;
    initialOrderId?: string | number;
}

const CHECKLIST_TEMPLATES = {
    'REVISAO_100': [
        'Troca de óleo do motor e filtro',
        'Troca de filtro de combustível',
        'Verificação de velas de ignição',
        'Inspeção do rotor da bomba d\'água',
        'Verificação do nível de óleo da rabeta',
        'Lubrificação dos pontos de graxa',
        'Inspeção de anodos de sacrifício',
        'Teste de funcionamento do Power Trim',
        'Verificação de vazamentos',
        'Leitura de falhas no scanner'
    ],
    'ENTREGA_TECNICA': [
        'Conferência de itens de segurança',
        'Teste de partida',
        'Verificação de instrumentos do painel',
        'Teste de navegação (Sea Trial)',
        'Explicação de funcionamento ao cliente',
        'Limpeza final'
    ]
};

export const OrdersView: React.FC<OrdersViewProps> = ({ role, initialOrderId }) => {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [boats, setBoats] = useState<Boat[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [parts, setParts] = useState<Part[]>([]);
    const [servicesCatalog, setServicesCatalog] = useState<ServiceDefinition[]>([]);
    const [marinas, setMarinas] = useState<Marina[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isItemSearchOpen, setIsItemSearchOpen] = useState(false); // New State for Modal

    // Tab State
    const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'parts' | 'media' | 'report' | 'profit'>('details');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // AI State
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // File Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingAttachmentType, setPendingAttachmentType] = useState<AttachmentType | null>(null);

    // Add Item States
    const [partSearch, setPartSearch] = useState('');
    const [selectedPartId, setSelectedPartId] = useState('');
    const [partQty, setPartQty] = useState(1);
    const [partPrice, setPartPrice] = useState(0);
    const [partCost, setPartCost] = useState(0);

    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [servicePrice, setServicePrice] = useState(0);

    // Edit Item State
    const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
    const [editQty, setEditQty] = useState(0);
    const [editPrice, setEditPrice] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        refreshData();
    }, []);

    useEffect(() => {
        if (initialOrderId && orders.length > 0 && !selectedOrder) {
            const target = orders.find(o => o.id.toString() === initialOrderId.toString());
            if (target) {
                setSelectedOrder(target);
                setActiveTab('details');
            }
        }
    }, [initialOrderId, orders]);

    const refreshData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [ordersData, boatsData, clientsData, partsData] = await Promise.all([
                ApiService.getOrders(),
                ApiService.getBoats(),
                ApiService.getClients(),
                ApiService.getParts().catch(() => [])
            ]);

            setOrders(ordersData);
            setBoats(boatsData);
            setClients(clientsData);
            setParts(partsData);

            // Still from Storage for now (Catalogs)
            setServicesCatalog(StorageService.getServices());
            setMarinas(StorageService.getMarinas());
        } catch (error: any) {
            console.error("Error fetching data", error);
            setError("Erro ao carregar ordens: " + (error.response?.data?.detail || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const isTechnician = role === UserRole.TECHNICIAN;

    const saveOrderUpdate = (updatedOrder: ServiceOrder) => {
        // Security check: Only block if the CURRENT STATUS ON DISK is completed/canceled.
        const currentOnDisk = orders.find(o => o.id === updatedOrder.id);
        if (currentOnDisk && (currentOnDisk.status === OSStatus.COMPLETED || currentOnDisk.status === OSStatus.CANCELED)) {
            // Allow only time logs or tech reports to be saved if strictly necessary.
            // For now, adhere to strict locking for Admin edits.
            if (updatedOrder.status === currentOnDisk.status) {
                // We are not trying to change status, just edit fields. Block it.
                return;
            }
        }

        const updatedList = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        setOrders(updatedList);
        StorageService.saveOrders(updatedList);
        setSelectedOrder(updatedOrder);
    };

    const handleStatusChange = (id: string, newStatus: OSStatus) => {
        if (newStatus === OSStatus.CANCELED) {
            if (!window.confirm("ATENÇÃO: Cancelar esta OS impedirá edições futuras. Deseja continuar?")) return;

            // Direct Update to bypass save guards
            const updatedList = orders.map(o => o.id === id ? { ...o, status: OSStatus.CANCELED } : o);
            setOrders(updatedList);
            StorageService.saveOrders(updatedList);

            const updated = updatedList.find(o => o.id === id);
            if (updated) setSelectedOrder(updated);

            alert("Ordem cancelada.");
        }
        else if (newStatus === OSStatus.COMPLETED) {
            if (!window.confirm("CONFIRMAÇÃO DE BAIXA:\n\n1. O estoque dos itens utilizados será baixado.\n2. A receita será lançada no financeiro.\n3. A OS será bloqueada para edição.\n\nDeseja concluir o serviço?")) return;

            const success = StorageService.completeServiceOrder(id);
            if (success) {
                // Force reload data from storage to ensure we have the COMPLETED status
                const freshOrders = StorageService.getOrders();
                setOrders(freshOrders);
                const updated = freshOrders.find(o => o.id === id);

                if (updated) {
                    setSelectedOrder(updated);
                }
                // Also refresh parts/finance as they changed
                refreshData();
                alert("Ordem concluída com sucesso! Estoque e Financeiro atualizados.");
            } else {
                alert("Erro ao concluir ordem. Verifique se a ordem existe ou já foi concluída.");
            }
        } else {
            // Just status update (e.g. Pending -> In Progress)
            const orderToUpdate = orders.find(o => o.id === id);
            if (orderToUpdate) {
                const updated = { ...orderToUpdate, status: newStatus };
                // Bypass saveOrderUpdate to allow status change even if logic is tricky, but saveOrderUpdate handles it usually
                const updatedList = orders.map(o => o.id === id ? updated : o);
                setOrders(updatedList);
                StorageService.saveOrders(updatedList);
                setSelectedOrder(updated);
            }
        }
    };

    const handleReopenOrder = (id: string) => {
        if (!window.confirm("ATENÇÃO - ESTORNO:\n\n1. Os itens serão devolvidos ao estoque.\n2. O lançamento financeiro (Receita) será cancelado.\n3. A OS voltará para 'Em Execução'.\n\nDeseja reabrir para correções?")) return;

        const success = StorageService.reopenServiceOrder(id);
        if (success) {
            const freshOrders = StorageService.getOrders();
            setOrders(freshOrders);
            const updated = freshOrders.find(o => o.id === id);
            if (updated) setSelectedOrder(updated);
            refreshData();
            alert("Ordem reaberta. Estoque estornado.");
        }
    };

    const handleCreateOrder = (boatId: string, description: string, duration?: number) => {
        if (!boatId) {
            alert("Por favor, selecione uma embarcação.");
            return;
        }
        if (!description) {
            alert("Por favor, insira uma descrição do problema.");
            return;
        }

        const boat = boats.find(b => b.id === boatId);
        if (!boat) return;

        const newOrder: ServiceOrder = {
            id: `OS-${new Date().getFullYear()}-${orders.length + 1}`.padStart(6, '0'),
            boatId: Number(boatId),
            engineId: boat.engines[0]?.id ? Number(boat.engines[0]?.id) : undefined,
            description,
            status: OSStatus.PENDING,
            items: [],
            totalValue: 0,
            createdAt: new Date().toISOString(),
            requester: role === UserRole.ADMIN ? 'Interno' : 'Portal Marinha',
            notes: [],
            estimatedDuration: duration || 2,
            checklist: []
        };

        const updated = [newOrder, ...orders];
        setOrders(updated);
        StorageService.saveOrders(updated);
        setIsCreating(false);
    };

    const handleTimeLog = (action: 'START' | 'STOP') => {
        if (!selectedOrder) return;

        const now = new Date().toISOString();
        let logs = [...(selectedOrder.timeLogs || [])];

        if (action === 'START') {
            const lastLog = logs[logs.length - 1];
            if (lastLog && !lastLog.end) {
                return;
            }
            logs.push({ start: now });
        } else {
            const lastIndex = logs.length - 1;
            if (lastIndex >= 0 && !logs[lastIndex].end) {
                logs[lastIndex] = { ...logs[lastIndex], end: now };
            } else {
                return;
            }
        }

        saveOrderUpdate({ ...selectedOrder, timeLogs: logs });
    };

    const loadChecklistTemplate = (templateKey: string) => {
        if (!selectedOrder || isReadOnly) return;
        const template = CHECKLIST_TEMPLATES[templateKey as keyof typeof CHECKLIST_TEMPLATES];
        const checklistItems: ChecklistItem[] = template.map((label, idx) => ({
            id: `chk-${Date.now()}-${idx}`,
            label,
            checked: false
        }));

        saveOrderUpdate({ ...selectedOrder, checklist: checklistItems });
    };

    const toggleChecklistItem = (itemId: string) => {
        if (!selectedOrder || !selectedOrder.checklist || isReadOnly) return;
        const updatedChecklist = selectedOrder.checklist.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        saveOrderUpdate({ ...selectedOrder, checklist: updatedChecklist });
    };

    const triggerFileUpload = (type: AttachmentType) => {
        setPendingAttachmentType(type);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedOrder || !pendingAttachmentType) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("A imagem é muito grande. Por favor, use uma imagem menor que 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;

            const newAttachment = {
                type: pendingAttachmentType,
                url: base64String,
                description: `Foto adicionada em ${new Date().toLocaleTimeString()}`,
                createdAt: new Date().toISOString()
            };

            saveOrderUpdate({
                ...selectedOrder,
                attachments: [...(selectedOrder.attachments || []), newAttachment]
            });

            setPendingAttachmentType(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsDataURL(file);
    };

    const deleteAttachment = (indexToRemove: number) => {
        if (!selectedOrder || !selectedOrder.attachments || isReadOnly) return;
        if (!window.confirm("Deseja excluir esta foto?")) return;

        const updatedAttachments = selectedOrder.attachments.filter((_, idx) => idx !== indexToRemove);
        saveOrderUpdate({ ...selectedOrder, attachments: updatedAttachments });
    };

    const sendWhatsApp = () => {
        if (!selectedOrder) return;
        const boat = boats.find(b => b.id === selectedOrder.boatId);
        const client = clients.find(c => c.id === boat?.clientId);
        if (!client || !client.phone) {
            alert("Telefone do cliente não cadastrado.");
            return;
        }

        const msg = `Olá ${client.name}, aqui é da Mare Alta Náutica.\n\nAtualização sobre a OS #${selectedOrder.id} (${boat?.name}):\nStatus: ${selectedOrder.status}\n\nQualquer dúvida, estamos à disposição.`;
        const url = `https://wa.me/55${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    const runAiDiagnosis = async () => {
        if (!selectedOrder) return;
        setIsAnalyzing(true);
        setAiAnalysis('');
        const boat = boats.find(b => b.id === selectedOrder.boatId);
        const engine = boat?.engines.find(e => e.id === selectedOrder.engineId);
        const result = await GeminiService.analyzeProblem(
            boat?.model || 'Desconhecido',
            engine?.model || 'Desconhecido',
            selectedOrder.description
        );
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    // --- ITEM ADDITION LOGIC ---

    const handlePartSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const partId = e.target.value;
        setSelectedPartId(partId);
        const part = parts.find(p => p.id.toString() === partId);
        if (part) {
            setPartPrice(part.price);
            setPartCost(part.cost); // Capture cost for profit analysis
        }
    };

    const handleAddPart = () => {
        if (!selectedOrder || !selectedPartId || isReadOnly) return;
        const part = parts.find(p => p.id.toString() === selectedPartId);
        if (!part) return;

        const item: ServiceItem = {
            id: Date.now(),
            type: ItemType.PART,
            description: part.name,
            partId: part.id,
            quantity: partQty,
            unitPrice: partPrice,
            unitCost: partCost, // Save current cost
            total: partQty * partPrice,
            orderId: selectedOrder.id
        };

        const updatedItems = [...selectedOrder.items, item];
        const newTotal = updatedItems.reduce((acc, curr) => acc + curr.total, 0);
        saveOrderUpdate({ ...selectedOrder, items: updatedItems, totalValue: newTotal });

        // Reset Form
        setSelectedPartId('');
        setPartQty(1);
        setPartPrice(0);
        setPartCost(0);
        setPartSearch('');
    };

    const handleServiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const serviceId = e.target.value;
        setSelectedServiceId(serviceId);
        const service = servicesCatalog.find(s => s.id === serviceId);
        if (service) {
            setServicePrice(service.defaultPrice);
        }
    };

    const handleAddService = () => {
        if (!selectedOrder || !selectedServiceId || isReadOnly) return;
        const service = servicesCatalog.find(s => s.id === selectedServiceId);
        if (!service) return;

        const item: ServiceItem = {
            id: Date.now(),
            type: ItemType.LABOR,
            description: service.name,
            quantity: 1,
            unitPrice: servicePrice,
            unitCost: 0,
            total: servicePrice,
            orderId: selectedOrder.id
        };

        const updatedItems = [...selectedOrder.items, item];
        const newTotal = updatedItems.reduce((acc, curr) => acc + curr.total, 0);
        saveOrderUpdate({ ...selectedOrder, items: updatedItems, totalValue: newTotal });

        setSelectedServiceId('');
        setServicePrice(0);
    };

    const handleEditItem = (item: ServiceItem) => {
        if (isReadOnly) return;
        setEditingItemId(item.id);
        setEditQty(item.quantity);
        setEditPrice(item.unitPrice);
    };

    const handleSaveItem = () => {
        if (!selectedOrder || !editingItemId) return;

        const updatedItems = selectedOrder.items.map(item => {
            if (item.id === editingItemId) {
                return {
                    ...item,
                    quantity: editQty,
                    unitPrice: editPrice,
                    total: editQty * editPrice
                };
            }
            return item;
        });

        const newTotal = updatedItems.reduce((acc, curr) => acc + curr.total, 0);
        saveOrderUpdate({ ...selectedOrder, items: updatedItems, totalValue: newTotal });
        setEditingItemId(null);
    };

    const handleCancelEdit = () => {
        setEditingItemId(null);
    };

    const removeItemFromOrder = (itemId: string | number) => {
        if (!selectedOrder || isReadOnly) return;
        const updatedItems = selectedOrder.items.filter(i => i.id !== itemId);
        const newTotal = updatedItems.reduce((acc, curr) => acc + curr.total, 0);
        saveOrderUpdate({ ...selectedOrder, items: updatedItems, totalValue: newTotal });
    };

    const filteredOrders = orders.filter(order => {
        const boat = boats.find(b => b.id.toString() === order.boatId.toString());
        const client = clients.find(c => c.id.toString() === boat?.clientId.toString());
        const matchesText =
            order.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            boat?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
        return matchesText && matchesStatus;
    });

    const getOrderContext = (order: ServiceOrder) => {
        const boat = boats.find(b => b.id.toString() === order.boatId.toString());
        const client = clients.find(c => c.id.toString() === boat?.clientId.toString());
        const marina = marinas.find(m => m.id.toString() === boat?.marinaId?.toString());
        return { boat, client, marina };
    };

    const getLastLog = () => selectedOrder?.timeLogs?.[selectedOrder.timeLogs.length - 1];
    const isTimerRunning = !!(getLastLog() && !getLastLog()?.end);

    const filteredParts = parts.filter(p =>
        !partSearch ||
        p.name.toLowerCase().includes(partSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(partSearch.toLowerCase()) ||
        (p.barcode && p.barcode.includes(partSearch))
    );

    // READ-ONLY Logic
    const isReadOnly = selectedOrder ? (selectedOrder.status === OSStatus.COMPLETED || selectedOrder.status === OSStatus.CANCELED) : false;

    const calculateProfit = (order: ServiceOrder) => {
        const totalRevenue = order.totalValue;
        const totalPartCost = order.items.reduce((acc, item) => {
            if (item.type === 'PART' && item.unitCost) {
                return acc + (item.unitCost * item.quantity);
            }
            return acc;
        }, 0);

        // Assume estimated internal labor cost is 30% of labor price (commission + salary)
        const estimatedLaborCost = order.items.reduce((acc, item) => {
            if (item.type === 'LABOR') {
                return acc + (item.total * 0.3);
            }
            return acc;
        }, 0);

        const totalCost = totalPartCost + estimatedLaborCost;
        const profit = totalRevenue - totalCost;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        return { totalRevenue, totalPartCost, estimatedLaborCost, profit, margin };
    };

    const CreateOrderModal = () => {
        const [desc, setDesc] = useState('');
        const [boatId, setBoatId] = useState('');
        const [duration, setDuration] = useState(2);

        useEffect(() => {
            if (boats.length > 0 && !boatId) {
                setBoatId(boats[0].id);
            }
        }, [boats]);

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:hidden">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">Nova Ordem de Serviço</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Embarcação</label>
                            <select
                                className="w-full p-2 border rounded-lg bg-white text-slate-900"
                                value={boatId}
                                onChange={(e) => setBoatId(e.target.value)}
                            >
                                {boats.map(b => (
                                    <option key={b.id} value={b.id}>{b.name} ({b.model})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Duração Estimada (Horas)</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-lg bg-white text-slate-900"
                                value={duration}
                                onChange={e => setDuration(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Problema / Serviço</label>
                            <textarea
                                className="w-full p-2 border rounded-lg bg-white text-slate-900 h-32"
                                placeholder="Descreva o que está acontecendo..."
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                            <button
                                onClick={() => handleCreateOrder(boatId, desc, duration)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Abrir Chamado
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const ItemSearchModal = () => {
        const [search, setSearch] = useState('');

        // Filter parts
        const filtered = parts.filter(p =>
            !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode && p.barcode.includes(search))
        ).slice(0, 50); // Limit results for performance

        const selectPart = (part: Part) => {
            setSelectedPartId(part.id);
            setPartPrice(part.price);
            setPartCost(part.cost);
            setPartSearch(`${part.name} (${part.sku})`); // Update display text
            setIsItemSearchOpen(false);
        };

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:hidden">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Buscar Item no Estoque</h3>
                        <button onClick={() => setIsItemSearchOpen(false)} className="text-slate-500 hover:text-slate-800"><Ban className="w-6 h-6" /></button>
                    </div>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            className="w-full pl-10 p-3 border rounded-lg bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Digite nome, SKU ou código de barras..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto border rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 sticky top-0">
                                <tr>
                                    <th className="p-3">SKU</th>
                                    <th className="p-3">Nome</th>
                                    <th className="p-3 text-right">Estoque</th>
                                    <th className="p-3 text-right">Preço</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.map(p => (
                                    <tr key={p.id} className="hover:bg-blue-50">
                                        <td className="p-3 font-mono text-xs text-slate-500">{p.sku}</td>
                                        <td className="p-3 font-medium">{p.name}</td>
                                        <td className="p-3 text-right">{p.quantity}</td>
                                        <td className="p-3 text-right">R$ {p.price.toFixed(2)}</td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => selectPart(p)}
                                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                                            >
                                                Selecionar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum item encontrado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-slate-50 relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 z-[100] flex items-center justify-center flex-col">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-slate-600">Carregando ordens...</p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 bg-white z-[100] flex items-center justify-center flex-col p-6">
                    <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h3>
                    <p className="text-slate-600 mb-6 text-center max-w-md">{error}</p>
                    <button onClick={refreshData} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Tentar Novamente
                    </button>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
            />

            {/* PRINT LAYOUT - Uses Global CSS .print-only-content */}
            {selectedOrder && (
                <div className="print-only-content hidden">
                    <div className="text-center mb-6 border-b pb-4">
                        <h1 className="text-2xl font-bold uppercase tracking-wide">Mare Alta Náutica</h1>
                        <p className="text-sm">Ordem de Serviço #{selectedOrder.id}</p>
                        <p className="text-sm">{new Date().toLocaleDateString()}</p>
                        <div className="mt-2 text-xl font-bold">{selectedOrder.status.toUpperCase()}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div>
                            <p className="font-bold text-slate-600 uppercase text-xs">Cliente</p>
                            <p className="font-bold text-lg">{getOrderContext(selectedOrder).client?.name}</p>
                        </div>
                        <div>
                            <p className="font-bold text-slate-600 uppercase text-xs">Embarcação</p>
                            <p className="font-bold text-lg">{getOrderContext(selectedOrder).boat?.name}</p>
                            <p>{getOrderContext(selectedOrder).boat?.model}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="font-bold text-slate-600 uppercase text-xs mb-1">Descrição do Serviço</p>
                        <div className="border p-4 rounded bg-slate-50">{selectedOrder.description}</div>
                    </div>

                    <table className="w-full border-collapse mb-6 text-sm">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border p-2 text-left">Item / Serviço</th>
                                <th className="border p-2 text-right">Qtd</th>
                                <th className="border p-2 text-right">V. Unit</th>
                                <th className="border p-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedOrder.items.map(i => (
                                <tr key={i.id}>
                                    <td className="border p-2">{i.description}</td>
                                    <td className="border p-2 text-right">{i.quantity}</td>
                                    <td className="border p-2 text-right">R$ {i.unitPrice.toFixed(2)}</td>
                                    <td className="border p-2 text-right">R$ {i.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-100 font-bold">
                                <td colSpan={3} className="border p-2 text-right">TOTAL GERAL</td>
                                <td className="border p-2 text-right">R$ {selectedOrder.totalValue.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    {selectedOrder.technicianNotes && (
                        <div className="border p-4 mb-4 rounded">
                            <h3 className="font-bold text-sm uppercase mb-2">Observações Técnicas</h3>
                            <p className="text-sm">{selectedOrder.technicianNotes}</p>
                        </div>
                    )}

                    <div className="mt-12 flex justify-between text-xs text-center">
                        <div className="w-1/3 border-t pt-2">Assinatura Cliente</div>
                        <div className="w-1/3 border-t pt-2">Assinatura Técnico</div>
                    </div>
                </div>
            )}

            {/* SCREEN LAYOUT */}
            <div className="flex h-full w-full print:hidden">
                {/* Left List */}
                <div className={`w-full lg:w-1/3 border-r border-slate-200 flex flex-col h-full bg-slate-50 ${selectedOrder ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-4 lg:p-6 border-b border-slate-200 bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl lg:text-2xl font-bold text-slate-800">
                                {isTechnician ? 'Meus Serviços' : 'Serviços'}
                            </h2>
                            {!isTechnician && (
                                <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-3 py-2 rounded-lg flex gap-2 text-sm">
                                    <Plus className="w-4 h-4" /> Nova OS
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="w-full p-2 border rounded-lg bg-white text-slate-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <select
                                className="w-full p-2 border rounded-lg bg-white text-slate-900"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">Todos os Status</option>
                                {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 lg:pb-4">
                        {filteredOrders.length === 0 && !isLoading && (
                            <div className="text-center py-10 text-slate-500">
                                Nenhum serviço encontrado.
                            </div>
                        )}
                        {filteredOrders.map(order => {
                            const boat = boats.find(b => b.id.toString() === order.boatId.toString());
                            return (
                                <div
                                    key={order.id}
                                    onClick={() => { setSelectedOrder(order); setActiveTab('details'); }}
                                    className={`bg-white p-4 rounded-xl border cursor-pointer hover:shadow-md ${selectedOrder?.id === order.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}
                                >
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-bold text-slate-500">{order.id}</span>
                                        <span className={`px-2 rounded-full font-bold ${order.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                                            order.status === OSStatus.CANCELED ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>{order.status}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800">{boat?.name}</h4>
                                    <p className="text-xs text-slate-500 truncate">{order.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Detail */}
                <div className={`flex-1 flex flex-col h-full bg-white ${!selectedOrder ? 'hidden lg:flex items-center justify-center' : 'flex fixed inset-0 z-50 lg:static'}`}>
                    {!selectedOrder ? (
                        <div className="text-center text-slate-400">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>Selecione uma ordem de serviço.</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="p-4 lg:p-6 border-b border-slate-100 flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-start bg-white">
                                <div className="flex items-start gap-3">
                                    <button onClick={() => setSelectedOrder(null)} className="lg:hidden p-2 -ml-2 text-slate-600">
                                        <ArrowLeft className="w-6 h-6" />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl lg:text-2xl font-bold text-slate-800">OS #{selectedOrder.id}</h2>

                                            {/* STATUS DROPDOWN OR BADGE */}
                                            {role === UserRole.ADMIN && !isReadOnly ? (
                                                <select
                                                    className={`text-xs font-bold px-2 py-1 rounded-full cursor-pointer border-none focus:ring-2 focus:ring-blue-500 bg-slate-100 text-slate-900`}
                                                    value={selectedOrder.status}
                                                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OSStatus)}
                                                >
                                                    <option value={OSStatus.PENDING}>Pendente</option>
                                                    <option value={OSStatus.QUOTATION}>Em Orçamento</option>
                                                    <option value={OSStatus.APPROVED}>Aprovado</option>
                                                    <option value={OSStatus.IN_PROGRESS}>Em Execução</option>
                                                    <option value={OSStatus.COMPLETED}>Concluir (Baixar)</option>
                                                    <option value={OSStatus.CANCELED}>Cancelar</option>
                                                </select>
                                            ) : (
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${selectedOrder.status === OSStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'
                                                    }`}>{selectedOrder.status}</span>
                                            )}

                                            {isReadOnly && (
                                                <span title="OS Bloqueada/Concluída">
                                                    <Lock className="w-4 h-4 text-slate-400" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-sm mt-1">{getOrderContext(selectedOrder).client?.name} • {getOrderContext(selectedOrder).boat?.name}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                                    <button onClick={sendWhatsApp} className="p-2 text-green-600 border border-green-200 bg-green-50 rounded hover:bg-green-100 flex-shrink-0" title="WhatsApp">
                                        <MessageCircle className="w-5 h-5" />
                                    </button>
                                    {!isTechnician && (
                                        <button onClick={() => window.print()} className="p-2 text-slate-400 border rounded hover:bg-slate-50 flex-shrink-0">
                                            <Printer className="w-5 h-5" />
                                        </button>
                                    )}

                                    {/* WARRANTY CHECK BUTTON */}
                                    {selectedOrder && boats.find(b => b.id === selectedOrder.boatId)?.engines.find(e => e.id === selectedOrder.engineId) && (
                                        <button
                                            onClick={() => {
                                                const boat = boats.find(b => b.id === selectedOrder.boatId);
                                                const engine = boat?.engines.find(e => e.id === selectedOrder.engineId);
                                                if (engine && engine.serialNumber) {
                                                    window.open(`https://www.mercurymarine.com/en/us/parts-and-service/warranty-coverage/?serial=${engine.serialNumber}`, '_blank');
                                                } else {
                                                    alert("Motor ou número de série não encontrado.");
                                                }
                                            }}
                                            className="p-2 text-white bg-slate-800 border border-slate-900 rounded hover:bg-slate-700 flex-shrink-0 flex items-center gap-2 px-3"
                                            title="Verificar Garantia Mercury"
                                        >
                                            <Search className="w-4 h-4" />
                                            <span className="text-xs font-bold hidden lg:inline">Check Garantia</span>
                                        </button>
                                    )}

                                    {/* Actions Logic */}
                                    {role === UserRole.ADMIN && !isReadOnly && (
                                        <button
                                            onClick={() => handleStatusChange(selectedOrder.id, OSStatus.COMPLETED)}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded font-medium flex gap-2 items-center flex-shrink-0 text-sm whitespace-nowrap"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Concluir & Baixar
                                        </button>
                                    )}

                                    {role === UserRole.ADMIN && selectedOrder.status === OSStatus.COMPLETED && (
                                        <button
                                            onClick={() => handleReopenOrder(selectedOrder.id)}
                                            className="px-4 py-2 bg-amber-100 text-amber-800 border border-amber-200 rounded font-medium flex gap-2 items-center flex-shrink-0 text-sm whitespace-nowrap hover:bg-amber-200"
                                        >
                                            <Unlock className="w-4 h-4" /> Reabrir (Estornar)
                                        </button>
                                    )}

                                    {isTechnician && selectedOrder.status === OSStatus.IN_PROGRESS && (
                                        <button
                                            onClick={() => handleStatusChange(selectedOrder.id, OSStatus.PENDING)}
                                            className="px-4 py-2 bg-amber-500 text-white rounded font-medium flex gap-2 items-center flex-shrink-0 text-sm whitespace-nowrap"
                                        >
                                            <Clock className="w-4 h-4" /> Aprovação
                                        </button>
                                    )}

                                    {!isReadOnly && role === UserRole.ADMIN && (
                                        <button
                                            onClick={() => handleStatusChange(selectedOrder.id, OSStatus.CANCELED)}
                                            className="px-4 py-2 bg-slate-100 text-slate-500 hover:text-red-600 rounded font-medium flex gap-2 items-center flex-shrink-0 text-sm whitespace-nowrap"
                                        >
                                            <Ban className="w-4 h-4" /> Cancelar
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isReadOnly && (
                                <div className="bg-slate-100 p-2 text-center text-xs text-slate-500 font-medium border-b border-slate-200">
                                    Esta ordem está fechada. Para editar, é necessário reabrí-la (apenas Admin).
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex border-b border-slate-200 px-4 lg:px-6 overflow-x-auto bg-white no-scrollbar">
                                {[
                                    { id: 'details', label: 'Detalhes', icon: FileText },
                                    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
                                    ...(isTechnician || role === UserRole.ADMIN ? [{ id: 'report', label: 'Relatório', icon: Clipboard }] : []),
                                    { id: 'media', label: 'Fotos', icon: Camera },
                                    ...(!isTechnician ? [
                                        { id: 'parts', label: 'Itens & Peças', icon: Search },
                                        { id: 'profit', label: 'Análise de Lucro', icon: DollarSign }
                                    ] : []),
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <tab.icon className="w-4 h-4" /> {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
                                {activeTab === 'details' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded border">
                                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                                    <User className="w-4 h-4" /> Técnico Responsável
                                                </label>
                                                <input
                                                    className="w-full p-2 border rounded bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                                                    placeholder="Nome do Técnico"
                                                    value={selectedOrder.technicianName || ''}
                                                    onChange={e => saveOrderUpdate({ ...selectedOrder, technicianName: e.target.value })}
                                                    disabled={isTechnician || isReadOnly}
                                                />
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded border">
                                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                                    <Clock className="w-4 h-4" /> Registro de Tempo
                                                </label>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleTimeLog('START')}
                                                        disabled={isTimerRunning || isReadOnly}
                                                        className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${isTimerRunning || isReadOnly ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                                    >
                                                        Check-in
                                                    </button>
                                                    <button
                                                        onClick={() => handleTimeLog('STOP')}
                                                        disabled={!isTimerRunning || isReadOnly}
                                                        className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${!isTimerRunning || isReadOnly ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                                    >
                                                        Parar
                                                    </button>
                                                </div>
                                                {isTimerRunning && (
                                                    <div className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1 animate-pulse">
                                                        <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                                        Em andamento
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 border rounded-lg">
                                            <h3 className="font-bold mb-2">Descrição do Problema</h3>
                                            <textarea
                                                className="w-full p-2 border rounded bg-white text-slate-900 h-32 lg:h-24 text-base disabled:bg-slate-50"
                                                value={selectedOrder.description}
                                                onChange={(e) => saveOrderUpdate({ ...selectedOrder, description: e.target.value })}
                                                disabled={isTechnician || isReadOnly}
                                            />
                                            {!isReadOnly && (
                                                <button
                                                    onClick={runAiDiagnosis}
                                                    disabled={isAnalyzing}
                                                    className="mt-4 lg:mt-2 w-full lg:w-auto px-4 py-2 border border-purple-200 bg-purple-50 rounded text-sm text-purple-600 font-bold flex justify-center lg:justify-start items-center gap-2 hover:bg-purple-100"
                                                >
                                                    <BrainCircuit className="w-4 h-4" /> {isAnalyzing ? 'Analisando...' : 'Gerar Diagnóstico IA'}
                                                </button>
                                            )}
                                            {aiAnalysis && (
                                                <div className="mt-4 p-4 bg-purple-50 rounded border border-purple-100 text-sm" dangerouslySetInnerHTML={{ __html: aiAnalysis }} />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'checklist' && (
                                    <div>
                                        {!isReadOnly && (
                                            <div className="flex flex-col lg:flex-row gap-2 mb-4">
                                                <button onClick={() => loadChecklistTemplate('REVISAO_100')} className="px-3 py-2 lg:py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm border">Carregar Revisão 100h</button>
                                                <button onClick={() => loadChecklistTemplate('ENTREGA_TECNICA')} className="px-3 py-2 lg:py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm border">Carregar Entrega Técnica</button>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            {!selectedOrder.checklist || selectedOrder.checklist.length === 0 ? (
                                                <p className="text-slate-400 italic">Nenhum checklist ativo.</p>
                                            ) : selectedOrder.checklist.map(item => (
                                                <div
                                                    key={item.id}
                                                    className={`flex items-center gap-3 p-3 border rounded ${isReadOnly ? 'opacity-80' : 'hover:bg-slate-50 cursor-pointer'}`}
                                                    onClick={() => toggleChecklistItem(item.id)}
                                                >
                                                    <div className={`w-6 h-6 lg:w-5 lg:h-5 flex-shrink-0 rounded border flex items-center justify-center ${item.checked ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-slate-300'}`}>
                                                        {item.checked && <CheckCircle className="w-4 h-4 lg:w-3 lg:h-3" />}
                                                    </div>
                                                    <span className={item.checked ? 'text-slate-500 line-through' : 'text-slate-800'}>{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'report' && (
                                    <div className="space-y-6">
                                        <div className="bg-amber-50 p-4 rounded border border-amber-100">
                                            <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold">
                                                <AlertTriangle className="w-5 h-5" /> Estado da Embarcação
                                            </div>
                                            <textarea
                                                className="w-full p-2 border rounded bg-white text-slate-900 h-24 text-sm disabled:bg-slate-50"
                                                placeholder="Ex: Casco com riscos na proa, estofamento rasgado, porão sujo..."
                                                value={selectedOrder.boatStatus || ''}
                                                onChange={e => saveOrderUpdate({ ...selectedOrder, boatStatus: e.target.value })}
                                                disabled={isReadOnly}
                                            />
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded border border-slate-200">
                                            <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold">
                                                <AlertOctagon className="w-5 h-5" /> Estado dos Motores
                                            </div>
                                            <textarea
                                                className="w-full p-2 border rounded bg-white text-slate-900 h-24 text-sm disabled:bg-slate-50"
                                                placeholder="Ex: Vazamento de óleo na rabeta, oxidação nos terminais..."
                                                value={selectedOrder.engineStatus || ''}
                                                onChange={e => saveOrderUpdate({ ...selectedOrder, engineStatus: e.target.value })}
                                                disabled={isReadOnly}
                                            />
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded border border-blue-100">
                                            <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold">
                                                <FileText className="w-5 h-5" /> Observações do Serviço
                                            </div>
                                            <textarea
                                                className="w-full p-2 border rounded bg-white text-slate-900 h-32 text-sm disabled:bg-slate-50"
                                                placeholder="Descreva o que foi realizado, dificuldades encontradas..."
                                                value={selectedOrder.technicianNotes || ''}
                                                onChange={e => saveOrderUpdate({ ...selectedOrder, technicianNotes: e.target.value })}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'media' && (
                                    <div>
                                        {!isReadOnly && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                                {[
                                                    { type: 'HOUR_METER', label: 'Horímetro', color: 'bg-blue-100 text-blue-700' },
                                                    { type: 'SERIAL_NUMBER', label: 'Nº Série', color: 'bg-slate-100 text-slate-700' },
                                                    { type: 'PART_REPLACED', label: 'Peça Trocada', color: 'bg-red-100 text-red-700' },
                                                    { type: 'SERVICE', label: 'Serviço', color: 'bg-green-100 text-green-700' },
                                                ].map((btn) => (
                                                    <button
                                                        key={btn.type}
                                                        onClick={() => triggerFileUpload(btn.type as AttachmentType)}
                                                        className={`p-3 rounded-lg flex flex-col items-center justify-center gap-2 border hover:brightness-95 transition-all ${btn.color}`}
                                                    >
                                                        <Camera className="w-6 h-6" />
                                                        <span className="text-[10px] lg:text-xs font-bold uppercase text-center">{btn.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {!selectedOrder.attachments || selectedOrder.attachments.length === 0 ? (
                                                <p className="col-span-full text-slate-400 italic text-center py-8 bg-slate-50 border rounded-lg border-dashed">
                                                    Nenhuma foto anexada.
                                                </p>
                                            ) : (
                                                selectedOrder.attachments.map((att, idx) => (
                                                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200">
                                                        <img src={att.url} alt={att.description} className="w-full h-32 object-cover" />
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
                                                            <span className="font-bold block">{att.type}</span>
                                                        </div>
                                                        {!isReadOnly && (
                                                            <button
                                                                onClick={() => deleteAttachment(idx)}
                                                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'parts' && !isTechnician && (
                                    <div className="space-y-6">
                                        {!isReadOnly && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Add Part Section */}
                                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Package className="w-4 h-4" /> Adicionar Peças</h4>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Item Selecionado</label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    readOnly
                                                                    className="w-full p-2 border rounded bg-slate-100 text-slate-700 text-sm font-medium"
                                                                    placeholder="Nenhum item selecionado..."
                                                                    value={partSearch}
                                                                />
                                                                <button
                                                                    onClick={() => setIsItemSearchOpen(true)}
                                                                    className="bg-slate-800 text-white px-3 py-2 rounded hover:bg-slate-700 flex items-center gap-2"
                                                                >
                                                                    <Search className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <div className="w-20">
                                                                <label className="text-xs font-medium text-slate-500 mb-1 block">Qtd</label>
                                                                <input
                                                                    type="number"
                                                                    className="w-full p-2 border rounded bg-white text-slate-900 text-sm"
                                                                    value={partQty}
                                                                    onChange={e => setPartQty(Number(e.target.value))}
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="text-xs font-medium text-slate-500 mb-1 block">Preço Unit. (R$)</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="w-full p-2 border rounded bg-white text-slate-900 text-sm"
                                                                    value={partPrice}
                                                                    onChange={e => setPartPrice(Number(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={handleAddPart}
                                                            disabled={!selectedPartId}
                                                            className="w-full bg-cyan-600 text-white p-2 rounded hover:bg-cyan-700 disabled:opacity-50 text-sm font-bold"
                                                        >
                                                            Adicionar Peça à OS
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Add Service Section */}
                                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Wrench className="w-4 h-4" /> Adicionar Serviço</h4>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Selecione o Serviço do Catálogo</label>
                                                            <select
                                                                className="w-full p-2 border rounded bg-white text-slate-900 text-sm"
                                                                value={selectedServiceId}
                                                                onChange={handleServiceSelect}
                                                            >
                                                                <option value="">-- Selecione o Tipo de Serviço --</option>
                                                                {servicesCatalog.map(s => (
                                                                    <option key={s.id} value={s.id}>[{s.category}] {s.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Valor do Serviço (R$)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="w-full p-2 border rounded bg-white text-slate-900 text-sm"
                                                                value={servicePrice}
                                                                onChange={e => setServicePrice(Number(e.target.value))}
                                                            />
                                                        </div>

                                                        <button
                                                            onClick={handleAddService}
                                                            disabled={!selectedServiceId}
                                                            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-bold mt-auto"
                                                        >
                                                            Adicionar Mão de Obra
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="overflow-x-auto border rounded-lg">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 font-semibold">
                                                    <tr><th className="p-3">Item / Descrição</th><th className="p-3 text-right">Qtd</th><th className="p-3 text-right">Unitário</th><th className="p-3 text-right">Total</th><th className="p-3"></th></tr>
                                                </thead>
                                                <tbody>
                                                    {selectedOrder.items.length === 0 && (
                                                        <tr><td colSpan={5} className="p-6 text-center text-slate-400 italic">Nenhum item adicionado à ordem.</td></tr>
                                                    )}
                                                    {selectedOrder.items.map(item => (
                                                        <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    {item.type === 'PART' ? <Package className="w-4 h-4 text-cyan-600" /> : <Wrench className="w-4 h-4 text-blue-600" />}
                                                                    {item.description}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                {editingItemId === item.id ? (
                                                                    <input
                                                                        type="number"
                                                                        className="w-20 p-1 border rounded text-right"
                                                                        value={editQty}
                                                                        onChange={e => setEditQty(Number(e.target.value))}
                                                                    />
                                                                ) : (
                                                                    item.quantity
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-right text-slate-500">
                                                                {editingItemId === item.id ? (
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        className="w-24 p-1 border rounded text-right"
                                                                        value={editPrice}
                                                                        onChange={e => setEditPrice(Number(e.target.value))}
                                                                    />
                                                                ) : (
                                                                    `R$ ${item.unitPrice.toFixed(2)}`
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-right font-bold text-slate-800">
                                                                R$ {(editingItemId === item.id ? (editQty * editPrice) : item.total).toFixed(2)}
                                                            </td>
                                                            <td className="p-3 text-right flex justify-end gap-2">
                                                                {!isReadOnly && (
                                                                    <>
                                                                        {editingItemId === item.id ? (
                                                                            <>
                                                                                <button onClick={handleSaveItem} className="text-green-600 hover:text-green-800" title="Salvar">
                                                                                    <CheckCircle className="w-4 h-4" />
                                                                                </button>
                                                                                <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600" title="Cancelar">
                                                                                    <Ban className="w-4 h-4" />
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <button onClick={() => handleEditItem(item)} className="text-blue-400 hover:text-blue-600" title="Editar">
                                                                                    <Pencil className="w-4 h-4" />
                                                                                </button>
                                                                                <button onClick={() => removeItemFromOrder(item.id)} className="text-red-400 hover:text-red-600" title="Remover">
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-slate-100 font-bold text-slate-800">
                                                    <tr>
                                                        <td colSpan={3} className="p-3 text-right">TOTAL GERAL:</td>
                                                        <td className="p-3 text-right text-lg">R$ {selectedOrder.totalValue.toFixed(2)}</td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'profit' && role === UserRole.ADMIN && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4">Análise de Lucratividade</h3>
                                        {(() => {
                                            const { totalRevenue, totalPartCost, estimatedLaborCost, profit, margin } = calculateProfit(selectedOrder);
                                            return (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                                        <p className="text-sm text-slate-500 uppercase font-bold mb-2">Receita Total</p>
                                                        <p className="text-3xl font-bold text-slate-800">R$ {totalRevenue.toFixed(2)}</p>
                                                    </div>
                                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                                        <p className="text-sm text-slate-500 uppercase font-bold mb-2">Custos Totais (Estimados)</p>
                                                        <p className="text-3xl font-bold text-red-600">R$ {(totalPartCost + estimatedLaborCost).toFixed(2)}</p>
                                                        <div className="text-xs text-slate-400 mt-2">
                                                            <p>Peças: R$ {totalPartCost.toFixed(2)}</p>
                                                            <p>Mão de Obra (30%): R$ {estimatedLaborCost.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`p-6 rounded-xl border shadow-sm ${profit > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                                        <p className="text-sm uppercase font-bold mb-2 text-slate-600">Margem de Lucro</p>
                                                        <p className={`text-3xl font-bold ${profit > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                                            R$ {profit.toFixed(2)}
                                                        </p>
                                                        <p className="text-sm font-semibold mt-1">{margin.toFixed(1)}%</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded">
                                            Nota: O custo da Mão de Obra é estimado em 30% do valor cobrado para cobrir comissão e impostos.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {isCreating && <CreateOrderModal />}
            {isItemSearchOpen && <ItemSearchModal />}
        </div >
    );
};