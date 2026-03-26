import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string | React.ReactNode;
  multiline?: boolean;
  rows?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  multiline = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || Math.random().toString(36).substring(2, 9);
  
  const baseStyles = `w-full bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl px-4 py-3.5 text-slate-900 font-bold focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300`;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      
      {multiline ? (
        <textarea
          id={inputId}
          className={`${baseStyles} resize-none ${className}`}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={inputId}
          className={`${baseStyles} ${className}`}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      
      {error && (
        <div className="text-red-500 text-[10px] font-bold mt-1 ml-1" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};
