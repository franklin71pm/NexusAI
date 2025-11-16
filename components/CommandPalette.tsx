import React, { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import { useApp } from '../contexts/AppContext';
import { NAVIGATION_ITEMS } from '../constants';

interface Command {
    id: string;
    name: string;
    category: 'Navegación' | 'Acciones';
    // Fix: Use React.ReactElement instead of JSX.Element to resolve "Cannot find namespace 'JSX'" error.
    icon: React.ReactElement;
    action: () => void;
}

const CommandPalette: React.FC = () => {
    const { isCommandPaletteOpen, toggleCommandPalette, setCurrentView, toggleTheme, View, theme } = useApp();
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const commands: Command[] = useMemo(() => [
        ...NAVIGATION_ITEMS.map(item => ({
            id: `nav-${item.view}`,
            name: `Ir a ${item.label}`,
            category: 'Navegación' as const,
            icon: item.icon,
            action: () => setCurrentView(item.view),
        })),
        {
            id: 'action-toggle-theme',
            name: `Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`,
            category: 'Acciones' as const,
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
            action: toggleTheme,
        }
    ], [setCurrentView, toggleTheme, theme]);

    const filteredCommands = useMemo(() =>
        query === ''
            ? commands
            : commands.filter(command =>
                command.name.toLowerCase().includes(query.toLowerCase())
            ), [commands, query]);

    useEffect(() => {
        if (isCommandPaletteOpen) {
            inputRef.current?.focus();
        } else {
            setQuery('');
            setActiveIndex(0);
        }
    }, [isCommandPaletteOpen]);

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isCommandPaletteOpen) return;

            if (e.key === 'Escape') {
                toggleCommandPalette();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const command = filteredCommands[activeIndex];
                if (command) {
                    command.action();
                    toggleCommandPalette();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, toggleCommandPalette, filteredCommands, activeIndex]);
    
    useEffect(() => {
        listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({
            block: 'nearest'
        });
    }, [activeIndex]);

    if (!isCommandPaletteOpen) return null;

    let lastCategory = '';

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-24 z-50 animate-fade-in-fast" onClick={toggleCommandPalette}>
            <div className="w-full max-w-2xl bg-white dark:bg-nexus-bg rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Escriba un comando o busque..."
                        className="w-full p-4 text-lg bg-transparent outline-none border-b border-slate-200 dark:border-nexus-border"
                    />
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 text-xs text-slate-400 border border-slate-300 dark:border-nexus-border rounded px-2 py-1">
                        Ctrl K
                    </div>
                </div>
                {filteredCommands.length > 0 ? (
                    <ul ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
                        {filteredCommands.map((command, index) => {
                             const showCategory = command.category !== lastCategory;
                             lastCategory = command.category;
                             return (
                                <Fragment key={command.id}>
                                    {showCategory && <h3 className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-500 dark:text-nexus-text-secondary">{command.category}</h3>}
                                    <li
                                        data-index={index}
                                        onClick={() => {
                                            command.action();
                                            toggleCommandPalette();
                                        }}
                                        className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${activeIndex === index ? 'bg-nexus-accent text-white' : 'hover:bg-slate-100 dark:hover:bg-nexus-surface'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {command.icon}
                                            <span>{command.name}</span>
                                        </div>
                                    </li>
                                </Fragment>
                             );
                        })}
                    </ul>
                ) : (
                    <p className="p-6 text-center text-slate-500">No se encontraron comandos.</p>
                )}
            </div>
            <style>{`
                .animate-fade-in-fast { animation: fadeIn 0.2s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default CommandPalette;
