
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { useApp } from '../contexts/AppContext';
import { CalendarEvent } from '../types';
import { formatDate, formatDateObj } from '../utils/dateFormatter';

// Modal for creating/editing events
const EventFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: CalendarEvent) => void;
    eventToEdit: CalendarEvent | null;
}> = ({ isOpen, onClose, onSave, eventToEdit }) => {
    const [formData, setFormData] = useState<Partial<CalendarEvent>>({});

    const convertTo24Hour = (time12: string): string => {
        if (!time12) return '00:00';
        const [time, period] = time12.split(' ');
        if (!period) return time12; // Already 24h
        let [hours, minutes] = time.split(':');
        let h = parseInt(hours, 10);

        if (period.toUpperCase() === 'PM' && h < 12) h += 12;
        if (period.toUpperCase() === 'AM' && h === 12) h = 0;
        
        return `${String(h).padStart(2, '0')}:${minutes}`;
    };

    const convertTo12Hour = (time24: string): string => {
        if (!time24) return '12:00 AM';
        const [hour, minute] = time24.split(':');
        let hour12 = parseInt(hour, 10);
        const period = hour12 >= 12 ? 'PM' : 'AM';
        hour12 = hour12 % 12 || 12;
        return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
    };

    useEffect(() => {
        if (isOpen) {
            if (eventToEdit) {
                setFormData({
                    ...eventToEdit,
                    startTime: convertTo24Hour(eventToEdit.startTime),
                    endTime: convertTo24Hour(eventToEdit.endTime),
                });
            } else {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    startTime: '09:00',
                    endTime: '10:00',
                });
            }
        }
    }, [isOpen, eventToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) return;
        
        const finalEvent: CalendarEvent = {
            id: formData.id || `evt-${Date.now()}`,
            title: formData.title,
            date: formData.date,
            startTime: convertTo12Hour(formData.startTime),
            endTime: convertTo12Hour(formData.endTime),
            description: formData.description || '',
            attachedDocumentUrl: formData.attachedDocumentUrl,
            attachedDocumentMimeType: formData.attachedDocumentMimeType,
        };
        onSave(finalEvent);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-nexus-bg p-6 rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-nexus-primary mb-4">{eventToEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}</h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div>
                        <label className="form-label">Título del Evento</label>
                        <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className="form-input" required />
                    </div>
                    <div>
                        <label className="form-label">Fecha</label>
                        <input type="date" name="date" value={formData.date || ''} onChange={handleChange} className="form-input" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Hora de Inicio</label>
                            <input type="time" name="startTime" value={formData.startTime || ''} onChange={handleChange} className="form-input" required />
                        </div>
                        <div>
                            <label className="form-label">Hora de Fin</label>
                            <input type="time" name="endTime" value={formData.endTime || ''} onChange={handleChange} className="form-input" required />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Descripción</label>
                        <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={4} className="form-input" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-nexus-border">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-200 text-slate-800 dark:bg-nexus-surface dark:text-white hover:bg-slate-300 dark:hover:bg-nexus-border">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded bg-nexus-primary text-white hover:bg-nexus-secondary">Guardar Evento</button>
                </div>
            </form>
             <style>{`.form-label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #475569; } .dark .form-label { color: #94A3B8; } .form-input { width: 100%; background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 0.375rem; padding: 0.5rem; } .dark .form-input { background-color: #0D1117; border-color: #30363D; } .form-input:focus { outline: none; box-shadow: 0 0 0 2px var(--color-accent); }`}</style>
        </div>
    );
};

// --- NEW CODE ---

// Date Helper Functions
const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 = Sunday
const getWeek = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    startOfWeek.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });
};
const areDatesSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const timeToPercent = (timeStr: string) => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return ((hours * 60 + minutes) / (24 * 60)) * 100;
};

// Calendar Views
const ListView: React.FC<{ events: CalendarEvent[]; onEdit: (e: CalendarEvent) => void; onView: (e: CalendarEvent) => void; onDelete: (id: string) => void; }> = ({ events, onEdit, onView, onDelete }) => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return (
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
            {sortedEvents.length > 0 ? sortedEvents.map(event => (
                <div key={event.id} className="p-4 bg-slate-50 dark:bg-nexus-surface/50 rounded-lg flex items-center justify-between gap-4">
                    <div className="flex-grow">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{event.title}</h3>
                        <p className="text-sm font-semibold text-nexus-primary">{formatDate(event.date)}</p>
                        <p className="text-sm text-slate-500 dark:text-nexus-text-secondary">{event.startTime} - {event.endTime}</p>
                        <p className="text-sm text-slate-600 dark:text-nexus-text-secondary mt-1">{event.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500">
                        <button onClick={() => onView(event)} className="hover:text-nexus-primary" title="Ver Detalles"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg></button>
                        <button onClick={() => onEdit(event)} className="hover:text-nexus-primary" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                        <button onClick={() => onDelete(event.id)} className="hover:text-red-500" title="Eliminar"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                    </div>
                </div>
            )) : <p className="text-center py-8 text-slate-500">No hay eventos programados.</p>}
        </div>
    );
};

