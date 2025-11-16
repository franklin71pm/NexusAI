import React from 'react';
import Card from './common/Card';
import { useApp } from '../contexts/AppContext';
import { formatDate } from '../utils/dateFormatter';

const TrashManager: React.FC = () => {
    const { trashItems, restoreItem, deletePermanently, emptyTrash } = useApp();

    const handleEmptyTrash = () => {
        if (window.confirm('¿Está seguro de que desea vaciar la papelera? Esta acción no se puede deshacer.')) {
            emptyTrash();
        }
    };

    const handleDeleteItem = (id: string) => {
         if (window.confirm('¿Está seguro de que desea eliminar este elemento permanentemente?')) {
            deletePermanently(id);
        }
    }

    return (
        <div className="animate-fade-in">
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-nexus-primary">Elementos Eliminados</h2>
                    {trashItems.length > 0 && (
                        <button onClick={handleEmptyTrash} className="bg-red-500 text-white font-bold py-2 px-4 rounded-md hover:bg-red-600 transition-colors">
                            Vaciar Papelera
                        </button>
                    )}
                </div>
                <div className="space-y-3">
                    {trashItems.length > 0 ? trashItems.map(item => (
                        <div key={item.id} className="p-3 bg-slate-50 dark:bg-nexus-surface/50 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-nexus-text">{item.name}</p>
                                <p className="text-xs text-slate-500 dark:text-nexus-text-secondary">Tipo: {item.type} - Eliminado: {formatDate(item.deletedDate)}</p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => restoreItem(item)} className="text-sm font-semibold text-nexus-primary hover:underline">Restaurar</button>
                                <button onClick={() => handleDeleteItem(item.id)} className="text-sm font-semibold text-red-500 hover:underline">Eliminar</button>
                            </div>
                        </div>
                    )) : <p className="text-center text-slate-500 dark:text-nexus-text-secondary py-8">La papelera está vacía.</p>}
                </div>
            </Card>
        </div>
    );
};

export default TrashManager;