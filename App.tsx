
import React, { useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DocumentManager from './components/DocumentManager';
import DocumentEditor from './components/DocumentEditor';
import TaskManager from './components/TaskManager';
import EventManager from './components/EventManager';
import FileManager from './components/FileManager';
import Reports from './components/Reports';
import TrashManager from './components/TrashManager';
import Settings from './components/Settings';
import { useApp } from './contexts/AppContext';
import { View, Document, Task, CalendarEvent } from './types';
import { NAVIGATION_ITEMS } from './constants';
import ToastContainer from './components/ToastContainer';
import CommandPalette from './components/CommandPalette';
import GlobalSearchModal from './components/GlobalSearchModal';
import { formatDate } from './utils/dateFormatter';
import FilePreviewModal from './components/FilePreviewModal';

// MODALS MOVED HERE FOR GLOBAL ACCESS
const DocumentViewModal: React.FC<{ 
    docInfo: { doc: Document, regNum: string } | null; 
    onClose: () => void; 
}> = ({ docInfo, onClose }) => {
    const { tasks } = useApp();
    if (!docInfo) return null;
    const { doc, regNum } = docInfo;
    
    const originatingTask = doc.generatedFromTaskId ? tasks.find(t => t.id === doc.generatedFromTaskId) : null;
    
    const details: { label: string; value: React.ReactNode; fullWidth?: boolean }[] = [
        { label: "N° de Registro", value: regNum },
        { label: "N° de Documento", value: doc.docNumber },
        { label: "Tipo de Documento", value: doc.documentType },
        { label: "Remitente", value: doc.sender },
        { label: "Destinatario", value: doc.recipient },
        { label: "Fecha de Envío (Remitente)", value: formatDate(doc.sentDate) },
        { label: "Fecha de Recibido", value: formatDate(doc.receivedDate) },
        { label: "Fecha de Sello (Saliente)", value: formatDate(doc.stampDate) },
        { label: "Trámite", value: doc.procedure },
        { label: "Tipo de Soporte", value: doc.supportType },
        { label: "N° de Folios", value: doc.folioCount?.toString() },
        { label: "Estado", value: doc.status },
        { label: "Recibido por", value: doc.receivedBy },
        { label: "Fecha Recepción", value: formatDate(doc.receptionDate) },
        { label: "Asunto / Contenido", value: doc.content, fullWidth: true },
    ];
    
    if (originatingTask) {
        details.push({
            label: "Originado desde Tarea",
            value: originatingTask.title,
            fullWidth: true,
        });
    }
    
    if (doc.fileDataUrl) {
         details.push({
            label: "Documento Adjunto",
            value: (
                <a 
                    href={doc.fileDataUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    download={`documento_${doc.docNumber || doc.id}`} 
                    className="text-nexus-primary hover:underline font-semibold flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Ver / Descargar Archivo
                </a>
            ),
            fullWidth: true,
        });
    }

    const visibleDetails = details.filter(d => d.value && d.value !== '-');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[110]" onClick={onClose}>
            <div className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-nexus-primary mb-4">Detalles del Documento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 max-h-[70vh] overflow-y-auto pr-2">
                    {visibleDetails.map(item => (
                        <div key={item.label} className={item.fullWidth ? 'md:col-span-2' : ''}>
                            <p className="text-sm font-semibold text-slate-500 dark:text-nexus-text-secondary">{item.label}</p>
                            <div className="text-slate-900 dark:text-white whitespace-pre-wrap break-words mt-1">
                                {item.value}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 dark:border-nexus-border">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-nexus-primary text-white hover:bg-nexus-secondary">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

const TaskViewModal: React.FC<{ task: Task | null; onClose: () => void; }> = ({ task, onClose }) => {
    const { documents, setViewingDocInfo } = useApp();

    if (!task) return null;

    const linkedDocument = task.linkedDocumentId ? documents.find(d => d.id === task.linkedDocumentId) : null;
    
    const handleViewDocument = (doc: Document) => {
        setViewingDocInfo({ doc, regNum: 'N/A (desde Tarea)' });
        onClose();
    };

    const details: { label: string; value: React.ReactNode, fullWidth?: boolean }[] = [
        { label: "Título", value: task.title },
        { label: "Estado", value: task.status },
        { label: "Prioridad", value: task.priority },
        { label: "Fecha de Creación", value: formatDate(task.creationDate) },
        { label: "Fecha de Vencimiento", value: formatDate(task.dueDate) },
        { label: "Descripción", value: task.description, fullWidth: true },
    ];
    
    if (linkedDocument) {
        details.push({
            label: "Documento Vinculado",
            value: (
                <button onClick={() => handleViewDocument(linkedDocument)} className="text-nexus-primary hover:underline font-semibold text-left">
                    {linkedDocument.docNumber || linkedDocument.content}
                </button>
            ),
            fullWidth: true
        });
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[110]" onClick={onClose}>
            <div className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-nexus-primary mb-4">Detalles de la Tarea</h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                     {details.map(item => (
                        <div key={item.label} className={item.fullWidth ? 'col-span-1' : ''}>
                            <p className="text-sm font-semibold text-slate-500 dark:text-nexus-text-secondary">{item.label}</p>
                            <div className="text-slate-900 dark:text-white whitespace-pre-wrap break-words mt-1">{item.value || '-'}</div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 dark:border-nexus-border">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-nexus-primary text-white hover:bg-nexus-secondary">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

const EventViewModal: React.FC<{ event: CalendarEvent | null; onClose: () => void; }> = ({ event, onClose }) => {
    if (!event) return null;

    const details: { label: string; value: React.ReactNode; fullWidth?: boolean }[] = [
        { label: "Título", value: event.title },
        { label: "Fecha", value: formatDate(event.date) },
        { label: "Hora de Inicio", value: event.startTime },
        { label: "Hora de Fin", value: event.endTime },
        { label: "Descripción", value: event.description, fullWidth: true },
    ];

    if (event.attachedDocumentUrl) {
        details.push({
            label: "Documento Adjunto",
            value: (
                <a 
                    href={event.attachedDocumentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    download={`documento_adjunto_${event.id}`} 
                    className="text-nexus-primary hover:underline font-semibold flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Ver / Descargar Archivo
                </a>
            ),
            fullWidth: true,
        });
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[110]" onClick={onClose}>
            <div className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-nexus-primary mb-4">Detalles del Evento</h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {details.map(item => (
                        <div key={item.label} className={item.fullWidth ? 'col-span-1' : ''}>
                            <p className="text-sm font-semibold text-slate-500 dark:text-nexus-text-secondary">{item.label}</p>
                            <div className="text-slate-900 dark:text-white whitespace-pre-wrap break-words mt-1">{item.value}</div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 dark:border-nexus-border">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-nexus-primary text-white hover:bg-nexus-secondary">Cerrar</button>
                </div>
            </div>
        </div>
    );
};


const MainContent: React.FC = () => {
    const { currentView, appContextForAI, isSidebarCollapsed } = useApp();

    const currentNavItem = NAVIGATION_ITEMS.find(item => 'view' in item && item.view === currentView);
    const currentViewInfo = currentNavItem || NAVIGATION_ITEMS[0];

    const renderView = () => {
        switch (currentView) {
            case View.Dashboard: return <Dashboard />;
            case View.Documents: return <DocumentManager />;
            case View.Tasks: return <TaskManager />;
            case View.Events: return <EventManager />;
            case View.Files: return <FileManager />;
            case View.Reports: return <Reports />;
            case View.Editor: return <DocumentEditor />;
            case View.Trash: return <TrashManager />;
            case View.Settings: return <Settings />;
            default: return <Dashboard />;
        }
    };
    
    return (
        <main className="flex-1 flex flex-col overflow-hidden">
            <div className={`p-6 flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'pl-20' : ''}`}>
                <Header
                    title={currentViewInfo.label}
                    subtitle={currentViewInfo.subtitle || `Gestiona tus ${currentViewInfo.label.toLowerCase()}.`}
                    appContext={appContextForAI}
                />
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {renderView()}
            </div>
        </main>
    );
}

const AppContent: React.FC = () => {
    const { 
        toggleCommandPalette, 
        viewingDocInfo, setViewingDocInfo,
        viewingTask, setViewingTask,
        viewingEvent, setViewingEvent,
        previewingFile, setPreviewingFile,
        isLoadingData
    } = useApp();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleCommandPalette();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [toggleCommandPalette]);

    if (isLoadingData) {
        return (
            <div className="h-screen w-screen bg-slate-50 dark:bg-nexus-dark flex justify-center items-center">
                <div className="flex items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-nexus-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-lg font-semibold text-slate-700 dark:text-nexus-text">Cargando Nexus OS...</span>
                </div>
            </div>
        );
    }
    
    return (
        <>
            <div className="h-screen w-screen bg-slate-50 dark:bg-nexus-dark text-slate-900 dark:text-nexus-text flex overflow-hidden">
                <Sidebar />
                <MainContent />
            </div>
            <ToastContainer />
            <CommandPalette />
            <GlobalSearchModal />
            <DocumentViewModal docInfo={viewingDocInfo} onClose={() => setViewingDocInfo(null)} />
            <TaskViewModal task={viewingTask} onClose={() => setViewingTask(null)} />
            <EventViewModal event={viewingEvent} onClose={() => setViewingEvent(null)} />
            <FilePreviewModal file={previewingFile} onClose={() => setPreviewingFile(null)} />
        </>
    )
}


const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;
