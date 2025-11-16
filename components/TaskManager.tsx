
import React, { useState, useRef, useEffect, useMemo } from 'react';
// Fix: Import types from the centralized types.ts file
import { Task, TaskStatus, TaskPriority, Document } from '../types';
import Card from './common/Card';
import { useApp } from '../contexts/AppContext';
import { formatDate } from '../utils/dateFormatter';
import { generateTaskFromPrompt } from '../services/geminiService';

const TaskFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Task) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Task>>({});
    const { addToast } = useApp();
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: '',
                description: '',
                dueDate: new Date().toISOString().split('T')[0],
                priority: TaskPriority.Media,
            });
            setAiPrompt('');
            setAiError('');
            setIsGenerating(false);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateWithAI = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        setAiError('');
        try {
            const taskData = await generateTaskFromPrompt(aiPrompt);
            setFormData(prev => ({
                ...prev,
                title: taskData.title,
                description: taskData.description,
                dueDate: taskData.dueDate,
            }));
            setAiPrompt(''); // Clear prompt on success
            addToast("Campos de tarea generados por IA.", "success");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            setAiError(errorMessage);
            addToast(errorMessage, "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.dueDate) return;
        
        const finalTask: Task = {
            id: `task-${Date.now()}`,
            title: formData.title,
            description: formData.description || '',
            creationDate: new Date().toISOString().split('T')[0],
            dueDate: formData.dueDate,
            priority: formData.priority || TaskPriority.Media,
            status: TaskStatus.Pendiente,
        };
        onSave(finalTask);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-nexus-primary mb-4">Crear Nueva Tarea</h2>
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 border-l-4 border-cyan-400 rounded-r-lg space-y-3">
                        <h3 className="text-md font-semibold text-cyan-800 dark:text-cyan-200">Asistente IA</h3>
                        <textarea
                            name="aiPrompt"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            rows={2}
                            className="form-input"
                            placeholder="Ej: Recordarme preparar el informe de labores para el próximo viernes"
                            disabled={isGenerating}
                        />
                        <button
                            type="button"
                            onClick={handleGenerateWithAI}
                            disabled={isGenerating || !aiPrompt.trim()}
                            className="w-full bg-cyan-500 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            )}
                            <span>Generar con IA</span>
                        </button>
                        {aiError && <p className="text-red-500 text-xs">{aiError}</p>}
                    </div>
                    <div>
                        <label className="form-label">Título de la Tarea</label>
                        <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className="form-input" required />
                    </div>
                    <div>
                        <label className="form-label">Descripción</label>
                        <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={4} className="form-input" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Fecha de Vencimiento</label>
                            <input type="date" name="dueDate" value={formData.dueDate || ''} onChange={handleChange} className="form-input" required />
                        </div>
                        <div>
                            <label className="form-label">Prioridad</label>
                            <select name="priority" value={formData.priority || TaskPriority.Media} onChange={handleChange} className="form-input" required>
                                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-nexus-border">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-200 text-slate-800 dark:bg-nexus-surface dark:text-white hover:bg-slate-300 dark:hover:bg-nexus-border">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded bg-nexus-primary text-white hover:bg-nexus-secondary">Guardar Tarea</button>
                </div>
            </form>
             <style>{`.form-label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #475569; } .dark .form-label { color: #94A3B8; } .form-input { width: 100%; background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 0.375rem; padding: 0.5rem; } .dark .form-input { background-color: #0D1117; border-color: #30363D; } .form-input:focus { outline: none; box-shadow: 0 0 0 2px var(--color-accent); }`}</style>
        </div>
    );
};

