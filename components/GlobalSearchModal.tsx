

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Document, Task, CalendarEvent, FileItem } from '../types';
import { formatDate } from '../utils/dateFormatter';

interface SearchResult {
    id: string;
    title: string;
    category: 'Documentos' | 'Tareas' | 'Eventos' | 'Carpetas';
    item: Document | Task | CalendarEvent | FileItem;
    details: string;
}

const GlobalSearchModal: React.FC = () => {
    const { 
        isSearchModalOpen, 
        toggleSearchModal,
        documents,
        tasks,
        events,
        files,
        setViewingDocInfo,
        setViewingTask,
        setViewingEvent,
        setPreviewingFile,
        savePath
    } = useApp();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchModalOpen) {
            // Timeout to allow modal to render before focusing
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
        }
    }, [isSearchModalOpen]);

    const getFolderPath = useCallback((fileId: string | null): string => {
        if (!fileId) return savePath;
        let pathParts: string[] = [];
        let currentFile = files.find(f => f.id === fileId);
        while (currentFile && currentFile.parentId) {
            pathParts.unshift(currentFile.name);
            currentFile = files.find(f => f.id === currentFile!.parentId);
        }
        if (currentFile) pathParts.unshift(currentFile.name);
        
        return `${savePath} / ${pathParts.join(' / ')}`;
    }, [files, savePath]);

    const searchResults = useMemo<SearchResult[]>(() => {
        if (query.length < 2) return [];
        const lowerCaseQuery = query.toLowerCase();
        
        const docResults: SearchResult[] = documents
            .filter(d => d.content.toLowerCase().includes(lowerCaseQuery) || d.docNumber?.toLowerCase().includes(lowerCaseQuery) || d.sender.toLowerCase().includes(lowerCaseQuery) || d.recipient.toLowerCase().includes(lowerCaseQuery))
            .map(d => ({
                id: d.id,
                title: d.content,
                category: 'Documentos',
                item: d,
                details: `N° ${d.docNumber || 's/n'} - ${d.status}`
            }));

        const taskResults: SearchResult[] = tasks
            .filter(t => t.title.toLowerCase().includes(lowerCaseQuery) || t.description.toLowerCase().includes(lowerCaseQuery))
            .map(t => ({
                id: t.id,
                title: t.title,
                category: 'Tareas',
                item: t,
                details: `Vence: ${formatDate(t.dueDate)} - ${t.status}`
            }));

        const eventResults: SearchResult[] = events
            .filter(e => e.title.toLowerCase().includes(lowerCaseQuery) || e.description.toLowerCase().includes(lowerCaseQuery))
            .map(e => ({
                id: e.id,
                title: e.title,
                category: 'Eventos',
                item: e,
                details: `Fecha: ${formatDate(e.date)}`
            }));
            
        const fileResults: SearchResult[] = files
            .filter(f => f.type !== 'folder' && f.name.toLowerCase().includes(lowerCaseQuery))
            .map(f => ({
                id: f.id,
                title: f.name,
                category: 'Carpetas',
                item: f,
                details: getFolderPath(f.parentId)
            }));
            
        return [...docResults, ...taskResults, ...eventResults, ...fileResults];
    }, [query, documents, tasks, events, files, getFolderPath]);

    const groupedResults = useMemo(() => {
        // FIX: Refactored to a `forEach` loop to ensure correct type inference for `groupedResults`.
        const groups: Record<string, SearchResult[]> = {};
        searchResults.forEach(result => {
            const category = result.category;
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(result);
        });
        return groups;
    }, [searchResults]);
    
    const handleResultClick = (result: SearchResult) => {
        const totalDocs = documents.filter(d => d.status === (result.item as Document).status).length;
        const docIndex = documents.filter(d => d.status === (result.item as Document).status).findIndex(d => d.id === result.item.id);
        const regNum = (totalDocs - docIndex).toString().padStart(3, '0');

        switch(result.category) {
            case 'Documentos':
                setViewingDocInfo({ doc: result.item as Document, regNum: regNum });
                break;
            case 'Tareas':
                setViewingTask(result.item as Task);
                break;
            case 'Eventos':
                setViewingEvent(result.item as CalendarEvent);
                break;
            case 'Carpetas':
                setPreviewingFile(result.item as FileItem);
                break;
        }
        toggleSearchModal();
    };

    if (!isSearchModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-24 z-[100]" onClick={toggleSearchModal}>
            <div className="w-full max-w-2xl bg-white dark:bg-nexus-bg rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Buscar documentos, tareas, archivos..."
                        className="w-full p-4 pl-12 text-lg bg-transparent outline-none border-b border-slate-200 dark:border-nexus-border"
                    />
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {query.length < 2 ? (
                         <p className="p-6 text-center text-slate-500">Escriba al menos 2 caracteres para buscar.</p>
                    ) : Object.keys(groupedResults).length > 0 ? (
                        // FIX: Replaced `Object.entries` with `Object.keys` to avoid potential type inference issues with `Object.entries`
                        // that can cause the value to be typed as `unknown`.
                        Object.keys(groupedResults).map(category => (
                            <div key={category}>
                                <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-slate-500 dark:text-nexus-text-secondary uppercase">{category}</h3>
                                <ul>
                                    {groupedResults[category].map(result => (
                                        <li key={result.id} onClick={() => handleResultClick(result)} className="p-4 flex items-center gap-4 hover:bg-slate-100 dark:hover:bg-nexus-surface cursor-pointer border-b border-slate-100 dark:border-nexus-border last:border-b-0">
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-nexus-text">{result.title}</p>
                                                <p className="text-xs text-slate-500 dark:text-nexus-text-secondary">{result.details}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p className="p-6 text-center text-slate-500">No se encontraron resultados para "{query}".</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalSearchModal;
