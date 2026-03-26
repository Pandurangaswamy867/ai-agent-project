import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick,
  hoverable = false 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm ${hoverable ? 'hover:shadow-md hover:border-blue-200 transition-all cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-slate-100 -mx-6 -mt-6 mb-6 ${className}`}>
    {children}
  </div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-slate-100 -mx-6 -mb-6 mt-6 bg-slate-50/50 rounded-b-2xl ${className}`}>
    {children}
  </div>
);
