import React from 'react';
import { useApp } from '../contexts/AppContext';

const icons = {
    success: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    error: (
         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    info: (
         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

const ToastContainer: React.FC = () => {
    const { toasts } = useApp();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[200] w-full max-w-sm space-y-3">
            {toasts.map(toast => {
                const colors = {
                    success: 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/50 dark:border-green-600 dark:text-green-300',
                    error: 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/50 dark:border-red-600 dark:text-red-300',
                    info: 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/50 dark:border-blue-600 dark:text-blue-300',
                };
                return (
                    <div key={toast.id} className={`p-4 rounded-lg shadow-lg border-l-4 flex items-center gap-4 animate-toast-in ${colors[toast.type]}`}>
                        <div className="flex-shrink-0">{icons[toast.type]}</div>
                        <div className="text-sm font-medium">{toast.message}</div>
                    </div>
                );
            })}
             <style>{`
                @keyframes toast-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-toast-in { animation: toast-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ToastContainer;