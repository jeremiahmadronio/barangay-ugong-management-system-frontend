import React, { useState, useEffect } from "react";
import { FileCheck, AlertCircle, Plus } from "lucide-react";
import { ComplaintFormSection } from "./ComplaintFormSection";
import { ComplaintEvidenceGrid } from "./ComplaintEvidenceGrid";
import { ComplaintFileUpload } from "./ComplaintFileUpload";
import { ComplaintIncidentFields } from "./ComplaintIncidentFields";
import { CertificationConsentCard } from "./CertificationConsentCard";
import { ComplaintWitnessSection } from "./ComplaintWitnessSection";
import { RelationshipInputField } from "./RelationshipInputField";
import { NatureOfEntrySection } from "./NatureOfEntrySection";
import {
  SearchSelect,
  type SearchSelectOption,
} from "@/components/ui/SearchSelect";
import {
  PhAddressSelector,
  type PhAddressValue,
} from "@/components/ui/PhAddressSelector";
import type { ComplaintFormData, WitnessData } from "./types";
import { officersApi, type OfficerOption } from "@/api/modules/officers.api";
import {
  residentsApi,
  type ResidentSearchOption,
} from "@/api/modules/residents.api";

const DEFAULT_OFFICERS: OfficerOption[] = [
  {
    id: 1,
    personId: 101,
    name: "PB. Carlos Santos",
    position: "Punong Barangay",
    departmentName: "Barangay Office",
  },
  {
    id: 3,
    personId: 103,
    name: "Kag. Maria Cruz",
    position: "Kagawad (VAWC Desk)",
    departmentName: "VAWC Desk",
  },
  {
    id: 4,
    personId: 104,
    name: "Kag. Fernando Lopez",
    position: "Kagawad (Lupon Member)",
    departmentName: "Lupong Tagapamayapa",
  },
  {
    id: 5,
    personId: 105,
    name: "Lupon Sec. Elena Gomez",
    position: "Lupon Secretary",
    departmentName: "Lupong Tagapamayapa",
  },
];

