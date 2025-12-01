import React, { useState, useEffect } from 'react';
import { Boat, Client, Engine, Marina, Manufacturer, Model } from '../types'; // Importa as definições de tipo.
import { ApiService } from '../services/api'; // Importa o serviço de API para comunicação com o backend.
import { Plus, Search, Anchor, Edit2, UserCircle, Save, Trash, MapPin, Settings } from 'lucide-react'; // Ícones para a interface.

/**
 * BoatsView (Visão de Embarcações)
 * Componente React para gerenciar o cadastro, visualização, criação e edição de embarcações.
 * Inclui gerenciamento de motores associados e integração com a API Mercury para consulta de garantia.
 */
export const BoatsView: React.FC = () => {
    const [boats, setBoats] = useState<Boat[]>([]); // Lista de embarcações carregadas do backend.
    const [clients, setClients] = useState<Client[]>([]); // Lista de clientes para associar às embarcações.
    const [marinas, setMarinas] = useState<Marina[]>([]); // Lista de marinas para associar às embarcações.
    const [boatManufacturers, setBoatManufacturers] = useState<Manufacturer[]>([]); // Lista de fabricantes de cascos de embarcações.
    const [engineManufacturers, setEngineManufacturers] = useState<Manufacturer[]>([]); // Lista de fabricantes de motores.
    const [searchTerm, setSearchTerm] = useState(''); // Termo de busca para filtrar a lista de embarcações exibida.

    // --- Estado do Modal ---
    const [isModalOpen, setIsModalOpen] = useState(false); // Controla a visibilidade do modal de criação/edição.
    const [editingBoat, setEditingBoat] = useState<Partial<Boat>>({}); // Armazena os dados da embarcação atualmente em edição ou criação.

    // --- Estados para Seleção de Marca/Modelo de Embarcação (Dropdowns Cascata) ---
    const [selectedBrand, setSelectedBrand] = useState<Manufacturer | null>(null); // Marca de embarcação selecionada.
    const [selectedModel, setSelectedModel] = useState<Model | null>(null); // Modelo de embarcação selecionado.

    // --- Estado do Formulário de Motores ---
    const [tempEngine, setTempEngine] = useState<Partial<Engine>>({}); // Dados temporários de um motor sendo adicionado/editado.
    const [selectedEngineBrand, setSelectedEngineBrand] = useState<Manufacturer | null>(null); // Marca de motor selecionada.
    const [selectedEngineModel, setSelectedEngineModel] = useState<Model | null>(null); // Modelo de motor selecionado.

    // --- Funções de Busca de Dados ---
    /**
     * Busca todos os dados necessários do backend para popular a interface do BoatsView.
     * Isso inclui embarcações, clientes, marinas, fabricantes de cascos e fabricantes de motores.
     */
    const fetchData = async () => {
        try {
            // Realiza múltiplas chamadas de API em paralelo usando Promise.all para otimizar o tempo de carregamento.
            const [fetchedBoats, fetchedClients, fetchedMarinas, fetchedBoatMan, fetchedEngMan] = await Promise.all([
                ApiService.getBoats(), // Obtém a lista de embarcações.
                ApiService.getClients(), // Obtém a lista de clientes.
                // ApiService.getMarinas(), // Esta chamada está comentada e substituída por um placeholder.
                // A funcionalidade de marinas pode ser implementada em ApiService.getMarinas() e seu router correspondente.
                Promise.resolve([]), // Placeholder temporário: se `ApiService.getMarinas()` não existe, retorna um array vazio.
                ApiService.getManufacturers('BOAT'), // Obtém fabricantes com tipo 'BOAT'.
                ApiService.getManufacturers('ENGINE'), // Obtém fabricantes com tipo 'ENGINE'.
            ]);
            setBoats(fetchedBoats);
            setClients(fetchedClients);
            setMarinas(fetchedMarinas); // Define as marinas (atualmente pode estar vazia devido ao placeholder).
            setBoatManufacturers(fetchedBoatMan);
            setEngineManufacturers(fetchedEngMan);
        } catch (error) {
            console.error("Falha ao buscar dados de embarcações", error);
        }
    };

    /**
     * Hook useEffect: Executa `fetchData` uma única vez após a montagem inicial do componente.
     * O array de dependências vazio (`[]`) garante que o efeito não será re-executado em re-renderizações subsequentes.
     */
    useEffect(() => {
        fetchData();
    }, []);

    // --- Lógica do Modal e Formulário ---
    /**
     * Abre o modal para cadastrar uma nova embarcação.
     * Reinicia o estado de edição da embarcação e as seleções de marca/modelo.
     */
    const openNew = () => {
        setEditingBoat({ engines: [], usageType: 'LAZER' }); // Inicializa com tipo de uso padrão e sem motores.
        setSelectedBrand(null);
        setSelectedModel(null);
        setIsModalOpen(true);
    };

    /**
     * Abre o modal para editar uma embarcação existente.
     * Preenche o estado de edição com os dados da embarcação.
     * Tenta pré-selecionar a marca e o modelo nos dropdowns para melhor experiência do usuário.
     * @param boat A embarcação a ser editada.
     */
    const openEdit = (boat: Boat) => {
        setEditingBoat(boat);
        // Lógica para pré-selecionar marca e modelo nos dropdowns da embarcação.
        const boatModelName = boat.model?.split(' ')[0]; // Tenta extrair a marca do modelo completo.
        const brand = boatManufacturers.find(b => b.name === boatModelName);
        if (brand) {
            setSelectedBrand(brand);
            const modelName = boat.model?.substring(boatModelName.length + 1); // Tenta extrair o modelo.
            const model = brand.models.find(m => m.name === modelName);
            if (model) {
                setSelectedModel(model);
            }
        }
        setIsModalOpen(true);
    };

    /**
     * Manipula a mudança de seleção da marca da embarcação no formulário.
     * Atualiza o estado da marca selecionada e reseta o modelo.
     * @param brandId O ID da marca selecionada (string do evento).
     */
    const handleBoatBrandChange = (brandId: string) => {
        const brand = boatManufacturers.find(b => b.id === parseInt(brandId)) || null;
        setSelectedBrand(brand);
        setSelectedModel(null); // Reseta o modelo ao mudar a marca para forçar nova seleção.
    };

    /**
     * Manipula a mudança de seleção do modelo da embarcação no formulário.
     * Atualiza o estado do modelo selecionado e compõe o campo 'model' da embarcação em edição.
     * @param modelId O ID do modelo selecionado (string do evento).
     */
    const handleBoatModelChange = (modelId: string) => {
        const model = selectedBrand?.models.find(m => m.id === parseInt(modelId)) || null;
        setSelectedModel(model);
        if (model && selectedBrand) {
            // Concatena o nome da marca e do modelo para formar o 'model' completo da embarcação.
            setEditingBoat({ ...editingBoat, model: `${selectedBrand.name} ${model.name}` });
        }
    };
        
    /**
     * Manipula a mudança de seleção da marca do motor no formulário de adição de motores.
     * Atualiza o estado da marca de motor selecionada e reseta o modelo do motor.
     * @param brandId O ID da marca de motor selecionada (string do evento).
     */
    const handleEngineBrandChange = (brandId: string) => {
        const brand = engineManufacturers.find(b => b.id === parseInt(brandId)) || null;
        setSelectedEngineBrand(brand);
        setSelectedEngineModel(null); // Reseta o modelo do motor ao mudar a marca.
    };

    /**
     * Manipula a mudança de seleção do modelo do motor no formulário de adição de motores.
     * Atualiza o estado do modelo de motor selecionado e compõe o campo 'model' do motor temporário.
     * @param modelId O ID do modelo de motor selecionado (string do evento).
     */
    const handleEngineModelChange = (modelId: string) => {
        const model = selectedEngineBrand?.models.find(m => m.id === parseInt(modelId)) || null;
        setSelectedEngineModel(model);
        if (model && selectedEngineBrand) {
            // Concatena o nome da marca e do modelo para formar o 'model' completo do motor.
            setTempEngine({ ...tempEngine, model: `${selectedEngineBrand.name} ${model.name}` });
        }
    };

    /**
     * Lida com o salvamento da embarcação (seja criação ou atualização).
     * Valida os campos obrigatórios e chama a API apropriada.
     */
    const handleSaveBoat = async () => {
        // Validação básica dos campos obrigatórios.
        if (!editingBoat.name || !editingBoat.hullId || !editingBoat.clientId) {
            alert("Preencha os campos obrigatórios: Nome, Inscrição e Proprietário.");
            return;
        }
        
        // Garante que clientId e marinaId (se existirem) sejam tratados como números.
        const boatData = {
            ...editingBoat,
            clientId: Number(editingBoat.clientId),
            marinaId: editingBoat.marinaId ? Number(editingBoat.marinaId) : undefined,
        };

        try {
            if (editingBoat.id) {
                // Se `editingBoat.id` existe, a operação é uma atualização.
                await ApiService.updateBoat(editingBoat.id, boatData as BoatUpdate);
            } else {
                // Caso contrário, é uma nova criação.
                await ApiService.createBoat(boatData as BoatCreate);
            }
            fetchData(); // Recarrega a lista de embarcações para refletir as mudanças.
            setIsModalOpen(false); // Fecha o modal.
            setEditingBoat({}); // Limpa os dados da embarcação em edição.
        } catch (error) {
            console.error("Falha ao salvar embarcação", error);
            alert("Erro ao salvar embarcação.");
        }
    };

    

        // -- ENGINE LOGIC --

    

    // --- Lógica de Gerenciamento de Motores ---
    /**
     * Adiciona o motor temporário à lista de motores da embarcação em edição.
     * Atribui um ID temporário para gerenciamento na UI antes de salvar no backend.
     */
    const addEngineToBoat = () => {
        // Validação básica para garantir que o modelo e o número de série foram preenchidos.
        if (!tempEngine.model || !tempEngine.serialNumber) {
            alert("Preencha o modelo e o número de série do motor.");
            return;
        }

        const newEngine: Engine = {
            id: Date.now(), // Gera um ID temporário único para uso na UI. O backend irá gerar o ID real.
            boatId: editingBoat.id as number, // O ID da embarcação será definido pelo backend na criação/atualização.
            ...tempEngine
        } as Engine;

        // Atualiza o estado da embarcação em edição, adicionando o novo motor à lista.
        setEditingBoat({
            ...editingBoat,
            engines: [...(editingBoat.engines || []), newEngine]
        });

        // Limpa o formulário de adição de motor temporário e as seleções de marca/modelo do motor.
        setTempEngine({});
        setSelectedEngineBrand(null);
        setSelectedEngineModel(null);
    };

    /**
     * Remove um motor da lista de motores da embarcação em edição.
     * @param engineId O ID (temporário ou real) do motor a ser removido.
     */
    const removeEngine = (engineId: number) => {
        setEditingBoat({
            ...editingBoat,
            engines: editingBoat.engines?.filter(e => e.id !== engineId) // Filtra a lista para remover o motor com o ID correspondente.
        });
    };

    /**
     * Realiza a busca de informações de garantia de um motor no Portal Mercury Marine.
     * Utiliza o número de série do motor temporário.
     */
    const handleSearchWarranty = async () => {
        if (!tempEngine.serialNumber) {
            alert('Digite o número de série do motor para buscar a garantia');
            return;
        }

        try {
            // Chama o serviço de API para buscar a garantia no sistema Mercury.
            const result = await ApiService.getMercuryWarranty(tempEngine.serialNumber!);
            if (result.data) {
                const warranty = result.data;
                // Atualiza o modelo do motor temporário com o modelo encontrado na garantia.
                setTempEngine({
                    ...tempEngine,
                    model: warranty.modelo,
                    // Poderiam ser preenchidos outros campos do motor com base nos dados da garantia.
                });
                alert(`Garantia encontrada para o modelo: ${warranty.modelo}`);
            } else {
                alert('Motor não encontrado no sistema Mercury');
            }
        } catch (error) {
            alert('Erro ao buscar garantia do motor');
            console.error(error);
        }
    };

    // --- Funções Auxiliares de Exibição ---
    /**
     * Retorna o nome de um cliente com base no seu ID.
     * Usado para exibir o nome do proprietário na lista de embarcações.
     * @param id O ID do cliente.
     * @returns O nome do cliente ou 'Desconhecido' se não for encontrado.
     */
    const getClientName = (id: number) => {
        const client = clients.find(c => c.id === id);
        return client ? client.name : 'Desconhecido';
    };

    /**
     * Retorna o nome de uma marina com base no seu ID.
     * Usado para exibir a localização atual da embarcação.
     * @param id Opcional: O ID da marina.
     * @returns O nome da marina, 'Oficina / Pátio Próprio' se o ID for nulo, ou 'Marina Desconhecida' se não for encontrada.
     */
    const getMarinaName = (id?: number) => {
        if (!id) return 'Oficina / Pátio Próprio'; // Se não há ID de marina, assume que está na oficina própria.
        const marina = marinas.find(m => m.id === id);
        return marina ? marina.name : 'Marina Desconhecida';
    };

    

        const filteredBoats = boats.filter(b =>

            b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||

            b.hullId.toLowerCase().includes(searchTerm.toLowerCase()) ||

            getClientName(b.clientId).toLowerCase().includes(searchTerm.toLowerCase())

        );

        

        return (

            <div className="p-4 md:p-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">

                    <h2 className="text-2xl font-bold text-slate-800">Gestão de Embarcações</h2>

                    <button

                        onClick={openNew}

                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm w-full md:w-auto justify-center"

                    >

                        <Plus className="w-4 h-4" /> Nova Embarcação

                    </button>

                </div>

    

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

                    <div className="p-4 border-b border-slate-100 flex gap-4">

                        <div className="relative flex-1 max-w-md">

                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />

                            <input

                                type="text"

                                placeholder="Buscar por nome, inscrição ou proprietário..."

                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"

                                value={searchTerm}

                                onChange={(e) => setSearchTerm(e.target.value)}

                            />

                        </div>

                    </div>

    

                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm min-w-[800px]">

                            <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold">

                                <tr>

                                    <th className="px-6 py-4">Embarcação (Nome)</th>

                                    <th className="px-6 py-4">Uso</th>

                                    <th className="px-6 py-4">Localização Atual</th>

                                    <th className="px-6 py-4">Proprietário</th>

                                    <th className="px-6 py-4 text-center">Motores</th>

                                    <th className="px-6 py-4 text-right">Ações</th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {filteredBoats.map(boat => (

                                    <tr key={boat.id} className="hover:bg-slate-50">

                                        <td className="px-6 py-4 font-medium text-slate-900">

                                            <div className="text-base font-bold text-cyan-700">{boat.name}</div>

                                            <div className="text-xs text-slate-500 font-normal">{boat.model} • {boat.hullId}</div>

                                        </td>

                                        <td className="px-6 py-4">

                                            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">

                                                {boat.usageType || 'LAZER'}

                                            </span>

                                        </td>

                                        <td className="px-6 py-4 text-slate-600">

                                            <div className="flex items-center gap-2">

                                                <MapPin className={`w-4 h-4 ${boat.marinaId ? 'text-blue-500' : 'text-orange-500'}`} />

                                                {getMarinaName(boat.marinaId)}

                                            </div>

                                        </td>

                                        <td className="px-6 py-4 text-slate-700">

                                            <div className="flex items-center gap-2">

                                                <UserCircle className="w-4 h-4 text-slate-400" />

                                                {getClientName(boat.clientId)}

                                            </div>

                                        </td>

                                        <td className="px-6 py-4 text-center">

                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">

                                                {boat.engines?.length || 0}

                                            </span>

                                        </td>

                                        <td className="px-6 py-4 text-right">

                                            <button onClick={() => openEdit(boat)} className="text-slate-400 hover:text-cyan-600 transition-colors">

                                                <Edit2 className="w-4 h-4" />

                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>

    

                {isModalOpen && (

                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">

                        <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-xl my-8">

                            <h3 className="text-lg font-bold mb-4">{editingBoat.id ? 'Editar Embarcação' : 'Cadastrar Embarcação'}</h3>

    

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

    

                                {/* --- BOAT DETAILS --- */}

                                <div className="space-y-4">

                                    <h4 className="font-bold text-slate-700 text-sm uppercase border-b pb-1 mb-3">Dados da Embarcação</h4>

    

                                    <div className="bg-cyan-50 p-3 rounded border border-cyan-100 shadow-sm">

                                        <label className="block text-xs font-bold text-cyan-800 mb-1 flex items-center gap-1">

                                            <Anchor className="w-3 h-3" />

                                            Nome da Embarcação (Nome de Batismo)

                                        </label>

                                        <input

                                            type="text"

                                            className="w-full p-2 border border-cyan-200 rounded font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none bg-white"

                                            value={editingBoat.name || ''}

                                            onChange={e => setEditingBoat({ ...editingBoat, name: e.target.value })}

                                        />

                                    </div>

    

                                    <div className="grid grid-cols-2 gap-2">

                                        <div>

                                            <label className="block text-xs font-medium text-slate-700 mb-1">Fabricante (Casco)</label>

                                            <select

                                                className="w-full p-2 border rounded bg-white text-slate-900"

                                                value={selectedBrand?.id || ''}

                                                onChange={(e) => handleBoatBrandChange(e.target.value)}

                                            >

                                                <option value="">Selecione...</option>

                                                {boatManufacturers.map(m => (

                                                    <option key={m.id} value={m.id}>{m.name}</option>

                                                ))}

                                            </select>

                                        </div>

                                        <div>

                                            <label className="block text-xs font-medium text-slate-700 mb-1">Modelo / Tamanho</label>

                                            <select

                                                className="w-full p-2 border rounded bg-white text-slate-900"

                                                value={selectedModel?.id || ''}

                                                onChange={(e) => handleBoatModelChange(e.target.value)}

                                                disabled={!selectedBrand}

                                            >

                                                <option value="">Selecione...</option>

                                                {selectedBrand?.models.map((m: Model) => (

                                                    <option key={m.id} value={m.id}>{m.name}</option>

                                                ))}

                                            </select>

                                        </div>

    .

                                    </div>

    

                                    <div>

                                        <label className="block text-xs font-medium text-slate-700 mb-1">Modelo Final</label>

                                        <input

                                            type="text"

                                            className="w-full p-2 border rounded bg-white text-slate-900 font-medium"

                                            value={editingBoat.model || ''}

                                            onChange={e => setEditingBoat({ ...editingBoat, model: e.target.value })}

                                        />

                                    </div>

    

                                    <div className="grid grid-cols-2 gap-2">

                                        <div>

                                            <label className="block text-xs font-medium text-slate-700 mb-1">Inscrição / HIN / VIN</label>

                                            <input

                                                type="text"

                                                className="w-full p-2 border rounded bg-white text-slate-900"

                                                value={editingBoat.hullId || ''}

                                                onChange={e => setEditingBoat({ ...editingBoat, hullId: e.target.value })}

                                            />

                                        </div>

                                        <div>

                                            <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Uso</label>

                                            <select

                                                className="w-full p-2 border rounded bg-white text-slate-900"

                                                value={editingBoat.usageType || 'LAZER'}

                                                onChange={e => setEditingBoat({ ...editingBoat, usageType: e.target.value as any })}

                                            >

                                                <option value="LAZER">Lazer</option>

                                                <option value="PESCA">Pesca Esportiva</option>

                                                <option value="COMERCIAL">Comercial / Charter</option>

                                                <option value="GOVERNO">Governo / Militar</option>

                                            </select>

                                        </div>

                                    </div>

                                </div>

    

                                {/* --- LOCATION & OWNER --- */}

                                <div className="space-y-4">

                                    <h4 className="font-bold text-slate-700 text-sm uppercase border-b pb-1 mb-3">Propriedade & Local</h4>

                                    <div>

                                        <label className="block text-xs font-medium text-slate-700 mb-1">Proprietário (Cliente)</label>

                                        <select

                                            className="w-full p-2 border rounded bg-white text-slate-900"

                                            value={editingBoat.clientId || ''}

                                            onChange={e => setEditingBoat({ ...editingBoat, clientId: Number(e.target.value) })}

                                        >

                                            <option value="">Selecione um cliente...</option>

                                            {clients.map(c => (

                                                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>

                                            ))}

                                        </select>

                                    </div>

    

                                    <div className="bg-blue-50 p-3 rounded border border-blue-100">

                                        <label className="block text-xs font-bold text-blue-800 mb-1 flex items-center gap-2">

                                            <MapPin className="w-3 h-3" /> Localização Atual (Marina)

                                        </label>

                                        <select

                                            className="w-full p-2 border rounded bg-white text-slate-900"

                                            value={editingBoat.marinaId || ''}

                                            onChange={e => setEditingBoat({ ...editingBoat, marinaId: Number(e.target.value) })}

                                        >

                                            <option value="">Oficina / Pátio Mare Alta</option>

                                            {marinas.map(m => (

                                                <option key={m.id} value={m.id}>{m.name} ({m.address})</option>

                                            ))}

                                        </select>

                                    </div>

                                </div>

                            </div>

    

                            {/* --- ENGINES --- */}

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">

                                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">

                                    <Settings className="w-4 h-4" /> Motorização

                                </h4>

    

                                <div className="space-y-2 mb-4">

                                    {editingBoat.engines?.length === 0 && <p className="text-sm text-slate-400 italic">Nenhum motor cadastrado.</p>}

                                    {editingBoat.engines?.map(eng => (

                                        <div key={eng.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-3 rounded border border-slate-200 shadow-sm gap-2">

                                            <div className="flex items-center gap-3">

                                                <div className="p-2 bg-slate-100 rounded text-slate-500">

                                                    <Settings className="w-4 h-4" />

                                                </div>

                                                <div>

                                                    <p className="font-bold text-slate-700 text-sm">{eng.model}</p>

                                                    <p className="font-mono text-xs text-slate-500">S/N: {eng.serialNumber} | {eng.hours} hrs</p>

                                                </div>

                                            </div>

                                            <button onClick={() => removeEngine(eng.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded self-end md:self-auto">

                                                <Trash className="w-4 h-4" />

                                            </button>

                                        </div>

                                    ))}

                                </div>

    

                                {/* Add Engine Form */}

                                <div className="bg-white p-3 rounded border border-slate-200">

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">

                                        <select

                                            className="w-full p-1.5 text-xs border rounded bg-white text-slate-900"

                                            value={selectedEngineBrand?.id || ''}

                                            onChange={(e) => handleEngineBrandChange(e.target.value)}

                                        >

                                            <option value="">Marca do Motor</option>

                                            {engineManufacturers.map(m => (

                                                <option key={m.id} value={m.id}>{m.name}</option>

                                            ))}

                                        </select>

                                        <select

                                            className="w-full p-1.5 text-xs border rounded bg-white text-slate-900"

                                            value={selectedEngineModel?.id || ''}

                                            onChange={(e) => handleEngineModelChange(e.target.value)}

                                            disabled={!selectedEngineBrand}

                                        >

                                            <option value="">Modelo / Potência</option>

                                            {selectedEngineBrand?.models.map((m: Model) => (

                                                <option key={m.id} value={m.id}>{m.name}</option>

                                            ))}

                                        </select>

                                    </div>

    

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">

                                        <div className="md:col-span-2">

                                            <input

                                                placeholder="Modelo Completo (Editável)"

                                                className="w-full p-1.5 text-sm border rounded bg-white text-slate-900"

                                                value={tempEngine.model || ''}

                                                onChange={e => setTempEngine({ ...tempEngine, model: e.target.value })}

                                            />

                                        </div>

                                        <div className="flex gap-1">

                                            <input

                                                placeholder="Número de Série"

                                                className="flex-1 p-1.5 text-sm border rounded bg-white text-slate-900"

                                                value={tempEngine.serialNumber || ''}

                                                onChange={e => setTempEngine({ ...tempEngine, serialNumber: e.target.value })}

                                            />

                                            <button

                                                onClick={handleSearchWarranty}

                                                className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium whitespace-nowrap"

                                                title="Buscar Garantia Mercury"

                                                type="button"

                                            >

                                                🔍

                                            </button>

                                        </div>

                                        <div className="flex gap-1">

                                            <input

                                                placeholder="Hrs"

                                                type="number"

                                                className="w-16 p-1.5 text-sm border rounded bg-white text-slate-900"

                                                value={tempEngine.hours || ''}

                                                onChange={e => setTempEngine({ ...tempEngine, hours: Number(e.target.value) || 0 })}

                                            />

                                            <button

                                                onClick={addEngineToBoat}

                                                disabled={!tempEngine.model || !tempEngine.serialNumber}

                                                className="flex-1 bg-slate-800 text-white p-1.5 rounded text-sm hover:bg-slate-700 disabled:opacity-50 flex justify-center items-center"

                                            >

                                                <Plus className="w-4 h-4" />

                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </div>

    

                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">

                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>

                                <button onClick={handleSaveBoat} className="px-6 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 flex items-center gap-2 font-medium">

                                    <Save className="w-4 h-4" /> Salvar Cadastro

                                </button>

                            </div>

                        </div>

                    </div>

                )}

            </div>

        );

    };