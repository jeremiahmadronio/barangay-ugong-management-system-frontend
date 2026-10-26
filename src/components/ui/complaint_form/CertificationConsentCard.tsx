interface CertificationConsentCardProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  text: string;
  error?: string;
  title?: string;
  description?: string;
}

export function CertificationConsentCard({
  id,
  checked,
  onChange,
  text,
  error,
  title = "Certification",
  description,
}: CertificationConsentCardProps) {
  return (
    <div className="space-y-1.5">
      <div
        className={`rounded-xl border transition-colors p-4 ${
          error
            ? "border-red-300 bg-red-50/30"
            : checked
            ? "border-slate-200 bg-slate-50/70"
            : "border-slate-200 bg-white"
        }`}
      >
        <label
          htmlFor={id}
          className="flex items-start gap-3 cursor-pointer select-none"
        >
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-800 block">
              {title} <span className="text-red-500">*</span>
            </span>
            {description && (
              <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
            )}
            <p className="mt-1 text-xs text-slate-600 leading-relaxed font-normal">
              {text}
            </p>
          </div>
        </label>
      </div>

      {error && <p className="text-xs font-medium text-red-500 ml-1">{error}</p>}
    </div>
  );
}
