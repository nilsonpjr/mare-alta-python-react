import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { OrdersView } from './components/OrdersView';
import { InventoryView } from './components/InventoryView';
import { FleetView } from './components/FleetView';
import { ClientsView } from './components/ClientsView';
import { BoatsView } from './components/BoatsView';
import { FinanceView } from './components/FinanceView';
import { MarinasView } from './components/MarinasView';
import { ScheduleView } from './components/ScheduleView';
import { SettingsView } from './components/SettingsView';
import { CRMView } from './components/CRMView';
import { FiscalView } from './components/FiscalView';
import { LoginView } from './components/LoginView';
import { UsersView } from './components/UsersView';
import { UserRole, User } from './types';
import { Menu, Anchor } from 'lucide-react';
import { ApiService } from './services/api';
import { FiscalDataPayload } from './types'; // [NEW]

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fiscalData, setFiscalData] = useState<FiscalDataPayload | null>(null); // [NEW]

  // [NEW] Check for active session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const user = await ApiService.getMe();
          if (user) {
            handleLogin(user);
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === UserRole.TECHNICIAN) {
      setCurrentView('tech-orders');
    } else if (user.role === UserRole.CLIENT) {
      setCurrentView('client-portal');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    ApiService.logout();
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleSetView = (view: string) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const handleNavigateToFiscal = (data: FiscalDataPayload) => {
    setFiscalData(data);
    setCurrentView('fiscal');
  };

  const renderContent = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'dashboard':
        return <Dashboard setView={handleSetView} />;
      case 'schedule':
        return <ScheduleView />;
      case 'clients':
        return <ClientsView />;
      case 'boats':
        return <BoatsView />;
      case 'marinas':
        return <MarinasView />;
      case 'orders':
        return <OrdersView role={UserRole.ADMIN} onNavigateToFiscal={handleNavigateToFiscal} />;
      case 'inventory':
        return <InventoryView />;
      case 'crm':
        return <CRMView />;
      case 'fleet':
        return <FleetView />;
      case 'users':
        return <UsersView />;
      case 'tech-orders':
        return <OrdersView role={UserRole.TECHNICIAN} />;
      case 'client-portal':
        return <OrdersView role={UserRole.CLIENT} />;
      case 'client-fleet':
        return <FleetView />;
      case 'finance':
        return <FinanceView />;
      case 'settings':
        return <SettingsView />;
      case 'fiscal':
        return <FiscalView initialData={fiscalData} />;
      default:
        return <Dashboard setView={handleSetView} />;
    }
  };

  // [NEW] Show loading spinner while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} setCurrentView={setCurrentView} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 flex items-center px-4 justify-between shadow-md print:hidden">
        <div className="flex items-center gap-3 text-white">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Anchor className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-wide">MARE ALTA</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <Sidebar
        currentView={currentView}
        setView={handleSetView}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 h-screen overflow-y-auto pt-16 md:pt-0 transition-all duration-300 print:h-auto print:overflow-visible">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;