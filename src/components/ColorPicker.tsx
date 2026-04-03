import React from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PALETTES = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b'
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-9 gap-1">
        {PALETTES.map(color => (
          <button
            key={color}
            type="button"
            className={`w-6 h-6 rounded-full border-2 ${value === color ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">مخصص:</span>
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="w-full h-8 rounded-lg cursor-pointer bg-transparent"
        />
      </div>
    </div>
  );
};
