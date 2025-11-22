

import React from 'react';

// Enums
export enum View {
    Dashboard = 'Dashboard',
    Documents = 'Documents',
    Tasks = 'Tasks',
    Events = 'Events',
    Files = 'Files',
    Reports = 'Reports',
    Trash = 'Trash',
    Settings = 'Settings',
    Editor = 'Editor',
}

export enum DocumentStatus {
    Entrante = 'Entrante',
    Saliente = 'Saliente',
    Archivado = 'Archivado',
}

export enum DocumentDocType {
    Oficio = 'Oficio',
    Memorando = 'Memorando',
    Informe = 'Informe',
    Certificacion = 'Certificación',
    Minuta = 'Minuta de reunión',
    Otro = 'Otro',
}

export enum TaskStatus {
    Pendiente = 'Pendiente',
    'En Progreso' = 'En Progreso',
    Completada = 'Completada',
}

export enum TaskPriority {
    Alta = 'Alta',
    Media = 'Media',
    Baja = 'Baja',
}

export enum NotificationType {
    Task = 'Task',
    Event = 'Event',
    Document = 'Document',
}

// Interfaces & Types
export interface Template {
    id: string;
    name: string;
    documentType: DocumentDocType;
    fileName: string;
    fileMimeType: string;
    fileUrl: string; // Data URL for the template file
}

export interface Document {
    id: string;
    docNumber?: string;
    content: string;
    sender: string;
    recipient: string;
    receivedDate: string;
    stampDate: string;
    procedure: string;
    status: DocumentStatus;
    documentType: DocumentDocType;
    sentDate?: string; // Fecha de Envío (del remitente)
    supportType?: string; // Tipo de soporte
    folioCount?: number; // N° de Folios
    fileDataUrl?: string; // Data URL of the uploaded file
    fileMimeType?: string; // Mime type of the uploaded file
    receivedBy?: string; // Recibido por (para salientes)
    receptionDate?: string; // Fecha recepción (para salientes)
    generatedFromTaskId?: string; // ID of the task that generated this document
    folderId?: string; // ID de la carpeta donde se guardará el archivo
}

export interface Task {
    id: string;
    title: string;
    description: string;
    creationDate: string;
    dueDate: string;
    priority: TaskPriority;
    status: TaskStatus;
    linkedDocumentId?: string; // ID of the document created from this task
}

export interface CalendarEvent {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    startTime: string; // e.g., "09:00 AM"
    endTime: string;
    description: string;
    attachedDocumentUrl?: string;
    attachedDocumentMimeType?: string;
}

export interface FileItem {
    id: string;
    name: string;
    type: 'folder' | string; // 'folder' or file extension
    size: number; // in bytes
    modifiedDate: string; // ISO string
    parentId: string | null;
    color?: string;
    contentUrl?: string; // For file previews
}

export interface TrashItem {
    id: string;
    name: string;
    type: 'document' | 'task' | 'event' | 'file' | 'folder';
    deletedDate: string; // ISO string
    originalData: Document | Task | CalendarEvent | FileItem;
}

export interface Notification {
    id: string;
    type: NotificationType;
    sourceId: string;
    title: string;
    message: string;
    timestamp: string; // ISO string
    read: boolean;
}

export interface SchoolInfo {
    schoolName: string;
    directorName: string;
}

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface ReportRow {
    id: string;
    day: string;
    activity: string;
    observations: string;
}

export interface VisitSummaryRow {
    id: string;
    level: string;
    officialName: string;
    plannedVisits: string;
    actualVisits: string;
}

export interface VisitReportData {
    summaryRows: VisitSummaryRow[];
    principalResults: string;
    recommendations: string;
    recommendationDeadlines: string;
    followUpActions: string;
    followUpDeadlines: string;
}

export interface YearData {
    documents: Document[];
    tasks: Task[];
    events: CalendarEvent[];
    files: FileItem[];
    trashItems: TrashItem[];
    schedule: { [key: string]: string };
    laborReport: ReportRow[];
    visitReport: VisitReportData;
    logEntries: { [key: string]: string };
}

