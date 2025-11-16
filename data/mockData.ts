import { Document, Task, CalendarEvent, FileItem, DocumentStatus, DocumentDocType, TaskStatus, TaskPriority, YearData, ReportRow, VisitReportData } from '../types';

export const initialDocuments: Document[] = [
    { id: 'doc-1', docNumber: 'OF-021-2024', content: 'Solicitud de equipo de cómputo', sender: 'Departamento de TI', recipient: 'Dirección', receivedDate: '2024-07-20', stampDate: '', procedure: 'Para aprobación', status: DocumentStatus.Entrante, documentType: DocumentDocType.Oficio },
    { id: 'doc-2', docNumber: 'MEM-005-2024', content: 'Recordatorio de reunión trimestral', sender: 'Gerencia General', recipient: 'Todos los departamentos', receivedDate: '2024-07-19', stampDate: '', procedure: 'Para su conocimiento', status: DocumentStatus.Entrante, documentType: DocumentDocType.Memorando },
];

export const initialTasks: Task[] = [
    { id: 'task-1', title: 'Preparar informe de ventas Q2', description: 'Consolidar datos de ventas y preparar presentación.', creationDate: '2024-07-15', dueDate: '2024-07-25', priority: TaskPriority.Alta, status: TaskStatus['En Progreso'] },
    { id: 'task-2', title: 'Revisar propuesta de nuevo proveedor', description: 'Analizar costos y beneficios de la propuesta de ACME Corp.', creationDate: '2024-07-18', dueDate: '2024-07-22', priority: TaskPriority.Media, status: TaskStatus.Pendiente },
];

export const initialEvents: CalendarEvent[] = [
    { id: 'evt-1', title: 'Reunión de directores', date: '2024-10-10', startTime: '09:00 AM', endTime: '11:00 AM', description: 'Reunión mensual de seguimiento.' },
    { id: 'evt-2', title: 'Visita a docente: Susana García', date: '2024-10-08', startTime: '10:00 AM', endTime: '11:00 AM', description: 'Observación de clase.' },
];

export const initialFiles: FileItem[] = [
    { id: 'folder-1', name: 'Informes 2024', type: 'folder', size: 0, modifiedDate: '2024-07-01T10:00:00Z', parentId: null },
    { id: 'folder-2', name: 'Recursos Humanos', type: 'folder', size: 0, modifiedDate: '2024-06-15T10:00:00Z', parentId: null },
    { id: 'file-1', name: 'Informe_Ventas_Q2.pdf', type: 'pdf', size: 262144, modifiedDate: '2024-07-20T11:00:00Z', parentId: 'folder-1' },
    { id: 'file-2', name: 'Planilla_Julio.xlsx', type: 'xlsx', size: 131072, modifiedDate: '2024-07-18T15:30:00Z', parentId: 'folder-2' },
    { id: 'folder-3', name: 'Informes Anteriores', type: 'folder', size: 0, modifiedDate: '2024-01-10T09:00:00Z', parentId: 'folder-1' },
    { id: 'file-3', name: 'Informe_Ventas_Q1.pdf', type: 'pdf', size: 245760, modifiedDate: '2024-04-05T14:00:00Z', parentId: 'folder-3' },
];

export const initialScheduleData: { [key: string]: string } = {
  '2024-10-01': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Reunión con personal docente y administrativo.',
  '2024-10-02': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Actualización de documentación.',
  '2024-10-03': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Consulta de padres de familia.',
  '2024-10-06': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Planificación semanal. Consulta de padres de familia.',
  '2024-10-07': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Gestión de compras CNP.',
  '2024-10-08': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Visita a docente: Susana García.',
  '2024-10-09': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina.',
  '2024-10-10': 'Reunión de directores. Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas.',
  '2024-10-13': 'Día de las Culturas. Participación en actos cívicos. Atención a imprevistos y consultas. Trabajo administrativo de oficina.',
  '2024-10-14': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Coordinación de actividades pedagógicas. Gestión de compras CNP.',
  '2024-10-15': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Reunión con el comité de apoyo educativo. Visita a docente: Damarys Cordero.',
  '2024-10-16': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Reunión con la Junta de Educación.',
  '2024-10-17': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Consulta a padres de familia.',
  '2024-10-20': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Planificación semanal.',
  '2024-10-21': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Gestión de compras CNP.',
  '2024-10-22': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Visita a docente: Maureen Arguedas Morera',
  '2024-10-23': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Reunión con la Junta de Educación.',
  '2024-10-24': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Visita a docente: Maureen Arguedas Morera',
  '2024-10-27': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Planificación semanal. Consulta a padres de familia.',
  '2024-10-28': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Gestión de compras CNP.',
  '2024-10-29': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Reunión comité EPI.',
  '2024-10-30': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Elaboración de informes mensuales.',
  '2024-10-31': 'Revisión de correos electrónicos y gestión de trámites. Atención a imprevistos y consultas. Trabajo administrativo de oficina. Planificación mensual y revisión de informes.',
};

export const initialLaborReportData: ReportRow[] = [
  { id: 'lr-1', day: '01', activity: 'Iniciamos el mes con la revisión detallada de la bandeja de correos electrónicos y los trámites institucionales pendientes. Se realizó la planificación semanal, estableciendo prioridades y plazos. Además, se supervisó la asistencia del personal, verificando el cumplimiento de los horarios establecidos.', observations: '' },
  { id: 'lr-2', day: '02', activity: 'La jornada se dedicó al trabajo administrativo de oficina, con especial atención a la coordinación de proyectos pedagógicos en desarrollo. Se atendieron diversas consultas de padres de familia, brindando orientación sobre procesos académicos y administrativos.', observations: '' },
  { id: 'lr-3', day: '03', activity: 'Se llevó a cabo una reunión con el personal docente y administrativo para evaluar avances y ajustar estrategias. Posteriormente, se revisaron reglamentos internos y se organizó documentación institucional, asegurando su correcto archivo y acceso.', observations: '' },
];

export const initialVisitReportData: VisitReportData = {
    summaryRows: [
        { id: 'vr-1', level: 'Quinto', officialName: 'Idaly Granados Picado', plannedVisits: '', actualVisits: '' },
        { id: 'vr-2', level: 'Primero', officialName: 'Susana García Álvarez', plannedVisits: '3', actualVisits: '2' },
    ],
    principalResults: '• El ambiente fue positivo, con apertura al diálogo y trabajo en equipo.\n• Los estudiantes respondieron con entusiasmo a las propuestas y lograron reflexionar sobre la importancia de la convivencia armónica.\n• Se evidenció apoyo y acompañamiento de la docente durante el desarrollo del taller.',
    recommendations: '1. Dar continuidad a las dinámicas de convivencia en el aula, reforzando las normas y acuerdos generados.\n2. Propiciar espacios periódicos para el diálogo grupal sobre la convivencia, resolviendo dificultades de forma constructiva.',
    recommendationDeadlines: '',
    followUpActions: 'Se dará seguimiento',
    followUpDeadlines: 'Noviembre',
};

export const initialLogEntriesData: { [key: string]: string } = {
    '2024-09-01': 'Inicio del mes con la planificación estratégica y revisión de metas.'
};


// Function to create the data for the first-ever year.
export const getInitialYearState = (): YearData => ({
    documents: initialDocuments,
    tasks: initialTasks,
    events: initialEvents,
    files: initialFiles,
    trashItems: [],
    schedule: initialScheduleData,
    laborReport: initialLaborReportData,
    visitReport: initialVisitReportData,
    logEntries: initialLogEntriesData,
});
