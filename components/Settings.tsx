// Fix: The original file was incomplete. It has been reconstructed with a full component implementation and a default export was added to resolve the import error.
import React, { useState } from 'react';
import Card from './common/Card';
import { ACCENT_COLORS, FONT_FAMILIES, FONT_SIZES } from '../constants';
import { useApp } from '../contexts/AppContext';
import { BackupData } from '../types';

const Settings: React.FC = () => {
    const {
        accentColor, setAccentColor,
        schoolInfo, setSchoolInfo,
        fontSize, setFontSize,
        fontFamily, setFontFamily,
        addToast,
        allData,
        importData,
        templates,
        confirmBackup,
    } = useApp();
    const [notifications, setNotifications] = useState({
        tasks: true,
        documents: true,
        calendar: false,
    });
    const [language, setLanguage] = useState('es-ES');

    const handleSchoolInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSchoolInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleNotificationChange = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleExport = () => {
        try {
            const backupData: BackupData = {
                version: 1,
                exportedAt: new Date().toISOString(),
                allData,
                schoolInfo,
                templates,
                accentColor,
                fontSize,
                fontFamily,
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = `nexus-os-backup-${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            addToast("Datos exportados exitosamente.", "success");
            confirmBackup();
        } catch (error) {
            console.error("Error exporting data:", error);
            addToast("Error al exportar los datos.", "error");
        }
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.confirm("¿Está seguro de que desea importar este archivo? Esta acción REEMPLAZARÁ todos los datos actuales y no se puede deshacer.")) {
            e.target.value = ''; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = event.target?.result;
                if (typeof result !== 'string') throw new Error("File content is not readable.");

                const data = JSON.parse(result) as BackupData;

                if (data.version !== 1 || !data.allData || !data.schoolInfo) {
                    throw new Error("El archivo de respaldo es inválido o está corrupto.");
                }

                importData(data);

                addToast("Datos importados con éxito. La aplicación se recargará.", "success");

                setTimeout(() => {
                    window.location.reload();
                }, 1500);

            } catch (error) {
                console.error("Error importing data:", error);
                addToast(error instanceof Error ? error.message : "Error al importar el archivo.", "error");
            } finally {
                e.target.value = '';
            }
        };
        reader.onerror = () => {
            addToast("No se pudo leer el archivo de respaldo.", "error");
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; label: string; }> = ({ enabled, onChange, label }) => (
        <label htmlFor={label} className="flex items-center justify-between cursor-pointer p-2 rounded-md hover:bg-slate-50 dark:hover:bg-nexus-surface/50 transition-colors">
            <span className="text-slate-700 dark:text-nexus-text">{label}</span>
            <div className="relative">
                <input id={label} type="checkbox" className="sr-only" checked={enabled} onChange={onChange} />
                <div className={`block w-10 h-6 rounded-full transition ${enabled ? 'bg-nexus-primary' : 'bg-slate-300 dark:bg-nexus-dark'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${enabled ? 'translate-x-4' : ''}`}></div>
            </div>
        </label>
    );

    return (
        <div className="animate-fade-in space-y-6">
            <style>{`.form-input { width: 100%; background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 0.375rem; padding: 0.5rem; } .dark .form-input { background-color: #0D1117; border-color: #30363D; } .form-input:focus { outline: none; box-shadow: 0 0 0 2px var(--color-accent); }`}</style>
            <Card>
                <h2 className="text-lg font-semibold text-nexus-primary mb-4">Información de la Institución</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-1">Nombre de la Escuela</label>
                        <input type="text" name="schoolName" value={schoolInfo.schoolName} onChange={handleSchoolInfoChange} className="form-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-1">Nombre del Director</label>
                        <input type="text" name="directorName" value={schoolInfo.directorName} onChange={handleSchoolInfoChange} className="form-input" />
                    </div>
                </div>
            </Card>
            <Card>
                <h2 className="text-lg font-semibold text-nexus-primary mb-4">Apariencia</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-2">Color de Acento</label>
                        <div className="flex flex-wrap gap-3">
                            {ACCENT_COLORS.map(color => (
                                <button
                                    key={color.name}
                                    onClick={() => setAccentColor(color.color)}
                                    className={`h-8 w-8 rounded-full transition-all ring-offset-2 dark:ring-offset-nexus-bg ring-2 ${accentColor === color.color ? 'ring-nexus-primary' : 'ring-transparent hover:ring-slate-300 dark:hover:ring-nexus-border'}`}
                                    style={{ backgroundColor: color.color }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-2">Tamaño de Fuente</label>
                            <div className="flex gap-2 rounded-lg bg-slate-100 dark:bg-nexus-dark p-1">
                                {FONT_SIZES.map(size => (
                                    <button
                                        key={size.name}
                                        onClick={() => setFontSize(size.value)}
                                        className={`w-full px-3 py-1 text-sm font-semibold rounded-md transition-colors ${fontSize === size.value ? 'bg-white dark:bg-nexus-surface shadow-sm' : 'text-slate-600 dark:text-nexus-text-secondary hover:bg-white/50 dark:hover:bg-nexus-surface/50'}`}
                                    >
                                        {size.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-2">Tipo de Fuente</label>
                            <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="form-input">
                                {FONT_FAMILIES.map(font => (
                                    <option key={font.name} value={font.value}>{font.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </Card>
            <Card>
                <h2 className="text-lg font-semibold text-nexus-primary mb-4">Notificaciones</h2>
                <div className="space-y-2">
                    <ToggleSwitch enabled={notifications.tasks} onChange={() => handleNotificationChange('tasks')} label="Vencimiento de Tareas" />
                    <ToggleSwitch enabled={notifications.documents} onChange={() => handleNotificationChange('documents')} label="Documentos Recibidos" />
                    <ToggleSwitch enabled={notifications.calendar} onChange={() => handleNotificationChange('calendar')} label="Eventos Próximos" />
                </div>
            </Card>
            <Card>
                <h2 className="text-lg font-semibold text-nexus-primary mb-4">Idioma y Región</h2>
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-nexus-text-secondary mb-1">Idioma</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className="form-input">
                        <option value="es-ES">Español (España)</option>
                        <option value="es-MX">Español (México)</option>
                        <option value="en-US">English (United States)</option>
                    </select>
                </div>
            </Card>
            <Card>
                <h2 className="text-lg font-semibold text-nexus-primary mb-4">Copia de Seguridad y Restauración</h2>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-nexus-text-secondary">
                        Exporte todos los datos de la aplicación a un archivo JSON para su custodia o para migrar a otro dispositivo. La restauración reemplazará todos los datos existentes.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleExport}
                            className="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center"
                        >
                            Exportar Datos
                        </button>
                        <label
                            htmlFor="import-backup"
                            className="flex-1 bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 transition-colors cursor-pointer text-center"
                        >
                            Importar Datos
                        </label>
                        <input
                            type="file"
                            id="import-backup"
                            className="hidden"
                            accept=".json"
                            onChange={handleImport}
                            onClick={(e) => (e.currentTarget.value = '')}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Settings;
