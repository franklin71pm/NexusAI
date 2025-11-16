import React from 'react';
import { FileItem } from '../types';

const FilePreviewModal: React.FC<{
    file: FileItem | null;
    onClose: () => void;
}> = ({ file, onClose }) => {
    if (!file) return null;

    const isImage = file.type && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(file.type.toLowerCase());
    const isPdf = file.type && file.type.toLowerCase() === 'pdf';

    const renderContent = () => {
        if (!file.contentUrl) {
            return (
                <div className="text-center p-8">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-nexus-text">Vista Previa No Disponible</h3>
                    <p className="text-slate-500 dark:text-nexus-text-secondary mt-2">No se puede generar una vista previa para este tipo de archivo.</p>
                </div>
            );
        }

        if (isImage) {
            return <img src={file.contentUrl} alt={file.name} className="max-w-full max-h-[80vh] object-contain" />;
        }

        if (isPdf) {
            return <iframe src={file.contentUrl} className="w-full h-[80vh] border-0" title={file.name} />;
        }

        return (
            <div className="text-center p-8">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-nexus-text">Vista Previa No Soportada</h3>
                <p className="text-slate-500 dark:text-nexus-text-secondary mt-2">No se puede previsualizar el archivo: <span className="font-mono">{file.name}</span></p>
                <a 
                    href={file.contentUrl} 
                    download={file.name} 
                    className="mt-6 inline-block bg-nexus-primary text-white font-bold py-2 px-4 rounded-md hover:bg-nexus-secondary transition-colors"
                >
                    Descargar Archivo
                </a>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-nexus-bg p-4 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2 pb-2 border-b dark:border-nexus-border">
                    <h2 className="text-lg font-bold text-nexus-primary truncate pr-4">{file.name}</h2>
                    <button onClick={onClose} className="text-2xl font-bold text-slate-500 hover:text-red-500 transition-colors">&times;</button>
                </div>
                <div className="flex justify-center items-center bg-slate-100 dark:bg-nexus-dark rounded-b-md">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;