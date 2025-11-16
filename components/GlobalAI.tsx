
import React, { useState, useRef, useEffect } from 'react';
// Fix: Import types from the centralized types.ts file
import { AppContextForAI, AIConversation } from '../types';
import { getGlobalAIResponse } from '../services/geminiService';

interface GlobalAIProps {
    // Fix: Renamed AppContext to AppContextForAI to match the exported type from types.ts.
    appContext: AppContextForAI;
}

const GlobalAI: React.FC<GlobalAIProps> = ({ appContext }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [conversation, setConversation] = useState<AIConversation[]>([]);
    const [currentQuery, setCurrentQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [conversation]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
        if (conversation.length === 0) {
            setConversation([{ role: 'model', content: 'Hola, soy Nexus, tu asistente de IA. ¿En qué puedo ayudarte hoy?' }]);
        }
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleQuerySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentQuery.trim() || isLoading) return;

        const userMessage: AIConversation = { role: 'user', content: currentQuery.trim() };
        setConversation(prev => [...prev, userMessage]);
        setCurrentQuery('');
        setIsLoading(true);

        const modelMessage: AIConversation = { role: 'model', content: '' };
        setConversation(prev => [...prev, modelMessage]);

        try {
            const stream = await getGlobalAIResponse(userMessage.content, appContext);
            const reader = stream.getReader();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // FIX: The stream from getGlobalAIResponse already provides string chunks.
                // TextDecoder is not needed. 'value' is the string chunk.
                const chunk = value;
                setConversation(prev => {
                    const newConversation = [...prev];
                    const lastMessage = newConversation[newConversation.length - 1];
                    if (lastMessage) {
                        lastMessage.content += chunk;
                    }
                    return newConversation;
                });
            }
        } catch (error) {
            const errorMessage: AIConversation = { role: 'model', content: 'Lo siento, ocurrió un error al procesar tu solicitud.' };
             setConversation(prev => {
                const newConversation = [...prev];
                newConversation[newConversation.length - 1] = errorMessage;
                return newConversation;
            });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderMessageContent = (content: string) => {
        // A simple markdown-like renderer for code blocks and bold text
        return content.split('```').map((part, index) => {
            if (index % 2 === 1) { // This is a code block
                const codeLines = part.split('\n');
                codeLines.shift(); // remove language specifier if any
                return (
                    <pre key={index} className="bg-slate-800 text-white p-3 rounded-md my-2 overflow-x-auto text-sm font-mono">
                        <code>{codeLines.join('\n')}</code>
                    </pre>
                );
            }
            // Render bold text
            return part.split('**').map((textPart, textIndex) => 
                textIndex % 2 === 1 ? <strong key={textIndex}>{textPart}</strong> : <span key={textIndex}>{textPart}</span>
            );
        });
    };

    return (
        <>
            <button 
                onClick={handleOpenModal}
                className="p-2 rounded-full text-slate-500 dark:text-nexus-text-secondary hover:bg-slate-100 dark:hover:bg-nexus-surface transition-colors"
                aria-label="Abrir Asistente IA"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    <path d="M5 12l-4-3 1.5-5 5 1z" transform="scale(0.5) translate(3, 3)"/>
                    <path d="M19 12l4-3-1.5-5-5 1z" transform="scale(0.5) translate(25, 3)"/>
                </svg>
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={handleCloseModal}>
                    <div className="bg-white dark:bg-nexus-bg rounded-lg border border-slate-200 dark:border-nexus-border shadow-lg w-full max-w-2xl h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-200 dark:border-nexus-border flex-shrink-0">
                            <h2 className="text-lg font-bold text-nexus-primary">Asistente IA Global</h2>
                            <p className="text-sm text-slate-500 dark:text-nexus-text-secondary">Haga preguntas sobre sus documentos, tareas y eventos.</p>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-4">
                            {conversation.map((msg, index) => (
                                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && (
                                        <div className="w-8 h-8 rounded-full bg-nexus-primary flex items-center justify-center text-white font-bold flex-shrink-0">N</div>
                                    )}
                                    <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-nexus-accent text-white' : 'bg-slate-100 dark:bg-nexus-surface'}`}>
                                        <div className="text-sm whitespace-pre-wrap">{renderMessageContent(msg.content)}</div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && conversation[conversation.length - 1]?.role === 'model' && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-nexus-primary flex items-center justify-center text-white font-bold flex-shrink-0">N</div>
                                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-nexus-surface flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '0s' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse ml-1" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse ml-1" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-nexus-border flex-shrink-0">
                            <form onSubmit={handleQuerySubmit} className="flex gap-3">
                                <input
                                    type="text"
                                    value={currentQuery}
                                    onChange={(e) => setCurrentQuery(e.target.value)}
                                    placeholder="Ej: ¿Qué tareas vencen esta semana?"
                                    className="flex-grow bg-slate-50 dark:bg-nexus-dark border border-slate-300 dark:border-nexus-border rounded-md p-2 focus:ring-2 focus:ring-nexus-accent focus:outline-none"
                                    disabled={isLoading}
                                />
                                <button type="submit" className="bg-nexus-primary text-white font-bold py-2 px-4 rounded-md hover:bg-nexus-secondary disabled:opacity-50" disabled={isLoading || !currentQuery.trim()}>
                                    Enviar
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Fix: Add default export to resolve import error in Header.tsx
export default GlobalAI;
