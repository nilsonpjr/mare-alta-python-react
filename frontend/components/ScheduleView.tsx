
import React, { useState, useMemo, useEffect } from 'react';
import { ApiService } from '../services/api';
import { ServiceOrder, Boat, User as AppUser, OSStatus } from '../types';
import { Service, Status, Priority, Period, TimeEstimate, Technician, ExecutionMode, ServiceType } from '../types_agenda';
import { Calendar, MapPin, ChevronLeft, ChevronRight, AlertCircle, Edit2, Sun, Sunset, Moon, Plus, RotateCcw, Link, Star, CheckCircle2, User as UserIcon, Filter, X, ClipboardList, Printer, Clock, Tag, Loader2 } from 'lucide-react';

// --- HELPERS ---

const getPriorityColor = (p: Priority) => {
    switch (p) {
        case Priority.HIGH: return 'bg-red-50 text-red-700 border-red-200';
        case Priority.MEDIUM: return 'bg-amber-50 text-amber-700 border-amber-200';
        case Priority.LOW: return 'bg-blue-50 text-blue-700 border-blue-200';
        default: return 'bg-gray-50 text-gray-700';
    }
};

const getStatusColor = (s: Status) => {
    switch (s) {
        case Status.DONE: return 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100';
        case Status.IN_PROGRESS: return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
        default: return 'bg-white border-gray-200 hover:border-blue-300';
    }
}

const mapOSStatusToAgendaStatus = (status: OSStatus): Status => {
    if (status === OSStatus.COMPLETED) return Status.DONE;
    if (status === OSStatus.IN_PROGRESS) return Status.IN_PROGRESS;
    return Status.TODO;
}

const mapAgendaStatusToOSStatus = (status: Status): OSStatus => {
    if (status === Status.DONE) return OSStatus.COMPLETED;
    if (status === Status.IN_PROGRESS) return OSStatus.IN_PROGRESS;
    return OSStatus.PENDING; // or APPROVED? Keeping simple.
}

const estimateToNumber = (est: TimeEstimate): number => {
    // Map text to hours (approx)
    if (est === TimeEstimate.HOUR_1) return 1;
    if (est === TimeEstimate.HOUR_2) return 2;
    if (est === TimeEstimate.HALF_DAY) return 4;
    if (est === TimeEstimate.ONE_DAY) return 8;
    return 1;
}

const numberToEstimate = (num: number): TimeEstimate => {
    if (num <= 1) return TimeEstimate.HOUR_1;
    if (num <= 2) return TimeEstimate.HOUR_2;
    if (num <= 4) return TimeEstimate.HALF_DAY;
    if (num >= 8) return TimeEstimate.ONE_DAY;
    return TimeEstimate.HOUR_1;
}

// --- COMPONENTS ---

