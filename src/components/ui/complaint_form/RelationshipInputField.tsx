import { useEffect, useId, useMemo, useRef, useState } from "react";

interface RelationshipOption {
  value: string;
  label: string;
}

interface RelationshipInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  helperText?: string;
  suggestions?: RelationshipOption[];
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  emptyMessage?: string;
  direction?: "auto" | "up" | "down";
}

export const DEFAULT_RELATIONSHIP_OPTIONS = [
  { value: "NEIGHBOR", label: "Neighbor (Kapitbahay)" },
  { value: "LANDLORD", label: "Landlord (Nagpapa-upa)" },
  { value: "TENANT", label: "Tenant (Umuupa)" },
  { value: "SPOUSE_OR_PARTNER", label: "Spouse / Partner (Asawa / Live-in)" },
  { value: "RELATIVE", label: "Relative / Family Member (Kamag-anak)" },
  { value: "EMPLOYER", label: "Employer / Boss (Amo)" },
  { value: "EMPLOYEE", label: "Employee / Worker (Kasambahay / Manggagawa)" },
  {
    value: "ACQUAINTANCE",
    label: "Friend / Acquaintance (Kaibigan / Kakilala)",
  },
  { value: "BUSINESS_PARTNER", label: "Business Partner (Kasama sa trabaho)" },
  { value: "STRANGER", label: "Stranger / Unknown (Hindi kakilala)" },
];
const defaultInputCls =
  "w-full px-3.5 py-2.5 text-xs border border-slate-200 focus:border-blue-400 rounded-xl outline-none focus:outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white";

const stripDisplayLabel = (text: string) =>
  text.replace(/\s*\([^)]*\)\s*$/, "").trim();

export function RelationshipInputField({
  label,
  value,
  onChange,
  required = false,
  error,
  placeholder = "Type or pick a sample relationship",
  helperText = "Type to search, then choose one from the list below.",
  suggestions = DEFAULT_RELATIONSHIP_OPTIONS,
  className = "",
  inputClassName,
  labelClassName = "block text-xs font-semibold text-slate-700 mb-1",
  emptyMessage = "No matching relationship found.",
  direction = "auto",
}: RelationshipInputFieldProps) {
  const helperId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  const filteredSuggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return suggestions;

    return suggestions.filter(
      (suggestion) =>
        suggestion.label.toLowerCase().includes(query) ||
        suggestion.value.toLowerCase().includes(query),
    );
  }, [suggestions, value]);

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

      // Prefer opening upward if space below is limited (< 280px) and there's space above
      setOpenUpward(spaceBelow < 280 && spaceAbove > 180);
    };

    checkPosition();
    window.addEventListener("scroll", checkPosition, true);
    window.addEventListener("resize", checkPosition);

    return () => {
      window.removeEventListener("scroll", checkPosition, true);
      window.removeEventListener("resize", checkPosition);
    };
  }, [open, value, suggestions.length, direction]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <label className={labelClassName}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
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
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((suggestion) => {
              const plainLabel = stripDisplayLabel(suggestion.label);
              const isSelected =
                value.trim().toLowerCase() === plainLabel.toLowerCase() ||
                value.trim().toLowerCase() ===
                  suggestion.label.trim().toLowerCase() ||
                value.trim().toLowerCase() ===
                  suggestion.value.trim().toLowerCase();

              return (
                <button
                  key={suggestion.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(stripDisplayLabel(suggestion.label));
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 text-left hover:bg-blue-50/70 focus:bg-blue-50 focus:outline-none transition-colors"
                >
                  <div className="font-semibold text-slate-900">
                    {suggestion.label}
                  </div>
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
