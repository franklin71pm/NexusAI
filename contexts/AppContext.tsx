

import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { View, Document, Task, CalendarEvent, FileItem, TrashItem, Notification, NotificationType, AppContextType, AppContextForAI as AppContextForAIType, DocumentStatus, Toast, Template, YearData, BackupData, TaskStatus, TaskPriority } from '../types';
import { getInitialYearState } from '../data/mockData';
import { formatDate } from '../utils/dateFormatter';
import { initDB, getAllYearlyData, saveAllYearlyData, clearYearlyData } from '../utils/db';

const AppContext = createContext<AppContextType | undefined>(undefined);

const createNewYearData = (): YearData => ({
    documents: [],
    tasks: [],
    events: [],
    files: [
        { id: `folder-1-${Date.now()}`, name: 'Informes', type: 'folder', size: 0, modifiedDate: new Date().toISOString(), parentId: null },
        { id: `folder-2-${Date.now()}`, name: 'Recursos', type: 'folder', size: 0, modifiedDate: new Date().toISOString(), parentId: null },
    ],
    trashItems: [],
    schedule: {},
    laborReport: [],
    visitReport: { summaryRows: [], principalResults: '', recommendations: '', recommendationDeadlines: '', followUpActions: '', followUpDeadlines: '' },
    logEntries: {},
});


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // UI State
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && localStorage.theme) return localStorage.theme as 'light' | 'dark';
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
    });
    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accentColor') || '#06b6d4');
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [fontSize, setFontSizeState] = useState(() => localStorage.getItem('fontSize') || '16px');
    const [fontFamily, setFontFamilyState] = useState(() => localStorage.getItem('fontFamily') || 'Inter');
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [showBackupReminder, setShowBackupReminder] = useState(false);
    
    // Non-archived Data State
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [schoolInfo, setSchoolInfo] = useState({
        schoolName: 'Escuela Capacitación Ambiental Veracruz',
        directorName: 'MSc. Franklin Porras Mejía'
    });
    const [savePath, setSavePath] = useState(() => localStorage.getItem('savePath') || '/NexusOS_Data');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Yearly Data State
    const [allData, setAllData] = useState<{ [year: number]: YearData }>({});
    const availableYears = useMemo(() => Object.keys(allData).map(Number).sort((a, b) => b - a), [allData]);
    const [currentYear, _setCurrentYear] = useState<number>(new Date().getFullYear());

    // State for cross-component workflows
    const [taskForDocFlow, setTaskForDocFlow] = useState<Task | null>(null);
    const [viewingDocInfo, setViewingDocInfo] = useState<{ doc: Document; regNum: string } | null>(null);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
    const [previewingFile, setPreviewingFile] = useState<FileItem | null>(null);

    // Toast Notification Logic
    const addToast = useCallback((message: string, type: Toast['type']) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prevToasts => prevToasts.filter(t => t.id !== id));
        }, 5000);
    }, []);

    // Backup Reminder Logic
    useEffect(() => {
        const lastBackupDate = localStorage.getItem('lastBackupDate');
        if (!lastBackupDate) {
            setShowBackupReminder(true);
        } else {
            const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000;
            const lastBackupTime = new Date(lastBackupDate).getTime();
            const now = new Date().getTime();
            if (now - lastBackupTime > thirtyDaysInMillis) {
                setShowBackupReminder(true);
            }
        }
    }, []);

    const confirmBackup = useCallback(() => {
        localStorage.setItem('lastBackupDate', new Date().toISOString());
        setShowBackupReminder(false);
        addToast("Recordatorio de respaldo reiniciado.", "info");
    }, [addToast]);

    // Load initial data from IndexedDB
    useEffect(() => {
        const loadData = async () => {
            try {
                await initDB();
                let data = await getAllYearlyData();
                if (!data || Object.keys(data).length === 0) {
                    console.log('No data in DB, initializing with mock data.');
                    const year = new Date().getFullYear();
                    data = { [year]: getInitialYearState() };
                    await saveAllYearlyData(data);
                }
                setAllData(data);
            } catch (error) {
                console.error("Failed to load data from IndexedDB", error);
                addToast("Error al cargar los datos de la base de datos.", "error");
                const year = new Date().getFullYear();
                setAllData({ [year]: getInitialYearState() });
            } finally {
                setIsLoadingData(false);
            }
        };
        loadData();
    }, [addToast]);
    
    // Save data to IndexedDB when it changes
    useEffect(() => {
        if (!isLoadingData && Object.keys(allData).length > 0) {
            saveAllYearlyData(allData).catch(error => {
                console.error("Failed to save data to IndexedDB", error);
                addToast("Error al guardar los datos.", "error");
            });
        }
    }, [allData, isLoadingData, addToast]);
    
    // Set current year after data loads
    useEffect(() => {
        if (availableYears.length > 0) {
            _setCurrentYear(availableYears[0]);
        }
    }, [availableYears]);


    // Theme & Persistence Effects
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    useEffect(() => {
        document.documentElement.style.setProperty('--color-accent', accentColor);
        localStorage.setItem('accentColor', accentColor);
    }, [accentColor]);

    useEffect(() => {
        localStorage.setItem('savePath', savePath);
    }, [savePath]);
    
    useEffect(() => {
        document.documentElement.style.fontSize = fontSize;
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    useEffect(() => {
        document.body.classList.remove('font-sans', 'font-serif', 'font-mono');
        if (fontFamily === 'Lora') {
            document.body.classList.add('font-serif');
        } else if (fontFamily === 'Roboto Mono') {
            document.body.classList.add('font-mono');
        } else {
            document.body.classList.add('font-sans'); // default
        }
        localStorage.setItem('fontFamily', fontFamily);
    }, [fontFamily]);


    // Derived data for the current year
    const currentYearData = useMemo(() => allData[currentYear] || createNewYearData(), [allData, currentYear]);
    const { documents, tasks, events, files, trashItems, schedule, laborReport, visitReport, logEntries } = currentYearData;
    
    // UI Toggles
    const toggleTheme = () => setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    const toggleCommandPalette = () => setIsCommandPaletteOpen(prev => !prev);
    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
    const toggleSearchModal = () => setIsSearchModalOpen(prev => !prev);
    const setFontSize = (size: string) => setFontSizeState(size);
    const setFontFamily = (font: string) => setFontFamilyState(font);

    // Year Management
    const setCurrentYear = (year: number) => {
        if (allData[year]) {
            _setCurrentYear(year);
            addToast(`Cambiado al año ${year}.`, 'info');
        }
    };

    const startNewYear = () => {
        const latestYear = availableYears[0] || new Date().getFullYear() - 1;
        const nextYear = latestYear + 1;

        if (allData[nextYear]) {
            addToast(`Ya existe un registro para el año ${nextYear}.`, 'info');
            _setCurrentYear(nextYear);
            return;
        }
        
        if (!window.confirm(`¿Desea archivar el año ${currentYear} e iniciar el ${nextYear}? Toda la información actual será guardada.`)) {
            return;
        }

        setAllData(prev => ({
            ...prev,
            [nextYear]: createNewYearData()
        }));
        _setCurrentYear(nextYear);
        addToast(`Nuevo año ${nextYear} iniciado.`, 'success');
    };

    // Generic setter creation
    const createYearlyDataSetter = <K extends keyof YearData>(key: K) => {
        return useCallback((updater: React.SetStateAction<YearData[K]>) => {
            setAllData(prevAllData => {
                const currentData = prevAllData[currentYear] || createNewYearData();
                const newValue = typeof updater === 'function' 
                    ? (updater as (prevState: YearData[K]) => YearData[K])(currentData[key]) 
                    : updater;
                return {
                    ...prevAllData,
                    [currentYear]: { ...currentData, [key]: newValue }
                };
            });
        }, [currentYear]);
    };

    const setDocuments = createYearlyDataSetter('documents');
    const setTasks = createYearlyDataSetter('tasks');
    const setEvents = createYearlyDataSetter('events');
    const setFiles = createYearlyDataSetter('files');
    const setTrashItems = createYearlyDataSetter('trashItems');
    const setSchedule = createYearlyDataSetter('schedule');
    const setLaborReport = createYearlyDataSetter('laborReport');
    const setVisitReport = createYearlyDataSetter('visitReport');
    const setLogEntries = createYearlyDataSetter('logEntries');
    
    const importData = useCallback(async (data: BackupData) => {
        if (data.version !== 1 || !data.allData || !data.schoolInfo) {
            throw new Error("Archivo de respaldo inválido o corrupto.");
        }
        try {
            await clearYearlyData();
            await saveAllYearlyData(data.allData);
            
            setAllData(data.allData);
            setSchoolInfo(data.schoolInfo);
            setTemplates(data.templates);
            setSavePath(data.savePath);
            setAccentColor(data.accentColor);
            setFontSizeState(data.fontSize);
            setFontFamilyState(data.fontFamily);
        } catch (error) {
            console.error("Failed to import data into IndexedDB", error);
            addToast("Error crítico al importar datos a la base de datos.", "error");
            throw error;
        }
    }, [addToast, setAccentColor, setFontFamilyState, setFontSizeState]);

    // Notification Logic
    const addNotificationIfNotExists = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        setNotifications(prev => {
            const exists = prev.some(n => !n.read && n.sourceId === notificationData.sourceId && n.title === notificationData.title);
            if (exists) {
                return prev;
            }
            const newNotification: Notification = {
                ...notificationData,
                id: `notif-${Date.now()}-${Math.random()}`,
                timestamp: new Date().toISOString(),
                read: false,
            };
            return [newNotification, ...prev];
        });
    }, []);
    
    useEffect(() => {
        const checkNotifications = () => {
            if (isLoadingData) return;
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
    
            tasks.forEach(task => {
                if (task.status === TaskStatus.Completada) return;
    
                if (task.dueDate === todayStr) {
                    addNotificationIfNotExists({ type: NotificationType.Task, sourceId: task.id, title: 'Tarea vence hoy', message: `"${task.title}"` });
                }
    
                if (task.dueDate <= yesterdayStr) {
                     addNotificationIfNotExists({ type: NotificationType.Task, sourceId: task.id, title: 'Tarea Vencida', message: `"${task.title}" venció el ${formatDate(task.dueDate)}.` });
                }
    
                if (task.priority === TaskPriority.Alta && task.dueDate === tomorrowStr) {
                    addNotificationIfNotExists({ type: NotificationType.Task, sourceId: task.id, title: 'Tarea Prioritaria Próxima', message: `"${task.title}" vence mañana.` });
                }
            });
    
            events.forEach(event => {
                if (event.date === todayStr) {
                    addNotificationIfNotExists({ type: NotificationType.Event, sourceId: event.id, title: 'Evento Hoy', message: `"${event.title}" a las ${event.startTime}.` });
                }
            });
        };
    
        const intervalId = setInterval(checkNotifications, 30 * 1000);
        checkNotifications(); // Initial check
        return () => clearInterval(intervalId);
    }, [tasks, events, addNotificationIfNotExists, isLoadingData]);

    const handleMarkAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const handleMarkAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const handleClearReadNotifications = () => {
        setNotifications(prev => prev.filter(n => !n.read));
        addToast('Notificaciones leídas eliminadas.', 'info');
    };

    // Trash Handlers
    const deleteItem = useCallback((item: any, type: TrashItem['type']) => {
        const name = item.name || item.title || item.content || 'Elemento sin nombre';
        const trashedItem: TrashItem = {
            id: item.id, name: name, type: type,
            deletedDate: new Date().toISOString(), originalData: item
        };
        setTrashItems(prev => [trashedItem, ...prev]);
        addToast(`'${name}' movido a la papelera.`, 'info');
    }, [addToast, setTrashItems]);

    const deleteDocument = useCallback((id: string) => {
        const doc = documents.find(d => d.id === id);
        if (doc) { deleteItem(doc, 'document'); setDocuments(prev => prev.filter(d => d.id !== id)); }
    }, [documents, deleteItem, setDocuments]);

    const deleteTask = useCallback((id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) { deleteItem(task, 'task'); setTasks(prev => prev.filter(t => t.id !== id)); }
    }, [tasks, deleteItem, setTasks]);

    const deleteEvent = useCallback((id: string) => {
        const event = events.find(e => e.id === id);
        if (event) { deleteItem(event, 'event'); setEvents(prev => prev.filter(e => e.id !== id)); }
    }, [events, deleteItem, setEvents]);
    
    const deleteFile = useCallback((id: string) => {
        const file = files.find(f => f.id === id);
        if (file && file.type !== 'folder') { deleteItem(file, 'file'); setFiles(prev => prev.filter(f => f.id !== id)); }
    }, [files, deleteItem, setFiles]);
    
    const deleteFolder = useCallback((id: string) => {
        const folder = files.find(f => f.id === id && f.type === 'folder');
        if (folder) {
            deleteItem(folder, 'folder');
            setFiles(prev => prev.filter(f => f.id !== id));
        }
    }, [files, deleteItem, setFiles]);

    const restoreItem = useCallback((item: TrashItem) => {
        switch (item.type) {
            case 'document': setDocuments(prev => [item.originalData as Document, ...prev]); break;
            case 'task': setTasks(prev => [item.originalData as Task, ...prev]); break;
            case 'event': setEvents(prev => [item.originalData as CalendarEvent, ...prev]); break;
            case 'file': case 'folder': setFiles(prev => [item.originalData as FileItem, ...prev]); break;
        }
        setTrashItems(prev => prev.filter(t => t.id !== item.id));
        addToast(`'${item.name}' ha sido restaurado.`, 'success');
    }, [addToast, setDocuments, setTasks, setEvents, setFiles, setTrashItems]);

    const deletePermanently = useCallback((id: string) => {
        addToast('Elemento eliminado permanentemente.', 'info');
        setTrashItems(prev => prev.filter(t => t.id !== id));
    }, [addToast, setTrashItems]);
    
    const emptyTrash = useCallback(() => {
        addToast('La papelera ha sido vaciada.', 'info');
        setTrashItems([]);
    }, [addToast, setTrashItems]);
    
    const handleSaveTemplate = useCallback((template: Template) => {
        setTemplates(prev => {
            const index = prev.findIndex(t => t.id === template.id);
            if (index > -1) {
                const newTemplates = [...prev];
                newTemplates[index] = template;
                return newTemplates;
            }
            return [template, ...prev];
        });
        addToast(`Plantilla '${template.name}' guardada.`, 'success');
    }, [addToast]);

    const handleDeleteTemplate = useCallback((id: string) => {
        setTemplates(prev => prev.filter(t => t.id !== id));
        addToast('Plantilla eliminada.', 'info');
    }, [addToast]);
    
    const appContextForAI: AppContextForAIType = useMemo(() => ({
        documents: documents.filter(d => d.status === DocumentStatus.Entrante),
        tasks, events,
        files: files.filter(f => f.type !== 'folder'),
        folders: files.filter(f => f.type === 'folder'),
    }), [documents, tasks, events, files]);

    const value: AppContextType = {
        theme, accentColor, currentView, isCommandPaletteOpen, isSidebarCollapsed, schoolInfo, templates, isSearchModalOpen, savePath, toasts, View, fontSize, fontFamily, isLoadingData,
        allData, importData, currentYear, availableYears, documents, tasks, events, files, trashItems, schedule, laborReport, visitReport, logEntries, notifications, appContextForAI,
        taskForDocFlow, viewingDocInfo, viewingTask, viewingEvent, previewingFile,
        toggleTheme, setAccentColor, setCurrentView, addToast, toggleCommandPalette, toggleSidebar, setSchoolInfo, handleSaveTemplate, handleDeleteTemplate, toggleSearchModal, setSavePath, setFontSize, setFontFamily,
        setCurrentYear, startNewYear, setDocuments, setTasks, setEvents, setFiles, setTrashItems, setSchedule, setLaborReport, setVisitReport, setLogEntries,
        setTaskForDocFlow, setViewingDocInfo, setViewingTask, setViewingEvent, setPreviewingFile,
        setNotifications, handleMarkAsRead, handleMarkAllAsRead, handleClearReadNotifications,
        deleteDocument, deleteTask, deleteEvent, deleteFile, deleteFolder,
        restoreItem, deletePermanently, emptyTrash,
        showBackupReminder, confirmBackup,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};