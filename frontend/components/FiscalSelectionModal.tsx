import React, { useState, useEffect } from 'react';
import { X, FileText, CheckSquare, Square } from 'lucide-react';
import { ServiceOrder, ItemType, FiscalDataPayload } from '../types';

interface FiscalSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: ServiceOrder | null;
    onConfirm: (data: FiscalDataPayload) => void;
    client?: { name: string; doc: string };
}

export const FiscalSelectionModal: React.FC<FiscalSelectionModalProps> = ({
    isOpen, onClose, order, onConfirm, client
}) => {
    const [invoiceType, setInvoiceType] = useState<'nfe' | 'nfse'>('nfe');
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

    // Reset state when modal opens or order changes
    useEffect(() => {
        if (isOpen && order) {
            setInvoiceType('nfe');
            // Default: select all parts if NFE, all services if NFSE
            const parts = order.items.filter(i => i.type === ItemType.PART).map(i => i.id);
            setSelectedItemIds(parts);
        }
    }, [isOpen, order]);

    // Update selection when type changes
    useEffect(() => {
        if (order) {
            if (invoiceType === 'nfe') {
                const parts = order.items.filter(i => i.type === ItemType.PART).map(i => i.id);
                setSelectedItemIds(parts);
            } else {
                const services = order.items.filter(i => i.type === ItemType.LABOR).map(i => i.id);
                setSelectedItemIds(services);
            }
        }
    }, [invoiceType, order]);

    if (!isOpen || !order) return null;

    const filteredItems = order.items.filter(item =>
        invoiceType === 'nfe' ? item.type === ItemType.PART : item.type === ItemType.LABOR
    );

    const toggleItem = (id: number) => {
        setSelectedItemIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleConfirm = () => {
        const selectedItems = order.items.filter(i => selectedItemIds.includes(i.id));

        if (selectedItems.length === 0) {
            alert("Selecione pelo menos um item para emitir a nota.");
            return;
        }

        const totalValue = selectedItems.reduce((acc, i) => acc + i.total, 0);

        if (invoiceType === 'nfe') {
            onConfirm({
                type: 'nfe',
                client: {
                    name: client?.name || 'Cliente',
                    doc: client?.doc || ''
                },
                items: selectedItems.map(p => ({
                    code: p.partId?.toString() || '000',
                    desc: p.description,
                    qty: p.quantity,
                    price: p.unitPrice,
                    total: p.total
                }))
            });
        } else {
            onConfirm({
                type: 'nfse',
                client: {
                    name: client?.name || 'Cliente',
                    doc: client?.doc || ''
                },
                serviceValue: totalValue,
                serviceDesc: `Serviços ref. OS #${order.id}: ${selectedItems.map(i => i.description).join(', ')}`
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-cyan-600" /> Emitir Nota Fiscal
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Tipo de Nota</label>
                        <div className="flex gap-4 p-1 bg-slate-100 rounded-lg">
                            <button
                                onClick={() => setInvoiceType('nfe')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${invoiceType === 'nfe'
                                    ? 'bg-white text-cyan-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                NF-e (Produtos)
                            </button>
                            <button
                                onClick={() => setInvoiceType('nfse')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${invoiceType === 'nfse'
                                    ? 'bg-white text-cyan-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                NFS-e (Serviços)
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase">
                                Selecione os Itens ({selectedItemIds.length})
                            </label>
                            <button
                                onClick={() => setSelectedItemIds(filteredItems.map(i => i.id))}
                                className="text-xs text-cyan-600 font-bold hover:underline"
                            >
                                Selecionar Todos
                            </button>
                        </div>

                        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                            {filteredItems.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 italic text-sm">
                                    Nenhum item deste tipo encontrado na OS.
                                </div>
                            ) : (
                                filteredItems.map(item => {
                                    const isSelected = selectedItemIds.includes(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItem(item.id)}
                                            className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-cyan-50/50' : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`text-cyan-600 ${isSelected ? 'opacity-100' : 'opacity-40'}`}>
                                                {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                                                    {item.description}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {item.quantity} x R$ {item.unitPrice.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="font-bold text-slate-700 text-sm">
                                                R$ {item.total.toFixed(2)}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Total Selecionado</p>
                        <p className="text-xl font-bold text-cyan-700">
                            R$ {order.items
                                .filter(i => selectedItemIds.includes(i.id))
                                .reduce((acc, i) => acc + i.total, 0)
                                .toFixed(2)}
                        </p>
                    </div>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedItemIds.length === 0}
                        className="px-6 py-3 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 shadow-lg shadow-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                    >
                        Emitir Nota
                    </button>
                </div>
            </div>
        </div>
    );
};
