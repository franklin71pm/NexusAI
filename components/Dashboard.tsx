
import React from 'react';
// Fix: Import types from the centralized types.ts file
import { TaskStatus, DocumentStatus, Document, Task, CalendarEvent, View } from '../types';
import Card from './common/Card';
import { useApp } from '../contexts/AppContext';
import { formatDate } from '../utils/dateFormatter';

const Dashboard: React.FC = () => {
    const { documents, tasks, events, setCurrentView, setViewingTask, setViewingEvent } = useApp();

    const pendingTasks = tasks.filter(t => t.status === TaskStatus.Pendiente || t.status === 'En Progreso').slice(0, 5);
    const recentDocuments = documents.filter(d => d.status === DocumentStatus.Entrante).slice(0, 5);
    
    const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date(new Date().toDateString()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

  const quickActions = [
      { label: "Analizar Documento", view: View.Documents, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" /></svg> },
      { label: "Añadir Tarea", view: View.Tasks, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { label: "Nuevo Evento", view: View.Events, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
      { label: "Generar Informe", view: View.Reports, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  ];
  
  return (
    <div className="space-y-6 animate-fade-in">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map(action => (
                <button key={action.label} onClick={() => setCurrentView(action.view)} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/70 dark:bg-nexus-surface/70 backdrop-blur-sm border border-slate-200 dark:border-nexus-border rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all text-nexus-primary">
                    {action.icon}
                    <span className="text-sm font-semibold text-center">{action.label}</span>
                </button>
            ))}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tareas Urgentes */}
            <Card className="lg:col-span-1">
                <h3 className="font-bold text-lg text-nexus-primary mb-4">Tareas Urgentes</h3>
                {pendingTasks.length > 0 ? (
                    <ul className="space-y-3">
                        {pendingTasks.map(task => (
                            <li key={task.id} className="flex justify-between items-center text-sm">
                                <button
                                    onClick={() => setViewingTask(task)}
                                    className="font-medium text-slate-800 dark:text-nexus-text text-left hover:text-nexus-primary dark:hover:text-nexus-primary hover:underline transition-colors"
                                >
                                    {task.title}
                                </button>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    task.priority === 'Alta' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                                    task.priority === 'Media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                }`}>{task.priority}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-slate-500 dark:text-nexus-text-secondary">No hay tareas urgentes.</p>}
            </Card>

            {/* Próximos Eventos */}
            <Card className="lg:col-span-1">
                <h3 className="font-bold text-lg text-nexus-primary mb-4">Próximos Eventos</h3>
                 {upcomingEvents.length > 0 ? (
                    <ul className="space-y-4">
                        {upcomingEvents.map(event => (
                            <li key={event.id} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-nexus-primary/20 text-nexus-primary rounded-lg flex flex-col items-center justify-center font-bold">
                                    <span className="text-xs -mb-1">{new Date(event.date + 'T00:00:00').toLocaleString('es-ES', { month: 'short' })}</span>
                                    <span className="text-lg">{new Date(event.date + 'T00:00:00').getDate()}</span>
                                </div>
                                <div>
                                    <button
                                        onClick={() => setViewingEvent(event)}
                                        className="font-semibold text-slate-800 dark:text-nexus-text text-left hover:text-nexus-primary dark:hover:text-nexus-primary hover:underline transition-colors"
                                    >
                                        {event.title}
                                    </button>
                                    <p className="text-xs text-slate-500 dark:text-nexus-text-secondary">{event.startTime} - {event.endTime}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-slate-500 dark:text-nexus-text-secondary">No hay eventos próximos.</p>}
            </Card>

            {/* Documentos Recientes */}
            <Card className="lg:col-span-1">
                <h3 className="font-bold text-lg text-nexus-primary mb-4">Documentos Recientes (Entrantes)</h3>
                {recentDocuments.length > 0 ? (
                    <ul className="space-y-3">
                        {recentDocuments.map(doc => (
                             <li key={doc.id} className="text-sm">
                                <p className="font-medium text-slate-800 dark:text-nexus-text truncate" title={doc.content}>{doc.content}</p>
                                <p className="text-xs text-slate-500 dark:text-nexus-text-secondary">De: {doc.sender} - {formatDate(doc.receivedDate)}</p>
                             </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-slate-500 dark:text-nexus-text-secondary">No hay documentos entrantes recientes.</p>}
            </Card>

        </div>
    </div>
  );
};

export default Dashboard;
