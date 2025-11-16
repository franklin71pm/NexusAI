import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white/70 dark:bg-nexus-surface/70 backdrop-blur-sm border border-slate-200 dark:border-nexus-border rounded-lg p-6 shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;