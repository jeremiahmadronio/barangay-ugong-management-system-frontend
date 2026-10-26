import { NatureInputField } from "./NatureInputField";

type IncidentOption = {
  value: string;
  label: string;
};

interface ComplaintIncidentFieldsProps {
  values: {
    natureOfComplaint: string;
    dateOfIncident: string;
    timeOfIncident?: string;
    placeOfIncident: string;
    frequencyOfIncident?: string;
    descriptionOfInjuries?: string;
  };
  errors?: Record<string, string>;
  onChange: (field: string, value: string) => void;
  natureLabel: string;
  natureOptions?: IncidentOption[];
  naturePlaceholder?: string;
  placePlaceholder?: string;
  showFrequency?: boolean;
  frequencyLabel?: string;
  frequencyOptions?: IncidentOption[];
  showDescription?: boolean;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
}

const inputCls =
  "w-full px-3.5 py-2.5 text-xs border border-slate-200 focus:border-blue-400 rounded-xl outline-none focus:outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white";

export function ComplaintIncidentFields({
  values,
  errors = {},
  onChange,
  natureLabel,
  natureOptions,
  naturePlaceholder = "Select Nature",
  placePlaceholder = "e.g. Purok 8, Barangay Hall",
  showFrequency = false,
  frequencyLabel = "Frequency of Incident",
  frequencyOptions = [],
  showDescription = false,
  descriptionLabel = "Description of Injuries / Damages (if any)",
  descriptionPlaceholder = "Describe the incident details here...",
}: ComplaintIncidentFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NatureInputField
          label={natureLabel}
          value={values.natureOfComplaint}
          onChange={(val) => onChange("natureOfComplaint", val)}
          required
          error={errors.natureOfComplaint}
          placeholder={naturePlaceholder}
          options={
            natureOptions && natureOptions.length > 0
              ? natureOptions
              : undefined
          }
        />

        {showFrequency && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {frequencyLabel} <span className="text-red-500">*</span>
            </label>
            <select
              value={values.frequencyOfIncident || ""}
              onChange={(e) => onChange("frequencyOfIncident", e.target.value)}
              className={inputCls}
            >
              <option value="">Select Frequency</option>
              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.frequencyOfIncident && (
              <p className="text-xs text-red-500 mt-1">
                {errors.frequencyOfIncident}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Date of Incident <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={values.dateOfIncident}
            onChange={(e) => onChange("dateOfIncident", e.target.value)}
            className={inputCls}
          />
          {errors.dateOfIncident && (
            <p className="text-xs text-red-500 mt-1">{errors.dateOfIncident}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Time of Incident{" "}
            <span className="text-slate-400 font-normal text-[11px] ml-1">
              (Optional)
            </span>
          </label>
          <input
            type="time"
            value={values.timeOfIncident || ""}
            onChange={(e) => onChange("timeOfIncident", e.target.value)}
            className={inputCls}
          />
          {errors.timeOfIncident && (
            <p className="text-xs text-red-500 mt-1">{errors.timeOfIncident}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">
              Place of Incident <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-400 font-normal">
              {(values.placeOfIncident || "").length}/100
            </span>
          </div>
          <input
            type="text"
            maxLength={100}
            value={values.placeOfIncident}
            onChange={(e) => onChange("placeOfIncident", e.target.value)}
            placeholder={placePlaceholder}
            className={inputCls}
          />
          {errors.placeOfIncident && (
            <p className="text-xs text-red-500 mt-1">
              {errors.placeOfIncident}
            </p>
          )}
        </div>
      </div>

      {showDescription && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">
              {descriptionLabel}{" "}
              <span className="text-slate-400 font-normal text-[11px] ml-1">
                (Optional)
              </span>
            </label>
            <span className="text-xs text-slate-400 font-normal">
              {(values.descriptionOfInjuries || "").length}/500
            </span>
          </div>
          <textarea
            maxLength={500}
            value={values.descriptionOfInjuries || ""}
            onChange={(e) => onChange("descriptionOfInjuries", e.target.value)}
            placeholder={descriptionPlaceholder}
            rows={2}
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
}
