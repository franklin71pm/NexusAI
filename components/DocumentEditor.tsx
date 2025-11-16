import React from 'react';
import Card from './common/Card';

const DocumentEditor: React.FC = () => {
    return (
        <div className="animate-fade-in flex items-center justify-center h-full">
            <Card className="text-center">
                <h2 className="text-xl font-semibold text-nexus-primary mb-2">Creación de Documentos</h2>
                <p className="text-slate-600 dark:text-nexus-text-secondary">
                    La creación de documentos ahora se realiza directamente en su procesador de texto preferido (ej. Microsoft Word).
                    <br />
                    Puede acceder a su carpeta de documentos recurrentes desde el panel lateral y luego subir el archivo finalizado en la sección 'Carpetas'.
                </p>
            </Card>
        </div>
    );
};

export default DocumentEditor;
