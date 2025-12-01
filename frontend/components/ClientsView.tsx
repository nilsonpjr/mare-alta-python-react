import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, Building2, User, Landmark, Edit2, Phone, Mail } from 'lucide-react';

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client>>({});

  useEffect(() => {
    setClients(StorageService.getClients());
  }, []);

  const handleSave = () => {
    if (!editingClient.name || !editingClient.document) return;
    
    let updatedClients = [...clients];
    
    if (editingClient.id) {
      // Update existing
      updatedClients = updatedClients.map(c => 
        c.id === editingClient.id ? { ...c, ...editingClient } as Client : c
      );
    } else {
      // Create new
      const newClient: Client = {
        id: Date.now().toString(),
        name: editingClient.name,
        document: editingClient.document,
        phone: editingClient.phone || '',
        email: editingClient.email || '',
        address: editingClient.address || '',
        type: editingClient.type || 'PARTICULAR'
      };
      updatedClients.push(newClient);
    }

    setClients(updatedClients);
    StorageService.saveClients(updatedClients);
    setIsModalOpen(false);
    setEditingClient({});
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingClient({ type: 'PARTICULAR' });
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.document.includes(searchTerm)
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'GOVERNO': return <Landmark className="w-4 h-4 text-blue-600" />;
      case 'EMPRESA': return <Building2 className="w-4 h-4 text-purple-600" />;
      default: return <User className="w-4 h-4 text-green-600" />;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
        <button 
          onClick={openNew}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou CPF/CNPJ..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Documento</th>
              <th className="px-6 py-4">Contato</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{client.name}</td>
                <td className="px-6 py-4 font-mono text-slate-500">{client.document}</td>
                <td className="px-6 py-4 text-slate-600">
                    <div className="flex flex-col text-xs gap-1">
                        <div className="flex items-center gap-2"><Phone className="w-3 h-3"/> {client.phone}</div>
                        <div className="flex items-center gap-2"><Mail className="w-3 h-3"/> {client.email}</div>
                    </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2 border px-2 py-1 rounded-full w-fit bg-slate-50 border-slate-200 text-xs font-medium">
                       {getTypeIcon(client.type)}
                       {client.type}
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                   <button onClick={() => openEdit(client)} className="text-slate-400 hover:text-cyan-600 transition-colors">
                       <Edit2 className="w-4 h-4" />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editingClient.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={editingClient.name || ''}
                  onChange={e => setEditingClient({...editingClient, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
                <select 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={editingClient.type || 'PARTICULAR'}
                  onChange={e => setEditingClient({...editingClient, type: e.target.value as any})}
                >
                    <option value="PARTICULAR">Particular (PF)</option>
                    <option value="EMPRESA">Empresa (PJ)</option>
                    <option value="GOVERNO">Governo/Militar</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Documento (CPF/CNPJ)</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={editingClient.document || ''}
                  onChange={e => setEditingClient({...editingClient, document: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Telefone</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={editingClient.phone || ''}
                  onChange={e => setEditingClient({...editingClient, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={editingClient.email || ''}
                  onChange={e => setEditingClient({...editingClient, email: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Endereço</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={editingClient.address || ''}
                  onChange={e => setEditingClient({...editingClient, address: e.target.value})}
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
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};