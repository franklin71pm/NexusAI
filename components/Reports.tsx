
import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
// Fix: Import types from the centralized types.ts file
import { Document, Task, CalendarEvent, ReportRow as ReportRowType, TaskPriority, TaskStatus, VisitSummaryRow, VisitReportData } from '../types';
import { generateLaborReportDraft, generateLogEntrySuggestion, generateScheduleDraft, parseActivitiesFromText, analyzeVisitSheets } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';

type ReportTab = 'schedule' | 'report' | 'visit' | 'log';
type ReportRow = ReportRowType;

// Data extracted from the user's image for October 2025
const initialScheduleData: { [key: string]: string } = {
  '2025-10-01': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Reunión con personal docente y administrativo.',
  '2025-10-02': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Actualización de documentación.',
  '2025-10-03': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Consulta de padres de familia.',
  '2025-10-06': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Planificación semanal. Consulta de padres de familia.',
  '2025-10-07': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Gestión de compras CNP.',
  '2025-10-08': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Visita a docente: Susana García.',
  '2025-10-09': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina.',
  '2025-10-10': 'Reunión de directores. Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas.',
  '2025-10-13': 'Día de las Culturas. Participación en actos cívicos. Atención a imprevistos y consultas. Trabajo administrativo de oficina.',
  '2025-10-14': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Coordinación de actividades pedagógicas. Gestión de compras CNP.',
  '2025-10-15': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Reunión con el comité de apoyo educativo. Visita a docente: Damarys Cordero.',
  '2025-10-16': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Reunión con la Junta de Educación.',
  '2025-10-17': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Consulta a padres de familia.',
  '2025-10-20': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Planificación semanal.',
  '2025-10-21': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Gestión de compras CNP.',
  '2025-10-22': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Visita a docente: Maureen Arguedas Morera',
  '2025-10-23': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Reunión con la Junta de Educación.',
  '2025-10-24': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Visita a docente: Maureen Arguedas Morera',
  '2025-10-27': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Planificación semanal. Consulta a padres de familia.',
  '2025-10-28': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Gestión de compras CNP.',
  '2025-10-29': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Reunión comité EPI.',
  '2025-10-30': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Elaboración de informes mensuales.',
  '2025-10-31': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Planificación mensual y revisión de informes.',
};

const initialLaborReportData: ReportRow[] = [
  { id: 'lr-1', day: '01', activity: 'Iniciamos el mes con la revisión detallada de la bandeja de correos electrónicos y los trámites institucionales pendientes. Se realizó la planificación semanal, estableciendo prioridades y plazos. Además, se supervisó la asistencia del personal, verificando el cumplimiento de los horarios establecidos.', observations: '' },
  { id: 'lr-2', day: '02', activity: 'La jornada se dedicó al trabajo administrativo de oficina, con especial atención a la coordinación de proyectos pedagógicos en desarrollo. Se atendieron diversas consultas de padres de familia, brindando orientación sobre procesos académicos y administrativos.', observations: '' },
  { id: 'lr-3', day: '03', activity: 'Se llevó a cabo una reunión con el personal docente y administrativo para evaluar avances y ajustar estrategias. Posteriormente, se revisaron reglamentos internos y se organizó documentación institucional, asegurando su correcto archivo y acceso.', observations: '' },
  { id: 'lr-4', day: '04', activity: 'Realicé supervisión de los espacios escolares, verificando condiciones de infraestructura, limpieza y seguridad. También se atendieron imprevistos menores relacionados con el uso de aulas y áreas comunes.', observations: '' },
  { id: 'lr-5', day: '05', activity: 'Dedicamos la mañana al trabajo administrativo y al análisis de indicadores de gestión escolar. Por la tarde, se inició la planificación de los ensayos para los actos patrios del mes, coordinando con docentes responsables.', observations: '' },
  { id: 'lr-6', day: '06-07', activity: '', observations: '' },
  { id: 'lr-7', day: '08', activity: 'Iniciamos la semana con la redacción de documentos administrativos y oficios varios. Se revisó la bandeja de correos y se ajustó la planificación semanal en función de las necesidades emergentes.', observations: '' },
  { id: 'lr-8', day: '09', activity: 'Se participó en la reunión de directores convocada por la Supervisión Circuito 01, donde se trataron temas de interés regional y se compartieron buenas prácticas.', observations: '' },
];

const initialVisitReportData: VisitReportData = {
    summaryRows: [
        { id: 'vr-1', level: 'Quinto', officialName: 'Idaly Granados Picado', plannedVisits: '', actualVisits: '' },
        { id: 'vr-2', level: 'Primero', officialName: 'Susana García Álvarez', plannedVisits: '3', actualVisits: '2' },
    ],
    principalResults: '• El ambiente fue positivo, con apertura al diálogo y trabajo en equipo.\n• Los estudiantes respondieron con entusiasmo a las propuestas y lograron reflexionar sobre la importancia de la convivencia armónica.\n• Se evidenció apoyo y acompañamiento de la docente durante el desarrollo del taller.',
    recommendations: '1. Dar continuidad a las dinámicas de convivencia en el aula, reforzando las normas y acuerdos generados.\n2. Propiciar espacios periódicos para el diálogo grupal sobre la convivencia, resolviendo dificultades de forma constructiva.\n3. Involucrar a los estudiantes en la creación de un lema o compromiso de aula que refuerce los valores trabajados.\n4. Mantener la colaboración entre docente y estudiantes para fortalecer la cultura de paz en la institución.',
    recommendationDeadlines: '',
    followUpActions: 'Se dará seguimiento',
    followUpDeadlines: 'Noviembre',
};

const ActivityToActionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    dayText: string;
    date: string;
    actionType: 'task' | 'event';
}> = ({ isOpen, onClose, dayText, date, actionType }) => {
    const { setTasks, setEvents } = useApp();
    const [isLoadingAI, setIsLoadingAI] = useState(true);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [modalStep, setModalStep] = useState<'selection' | 'timing'>('selection');
    const [eventTimeDetails, setEventTimeDetails] = useState<{[key: string]: {startTime: string, endTime: string}}>({});


    useEffect(() => {
        if (isOpen && dayText) {
            const getSuggestions = async () => {
                setIsLoadingAI(true);
                setError('');
                try {
                    const suggestions = await parseActivitiesFromText(dayText);
                    setAiSuggestions(suggestions);
                } catch (e) {
                    setError(e instanceof Error ? e.message : 'Error desconocido');
                } finally {
                    setIsLoadingAI(false);
                }
            };
            getSuggestions();
        } else {
            setAiSuggestions([]);
            setSelectedActivities([]);
            setError('');
            setIsLoadingAI(false);
            setModalStep('selection');
            setEventTimeDetails({});
        }
    }, [isOpen, dayText]);
    
    const handleActivitySelectionChange = (activity: string) => {
        setSelectedActivities(prev =>
            prev.includes(activity)
                ? prev.filter(a => a !== activity)
                : [...prev, activity]
        );
    };

    const handleTimeChange = (activity: string, field: 'startTime' | 'endTime', value: string) => {
        setEventTimeDetails(prev => ({
            ...prev,
            [activity]: {
                // Fix: Provide a default object to spread from in case prev[activity] is undefined
                ...(prev[activity] || { startTime: '09:00', endTime: '10:00' }),
                [field]: value,
            },
        }));
    };

    const convertTo12Hour = (time24: string): string => {
        if (!time24) return '12:00 AM';
        const [hour, minute] = time24.split(':');
        let hour12 = parseInt(hour, 10);
        const period = hour12 >= 12 ? 'PM' : 'AM';
        hour12 = hour12 % 12 || 12;
        return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
    };

    const handleConfirm = () => {
        setError('');
        if (actionType === 'task') {
            if (selectedActivities.length === 0) {
                setError('Por favor, seleccione al menos una tarea para crear.');
                return;
            }
            const newTasks: Task[] = selectedActivities.map((text, index) => ({
                id: `task-sched-${date}-${Math.random()}-${index}`,
                title: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                description: text,
                creationDate: new Date().toISOString().split('T')[0],
                dueDate: date,
                priority: TaskPriority.Media,
                status: TaskStatus.Pendiente,
            }));
            setTasks(prev => [...newTasks, ...prev]);
            onClose();

        } else if (actionType === 'event') {
            if (modalStep === 'selection') {
                if (selectedActivities.length === 0) {
                    setError('Por favor, seleccione al menos un evento para crear.');
                    return;
                }
                const initialTimes: {[key: string]: {startTime: string, endTime: string}} = {};
                selectedActivities.forEach(activity => {
                    initialTimes[activity] = { startTime: '09:00', endTime: '10:00' };
                });
                setEventTimeDetails(initialTimes);
                setModalStep('timing');
            } else { // modalStep === 'timing'
                 // Fix: Cast 'times' to the correct type to resolve properties 'startTime' and 'endTime'.
                 const newEvents: CalendarEvent[] = Object.entries(eventTimeDetails).map(([text, times]) => {
                    const timeDetails = times as { startTime: string; endTime: string };
                    return {
                        id: `event-sched-${date}-${Math.random()}`,
                        title: text,
                        date: date,
                        startTime: convertTo12Hour(timeDetails.startTime),
                        endTime: convertTo12Hour(timeDetails.endTime),
                        description: `Evento generado desde la programación mensual.`
                    };
                });
                setEvents(prev => [...newEvents, ...prev]);
                onClose();
            }
        }
    };
    
    if (!isOpen) return null;

    const renderSelectionStep = () => (
        <>
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-1">Programación Original del Día</label>
                <p className="text-sm p-3 bg-slate-50 dark:bg-nexus-dark rounded-md border border-slate-200 dark:border-nexus-border whitespace-pre-wrap">{dayText}</p>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-1">
                  Seleccione las actividades sugeridas para crear:
                </label>
                {isLoadingAI && <p className="text-sm text-slate-500">Analizando actividades...</p>}
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {aiSuggestions.map((s, i) => (
                        <label key={i} className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-nexus-surface transition-colors border border-slate-200 dark:border-nexus-border">
                            <input
                                type="checkbox"
                                checked={selectedActivities.includes(s)}
                                onChange={() => handleActivitySelectionChange(s)}
                                className="h-4 w-4 rounded border-slate-300 text-nexus-primary focus:ring-nexus-primary"
                            />
                            <span className="text-sm text-slate-800 dark:text-nexus-text">{s}</span>
                        </label>
                    ))}
                </div>
            </div>
        </>
    );
    
    const renderTimingStep = () => (
        <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-2">Configure la hora para cada evento:</label>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {Object.keys(eventTimeDetails).map(activity => (
                    <div key={activity} className="p-3 bg-slate-50 dark:bg-nexus-dark rounded-md border border-slate-200 dark:border-nexus-border">
                        <p className="text-sm font-semibold text-slate-800 dark:text-nexus-text mb-2">{activity}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-nexus-text-secondary mb-1">Hora Inicio</label>
                                <input type="time" value={eventTimeDetails[activity].startTime} onChange={(e) => handleTimeChange(activity, 'startTime', e.target.value)} className="form-input text-sm p-2 w-full" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-nexus-text-secondary mb-1">Hora Fin</label>
                                <input type="time" value={eventTimeDetails[activity].endTime} onChange={(e) => handleTimeChange(activity, 'endTime', e.target.value)} className="form-input text-sm p-2 w-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60]" onClick={onClose}>
            <div className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-nexus-primary mb-4">Asistente para Crear Acción</h2>
                
                {modalStep === 'selection' ? renderSelectionStep() : renderTimingStep()}
                
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-nexus-border">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded bg-slate-200 text-slate-800 dark:bg-nexus-surface dark:text-white hover:bg-slate-300 dark:hover:bg-nexus-border">Cancelar</button>
                    <button type="button" onClick={handleConfirm} className="px-4 py-2 text-sm rounded bg-nexus-primary text-white hover:bg-nexus-secondary">
                        {actionType === 'event' && modalStep === 'selection' 
                            ? 'Siguiente' 
                            : `Confirmar y Crear ${selectedActivities.length} ${actionType === 'task' ? 'Tarea(s)' : 'Evento(s)'}`
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};


const ScheduleEditModal: React.FC<{
    date: string;
    initialText: string;
    onSave: (date: string, text: string) => void;
    onClose: () => void;
    onTriggerAction: (actionType: 'task' | 'event') => void;
}> = ({ date, initialText, onSave, onClose, onTriggerAction }) => {
    const [text, setText] = useState(initialText);
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const handleSave = () => onSave(date, text);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-nexus-primary mb-2">Editar Actividades</h2>
                <p className="text-slate-500 dark:text-nexus-text-secondary mb-4">{formattedDate}</p>
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className="w-full bg-slate-50 dark:bg-nexus-dark border border-slate-300 dark:border-nexus-border rounded-md p-2 focus:ring-2 focus:ring-nexus-accent focus:outline-none"
                    placeholder="Añadir actividades para este día..."
                />

                <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-nexus-border flex-wrap">
                    <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded bg-slate-200 text-slate-800 dark:bg-nexus-surface dark:text-white hover:bg-slate-300 dark:hover:bg-nexus-border">Cancelar</button>
                    <button type="button" onClick={() => onTriggerAction('task')} className="px-3 py-2 text-sm rounded bg-cyan-500 text-white hover:bg-cyan-600">Crear Tarea</button>
                    <button type="button" onClick={() => onTriggerAction('event')} className="px-3 py-2 text-sm rounded bg-purple-500 text-white hover:bg-purple-600">Crear Evento</button>
                    <button type="button" onClick={handleSave} className="px-3 py-2 text-sm rounded bg-nexus-primary text-white hover:bg-nexus-secondary">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};

const MonthlySchedule: React.FC = () => {
    const { setTasks, setEvents, schoolInfo } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)); // Default to Oct 2025 to show demo data
    const [scheduleData, setScheduleData] = useState<{ [key: string]: string }>(initialScheduleData);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'task' | 'event' | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState('');

    const firstDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate]);
    const daysInMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(), [currentDate]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const handleDayClick = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
        setIsEditModalOpen(true);
    };
    
    const closeAllModals = () => {
        setIsEditModalOpen(false);
        setIsActionModalOpen(false);
        setSelectedDate(null);
        setActionType(null);
    };

    const handleTriggerAction = (type: 'task' | 'event') => {
        setActionType(type);
        setIsActionModalOpen(true);
    };

    const handleSaveActivity = (date: string, text: string) => {
        setScheduleData(prev => ({...prev, [date]: text}));
        closeAllModals();
    };

    const handleGenerateDraft = async () => {
        setIsGenerating(true);
        setGenerationError('');
        try {
            const month = currentDate.getMonth();
            const year = currentDate.getFullYear();
            const draftData = await generateScheduleDraft(month, year, scheduleData);
    
            if (Object.keys(draftData).length > 0) {
                setScheduleData(prev => ({ ...prev, ...draftData }));
            } else {
                setGenerationError("La IA no generó nuevas actividades para este mes.");
            }
        } catch (error) {
            setGenerationError(error instanceof Error ? error.message : 'Ocurrió un error desconocido.');
        } finally {
            setIsGenerating(false);
        }
    };

    const calendarGrid = useMemo(() => {
        const dayOfWeek = firstDayOfMonth.getDay(); 
        const blanks = Array(dayOfWeek).fill(null);
        const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        return [...blanks, ...daysArray];
    }, [firstDayOfMonth, daysInMonth]);

    const generateScheduleHtml = (): string => {
        const monthName = currentDate.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
        const year = currentDate.getFullYear();
        
        let tableRows = '';
        let weekCells = '';
        calendarGrid.forEach((day, index) => {
            const dayIndex = index % 7;
            const isWeekend = dayIndex === 0 || dayIndex === 6;
            const cellWidth = isWeekend ? '5%' : '18%';

            if (index % 7 === 0 && weekCells) {
                tableRows += `<tr class="body-row">${weekCells}</tr>`;
                weekCells = '';
            }
            
            const cellStyle = `min-height: 100px; width: ${cellWidth}; vertical-align: top; padding: 4px;`;

            if (day === null) {
                weekCells += `<td style="${cellStyle}"></td>`;
            } else {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const activity = scheduleData[dateStr] || '';
                weekCells += `<td style="${cellStyle}"><strong>${day}.</strong> ${activity.replace(/\n/g, '<br>')}</td>`;
            }
        });
        if (weekCells) {
             // Ensure the last row is always complete with 7 cells for aesthetic consistency.
            const dayOfWeekOfLastDay = (firstDayOfMonth.getDay() + daysInMonth - 1) % 7;
            if (dayOfWeekOfLastDay < 6) { // If the last day is not Saturday
                const remainingCells = 6 - dayOfWeekOfLastDay;
                for (let i = 0; i < remainingCells; i++) {
                    const nextDayIndex = dayOfWeekOfLastDay + 1 + i;
                    const isWeekendCell = nextDayIndex === 6;
                    const cellWidth = isWeekendCell ? '5%' : '18%';
                    const cellStyle = `min-height: 100px; width: ${cellWidth}; vertical-align: top; padding: 4px;`;
                    weekCells += `<td style="${cellStyle}"></td>`;
                }
            }
            tableRows += `<tr class="body-row">${weekCells}</tr>`;
        }
        return `
            <html>
                <head>
                    <title>Programación ${monthName} ${year}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 1cm; }
                        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                        th, td { border: 1px solid black; padding: 5px; font-size: 10px; word-wrap: break-word; vertical-align: top; box-sizing: border-box; }
                        tr.body-row { height: 100px; }
                        th { background-color: #f2f2f2; padding-top: 2px; padding-bottom: 2px; }
                        .header { text-align: center; margin-bottom: 15px; }
                        .header-text { font-weight: bold; margin: 0; line-height: 1.2; font-size: 11px; }
                        .header-title { margin-top: 10px; margin-bottom: 5px; font-size: 14px; }
                        .signature { text-align: center; margin-top: 25px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <p class="header-text">Ministerio de Educación Pública</p>
                        <p class="header-text">Dirección Regional de Educación Grande del Térraba</p>
                        <p class="header-text">Supervisión Circuito 01</p>
                        <p class="header-text">${schoolInfo.schoolName}</p>
                        <h2 class="header-title">PROGRAMACIÓN ${monthName} ${year}</h2>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 5%;">Do</th>
                                <th style="width: 18%;">Lunes</th>
                                <th style="width: 18%;">Martes</th>
                                <th style="width: 18%;">Miércoles</th>
                                <th style="width: 18%;">Jueves</th>
                                <th style="width: 18%;">Viernes</th>
                                <th style="width: 5%;">Sá</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    <div class="signature">
                        <p>_________________________</p>
                        <p>${schoolInfo.directorName}</p>
                    </div>
                </body>
            </html>
        `;
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const printContent = generateScheduleHtml();
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };

    const handleDownloadDoc = () => {
        const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
        const year = currentDate.getFullYear();
        const htmlContent = `<!DOCTYPE html>${generateScheduleHtml()}`;
        
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Programacion_${monthName}_${year}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <div>
            {isEditModalOpen && selectedDate && (
                <ScheduleEditModal 
                    date={selectedDate}
                    initialText={scheduleData[selectedDate] || ''}
                    onSave={handleSaveActivity}
                    onClose={closeAllModals}
                    onTriggerAction={handleTriggerAction}
                />
            )}
            {isActionModalOpen && selectedDate && actionType && (
                 <ActivityToActionModal
                    isOpen={isActionModalOpen}
                    onClose={closeAllModals}
                    dayText={scheduleData[selectedDate] || ''}
                    date={selectedDate}
                    actionType={actionType}
                />
            )}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-nexus-surface">&lt;</button>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white w-48 text-center capitalize">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-nexus-surface">&gt;</button>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleGenerateDraft} disabled={isGenerating} className="bg-cyan-500 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-600 transition-colors disabled:bg-slate-400 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {isGenerating ? 'Generando...' : 'Generar Borrador con IA'}
                    </button>
                    <button onClick={handleDownloadDoc} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                        Descargar .doc
                    </button>
                    <button onClick={handlePrint} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 dark:bg-nexus-surface dark:hover:bg-nexus-border transition-colors">
                        Imprimir / Guardar PDF
                    </button>
                </div>
            </div>
             {generationError && <p className="text-red-500 text-sm text-right mb-4 -mt-2">{generationError}</p>}
            <div 
                className="grid gap-1 text-center font-semibold text-slate-500 dark:text-nexus-text-secondary border-b-2 border-slate-200 dark:border-nexus-border"
                style={{ gridTemplateColumns: '0.5fr repeat(5, 1fr) 0.5fr' }}
            >
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div 
                className="grid gap-1"
                style={{ gridTemplateColumns: '0.5fr repeat(5, 1fr) 0.5fr' }}
            >
                {calendarGrid.map((day, index) => {
                    const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                    const activity = day ? scheduleData[dateStr] || '' : '';
                    const dayOfWeek = index % 7;
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    return (
                        <div 
                            key={index} 
                            onClick={() => day && handleDayClick(day)}
                            className={`h-32 border border-slate-200 dark:border-nexus-border rounded p-1 overflow-hidden relative transition-colors duration-200 ${day ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-nexus-surface/50' : 'bg-slate-50 dark:bg-nexus-dark/50'} ${isWeekend ? 'bg-slate-50/50 dark:bg-nexus-dark/30' : ''}`}
                        >
                            {day && (
                                <>
                                    <span className="font-mono text-sm pl-1 text-slate-700 dark:text-nexus-text">{day}</span>
                                    <p className="text-xs mt-1 px-1 text-slate-600 dark:text-nexus-text-secondary truncate-multiline">
                                        {activity}
                                    </p>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
             <style>{`
                .truncate-multiline {
                    display: -webkit-box;
                    -webkit-line-clamp: 5;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                 .form-input { 
                    width: 100%; 
                    background-color: #F8FAFC; 
                    border: 1px solid #CBD5E1; 
                    border-radius: 0.375rem; 
                    padding: 0.5rem; 
                } 
                .dark .form-input { 
                    background-color: #0D1117; 
                    border-color: #30363D; 
                } 
                .form-input:focus { 
                    outline: none; 
                    box-shadow: 0 0 0 2px #58A6FF; 
                }
            `}</style>
        </div>
    );
}

const MonthlyLaborReport: React.FC = () => {
    const { documents, tasks, events, schoolInfo } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 1)); // Default to Sep 2025
    const [reportData, setReportData] = useState<ReportRow[]>(initialLaborReportData);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState('');

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const handleCellChange = (id: string, field: 'day' | 'activity' | 'observations', value: string) => {
        setReportData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const handleAddRow = () => {
        const newRow: ReportRow = {
            id: `lr-${new Date().toISOString()}`,
            day: '',
            activity: '',
            observations: ''
        };
        setReportData(prev => [...prev, newRow]);
    };

    const handleDeleteRow = (id: string) => {
        setReportData(prev => prev.filter(row => row.id !== id));
    };

    const handleGenerateDraft = async () => {
        setIsGenerating(true);
        setGenerationError('');
        try {
            const month = currentDate.getMonth();
            const year = currentDate.getFullYear();
            const draftData = await generateLaborReportDraft(month, year, documents, tasks, events);
            
            if (draftData && draftData.length > 0) {
                const formattedData = draftData.map((item: Omit<ReportRow, 'id'>) => ({
                    ...item,
                    id: `ai-${item.day}-${Math.random()}`
                }));
                setReportData(formattedData);
            } else {
                setGenerationError("No se encontraron actividades para generar un borrador este mes.");
            }
        } catch (error) {
            setGenerationError(error instanceof Error ? error.message : 'Ocurrió un error desconocido.');
        } finally {
            setIsGenerating(false);
        }
    };

    const generateReportHtml = (): string => {
        const monthName = currentDate.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
        const year = currentDate.getFullYear();

        const tableRows = reportData.map(row => `
            <tr>
                <td style="width: 10%; text-align: center;">${row.day}</td>
                <td style="width: 60%;">${row.activity.replace(/\n/g, '<br>')}</td>
                <td style="width: 30%;">${row.observations.replace(/\n/g, '<br>')}</td>
            </tr>
        `).join('');

        return `
            <html>
                <head>
                    <title>Informe de Labores ${monthName} ${year}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 1cm; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid black; padding: 8px; font-size: 11px; text-align: left; vertical-align: top; }
                        th { background-color: #f2f2f2; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .header-text { font-weight: bold; margin: 0; line-height: 1.2; font-size: 11px; }
                        .header-title { margin-top: 15px; margin-bottom: 10px; font-size: 14px; }
                        .signature { text-align: center; margin-top: 50px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <p class="header-text">Ministerio de Educación Pública</p>
                        <p class="header-text">Dirección Regional de Educación Grande del Térraba</p>
                        <p class="header-text">Supervisión Circuito 01</p>
                        <h2 class="header-title">INFORME DE LABORES REALIZADAS EN ${monthName} ${year}</h2>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 10%;">Día</th>
                                <th style="width: 60%;">Actividad Ejecutada</th>
                                <th style="width: 30%;">Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    <div class="signature">
                        <p>_________________________</p>
                        <p>${schoolInfo.directorName}</p>
                    </div>
                </body>
            </html>
        `;
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(generateReportHtml());
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };

    const handleDownloadDoc = () => {
        const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
        const year = currentDate.getFullYear();
        const htmlContent = `<!DOCTYPE html>${generateReportHtml()}`;
        
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Informe_Labores_${monthName}_${year}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-nexus-surface">&lt;</button>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white w-48 text-center capitalize">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-nexus-surface">&gt;</button>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleGenerateDraft} disabled={isGenerating} className="bg-cyan-500 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-600 transition-colors disabled:bg-slate-400 flex items-center">
                        {isGenerating ? 'Generando...' : 'Generar Borrador con IA'}
                    </button>
                    <button onClick={handleDownloadDoc} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                        Descargar .doc
                    </button>
                    <button onClick={handlePrint} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 dark:bg-nexus-surface dark:hover:bg-nexus-border transition-colors">
                        Imprimir / Guardar PDF
                    </button>
                </div>
            </div>
            {generationError && <p className="text-red-500 text-sm mb-4">{generationError}</p>}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="border-b-2 border-slate-200 dark:border-nexus-border text-sm text-slate-500 dark:text-nexus-text-secondary">
                        <tr>
                            <th className="p-2 w-[10%]">Día</th>
                            <th className="p-2 w-[55%]">Actividad Ejecutada</th>
                            <th className="p-2 w-[30%]">Observaciones</th>
                            <th className="p-2 w-[5%]"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map(row => (
                            <tr key={row.id} className="border-b border-slate-100 dark:border-nexus-surface hover:bg-slate-50 dark:hover:bg-nexus-surface/50 text-sm align-top">
                                <td className="p-1">
                                    <input type="text" value={row.day} onChange={(e) => handleCellChange(row.id, 'day', e.target.value)} className="w-full bg-transparent p-1 rounded border border-transparent focus:border-nexus-primary focus:outline-none focus:ring-1 focus:ring-nexus-primary" />
                                </td>
                                <td className="p-1">
                                    <textarea value={row.activity} onChange={(e) => handleCellChange(row.id, 'activity', e.target.value)} rows={3} className="w-full bg-transparent p-1 rounded border border-transparent focus:border-nexus-primary focus:outline-none focus:ring-1 focus:ring-nexus-primary resize-y" />
                                </td>
                                <td className="p-1">
                                     <textarea value={row.observations} onChange={(e) => handleCellChange(row.id, 'observations', e.target.value)} rows={3} className="w-full bg-transparent p-1 rounded border border-transparent focus:border-nexus-primary focus:outline-none focus:ring-1 focus:ring-nexus-primary resize-y" />
                                </td>
                                <td className="p-1 text-center">
                                    <button onClick={() => handleDeleteRow(row.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button onClick={handleAddRow} className="mt-4 bg-slate-200 dark:bg-nexus-surface text-slate-700 dark:text-nexus-text font-semibold py-2 px-4 rounded-md text-sm hover:bg-slate-300 dark:hover:bg-nexus-border">
                + Añadir Fila
            </button>
        </div>
    );
};

const DirectorLog: React.FC = () => {
    const { documents, tasks, events, schoolInfo } = useApp();
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [logEntries, setLogEntries] = useState<{ [key: string]: string }>({
        '2025-09-01': 'Inicio del mes con la planificación estratégica y revisión de metas.'
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState('');

    const handleLogChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLogEntries(prev => ({
            ...prev,
            [logDate]: e.target.value
        }));
    };

    const handleGenerateSuggestion = async () => {
        setIsGenerating(true);
        setGenerationError('');
        try {
            const suggestion = await generateLogEntrySuggestion(logDate, documents, tasks, events);
            setLogEntries(prev => ({ ...prev, [logDate]: suggestion }));
        } catch (error) {
            setGenerationError(error instanceof Error ? error.message : 'Ocurrió un error desconocido.');
        } finally {
            setIsGenerating(false);
        }
    };

    const generateLogHtml = (): string => {
        const entryDate = new Date(logDate + 'T00:00:00');
        const formattedDate = entryDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const logContent = logEntries[logDate] || 'No hay ninguna entrada para este día.';

        return `
            <html>
                <head>
                    <title>Bitácora del Director - ${formattedDate}</title>
                    <style>
                        body { font-family: 'Times New Roman', Times, serif; margin: 1.5cm; font-size: 12pt; }
                        .header { text-align: center; margin-bottom: 25px; }
                        .header-text { font-weight: bold; margin: 0; line-height: 1.3; font-size: 11pt; }
                        .header-title { margin-top: 20px; margin-bottom: 10px; font-size: 16pt; font-weight: bold; }
                        .date-line { text-align: right; margin-bottom: 25px; font-style: italic; }
                        .content { text-align: justify; line-height: 1.6; white-space: pre-wrap; }
                        .signature { text-align: center; margin-top: 60px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <p class="header-text">Ministerio de Educación Pública</p>
                        <p class="header-text">Dirección Regional de Educación Grande del Térraba</p>
                        <p class="header-text">Supervisión Circuito 01</p>
                        <h2 class="header-title">Bitácora del Director</h2>
                    </div>
                    <p class="date-line">${formattedDate}</p>
                    <div class="content">
                        ${logContent.replace(/\n/g, '<br>')}
                    </div>
                    <div class="signature">
                        <p>_________________________</p>
                        <p>${schoolInfo.directorName}</p>
                    </div>
                </body>
            </html>
        `;
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(generateLogHtml());
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };
    
    const handleDownloadDoc = () => {
        const htmlContent = `<!DOCTYPE html>${generateLogHtml()}`;
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Bitacora_${logDate}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div>
                    <label htmlFor="log-date" className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-1">Seleccione la fecha de la bitácora</label>
                    <input 
                        type="date"
                        id="log-date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="bg-slate-50 dark:bg-nexus-dark border border-slate-300 dark:border-nexus-border rounded-md p-2 focus:ring-2 focus:ring-nexus-accent focus:outline-none"
                    />
                </div>
                 <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={handleDownloadDoc} className="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                        Descargar .doc
                    </button>
                    <button onClick={handlePrint} className="flex-1 bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 dark:bg-nexus-surface dark:hover:bg-nexus-border transition-colors">
                        Imprimir / Guardar PDF
                    </button>
                </div>
            </div>
            <button onClick={handleGenerateSuggestion} disabled={isGenerating} className="w-full mb-4 bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-md hover:bg-cyan-600 transition-colors disabled:bg-slate-400">
                {isGenerating ? 'Generando sugerencia...' : 'Sugerir Entrada con IA'}
            </button>
            {generationError && <p className="text-red-500 text-sm mb-2">{generationError}</p>}
            <textarea 
                value={logEntries[logDate] || ''}
                onChange={handleLogChange}
                placeholder="Escriba aquí la entrada de la bitácora para el día seleccionado..."
                className="w-full h-96 bg-slate-50 dark:bg-nexus-dark border border-slate-300 dark:border-nexus-border rounded-md p-4 focus:ring-2 focus:ring-nexus-accent focus:outline-none font-serif text-base"
            />
        </div>
    );
};

const VisitReportGeneratorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApplyData: (data: VisitReportData) => void;
}> = ({ isOpen, onClose, onApplyData }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysisResult, setAnalysisResult] = useState<VisitReportData | null>(null);

    const handleFileChange = (selectedFiles: FileList | null) => {
        if (selectedFiles) {
            const newFiles = Array.from(selectedFiles);
            if (files.length + newFiles.length > 6) {
                setError('No puede subir más de 6 archivos.');
                return;
            }
            setFiles(prev => [...prev, ...newFiles]);
            setError('');
        }
    };
    
    const handleRemoveFile = (fileName: string) => {
        setFiles(prev => prev.filter(f => f.name !== fileName));
    };

    const resetModal = () => {
        setFiles([]);
        setIsLoading(false);
        setError('');
        setAnalysisResult(null);
        onClose();
    };

    const handleGenerate = async () => {
        if (files.length === 0) {
            setError('Por favor, suba al menos un archivo.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const fileData = await Promise.all(files.map(async (file) => {
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = error => reject(error);
                });
                return { base64, mimeType: file.type };
            }));
            
            const result = await analyzeVisitSheets(fileData);
            setAnalysisResult(result);

        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ocurrió un error desconocido.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApply = () => {
        if (analysisResult) {
            onApplyData(analysisResult);
            resetModal();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60]" onClick={resetModal}>
            <div className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-nexus-primary mb-4">Asistente de Generación de Informes de Visita</h2>

                {isLoading ? (
                    <div className="text-center py-10">
                        <p>Analizando visitas y generando informe...</p>
                    </div>
                ) : analysisResult ? (
                    // Review Step
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Revisar Borrador Generado</h3>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 bg-slate-50 dark:bg-nexus-dark p-4 rounded-md">
                            <div>
                                <h4 className="font-bold">Resumen de Visitas</h4>
                                <table className="w-full text-xs mt-1">
                                    <thead><tr className="bg-slate-200 dark:bg-nexus-surface">
                                        <th className="p-1">Nivel</th><th className="p-1">Funcionario</th><th className="p-1">Realizadas</th>
                                    </tr></thead>
                                    <tbody>{analysisResult.summaryRows.map(r => (
                                        <tr key={r.id}><td className="p-1 border-b dark:border-nexus-border">{r.level}</td><td className="p-1 border-b dark:border-nexus-border">{r.officialName}</td><td className="p-1 border-b dark:border-nexus-border">{r.actualVisits}</td></tr>
                                    ))}</tbody>
                                </table>
                            </div>
                            <div>
                                <h4 className="font-bold mt-2">Resultados Principales</h4>
                                <p className="text-xs whitespace-pre-wrap">{analysisResult.principalResults}</p>
                            </div>
                            <div>
                                <h4 className="font-bold mt-2">Recomendaciones</h4>
                                <p className="text-xs whitespace-pre-wrap">{analysisResult.recommendations}</p>
                            </div>
                        </div>
                         <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-nexus-border">
                            <button onClick={() => setAnalysisResult(null)} className="px-4 py-2 text-sm rounded bg-slate-200 text-slate-800 dark:bg-nexus-surface dark:text-white hover:bg-slate-300">Volver</button>
                            <button onClick={handleApply} className="px-4 py-2 text-sm rounded bg-nexus-primary text-white hover:bg-nexus-secondary">Aplicar al Informe</button>
                        </div>
                    </div>
                ) : (
                    // Upload Step
                    <div>
                        <div className="border-2 border-dashed border-slate-300 dark:border-nexus-border rounded-lg p-6 text-center mb-4">
                            <input type="file" id="file-upload-ai" multiple accept="image/*,application/pdf" className="hidden" onChange={e => handleFileChange(e.target.files)} />
                            <label htmlFor="file-upload-ai" className="cursor-pointer text-nexus-primary font-semibold hover:underline">
                                Seleccione sus archivos
                            </label>
                            <p className="text-xs text-slate-500 mt-1">o arrástrelos aquí (hasta 6 archivos)</p>
                        </div>
                        {files.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold mb-2">Archivos cargados:</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {files.map(f => (
                                        <div key={f.name} className="flex items-center justify-between bg-slate-100 dark:bg-nexus-surface p-2 rounded text-sm">
                                            <span className="truncate">{f.name}</span>
                                            <button onClick={() => handleRemoveFile(f.name)} className="text-red-500 hover:text-red-700">X</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-nexus-border">
                            <button onClick={resetModal} className="px-4 py-2 text-sm rounded bg-slate-200 text-slate-800 dark:bg-nexus-surface dark:text-white hover:bg-slate-300">Cancelar</button>
                            <button onClick={handleGenerate} className="px-4 py-2 text-sm rounded bg-nexus-primary text-white hover:bg-nexus-secondary">Analizar y Generar</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const VisitReport: React.FC = () => {
    const { schoolInfo } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 1)); // Default to Sep 2025
    const [reportData, setReportData] = useState<VisitReportData>(initialVisitReportData);
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const handleSummaryRowChange = (id: string, field: keyof Omit<VisitSummaryRow, 'id'>, value: string) => {
        setReportData(prev => ({
            ...prev,
            summaryRows: prev.summaryRows.map(row => row.id === id ? { ...row, [field]: value } : row)
        }));
    };

    const handleAddSummaryRow = () => {
        const newRow: VisitSummaryRow = {
            id: `vr-${new Date().toISOString()}`,
            level: '',
            officialName: '',
            plannedVisits: '',
            actualVisits: '',
        };
        setReportData(prev => ({ ...prev, summaryRows: [...prev.summaryRows, newRow] }));
    };

    const handleDeleteSummaryRow = (id: string) => {
        setReportData(prev => ({ ...prev, summaryRows: prev.summaryRows.filter(row => row.id !== id) }));
    };

    const handleTextChange = (field: keyof Omit<VisitReportData, 'summaryRows'>, value: string) => {
        setReportData(prev => ({ ...prev, [field]: value }));
    };

    const generateVisitReportHtml = (): string => {
        const monthName = currentDate.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
        const year = currentDate.getFullYear();

        const summaryTableRows = reportData.summaryRows.map(row => `
            <tr>
                <td>${row.level}</td>
                <td>${row.officialName}</td>
                <td style="text-align: center;">${row.plannedVisits}</td>
                <td style="text-align: center;">${row.actualVisits}</td>
            </tr>
        `).join('');

        const resultsList = reportData.principalResults.split('\n').map(item => `<li>${item.replace(/•\s*/, '')}</li>`).join('');
        const recommendationsList = reportData.recommendations.split('\n').map(item => `<li>${item.replace(/\d+\.\s*/, '')}</li>`).join('');

        return `
            <html>
                <head>
                    <title>Informe de Visitas ${monthName} ${year}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 1cm; font-size: 11px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid black; padding: 6px; text-align: left; vertical-align: top; }
                        th { background-color: #E0E0E0; font-weight: bold; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .header-text { font-weight: bold; margin: 0; line-height: 1.2; font-size: 11px; }
                        .header-title { margin-top: 15px; margin-bottom: 15px; font-size: 14px; font-weight: bold; }
                        .section-title { background-color: #E0E0E0; text-align: center; font-weight: bold; padding: 6px; }
                        .signature { text-align: center; margin-top: 40px; }
                        .footer { text-align: center; margin-top: 40px; font-size: 10px; border-top: 1px solid black; padding-top: 10px; }
                        ul, ol { margin: 0; padding-left: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <p class="header-text">Ministerio de Educación Pública</p>
                        <p class="header-text">Dirección Regional de Educación Grande del Térraba</p>
                        <p class="header-text">Supervisión Circuito 01</p>
                        <p class="header-text">${schoolInfo.schoolName}</p>
                        <h2 class="header-title">INFORME DE VISITAS REALIZADAS EN ${monthName} ${year}</h2>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Asignatura / Nivel</th>
                                <th>Nombre del funcionario /Institución</th>
                                <th>Visitas programadas</th>
                                <th>Visitas realizadas</th>
                            </tr>
                        </thead>
                        <tbody>${summaryTableRows}</tbody>
                    </table>

                    <div class="section-title">RESUMEN DE VISITAS</div>
                    
                    <table>
                        <tr><th colspan="2">1. PRINCIPALES RESULTADOS</th></tr>
                        <tr><td colspan="2"><ul>${resultsList}</ul></td></tr>
                    </table>

                    <table>
                        <tr>
                            <th style="width: 75%;">2. RECOMENDACIONES EMANADAS DE LA DIRECCIÓN Y PLAZOS PARA SU EJECUCIÓN</th>
                            <th>PLAZOS DE EJECUCIÓN</th>
                        </tr>
                        <tr>
                            <td><ol>${recommendationsList}</ol></td>
                            <td>${reportData.recommendationDeadlines.replace(/\n/g, '<br>')}</td>
                        </tr>
                    </table>

                     <table>
                        <tr>
                            <th style="width: 75%;">3. ACCIONES DE SEGUIMIENTO PREVISTAS</th>
                            <th>PLAZOS DE EJECUCIÓN</th>
                        </tr>
                        <tr>
                            <td>${reportData.followUpActions.replace(/\n/g, '<br>')}</td>
                            <td>${reportData.followUpDeadlines.replace(/\n/g, '<br>')}</td>
                        </tr>
                    </table>

                    <div class="signature">
                        <p>${schoolInfo.directorName}</p>
                        <p>Director</p>
                    </div>

                    <div class="footer">
                        300 metros sur del supermercado El Rubí, Veracruz, Buenos Aires, Puntarenas<br>
                        Tel: 2730-5520<br>
                        Esc.ambientalveracruz@mep.go.cr
                    </div>
                </body>
            </html>
        `;
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(generateVisitReportHtml());
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };
    
    const handleDownloadDoc = () => {
        const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
        const year = currentDate.getFullYear();
        const htmlContent = `<!DOCTYPE html>${generateVisitReportHtml()}`;
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Informe_Visitas_${monthName}_${year}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <VisitReportGeneratorModal 
                isOpen={isAIAssistantOpen}
                onClose={() => setIsAIAssistantOpen(false)}
                onApplyData={setReportData}
            />
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-nexus-surface">&lt;</button>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white w-48 text-center capitalize">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-nexus-surface">&gt;</button>
                </div>
                 <div className="flex gap-4">
                    <button onClick={() => setIsAIAssistantOpen(true)} className="bg-cyan-500 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-600 transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Generar Informe con IA
                    </button>
                    <button onClick={handleDownloadDoc} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">Descargar .doc</button>
                    <button onClick={handlePrint} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 dark:bg-nexus-surface dark:hover:bg-nexus-border transition-colors">Imprimir / Guardar PDF</button>
                </div>
            </div>

            {/* Editable summary table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                     <thead className="border-b-2 border-slate-200 dark:border-nexus-border text-sm text-slate-500 dark:text-nexus-text-secondary">
                        <tr>
                            <th className="p-2">Asignatura / Nivel</th>
                            <th className="p-2">Nombre del funcionario / Institución</th>
                            <th className="p-2">Visitas programadas</th>
                            <th className="p-2">Visitas realizadas</th>
                            <th className="p-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.summaryRows.map(row => (
                            <tr key={row.id} className="border-b border-slate-100 dark:border-nexus-surface">
                                <td className="p-1"><input type="text" value={row.level} onChange={e => handleSummaryRowChange(row.id, 'level', e.target.value)} className="form-input-table" /></td>
                                <td className="p-1"><input type="text" value={row.officialName} onChange={e => handleSummaryRowChange(row.id, 'officialName', e.target.value)} className="form-input-table" /></td>
                                <td className="p-1"><input type="text" value={row.plannedVisits} onChange={e => handleSummaryRowChange(row.id, 'plannedVisits', e.target.value)} className="form-input-table" /></td>
                                <td className="p-1"><input type="text" value={row.actualVisits} onChange={e => handleSummaryRowChange(row.id, 'actualVisits', e.target.value)} className="form-input-table" /></td>
                                <td className="p-1 text-center">
                                    <button onClick={() => handleDeleteSummaryRow(row.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full">
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button onClick={handleAddSummaryRow} className="mt-2 bg-slate-200 dark:bg-nexus-surface text-slate-700 dark:text-nexus-text font-semibold py-1 px-3 rounded-md text-sm hover:bg-slate-300 dark:hover:bg-nexus-border">+ Fila</button>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                <div>
                    <h3 className="font-bold text-nexus-primary border-b-2 border-nexus-border pb-1 mb-2">1. PRINCIPALES RESULTADOS</h3>
                    <textarea value={reportData.principalResults} onChange={e => handleTextChange('principalResults', e.target.value)} rows={5} className="form-input-table" />
                </div>
                <div>
                    <h3 className="font-bold text-nexus-primary border-b-2 border-nexus-border pb-1 mb-2">2. RECOMENDACIONES Y PLAZOS</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <textarea value={reportData.recommendations} onChange={e => handleTextChange('recommendations', e.target.value)} rows={8} className="form-input-table col-span-2" placeholder="Recomendaciones..." />
                        <textarea value={reportData.recommendationDeadlines} onChange={e => handleTextChange('recommendationDeadlines', e.target.value)} rows={8} className="form-input-table" placeholder="Plazos..." />
                    </div>
                </div>
                 <div>
                    <h3 className="font-bold text-nexus-primary border-b-2 border-nexus-border pb-1 mb-2">3. ACCIONES DE SEGUIMIENTO</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <textarea value={reportData.followUpActions} onChange={e => handleTextChange('followUpActions', e.target.value)} rows={3} className="form-input-table col-span-2" placeholder="Acciones..." />
                        <textarea value={reportData.followUpDeadlines} onChange={e => handleTextChange('followUpDeadlines', e.target.value)} rows={3} className="form-input-table" placeholder="Plazos..." />
                    </div>
                </div>
            </div>

            <style>{`.form-input-table { width: 100%; background-color: transparent; border: 1px solid transparent; border-radius: 0.25rem; padding: 0.25rem; resize: vertical; } .form-input-table:focus { background-color: white; border-color: #58A6FF; outline: none; box-shadow: 0 0 0 1px #58A6FF; } .dark .form-input-table:focus { background-color: #0D1117; }`}</style>
        </div>
    );
};


const Reports: React.FC = () => {
    const { documents, tasks, events } = useApp();
    const [activeTab, setActiveTab] = useState<ReportTab>('schedule');

    const tabs = [
        { id: 'schedule', label: 'Programación Mensual' },
        { id: 'report', label: 'Informe de Labores' },
        { id: 'visit', label: 'Informe de Visitas' },
        { id: 'log', label: 'Bitácora' },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'schedule':
                return <MonthlySchedule />;
            case 'report':
                return <MonthlyLaborReport />;
            case 'visit':
                return <VisitReport />;
            case 'log':
                 return <DirectorLog />;
            default:
                return null;
        }
    };

    return (
        <div className="animate-fade-in">
            <Card>
                <div className="border-b border-slate-200 dark:border-nexus-border mb-4">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as ReportTab)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === tab.id 
                                        ? 'border-nexus-primary text-nexus-primary' 
                                        : 'border-transparent text-slate-500 dark:text-nexus-text-secondary hover:text-slate-700 dark:hover:text-white hover:border-slate-400 dark:hover:border-gray-500'}`
                                }
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-6">
                    {renderContent()}
                </div>
            </Card>
        </div>
    );
};

export default Reports;