interface FormalComplaintFormProps {
  initialData?: Partial<ComplaintFormData>;
  onSubmit?: (data: ComplaintFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
  className?: string;
  activeMode?: 'FORMAL_COMPLAINT' | 'FOR_THE_RECORD';
  onModeChange?: (mode: 'FORMAL_COMPLAINT' | 'FOR_THE_RECORD') => void;
}

const inputCls =
  "w-full px-3.5 py-2.5 text-xs border border-slate-200 focus:border-blue-400 rounded-xl outline-none focus:outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white";

const sanitizeName = (val: string) => val.replace(/[^a-zA-ZñÑ\s.'-]/g, "");
const NAME_REGEX = /^[a-zA-ZñÑ\s.'-]+$/;

const getTodayFormattedDate = () => {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export function FormalComplaintForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
  className = "",
  activeMode = "FORMAL_COMPLAINT",
  onModeChange,
}: FormalComplaintFormProps) {
  const [formData, setFormData] = useState<ComplaintFormData>({
    mode: "FORMAL_COMPLAINT",
    caseInfo: {
      caseNumber:
        initialData?.caseInfo?.caseNumber ||
        `2026-BLT-${String(Math.floor(1 + Math.random() * 999)).padStart(3, "0")}`,
      dateFiled: initialData?.caseInfo?.dateFiled || getTodayFormattedDate(),
      timeFiled:
        initialData?.caseInfo?.timeFiled ||
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      receivingOfficer:
        initialData?.caseInfo?.receivingOfficer || "Hannah Masangkay",
      assignedOfficer: initialData?.caseInfo?.assignedOfficer || "",
    },
    complainant: {
      searchQuery: "",
      lastName: initialData?.complainant?.lastName || "",
      firstName: initialData?.complainant?.firstName || "",
      middleName: initialData?.complainant?.middleName || "",
      contactNumber: initialData?.complainant?.contactNumber || "",
      age: initialData?.complainant?.age || "",
      gender: initialData?.complainant?.gender || "",
      civilStatus: initialData?.complainant?.civilStatus || "",
      email: initialData?.complainant?.email || "",
      houseStreet: initialData?.complainant?.houseStreet || "",
      barangay: initialData?.complainant?.barangay || "Ugong",
      city: initialData?.complainant?.city || "Valenzuela City",
      province: initialData?.complainant?.province || "NCR, Third District",
      address: initialData?.complainant?.address || "",
    },
    respondent: {
      searchQuery: "",
      lastName: initialData?.respondent?.lastName || "",
      firstName: initialData?.respondent?.firstName || "",
      middleName: initialData?.respondent?.middleName || "",
      age: initialData?.respondent?.age || "",
      gender: initialData?.respondent?.gender || "",
      contactNumber: initialData?.respondent?.contactNumber || "",
      houseStreet: initialData?.respondent?.houseStreet || "",
      barangay: initialData?.respondent?.barangay || "Ugong",
      city: initialData?.respondent?.city || "Valenzuela City",
      province: initialData?.respondent?.province || "NCR, Third District",
      address: initialData?.respondent?.address || "",
      relationshipToComplainant:
        initialData?.respondent?.relationshipToComplainant || "",
      currentlyLivingWithComplainant:
        initialData?.respondent?.currentlyLivingWithComplainant || "",
    },
    incident: {
      natureOfComplaint: initialData?.incident?.natureOfComplaint || "",
      dateOfIncident: initialData?.incident?.dateOfIncident || "",
      timeOfIncident: initialData?.incident?.timeOfIncident || "",
      placeOfIncident: initialData?.incident?.placeOfIncident || "",
      frequencyOfIncident: initialData?.incident?.frequencyOfIncident || "",
      descriptionOfInjuries: initialData?.incident?.descriptionOfInjuries || "",
    },
    narrative: {
      file: initialData?.narrative?.file || null,
      fileName: initialData?.narrative?.fileName || "",
      fileSize: initialData?.narrative?.fileSize || "",
      statementText: initialData?.narrative?.statementText || "",
    },
    selectedEvidenceIds: initialData?.selectedEvidenceIds || [],
    evidenceFiles: initialData?.evidenceFiles || {},
    otherEvidence: initialData?.otherEvidence || "",
    witnesses: initialData?.witnesses || [],
    isCertified: initialData?.isCertified ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [complainantResidentOptions, setComplainantResidentOptions] = useState<
    SearchSelectOption[]
  >([]);
  const [respondentResidentOptions, setRespondentResidentOptions] = useState<
    SearchSelectOption[]
  >([]);
  const [officerOptions, setOfficerOptions] =
    useState<OfficerOption[]>(DEFAULT_OFFICERS);

  // Helper to normalize full name for comparison
  const normalizeName = (first?: string, last?: string) =>
    `${first || ''} ${last || ''}`.trim().toLowerCase();

  const currentComplainantName = normalizeName(formData.complainant.firstName, formData.complainant.lastName);
  const currentRespondentName = normalizeName(formData.respondent.firstName, formData.respondent.lastName);
  const currentWitnessNames = (formData.witnesses || []).map((w) => normalizeName(w.firstName, w.lastName));

  // Sync initialData changes when editing or when async data loads
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        caseInfo: {
          caseNumber: initialData.caseInfo?.caseNumber || prev.caseInfo.caseNumber,
          dateFiled: initialData.caseInfo?.dateFiled || prev.caseInfo.dateFiled,
          timeFiled: initialData.caseInfo?.timeFiled || prev.caseInfo.timeFiled,
          receivingOfficer: initialData.caseInfo?.receivingOfficer || prev.caseInfo.receivingOfficer,
          assignedOfficer: initialData.caseInfo?.assignedOfficer || prev.caseInfo.assignedOfficer,
          assignedOfficerId: initialData.caseInfo?.assignedOfficerId ?? prev.caseInfo.assignedOfficerId,
        },
        complainant: {
          ...prev.complainant,
          ...(initialData.complainant || {}),
          barangay: initialData.complainant?.barangay || "Ugong",
          city: initialData.complainant?.city || "Valenzuela City",
          province: initialData.complainant?.province || "NCR, Third District",
        },
        respondent: {
          ...prev.respondent,
          ...(initialData.respondent || {}),
          barangay: initialData.respondent?.barangay || "Ugong",
          city: initialData.respondent?.city || "Valenzuela City",
          province: initialData.respondent?.province || "NCR, Third District",
        },
        incident: { ...prev.incident, ...(initialData.incident || {}) },
        narrative: { ...prev.narrative, ...(initialData.narrative || {}) },
        selectedEvidenceIds: initialData.selectedEvidenceIds || prev.selectedEvidenceIds || [],
        evidenceFiles: initialData.evidenceFiles || prev.evidenceFiles || {},
        otherEvidence: initialData.otherEvidence || prev.otherEvidence || "",
        witnesses: initialData.witnesses || prev.witnesses || [],
        isCertified: initialData.isCertified ?? prev.isCertified,
      }));
    }
  }, [initialData]);

  // Fetch active officers on mount (Filter for OVERALL and BLOTTER departments only)
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const officers = await officersApi.getActiveOfficers();
        if (officers && officers.length > 0) {
          const blotterOfficers = officers.filter((o) => {
            const dept = (o.departmentName || '').toUpperCase();
            return dept.includes('OVERALL') || dept.includes('BLOTTER') || dept.includes('BARANGAY OFFICE') || dept === '';
          });
          setOfficerOptions(blotterOfficers);
        }
      } catch {
        // Fallback options
      }
    };
    fetchOfficers();
  }, []);

  // Dynamic Backend Search API Call for Complainant as user types (Excludes Respondent & Witnesses)
  useEffect(() => {
    const query = (formData.complainant.searchQuery || "").trim();
    const timer = setTimeout(async () => {
      try {
        const residents = await residentsApi.searchActive(query);
        if (residents && Array.isArray(residents)) {
          const mapped: SearchSelectOption[] = residents
            .filter((r: ResidentSearchOption) => {
              const rName = normalizeName(r.firstName, r.lastName);
              if (rName && rName === currentRespondentName) return false;
              if (rName && currentWitnessNames.includes(rName)) return false;
              return true;
            })
            .map((r: ResidentSearchOption) => ({
              id: String(r.id),
              label: r.fullName || "Resident",
              description: `${r.contactNumber || "No contact"} • ${r.completeAddress || r.barangayIdNumber || "Brgy. Ugong"}`,
              data: r,
            }));
          setComplainantResidentOptions(mapped);
        }
      } catch {
        // Fail silently
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [formData.complainant.searchQuery, currentRespondentName, currentWitnessNames.join(",")]);

  // Dynamic Backend Search API Call for Respondent as user types (Excludes Complainant & Witnesses)
  useEffect(() => {
    const query = (formData.respondent.searchQuery || "").trim();
    const timer = setTimeout(async () => {
      try {
        const residents = await residentsApi.searchActive(query);
        if (residents && Array.isArray(residents)) {
          const mapped: SearchSelectOption[] = residents
            .filter((r: ResidentSearchOption) => {
              const rName = normalizeName(r.firstName, r.lastName);
              if (rName && rName === currentComplainantName) return false;
              if (rName && currentWitnessNames.includes(rName)) return false;
              return true;
            })
            .map((r: ResidentSearchOption) => ({
              id: String(r.id),
              label: r.fullName || "Resident",
              description: `${r.contactNumber || "No contact"} • ${r.completeAddress || r.barangayIdNumber || "Brgy. Ugong"}`,
              data: r,
            }));
          setRespondentResidentOptions(mapped);
        }
      } catch {
        // Fail silently
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [formData.respondent.searchQuery, currentComplainantName, currentWitnessNames.join(",")]);


  const updateCaseInfo = (field: string, value: string) => {
    setFormData((prev: ComplaintFormData) => ({
      ...prev,
      caseInfo: { ...prev.caseInfo, [field]: value },
    }));
  };

  const updateComplainant = (field: string, value: string | number) => {
    setFormData((prev: ComplaintFormData) => ({
      ...prev,
      complainant: { ...prev.complainant, [field]: value },
    }));
  };

  const updateRespondent = (field: string, value: string) => {
    setFormData((prev: ComplaintFormData) => ({
      ...prev,
      respondent: { ...prev.respondent, [field]: value },
    }));
  };

  const updateIncident = (field: string, value: string) => {
    setFormData((prev: ComplaintFormData) => ({
      ...prev,
      incident: { ...prev.incident, [field]: value },
    }));
  };

  const handleSelectComplainant = (opt: SearchSelectOption) => {
    const rData = opt.data as ResidentSearchOption | undefined;
    if (rData) {
      setFormData((prev: ComplaintFormData) => ({
        ...prev,
        complainant: {
          ...prev.complainant,
          searchQuery: rData.fullName || opt.label,
          firstName: rData.firstName || opt.label.split(" ")[0] || "",
          lastName:
            rData.lastName || opt.label.split(" ").slice(1).join(" ") || "",
          middleName: rData.middleName || "",
          contactNumber: rData.contactNumber || "",
          age: rData.age ? String(rData.age) : prev.complainant.age,
          gender: rData.gender || prev.complainant.gender,
          civilStatus: rData.civilStatus || prev.complainant.civilStatus,
          email: rData.email || prev.complainant.email,
          houseStreet: rData.completeAddress
            ? rData.completeAddress.split(",")[0]
            : prev.complainant.houseStreet,
          barangay: "Ugong",
          city: "Valenzuela City",
          province: "NCR, Third District",
          address: rData.completeAddress || prev.complainant.address,
        },
      }));
    } else {
      const [first, ...lastParts] = opt.label.split(" ");
      const parts = opt.description?.split("•") || [];
      setFormData((prev: ComplaintFormData) => ({
        ...prev,
        complainant: {
          ...prev.complainant,
          searchQuery: opt.label,
          firstName: first || "",
          lastName: lastParts.join(" ") || "",
          contactNumber: parts[0]?.trim() || "",
          houseStreet: "Purok 8",
          barangay: "Ugong",
          city: "Valenzuela City",
          province: "NCR, Third District",
          address: parts[1]?.trim() || "",
        },
      }));
    }
  };

  const handleSelectRespondent = (opt: SearchSelectOption) => {
    const rData = opt.data as ResidentSearchOption | undefined;
    if (rData) {
      setFormData((prev: ComplaintFormData) => ({
        ...prev,
        respondent: {
          ...prev.respondent,
          searchQuery: rData.fullName || opt.label,
          firstName: rData.firstName || opt.label.split(" ")[0] || "",
          lastName:
            rData.lastName || opt.label.split(" ").slice(1).join(" ") || "",
          middleName: rData.middleName || "",
          contactNumber: rData.contactNumber || "",
          age: rData.age ? String(rData.age) : prev.respondent.age,
          gender: rData.gender || prev.respondent.gender,
          houseStreet: rData.completeAddress
            ? rData.completeAddress.split(",")[0]
            : prev.respondent.houseStreet,
          barangay: "Ugong",
          city: "Valenzuela City",
          province: "NCR, Third District",
          address: rData.completeAddress || prev.respondent.address,
        },
      }));
    } else {
      const [first, ...lastParts] = opt.label.split(" ");
      const parts = opt.description?.split("•") || [];
      setFormData((prev: ComplaintFormData) => ({
        ...prev,
        respondent: {
          ...prev.respondent,
          searchQuery: opt.label,
          firstName: first || "",
          lastName: lastParts.join(" ") || "",
          contactNumber: parts[0]?.trim() || "",
          houseStreet: "Purok 8",
          barangay: "Ugong",
          city: "Valenzuela City",
          province: "NCR, Third District",
          address: parts[1]?.trim() || "",
        },
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.caseInfo.assignedOfficer) {
      newErrors.assignedOfficer = "Assigned Officer is required";
    }

    // Complainant Validations
    if (!formData.complainant.lastName.trim()) {
      newErrors.complainantLastName = "Complainant Last Name is required";
    } else if (formData.complainant.lastName.trim().length < 2) {
      newErrors.complainantLastName = "Minimum 2 characters required";
    } else if (formData.complainant.lastName.trim().length > 50) {
      newErrors.complainantLastName = "Maximum 50 characters allowed";
    } else if (!NAME_REGEX.test(formData.complainant.lastName.trim())) {
      newErrors.complainantLastName = "Name cannot contain numbers or special characters";
    }

    if (!formData.complainant.firstName.trim()) {
      newErrors.complainantFirstName = "Complainant First Name is required";
    } else if (formData.complainant.firstName.trim().length < 2) {
      newErrors.complainantFirstName = "Minimum 2 characters required";
    } else if (formData.complainant.firstName.trim().length > 50) {
      newErrors.complainantFirstName = "Maximum 50 characters allowed";
    } else if (!NAME_REGEX.test(formData.complainant.firstName.trim())) {
      newErrors.complainantFirstName = "Name cannot contain numbers or special characters";
    }

    if (formData.complainant.middleName && formData.complainant.middleName.trim()) {
      if (formData.complainant.middleName.trim().length > 50) {
        newErrors.complainantMiddleName = "Maximum 50 characters allowed";
      } else if (!NAME_REGEX.test(formData.complainant.middleName.trim())) {
        newErrors.complainantMiddleName = "Name cannot contain numbers or special characters";
      }
    }

    if (!formData.complainant.age) {
      newErrors.complainantAge = "Age is required";
    } else if (
      Number(formData.complainant.age) < 1 ||
      Number(formData.complainant.age) > 120
    ) {
      newErrors.complainantAge = "Valid age between 1 and 120 required";
    }

    if (!formData.complainant.gender)
      newErrors.complainantGender = "Gender is required";
    if (!formData.complainant.civilStatus)
      newErrors.complainantCivilStatus = "Civil Status is required";

    // Respondent Validations
    if (!formData.respondent.lastName.trim()) {
      newErrors.respondentLastName = "Respondent Last Name is required";
    } else if (formData.respondent.lastName.trim().length < 2) {
      newErrors.respondentLastName = "Minimum 2 characters required";
    } else if (formData.respondent.lastName.trim().length > 50) {
      newErrors.respondentLastName = "Maximum 50 characters allowed";
    } else if (!NAME_REGEX.test(formData.respondent.lastName.trim())) {
      newErrors.respondentLastName = "Name cannot contain numbers or special characters";
    }

    if (!formData.respondent.firstName.trim()) {
      newErrors.respondentFirstName = "Respondent First Name is required";
    } else if (formData.respondent.firstName.trim().length < 2) {
      newErrors.respondentFirstName = "Minimum 2 characters required";
    } else if (formData.respondent.firstName.trim().length > 50) {
      newErrors.respondentFirstName = "Maximum 50 characters allowed";
    } else if (!NAME_REGEX.test(formData.respondent.firstName.trim())) {
      newErrors.respondentFirstName = "Name cannot contain numbers or special characters";
    }

    if (formData.respondent.middleName && formData.respondent.middleName.trim()) {
      if (formData.respondent.middleName.trim().length > 50) {
        newErrors.respondentMiddleName = "Maximum 50 characters allowed";
      } else if (!NAME_REGEX.test(formData.respondent.middleName.trim())) {
        newErrors.respondentMiddleName = "Name cannot contain numbers or special characters";
      }
    }

    if (!formData.respondent.relationshipToComplainant) {
      newErrors.relationshipToComplainant =
        "Relationship to Complainant is required";
    }

    if (!formData.respondent.currentlyLivingWithComplainant) {
      newErrors.currentlyLivingWithComplainant =
        "Please specify if currently living with Complainant";
    }

    // Incident Details Validations
    if (!formData.incident.natureOfComplaint) {
      newErrors.natureOfComplaint = "Nature of Complaint is required";
    }

    if (!formData.incident.dateOfIncident) {
      newErrors.dateOfIncident = "Date of Incident is required";
    }

    if (!formData.incident.placeOfIncident.trim()) {
      newErrors.placeOfIncident = "Place of Incident is required";
    } else if (formData.incident.placeOfIncident.trim().length > 100) {
      newErrors.placeOfIncident = "Maximum 100 characters allowed";
    }

    if (!formData.incident.frequencyOfIncident) {
      newErrors.frequencyOfIncident = "Frequency of Incident is required";
    }

    // Statement / Narrative Validation
    const textStatement = formData.narrative?.statementText || "";
    if (!textStatement.trim() && !formData.narrative?.file) {
      newErrors.narrativeStatement =
        "Please provide either a Statement Text or upload a Statement File";
    }

    if (!formData.isCertified) {
      newErrors.isCertified =
        "You must certify that all information provided is true and correct";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit?.(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Case Details */}
      <ComplaintFormSection title="Case Overview & Assignment">
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                Case / Blotter Number
              </p>
              <p className="text-xs sm:text-sm font-bold text-blue-600 mt-1">
                {formData.caseInfo.caseNumber}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                (auto-generated)
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                Date Filed
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
                {formData.caseInfo.dateFiled}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">(today)</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                Time Filed
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
                {formData.caseInfo.timeFiled}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">(now)</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                Receiving Officer
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
                {formData.caseInfo.receivingOfficer}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">(logged in)</p>
            </div>
          </div>

          {/* Nature of Entry Switcher (Placed directly below overview grid) */}
          <NatureOfEntrySection
            activeMode={activeMode}
            onModeChange={onModeChange}
          />

          <div className="max-w-md">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Officer <span className="text-red-500">*</span>
            </label>
            <select
              value={(() => {
                if (formData.caseInfo.assignedOfficerId) {
                  return String(formData.caseInfo.assignedOfficerId);
                }
                if (formData.caseInfo.assignedOfficer) {
                  const match = officerOptions.find((o) =>
                    formData.caseInfo.assignedOfficer.toLowerCase().includes(o.name.toLowerCase()) ||
                    o.name.toLowerCase().includes(formData.caseInfo.assignedOfficer.toLowerCase())
                  );
                  if (match) return String(match.id);
                }
                return "";
              })()}
              onChange={(e) => {
                const selectedId = Number(e.target.value);
                const selectedOpt = officerOptions.find((o) => o.id === selectedId);
                setFormData((prev: ComplaintFormData) => ({
                  ...prev,
                  caseInfo: {
                    ...prev.caseInfo,
                    assignedOfficerId: selectedId || undefined,
                    assignedOfficer: selectedOpt ? `${selectedOpt.name} (${selectedOpt.position})` : "",
                  },
                }));
              }}
              className={inputCls}
            >
              <option value="">Select Officer...</option>
              {officerOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} - {o.position} ({o.departmentName || "Barangay Office"})
                </option>
              ))}
            </select>

            {errors.assignedOfficer && (
              <p className="text-xs text-red-500 mt-1">
                {errors.assignedOfficer}
              </p>
            )}
          </div>
        </div>
      </ComplaintFormSection>

      {/* Complainant Information */}
      <ComplaintFormSection title="Complainant Information">
        <div className="space-y-4">
          <SearchSelect
            label="Search Resident (Auto-fill)"
            options={complainantResidentOptions}
            value={formData.complainant.searchQuery || ""}
            onChange={(val) => updateComplainant("searchQuery", val)}
            onSearchQueryChange={(val) => updateComplainant("searchQuery", val)}
            onSelect={handleSelectComplainant}
            placeholder="Type name to search active resident..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {(formData.complainant.lastName || "").length}/50
                </span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={formData.complainant.lastName}
                onChange={(e) => updateComplainant("lastName", sanitizeName(e.target.value))}
                placeholder="e.g. Dela Cruz"
                className={inputCls}
              />
              {errors.complainantLastName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.complainantLastName}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {(formData.complainant.firstName || "").length}/50
                </span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={formData.complainant.firstName}
                onChange={(e) => updateComplainant("firstName", sanitizeName(e.target.value))}
                placeholder="e.g. Juan"
                className={inputCls}
              />
              {errors.complainantFirstName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.complainantFirstName}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Middle Name{" "}
                  <span className="text-slate-400 font-normal text-[11px] ml-1">
                    (Optional)
                  </span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {(formData.complainant.middleName || "").length}/50
                </span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={formData.complainant.middleName}
                onChange={(e) =>
                  updateComplainant("middleName", sanitizeName(e.target.value))
                }
                placeholder="e.g. Santos"
                className={inputCls}
              />
              {errors.complainantMiddleName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.complainantMiddleName}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Contact Number{" "}
                  <span className="text-slate-400 font-normal text-[11px] ml-1">
                    (Optional)
                  </span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {(formData.complainant.contactNumber || "").length}/11
                </span>
              </div>
              <input
                type="text"
                maxLength={11}
                value={formData.complainant.contactNumber}
                onChange={(e) =>
                  updateComplainant("contactNumber", e.target.value.replace(/\D/g, ""))
                }
                placeholder="09123456789"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.complainant.age}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                  updateComplainant("age", val);
                }}
                placeholder="e.g. 35"
                className={inputCls}
              />
              {errors.complainantAge && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.complainantAge}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.complainant.gender}
                onChange={(e) => updateComplainant("gender", e.target.value)}
                className={inputCls}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.complainantGender && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.complainantGender}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Civil Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.complainant.civilStatus}
                onChange={(e) =>
                  updateComplainant("civilStatus", e.target.value)
                }
                className={inputCls}
              >
                <option value="">Select Civil Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
              {errors.complainantCivilStatus && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.complainantCivilStatus}
                </p>
              )}
            </div>
          </div>

          <PhAddressSelector
            value={{
              houseStreet: formData.complainant.houseStreet || "",
              barangayName: formData.complainant.barangay || "Ugong",
              cityName: formData.complainant.city || "Valenzuela City",
              provinceName:
                formData.complainant.province || "NCR, Third District",
            }}
            onChange={(val: PhAddressValue) => {
              setFormData((prev: ComplaintFormData) => ({
                ...prev,
                complainant: {
                  ...prev.complainant,
                  houseStreet: val.houseStreet,
                  barangay: val.barangayName,
                  city: val.cityName,
                  province: val.provinceName,
                  address: `${val.houseStreet ? val.houseStreet + ", " : ""}Brgy. ${val.barangayName}, ${val.cityName}, ${val.provinceName}`,
                },
              }));
            }}
          />
        </div>
      </ComplaintFormSection>

      {/* Respondent Information */}
      <ComplaintFormSection title="Respondent Information">
        <div className="space-y-4">
          <SearchSelect
            label="Search Respondent (Auto-fill)"
            options={respondentResidentOptions}
            value={formData.respondent.searchQuery || ""}
            onChange={(val) => updateRespondent("searchQuery", val)}
            onSearchQueryChange={(val) => updateRespondent("searchQuery", val)}
            onSelect={handleSelectRespondent}
            placeholder="Type name to search active resident..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {(formData.respondent.lastName || "").length}/50
                </span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={formData.respondent.lastName}
                onChange={(e) => updateRespondent("lastName", sanitizeName(e.target.value))}
                placeholder="e.g. Santos"
                className={inputCls}
              />
              {errors.respondentLastName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.respondentLastName}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {(formData.respondent.firstName || "").length}/50
                </span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={formData.respondent.firstName}
                onChange={(e) => updateRespondent("firstName", sanitizeName(e.target.value))}
                placeholder="e.g. Pedro"
                className={inputCls}
              />
              {errors.respondentFirstName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.respondentFirstName}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Middle Name{" "}
                  <span className="text-slate-400 font-normal text-[11px] ml-1">
                    (Optional)
                  </span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {(formData.respondent.middleName || "").length}/50
                </span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={formData.respondent.middleName}
                onChange={(e) => updateRespondent("middleName", sanitizeName(e.target.value))}
                placeholder="e.g. Reyes"
                className={inputCls}
              />
              {errors.respondentMiddleName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.respondentMiddleName}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Contact Number{" "}
                  <span className="text-slate-400 font-normal text-[11px] ml-1">
                    (Optional)
                  </span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {(formData.respondent.contactNumber || "").length}/11
                </span>
              </div>
              <input
                type="text"
                maxLength={11}
                value={formData.respondent.contactNumber}
                onChange={(e) =>
                  updateRespondent("contactNumber", e.target.value.replace(/\D/g, ""))
                }
                placeholder="09123456789"
                className={inputCls}
              />
            </div>

            <RelationshipInputField
              label="Relationship to Complainant"
              value={formData.respondent.relationshipToComplainant}
              onChange={(value) =>
                updateRespondent("relationshipToComplainant", value)
              }
              required
              error={errors.relationshipToComplainant}
              placeholder="e.g. Neighbor, Spouse, Relative"
              helperText="Sample: Neighbor, Spouse / Partner, Relative / Family Member"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Currently Living with Complainant?{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.respondent.currentlyLivingWithComplainant}
                onChange={(e) =>
                  updateRespondent(
                    "currentlyLivingWithComplainant",
                    e.target.value,
                  )
                }
                className={inputCls}
              >
                <option value="">Select Option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.currentlyLivingWithComplainant && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.currentlyLivingWithComplainant}
                </p>
              )}
            </div>
          </div>

          <PhAddressSelector
            value={{
              houseStreet: formData.respondent.houseStreet || "",
              barangayName: formData.respondent.barangay || "Ugong",
              cityName: formData.respondent.city || "Valenzuela City",
              provinceName:
                formData.respondent.province || "NCR, Third District",
            }}
            onChange={(val: PhAddressValue) => {
              setFormData((prev: ComplaintFormData) => ({
                ...prev,
                respondent: {
                  ...prev.respondent,
                  houseStreet: val.houseStreet,
                  barangay: val.barangayName,
                  city: val.cityName,
                  province: val.provinceName,
                  address: `${val.houseStreet ? val.houseStreet + ", " : ""}Brgy. ${val.barangayName}, ${val.cityName}, ${val.provinceName}`,
                },
              }));
            }}
          />
        </div>
      </ComplaintFormSection>

      {/* Incident Details */}
      <ComplaintFormSection title="Incident Details">
        <ComplaintIncidentFields
          values={formData.incident}
          errors={errors}
          onChange={updateIncident}
          natureLabel="Nature of Complaint"
          naturePlaceholder="Select Nature of Complaint"
          natureOptions={[
            { value: "Physical Injury", label: "Physical Injury" },
            {
              value: "Slander / Oral Defamation",
              label: "Slander / Oral Defamation",
            },
            { value: "Theft", label: "Theft" },
            { value: "Threats", label: "Threats" },
            { value: "Trespassing", label: "Trespassing" },
            { value: "Grave Coercion", label: "Grave Coercion" },
            {
              value: "Debt / Financial Dispute",
              label: "Debt / Financial Dispute",
            },
            { value: "Unjust Vexation", label: "Unjust Vexation" },
            {
              value: "Boundary / Land Dispute",
              label: "Boundary / Land Dispute",
            },
            {
              value: "Family / Relational Dispute",
              label: "Family / Relational Dispute",
            },
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
          ]}
          showFrequency
          frequencyOptions={[
            { value: "First Time", label: "First Time Incident" },
            { value: "Repeated (2-3 times)", label: "Repeated (2-3 times)" },
            {
              value: "Chronic / Ongoing Issue",
              label: "Chronic / Ongoing Issue",
            },
          ]}
          showDescription
          descriptionPlaceholder="Describe physical injuries, property damages, or financial loss..."
          placePlaceholder="e.g. In front of House #45, Purok 3"
        />
      </ComplaintFormSection>

      {/* Narrative Statement */}
      <ComplaintFormSection title="Narrative Statement of Complaint">
        <div className="space-y-4">
          <ComplaintFileUpload
            file={formData.narrative?.file}
            fileName={formData.narrative?.fileName}
            fileSize={formData.narrative?.fileSize}
            onFileSelect={(file) =>
              setFormData((prev: ComplaintFormData) => ({
                ...prev,
                narrative: {
                  ...prev.narrative,
                  file,
                  fileName: file ? file.name : "",
                  fileSize: file ? `${(file.size / 1024).toFixed(1)} KB` : "",
                },
              }))
            }
            statementText={formData.narrative?.statementText || ""}
            onStatementTextChange={(text) =>
              setFormData((prev: ComplaintFormData) => ({
                ...prev,
                narrative: { ...prev.narrative, statementText: text },
              }))
            }
          />
          {errors.narrativeStatement && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.narrativeStatement}
            </p>
          )}
        </div>
      </ComplaintFormSection>

      {/* Evidence Section */}
      <ComplaintFormSection title="Attached Evidence (Optional)">
        <ComplaintEvidenceGrid
          selectedIds={formData.selectedEvidenceIds}
          evidenceFiles={formData.evidenceFiles}
          otherText={formData.otherEvidence || ""}
          onChange={(selectedIds) =>
            setFormData((prev: ComplaintFormData) => ({
              ...prev,
              selectedEvidenceIds: selectedIds,
            }))
          }
          onFileUpload={(id, file) =>
            setFormData((prev: ComplaintFormData) => ({
              ...prev,
              evidenceFiles: { ...prev.evidenceFiles, [id]: file },
            }))
          }
          onOtherTextChange={(otherText) =>
            setFormData((prev: ComplaintFormData) => ({
              ...prev,
              otherEvidence: otherText,
            }))
          }
        />
      </ComplaintFormSection>

      <ComplaintFormSection title="Witness Information (Optional)">
        <ComplaintWitnessSection
          witnesses={formData.witnesses}
          onWitnessesChange={(witnesses: WitnessData[]) =>
            setFormData((prev: ComplaintFormData) => ({ ...prev, witnesses }))
          }
          currentComplainantName={`${formData.complainant.firstName || ''} ${formData.complainant.lastName || ''}`.trim()}
          currentRespondentName={`${formData.respondent.firstName || ''} ${formData.respondent.lastName || ''}`.trim()}
        />
      </ComplaintFormSection>

      {/* Certification Checkbox & Action Buttons */}
      <div className="pt-4 border-t border-slate-200 space-y-4">
        <CertificationConsentCard
          id="certify_formal"
          checked={formData.isCertified}
          onChange={(checked) =>
            setFormData((prev: ComplaintFormData) => ({
              ...prev,
              isCertified: checked,
            }))
          }
          title="Certification Under Oath"
          text="I hereby certify under oath that all information provided in this Formal Complaint is true, correct, and complete to the best of my knowledge and belief."
          error={errors.isCertified}
        />

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FileCheck size={16} />
            {isSubmitting
              ? (isEditing ? "Saving Changes..." : "Filing Complaint...")
              : (isEditing ? "Save Changes" : "Submit Formal Complaint")}
          </button>
        </div>
      </div>
    </form>
  );
}
