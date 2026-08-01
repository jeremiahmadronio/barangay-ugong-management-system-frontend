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
  description = "Please confirm before submitting.",
}: CertificationConsentCardProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className={`group flex items-start gap-3 rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
          checked
            ? "border-blue-200 bg-blue-50/80 shadow-sm ring-1 ring-blue-100"
            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
              Required
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
          <p className="mt-3 text-xs leading-relaxed font-medium text-slate-700">
            {text}
          </p>
        </div>

        <div className="pt-1">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </label>

      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}
