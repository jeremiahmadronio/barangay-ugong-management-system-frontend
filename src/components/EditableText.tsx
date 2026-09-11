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
  
  // Resolve current value from settings (supports nested JSON)
  const currentSection = settings[section] as any;
  let currentValue = defaultText;
  if (currentSection && typeof currentSection === 'object' && currentSection[settingKey]) {
    currentValue = currentSection[settingKey];
  } else if (currentSection && typeof currentSection === 'string') {
    // If it's a direct string (not nested)
    currentValue = currentSection as string;
  }

  // Handle Enter key for non-multiline elements
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      elementRef.current?.blur();
    }
  };

  const handleBlur = () => {
    if (!elementRef.current) return;
    const newValue = elementRef.current.innerText || '';
    if (newValue !== currentValue) {
      updateSettingLocal(section, settingKey, newValue);
    }
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
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${className} outline-none border border-transparent hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded transition-all cursor-text min-h-[1.5em] px-1 -mx-1`}
        style={style}
      >
        {currentValue}
      </Component>
      
      {/* Edit Indicator Icon */}
      <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-10">
        <Pencil className="w-3 h-3" />
      </div>
    </div>
  );
};
