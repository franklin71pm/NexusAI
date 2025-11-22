

import React, { useState, useEffect, useRef } from 'react';
// Fix: Import types from the centralized types.ts file
import { Document, DocumentStatus, DocumentDocType, Task, TaskStatus, TaskPriority, CalendarEvent, Notification, NotificationType, FileItem } from '../types';
import Card from './common/Card';
import { analyzeDocumentForData } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
import { formatDate } from '../utils/dateFormatter';

const RegistryPreviewModal: React.FC<{
    previewType: 'Entrante' | 'Saliente' | null;
    onClose: () => void;
    documents: Document[];
    schoolInfo: { schoolName: string; directorName: string; };
}> = ({ previewType, onClose, documents, schoolInfo }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

    if (!previewType) return null;

    const documentsToDisplay = documents
        .filter(doc => doc.status === (previewType === 'Entrante' ? DocumentStatus.Entrante : DocumentStatus.Saliente))
        .sort((a, b) => {
            const dateA = new Date(previewType === 'Entrante' ? a.receivedDate : a.stampDate || 0).getTime();
            const dateB = new Date(previewType === 'Entrante' ? b.receivedDate : b.stampDate || 0).getTime();
            return dateB - dateA;
        });

    const handlePrint = () => {
        const printContent = printRef.current?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Registro de Documentos ${previewType}s</title>
                            <style>
                                body { font-family: Arial, sans-serif; font-size: 6px; margin: 20px; color: #000; }
                                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                th, td { border: 1px solid #ccc; padding: 2px; text-align: left; word-break: break-word; }
                                th { background-color: #f2f2f2; }
                                h1, h2 { text-align: center; }
                                h1 { font-size: 8px; margin: 0; }
                                h2 { font-size: 7px; margin-top: 15px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
                                .header-info { text-align: center; font-size: 7px; margin-bottom: 15px; line-height: 1.2; }
                                @page { size: A4 ${orientation}; margin: 1cm; }
                            </style>
                        </head>
                        <body>
                            ${printContent}
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            }
        }
    };

    const renderTable = (docs: Document[], type: 'Entrante' | 'Saliente') => {
        const totalDocs = docs.length;
        return (
            <div>
                <h2>Documentos ${type === 'Entrante' ? 'Entrantes' : 'Salientes'}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>N° Reg.</th>
                            <th>N° Oficio</th>
                            <th>Asunto</th>
                            <th>{type === 'Entrante' ? 'Remitente' : 'Destinatario'}</th>
                            <th>{type === 'Entrante' ? 'Fecha Recibido' : 'Fecha Envío'}</th>
                            <th>Trámite</th>
                        </tr>
                    </thead>
                    <tbody>
                        {docs.map((doc, index) => (
                            <tr key={doc.id}>
                                <td>{String(totalDocs - index).padStart(3, '0')}</td>
                                <td>{doc.docNumber || '-'}</td>
                                <td>{doc.content}</td>
                                <td>{type === 'Entrante' ? doc.sender : doc.recipient}</td>
                                <td>{formatDate(type === 'Entrante' ? doc.receivedDate : doc.stampDate)}</td>
                                <td>{doc.procedure}</td>
                            </tr>
                        ))}
                         {docs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center' }}>No hay documentos.</td></tr>}
                    </tbody>
                </table>
            </div>
        );
    }


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-6xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-nexus-border">
                    <h2 className="text-xl font-bold text-nexus-primary">Previsualización de Registros {previewType}s</h2>
                    <div className="flex items-center gap-4">
                        <div>
                            <label htmlFor="orientation-select" className="text-sm font-medium text-slate-700 dark:text-nexus-text-secondary mr-2">Orientación:</label>
                            <select 
                                id="orientation-select"
                                value={orientation} 
                                onChange={(e) => setOrientation(e.target.value as 'landscape' | 'portrait')}
                                className="bg-white dark:bg-nexus-surface border border-slate-300 dark:border-nexus-border rounded-md py-1.5 px-2 text-sm focus:ring-nexus-primary focus:border-nexus-primary"
                            >
                                <option value="landscape">Horizontal</option>
                                <option value="portrait">Vertical</option>
                            </select>
                        </div>
                        <button onClick={onClose} className="px-4 py-2 rounded bg-slate-200 text-slate-800 dark:bg-nexus-surface dark:text-white hover:bg-slate-300 dark:hover:bg-nexus-border">Cerrar</button>
                        <button onClick={handlePrint} className="px-4 py-2 rounded bg-nexus-primary text-white hover:bg-nexus-secondary">Imprimir / Guardar PDF</button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-4 bg-slate-100 dark:bg-nexus-dark mt-4">
                    <div ref={printRef} className="bg-white p-8 mx-auto text-black transition-all duration-300" style={{ width: orientation === 'landscape' ? '1122px' : '794px', minHeight: orientation === 'landscape' ? '794px' : '1122px' }}>
                        <div className="header-info">
                            <h1>{schoolInfo.schoolName.toUpperCase()}</h1>
                            <p>REGISTRO DE TRÁMITE DE DOCUMENTOS {previewType.toUpperCase()}S</p>
                            <p>Dirección a cargo: {schoolInfo.directorName}</p>
                        </div>
                        {renderTable(documentsToDisplay, previewType)}
                    </div>
                </div>
            </div>
        </div>
    );
};


// Modal component for creating/editing documents
const DocumentRegistrationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (doc: Document, options: { createTask: boolean; createEvent: boolean; eventTimes?: { startTime: string; endTime: string; } }, taskToComplete?: Task | null) => void;
    documentToEdit: Document | null;
    taskContext: Task | null;
    onSelectSaliente: () => void;
    openDirectlyTo?: 'Saliente' | null;
    files: FileItem[];
}> = ({ isOpen, onClose, onSave, documentToEdit, taskContext, onSelectSaliente, openDirectlyTo, files }) => {
    const [step, setStep] = useState<'selection' | 'form'>('selection');
    const [formType, setFormType] = useState<'Entrante' | 'Saliente' | null>(null);
    const [formData, setFormData] = useState<Partial<Document>>({});
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isTextAnalysisVisible, setIsTextAnalysisVisible] = useState(false);
    const [textToAnalyze, setTextToAnalyze] = useState('');
    const [isTextLoadingAI, setIsTextLoadingAI] = useState(false);

    // New state for additional actions
    const [createTask, setCreateTask] = useState(false);
    const [createEvent, setCreateEvent] = useState(false);
    const [eventTimes, setEventTimes] = useState({ startTime: '09:00', endTime: '10:00' });
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isFolderSelectorOpen, setIsFolderSelectorOpen] = useState(false);
    const [isFolderSelectorOpenSaliente, setIsFolderSelectorOpenSaliente] = useState(false);

    // Get folders from files
    const folders = files.filter(file => file.type === 'folder');

    // Get selected folder name
    const selectedFolder = folders.find(folder => folder.id === selectedFolderId);

    // Debug logging removed for production


    useEffect(() => {
        if (isOpen) {
            if (openDirectlyTo === 'Saliente') {
                setFormType('Saliente');
                setFormData({ 
                    status: DocumentStatus.Saliente, 
                    documentType: DocumentDocType.Oficio, 
                    sender: 'Dirección', 
                    stampDate: new Date().toISOString().split('T')[0],
                    supportType: 'Papel',
                    folioCount: 1,
                });
                setStep('form');
            } else if (taskContext) {
                // Flow started from a task
                setFormType('Saliente');
                setFormData({ 
                    status: DocumentStatus.Saliente, 
                    documentType: DocumentDocType.Oficio, 
                    sender: 'Dirección', 
                    stampDate: new Date().toISOString().split('T')[0],
                    supportType: 'Papel',
                    folioCount: 1,
                    content: taskContext.title, // Pre-fill content from task
                });
                setStep('form');
            } else if (documentToEdit) {
                setFormData(documentToEdit);
                setFormType(documentToEdit.status as 'Entrante' | 'Saliente');
                setStep('form');
                // Set folder ID if editing existing document
                if (documentToEdit.folderId) {
                    setSelectedFolderId(documentToEdit.folderId);
                }
            } else {
                setStep('selection');
                setFormData({});
                setFormType(null);
            }
            // Reset analysis and actions UI on every open
            setSelectedFileName(null);
            setIsLoadingAI(false);
            setTextToAnalyze('');
            setIsTextLoadingAI(false);
            setIsTextAnalysisVisible(false);
            setCreateTask(false);
            setCreateEvent(false);
            setEventTimes({ startTime: '09:00', endTime: '10:00' });
            setSelectedFolderId(null);
            setIsFolderSelectorOpen(false);
            setError('');
        }
    }, [isOpen, documentToEdit, taskContext, openDirectlyTo]);
    
    const resetAndClose = () => {
        setError('');
        setIsLoadingAI(false);
        setSelectedFileName(null);
        setIsTextAnalysisVisible(false);
        setTextToAnalyze('');
        setIsTextLoadingAI(false);
        onClose();
    };

    const handleSelectType = (type: 'Entrante' | 'Saliente') => {
        if (type === 'Saliente') {
            onSelectSaliente();
        } else { // Entrante
            setFormType(type);
            setFormData({ 
                status: DocumentStatus.Entrante, 
                documentType: DocumentDocType.Oficio, 
                recipient: 'Dirección',
                receivedDate: new Date().toISOString().split('T')[0],
                supportType: 'Papel',
                folioCount: 1,
             });
            setStep('form');
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEventTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEventTimes(prev => ({ ...prev, [name]: value }));
    };


    const handleFileAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoadingAI(true);
        setSelectedFileName(file.name);
        setError('');

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const dataUrl = reader.result as string;
                const extractedData = await analyzeDocumentForData({ file: { base64, mimeType: file.type } });
                
                setFormData(prev => ({
                    ...prev, 
                    ...extractedData,
                    fileDataUrl: dataUrl,
                    fileMimeType: file.type,
                }));
                 setTextToAnalyze(''); // Clear text input if file is used
                 setIsLoadingAI(false);
            };
            reader.onerror = () => {
                setError('No se pudo leer el archivo.');
                setIsLoadingAI(false);
            };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al analizar el documento.');
            setIsLoadingAI(false);
        }
    };
    
    const handleTextAnalysis = async () => {
        if (!textToAnalyze.trim()) return;

        setIsTextLoadingAI(true);
        setError('');

        try {
            const extractedData = await analyzeDocumentForData({ text: textToAnalyze });
            setFormData(prev => ({
                ...prev,
                ...extractedData,
                fileDataUrl: undefined,
                fileMimeType: undefined,
            }));
            setSelectedFileName(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al analizar el texto.');
        } finally {
            setIsTextLoadingAI(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalDoc: Document = {
            id: formData.id || `doc-${Date.now()}`,
            docNumber: formData.docNumber || '',
            content: formData.content || 'Sin asunto',
            sender: formData.sender || '',
            recipient: formData.recipient || '',
            receivedDate: formData.receivedDate || '',
            stampDate: formData.stampDate || '',
            procedure: formData.procedure || '',
            status: formType!,
            documentType: formData.documentType || DocumentDocType.Otro,
            sentDate: formData.sentDate || '',
            supportType: formData.supportType || 'Papel',
            folioCount: Number(formData.folioCount) || 1,
            fileDataUrl: formData.fileDataUrl,
            fileMimeType: formData.fileMimeType,
            receivedBy: formData.receivedBy,
            receptionDate: formData.receptionDate,
            folderId: selectedFolderId || undefined,
        };

        const saveOptions = {
            createTask,
            createEvent,
            eventTimes: createEvent ? eventTimes : undefined
        };

        onSave(finalDoc, saveOptions, taskContext);
        resetAndClose();
    };

    if (!isOpen) return null;

    const modalTitle = documentToEdit ? 'Editar Documento' : (taskContext ? 'Completar Tarea con Documento' : 'Registrar Documento');
    const isAnalyzing = isLoadingAI || isTextLoadingAI;

    const aiAnalysisSection = (
      <div className="p-4 bg-slate-50 dark:bg-nexus-surface/50 border border-slate-200 dark:border-nexus-border rounded-lg space-y-4">
        <h3 className="text-md font-semibold text-slate-800 dark:text-nexus-text flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          Análisis Automático con IA
        </h3>
        
        {/* Opción 1: Carga de archivo con IA */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label htmlFor="doc-upload-ai" className={`bg-cyan-500 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-600 transition-colors w-full text-center block ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                {isLoadingAI ? 'Analizando Archivo...' : (selectedFileName ? 'Cambiar Archivo' : 'Subir Documento y Analizar con IA')}
              </label>
              <input type="file" id="doc-upload-ai" className="hidden" onChange={handleFileAnalysis} disabled={isAnalyzing} accept="image/*,application/pdf" />
            </div>
          </div>
          
          {selectedFileName && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white dark:bg-nexus-bg rounded-md text-sm border border-slate-200 dark:border-nexus-border">
                <div className="flex items-center gap-3 overflow-hidden">
                  {isLoadingAI ? (
                    <svg className="animate-spin h-5 w-5 text-cyan-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-slate-700 dark:text-nexus-text-secondary truncate" title={selectedFileName}>
                    {selectedFileName}
                  </span>
                </div>
              </div>
              {isLoadingAI && (
                <p className="text-xs text-center text-cyan-700 dark:text-cyan-300 animate-pulse">
                  Analizando... La IA llenará los campos del formulario.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Separador visual */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-nexus-border"></div>
          <span className="text-xs text-slate-500 dark:text-nexus-text-secondary">O</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-nexus-border"></div>
        </div>

        {/* Opción 2: Carga manual sin IA */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700 dark:text-nexus-text-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Carga Manual (Sin Internet)
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc-upload-manual" className="bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 transition-colors w-full text-center block cursor-pointer">
                Subir Archivo Manualmente
              </label>
              <input 
                type="file" 
                id="doc-upload-manual" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFileName(file.name);
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = () => {
                      const dataUrl = reader.result as string;
                      setFormData(prev => ({
                        ...prev,
                        fileDataUrl: dataUrl,
                        fileMimeType: file.type,
                      }));
                    };
                  }
                }} 
                accept="image/*,application/pdf" 
              />
            </div>
            
            <button
              type="button"
              onClick={() => {
                setSelectedFileName(null);
                setFormData(prev => ({
                  ...prev,
                  fileDataUrl: undefined,
                  fileMimeType: undefined,
                }));
              }}
              className="bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-md hover:bg-slate-300 transition-colors w-full text-center"
            >
              Limpiar Archivo
            </button>
          </div>
          
          {selectedFileName && !isLoadingAI && (
            <div className="flex items-center justify-between p-2 bg-white dark:bg-nexus-bg rounded-md text-sm border border-slate-200 dark:border-nexus-border">
              <div className="flex items-center gap-3 overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-700 dark:text-nexus-text-secondary truncate" title={selectedFileName}>
                  {selectedFileName}
                </span>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 dark:bg-nexus-surface px-2 py-1 rounded">
                Manual
              </span>
            </div>
          )}
        </div>
      </div>
    );


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={resetAndClose}>
            <div className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                {step === 'selection' && !documentToEdit && !taskContext && (
                    <>
                        <h2 className="text-xl font-bold text-nexus-primary mb-4">{modalTitle}</h2>
                        <p className="text-slate-600 dark:text-nexus-text-secondary mb-6">Seleccione el tipo de documento que desea registrar.</p>
                        <div className="flex justify-center gap-6">
                            <button onClick={() => handleSelectType('Entrante')} className="flex-1 p-6 text-center bg-slate-100 dark:bg-nexus-surface rounded-lg hover:ring-2 hover:ring-nexus-primary transition">
                                <h3 className="font-semibold text-lg">Documento Entrante</h3>
                            </button>
                             <button onClick={() => handleSelectType('Saliente')} className="flex-1 p-6 text-center bg-slate-100 dark:bg-nexus-surface rounded-lg hover:ring-2 hover:ring-nexus-primary transition">
                                <h3 className="font-semibold text-lg">Documento Saliente</h3>
                            </button>
                        </div>
                    </>
                )}
                {step === 'form' && formType && (
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-xl font-bold text-nexus-primary mb-4">{modalTitle} {formType}</h2>
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                             {formType === 'Entrante' ? (
                                <>
                                    {aiAnalysisSection}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="form-label">Fecha de Recibido</label><input type="date" name="receivedDate" value={formData.receivedDate || ''} onChange={handleChange} className="form-input" required /></div>
                                        <div><label className="form-label">Fecha de Envío (Remitente)</label><input type="date" name="sentDate" value={formData.sentDate || ''} onChange={handleChange} className="form-input" /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="form-label">N° de documento (Oficio, etc.)</label><input type="text" name="docNumber" value={formData.docNumber || ''} onChange={handleChange} className="form-input" /></div>
                                        <div><label className="form-label">Tipo de Documento</label><select name="documentType" value={formData.documentType} onChange={handleChange} className="form-input" required>{Object.values(DocumentDocType).map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                                    </div>
                                    <div><label className="form-label">Remitente</label><input type="text" name="sender" value={formData.sender || ''} onChange={handleChange} className="form-input" required /></div>
                                    <div><label className="form-label">Contenido / Asunto</label><textarea name="content" value={formData.content || ''} onChange={handleChange} rows={2} className="form-input" required /></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="form-label">N° de Folios</label><input type="number" name="folioCount" value={formData.folioCount || 1} min="1" onChange={handleChange} className="form-input" required /></div>
                                        <div><label className="form-label">Tipo de soporte</label><select name="supportType" value={formData.supportType} onChange={handleChange} className="form-input" required><option value="Papel">Papel</option><option value="CD">CD</option><option value="Digital">Digital</option><option value="Otro">Otro</option></select></div>
                                    </div>
                                    <div><label className="form-label">Trámite</label><input type="text" name="procedure" value={formData.procedure || ''} onChange={handleChange} className="form-input" required /></div>
                                    
                                    {/* Folder Selector */}
                                    <div className="pt-4 border-t border-slate-200 dark:border-nexus-border">
                                        <h3 className="text-md font-semibold text-slate-700 dark:text-nexus-text mb-3">Organización</h3>
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsFolderSelectorOpen(!isFolderSelectorOpen)}
                                                    className="w-full flex justify-between items-center p-3 bg-white dark:bg-nexus-bg border border-slate-300 dark:border-nexus-border rounded-md text-left hover:bg-slate-50 dark:hover:bg-nexus-surface transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                                        </svg>
                                                        <span className={selectedFolder ? "text-slate-800 dark:text-nexus-text" : "text-slate-500 dark:text-nexus-text-secondary"}>
                                                            {selectedFolder ? selectedFolder.name : "Seleccionar carpeta..."}
                                                        </span>
                                                    </div>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                
                                                {isFolderSelectorOpen && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-nexus-bg border border-slate-300 dark:border-nexus-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                        <div className="py-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedFolderId(null);
                                                                    setIsFolderSelectorOpen(false);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-nexus-text hover:bg-slate-100 dark:hover:bg-nexus-surface"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span>Sin carpeta</span>
                                                                </div>
                                                            </button>
                                                            {folders.map(folder => (
                                                                <button
                                                                    key={folder.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedFolderId(folder.id);
                                                                        setIsFolderSelectorOpen(false);
                                                                    }}
                                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-nexus-surface ${
                                                                        selectedFolderId === folder.id 
                                                                            ? 'bg-nexus-primary/10 text-nexus-primary' 
                                                                            : 'text-slate-700 dark:text-nexus-text'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                                                        </svg>
                                                                        <span>{folder.name}</span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {selectedFolder && (
                                                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-nexus-surface/50 rounded-md text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-slate-700 dark:text-nexus-text-secondary">Carpeta seleccionada: {selectedFolder.name}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedFolderId(null)}
                                                        className="text-slate-500 hover:text-red-500 text-xs"
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {!documentToEdit && (
                                        <div className="pt-4 border-t border-slate-200 dark:border-nexus-border">
                                            <h3 className="text-md font-semibold text-slate-700 dark:text-nexus-text mb-3">Acciones Adicionales</h3>
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-3 p-3 rounded-md bg-slate-50 dark:bg-nexus-surface/50 border border-slate-200 dark:border-nexus-border cursor-pointer">
                                                    <input type="checkbox" checked={createTask} onChange={(e) => setCreateTask(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-nexus-primary focus:ring-nexus-primary" />
                                                    <div>
                                                        <span className="font-semibold text-slate-800 dark:text-nexus-text">Crear Tarea</span>
                                                        <p className="text-xs text-slate-500 dark:text-nexus-text-secondary">Crea una tarea con el asunto y fecha del documento.</p>
                                                    </div>
                                                </label>
                                                <label className="flex items-center gap-3 p-3 rounded-md bg-slate-50 dark:bg-nexus-surface/50 border border-slate-200 dark:border-nexus-border cursor-pointer">
                                                    <input type="checkbox" checked={createEvent} onChange={(e) => setCreateEvent(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-nexus-primary focus:ring-nexus-primary" />
                                                    <div>
                                                        <span className="font-semibold text-slate-800 dark:text-nexus-text">Crear Evento</span>
                                                        <p className="text-xs text-slate-500 dark:text-nexus-text-secondary">Crea un evento en el calendario para la fecha del documento.</p>
                                                    </div>
                                                </label>
                                                {createEvent && (
                                                    <div className="pl-6 grid grid-cols-2 gap-4 pt-2">
                                                        <div>
                                                            <label className="form-label text-xs">Hora Inicio</label>
                                                            <input type="time" name="startTime" value={eventTimes.startTime} onChange={handleEventTimeChange} className="form-input p-1" />
                                                        </div>
                                                        <div>
                                                            <label className="form-label text-xs">Hora Fin</label>
                                                            <input type="time" name="endTime" value={eventTimes.endTime} onChange={handleEventTimeChange} className="form-input p-1" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </>
                            ) : (
                                <>
                                    {aiAnalysisSection}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="form-label">N° de documento (Oficio, etc.)</label><input type="text" name="docNumber" value={formData.docNumber || ''} onChange={handleChange} className="form-input" /></div>
                                        <div><label className="form-label">Tipo de Documento</label><select name="documentType" value={formData.documentType} onChange={handleChange} className="form-input">{Object.values(DocumentDocType).map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                                    </div>
                                    <div><label className="form-label">Contenido / Asunto</label><textarea name="content" value={formData.content || ''} onChange={handleChange} rows={3} className="form-input" required /></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="form-label">Destinatario</label><input type="text" name="recipient" value={formData.recipient || ''} onChange={handleChange} className="form-input" required /></div>
                                        <div><label className="form-label">Fecha de Sello / Envío</label><input type="date" name="stampDate" value={formData.stampDate || ''} onChange={handleChange} className="form-input" required /></div>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="form-label">N° de Folios</label><input type="number" name="folioCount" value={formData.folioCount || 1} min="1" onChange={handleChange} className="form-input" /></div>
                                        <div><label className="form-label">Tipo de soporte</label><select name="supportType" value={formData.supportType || 'Papel'} onChange={handleChange} className="form-input"><option value="Papel">Papel</option><option value="CD">CD</option><option value="Digital">Digital</option><option value="Otro">Otro</option></select></div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 dark:border-nexus-border">
                                        <h3 className="text-md font-semibold text-slate-700 dark:text-nexus-text mb-3">Confirmación de Entrega (Opcional)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="form-label">Recibido por:</label><input type="text" name="receivedBy" value={formData.receivedBy || ''} onChange={handleChange} className="form-input" /></div>
                                            <div><label className="form-label">Fecha de Recepción</label><input type="date" name="receptionDate" value={formData.receptionDate || ''} onChange={handleChange} className="form-input" /></div>
                                        </div>
                                    </div>
                                    
                                    {/* Folder Selector for Saliente */}
                                    <div className="pt-4 border-t border-slate-200 dark:border-nexus-border">
                                        <h3 className="text-md font-semibold text-slate-700 dark:text-nexus-text mb-3">Organización</h3>
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsFolderSelectorOpenSaliente(!isFolderSelectorOpenSaliente)}
                                                    className="w-full flex justify-between items-center p-3 bg-white dark:bg-nexus-bg border border-slate-300 dark:border-nexus-border rounded-md text-left hover:bg-slate-50 dark:hover:bg-nexus-surface transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                                        </svg>
                                                        <span className={selectedFolder ? "text-slate-800 dark:text-nexus-text" : "text-slate-500 dark:text-nexus-text-secondary"}>
                                                            {selectedFolder ? selectedFolder.name : "Seleccionar carpeta..."}
                                                        </span>
                                                    </div>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                
                                                {isFolderSelectorOpenSaliente && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-nexus-bg border border-slate-300 dark:border-nexus-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                        <div className="py-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedFolderId(null);
                                                                    setIsFolderSelectorOpenSaliente(false);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-nexus-text hover:bg-slate-100 dark:hover:bg-nexus-surface"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span>Sin carpeta</span>
                                                                </div>
                                                            </button>
                                                            {folders.map(folder => (
                                                                <button
                                                                    key={folder.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedFolderId(folder.id);
                                                                        setIsFolderSelectorOpenSaliente(false);
                                                                    }}
                                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-nexus-surface ${
                                                                        selectedFolderId === folder.id 
                                                                            ? 'bg-nexus-primary/10 text-nexus-primary' 
                                                                            : 'text-slate-700 dark:text-nexus-text'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                                                        </svg>
                                                                        <span>{folder.name}</span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {selectedFolder && (
                                                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-nexus-surface/50 rounded-md text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-slate-700 dark:text-nexus-text-secondary">Carpeta seleccionada: {selectedFolder.name}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedFolderId(null)}
                                                        className="text-slate-500 hover:text-red-500 text-xs"
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200 dark:border-nexus-border">
                            {(documentToEdit || taskContext || openDirectlyTo) ? <div></div> : <button type="button" onClick={() => setStep('selection')} className="text-sm font-semibold text-slate-600 dark:text-nexus-text-secondary hover:underline">&larr; Volver</button>}
                            <div>
                                <button type="button" onClick={resetAndClose} className="px-4 py-2 rounded bg-slate-200 text-slate-800 dark:bg-nexus-surface dark:text-white hover:bg-slate-300 dark:hover:bg-nexus-border mr-2">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded bg-nexus-primary text-white hover:bg-nexus-secondary">Guardar</button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
             <style>{`.form-label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #475569; } .dark .form-label { color: #94A3B8; } .form-input { width: 100%; background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 0.375rem; padding: 0.5rem; } .dark .form-input { background-color: #0D1117; border-color: #30363D; } .form-input:focus { outline: none; box-shadow: 0 0 0 2px var(--color-accent); }`}</style>
        </div>
    );
};


const DocumentManager: React.FC = () => {
    const { documents, setDocuments, deleteDocument, setTasks, setEvents, taskForDocFlow, setTaskForDocFlow, setViewingDocInfo, setCurrentView, View, addToast, schoolInfo, setNotifications, files, setFiles, savePath } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<Document | null>(null);
    const [activeTab, setActiveTab] = useState<'Entrante' | 'Saliente'>('Entrante');
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [openSalienteFormDirectly, setOpenSalienteFormDirectly] = useState(false);
    const [pdfPreviewType, setPdfPreviewType] = useState<'Entrante' | 'Saliente' | null>(null);
    const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);
    const pdfMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pdfMenuRef.current && !pdfMenuRef.current.contains(event.target as Node)) {
                setIsPdfMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    useEffect(() => {
        if (taskForDocFlow) {
            setEditingDocument(null);
            setIsModalOpen(true);
        }
    }, [taskForDocFlow]);

    const incomingDocuments = documents.filter(doc => doc.status === DocumentStatus.Entrante);
    const outgoingDocuments = documents.filter(doc => doc.status === DocumentStatus.Saliente);

    const handleOpenCreateModal = () => {
        setTaskForDocFlow(null);
        setEditingDocument(null);
        setIsModalOpen(true);
    };
    
    const handleContinueWithoutLink = () => {
        setIsVerificationModalOpen(false);
        setTaskForDocFlow(null);
        setEditingDocument(null);
        setOpenSalienteFormDirectly(true);
        setIsModalOpen(true);
    }
    
    const handleNavigateToTasks = () => {
        setIsVerificationModalOpen(false);
        setCurrentView(View.Tasks);
    }
    
    const handleSalienteSelection = () => {
        setIsModalOpen(false);
        setIsVerificationModalOpen(true);
    };

    const handleOpenEditModal = (doc: Document) => {
        setEditingDocument(doc);
        setIsModalOpen(true);
    };

    const handleOpenViewModal = (doc: Document, regNum: string) => {
        setViewingDocInfo({ doc, regNum });
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setEditingDocument(null);
        setTaskForDocFlow(null); // Always clear task context on close
        setOpenSalienteFormDirectly(false);
    };
    
    const convertTo12Hour = (time24: string): string => {
        if (!time24) return '12:00 AM';
        const [hour, minute] = time24.split(':');
        let hour12 = parseInt(hour, 10);
        const period = hour12 >= 12 ? 'PM' : 'AM';
        hour12 = hour12 % 12 || 12;
        return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
    };

    const handleSaveDocument = async (doc: Document, options: { createTask: boolean; createEvent: boolean; eventTimes?: { startTime: string; endTime: string; } }, taskToComplete?: Task | null) => {
        let finalDoc = { ...doc };
        const isNewDocument = !documents.some(d => d.id === finalDoc.id);

        // Step 1: Link task if exists
        if (taskToComplete) {
            finalDoc.generatedFromTaskId = taskToComplete.id;
            setTasks(prevTasks => prevTasks.map(t => 
                t.id === taskToComplete.id 
                ? { ...t, status: TaskStatus.Completada, linkedDocumentId: finalDoc.id } 
                : t
            ));
        }

        // Step 2: Save the document itself
        setDocuments(prev => {
            const index = prev.findIndex(d => d.id === finalDoc.id);
            if (index > -1) {
                const newDocs = [...prev];
                newDocs[index] = finalDoc;
                return newDocs;
            }
            return [finalDoc, ...prev];
        });
        addToast('Documento guardado con éxito.', 'success');

        // Step 3: Save file to selected folder if document has a file and folder
        if (finalDoc.fileDataUrl && finalDoc.folderId) {
            try {
                const selectedFolder = files.find(f => f.id === finalDoc.folderId && f.type === 'folder');
                if (selectedFolder) {
                    // Extract file name from document
                    const fileName = finalDoc.docNumber ? `${finalDoc.docNumber}_${finalDoc.content.substring(0, 30)}.pdf` : `documento_${finalDoc.id}.pdf`;
                    
                    // Get the base64 data from the fileDataUrl
                    const base64Data = finalDoc.fileDataUrl.split(',')[1];
                    
                    // Save file to the selected folder
                    const saveResult = await saveDocumentFileToFolder(selectedFolder, fileName, base64Data, files, savePath);
                    
                    if (saveResult) {
                        addToast(`Archivo guardado en carpeta: ${selectedFolder.name}`, 'success');
                    } else {
                        addToast(`Error al guardar archivo en carpeta: ${selectedFolder.name}`, 'error');
                    }
                }
            } catch (error) {
                console.error('Error saving document file to folder:', error);
                addToast('Error al guardar archivo adjunto', 'error');
            }
        }

        // Step 4: Create notification for new incoming documents
        if (isNewDocument && finalDoc.status === DocumentStatus.Entrante) {
            setNotifications(prev => {
                const newNotification: Notification = {
                    id: `notif-doc-${finalDoc.id}`,
                    type: NotificationType.Document,
                    sourceId: finalDoc.id,
                    title: 'Nuevo Documento Entrante',
                    message: `Recibido de ${finalDoc.sender}: "${finalDoc.content}"`,
                    timestamp: new Date().toISOString(),
                    read: false,
                };
                return [newNotification, ...prev];
            });
        }

        // Step 5: Conditionally create a new task (from an incoming doc)
        if (options.createTask) {
            const newTask: Task = {
                id: `task-from-doc-${doc.id}`,
                title: doc.content,
                description: `Tarea generada a partir del documento N° ${doc.docNumber || 's/n'} de ${doc.sender}. Trámite: ${doc.procedure}`,
                creationDate: new Date().toISOString().split('T')[0],
                dueDate: doc.receivedDate || new Date().toISOString().split('T')[0],
                priority: TaskPriority.Media,
                status: TaskStatus.Pendiente,
            };
            setTasks(prev => [newTask, ...prev]);
            addToast('Nueva tarea creada desde el documento.', 'info');
        }

        // Step 6: Conditionally create an event
        if (options.createEvent && options.eventTimes) {
            const newEvent: CalendarEvent = {
                id: `event-from-doc-${doc.id}`,
                title: doc.content,
                description: `Evento relacionado con el documento N° ${doc.docNumber || 's/n'} de ${doc.sender}.`,
                date: doc.receivedDate || new Date().toISOString().split('T')[0],
                startTime: convertTo12Hour(options.eventTimes.startTime),
                endTime: convertTo12Hour(options.eventTimes.endTime),
                attachedDocumentUrl: doc.fileDataUrl,
                attachedDocumentMimeType: doc.fileMimeType,
            };
            setEvents(prev => [newEvent, ...prev]);
            addToast('Nuevo evento creado desde el documento.', 'info');
        }
        
        handleCloseModals();
    };

    // Helper function to save document file to folder
    const saveDocumentFileToFolder = async (folder: FileItem, fileName: string, base64Data: string, allFiles: FileItem[], savePath: string): Promise<boolean> => {
        try {
            
            // Construct the folder path
            let folderPath = savePath;
            if (folder.parentId) {
                // Build the full folder path by traversing parent folders
                let pathParts: string[] = [];
                let currentId: string | null = folder.parentId;
                const allFolders = allFiles.filter(f => f.type === 'folder');
                
                while (currentId) {
                    const parentFolder = allFolders.find(f => f.id === currentId);
                    if (parentFolder) {
                        pathParts.unshift(parentFolder.name);
                        currentId = parentFolder.parentId;
                    } else {
                        currentId = null;
                    }
                }
                folderPath = `${savePath}/${pathParts.join('/')}/${folder.name}`;
            } else {
                folderPath = `${savePath}/${folder.name}`;
            }

            // Normalize Windows-style path separators
            let normalizedFolderPath = folderPath;
            if (/^[A-Za-z]:\\/.test(folderPath) || /^[A-Za-z]:/.test(folderPath)) {
                normalizedFolderPath = folderPath.replace(/\//g, '\\\\');
            }

            // Debug logging removed for production

            // Save the file using the web method
            const { saveFileToDiskWeb } = await import('../utils/fileUploadWeb');
            return await saveFileToDiskWeb(normalizedFolderPath, fileName, base64Data);
        } catch (error) {
            console.error('Error saving document file to folder:', error);
            return false;
        }
    };


    const tabs = [
        { name: 'Entrante', count: incomingDocuments.length },
        { name: 'Saliente', count: outgoingDocuments.length },
    ];

    const renderTable = (docs: Document[], type: 'Entrante' | 'Saliente') => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-nexus-text-secondary uppercase bg-slate-50 dark:bg-nexus-surface">
                    <tr>
                        <th className="px-6 py-3">N° Reg.</th>
                        <th className="px-6 py-3">N° Oficio</th>
                        <th className="px-6 py-3">Asunto</th>
                        {type === 'Entrante' ? <th className="px-6 py-3">Remitente</th> : <th className="px-6 py-3">Destinatario</th>}
                        {type === 'Entrante' ? <th className="px-6 py-3">Fecha Recibido</th> : <th className="px-6 py-3">Fecha Envío</th>}
                        <th className="px-6 py-3">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {docs.map((doc, index) => {
                        const registryNumber = docs.length - index;
                        const paddedRegistryNumber = String(registryNumber).padStart(3, '0');
                        return (
                        <tr key={doc.id} className="bg-white dark:bg-nexus-bg border-b dark:border-nexus-border hover:bg-slate-50 dark:hover:bg-nexus-surface/50">
                            <td className="px-6 py-4 font-mono text-slate-500 dark:text-nexus-text-secondary">{paddedRegistryNumber}</td>
                            <td className="px-6 py-4">{doc.docNumber || '-'}</td>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{doc.content}</td>
                            {type === 'Entrante' ? <td className="px-6 py-4">{doc.sender}</td> : <td className="px-6 py-4">{doc.recipient}</td>}
                            {type === 'Entrante' ? <td className="px-6 py-4">{formatDate(doc.receivedDate)}</td> : <td className="px-6 py-4">{formatDate(doc.stampDate)}</td>}
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => handleOpenViewModal(doc, paddedRegistryNumber)} className="text-slate-500 hover:text-nexus-primary" title="Ver Detalles">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                    </button>
                                    <button onClick={() => handleOpenEditModal(doc)} className="text-slate-500 hover:text-nexus-primary" title="Editar">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                    </button>
                                    <button onClick={() => deleteDocument(doc.id)} className="text-slate-500 hover:text-red-500" title="Eliminar">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
            {docs.length === 0 && <p className="text-center py-8 text-slate-500">No hay documentos en esta bandeja.</p>}
        </div>
    );
    
    return (
        <div className="animate-fade-in">
            {isVerificationModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={() => setIsVerificationModalOpen(false)}>
                    <div className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-md text-center" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-nexus-primary mb-4">Vincular a Tarea</h2>
                        <p className="text-slate-600 dark:text-nexus-text-secondary mb-6">
                            Si este registro corresponde a una tarea asignada, por favor inicie esta acción desde el gestor de 'Tareas' para vincularlos correctamente.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button onClick={handleNavigateToTasks} className="px-4 py-2 rounded bg-slate-200 text-slate-800 dark:bg-nexus-surface dark:text-white hover:bg-slate-300 dark:hover:bg-nexus-border">
                                Ir a Tareas
                            </button>
                            <button onClick={handleContinueWithoutLink} className="px-4 py-2 rounded bg-nexus-primary text-white hover:bg-nexus-secondary">
                                Continuar sin Vincular
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <DocumentRegistrationModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModals} 
                onSave={handleSaveDocument}
                documentToEdit={editingDocument}
                taskContext={taskForDocFlow}
                onSelectSaliente={handleSalienteSelection}
                openDirectlyTo={openSalienteFormDirectly ? 'Saliente' : null}
                files={files}
            />
            <RegistryPreviewModal
                previewType={pdfPreviewType}
                onClose={() => setPdfPreviewType(null)}
                documents={documents}
                schoolInfo={schoolInfo}
            />


            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-nexus-primary">Gestión de Documentos</h2>
                     <div className="flex items-center gap-2">
                        <div className="relative" ref={pdfMenuRef}>
                            <button
                                onClick={() => setIsPdfMenuOpen(prev => !prev)}
                                className="bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 dark:bg-nexus-surface dark:hover:bg-nexus-border transition-colors text-sm flex items-center gap-1.5"
                            >
                                Descargar Registros PDF
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                            {isPdfMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-nexus-bg ring-1 ring-black dark:ring-nexus-border ring-opacity-5 z-20">
                                    <div className="py-1">
                                        <button
                                            onClick={() => { setPdfPreviewType('Entrante'); setIsPdfMenuOpen(false); }}
                                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-nexus-text hover:bg-slate-100 dark:hover:bg-nexus-surface"
                                        >
                                            Registros Entrantes
                                        </button>
                                        <button
                                            onClick={() => { setPdfPreviewType('Saliente'); setIsPdfMenuOpen(false); }}
                                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-nexus-text hover:bg-slate-100 dark:hover:bg-nexus-surface"
                                        >
                                            Registros Salientes
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={handleOpenCreateModal} className="bg-cyan-500 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-600 transition-colors">
                            + Registrar Documento
                        </button>
                    </div>
                </div>
                
                <div className="border-b border-slate-200 dark:border-nexus-border">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name as 'Entrante' | 'Saliente')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === tab.name 
                                        ? 'border-nexus-primary text-nexus-primary' 
                                        : 'border-transparent text-slate-500 dark:text-nexus-text-secondary hover:text-slate-700 dark:hover:text-white hover:border-slate-400 dark:hover:border-gray-500'}`
                                }
                            >
                                {tab.name}
                                <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${activeTab === tab.name ? 'bg-nexus-primary/20 text-nexus-primary' : 'bg-slate-200 dark:bg-nexus-surface text-slate-600 dark:text-nexus-text-secondary'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-6">
                    {activeTab === 'Entrante' ? renderTable(incomingDocuments, 'Entrante') : renderTable(outgoingDocuments, 'Saliente')}
                </div>
            </Card>
        </div>
    );
};

export default DocumentManager;
