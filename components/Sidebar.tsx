
import React from 'react';
import { useApp } from '../contexts/AppContext';
import { NAVIGATION_ITEMS } from '../constants';

const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    theme,
    toggleTheme,
    isSidebarCollapsed,
    toggleSidebar,
    schoolInfo,
    currentYear,
    setCurrentYear,
    availableYears,
    startNewYear,
  } = useApp();

  return (
    <aside
      className={`relative flex flex-col bg-white/70 dark:bg-nexus-surface/70 backdrop-blur-sm border-r border-slate-200 dark:border-nexus-border transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-nexus-border h-24">
        <div className="flex-shrink-0">
          <svg
            className={`h-10 w-10 text-nexus-primary transition-transform duration-500`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
          </svg>
        </div>
        <div
          className={`overflow-hidden transition-opacity duration-200 ${
            isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-full'
          }`}
        >
          <h2 className="font-bold text-lg text-slate-900 dark:text-white whitespace-nowrap">Nexus OS</h2>
          <p className="text-xs text-slate-500 dark:text-nexus-text-secondary truncate">{schoolInfo.schoolName}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        <ul className="space-y-2">
          {NAVIGATION_ITEMS.map((item) => (
            <li key={item.view}>
              <button
                onClick={() => 'view' in item && setCurrentView(item.view)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  currentView === item.view
                    ? 'bg-nexus-primary text-white shadow-md'
                    : 'text-slate-600 dark:text-nexus-text-secondary hover:bg-slate-100 dark:hover:bg-nexus-surface'
                }`}
                title={item.label}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                <span className={`overflow-hidden transition-all duration-200 whitespace-nowrap ${isSidebarCollapsed ? 'w-0' : 'w-auto'}`}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-nexus-border space-y-4">
        {/* Year Selector */}
        <div className={isSidebarCollapsed ? 'hidden' : ''}>
            <label htmlFor="year-select" className="block text-xs font-medium text-slate-500 dark:text-nexus-text-secondary mb-1">Año Fiscal</label>
            <select 
                id="year-select"
                value={currentYear} 
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="w-full bg-slate-100 dark:bg-nexus-dark border border-slate-300 dark:border-nexus-border rounded-md py-1.5 px-2 text-sm focus:ring-nexus-primary focus:border-nexus-primary"
            >
                {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>
        </div>

        <button 
            onClick={startNewYear} 
            className={`w-full text-sm font-semibold py-2 px-3 rounded-md transition-colors bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}
            title="Iniciar Nuevo Año"
        >
            {isSidebarCollapsed ? '🎉' : 'Iniciar Nuevo Año'}
        </button>

        {/* Theme Toggle */}
        <div className={`flex items-center rounded-lg p-2 ${isSidebarCollapsed ? 'justify-center' : 'justify-between bg-slate-100 dark:bg-nexus-dark'}`}>
          {!isSidebarCollapsed && <span className="text-sm font-semibold text-slate-700 dark:text-nexus-text-secondary">Tema</span>}
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-nexus-surface" title="Cambiar tema">
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-24 z-10 p-1.5 rounded-full bg-white dark:bg-nexus-surface border border-slate-200 dark:border-nexus-border shadow-md hover:bg-slate-100 dark:hover:bg-nexus-dark transition-transform"
        title={isSidebarCollapsed ? 'Expandir' : 'Colapsar'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-300 ${
            isSidebarCollapsed ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  );
};

export default Sidebar;
