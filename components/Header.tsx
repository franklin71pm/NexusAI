

import React, { useState, useRef, useEffect } from 'react';
// Fix: Import types from the centralized types.ts file
import { AppContextForAI } from '../types';
import NotificationCenter from './NotificationCenter';
import GlobalAI from './GlobalAI';
import { useApp } from '../contexts/AppContext';

interface HeaderProps {
  title: string;
  subtitle: string;
  // Fix: Renamed AppContext to AppContextForAI to match the exported type from types.ts.
  appContext: AppContextForAI; // For AI
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, appContext }) => {
  const { notifications, toggleCommandPalette, toggleSearchModal, showBackupReminder, setCurrentView, View } = useApp();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [animateBell, setAnimateBell] = useState(false);
  const prevUnreadCountRef = useRef(0);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
        setAnimateBell(true);
        setTimeout(() => setAnimateBell(false), 500); // Animation duration
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

  return (
    <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-nexus-border">
       <style>{`
            @keyframes wiggle {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-15deg); }
                50% { transform: rotate(15deg); }
                75% { transform: rotate(-10deg); }
            }
            .animate-wiggle {
                animation: wiggle 0.5s ease-in-out;
            }
            @keyframes pulse-warn {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }
            .animate-pulse-warn {
                animation: pulse-warn 2s infinite;
            }
        `}</style>
      <div>
        <h1 className="text-3xl font-bold text-nexus-primary tracking-wider">{title}</h1>
        <p className="text-slate-500 dark:text-nexus-text-secondary mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <button
            onClick={toggleSearchModal}
            className="p-2 rounded-full text-slate-500 dark:text-nexus-text-secondary hover:bg-slate-100 dark:hover:bg-nexus-surface transition-colors"
            aria-label="Abrir búsqueda global"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </button>
        <button
            onClick={toggleCommandPalette}
            className="p-2 rounded-full text-slate-500 dark:text-nexus-text-secondary hover:bg-slate-100 dark:hover:bg-nexus-surface transition-colors"
            aria-label="Abrir paleta de comandos"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        </button>
        {showBackupReminder && (
            <button
                onClick={() => setCurrentView(View.Settings)}
                className="p-2 rounded-full text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors animate-pulse-warn"
                aria-label="Recordatorio de copia de seguridad"
                title="Ha pasado más de un mes desde su última copia de seguridad. Haga clic para ir a Configuración."
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
            </button>
        )}
        <GlobalAI appContext={appContext} />
        <div ref={notificationRef} className="relative">
          <button 
              onClick={() => setIsNotificationsOpen(prev => !prev)}
              className={`relative p-2 rounded-full text-slate-500 dark:text-nexus-text-secondary hover:bg-slate-100 dark:hover:bg-nexus-surface transition-colors ${animateBell ? 'animate-wiggle' : ''}`}
              aria-label="Abrir notificaciones"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-white dark:ring-nexus-dark">
                      {unreadCount}
                  </span>
              )}
          </button>
          {isNotificationsOpen && (
              <div className="absolute top-full right-0 mt-2 z-50">
                  <NotificationCenter
                      notifications={notifications}
                      onClose={() => setIsNotificationsOpen(false)}
                  />
              </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;