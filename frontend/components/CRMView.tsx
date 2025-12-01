import React, { useState, useEffect } from 'react';
import { Boat, Client, ServiceOrder } from '../types';
import { StorageService } from '../services/storage';
import { Bell, Calendar, Clock, Phone, UserCheck } from 'lucide-react';

export const CRMView: React.FC = () => {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);

  useEffect(() => {
    setBoats(StorageService.getBoats());
    setClients(StorageService.getClients());
    setOrders(StorageService.getOrders());
  }, []);

  const getClient = (id: string) => clients.find(c => c.id === id);

  // Logic to find boats needing service
  // 1. Based on Engine Hours (every 100h) - Simplified simulation
  // 2. Based on Time (every 6 months)
  const maintenanceReminders = boats.map(boat => {
      const client = getClient(boat.clientId);
      const lastOrder = orders
        .filter(o => o.boatId === boat.id && o.status === 'Concluído')
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      const lastDate = lastOrder ? new Date(lastOrder.createdAt) : new Date(2023, 0, 1);
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + 6); // 6 Month rule

      const isDue = new Date() > nextDate;
      const daysOverdue = Math.floor((new Date().getTime() - nextDate.getTime()) / (1000 * 3600 * 24));

      return {
          boat,
          client,
          lastDate,
          nextDate,
          isDue,
          daysOverdue,
          hours: boat.engines[0]?.hours || 0
      };
  }).filter(r => r.isDue); // Only show those due

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-cyan-600" />
            CRM & Fidelização
        </h2>
        <p className="text-slate-500">Monitoramento de revisões preventivas e contato com clientes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-500" />
                  Revisões Vencidas (Por Data)
              </h3>
              <div className="space-y-4">
                  {maintenanceReminders.length === 0 && <p className="text-slate-400">Nenhum cliente com revisão atrasada.</p>}
                  {maintenanceReminders.map((reminder, idx) => (
                      <div key={idx} className="p-4 border border-red-100 bg-red-50 rounded-lg">
                          <div className="flex justify-between items-start">
                              <div>
                                  <h4 className="font-bold text-slate-800">{reminder.boat.name}</h4>
                                  <p className="text-sm text-slate-600">{reminder.client?.name}</p>
                              </div>
                              <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded">
                                  {reminder.daysOverdue} dias atrasado
                              </span>
                          </div>
                          <div className="mt-3 text-sm flex gap-4 text-slate-500">
                              <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Última: {reminder.lastDate.toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {reminder.hours} hrs</span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-red-200 flex justify-end">
                              <a 
                                href={`https://wa.me/55${reminder.client?.phone.replace(/\D/g,'')}`} 
                                target="_blank"
                                className="flex items-center gap-2 text-green-700 font-bold text-sm hover:underline"
                              >
                                  <Phone className="w-4 h-4" /> Contatar via WhatsApp
                              </a>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-4">Campanhas de Marketing</h3>
              <div className="p-4 bg-slate-50 rounded-lg text-center border border-slate-200 border-dashed">
                  <p className="text-slate-500 mb-2">Envie promoções de verão para toda a base.</p>
                  <button className="bg-slate-800 text-white px-4 py-2 rounded text-sm hover:bg-slate-700">
                      Criar Nova Campanha
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};