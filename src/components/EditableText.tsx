import React, { useRef, useEffect } from 'react';
import { useWebsiteSettings, type WebsiteSettings } from '../context/WebsiteSettingsContext';
import { Pencil } from 'lucide-react';

interface EditableTextProps {
  section: keyof WebsiteSettings;
  settingKey: string;
  defaultText: string;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({ 
  section, 
  settingKey, 
  defaultText, 
  as: Component = 'span', 
  className = '',
  style,
  multiline = false
}) => {
  const { editMode, updateSettingLocal, settings } = useWebsiteSettings();
  const elementRef = useRef<HTMLElement>(null);
  const isFocusedRef = useRef(false);
  
  // Resolve current value from settings (supports nested JSON)
  const currentSection = settings[section] as any;
  let currentValue = defaultText;
  if (currentSection && typeof currentSection === 'object' && currentSection[settingKey] !== undefined) {
    currentValue = currentSection[settingKey];
  } else if (currentSection && typeof currentSection === 'string') {
    // If it's a direct string (not nested)
    currentValue = currentSection as string;
  }

  // Keep DOM in sync when settings change, but never while typing
  useEffect(() => {
    if (elementRef.current && !isFocusedRef.current) {
      elementRef.current.innerText = currentValue;
    }
  }, [currentValue]);

  // Handle Enter key for non-multiline elements
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      elementRef.current?.blur();
    }
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleInput = () => {
    if (!elementRef.current) return;
    const newValue = elementRef.current.innerText ?? '';
    updateSettingLocal(section, settingKey, newValue);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (!elementRef.current) return;
    const newValue = elementRef.current.innerText ?? '';
    updateSettingLocal(section, settingKey, newValue);
  };

  if (!editMode) {
    return <Component className={className} style={style}>{currentValue}</Component>;
  }

  return (
    <div className={`relative group inline-block ${Component === 'p' ? 'w-full' : ''}`}>
      <Component
        ref={elementRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={handleFocus}
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${className} outline-none border border-dashed border-blue-400/60 hover:border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/30 rounded px-1.5 -mx-1 transition-all cursor-text min-h-[1.5em] bg-blue-50/20 hover:bg-blue-50/40`}
        style={style}
      >
        {currentValue}
      </Component>
      
      {/* Edit Indicator Icon */}
      <div className="absolute -top-2.5 -right-2.5 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-20">
        <Pencil className="w-2.5 h-2.5" />
      </div>
    </div>
  );
};
