// Fix: Removed file markers that were causing syntax errors.
import React, { useState, useEffect, useCallback } from 'react';
import Card from './common/Card';
import { Template, DocumentDocType } from '../types';
import { useApp } from '../contexts/AppContext';

const TemplateFormModal: React.FC<{
  template: Partial<Template> | null;
  onClose: () => void;
  onSave: (template: Template) => void;
}> = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Template>>({});
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const initialData: Partial<Template> = template || {
      name: '',
      documentType: DocumentDocType.Oficio,
      fileName: '',
      fileMimeType: '',
      fileUrl: ''
    };
    setFormData(initialData);
    setFile(null);
    setError('');
  }, [template]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || selectedFile.type === 'application/msword') {
            setFile(selectedFile);
            setFormData(prev => ({...prev, fileName: selectedFile.name, fileMimeType: selectedFile.type}));
            setError('');
        } else {
            setError('Por favor, suba un archivo de Word (.doc, .docx).');
            setFile(null);
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
        setError('Por favor, ingrese un nombre para la plantilla.');
        return;
    }
    if (!formData.id && !file) { // If it's a new template, a file is required
        setError('Por favor, suba un archivo de plantilla.');
        return;
    }

    const saveTemplate = (fileUrl: string) => {
        const finalTemplate: Template = {
          id: formData.id || `template-${Date.now()}`,
          name: formData.name!,
          documentType: formData.documentType || DocumentDocType.Oficio,
          fileName: formData.fileName!,
          fileMimeType: formData.fileMimeType!,
          fileUrl: fileUrl,
        };
        onSave(finalTemplate);
    }
    
    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            saveTemplate(reader.result as string);
        };
        reader.onerror = () => {
            setError('No se pudo leer el archivo.');
        }
    } else if (formData.id && formData.fileUrl) {
        // Editing without changing the file
        saveTemplate(formData.fileUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-nexus-primary mb-4">
          {formData.id ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-1">Nombre de la Plantilla</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="form-input" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-1">Tipo de Documento</label>
                <select name="documentType" value={formData.documentType} onChange={handleChange} className="form-input">
                    {Object.values(DocumentDocType).map((type: string) => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-1">Archivo de Plantilla (.docx)</label>
                <input type="file" onChange={handleFileChange} accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="form-input" />
                {formData.fileName && !file && <p className="text-xs text-slate-500 mt-1">Archivo actual: {formData.fileName}</p>}
                {file && <p className="text-xs text-slate-500 mt-1">Nuevo archivo seleccionado: {file.name}</p>}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-nexus-border">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-200 text-slate-800 dark:bg-nexus-surface dark:text-white hover:bg-slate-300 dark:hover:bg-nexus-border">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded bg-nexus-primary text-white hover:bg-nexus-secondary">Guardar Plantilla</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TemplateManager: React.FC = () => {
  const { templates, handleSaveTemplate, handleDeleteTemplate } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);

  const handleOpenModal = (template: Partial<Template> | null = null) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTemplate(null);
    setIsModalOpen(false);
  };

  const confirmDelete = (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta plantilla?')) {
        handleDeleteTemplate(id);
    }
  };

  return (
    <div className="animate-fade-in">
       <style>{`.form-input { width: 100%; background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 0.375rem; padding: 0.5rem; } .dark .form-input { background-color: #0D1117; border-color: #30363D; } .form-input:focus { outline: none; box-shadow: 0 0 0 2px var(--color-accent); }`}</style>

      {isModalOpen && <TemplateFormModal template={editingTemplate} onClose={handleCloseModal} onSave={handleSaveTemplate} />}
      
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-nexus-primary">Mis Plantillas</h2>
          <button onClick={() => handleOpenModal()} className="bg-nexus-primary text-white font-bold py-2 px-4 rounded-md hover:bg-nexus-secondary transition-colors">
            + Crear Nueva Plantilla
          </button>
        </div>
        
        {templates.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-nexus-border rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No hay plantillas</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-nexus-text-secondary">Comience por crear su primera plantilla de documento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
                <Card key={template.id} className="flex flex-col">
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-nexus-text">{template.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-nexus-text-secondary mb-3">{template.documentType}</p>
                        <div className="text-sm text-slate-600 dark:text-nexus-text-secondary bg-slate-100 dark:bg-nexus-bg p-3 rounded-md font-mono flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                           </svg>
                           <span className="truncate" title={template.fileName}>{template.fileName}</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-nexus-border flex justify-between items-center">
                        <div className="flex gap-2">
                            <button onClick={() => handleOpenModal(template)} className="text-sm font-semibold text-nexus-primary hover:underline">Editar</button>
                            <button onClick={() => confirmDelete(template.id)} className="text-sm font-semibold text-red-500 hover:underline">Eliminar</button>
                        </div>
                        <a href={template.fileUrl} download={template.fileName} className="bg-blue-600 text-white font-bold py-2 px-3 rounded-md hover:bg-blue-700 text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Descargar
                        </a>
                    </div>
                </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default TemplateManager;