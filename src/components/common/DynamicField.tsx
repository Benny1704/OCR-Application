import { type ChangeEvent } from 'react';

interface DynamicFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readOnly: boolean;
  theme: 'light' | 'dark'; // Pass the theme as a prop
}

export const DynamicField = ({ label, name, value, onChange, readOnly, theme }: DynamicFieldProps) => {
  const isTextarea = value.length > 30;

  // Base classes that are the same for both themes
  const commonClasses = `w-full px-3 py-2 rounded-md border transition-colors duration-200 focus:outline-none focus:ring-2`;

  // Theme-specific classes
  const themeClasses = theme === 'dark'
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-violet-400 focus:border-violet-400'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-violet-500 focus:border-violet-500';
  
  // Read-only classes based on theme
  const readOnlyClasses = readOnly 
    ? (theme === 'dark' ? 'bg-slate-800/60 cursor-not-allowed' : 'bg-slate-100 cursor-not-allowed')
    : '';

  return (
    <div className="flex flex-col space-y-1.5">
      <label
        htmlFor={name}
        className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
      >
        {label}
      </label>
      {isTextarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          rows={3}
          className={`${commonClasses} ${readOnly ? readOnlyClasses : themeClasses} resize-y`}
        />
      ) : (
        <input
          type="text"
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          className={`${commonClasses} ${readOnly ? readOnlyClasses : themeClasses}`}
        />
      )}
    </div>
  );
};