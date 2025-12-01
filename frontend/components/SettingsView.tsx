import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api'; // Importa o serviço de API para comunicação com o backend.
import { Manufacturer, Model, CompanyInfo } from '../types'; // Importa as definições de tipo.
import { Plus, Trash, Settings as SettingsIcon, Save, ChevronRight, AlertTriangle, Building } from 'lucide-react'; // Ícones para a interface.

/**
 * SettingsView (Visão de Configurações)
 * Componente React para gerenciar as configurações do sistema.
 * Inclui o cadastro de fabricantes e modelos de embarcações e motores,
 * além das informações fiscais e de contato da empresa.
 */
export const SettingsView: React.FC = () => {
    // --- Variáveis de Estado ---
    const [boatManufacturers, setBoatManufacturers] = useState<Manufacturer[]>([]); // Lista de fabricantes de cascos.
    const [engineManufacturers, setEngineManufacturers] = useState<Manufacturer[]>([]); // Lista de fabricantes de motores.
    const [companyInfo, setCompanyInfo] = useState<Partial<CompanyInfo>>({}); // Informações da empresa.
    
    const [activeTab, setActiveTab] = useState<'boat' | 'engine' | 'company'>('boat'); // Aba ativa (Embarcações, Motorização, Dados da Empresa).
    const [selectedBrand, setSelectedBrand] = useState<Manufacturer | null>(null); // Marca selecionada para gerenciar modelos.

    // Inputs do formulário.
    const [newBrandName, setNewBrandName] = useState(''); // Nome da nova marca a ser adicionada.
    const [newModelName, setNewModelName] = useState(''); // Nome do novo modelo a ser adicionado.

    /**
     * Função assíncrona para buscar todos os dados de configuração necessários do backend.
     * Isso inclui fabricantes de embarcações, fabricantes de motores e informações da empresa.
     */
    const fetchData = async () => {
        try {
            // Realiza múltiplas chamadas de API em paralelo para otimizar o carregamento.
            const [boats, engines, company] = await Promise.all([
                ApiService.getManufacturers('BOAT'), // Obtém fabricantes de cascos.
                ApiService.getManufacturers('ENGINE'), // Obtém fabricantes de motores.
                ApiService.getCompanyInfo() // Obtém as informações da empresa.
            ]);
            setBoatManufacturers(boats);
            setEngineManufacturers(engines);
            setCompanyInfo(company || {}); // Define as informações da empresa, usando um objeto vazio se não houver dados.
        } catch (error) {
            console.error("Falha ao buscar dados de configurações", error);
        }
    };

    /**
     * Hook useEffect: Executa `fetchData` uma única vez após a montagem inicial do componente.
     * O array de dependências vazio (`[]`) garante que o efeito não será re-executado em re-renderizações subsequentes.
     */
    useEffect(() => {
        fetchData();
    }, []);

    /**
     * Função placeholder para salvar configurações. Em uma implementação completa,
     * cada seção de configuração teria sua própria lógica de salvamento na API.
     * @param updatedConfig Objeto com as configurações atualizadas.
     */
    const handleSave = (updatedConfig: any) => {
        // Esta função é um placeholder, a lógica de salvamento real é implementada em funções específicas.
        console.log("Salvando...", updatedConfig);
    };

    /**
     * Manipula a mudança de valores nos campos de informação da empresa.
     * Atualiza o estado `companyInfo` com o novo valor do campo específico.
     * @param field O nome do campo da CompanyInfo que está sendo alterado.
     * @param value O novo valor para o campo.
     */
    const handleCompanyInfoChange = (field: keyof CompanyInfo, value: any) => {
        setCompanyInfo(prev => ({ ...prev, [field]: value }));
    };

    /**
     * Lida com a atualização das informações da empresa no backend.
     * Chama a API para persistir as mudanças e recarrega os dados.
     */
    const handleUpdateCompanyInfo = async () => {
        try {
            await ApiService.updateCompanyInfo(companyInfo as CompanyInfo); // Chama a API para atualizar.
            alert("Dados da empresa atualizados com sucesso!");
            fetchData(); // Recarrega os dados para garantir consistência.
        } catch (error) {
            console.error("Falha ao atualizar os dados da empresa", error);
            alert("Erro ao atualizar os dados da empresa.");
        }
    };

    /**
     * Adiciona uma nova marca (fabricante) de barco ou motor.
     * Valida o nome e chama a API para criar o fabricante.
     */
    const handleAddBrand = async () => {
        if (!newBrandName.trim()) return; // Impede adicionar marcas vazias.

        const type = activeTab === 'boat' ? 'BOAT' : 'ENGINE'; // Define o tipo da marca com base na aba ativa.
        
        try {
            await ApiService.createManufacturer({ name: newBrandName, type }); // Cria o fabricante via API.
            setNewBrandName(''); // Limpa o campo de entrada.
            fetchData(); // Recarrega todos os dados para atualizar as listas.
        } catch (error) {
            console.error("Falha ao adicionar marca", error);
            alert("Erro ao adicionar marca. Verifique se ela já existe.");
        }
    };

    /**
     * Função placeholder para deletar uma marca (fabricante).
     * @param brand O objeto Manufacturer a ser deletado.
     */
    const handleDeleteBrand = (brand: Manufacturer) => {
        // TODO: Implementar a chamada ApiService.deleteManufacturer.
        alert(`Funcionalidade de deletar ${brand.name} ainda não implementada.`);
    };

    /**
     * Adiciona um novo modelo para a marca selecionada.
     * Valida o nome e chama a API para criar o modelo.
     */
    const handleAddModel = async () => {
        if (!selectedBrand || !newModelName.trim()) return; // Impede adicionar modelos vazios ou sem marca selecionada.

        try {
            // Cria o modelo via API, associando-o ao ID da marca selecionada.
            await ApiService.createModel({ name: newModelName, manufacturer_id: selectedBrand.id });
            setNewModelName(''); // Limpa o campo de entrada.
            fetchData(); // Recarrega todos os dados para atualizar os modelos da marca selecionada.
        } catch (error) {
            console.error("Falha ao adicionar modelo", error);
            alert("Erro ao adicionar modelo.");
        }
    };

    /**
     * Função placeholder para deletar um modelo.
     * @param model O objeto Model a ser deletado.
     */
    const handleDeleteModel = (model: Model) => {
        // TODO: Implementar a chamada ApiService.deleteModel.
        alert(`Funcionalidade de deletar ${model.name} ainda não implementada.`);
    };

    /**
     * Lida com a operação de "Limpar Dados Operacionais".
     * Exibe um aviso de confirmação antes de simular a limpeza.
     */
    const handleClearOperations = () => {
        if (window.confirm("ATENÇÃO: Isso apagará todas as Ordens de Serviço, Transações Financeiras e Histórico de Estoque gerados para teste.\n\nSeus Clientes, Barcos e Usuários serão MANTIDOS.\n\nDeseja continuar?")) {
            // StorageService.clearOperationalData(); // Esta funcionalidade não é mais segura/relevante com o backend.
            alert("Esta funcionalidade foi desativada para proteger os dados do banco de dados.");
        }
    };

    /**
     * Lida com a operação de "Resetar Sistema Completo".
     * Exibe um aviso de PERIGO de confirmação antes de simular o reset.
     */
    const handleFactoryReset = () => {
        if (window.confirm("PERIGO: Isso apagará TODO o sistema, incluindo usuários e cadastros. O sistema voltará ao estado inicial com dados de exemplo.\n\nDeseja realmente fazer isso?")) {
            // StorageService.factoryReset(); // Esta funcionalidade não é mais segura/relevante com o backend.
            alert("Esta funcionalidade foi desativada para proteger os dados do banco de dados.");
        }
    };

    // Exibe uma mensagem de carregamento se os dados essenciais ainda não foram carregados.
    if (!boatManufacturers.length && !engineManufacturers.length && !companyInfo.id) return <div>Carregando configurações...</div>;

    // Determina a lista de marcas e modelos a serem exibidos com base na aba ativa e na marca selecionada.
    const currentBrands = activeTab === 'boat' ? boatManufacturers : engineManufacturers;
    const currentModels = selectedBrand?.models || [];


    return (
        <div className="p-8 h-full flex flex-col overflow-y-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <SettingsIcon className="w-6 h-6 text-slate-600" />
                    Ajustes do Sistema
                </h2>
                <p className="text-sm text-slate-500">Cadastre novas Marcas e Modelos para padronizar o sistema.</p>
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => { setActiveTab('boat'); setSelectedBrand(''); }}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'boat' ? 'bg-cyan-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                    Embarcações (Cascos)
                </button>
                <button
                    onClick={() => { setActiveTab('engine'); setSelectedBrand(''); }}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'engine' ? 'bg-cyan-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                    Motorização
                </button>
                <button
                    onClick={() => { setActiveTab('company'); setSelectedBrand(''); }}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'company' ? 'bg-cyan-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                    Dados da Empresa
                </button>
            </div>

            {(activeTab === 'boat' || activeTab === 'engine') && (
                <>
                    <div className="flex gap-6 mb-12 min-h-[400px]">
                        {/* Left Column: Brands */}
                        <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">Marcas / Fabricantes</h3>
                            </div>

                            <div className="p-4 border-b border-slate-100">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nova Marca..."
                                        className="flex-1 border rounded px-3 py-2 text-sm bg-white text-slate-900"
                                        value={newBrandName}
                                        onChange={(e) => setNewBrandName(e.target.value)}
                                    />
                                    <button
                                        onClick={handleAddBrand}
                                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                {currentBrands.sort((a, b) => a.name.localeCompare(b.name)).map(brand => (
                                    <div
                                        key={brand.id}
                                        onClick={() => setSelectedBrand(brand)}
                                        className={`flex justify-between items-center p-3 rounded-lg cursor-pointer mb-1 ${selectedBrand?.id === brand.id ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' : 'hover:bg-slate-50 text-slate-700'}`}
                                    >
                                        <span className="font-medium">{brand.name}</span>
                                        <div className="flex items-center gap-2">
                                            {selectedBrand?.id === brand.id && <ChevronRight className="w-4 h-4 text-cyan-500" />}
                                            {/* <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteBrand(brand); }}
                                                className="text-slate-300 hover:text-red-500"
                                            >
                                                <Trash className="w-3 h-3" />
                                            </button> */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Models */}
                        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                            <div className="p-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="font-bold text-slate-700">
                                    {selectedBrand ? `Modelos: ${selectedBrand.name}` : 'Selecione uma marca ao lado'}
                                </h3>
                            </div>

                            {selectedBrand ? (
                                <>
                                    <div className="p-4 border-b border-slate-100">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder={`Novo Modelo para ${selectedBrand.name}...`}
                                                className="flex-1 border rounded px-3 py-2 text-sm bg-white text-slate-900"
                                                value={newModelName}
                                                onChange={(e) => setNewModelName(e.target.value)}
                                            />
                                            <button
                                                onClick={handleAddModel}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium"
                                            >
                                                <Plus className="w-4 h-4" /> Adicionar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            {currentModels.map(model => (
                                                <div key={model.id} className="flex justify-between items-center p-3 border border-slate-100 rounded bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                                                    <span className="text-sm text-slate-700">{model.name}</span>
                                                    {/* <button
                                                        onClick={() => handleDeleteModel(model)}
                                                        className="text-slate-300 hover:text-red-500"
                                                    >
                                                        <Trash className="w-3 h-3" />
                                                    </button> */}
                                                </div>
                                            ))}
                                            {currentModels.length === 0 && (
                                                <div className="col-span-2 text-center text-slate-400 py-10">
                                                    Nenhum modelo cadastrado para esta marca.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-slate-400">
                                    <p>Selecione uma marca à esquerda para gerenciar seus modelos.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-red-200 pt-8 mt-4">
                        <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-6 h-6" /> Zona de Perigo / Dados
                        </h3>
                        <div className="flex gap-4">
                            <button
                                onClick={handleClearOperations}
                                className="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 flex flex-col items-start gap-1"
                            >
                                <span className="font-bold">Limpar Dados Operacionais</span>
                                <span className="text-xs opacity-70">Apaga OSs, Financeiro e Movimentos. Mantém Clientes e Barcos.</span>
                            </button>

                            <button
                                onClick={handleFactoryReset}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex flex-col items-start gap-1 shadow-sm"
                            >
                                <span className="font-bold">Resetar Sistema Completo</span>
                                <span className="text-xs opacity-80">Apaga TUDO e restaura dados de exemplo.</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'company' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-4xl mx-auto w-full mb-12">
                    <div className="flex items-center gap-3 mb-6 border-b pb-4">
                        <div className="p-3 bg-cyan-100 rounded-lg">
                            <Building className="w-6 h-6 text-cyan-700" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Dados da Empresa</h3>
                            <p className="text-sm text-slate-500">Informações fiscais e de contato para emissão de notas.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Identificação */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-700 border-b pb-2">Identificação</h4>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Razão Social</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-200 rounded"
                                    value={config.company?.companyName || ''}
                                    onChange={e => handleSave({ ...config, company: { ...config.company, companyName: e.target.value } as FiscalIssuer })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome Fantasia</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-200 rounded"
                                    value={config.company?.tradeName || ''}
                                    onChange={e => handleSave({ ...config, company: { ...config.company, tradeName: e.target.value } as FiscalIssuer })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">CNPJ</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-200 rounded"
                                        value={config.company?.cnpj || ''}
                                        onChange={e => handleSave({ ...config, company: { ...config.company, cnpj: e.target.value } as FiscalIssuer })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Insc. Estadual</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-200 rounded"
                                        value={config.company?.ie || ''}
                                        onChange={e => handleSave({ ...config, company: { ...config.company, ie: e.target.value } as FiscalIssuer })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Endereço */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-700 border-b pb-2">Endereço</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Logradouro</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-200 rounded"
                                        value={config.company?.address?.street || ''}
                                        onChange={e => handleSave({ ...config, company: { ...config.company, address: { ...config.company?.address, street: e.target.value } } as FiscalIssuer })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Número</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-200 rounded"
                                        value={config.company?.address?.number || ''}
                                        onChange={e => handleSave({ ...config, company: { ...config.company, address: { ...config.company?.address, number: e.target.value } } as FiscalIssuer })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Bairro</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-200 rounded"
                                        value={config.company?.address?.neighborhood || ''}
                                        onChange={e => handleSave({ ...config, company: { ...config.company, address: { ...config.company?.address, neighborhood: e.target.value } } as FiscalIssuer })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">CEP</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-200 rounded"
                                        value={config.company?.address?.zip || ''}
                                        onChange={e => handleSave({ ...config, company: { ...config.company, address: { ...config.company?.address, zip: e.target.value } } as FiscalIssuer })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Cidade</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-200 rounded"
                                        value={config.company?.address?.city || ''}
                                        onChange={e => handleSave({ ...config, company: { ...config.company, address: { ...config.company?.address, city: e.target.value } } as FiscalIssuer })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">UF</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-200 rounded"
                                        value={config.company?.address?.state || ''}
                                        onChange={e => handleSave({ ...config, company: { ...config.company, address: { ...config.company?.address, state: e.target.value } } as FiscalIssuer })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fiscal */}
                        <div className="col-span-1 md:col-span-2 space-y-4">
                            <h4 className="font-bold text-slate-700 border-b pb-2">Configuração Fiscal</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Regime Tributário</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded bg-white"
                                        value={config.company?.crt || '1'}
                                        onChange={e => handleSave({ ...config, company: { ...config.company, crt: e.target.value } as FiscalIssuer })}
                                    >
                                        <option value="1">Simples Nacional</option>
                                        <option value="3">Regime Normal</option>
                                        <option value="4">MEI - Microempreendedor Individual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Ambiente</label>
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="env_settings"
                                                checked={config.company?.environment === 'homologation'}
                                                onChange={() => handleSave({ ...config, company: { ...config.company, environment: 'homologation' } as FiscalIssuer })}
                                            />
                                            <span>Homologação</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="env_settings"
                                                checked={config.company?.environment === 'production'}
                                                onChange={() => handleSave({ ...config, company: { ...config.company, environment: 'production' } as FiscalIssuer })}
                                            />
                                            <span className="text-red-600 font-bold">Produção</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};