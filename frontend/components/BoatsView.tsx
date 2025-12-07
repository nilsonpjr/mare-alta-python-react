import React, { useState, useEffect } from 'react';
import { Boat, Client, Engine, Marina, SystemConfig } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, Anchor, Edit2, UserCircle, Save, Trash, MapPin, Settings } from 'lucide-react';

export const BoatsView: React.FC = () => {
    const [boats, setBoats] = useState<Boat[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [marinas, setMarinas] = useState<Marina[]>([]);
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBoat, setEditingBoat] = useState<Partial<Boat>>({});

    // Boat Selection State (Cascading Dropdowns)
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedModel, setSelectedModel] = useState('');

    // Engine Form State
    const [tempEngine, setTempEngine] = useState<Partial<Engine>>({});
    const [selectedEngineBrand, setSelectedEngineBrand] = useState('');
    const [selectedEngineModel, setSelectedEngineModel] = useState('');

    useEffect(() => {
        setBoats(StorageService.getBoats());
        setClients(StorageService.getClients());
        setMarinas(StorageService.getMarinas());
        setConfig(StorageService.getConfig());
    }, []);

    // -- BOAT LOGIC --

    const openNew = () => {
        setEditingBoat({ engines: [], usageType: 'LAZER' });
        setSelectedBrand('');
        setSelectedModel('');
        setIsModalOpen(true);
    };

    const openEdit = (boat: Boat) => {
        setEditingBoat(boat);
        setSelectedBrand('');
        setSelectedModel('');
        setIsModalOpen(true);
    };

    const handleBoatBrandChange = (brand: string) => {
        setSelectedBrand(brand);
        setSelectedModel(''); // Reset model when brand changes
    };

    const handleBoatModelChange = (model: string) => {
        setSelectedModel(model);
        // Auto-fill the text input
        setEditingBoat({ ...editingBoat, model: `${selectedBrand} ${model}` });
    };

    const handleSaveBoat = () => {
        if (!editingBoat.name || !editingBoat.hullId || !editingBoat.clientId) return;

        let updatedBoats = [...boats];

        if (editingBoat.id) {
            updatedBoats = updatedBoats.map(b =>
                b.id === editingBoat.id ? { ...b, ...editingBoat } as Boat : b
            );
        } else {
            const newBoat: Boat = {
                id: Date.now(),
                name: editingBoat.name,
                hullId: editingBoat.hullId,
                model: editingBoat.model || `${selectedBrand} ${selectedModel}`,
                clientId: editingBoat.clientId,
                marinaId: editingBoat.marinaId,
                usageType: editingBoat.usageType,
                engines: editingBoat.engines || []
            };
            updatedBoats.push(newBoat);
        }

        setBoats(updatedBoats);
        StorageService.saveBoats(updatedBoats);
        setIsModalOpen(false);
        setEditingBoat({});
    };

    // -- ENGINE LOGIC --

    const handleEngineBrandChange = (brand: string) => {
        setSelectedEngineBrand(brand);
        setSelectedEngineModel('');
    };

    const handleEngineModelChange = (model: string) => {
        setSelectedEngineModel(model);
        setTempEngine({ ...tempEngine, model: `${selectedEngineBrand} ${model}` });
    };

    const addEngineToBoat = () => {
        if (!tempEngine.model || !tempEngine.serialNumber) return;

        const newEngine: Engine = {
            id: Date.now(),
            boatId: editingBoat.id || 0,
            model: tempEngine.model,
            serialNumber: tempEngine.serialNumber,
            hours: tempEngine.hours || 0,
            year: tempEngine.year || new Date().getFullYear()
        };

        setEditingBoat({
            ...editingBoat,
            engines: [...(editingBoat.engines || []), newEngine]
        });

        setTempEngine({});
        setSelectedEngineBrand('');
        setSelectedEngineModel('');
    };

    const removeEngine = (engineId: string) => {
        setEditingBoat({
            ...editingBoat,
            engines: editingBoat.engines?.filter(e => e.id !== engineId)
        });
    };

    const getClientName = (id: string) => {
        const client = clients.find(c => c.id === id);
        return client ? client.name : 'Desconhecido';
    };

    const getMarinaName = (id?: string) => {
        if (!id) return 'Oficina / Pátio Próprio';
        const marina = marinas.find(m => m.id === id);
        return marina ? marina.name : 'Marina Desconhecida';
    };

    const filteredBoats = boats.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.hullId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(b.clientId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!config) return <div>Carregando...</div>;

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
                                            {boat.engines.length}
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
                                            value={selectedBrand}
                                            onChange={(e) => handleBoatBrandChange(e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            {Object.keys(config.boatManufacturers).sort().map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Modelo / Tamanho</label>
                                        <select
                                            className="w-full p-2 border rounded bg-white text-slate-900"
                                            value={selectedModel}
                                            onChange={(e) => handleBoatModelChange(e.target.value)}
                                            disabled={!selectedBrand}
                                        >
                                            <option value="">Selecione...</option>
                                            {selectedBrand && config.boatManufacturers[selectedBrand]?.map((m: string) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
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
                                        onChange={e => setEditingBoat({ ...editingBoat, clientId: e.target.value })}
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
                                        onChange={e => setEditingBoat({ ...editingBoat, marinaId: e.target.value })}
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
                                                <div className="flex items-center gap-2">
                                                    <p className="font-mono text-xs text-slate-500">S/N: {eng.serialNumber} | {eng.hours} hrs</p>
                                                    <button
                                                        title="Verificar Garantia Mercury"
                                                        onClick={() => window.open(`/api/mercury/warranty/${eng.serialNumber}`, '_blank')}
                                                        className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 flex items-center gap-1"
                                                    >
                                                        <Search className="w-3 h-3" /> Check
                                                    </button>
                                                </div>
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
                                        value={selectedEngineBrand}
                                        onChange={(e) => handleEngineBrandChange(e.target.value)}
                                    >
                                        <option value="">Marca do Motor</option>
                                        {Object.keys(config.engineManufacturers).sort().map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="w-full p-1.5 text-xs border rounded bg-white text-slate-900"
                                        value={selectedEngineModel}
                                        onChange={(e) => handleEngineModelChange(e.target.value)}
                                        disabled={!selectedEngineBrand}
                                    >
                                        <option value="">Modelo / Potência</option>
                                        {selectedEngineBrand && config.engineManufacturers[selectedEngineBrand]?.map((m: string) => (
                                            <option key={m} value={m}>{m}</option>
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
                                    <div>
                                        <input
                                            placeholder="Número de Série"
                                            className="w-full p-1.5 text-sm border rounded bg-white text-slate-900"
                                            value={tempEngine.serialNumber || ''}
                                            onChange={e => setTempEngine({ ...tempEngine, serialNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-1">
                                        <input
                                            placeholder="Hrs"
                                            type="number"
                                            className="w-16 p-1.5 text-sm border rounded bg-white text-slate-900"
                                            value={tempEngine.hours || ''}
                                            onChange={e => setTempEngine({ ...tempEngine, hours: Number(e.target.value) })}
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