const DayView: React.FC<{ date: Date; events: CalendarEvent[]; onView: (e: CalendarEvent) => void; }> = ({ date, events, onView }) => {
    const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM
    const dayEvents = events.filter(e => areDatesSameDay(new Date(e.date + 'T00:00:00'), date));

    return (
        <div className="relative border-t dark:border-nexus-border h-[65vh] overflow-y-auto">
            {hours.map(hour => (
                <div key={hour} className="h-12 border-b dark:border-nexus-border flex items-start pl-2">
                    <span className="text-xs text-slate-400 dark:text-nexus-text-secondary -mt-2 mr-2">{`${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 || hour === 24 ? 'AM' : 'PM'}`}</span>
                </div>
            ))}
            {dayEvents.map(event => {
                const top = timeToPercent(event.startTime);
                const end = timeToPercent(event.endTime);
                const height = Math.max(end - top, 2); // min height
                return (
                    <div key={event.id} onClick={() => onView(event)} className="absolute left-16 right-2 bg-nexus-primary/80 text-white p-2 rounded-lg cursor-pointer overflow-hidden" style={{ top: `calc(${top}% + 1px)`, height: `calc(${height}% - 2px)` }}>
                        <p className="font-bold text-sm">{event.title}</p>
                        <p className="text-xs">{event.startTime} - {event.endTime}</p>
                    </div>
                );
            })}
        </div>
    );
}