interface ServiceCardProps {
    service: Service;
    segmentIndex?: number;
    isPrimary?: boolean;
    onDragStart?: (e: React.DragEvent, serviceId: string, segmentIndex: number) => void;
    onEdit?: (service: Service) => void;
    onClick?: (service: Service) => void;
    technician?: Technician;
    isPrintMode?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
    service,
    segmentIndex = 0,
    isPrimary = true,
    onDragStart,
    onEdit,
    onClick,
    technician,
    isPrintMode = false
}) => {
    const isDone = service.status === Status.DONE;

    return (
        <div
            draggable={!isPrintMode}
            onDragStart={(e) => onDragStart && onDragStart(e, service.id, segmentIndex || 0)}
            onClick={() => onClick && onClick(service)}
            className={`
                border rounded p-2 shadow-sm relative mb-2 select-none
                ${getStatusColor(service.status)}
                ${isDone ? 'opacity-80' : ''}
                ${isPrintMode ? 'border-gray-300 text-xs p-1 mb-1 print:break-inside-avoid' : 'transition-all cursor-pointer group'}
            `}
            style={{
                borderLeftWidth: '4px',
                borderLeftColor: technician ? technician.color : (isPrimary ? '#0284c7' : '#7dd3fc')
            }}
        >
            <div className="flex justify-between items-start mb-0.5">
                <div className="flex items-center gap-1">
                    {isDone ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded flex items-center border border-emerald-200 font-bold print:border-gray-300 print:text-black">
                            {isPrintMode ? '(OK)' : <CheckCircle2 className="w-2 h-2 mr-1" />}
                            {!isPrintMode && 'Concluído'}
                        </span>
                    ) : isPrimary ? (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded flex items-center border border-yellow-200 font-bold print:border-gray-300 print:text-black">
                            {isPrintMode ? '★' : <Star className="w-2 h-2 mr-1 fill-yellow-500" />}
                            {!isPrintMode && 'Principal'}
                        </span>
                    ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1 rounded flex items-center border border-gray-200 print:border-gray-300 print:text-black">
                            {isPrintMode ? '↳' : <Link className="w-2 h-2 mr-1" />}
                            {!isPrintMode && 'Continuação'}
                        </span>
                    )}
                </div>
                {technician && (
                    <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm print:text-black print:border print:border-black"
                        style={{ backgroundColor: isPrintMode ? 'white' : technician.color }}
                        title={technician.name}
                    >
                        {technician.initials}
                    </div>
                )}
            </div>

            <h4 className={`font-semibold leading-tight mb-1 truncate ${isDone ? 'text-emerald-900 line-through' : 'text-gray-800'} ${isPrintMode ? 'text-[10px]' : 'text-xs'}`}>
                {service.serviceName}
            </h4>

            <div className="flex items-center justify-between mt-1">
                <div className="flex items-center text-[10px] text-gray-500">
                    {!isPrintMode && <MapPin className="w-3 h-3 mr-1" />}
                    <span className="truncate max-w-[80px] print:max-w-none font-medium text-gray-900">{service.location}</span>
                </div>
                {!isDone && !isPrintMode && (
                    <span className={`text-[9px] uppercase font-bold px-1 py-0.5 rounded border ${getPriorityColor(service.priority)}`}>
                        {service.priority}
                    </span>
                )}
            </div>
        </div>
    );
};

interface ServiceDetailsModalProps {
    service: Service;
    onClose: () => void;
    onEdit: (service: Service) => void;
    techs: Technician[];
}

