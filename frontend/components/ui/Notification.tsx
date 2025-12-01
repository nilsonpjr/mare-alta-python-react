import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
}

interface NotificationContextType {
    showNotification: (type: NotificationType, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = useCallback((type: NotificationType, message: string) => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, type, message }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    }, []);

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {notifications.map(notification => (
                    <div
                        key={notification.id}
                        className={`
              pointer-events-auto min-w-[300px] max-w-md p-4 rounded-xl shadow-lg border flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-right-full
              ${notification.type === 'success' ? 'bg-white border-emerald-100 text-emerald-800 shadow-emerald-100/50' : ''}
              ${notification.type === 'error' ? 'bg-white border-red-100 text-red-800 shadow-red-100/50' : ''}
              ${notification.type === 'info' ? 'bg-white border-blue-100 text-blue-800 shadow-blue-100/50' : ''}
            `}
                    >
                        <div className={`
              mt-0.5 p-1 rounded-full
              ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : ''}
              ${notification.type === 'error' ? 'bg-red-100 text-red-600' : ''}
              ${notification.type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
            `}>
                            {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
                            {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
                            {notification.type === 'info' && <Info className="w-4 h-4" />}
                        </div>
                        <p className="text-sm font-medium flex-1">{notification.message}</p>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
