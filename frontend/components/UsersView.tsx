import React, { useState, useEffect } from 'react';
import { User, UserRole, Client } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, Trash, Edit2, Shield, UserCircle, Briefcase } from 'lucide-react';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  useEffect(() => {
    setUsers(StorageService.getUsers());
    setClients(StorageService.getClients());
  }, []);

  const handleSave = () => {
    if (!editingUser.name || !editingUser.email || !editingUser.password || !editingUser.role) return;
    
    let updatedUsers = [...users];
    
    // Ensure clientId is undefined if empty string
    const finalClientId = editingUser.clientId === '' ? undefined : editingUser.clientId;

    if (editingUser.id) {
      updatedUsers = updatedUsers.map(u => 
        u.id === editingUser.id ? { ...u, ...editingUser, clientId: finalClientId } as User : u
      );
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: editingUser.name,
        email: editingUser.email,
        password: editingUser.password,
        role: editingUser.role,
        clientId: finalClientId
      };
      updatedUsers.push(newUser);
    }

    setUsers(updatedUsers);
    StorageService.saveUsers(updatedUsers);
    setIsModalOpen(false);
    setEditingUser({});
  };

  const handleDelete = (id: string) => {
      if(!window.confirm("Tem certeza que deseja excluir este usuário?")) return;
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      StorageService.saveUsers(updated);
  };

  const openNew = () => {
      setEditingUser({ role: UserRole.TECHNICIAN });
      setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
      setEditingUser(user);
      setIsModalOpen(true);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    switch(role) {
        case UserRole.ADMIN: return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Shield className="w-3 h-3"/> Admin</span>;
        case UserRole.TECHNICIAN: return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Briefcase className="w-3 h-3"/> Técnico</span>;
        default: return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><UserCircle className="w-3 h-3"/> Cliente</span>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Usuários do Sistema</h2>
            <p className="text-slate-500 text-sm">Gerencie o acesso de administradores, técnicos e clientes.</p>
        </div>
        <button 
          onClick={openNew}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..." 
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
              <th className="px-6 py-4">Email (Login)</th>
              <th className="px-6 py-4">Função</th>
              <th className="px-6 py-4">Vínculo (Cliente)</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                <td className="px-6 py-4 text-slate-500 font-mono">{user.email}</td>
                <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                    {user.role === UserRole.CLIENT && user.clientId ? (
                        clients.find(c => c.id === user.clientId)?.name || 'Cliente Removido'
                    ) : '-'}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                   <button onClick={() => openEdit(user)} className="text-slate-400 hover:text-cyan-600 transition-colors">
                       <Edit2 className="w-4 h-4" />
                   </button>
                   <button onClick={() => handleDelete(user.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                       <Trash className="w-4 h-4" />
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
            <h3 className="text-lg font-bold mb-4">{editingUser.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={editingUser.name || ''}
                  onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email (Login)</label>
                <input 
                  type="email" 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={editingUser.email || ''}
                  onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Senha</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded font-mono bg-white text-slate-900"
                  value={editingUser.password || ''}
                  onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Acesso</label>
                <select 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={editingUser.role}
                  onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                >
                    <option value={UserRole.ADMIN}>Administrador (Acesso Total)</option>
                    <option value={UserRole.TECHNICIAN}>Técnico (Acesso Operacional)</option>
                    <option value={UserRole.CLIENT}>Cliente (Portal Externo)</option>
                </select>
              </div>
              
              {editingUser.role === UserRole.CLIENT && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Vincular ao Cadastro de Cliente</label>
                    <select 
                      className="w-full p-2 border rounded bg-white text-slate-900"
                      value={editingUser.clientId || ''}
                      onChange={e => setEditingUser({...editingUser, clientId: e.target.value})}
                    >
                        <option value="">Selecione...</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>
              )}
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