import React, { useState, useEffect } from 'react';
import { Marina } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, MapPin, Phone, Edit2, Anchor, Clock, AlertCircle } from 'lucide-react';

export const MarinasView: React.FC = () => {
  const [marinas, setMarinas] = useState<Marina[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMarina, setEditingMarina] = useState<Partial<Marina>>({});

  useEffect(() => {
    setMarinas(StorageService.getMarinas());
  }, []);

  const handleSave = () => {
    if (!editingMarina.name || !editingMarina.address) return;
    
    let updatedMarinas = [...marinas];
    
    if (editingMarina.id) {
      updatedMarinas = updatedMarinas.map(m => 
        m.id === editingMarina.id ? { ...m, ...editingMarina } as Marina : m
      );
    } else {
      const newMarina: Marina = {
        id: Date.now().toString(),
        name: editingMarina.name,
        address: editingMarina.address,
        contactName: editingMarina.contactName || '',
        phone: editingMarina.phone || '',
        operatingHours: editingMarina.operatingHours || 'Não informado'
      };
      updatedMarinas.push(newMarina);
    }

    setMarinas(updatedMarinas);
    StorageService.saveMarinas(updatedMarinas);
    setIsModalOpen(false);
    setEditingMarina({});
  };

  const openEdit = (marina: Marina) => {
    setEditingMarina(marina);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingMarina({});
    setIsModalOpen(true);
  };

  const filteredMarinas = marinas.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Anchor className="w-6 h-6 text-cyan-600" />
                Marinas & Locais Externos
            </h2>
            <p className="text-sm text-slate-500">Paranaguá, Pontal do Sul, Matinhos e Guaratuba</p>
        </div>
        <button 
          onClick={openNew}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nova Marina
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar marina..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredMarinas.map(marina => (
                <div key={marina.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-slate-50 relative">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800 text-lg pr-6">{marina.name}</h3>
                        <button onClick={() => openEdit(marina)} className="text-slate-400 hover:text-cyan-600 absolute top-4 right-4">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="space-y-3 text-sm text-slate-600 mt-4">
                        <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <span>{marina.address}</span>
                        </div>
                        {marina.operatingHours && (
                             <div className="flex items-start gap-2 bg-amber-50 p-2 rounded text-amber-800 border border-amber-100">
                                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span className="text-xs font-semibold">{marina.operatingHours}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                            {marina.contactName && (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="font-semibold uppercase text-slate-400">Contato:</span>
                                    <span>{marina.contactName}</span>
                                </div>
                            )}
                            {marina.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span className="font-mono text-xs">{marina.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {filteredMarinas.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-400">
                    Nenhuma marina cadastrada.
                </div>
            )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editingMarina.id ? 'Editar Marina' : 'Nova Marina'}</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nome da Marina</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={editingMarina.name || ''}
                  onChange={e => setEditingMarina({...editingMarina, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Endereço Completo</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={editingMarina.address || ''}
                  onChange={e => setEditingMarina({...editingMarina, address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nome Contato / Gerente</label>
                    <input 
                    type="text" 
                    className="w-full p-2 border rounded bg-white text-slate-900"
                    value={editingMarina.contactName || ''}
                    onChange={e => setEditingMarina({...editingMarina, contactName: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Telefone / Rádio</label>
                    <input 
                    type="text" 
                    className="w-full p-2 border rounded bg-white text-slate-900"
                    value={editingMarina.phone || ''}
                    onChange={e => setEditingMarina({...editingMarina, phone: e.target.value})}
                    />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Dias que fecha / Horário Funcionamento
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Fecha às Segundas / Aberto todos os dias 8-18h"
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={editingMarina.operatingHours || ''}
                  onChange={e => setEditingMarina({...editingMarina, operatingHours: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
              >
                Salvar Local
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};