const WeekView: React.FC<{ date: Date; events: CalendarEvent[]; onView: (e: CalendarEvent) => void; onDayClick: (d: Date) => void; }> = ({ date, events, onView, onDayClick }) => {
    const weekDates = getWeek(date);
    const today = new Date();
    return (
        <div className="border-t border-l dark:border-nexus-border">
            <div className="grid grid-cols-7 text-center font-semibold text-sm">
                {weekDates.map(d => (
                    <div key={d.toISOString()} className="p-2 border-b border-r dark:border-nexus-border" onClick={() => onDayClick(d)}>
                        <div className="text-xs">{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()]}</div>
                        <div className={`mt-1 text-lg font-bold ${areDatesSameDay(d, today) ? 'bg-nexus-primary text-white rounded-full w-8 h-8 mx-auto flex items-center justify-center' : ''}`}>{d.getDate()}</div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 h-[60vh] overflow-y-auto">
                {weekDates.map((day) => (
                    <div key={day.toISOString()} className="relative border-r dark:border-nexus-border h-full">
                        {events.filter(e => areDatesSameDay(new Date(e.date + 'T00:00:00'), day)).map(event => {
                             const top = timeToPercent(event.startTime);
                             const end = timeToPercent(event.endTime);
                             const height = Math.max(end - top, 2);
                             return (<div key={event.id} onClick={(e) => { e.stopPropagation(); onView(event); }} className="absolute left-1 right-1 bg-nexus-primary/80 text-white p-1 rounded cursor-pointer text-xs" style={{ top: `${top}%`, height: `${height}%` }} title={event.title}>{event.title}</div>);
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

const MonthView: React.FC<{ date: Date; events: CalendarEvent[]; onDayClick: (d: Date) => void; onView: (e: CalendarEvent) => void; }> = ({ date, events, onDayClick, onView }) => {
    const daysInMonth = getDaysInMonth(date);
    const firstDay = getFirstDayOfMonth(date);
    const today = new Date();
    const calendarGrid = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    
    return (
        <div className="border-t border-l dark:border-nexus-border">
            <div className="grid grid-cols-7 text-center font-semibold text-sm">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => <div key={day} className="p-2 border-b border-r dark:border-nexus-border">{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
                {calendarGrid.map((day, index) => {
                    if (!day) return <div key={`blank-${index}`} className="h-28 border-r border-b dark:border-nexus-border bg-slate-50 dark:bg-nexus-dark/50"></div>;
                    const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
                    const isToday = areDatesSameDay(currentDate, today);
                    const dayEvents = events.filter(e => areDatesSameDay(new Date(e.date + 'T00:00:00'), currentDate));
                    
                    return (
                        <div key={day} onClick={() => onDayClick(currentDate)} className="h-28 border-r border-b dark:border-nexus-border p-1 overflow-hidden cursor-pointer hover:bg-slate-50 dark:hover:bg-nexus-surface/30">
                            <span className={`text-sm ${isToday ? 'bg-nexus-primary text-white rounded-full h-6 w-6 flex items-center justify-center' : ''}`}>{day}</span>
                            <div className="text-xs mt-1 space-y-1">
                                {dayEvents.slice(0, 2).map(event => (<div key={event.id} onClick={(e) => { e.stopPropagation(); onView(event); }} className="bg-nexus-primary/70 text-white p-1 rounded truncate" title={event.title}>{event.title}</div>))}
                                {dayEvents.length > 2 && <div className="text-slate-500">+{dayEvents.length - 2} más</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const EventManager: React.FC = () => {
    const { events, setEvents, deleteEvent, addToast, setViewingEvent } = useApp();
    type CalendarView = 'month' | 'week' | 'day' | 'list';
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [view, setView] = useState<CalendarView>('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    const handleCloseModals = () => {
        setIsFormModalOpen(false);
        setEditingEvent(null);
    };

    const handleOpenCreateModal = () => {
        setEditingEvent(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (event: CalendarEvent) => {
        setEditingEvent(event);
        setIsFormModalOpen(true);
    };

    const handleOpenViewModal = (event: CalendarEvent) => setViewingEvent(event);
    
    const handleSaveEvent = (event: CalendarEvent) => {
        setEvents(prev => {
            const index = prev.findIndex(e => e.id === event.id);
            if (index > -1) {
                const newEvents = [...prev];
                newEvents[index] = event;
                return newEvents;
            }
            return [event, ...prev];
        });
        addToast('Evento guardado con éxito.', 'success');
        handleCloseModals();
    };

    const handlePrev = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (view === 'month') newDate.setMonth(prev.getMonth() - 1);
            if (view === 'week') newDate.setDate(prev.getDate() - 7);
            if (view === 'day') newDate.setDate(prev.getDate() - 1);
            return newDate;
        });
    };

    const handleNext = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (view === 'month') newDate.setMonth(prev.getMonth() + 1);
            if (view === 'week') newDate.setDate(prev.getDate() + 7);
            if (view === 'day') newDate.setDate(prev.getDate() + 1);
            return newDate;
        });
    };

    const handleToday = () => setCurrentDate(new Date());

    const handleDayClick = (date: Date) => {
        setCurrentDate(date);
        setView('day');
    };
    
    const renderTitle = () => {
        if (view === 'day') return formatDateObj(currentDate);
        if (view === 'week') {
            const week = getWeek(currentDate);
            const start = week[0];
            const end = week[6];
            return `${formatDateObj(start)} - ${formatDateObj(end)}`;
        }
        return currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="animate-fade-in">
            <EventFormModal isOpen={isFormModalOpen} onClose={handleCloseModals} onSave={handleSaveEvent} eventToEdit={editingEvent} />

            <Card>
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrev} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-nexus-surface">&lt;</button>
                        <button onClick={handleNext} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-nexus-surface">&gt;</button>
                        <button onClick={handleToday} className="px-3 py-1.5 text-sm font-semibold border border-slate-300 dark:border-nexus-border rounded-md hover:bg-slate-100 dark:hover:bg-nexus-surface">Hoy</button>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize ml-4">{renderTitle()}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center p-1 bg-slate-100 dark:bg-nexus-surface rounded-md">
                            {(['day', 'week', 'month', 'list'] as CalendarView[]).map(v => (
                                <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-sm font-semibold rounded capitalize ${view === v ? 'bg-white dark:bg-nexus-bg shadow-sm' : 'text-slate-600 dark:text-nexus-text-secondary'}`}>
                                    {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : v === 'month' ? 'Mes' : 'Lista'}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleOpenCreateModal} className="bg-nexus-primary text-white font-bold py-2 px-4 rounded-md hover:bg-nexus-secondary transition-colors">
                            + Nuevo Evento
                        </button>
                    </div>
                </div>
                
                <div>
                    {view === 'list' && <ListView events={events} onEdit={handleOpenEditModal} onView={handleOpenViewModal} onDelete={deleteEvent} />}
                    {view === 'day' && <DayView date={currentDate} events={events} onView={handleOpenViewModal} />}
                    {view === 'week' && <WeekView date={currentDate} events={events} onView={handleOpenViewModal} onDayClick={handleDayClick} />}
                    {view === 'month' && <MonthView date={currentDate} events={events} onView={handleOpenViewModal} onDayClick={handleDayClick} />}
                </div>

            </Card>
        </div>
    );
};

export default EventManager;
