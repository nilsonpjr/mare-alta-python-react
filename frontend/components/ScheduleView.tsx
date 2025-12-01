import React, { useState, useEffect, useMemo } from 'react';
import { ServiceOrder, OSStatus, Boat, Marina } from '../types';
import { StorageService } from '../services/storage';
import { GeminiService } from '../services/geminiService';
import { Calendar as CalendarIcon, Clock, MapPin, Anchor, User, ChevronLeft, ChevronRight, Briefcase, Truck, Wand2 } from 'lucide-react';

export const ScheduleView: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [marinas, setMarinas] = useState<Marina[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [optimizationResult, setOptimizationResult] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    setOrders(StorageService.getOrders());
    setBoats(StorageService.getBoats());
    setMarinas(StorageService.getMarinas());
  }, []);

  const getLocationInfo = (boatId: string) => {
    const boat = boats.find(b => b.id === boatId);
    if (!boat) return { name: 'Desconhecido', type: 'UNKNOWN' };
    
    if (boat.marinaId) {
        const marina = marinas.find(m => m.id === boat.marinaId);
        return { name: marina?.name || 'Marina não encontrada', type: 'MARINA' };
    }
    return { name: 'Oficina Mare Alta (Interno)', type: 'SHOP' };
  };

  const getBoatName = (id: string) => boats.find(b => b.id === id)?.name || 'Desconhecido';

  const weekDays = useMemo(() => {
    const days = [];
    const start = new Date(selectedDate);
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
    }
    return days;
  }, [selectedDate]);

  const getOrdersForDay = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return orders.filter(o => 
        o.scheduledAt && 
        o.scheduledAt.startsWith(dateStr) && 
        o.status !== OSStatus.COMPLETED && 
        o.status !== OSStatus.CANCELED
      ).sort((a, b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || ''));
  };

  const handleDateShift = (days: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + days);
      setSelectedDate(newDate);
  };

  const updateSchedule = (orderId: string, dateStr: string, timeStr: string) => {
      const newDateTime = `${dateStr}T${timeStr}:00.000Z`;
      const updatedOrders = orders.map(o => o.id === orderId ? { ...o, scheduledAt: newDateTime } : o);
      setOrders(updatedOrders);
      StorageService.saveOrders(updatedOrders);
  };

  const optimizeDailyRoute = async () => {
      // Get unique locations for today (first day of view)
      const todayOrders = getOrdersForDay(weekDays[0]);
      const locations = new Set<string>();
      
      todayOrders.forEach(o => {
          const loc = getLocationInfo(o.boatId);
          if(loc.type === 'MARINA') locations.add(loc.name);
      });

      if(locations.size < 2) {
          alert("Adicione pelo menos 2 visitas externas hoje para otimizar.");
          return;
      }

      setIsOptimizing(true);
      const result = await GeminiService.optimizeRoute(Array.from(locations));
      setOptimizationResult(result);
      setIsOptimizing(false);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-cyan-600" />
                Agenda de Serviços
            </h2>
            <p className="text-sm text-slate-500">Planejamento semanal de técnicos e deslocamentos.</p>
        </div>
        
        <div className="flex gap-4">
             {/* AI Optimization Button */}
            <button 
                onClick={optimizeDailyRoute}
                disabled={isOptimizing}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-purple-700 disabled:opacity-50"
            >
                {isOptimizing ? <Wand2 className="w-4 h-4 animate-spin"/> : <Truck className="w-4 h-4" />}
                Otimizar Rota (IA)
            </button>

            <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm">
                <button onClick={() => handleDateShift(-7)} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-5 h-5"/></button>
                <span className="font-medium text-slate-700 min-w-[150px] text-center">
                    {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
                </span>
                <button onClick={() => handleDateShift(7)} className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-5 h-5"/></button>
            </div>
        </div>
      </div>
      
      {optimizationResult && (
          <div className="mb-6 bg-purple-50 border border-purple-200 p-4 rounded-lg relative">
              <h4 className="font-bold text-purple-800 flex items-center gap-2 mb-2">
                  <Wand2 className="w-4 h-4"/> Sugestão de Logística Inteligente
              </h4>
              <p className="text-sm text-purple-900 whitespace-pre-wrap">{optimizationResult}</p>
              <button onClick={() => setOptimizationResult('')} className="absolute top-2 right-2 text-purple-400 hover:text-purple-700">x</button>
          </div>
      )}

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Weekly Calendar Grid */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {weekDays.map((day, i) => (
                    <div key={i} className={`p-3 text-center border-r border-slate-100 last:border-0 ${day.toDateString() === new Date().toDateString() ? 'bg-cyan-50' : ''}`}>
                        <p className="text-xs font-bold text-slate-400 uppercase">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                        <p className={`text-sm font-bold ${day.toDateString() === new Date().toDateString() ? 'text-cyan-700' : 'text-slate-700'}`}>
                            {day.getDate()}
                        </p>
                    </div>
                ))}
            </div>
            <div className="flex-1 grid grid-cols-7 overflow-y-auto">
                {weekDays.map((day, i) => {
                    const dayOrders = getOrdersForDay(day);
                    return (
                        <div key={i} className={`border-r border-slate-100 last:border-0 min-h-[200px] p-2 space-y-2 ${day.toDateString() === new Date().toDateString() ? 'bg-cyan-50/30' : ''}`}>
                             {dayOrders.map(order => {
                                 const loc = getLocationInfo(order.boatId);
                                 const time = order.scheduledAt ? new Date(order.scheduledAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '';
                                 return (
                                     <div key={order.id} className="bg-white border border-l-4 border-slate-200 border-l-cyan-500 rounded p-2 shadow-sm text-xs cursor-pointer hover:ring-1 hover:ring-cyan-300">
                                         <div className="flex justify-between font-bold text-slate-700 mb-1">
                                             <span>{time}</span>
                                             <span>{order.estimatedDuration}h</span>
                                         </div>
                                         <div className="font-semibold truncate mb-1" title={getBoatName(order.boatId)}>{getBoatName(order.boatId)}</div>
                                         <div className="flex items-center gap-1 text-slate-500 truncate" title={loc.name}>
                                             {loc.type === 'MARINA' ? <Anchor className="w-3 h-3 text-blue-500"/> : <Briefcase className="w-3 h-3 text-orange-500"/>}
                                             {loc.name}
                                         </div>
                                     </div>
                                 )
                             })}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};