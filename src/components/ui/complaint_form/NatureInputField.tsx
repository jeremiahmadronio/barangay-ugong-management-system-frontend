import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface NatureOption {
  value: string;
  label: string;
}

interface NatureInputFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  helperText?: string;
  options?: NatureOption[];
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  emptyMessage?: string;
  direction?: "auto" | "up" | "down";
  maxLength?: number;
}

export const DEFAULT_NATURE_OF_COMPLAINT_OPTIONS: NatureOption[] = [
  { value: "Physical Injury", label: "Physical Injury" },
  { value: "Slander / Oral Defamation", label: "Slander / Oral Defamation" },
  { value: "Theft", label: "Theft" },
  { value: "Threats", label: "Threats" },
  { value: "Trespassing", label: "Trespassing" },
  { value: "Grave Coercion", label: "Grave Coercion" },
  { value: "Debt / Financial Dispute", label: "Debt / Financial Dispute" },
  { value: "Unjust Vexation", label: "Unjust Vexation" },
  { value: "Boundary / Land Dispute", label: "Boundary / Land Dispute" },
  { value: "Family / Relational Dispute", label: "Family / Relational Dispute" },
  {
    value: "Noise Nuisance (Videoke, Loud Music)",
    label: "Noise Nuisance (Videoke, Loud Music)",
  },
  {
    value: "Animal Nuisance (Stray/Noise/Waste)",
    label: "Animal Nuisance (Stray/Noise/Waste)",
  },
  {
    value: "Public Disturbance / Scandal",
    label: "Public Disturbance / Scandal",
  },
  {
    value: "Illegal Parking / Obstruction",
    label: "Illegal Parking / Obstruction",
  },
  {
    value: "Violation of Barangay Ordinance",
    label: "Violation of Barangay Ordinance",
  },
];

const defaultInputCls =
  "w-full px-3.5 py-2.5 text-xs border border-slate-200 focus:border-blue-400 rounded-xl outline-none focus:outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white";

export function NatureInputField({
  label = "Nature of Complaint",
  value,
  onChange,
  required = false,
  error,
  placeholder = "Select or type nature of complaint",
  helperText,
  options = DEFAULT_NATURE_OF_COMPLAINT_OPTIONS,
  className = "",
  inputClassName,
  labelClassName = "block text-xs font-semibold text-slate-700 mb-1",
  emptyMessage = "No matching nature found.",
  direction = "auto",
  maxLength = 150,
}: NatureInputFieldProps) {
  const helperId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return options;

    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query),
    );
  }, [options, value]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    if (direction === "up") {
      setOpenUpward(true);
      return;
    }
    if (direction === "down") {
      setOpenUpward(false);
      return;
    }

    const checkPosition = () => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      setOpenUpward(spaceBelow < 280 && spaceAbove > 180);
    };

    checkPosition();
    window.addEventListener("scroll", checkPosition, true);
    window.addEventListener("resize", checkPosition);

    return () => {
      window.removeEventListener("scroll", checkPosition, true);
      window.removeEventListener("resize", checkPosition);
    };
  }, [open, value, options.length, direction]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <span className="text-xs text-slate-400 font-normal">
            {(value || "").length}/{maxLength}
          </span>
        </div>
      )}
      <input
        type="text"
        maxLength={maxLength}
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        aria-describedby={helperText ? helperId : undefined}
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${helperId}-list`}
        className={inputClassName || defaultInputCls}
      />

      {helperText && (
        <p
          id={helperId}
          className="mt-1 text-[11px] text-slate-500 font-medium"
        >
          {helperText}
        </p>
      )}

      {open && (
        <div
          id={`${helperId}-list`}
          role="listbox"
          className={`absolute z-50 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10 text-xs ${
            openUpward ? "bottom-full mb-1.5" : "mt-1.5"
          }`}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected =
                value.trim().toLowerCase() === opt.label.trim().toLowerCase() ||
                value.trim().toLowerCase() === opt.value.trim().toLowerCase();

              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.label);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 text-left hover:bg-blue-50/70 focus:bg-blue-50 focus:outline-none transition-colors"
                >
                  <div className="font-semibold text-slate-900">{opt.label}</div>
                  {isSelected && (
                    <div className="text-[11px] font-bold text-blue-600">
                      Selected
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-3.5 py-2.5 text-slate-400 font-medium">
              {emptyMessage}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
