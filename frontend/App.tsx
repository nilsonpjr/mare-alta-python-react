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
import { LoginView } from './components/LoginView';
import { UsersView } from './components/UsersView';
import { MaintenanceBudgetView } from './components/MaintenanceBudgetView';
import { UserRole, User } from './types';
import { Menu, Anchor } from 'lucide-react';
import { StorageService } from './services/storage';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [viewData, setViewData] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize storage with seed data on first load
  useEffect(() => {
    StorageService.initialize();
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
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleSetView = (view: string, data?: any) => {
    setCurrentView(view);
    setViewData(data);
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  const renderContent = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'dashboard':
        return <Dashboard setView={handleSetView} />;
      case 'schedule':
        return <ScheduleView onNavigate={handleSetView} />;
      case 'clients':
        return <ClientsView />;
      case 'boats':
        return <BoatsView />;
      case 'marinas':
        return <MarinasView />;
      case 'orders':
        return <OrdersView role={UserRole.ADMIN} initialOrderId={viewData?.orderId} />;
      case 'inventory':
        return <InventoryView />;
      case 'crm':
        return <CRMView />;
      case 'maintenance-budget':
        return <MaintenanceBudgetView />;
      case 'fleet':
        return <FleetView />;
      case 'users':
        return <UsersView />;

      // Technician Views
      case 'tech-orders':
        return <OrdersView role={UserRole.TECHNICIAN} initialOrderId={viewData?.orderId} />;

      // Client Views
      case 'client-portal':
        return <OrdersView role={UserRole.CLIENT} />;
      case 'client-fleet':
        return <FleetView />;

      case 'finance':
        return <FinanceView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard setView={handleSetView} />;
    }
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 flex items-center px-4 justify-between shadow-md">
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

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 h-screen overflow-y-auto pt-16 md:pt-0 md:ml-64 transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;