import React from 'react';
// Importa ícones para o menu
import { LayoutDashboard, Wrench, Anchor, Package, DollarSign, Users, Ship, Calendar, MapPin, Settings, UserCheck, ClipboardList, LogOut, ChevronRight, X, FileText } from 'lucide-react';
// Importa tipos de usuário
import { UserRole, User } from '../types';

// Define as propriedades que o Sidebar recebe
interface SidebarProps {
  currentView: string;              // Qual tela está ativa agora
  setView: (view: string) => void;  // Função para mudar a tela
  currentUser: User;                // Usuário logado
  onLogout: () => void;             // Função de logout
  isOpen: boolean;                  // Se o menu está aberto (mobile)
  onClose: () => void;              // Função para fechar o menu
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, currentUser, onLogout, isOpen, onClose }) => {
  const role = currentUser.role;
  let menuItems = [];

  // Define os itens do menu baseados no cargo (Role) do usuário
  if (role === UserRole.ADMIN) {
    // Menu do Administrador (acesso total)
    menuItems = [
      { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
      { id: 'schedule', label: 'Agenda', icon: Calendar },
      { id: 'orders', label: 'Ordens de Serviço', icon: Wrench },
      { id: 'crm', label: 'CRM & Fidelização', icon: UserCheck },
      { id: 'sep1', type: 'separator', label: 'Gestão' }, // Separador visual
      { id: 'clients', label: 'Clientes', icon: Users },
      { id: 'boats', label: 'Embarcações', icon: Ship },
      { id: 'marinas', label: 'Marinas & Locais', icon: MapPin },
      { id: 'sep2', type: 'separator', label: 'Administrativo' },
      { id: 'inventory', label: 'Estoque', icon: Package },
      { id: 'fiscal', label: 'Fiscal (NF-e/NFS-e)', icon: FileText },
      { id: 'finance', label: 'Financeiro', icon: DollarSign },
      { id: 'users', label: 'Usuários', icon: Users },
      { id: 'settings', label: 'Configurações', icon: Settings },
    ];
  } else if (role === UserRole.TECHNICIAN) {
    // Menu do Técnico (focado em serviços)
    menuItems = [
      { id: 'tech-orders', label: 'Meus Serviços', icon: ClipboardList },
      { id: 'schedule', label: 'Minha Agenda', icon: Calendar },
    ];
  } else {
    // Menu do Cliente
    menuItems = [
      { id: 'client-portal', label: 'Minhas Solicitações', icon: Wrench },
      { id: 'client-fleet', label: 'Minha Frota', icon: Anchor },
    ];
  }

  // Função auxiliar para definir a cor e texto do crachá do usuário
  const getRoleBadge = () => {
    switch (role) {
      case UserRole.ADMIN: return { bg: 'bg-red-500', label: 'Admin' };
      case UserRole.TECHNICIAN: return { bg: 'bg-emerald-500', label: 'Técnico' };
      default: return { bg: 'bg-blue-500', label: 'Cliente' };
    }
  };

  const badge = getRoleBadge();

  return (
    <>
      {/* Container da Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-slate-800 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} // Controla visibilidade no mobile
        md:translate-x-0 md:static md:h-screen // No desktop (md), sempre visível e estático
        print:hidden
      `}>
        {/* Cabeçalho da Sidebar (Logo) */}
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/50">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide">MARE ALTA</h1>
              <p className="text-[10px] text-cyan-400 font-medium tracking-wider uppercase">Manager System</p>
            </div>
          </div>
          {/* Botão fechar (só mobile) */}
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Lista de Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {menuItems.map((item, idx) => {
            // Renderiza separador
            if (item.type === 'separator') {
              return (
                <div key={`sep-${idx}`} className="pt-5 pb-2 px-3">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
                </div>
              );
            }

            // Renderiza item de menu
            const Icon = item.icon;
            const isActive = currentView === item.id; // Verifica se é a tela atual
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30' // Estilo ativo
                  : 'hover:bg-slate-800/50 hover:text-white text-slate-400' // Estilo inativo
                  }`}
              >
                {/* Efeito de brilho no ativo */}
                {isActive && <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>}

                <div className="flex items-center relative z-10">
                  <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                  <span className={`font-medium text-sm ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                </div>
                {/* Seta indicativa no ativo */}
                {isActive && <ChevronRight className="w-3 h-3 text-cyan-200 relative z-10" />}
              </button>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar (Perfil do Usuário e Logout) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
            {/* Avatar com inicial */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ${badge.bg}`}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-white truncate">{currentUser.name.split(' ')[0]}</p>
              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${badge.bg}`}></span>
                {badge.label}
              </p>
            </div>
          </div>
          {/* Botão Logout */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-red-900/30 hover:border-red-900/50 border border-transparent rounded transition-all"
          >
            <LogOut className="w-3 h-3 mr-2" />
            Encerrar Sessão
          </button>
        </div>
      </div>
    </>
  );
};