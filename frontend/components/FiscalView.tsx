import React, { useState } from 'react';
import {
    FileText, Settings, History, Send, Printer, AlertTriangle,
    CheckCircle, XCircle, Building, FileDigit, Save, Share2, Mail
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { FiscalDocType, FiscalStatus, FiscalInvoice, FiscalIssuer, FiscalDataPayload } from '../types';

interface FiscalViewProps {
    initialData?: FiscalDataPayload | null;
}

export const FiscalView: React.FC<FiscalViewProps> = ({ initialData }) => {
    const [activeTab, setActiveTab] = useState<'nfe' | 'nfse' | 'history' | 'config'>('nfe');
    const [isLoading, setIsLoading] = useState(false);

    // [NEW] Populate from initialData
    React.useEffect(() => {
        if (initialData) {
            if (initialData.type === 'nfe') {
                setActiveTab('nfe');
                setNfeData(prev => ({
                    ...prev,
                    destinatario: initialData.client.name,
                    docDestinatario: initialData.client.doc,
                    items: initialData.items || []
                }));
            } else {
                setActiveTab('nfse');
                setNfseData(prev => ({
                    ...prev,
                    tomador: initialData.client.name,
                    docTomador: initialData.client.doc,
                    valorServico: initialData.serviceValue || 0
                }));
            }
        }
    }, [initialData]);

    // Mock Data
    // Load config on mount
    React.useEffect(() => {
        const config = StorageService.getConfig();
        if (config.company) {
            setIssuer(config.company);
        }
    }, []);

    const [issuer, setIssuer] = useState<FiscalIssuer>({
        cnpj: '',
        ie: '',
        companyName: '',
        tradeName: '',
        address: {
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
            zip: ''
        },
        crt: '1',
        environment: 'homologation'
    });

    const handleSaveConfig = () => {
        const config = StorageService.getConfig();
        const updatedConfig = { ...config, company: issuer };
        StorageService.saveConfig(updatedConfig);
        alert('Configurações fiscais atualizadas com sucesso!');
    };

    const [history, setHistory] = useState<FiscalInvoice[]>([
        {
            id: '1',
            type: FiscalDocType.NFE,
            number: '1001',
            series: '1',
            status: FiscalStatus.AUTHORIZED,
            issuedAt: new Date().toISOString(),
            recipientName: 'João da Silva',
            recipientDoc: '123.456.789-00',
            totalValue: 1500.00,
            authorizationProtocol: '141200000001234' // [NEW]
        },
        {
            id: '2',
            type: FiscalDocType.NFSE,
            number: '205',
            series: '1',
            status: FiscalStatus.REJECTED,
            issuedAt: new Date(Date.now() - 86400000).toISOString(),
            recipientName: 'Marina Porto',
            recipientDoc: '99.999.999/0001-99',
            totalValue: 450.00,
            rejectionReason: 'Alíquota de ISS incorreta para o município.'
        }
    ]);

    // Form States
    const [nfeData, setNfeData] = useState({
        naturezaOperacao: 'Venda de Mercadoria',
        destinatario: '',
        docDestinatario: '',
        items: [{ code: '', desc: '', qty: 1, price: 0, total: 0 }]
    });

    const [nfseData, setNfseData] = useState({
        servico: 'Manutenção de Embarcação',
        tomador: '',
        docTomador: '',
        valorServico: 0,
        issRetido: false
    });

    const handleTransmit = async (type: FiscalDocType) => {
        setIsLoading(true);
        try {
            const invoiceData = {
                type: type,
                issuer: issuer,
                recipient: {
                    name: type === FiscalDocType.NFE ? nfeData.destinatario : nfseData.tomador,
                    doc: type === FiscalDocType.NFE ? nfeData.docDestinatario : nfseData.docTomador
                },
                items: type === FiscalDocType.NFE ? nfeData.items : [],
                serviceValue: type === FiscalDocType.NFSE ? nfseData.valorServico : 0,
                totalValue: type === FiscalDocType.NFE ? nfeData.items.reduce((acc, i) => acc + i.total, 0) : nfseData.valorServico,
                naturezaOperacao: type === FiscalDocType.NFE ? nfeData.naturezaOperacao : nfseData.servico,
                issRetido: type === FiscalDocType.NFSE ? nfseData.issRetido : false
            };

            const ApiService = (await import('../services/api')).ApiService;
            const result = await ApiService.emitFiscalInvoice(invoiceData);

            if (result.status === 'success') {
                const newInvoice: FiscalInvoice = {
                    id: Math.random().toString(),
                    type,
                    number: result.number || Math.floor(Math.random() * 1000).toString(),
                    series: '1',
                    status: FiscalStatus.AUTHORIZED,
                    issuedAt: new Date().toISOString(),
                    recipientName: type === FiscalDocType.NFE ? nfeData.destinatario : nfseData.tomador,
                    recipientDoc: type === FiscalDocType.NFE ? nfeData.docDestinatario : nfseData.docTomador,
                    totalValue: type === FiscalDocType.NFE ? nfeData.items.reduce((acc, i) => acc + i.total, 0) : nfseData.valorServico,
                    authorizationProtocol: result.protocol
                };
                setHistory([newInvoice, ...history]);
                alert(`${type} transmitida com sucesso!\nProtocolo: ${result.protocol}\nMensagem: ${result.message}`);
                setActiveTab('history');
            } else {
                alert(`Erro ao transmitir ${type}: ${result.message}`);
            }
        } catch (error: any) {
            alert(`Erro ao transmitir nota fiscal: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = (invoice: FiscalInvoice) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const htmlContent = `
            <html>
            <head>
                <title>Nota Fiscal ${invoice.number}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .box { border: 1px solid #ccc; padding: 10px; border-radius: 4px; margin-bottom: 15px; }
                    .title { font-weight: bold; font-size: 12px; color: #666; text-transform: uppercase; }
                    .value { font-size: 14px; color: #000; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                    th { background-color: #f5f5f5; }
                    .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${invoice.type} - Documento Auxiliar</h2>
                    <p><strong>${issuer.companyName}</strong> | CNPJ: ${issuer.cnpj}</p>
                    <p>${issuer.address.street}, ${issuer.address.number} - ${issuer.address.city}/${issuer.address.state}</p>
                </div>

                <div class="box">
                    <div class="row">
                        <div>
                            <div class="title">Número</div>
                            <div class="value">${invoice.number}</div>
                        </div>
                        <div>
                            <div class="title">Série</div>
                            <div class="value">${invoice.series}</div>
                        </div>
                        <div>
                            <div class="title">Emissão</div>
                            <div class="value">${new Date(invoice.issuedAt).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div class="title">Protocolo de Autorização</div>
                            <div class="value"><strong>${invoice.authorizationProtocol || 'Em Processamento'}</strong></div>
                        </div>
                    </div>
                </div>

                <div class="box">
                    <div class="title" style="margin-bottom: 5px;">Destinatário / Tomador</div>
                    <div class="value"><strong>${invoice.recipientName}</strong></div>
                    <div class="value">CPF/CNPJ: ${invoice.recipientDoc}</div>
                </div>

                <div class="box">
                    <div class="title">Detalhes do Serviço / Produtos</div>
                    ${invoice.type === FiscalDocType.NFE ? `
                        <table>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Descrição</th>
                                    <th>Qtd</th>
                                    <th>Unitário</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Mock items for history view as we don't store items in history state for this demo -->
                                <tr>
                                    <td>001</td>
                                    <td>Produto / Serviço Referente à Nota ${invoice.number}</td>
                                    <td>1</td>
                                    <td>R$ ${invoice.totalValue.toFixed(2)}</td>
                                    <td>R$ ${invoice.totalValue.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    ` : `
                        <p style="margin-top: 5px;">Serviço prestado conforme NFS-e.</p>
                    `}
                </div>

                <div class="total">
                    Valor Total: R$ ${invoice.totalValue.toFixed(2)}
                </div>

                <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #999;">
                    Emitido via Sistema Mare Alta
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleWhatsApp = (invoice: FiscalInvoice) => {
        const message = `Olá ${invoice.recipientName}, segue o link da sua ${invoice.type} número ${invoice.number} no valor de R$ ${invoice.totalValue.toFixed(2)}. Protocolo: ${invoice.authorizationProtocol}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleEmail = (invoice: FiscalInvoice) => {
        const subject = `Envio de ${invoice.type} - ${issuer.companyName}`;
        const body = `Olá ${invoice.recipientName},\n\nSegue em anexo a sua ${invoice.type} número ${invoice.number}.\n\nValor: R$ ${invoice.totalValue.toFixed(2)}\nProtocolo: ${invoice.authorizationProtocol}\n\nAtenciosamente,\n${issuer.companyName}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-cyan-600" /> Módulo Fiscal
                    </h2>
                    <p className="text-slate-500 text-sm">Emissão de NF-e e NFS-e</p>
                </div>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${issuer.environment === 'production' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                        Ambiente: {issuer.environment === 'production' ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO'}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200 mb-6">
                <button onClick={() => setActiveTab('nfe')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'nfe' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    <FileDigit className="w-4 h-4" /> Emitir NF-e (Produto)
                </button>
                <button onClick={() => setActiveTab('nfse')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'nfse' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    <FileText className="w-4 h-4" /> Emitir NFS-e (Serviço)
                </button>
                <button onClick={() => setActiveTab('history')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    <History className="w-4 h-4" /> Histórico
                </button>
                <button onClick={() => setActiveTab('config')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'config' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    <Settings className="w-4 h-4" /> Configurações
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">

                {/* NF-e TAB */}
                {activeTab === 'nfe' && (
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">Nova Nota Fiscal Eletrônica (NF-e)</h3>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Natureza da Operação</label>
                                <select className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" value={nfeData.naturezaOperacao} onChange={e => setNfeData({ ...nfeData, naturezaOperacao: e.target.value })}>
                                    <option>Venda de Mercadoria</option>
                                    <option>Devolução de Mercadoria</option>
                                    <option>Remessa para Conserto</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Destinatário (Nome/Razão Social)</label>
                                <input type="text" className="w-full p-3 border border-slate-200 rounded-lg" value={nfeData.destinatario} onChange={e => setNfeData({ ...nfeData, destinatario: e.target.value })} placeholder="Ex: João da Silva" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">CPF / CNPJ</label>
                                <input type="text" className="w-full p-3 border border-slate-200 rounded-lg" value={nfeData.docDestinatario} onChange={e => setNfeData({ ...nfeData, docDestinatario: e.target.value })} placeholder="000.000.000-00" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="font-bold text-slate-700 mb-3">Itens da Nota</h4>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                {nfeData.items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-3 mb-3 items-end">
                                        <div className="col-span-2">
                                            <label className="block text-xs text-slate-400 mb-1">Código</label>
                                            <input type="text" className="w-full p-2 border rounded" value={item.code} onChange={e => {
                                                const newItems = [...nfeData.items];
                                                newItems[idx].code = e.target.value;
                                                setNfeData({ ...nfeData, items: newItems });
                                            }} />
                                        </div>
                                        <div className="col-span-5">
                                            <label className="block text-xs text-slate-400 mb-1">Descrição</label>
                                            <input type="text" className="w-full p-2 border rounded" value={item.desc} onChange={e => {
                                                const newItems = [...nfeData.items];
                                                newItems[idx].desc = e.target.value;
                                                setNfeData({ ...nfeData, items: newItems });
                                            }} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs text-slate-400 mb-1">Qtd</label>
                                            <input type="number" className="w-full p-2 border rounded" value={item.qty} onChange={e => {
                                                const newItems = [...nfeData.items];
                                                newItems[idx].qty = Number(e.target.value);
                                                newItems[idx].total = newItems[idx].qty * newItems[idx].price;
                                                setNfeData({ ...nfeData, items: newItems });
                                            }} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs text-slate-400 mb-1">Unitário</label>
                                            <input type="number" className="w-full p-2 border rounded" value={item.price} onChange={e => {
                                                const newItems = [...nfeData.items];
                                                newItems[idx].price = Number(e.target.value);
                                                newItems[idx].total = newItems[idx].qty * newItems[idx].price;
                                                setNfeData({ ...nfeData, items: newItems });
                                            }} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs text-slate-400 mb-1">Total</label>
                                            <input type="number" className="w-full p-2 border rounded bg-slate-100" value={item.total} disabled />
                                        </div>
                                    </div>
                                ))}
                                <button className="text-sm text-cyan-600 font-bold hover:underline">+ Adicionar Item</button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button className="px-6 py-3 border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50">Salvar Rascunho</button>
                            <button
                                onClick={() => handleTransmit(FiscalDocType.NFE)}
                                disabled={isLoading}
                                className="px-8 py-3 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 shadow-lg shadow-cyan-200 flex items-center gap-2"
                            >
                                {isLoading ? 'Transmitindo...' : <><Send className="w-4 h-4" /> Transmitir NF-e</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* NFS-e TAB */}
                {activeTab === 'nfse' && (
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">Nova Nota Fiscal de Serviço (NFS-e)</h3>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 flex gap-3 items-start">
                            <Building className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-blue-800 font-bold">Configuração Local: Paranaguá - PR</p>
                                <p className="text-xs text-blue-600">As regras de ISS e retenções seguem a legislação municipal vigente.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Serviço Prestado</label>
                                <select className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" value={nfseData.servico} onChange={e => setNfseData({ ...nfseData, servico: e.target.value })}>
                                    <option>14.01 - Lubrificação, limpeza, lustração, revisão, carga e recarga, conserto...</option>
                                    <option>14.02 - Assistência técnica</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tomador (Cliente)</label>
                                <input type="text" className="w-full p-3 border border-slate-200 rounded-lg" value={nfseData.tomador} onChange={e => setNfseData({ ...nfseData, tomador: e.target.value })} placeholder="Nome do Cliente" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">CPF / CNPJ</label>
                                <input type="text" className="w-full p-3 border border-slate-200 rounded-lg" value={nfseData.docTomador} onChange={e => setNfseData({ ...nfseData, docTomador: e.target.value })} placeholder="000.000.000-00" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Valor do Serviço (R$)</label>
                                <input type="number" className="w-full p-3 border border-slate-200 rounded-lg font-bold text-lg" value={nfseData.valorServico} onChange={e => setNfseData({ ...nfseData, valorServico: Number(e.target.value) })} />
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 rounded text-cyan-600" checked={nfseData.issRetido} onChange={e => setNfseData({ ...nfseData, issRetido: e.target.checked })} />
                                    <span className="text-slate-700 font-medium">ISS Retido na Fonte</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button className="px-6 py-3 border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50">Salvar Rascunho</button>
                            <button
                                onClick={() => handleTransmit(FiscalDocType.NFSE)}
                                disabled={isLoading}
                                className="px-8 py-3 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 shadow-lg shadow-cyan-200 flex items-center gap-2"
                            >
                                {isLoading ? 'Transmitindo...' : <><Send className="w-4 h-4" /> Transmitir NFS-e</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Número</th>
                                    <th className="p-4">Protocolo</th>
                                    <th className="p-4">Emissão</th>
                                    <th className="p-4">Destinatário</th>
                                    <th className="p-4 text-right">Valor</th>
                                    <th className="p-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${inv.status === FiscalStatus.AUTHORIZED ? 'bg-emerald-100 text-emerald-700' :
                                                inv.status === FiscalStatus.REJECTED ? 'bg-red-100 text-red-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {inv.status === FiscalStatus.AUTHORIZED && <CheckCircle className="w-3 h-3" />}
                                                {inv.status === FiscalStatus.REJECTED && <XCircle className="w-3 h-3" />}
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-slate-600">{inv.type}</td>
                                        <td className="p-4 font-mono">{inv.number}</td>
                                        <td className="p-4 font-mono text-xs text-slate-500">
                                            {inv.authorizationProtocol || '-'}
                                        </td>
                                        <td className="p-4 text-slate-500">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                                        <td className="p-4 font-medium">{inv.recipientName}</td>
                                        <td className="p-4 text-right font-bold">R$ {inv.totalValue.toFixed(2)}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    className="p-2 text-slate-400 hover:text-cyan-600 transition-colors"
                                                    title="Imprimir / PDF"
                                                    onClick={() => handlePrint(inv)}
                                                >
                                                    <Printer className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className="p-2 text-slate-400 hover:text-green-600 transition-colors"
                                                    title="Enviar por WhatsApp"
                                                    onClick={() => handleWhatsApp(inv)}
                                                >
                                                    <Share2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Enviar por Email"
                                                    onClick={() => handleEmail(inv)}
                                                >
                                                    <Mail className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* CONFIG TAB */}
                {activeTab === 'config' && (
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">Dados do Emitente</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Razão Social</label>
                                <input type="text" className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" value={issuer.companyName} readOnly />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">CNPJ</label>
                                    <input type="text" className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" value={issuer.cnpj} readOnly />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Regime Tributário</label>
                                    <select className="w-full p-3 border border-slate-200 rounded-lg" value={issuer.crt} onChange={e => setIssuer({ ...issuer, crt: e.target.value as any })}>
                                        <option value="1">Simples Nacional</option>
                                        <option value="3">Regime Normal</option>
                                        <option value="4">MEI - Microempreendedor Individual</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Certificado Digital (A1)</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors">
                                    <FileDigit className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm text-slate-600 font-medium">Clique para selecionar o arquivo .PFX</p>
                                    <p className="text-xs text-slate-400 mt-1">Válido até: 31/12/2025</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Ambiente de Emissão</label>
                                <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="env" checked={issuer.environment === 'homologation'} onChange={() => setIssuer({ ...issuer, environment: 'homologation' })} />
                                        <span>Homologação (Teste)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="env" checked={issuer.environment === 'production'} onChange={() => setIssuer({ ...issuer, environment: 'production' })} />
                                        <span className="text-red-600 font-bold">Produção (Valendo)</span>
                                    </label>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleSaveConfig}
                                    className="px-6 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> Salvar Configurações
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
