
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Card from './common/Card';
import { useApp } from '../contexts/AppContext';
import { ClosedFolderIcon, OpenFolderIcon } from './icons/FolderIcons';
import { FileItem } from '../types';
import { formatDate } from '../utils/dateFormatter';
import JSZip from 'jszip';
import saveAs from 'file-saver';

const FolderIcon: React.FC<{ isOpen: boolean; color?: string }> = ({ isOpen, color }) => {
    const className = "h-6 w-6 shrink-0";
    return isOpen 
        ? <OpenFolderIcon className={className} color={color} /> 
        : <ClosedFolderIcon className={className} color={color} />;
};

const COLOR_PALETTE = [
    '#FFC300', // Amarillo (Yellow - Default)
    '#F97316', // Anaranjado (Orange)
    '#EF4444', // Rojo (Red)
    '#F472B6', // Rosa (Pink)
    '#A78BFA', // Violeta (Violet)
    '#60A5FA', // Azul (Blue)
    '#4ADE80', // Verde (Green)
    '#A16207', // Café (Brown)
    '#9CA3AF', // Gris (Gray)
    '#E5E7EB', // Blanco (White/Light Gray)
];


const FolderContextMenu: React.FC<{
    x: number;
    y: number;
    onSelectColor: (color: string) => void;
    onClose: () => void;
}> = ({ x, y, onSelectColor, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div ref={menuRef} style={{ top: y, left: x }} className="fixed z-50 bg-white dark:bg-nexus-surface rounded-md shadow-lg p-2 flex gap-2 border dark:border-nexus-border flex-wrap max-w-[150px]">
            {COLOR_PALETTE.map(color => (
                <button
                    key={color}
                    onClick={() => onSelectColor(color)}
                    className="w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                    title={color}
                />
            ))}
        </div>
    );
};

const FolderCreationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('Nueva Carpeta');

    useEffect(() => {
        if (isOpen) {
            setName('Nueva Carpeta');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-nexus-primary mb-4">Crear Nueva Carpeta</h2>
                <div>
                    <label htmlFor="folder-name" className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-1">Nombre de la Carpeta</label>
                    <input
                        id="folder-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-nexus-dark border border-slate-300 dark:border-nexus-border rounded-md p-2 focus:ring-2 focus:ring-nexus-accent focus:outline-none"
                        required
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-nexus-border">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-200 text-slate-800 dark:bg-nexus-surface dark:text-white hover:bg-slate-300 dark:hover:bg-nexus-border">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded bg-nexus-primary text-white hover:bg-nexus-secondary">Crear</button>
                </div>
            </form>
        </div>
    );
};

const FolderTree: React.FC<{
    folders: FileItem[];
    parentId: string | null;
    selectedFolderId: string | null;
    onSelectFolder: (id: string | null) => void;
    level?: number;
    expandedFolders: Set<string>;
    toggleFolder: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onAddSubfolder: (parentId: string) => void;
    onContextMenu: (e: React.MouseEvent, folderId: string) => void;
    onDownload: (folderId: string) => void;
}> = ({ folders, parentId, selectedFolderId, onSelectFolder, level = 0, expandedFolders, toggleFolder, onRename, onDelete, onAddSubfolder, onContextMenu, onDownload }) => {
    const childFolders = useMemo(() => folders.filter(f => f.parentId === parentId), [folders, parentId]);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");

    const handleRenameStart = (folder: FileItem) => {
        setEditingFolderId(folder.id);
        setNewName(folder.name);
    };

    const handleRenameSubmit = (e: React.FormEvent, folderId: string) => {
        e.preventDefault();
        onRename(folderId, newName);
        setEditingFolderId(null);
    };

    if (level > 0 && childFolders.length === 0) return null;
    
    return (
        <ul style={{ paddingLeft: level > 0 ? '20px' : '0' }}>
            {childFolders.map(folder => {
                const isExpanded = expandedFolders.has(folder.id);
                const isSelected = selectedFolderId === folder.id;
                
                return (
                    <li key={folder.id} className="my-1">
                        <div 
                            className={`flex items-center p-2 rounded-md cursor-pointer group ${isSelected ? 'bg-nexus-primary/20' : 'hover:bg-slate-100 dark:hover:bg-nexus-surface/50'}`}
                            onClick={() => onSelectFolder(folder.id)}
                            onDoubleClick={() => toggleFolder(folder.id)}
                            onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, folder.id); }}
                        >
                            <button onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }} className="mr-2 p-1">
                                <FolderIcon isOpen={isExpanded} color={folder.color} />
                            </button>
                            
                            {editingFolderId === folder.id ? (
                                <form onSubmit={(e) => handleRenameSubmit(e, folder.id)} className="flex-grow">
                                    <input 
                                        type="text" 
                                        value={newName} 
                                        onChange={(e) => setNewName(e.target.value)}
                                        onBlur={(e) => handleRenameSubmit(e, folder.id)}
                                        autoFocus
                                        className="w-full bg-transparent border-b border-nexus-primary outline-none"
                                    />
                                </form>
                            ) : (
                                <span className="flex-grow font-semibold text-slate-700 dark:text-nexus-text truncate">{folder.name}</span>
                            )}
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); onDownload(folder.id); }} title="Descargar Carpeta" className="p-1 hover:bg-slate-200 dark:hover:bg-nexus-dark rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                <button onClick={(e) => { e.stopPropagation(); onAddSubfolder(folder.id); }} title="Nueva Subcarpeta" className="p-1 hover:bg-slate-200 dark:hover:bg-nexus-dark rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /><path d="M10.707 14.707a1 1 0 00-1.414-1.414L8 14.586V11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3z" /></svg></button>
                                <button onClick={(e) => { e.stopPropagation(); handleRenameStart(folder); }} title="Renombrar" className="p-1 hover:bg-slate-200 dark:hover:bg-nexus-dark rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }} title="Eliminar" className="p-1 hover:bg-slate-200 dark:hover:bg-nexus-dark rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                            </div>
                        </div>
                        
                        {isExpanded && (
                            <FolderTree
                                folders={folders}
                                parentId={folder.id}
                                selectedFolderId={selectedFolderId}
                                onSelectFolder={onSelectFolder}
                                level={level + 1}
                                expandedFolders={expandedFolders}
                                toggleFolder={toggleFolder}
                                onRename={onRename}
                                onDelete={onDelete}
                                onAddSubfolder={onAddSubfolder}
                                onContextMenu={onContextMenu}
                                onDownload={onDownload}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

const FileIcon: React.FC<{ type: string }> = ({ type }) => {
    const iconColor = "text-slate-500 dark:text-nexus-text-secondary";
    switch (type.toLowerCase()) {
        case 'pdf': return <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
        case 'doc':
        case 'docx': return <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 2a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
        case 'png':
        case 'jpg':
        case 'jpeg': return <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>;
        default: return <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>;
    }
}

const FileManager: React.FC = () => {
    const { files, setFiles, deleteFile, deleteFolder, setPreviewingFile, savePath, addToast } = useApp();
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['folder-1']));
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, folderId: string } | null>(null);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const folders = useMemo(() => files.filter(f => f.type === 'folder'), [files]);
    const currentFiles = useMemo(() => files.filter(f => f.parentId === selectedFolderId && f.type !== 'folder'), [files, selectedFolderId]);
    
    const currentPath = useMemo(() => {
        if (!selectedFolderId) return savePath;
        let pathParts: string[] = [];
        let currentId: string | null = selectedFolderId;
        while (currentId) {
            const folder = folders.find(f => f.id === currentId);
            if (folder) {
                pathParts.unshift(folder.name);
                currentId = folder.parentId;
            } else {
                currentId = null;
            }
        }
        return `${savePath}/${pathParts.join('/')}`;
    }, [selectedFolderId, folders, savePath]);

    const handleToggleFolder = (id: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const handleCreateFolder = useCallback((name: string) => {
        const newFolder: FileItem = {
            id: `folder-${Date.now()}`,
            name,
            type: 'folder',
            size: 0,
            modifiedDate: new Date().toISOString(),
            parentId: newFolderParentId,
        };
        setFiles(prev => [...prev, newFolder]);
        setIsCreateFolderModalOpen(false);
        setNewFolderParentId(null);
        if (newFolderParentId) {
            setExpandedFolders(prev => new Set(prev).add(newFolderParentId));
        }
    }, [newFolderParentId, setFiles]);

    const handleRenameFile = (id: string, newName: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName, modifiedDate: new Date().toISOString() } : f));
    };

    const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = e.target.files;
        if (uploadedFiles) {
            // Fix: Explicitly type the 'file' parameter to resolve issues with it being inferred as 'unknown'.
            Array.from(uploadedFiles).forEach((file: File) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const newFile: FileItem = {
                        id: `file-${Date.now()}-${Math.random()}`,
                        name: file.name,
                        type: file.name.split('.').pop() || 'unknown',
                        size: file.size,
                        modifiedDate: new Date().toISOString(),
                        parentId: selectedFolderId,
                        contentUrl: event.target?.result as string,
                    };
                    setFiles(prev => [...prev, newFile]);
                };
                reader.readAsDataURL(file);
            });
            addToast(`${uploadedFiles.length} archivo(s) subido(s).`, 'success');
        }
    };
    
    const handleSetFolderColor = useCallback((color: string) => {
        if (contextMenu) {
            setFiles(prev => prev.map(f => f.id === contextMenu.folderId ? { ...f, color } : f));
            setContextMenu(null);
        }
    }, [contextMenu, setFiles]);

    const addFolderToZip = async (currentFolder: FileItem, zipInstance: JSZip) => {
        const children = files.filter(f => f.parentId === currentFolder.id);
        for (const child of children) {
            if (child.type === 'folder') {
                const childZipFolder = zipInstance.folder(child.name);
                if (childZipFolder) {
                    await addFolderToZip(child, childZipFolder);
                }
            } else {
                if (child.contentUrl) {
                    try {
                        // Data URL: data:[<mediatype>][;base64],<data>
                        const base64Data = child.contentUrl.split(',')[1];
                        zipInstance.file(child.name, base64Data, { base64: true });
                    } catch (error) {
                        console.error(`Could not add file ${child.name} to zip:`, error);
                    }
                }
            }
        }
    };

    const handleDownloadFolder = async (folderId: string) => {
        const folderToDownload = files.find(f => f.id === folderId);
        if (!folderToDownload) return;

        addToast(`Preparando descarga para '${folderToDownload.name}'...`, 'info');
        const zip = new JSZip();
        await addFolderToZip(folderToDownload, zip.folder(folderToDownload.name)!);
        
        zip.generateAsync({ type: 'blob' }).then(content => {
            saveAs(content, `${folderToDownload.name}.zip`);
        });
    };

    const handleDownloadAll = async () => {
        addToast(`Preparando descarga de todo el sistema de archivos...`, 'info');
        const zip = new JSZip();
        const rootItems = files.filter(f => f.parentId === null);
        for (const item of rootItems) {
             if (item.type === 'folder') {
                await addFolderToZip(item, zip.folder(item.name)!);
            } else {
                if (item.contentUrl) {
                    try {
                        const base64Data = item.contentUrl.split(',')[1];
                        zip.file(item.name, base64Data, { base64: true });
                    } catch (error) {
                        console.error(`Could not add file ${item.name} to zip:`, error);
                    }
                }
            }
        }
        zip.generateAsync({ type: 'blob' }).then(content => {
            saveAs(content, `nexus-os-archivos.zip`);
        });
    };

    return (
        <div className="animate-fade-in">
            <FolderCreationModal 
                isOpen={isCreateFolderModalOpen} 
                onClose={() => setIsCreateFolderModalOpen(false)}
                onSave={handleCreateFolder}
            />
            {contextMenu && <FolderContextMenu x={contextMenu.x} y={contextMenu.y} onSelectColor={handleSetFolderColor} onClose={() => setContextMenu(null)} />}
            <Card className="h-[calc(100vh-180px)] flex flex-col">
                <div className="grid grid-cols-12 gap-4 flex-grow overflow-hidden">
                    {/* Folder Tree Panel */}
                    <div className="col-span-4 border-r border-slate-200 dark:border-nexus-border pr-4 overflow-y-auto">
                        <h3 className="font-bold text-lg text-nexus-primary mb-2">Sistema de Archivos</h3>
                         <FolderTree
                            folders={folders}
                            parentId={null}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={setSelectedFolderId}
                            expandedFolders={expandedFolders}
                            toggleFolder={handleToggleFolder}
                            onRename={handleRenameFile}
                            onDelete={deleteFolder}
                            onAddSubfolder={(parentId) => { setNewFolderParentId(parentId); setIsCreateFolderModalOpen(true); }}
                            onContextMenu={(e, folderId) => setContextMenu({ x: e.clientX, y: e.clientY, folderId })}
                            onDownload={handleDownloadFolder}
                        />
                    </div>

                    {/* File View Panel */}
                    <div className="col-span-8 flex flex-col overflow-hidden">
                        <div className="flex-shrink-0 flex justify-between items-center pb-2 mb-2 border-b border-slate-200 dark:border-nexus-border">
                            <p className="text-sm text-slate-500 dark:text-nexus-text-secondary truncate" title={currentPath}>{currentPath}</p>
                             <div className="flex gap-2">
                                <button onClick={handleDownloadAll} className="bg-slate-500 text-white font-bold py-2 px-3 rounded-md hover:bg-slate-600 transition-colors text-sm" title="Descargar Todo">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /><path d="M10 12.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L10 12.586z" /></svg>
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="bg-blue-500 text-white font-bold py-2 px-3 rounded-md hover:bg-blue-600 transition-colors text-sm">+ Subir Archivo</button>
                                <button onClick={() => { setNewFolderParentId(selectedFolderId); setIsCreateFolderModalOpen(true); }} className="bg-cyan-500 text-white font-bold py-2 px-3 rounded-md hover:bg-cyan-600 transition-colors text-sm">+ Nueva Carpeta</button>
                                <input type="file" ref={fileInputRef} onChange={handleAddFile} style={{ display: 'none' }} multiple />
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {currentFiles.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-slate-500 dark:text-nexus-text-secondary uppercase">
                                            <th className="p-2"></th>
                                            <th className="p-2">Nombre</th>
                                            <th className="p-2">Modificado</th>
                                            <th className="p-2">Tamaño</th>
                                            <th className="p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentFiles.map(file => (
                                            <tr key={file.id} onDoubleClick={() => setPreviewingFile(file)} className="group border-b border-slate-100 dark:border-nexus-surface hover:bg-slate-50 dark:hover:bg-nexus-surface/50 cursor-pointer">
                                                <td className="p-2"><FileIcon type={file.type} /></td>
                                                <td className="p-2 font-semibold text-slate-700 dark:text-nexus-text">{file.name}</td>
                                                <td className="p-2 text-slate-500 dark:text-nexus-text-secondary">{formatDate(file.modifiedDate)}</td>
                                                <td className="p-2 text-slate-500 dark:text-nexus-text-secondary">{(file.size / 1024).toFixed(1)} KB</td>
                                                <td className="p-2 text-right">
                                                     <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setPreviewingFile(file)} title="Vista Previa" className="p-1 hover:text-nexus-primary"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg></button>
                                                        <button onClick={() => deleteFile(file.id)} title="Eliminar" className="p-1 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                                                     </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex flex-col justify-center items-center text-center text-slate-500 dark:text-nexus-text-secondary">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 dark:text-nexus-border" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                    <p className="mt-4 font-semibold">Carpeta Vacía</p>
                                    <p className="text-sm">Seleccione una carpeta para ver sus archivos o suba uno nuevo.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default FileManager;