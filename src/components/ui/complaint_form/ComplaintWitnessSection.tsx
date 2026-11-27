import { useRef, useState, useEffect } from "react";
import { X, Plus, UploadCloud, CheckCircle2 } from "lucide-react";
import {
  SearchSelect,
  type SearchSelectOption,
} from "@/components/ui/SearchSelect";
import {
  PhAddressSelector,
  type PhAddressValue,
} from "@/components/ui/PhAddressSelector";
import type { WitnessData } from "./types";
import { residentService } from "@/config/api/residents/residents.service";
import type { ResidentSearchOption } from "@/config/api/residents/residents.types";

interface ComplaintWitnessSectionProps {
  witnesses: WitnessData[];
  onWitnessesChange: (witnesses: WitnessData[]) => void;
  currentComplainantName?: string;
  currentRespondentName?: string;
  hideBottomAddButton?: boolean;
}

const inputCls =
  "w-full px-3.5 py-2.5 text-xs border border-slate-200 focus:border-blue-400 rounded-xl outline-none focus:outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white";

const sanitizeName = (val: string) => val.replace(/[^a-zA-ZñÑ\s.'-]/g, "");

export function ComplaintWitnessSection({
  witnesses,
  onWitnessesChange,
  currentComplainantName = '',
  currentRespondentName = '',
  hideBottomAddButton = false,
}: ComplaintWitnessSectionProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [witnessOptionsMap, setWitnessOptionsMap] = useState<
    Record<string, SearchSelectOption[]>
  >({});

  const addWitness = () => {
    const newWitness: WitnessData = {
      id: `witness_${Date.now()}_${Math.random()}`,
      searchQuery: "",
      selectedResidentName: "",
      firstName: "",
      lastName: "",
      contactNumber: "",
      houseStreet: "",
      barangay: "",
      city: "",
      province: "",
      address: "",
      testimonyFile: null,
    };
    onWitnessesChange([...witnesses, newWitness]);
  };

  const removeWitness = (id: string) => {
    onWitnessesChange(witnesses.filter((w) => w.id !== id));
  };

  const updateWitness = (
    id: string,
    field: keyof WitnessData,
    value: unknown,
  ) => {
    onWitnessesChange(
      witnesses.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    );
  };

  const normalizeName = (first?: string, last?: string) =>
    `${first || ''} ${last || ''}`.trim().toLowerCase();

  // Dynamic Backend Search for Witness rows as user types
  useEffect(() => {
    witnesses.forEach((witness) => {
      const query = (witness.searchQuery || "").trim();
      const otherWitnessNames = witnesses
        .filter((w) => w.id !== witness.id)
        .map((w) => normalizeName(w.firstName, w.lastName))
        .filter(Boolean);

      const timer = setTimeout(async () => {
        try {
          const residents = await residentService.searchActive(query);
          if (residents && Array.isArray(residents)) {
            const mapped: SearchSelectOption[] = residents
              .filter((r: ResidentSearchOption) => {
                const rName = normalizeName(r.firstName, r.lastName);
                if (currentComplainantName && rName === currentComplainantName.toLowerCase()) return false;
                if (currentRespondentName && rName === currentRespondentName.toLowerCase()) return false;
                if (otherWitnessNames.includes(rName)) return false;
                return true;
              })
              .map((r: ResidentSearchOption) => ({
                id: String(r.id),
                label:
                  r.fullName ||
                  [r.firstName, r.lastName].filter(Boolean).join(" ") ||
                  `Resident #${r.id}`,
                description: `${r.contactNumber || "No contact"} • ${r.completeAddress || "Address unavailable"}`,
                data: r,
              }));
            setWitnessOptionsMap((prev) => ({ ...prev, [witness.id]: mapped }));
          }
        } catch {
          // Fail silently
        }
      }, 150);

      return () => clearTimeout(timer);
    });
  }, [witnesses, currentComplainantName, currentRespondentName]);

  const handleSelectResidentOption = (
    witnessId: string,
    option: SearchSelectOption,
  ) => {
    const rData = option.data as ResidentSearchOption | undefined;
    if (rData) {
      onWitnessesChange(
        witnesses.map((w) => {
          if (w.id !== witnessId) return w;
          return {
            ...w,
            searchQuery: rData.fullName || option.label,
            selectedResidentName: rData.fullName || option.label,
            firstName: rData.firstName || option.label.split(" ")[0] || "",
            lastName:
              rData.lastName ||
              option.label.split(" ").slice(1).join(" ") ||
              "",
            contactNumber: rData.contactNumber || "",
            houseStreet: rData.completeAddress
              ? rData.completeAddress.split(",")[0]
              : w.houseStreet,
            barangay: "",
            city: "",
            province: "",
            address: rData.completeAddress || w.address,
          };
        }),
      );
    } else {
      const [first, ...lastParts] = option.label.split(" ");
      const parts = option.description?.split("•") || [];
      onWitnessesChange(
        witnesses.map((w) => {
          if (w.id !== witnessId) return w;
          return {
            ...w,
            searchQuery: option.label,
            selectedResidentName: option.label,
            firstName: first || "",
            lastName: lastParts.join(" ") || "",
            contactNumber:
              parts[0]?.trim() && parts[0].trim() !== "No contact"
                ? parts[0].trim()
                : "",
            houseStreet: "",
            barangay: "",
            city: "",
            province: "",
            address: "",
          };
        }),
      );
    }
  };


  return (
    <div className="space-y-6">
      {witnesses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-6 text-center space-y-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              No witness added yet
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Add a witness only when needed. Search is manual and will not
              prefill until you type.
            </p>
          </div>
          <button
            type="button"
            onClick={addWitness}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Plus size={16} /> Add First Witness
          </button>
        </div>
      ) : (
        witnesses.map((witness, index) => (
          <div
            key={witness.id}
            className="p-5 sm:p-6 bg-slate-50/50 rounded-2xl border border-slate-200/80 space-y-4"
          >
            {/* Witness Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                WITNESS {index + 1}
              </h4>
              <button
                type="button"
                onClick={() => removeWitness(witness.id)}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={14} /> Remove
              </button>
            </div>

            {/* Search Witness using SearchSelect connected to live backend API */}
            <SearchSelect
              label="Search Witness (Auto-fill)"
              options={witnessOptionsMap[witness.id] || []}
              value={witness.searchQuery || ""}
              onChange={(val) => updateWitness(witness.id, "searchQuery", val)}
              onSelect={(opt) => handleSelectResidentOption(witness.id, opt)}
              placeholder="Type name to search active resident..."
            />



            {/* 3 Columns Name & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {(witness.firstName || "").length}/50
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  value={witness.firstName}
                  onChange={(e) =>
                    updateWitness(witness.id, "firstName", sanitizeName(e.target.value))
                  }
                  placeholder="First Name"
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {(witness.lastName || "").length}/50
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  value={witness.lastName}
                  onChange={(e) =>
                    updateWitness(witness.id, "lastName", sanitizeName(e.target.value))
                  }
                  placeholder="Last Name"
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {(witness.contactNumber || "").length}/11
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={11}
                  value={witness.contactNumber}
                  onChange={(e) =>
                    updateWitness(
                      witness.id,
                      "contactNumber",
                      e.target.value.replace(/\D/g, ""),
                    )
                  }
                  placeholder="09123456789"
                  className={inputCls}
                />
              </div>
            </div>

            <PhAddressSelector
              value={{
                houseStreet: witness.houseStreet || "",
                barangayName: witness.barangay || "",
                cityName: witness.city || "",
                provinceName: witness.province || "",
              }}
              onChange={(val: PhAddressValue) => {
                updateWitness(witness.id, "houseStreet", val.houseStreet);
                updateWitness(witness.id, "barangay", val.barangayName);
                updateWitness(witness.id, "city", val.cityName);
                updateWitness(witness.id, "province", val.provinceName);
                updateWitness(
                  witness.id,
                  "address",
                  `${val.houseStreet ? val.houseStreet + ", " : ""}Brgy. ${val.barangayName}, ${val.cityName}, ${val.provinceName}`,
                );
              }}
            />

            {/* Optional Testimony File Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Witness Testimony / Sworn Statement (Optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={(el) => {
                    fileInputRefs.current[witness.id] = el;
                  }}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    updateWitness(witness.id, "testimonyFile", file);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[witness.id]?.click()}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                >
                  <UploadCloud size={15} /> Select File
                </button>
                {witness.testimonyFile ? (
                  <span className="text-xs text-blue-600 font-medium">
                    {witness.testimonyFile.name} (
                    {(witness.testimonyFile.size / 1024).toFixed(1)} KB)
                  </span>
                ) : witness.testimonyFileName || (witness as any).statementFileName || (witness as any).fileName ? (
                  <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    {witness.testimonyFileName || (witness as any).statementFileName || (witness as any).fileName}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    PDF, DOCX, or Image (Max 10MB)
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Add Another Witness Button (Only visible if not hidden and at least one witness exists) */}
      {!hideBottomAddButton && witnesses.length > 0 && (
        <button
          type="button"
          onClick={addWitness}
          className="w-full py-3 px-4 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/30 hover:bg-blue-50/70 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> Add Another Witness
        </button>
      )}
    </div>
  );
}
