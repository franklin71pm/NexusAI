

import React from 'react';
// Fix: Import types from the centralized types.ts file
import { Notification, NotificationType, Document, Task, CalendarEvent } from '../types';
import { useApp } from '../contexts/AppContext';

interface NotificationCenterProps {
  notifications: Notification[];
  onClose: () => void;
}

const formatTimeAgo = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} min`;
    return 'justo ahora';
};

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
    const iconClass = "h-6 w-6 text-white";
    const bgColor = type === NotificationType.Task ? 'bg-blue-500' : type === NotificationType.Event ? 'bg-purple-500' : 'bg-green-500';

    const iconSvg = {
        [NotificationType.Task]: (
            <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        [NotificationType.Event]: (
            <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        [NotificationType.Document]: (
            <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )
    };

    return <div className={`p-2 rounded-full ${bgColor}`}>{iconSvg[type]}</div>;
};


const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClose }) => {
    const { 
        handleMarkAsRead, 
        handleMarkAllAsRead, 
        handleClearReadNotifications,
        setViewingDocInfo,
        setViewingTask,
        setViewingEvent,
        documents,
        tasks,
        events
    } = useApp();

    const handleViewClick = (notification: Notification) => {
        switch(notification.type) {
            case NotificationType.Task:
                const taskToView = tasks.find(t => t.id === notification.sourceId);
                if (taskToView) setViewingTask(taskToView);
                break;
            case NotificationType.Event:
                const eventToView = events.find(e => e.id === notification.sourceId);
                if (eventToView) setViewingEvent(eventToView);
                break;
            case NotificationType.Document:
                const docToView = documents.find(d => d.id === notification.sourceId);
                if (docToView) {
                    const statusDocs = documents.filter(d => d.status === docToView.status);
                    const docIndex = statusDocs.findIndex(d => d.id === docToView.id);
                    const regNum = (statusDocs.length - docIndex).toString().padStart(3, '0');
                    setViewingDocInfo({ doc: docToView, regNum });
                }
                break;
        }
        handleMarkAsRead(notification.id);
        onClose();
    };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="w-80 lg:w-96 bg-white dark:bg-nexus-bg border border-slate-200 dark:border-nexus-border rounded-lg shadow-2xl z-50 animate-fade-in-fast">
      <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-nexus-border">
        <h3 className="font-bold text-slate-800 dark:text-white">Notificaciones</h3>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="text-xs font-semibold text-nexus-primary hover:underline">
            Marcar todo como leído
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-3 transition-colors duration-200 border-b border-slate-100 dark:border-nexus-surface/50 last:border-b-0 ${
                n.read ? 'opacity-70' : 'bg-slate-50 dark:bg-nexus-surface/30'
              }`}
            >
              <NotificationIcon type={n.type} />
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-800 dark:text-nexus-text">{n.title}</p>
                <p className="text-xs text-slate-600 dark:text-nexus-text-secondary">{n.message}</p>
                 <div className="flex items-center justify-between mt-2">
                     <p className="text-xs text-slate-400 dark:text-nexus-text-secondary">{formatTimeAgo(n.timestamp)}</p>
                     {!n.read && (
                        <button onClick={() => handleViewClick(n)} className="text-xs font-bold text-nexus-primary hover:underline bg-nexus-primary/10 px-2 py-1 rounded">
                            Ver
                        </button>
                     )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <p className="mt-2 text-sm text-slate-500 dark:text-nexus-text-secondary">Bandeja de entrada limpia.</p>
          </div>
        )}
      </div>
      {notifications.some(n => n.read) && (
        <div className="p-2 border-t border-slate-200 dark:border-nexus-border text-center">
            <button onClick={handleClearReadNotifications} className="text-xs font-semibold text-slate-500 hover:text-red-500">
                Limpiar leídas
            </button>
        </div>
      )}
       <style>{`
        .animate-fade-in-fast {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter;