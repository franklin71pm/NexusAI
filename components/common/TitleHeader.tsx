import React from 'react';

interface TitleHeaderProps {
  title: string;
  subtitle: string;
}

const TitleHeader: React.FC<TitleHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-nexus-primary tracking-wider">{title}</h1>
      <p className="text-slate-500 dark:text-nexus-text-secondary mt-1">{subtitle}</p>
      <div className="mt-4 h-1 w-24 bg-cyan-400 rounded-full shadow-glow-cyan"></div>
    </div>
  );
};

export default TitleHeader;