const TaskManager: React.FC = () => {
    const { tasks, setTasks, deleteTask, setCurrentView, View, setTaskForDocFlow, addToast, setViewingTask } = useApp();
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskToCompleteWithDoc, setTaskToCompleteWithDoc] = useState<Task | null>(null);
    const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

    type TaskView = 'kanban' | 'list';
    const [view, setView] = useState<TaskView>(() => (localStorage.getItem('taskManagerView') as TaskView) || 'kanban');
    
    type SortableTaskKeys = keyof Task;
    const [sortConfig, setSortConfig] = useState<{ key: SortableTaskKeys; direction: 'ascending' | 'descending' } | null>({ key: 'dueDate', direction: 'ascending' });

    useEffect(() => {
        localStorage.setItem('taskManagerView', view);
    }, [view]);

    // Fix: Explicitly type scrollRefs to prevent indexing errors
    const scrollRefs: { [key in TaskStatus]: React.RefObject<HTMLDivElement> } = {
        [TaskStatus.Pendiente]: useRef<HTMLDivElement>(null),
        [TaskStatus['En Progreso']]: useRef<HTMLDivElement>(null),
        [TaskStatus.Completada]: useRef<HTMLDivElement>(null),
    };

    const handleOpenCreateModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveTask = (task: Task) => {
        setTasks(prev => [task, ...prev]);
        addToast('Tarea creada con éxito.', 'success');
        handleCloseModal();
    };

    const columns = Object.values(TaskStatus);
    
    const priorityOrder: { [key in TaskPriority]: number } = {
        [TaskPriority.Alta]: 0,
        [TaskPriority.Media]: 1,
        [TaskPriority.Baja]: 2,
    };


    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        setDraggingTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
        e.preventDefault();
        if (draggingTaskId) {
            const task = tasks.find(t => t.id === draggingTaskId);
            if (task && newStatus === TaskStatus.Completada && task.status !== TaskStatus.Completada) {
                // If moving to 'Completed', show confirmation modal instead of directly changing status
                setTaskToCompleteWithDoc(task);
            } else {
                // For other status changes, update directly
                setTasks(prevTasks => 
                    prevTasks.map(t => 
                        t.id === draggingTaskId ? { ...t, status: newStatus } : t
                    )
                );
            }
            setDraggingTaskId(null);
        }
    };
    
    const handleConfirmCompleteOnly = () => {
        if (taskToCompleteWithDoc) {
            setTasks(prevTasks =>
                prevTasks.map(t =>
                    t.id === taskToCompleteWithDoc.id ? { ...t, status: TaskStatus.Completada } : t
                )
            );
            addToast(`Tarea '${taskToCompleteWithDoc.title}' completada.`, 'success');
            setTaskToCompleteWithDoc(null);
        }
    };

    const handleConfirmCompleteWithDoc = () => {
        if (taskToCompleteWithDoc) {
            setTaskForDocFlow(taskToCompleteWithDoc);
            setCurrentView(View.Documents);
            setTaskToCompleteWithDoc(null);
        }
    };
    
    const handleDeleteTask = (taskId: string) => {
        deleteTask(taskId);
    };

    const handleOpenViewModal = (task: Task) => setViewingTask(task);

    const handleChangePriority = (taskId: string) => {
        setTasks(prevTasks =>
            prevTasks.map(task => {
                if (task.id === taskId) {
                    let newPriority: TaskPriority;
                    if (task.priority === TaskPriority.Baja) newPriority = TaskPriority.Media;
                    else if (task.priority === TaskPriority.Media) newPriority = TaskPriority.Alta;
                    else newPriority = TaskPriority.Baja; // Alta -> Baja
                    return { ...task, priority: newPriority };
                }
                return task;
            })
        );
    };

    const handleChangeStatus = (task: Task, newStatus: TaskStatus) => {
        setOpenActionMenu(null);
        if (task.status === newStatus) return;

        if (newStatus === TaskStatus.Completada) {
            setTaskToCompleteWithDoc(task);
        } else {
            setTasks(prevTasks =>
                prevTasks.map(t => (t.id === task.id ? { ...t, status: newStatus } : t))
            );
            addToast(`Estado de '${task.title}' actualizado a '${newStatus}'.`, 'info');
        }
    };

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case TaskPriority.Alta: return 'text-red-500';
            case TaskPriority.Media: return 'text-yellow-500';
            case TaskPriority.Baja: return 'text-blue-500';
            default: return 'text-slate-400';
        }
    };

    const handleScroll = (status: TaskStatus, direction: 'up' | 'down') => {
        const element = scrollRefs[status].current;
        if (element) {
            const scrollAmount = direction === 'down' ? 200 : -200;
            element.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }
    };
    
    const sortedTasks = useMemo(() => {
        let sortableItems = [...tasks];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const key = sortConfig.key;
                let aValue: any;
                let bValue: any;

                if (key === 'priority') {
                    aValue = priorityOrder[a[key]];
                    bValue = priorityOrder[b[key]];
                } else {
                    aValue = a[key];
                    bValue = b[key];
                }
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [tasks, sortConfig]);
    
    const requestSort = (key: SortableTaskKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const renderKanbanView = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-250px)]">
            {columns.map(status => (
                <div 
                    key={status} 
                    className="bg-slate-100 dark:bg-nexus-surface/50 rounded-lg flex flex-col h-full"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                >
                    <h3 className="font-semibold text-slate-700 dark:text-nexus-text p-3 flex-shrink-0">{status}</h3>
                    <div className="task-column-container flex-1 relative overflow-hidden">
                        <button onClick={() => handleScroll(status, 'up')} className="scroll-arrow up">&#8963;</button>
                        <div ref={scrollRefs[status]} className="task-column-scroll-area absolute inset-0 overflow-y-auto p-3 space-y-3">
                            {tasks
                                .filter(t => t.status === status)
                                .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
                                .map(task => (
                                <div 
                                    key={task.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    className={`bg-white dark:bg-nexus-dark p-3 rounded-md shadow cursor-grab transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg ${draggingTaskId === task.id ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-nexus-text pr-2">{task.title}</p>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {task.status !== TaskStatus.Completada && (
                                                <button 
                                                    onClick={() => { setTaskForDocFlow(task); setCurrentView(View.Documents); }} 
                                                    className="text-slate-400 hover:text-nexus-primary" 
                                                    title="Completar con Documento"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M9.25 13.25a.75.75 0 001.5 0V4.66l1.97 1.97a.75.75 0 001.06-1.06l-3.25-3.25a.75.75 0 00-1.06 0L6.22 5.57a.75.75 0 001.06 1.06l1.97-1.97v8.59z" />
                                                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button onClick={() => handleOpenViewModal(task)} className="text-slate-400 hover:text-nexus-primary" title="Ver detalles">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-500" title="Eliminar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-nexus-text-secondary mt-1 truncate">{task.description}</p>
                                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-nexus-text-secondary mt-2">
                                        <span>Vence: {formatDate(task.dueDate)}</span>
                                        <button onClick={() => handleChangePriority(task.id)} className={getPriorityColor(task.priority)} title={`Prioridad: ${task.priority}`}>
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                                             </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => handleScroll(status, 'down')} className="scroll-arrow down">&#8964;</button>
                    </div>
                </div>
            ))}
        </div>
    );
    
    const renderListView = () => {
        const SortableHeader: React.FC<{ sortKey: SortableTaskKeys; children: React.ReactNode; }> = ({ sortKey, children }) => {
            const isSorted = sortConfig?.key === sortKey;
            const directionIcon = isSorted ? (sortConfig?.direction === 'ascending' ? '▲' : '▼') : '';
            return (
                <th className="px-6 py-3 cursor-pointer" onClick={() => requestSort(sortKey)}>
                    <div className="flex items-center gap-2">
                        {children}
                        <span className="text-xs">{directionIcon}</span>
                    </div>
                </th>
            );
        };

        return (
            <div className="overflow-auto h-[calc(100vh-250px)]">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 dark:text-nexus-text-secondary uppercase bg-slate-50 dark:bg-nexus-surface sticky top-0 z-10">
                        <tr>
                            <SortableHeader sortKey="title">Título</SortableHeader>
                            <SortableHeader sortKey="priority">Prioridad</SortableHeader>
                            <SortableHeader sortKey="dueDate">Vencimiento</SortableHeader>
                            <SortableHeader sortKey="status">Estado</SortableHeader>
                            <th className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-nexus-border">
                        {sortedTasks.map(task => (
                            <tr key={task.id} className="bg-white dark:bg-nexus-bg hover:bg-slate-50 dark:hover:bg-nexus-surface/50">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{task.title}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.priority === TaskPriority.Alta ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : task.priority === TaskPriority.Media ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}>{task.priority}</span></td>
                                <td className="px-6 py-4">{formatDate(task.dueDate)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        task.status === TaskStatus.Completada ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                        task.status === TaskStatus['En Progreso'] ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                                    }`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                     <div className="flex items-center gap-2 text-slate-500">
                                        <button onClick={() => handleChangePriority(task.id)} className={getPriorityColor(task.priority)} title={`Prioridad: ${task.priority}`}>
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" /></svg>
                                        </button>
                                        {task.status !== TaskStatus.Completada && (
                                            <button onClick={() => { setTaskForDocFlow(task); setCurrentView(View.Documents); }} className="hover:text-nexus-primary" title="Completar con Documento">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.25 13.25a.75.75 0 001.5 0V4.66l1.97 1.97a.75.75 0 001.06-1.06l-3.25-3.25a.75.75 0 00-1.06 0L6.22 5.57a.75.75 0 001.06 1.06l1.97-1.97v8.59z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>
                                            </button>
                                        )}
                                        <button onClick={() => handleOpenViewModal(task)} className="hover:text-nexus-primary" title="Ver detalles">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                        </button>
                                        <button onClick={() => handleDeleteTask(task.id)} className="hover:text-red-500" title="Eliminar">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        </button>
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenActionMenu(openActionMenu === task.id ? null : task.id)}
                                                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-nexus-surface"
                                                title="Cambiar estado"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                            </button>
                                            {openActionMenu === task.id && (
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-nexus-surface rounded-md shadow-lg border dark:border-nexus-border z-20">
                                                    <ul className="py-1">
                                                        <p className="px-4 py-2 text-xs text-slate-500 dark:text-nexus-text-secondary">Cambiar estado a:</p>
                                                        {Object.values(TaskStatus).map(status => (
                                                            <li key={status}>
                                                                <button
                                                                    onClick={() => handleChangeStatus(task, status)}
                                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-nexus-text hover:bg-slate-100 dark:hover:bg-nexus-dark disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    disabled={task.status === status}
                                                                >
                                                                    {status}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                     </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {taskToCompleteWithDoc && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={() => setTaskToCompleteWithDoc(null)}>
                    <div className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-md text-center" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-nexus-primary mb-4">Completar Tarea</h2>
                        <p className="text-slate-600 dark:text-nexus-text-secondary mb-6">
                            ¿Esta tarea requiere la creación de un documento de salida (ej. un oficio)?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button onClick={handleConfirmCompleteOnly} className="px-4 py-2 rounded bg-slate-200 text-slate-800 dark:bg-nexus-surface dark:text-white hover:bg-slate-300 dark:hover:bg-nexus-border">
                                No, solo completar
                            </button>
                            <button onClick={handleConfirmCompleteWithDoc} className="px-4 py-2 rounded bg-nexus-primary text-white hover:bg-nexus-secondary">
                                Sí, completar con documento
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <TaskFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveTask}
            />
             <style>{`
                .task-column-container {
                    position: relative;
                }
                .scroll-arrow {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 30px;
                    height: 30px;
                    background-color: rgba(0, 0, 0, 0.4);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity 0.2s;
                    z-index: 10;
                }
                .task-column-container:hover .scroll-arrow {
                    opacity: 1;
                }
                .scroll-arrow.up { top: 5px; }
                .scroll-arrow.down { bottom: 5px; }
                .task-column-scroll-area::-webkit-scrollbar { display: none; }
                .task-column-scroll-area { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-nexus-surface rounded-md">
                        <button onClick={() => setView('kanban')} className={`px-3 py-1 text-sm font-semibold rounded capitalize ${view === 'kanban' ? 'bg-white dark:bg-nexus-bg shadow-sm' : 'text-slate-600 dark:text-nexus-text-secondary'}`}>
                            Kanban
                        </button>
                        <button onClick={() => setView('list')} className={`px-3 py-1 text-sm font-semibold rounded capitalize ${view === 'list' ? 'bg-white dark:bg-nexus-bg shadow-sm' : 'text-slate-600 dark:text-nexus-text-secondary'}`}>
                            Lista
                        </button>
                    </div>
                    <button onClick={handleOpenCreateModal} className="bg-cyan-500 text-white font-bold py-2 px-4 rounded-md text-center hover:bg-cyan-600">
                        + Nueva Tarea
                    </button>
                </div>
                {view === 'kanban' ? renderKanbanView() : renderListView()}
            </Card>
        </div>
    );
};

export default TaskManager;