export interface BackupData {
    version: 1;
    exportedAt: string;
    allData: { [year: number]: YearData };
    schoolInfo: SchoolInfo;
    templates: Template[];
    accentColor: string;
    fontSize: string;
    fontFamily: string;
}

export interface AIConversation {
  role: 'user' | 'model';
  content: string;
}

export interface AppContextForAI {
    documents: Document[];
    tasks: Task[];
    events: CalendarEvent[];
    files: FileItem[];
    folders: FileItem[];
}

export interface AppContextType {
    theme: 'light' | 'dark';
    accentColor: string;
    currentView: View;
    isCommandPaletteOpen: boolean;
    isSidebarCollapsed: boolean;
    schoolInfo: SchoolInfo;
    templates: Template[];
    isSearchModalOpen: boolean;
    toasts: Toast[];
    View: typeof View;
    fontSize: string;
    fontFamily: string;
    isLoadingData: boolean;

    allData: { [year: number]: YearData };
    importData: (data: BackupData) => void;
    currentYear: number;
    availableYears: number[];
    documents: Document[];
    tasks: Task[];
    events: CalendarEvent[];
    files: FileItem[];
    trashItems: TrashItem[];
    schedule: { [key: string]: string };
    laborReport: ReportRow[];
    visitReport: VisitReportData;
    logEntries: { [key: string]: string };
    notifications: Notification[];
    appContextForAI: AppContextForAI;

    taskForDocFlow: Task | null;
    viewingDocInfo: { doc: Document; regNum: string } | null;
    viewingTask: Task | null;
    viewingEvent: CalendarEvent | null;
    previewingFile: FileItem | null;

    toggleTheme: () => void;
    setAccentColor: (color: string) => void;
    setCurrentView: (view: View) => void;
    addToast: (message: string, type: Toast['type']) => void;
    toggleCommandPalette: () => void;
    toggleSidebar: () => void;
    setSchoolInfo: (info: SchoolInfo | ((prev: SchoolInfo) => SchoolInfo)) => void;
    handleSaveTemplate: (template: Template) => void;
    handleDeleteTemplate: (id: string) => void;
    toggleSearchModal: () => void;
    setFontSize: (size: string) => void;
    setFontFamily: (font: string) => void;

    setCurrentYear: (year: number) => void;
    startNewYear: () => void;
    setDocuments: (updater: React.SetStateAction<Document[]>) => void;
    setTasks: (updater: React.SetStateAction<Task[]>) => void;
    setEvents: (updater: React.SetStateAction<CalendarEvent[]>) => void;
    setFiles: (updater: React.SetStateAction<FileItem[]>) => void;
    setTrashItems: (updater: React.SetStateAction<TrashItem[]>) => void;
    setSchedule: (updater: React.SetStateAction<{ [key: string]: string }>) => void;
    setLaborReport: (updater: React.SetStateAction<ReportRow[]>) => void;
    setVisitReport: (updater: React.SetStateAction<VisitReportData>) => void;
    setLogEntries: (updater: React.SetStateAction<{ [key: string]: string }>) => void;

    setTaskForDocFlow: (task: Task | null) => void;
    setViewingDocInfo: (info: { doc: Document; regNum: string } | null) => void;
    setViewingTask: (task: Task | null) => void;
    setViewingEvent: (event: CalendarEvent | null) => void;
    setPreviewingFile: (file: FileItem | null) => void;

    setNotifications: (updater: React.SetStateAction<Notification[]>) => void;
    handleMarkAsRead: (id: string) => void;
    handleMarkAllAsRead: () => void;
    handleClearReadNotifications: () => void;

    deleteDocument: (id: string) => void;
    deleteTask: (id: string) => void;
    deleteEvent: (id: string) => void;
    deleteFile: (id: string) => void;
    deleteFolder: (id: string) => void;
    restoreItem: (item: TrashItem) => void;
    deletePermanently: (id: string) => void;
    emptyTrash: () => void;
    
    // New properties for backup reminder
    showBackupReminder: boolean;
    confirmBackup: () => void;
}