const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({ service, onClose, onEdit, techs }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{service.serviceName}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${service.status === Status.DONE
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : service.status === Status.IN_PROGRESS
                                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                                    : 'bg-amber-100 text-amber-800 border-amber-200'
                                }`}>
                                {service.status}
                            </span>
                            {service.defaultTechnicianId && (
                                <span className="text-xs text-gray-500 flex items-center">
                                    <UserIcon className="w-3 h-3 mr-1" />
                                    {techs.find(t => t.id === service.defaultTechnicianId)?.name || 'Técnico'}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> Local</span>
                            <span className="font-medium text-gray-800">{service.location}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1" /> Duração Estimada</span>
                            <span className="font-medium text-gray-800">{service.timeEstimate}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 mb-1 flex items-center"><Tag className="w-3 h-3 mr-1" /> Tipo</span>
                            <span className="font-medium text-gray-800">{service.type}</span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <span className="text-xs text-gray-500 mb-1 block">Modo de Execução</span>
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">{service.execution}</span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="text-xs text-gray-500 mb-1 block font-medium">Observações</span>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {service.observations || "Nenhuma observação registrada."}
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 mt-auto">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition">
                        Fechar
                    </button>
                    <button
                        onClick={() => { onClose(); onEdit(service); }}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
                    >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Ver Detalhes na OS
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SCHEDULE VIEW (AGENDA) ---

interface ScheduleViewProps {
    onNavigate?: (view: string, data?: any) => void;
}

export function ScheduleView({ onNavigate }: ScheduleViewProps) {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [boats, setBoats] = useState<Boat[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    const [startDate, setStartDate] = useState(new Date());
    const [visibleDays, setVisibleDays] = useState(21);
    const [isBacklogOpen, setIsBacklogOpen] = useState(window.innerWidth >= 768);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const [techs, setTechs] = useState<Technician[]>([]);
    const [techFilter, setTechFilter] = useState<string>('ALL');

    useEffect(() => {
        loadData();
        const handleResize = () => {
            setIsBacklogOpen(window.innerWidth >= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, boatsData] = await Promise.all([
                ApiService.getOrders(),
                ApiService.getBoats()
            ]);
            setOrders(ordersData);
            setBoats(boatsData);

            // Mock Technicians
            const mockTechs: Technician[] = [
                { id: '1', name: 'Carlos (Líder)', color: '#ef4444', initials: 'CA' },
                { id: '2', name: 'João (Mecânico)', color: '#3b82f6', initials: 'JO' },
                { id: '3', name: 'Maria (Elétrica)', color: '#10b981', initials: 'MA' }
            ];
            setTechs(mockTechs);

            // Convert Orders to Services
            const mappedServices = ordersData.map(order => {
                const boat = boatsData.find(b => b.id === order.boatId);
                const boatName = boat ? boat.name : `Barco #${order.boatId}`;

                let scheduledDate = order.scheduledAt ? order.scheduledAt.split('T')[0] : undefined;

                return {
                    id: order.id.toString(),
                    serviceName: `${boatName} - ${order.description.substring(0, 30)}...`,
                    type: ServiceType.MECHANICS,
                    timeEstimate: numberToEstimate(order.estimatedDuration || 1),
                    location: 'Marina Verolme',
                    execution: ExecutionMode.BOTH,
                    priority: Priority.MEDIUM,
                    status: mapOSStatusToAgendaStatus(order.status),
                    observations: order.diagnosis || order.description,
                    scheduledDate: scheduledDate,
                    scheduledPeriod: Period.MORNING,
                    defaultTechnicianId: '1',
                    createdAt: new Date(order.createdAt).getTime(),
                } as Service;
            });
            setServices(mappedServices);

        } catch (error) {
            console.error("Erro ao carregar dados da agenda:", error);
        } finally {
            setLoading(false);
        }
    };

    const toISODate = (d: Date) => d.toISOString().split('T')[0];
    const addDays = (d: Date, days: number) => {
        const result = new Date(d);
        result.setDate(result.getDate() + days);
        return result;
    };

    const weekDays = useMemo(() => {
        const days: Date[] = [];
        let current = new Date(startDate);
        if (current.getDay() === 0) current.setDate(current.getDate() + 1);

        while (days.length < visibleDays) {
            if (current.getDay() !== 0) days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return days;
    }, [startDate, visibleDays]);

    const printWeekDays = useMemo(() => weekDays.slice(0, 6), [weekDays]);
    const periods = [Period.MORNING, Period.AFTERNOON, Period.NIGHT];

    const getDurationSlots = (estimate: TimeEstimate): number => {
        if (estimate === TimeEstimate.ONE_DAY) return 2;
        if (estimate === TimeEstimate.TWO_DAYS) return 4;
        return 1;
    };

    const getServiceAllocations = (service: Service) => {
        if (!service.scheduledDate) return [];
        return [{
            index: 0,
            date: service.scheduledDate,
            period: service.scheduledPeriod || Period.MORNING,
            isPrimary: true,
            technicianId: service.defaultTechnicianId
        }];
    };

    const handleDragStart = (e: React.DragEvent, serviceId: string, segmentIndex: number = 0) => {
        e.dataTransfer.setData("application/json", JSON.stringify({ serviceId, segmentIndex }));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, targetDate: string | undefined, targetPeriod: Period | undefined) => {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData("application/json");
        if (!dataStr) return;

        try {
            const { serviceId, segmentIndex } = JSON.parse(dataStr);
            const service = services.find(s => s.id === serviceId);

            if (service) {
                const updatedServices = services.map(s => {
                    if (s.id === serviceId) {
                        return { ...s, scheduledDate: targetDate, scheduledPeriod: targetPeriod || Period.MORNING };
                    }
                    return s;
                });
                setServices(updatedServices);

                const orderIdInt = parseInt(serviceId);
                if (!isNaN(orderIdInt)) {
                    await ApiService.updateOrder(orderIdInt, {
                        scheduledAt: targetDate ? `${targetDate}T09:00:00` : undefined,
                        status: targetDate ? OSStatus.IN_PROGRESS : OSStatus.PENDING
                    });
                }
            }
        } catch (err) {
            console.error("Drop failed", err);
        }
    };

    const getPeriodIcon = (p: Period) => {
        switch (p) {
            case Period.MORNING: return <Sun className="w-3 h-3 text-amber-500" />;
            case Period.AFTERNOON: return <Sunset className="w-3 h-3 text-orange-500" />;
            case Period.NIGHT: return <Moon className="w-3 h-3 text-indigo-400" />;
        }
    }

    const getPeriodBg = (p: Period) => {
        switch (p) {
            case Period.MORNING: return 'bg-amber-50/50';
            case Period.AFTERNOON: return 'bg-orange-50/50';
            case Period.NIGHT: return 'bg-indigo-50/50';
        }
    }

    const handlePrint = () => { window.print(); }

    const activeServices = services;
    const backlog = services.filter(s => !s.scheduledDate && s.status !== Status.DONE);
    const currentTechName = techFilter === 'ALL' ? 'Geral' : techs.find(t => t.id === techFilter)?.name || 'Técnico';

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="flex flex-col h-full space-y-4 relative w-full bg-white">

            {/* PRINT VIEW */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-4 text-sm">
                {/* Print Header */}
                <div className="mb-4 border-b pb-2 flex justify-between items-center">
                    <h1 className="text-xl font-bold">Agenda Mare Alta</h1>
                    <span>{new Date().toLocaleDateString()}</span>
                </div>
                {/* Simplified Print Grid */}
                <div className="grid grid-cols-6 border border-gray-300">
                    {printWeekDays.map(d => (
                        <div key={d.toString()} className="border p-2">{d.toLocaleDateString()}</div>
                    ))}
                </div>
                {/* NOTE: Print view simplified for complexity reasons */}
            </div>

            {selectedService && (
                <ServiceDetailsModal
                    service={selectedService}
                    onClose={() => setSelectedService(null)}
                    onEdit={(s) => {
                        if (onNavigate) {
                            onNavigate('orders', { orderId: s.id });
                        }
                    }}
                    techs={techs}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex-shrink-0 gap-4 print:hidden">
                <div className="flex items-center w-full md:w-auto">
                    <Calendar className="mr-3 text-blue-600 h-6 w-6" />
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Linha do Tempo</h2>
                        <p className="text-xs text-gray-500 hidden md:block">Gestão visual de serviços</p>
                    </div>
                </div>

                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1 w-full md:w-auto">
                    <div className="px-2 text-gray-400"><Filter className="w-4 h-4" /></div>
                    <select
                        value={techFilter}
                        onChange={(e) => setTechFilter(e.target.value)}
                        className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 w-full"
                    >
                        <option value="ALL">Todos os Técnicos</option>
                        {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto justify-center">
                    <button onClick={handlePrint} className="px-3 py-2 text-sm text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg flex items-center mr-2 transition">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </button>
                    <button onClick={() => setStartDate(new Date())} className="px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center mr-2 transition">
                        <RotateCcw className="w-4 h-4 mr-1" /> Hoje
                    </button>
                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1">
                        <button onClick={() => setStartDate(addDays(startDate, -7))} className="p-1.5 hover:bg-white rounded"><ChevronLeft className="w-5 h-5" /></button>
                        <span className="font-medium text-gray-700 min-w-[120px] text-center text-sm px-2">
                            {startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                        <button onClick={() => setStartDate(addDays(startDate, 7))} className="p-1.5 hover:bg-white rounded"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative print:hidden">
                {/* Backlog Toggle Mobile */}
                <button
                    onClick={() => setIsBacklogOpen(!isBacklogOpen)}
                    className="md:hidden fixed bottom-6 left-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg flex items-center gap-2"
                >
                    {isBacklogOpen ? <X className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                </button>

                {/* Backlog Sidebar */}
                <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, undefined, undefined)}
                    className={`
                fixed md:sticky md:static top-0 left-0 h-full z-40 
                bg-gray-100 border-r border-gray-200 
                flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-xl
                w-64 md:w-[260px] md:min-w-[260px] md:rounded-xl md:border md:mb-4
                ${isBacklogOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}
                >
                    <div className="p-3 border-b border-gray-200 bg-gray-200 md:rounded-t-xl flex justify-between items-center sticky top-0 z-10">
                        <span className="font-bold text-gray-700 flex items-center text-sm">
                            <AlertCircle className="w-4 h-4 mr-2" /> A Agendar
                        </span>
                        <span className="bg-gray-300 text-gray-600 text-xs px-2 py-0.5 rounded-full">{backlog.length}</span>
                    </div>
                    <div className="p-2 overflow-y-auto flex-1 bg-gray-100">
                        {backlog.map(service => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                onDragStart={handleDragStart}
                                onClick={setSelectedService}
                                technician={techs.find(t => t.id === service.defaultTechnicianId)}
                            />
                        ))}
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 flex overflow-x-auto pb-4 gap-4 scroll-smooth pl-4">
                    {weekDays.map((date) => {
                        const dateStr = toISODate(date);
                        const isToday = toISODate(new Date()) === dateStr;
                        return (
                            <div
                                key={dateStr}
                                className={`min-w-[280px] w-[280px] flex-shrink-0 rounded-xl flex flex-col border transition-colors h-full ${isToday ? 'bg-blue-50/30 border-blue-200 shadow-md ring-1 ring-blue-100' : 'bg-white border-gray-200'
                                    }`}
                            >
                                <div className={`p-2 border-b rounded-t-xl text-center sticky top-0 z-10 ${isToday ? 'bg-blue-100 border-blue-200' : 'bg-white/95 backdrop-blur border-gray-200'}`}>
                                    <span className={`block text-[10px] font-bold uppercase ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                    </span>
                                    <span className={`text-sm font-bold ${isToday ? 'text-blue-800' : 'text-gray-700'}`}>
                                        {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                    </span>
                                </div>

                                <div className="flex-1 flex flex-col divide-y divide-gray-100 overflow-y-auto">
                                    {periods.map(period => {
                                        // Find services for this slot
                                        const slotItems = activeServices.flatMap(service => {
                                            const allocations = getServiceAllocations(service);
                                            return allocations
                                                .filter(alloc => alloc.date === dateStr && alloc.period === period)
                                                .map(alloc => ({ service, ...alloc }));
                                        }).filter(item => techFilter === 'ALL' || item.technicianId === techFilter);

                                        return (
                                            <div
                                                key={period}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, dateStr, period)}
                                                className={`flex-1 p-2 min-h-[140px] flex flex-col transition-colors ${getPeriodBg(period)} hover:bg-opacity-80`}
                                            >
                                                <div className="flex items-center space-x-1 mb-2 opacity-50 select-none">
                                                    {getPeriodIcon(period)}
                                                    <span className="text-[10px] uppercase font-bold text-gray-500">{period}</span>
                                                </div>

                                                <div className="flex-1 space-y-2">
                                                    {slotItems.map(item => (
                                                        <ServiceCard
                                                            key={`${item.service.id}-${item.index}`}
                                                            service={item.service}
                                                            segmentIndex={item.index}
                                                            isPrimary={item.isPrimary}
                                                            onDragStart={handleDragStart}
                                                            onClick={setSelectedService}
                                                            technician={techs.find(t => t.id === item.technicianId)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}