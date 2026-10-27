import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Save, AlertCircle, Link2, Check, X, Search, FileText, Loader2, Info } from "lucide-react";
import { ComplaintFormSection } from "./ComplaintFormSection";
import { ComplaintFileUpload } from "./ComplaintFileUpload";
import { ComplaintIncidentFields } from "./ComplaintIncidentFields";
import { ComplaintWitnessSection } from "./ComplaintWitnessSection";
import { CertificationConsentCard } from "./CertificationConsentCard";
import { NatureOfEntrySection } from "./NatureOfEntrySection";

import { RelationshipInputField } from "./RelationshipInputField";
import {
  SearchSelect,
  type SearchSelectOption,
} from "@/components/ui/SearchSelect";
import {
  PhAddressSelector,
  type PhAddressValue,
} from "@/components/ui/PhAddressSelector";
import type { ComplaintFormData, RespondentType, FtjsSearchItem } from "./types";
import { blotterApi } from "@/api/modules/blotter.api";
import { officersApi, type OfficerOption } from "@/api/modules/officers.api";
import {
  residentsApi,
  type ResidentSearchOption,
} from "@/api/modules/residents.api";


interface ForTheRecordFormProps {
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

export function ForTheRecordForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
  className = "",
  activeMode = "FOR_THE_RECORD",
  onModeChange,
}: ForTheRecordFormProps) {
  const initialRespType: RespondentType =
    initialData?.respondentType ||
    (initialData?.respondent?.relationshipToComplainant === "None (No Respondent)"
      ? "NO_RESPONDENT"
      : initialData?.respondent?.lastName?.trim() || initialData?.respondent?.firstName?.trim()
      ? "KNOWN"
      : "KNOWN");

  const [respondentType, setRespondentType] = useState<RespondentType>(initialRespType);
  const [formData, setFormData] = useState<ComplaintFormData>({
    mode: "FOR_THE_RECORD",
    respondentType: initialRespType,
    caseInfo: {
      caseNumber:
        initialData?.caseInfo?.caseNumber ||
        `2026-REC-${String(Math.floor(1 + Math.random() * 999)).padStart(3, "0")}`,
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
      contactNumber: initialData?.respondent?.contactNumber || "",
      houseStreet: initialData?.respondent?.houseStreet || "",
      barangay: initialData?.respondent?.barangay || "Ugong",
      city: initialData?.respondent?.city || "Valenzuela City",
      province: initialData?.respondent?.province || "NCR, Third District",
      address: initialData?.respondent?.address || "",
      relationshipToComplainant:
        initialData?.respondent?.relationshipToComplainant || "",
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
    witnesses: [],
    isCertified: initialData?.isCertified ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [complainantResidentOptions, setComplainantResidentOptions] = useState<
    SearchSelectOption[]
  >([]);
  const [respondentResidentOptions, setRespondentResidentOptions] = useState<
    SearchSelectOption[]
  >([]);
  const [officerOptions, setOfficerOptions] = useState<OfficerOption[]>([]);

  // FTJS Linking State
  const [selectedFtjs, setSelectedFtjs] = useState<FtjsSearchItem | null>(null);
  const [isSearchingFtjs, setIsSearchingFtjs] = useState(false);
  const [ftjsSearchResults, setFtjsSearchResults] = useState<FtjsSearchItem[]>([]);
  const [ftjsQuery, setFtjsQuery] = useState("");

  // Helper to normalize full name for comparison
  const normalizeName = (first?: string, last?: string) =>
    `${first || ''} ${last || ''}`.trim().toLowerCase();

  const currentComplainantName = normalizeName(formData.complainant.firstName, formData.complainant.lastName);
  const currentRespondentName = normalizeName(formData.respondent.firstName, formData.respondent.lastName);

  // Sync initialData changes when editing or when async data loads
  useEffect(() => {
    if (initialData) {
      if (initialData.respondentType) {
        setRespondentType(initialData.respondentType);
      } else if (initialData.respondent?.relationshipToComplainant === "None (No Respondent)") {
        setRespondentType("NO_RESPONDENT");
      }

      setFormData((prev) => ({
        ...prev,
        ...initialData,
        respondentType: initialData.respondentType || prev.respondentType,
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
        witnesses: [],
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
        // Fallback
      }
    };
    fetchOfficers();
  }, []);

  // Dynamic Backend Search API Call for Complainant as user types (Excludes Respondent)
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
  }, [formData.complainant.searchQuery, currentRespondentName]);

  // Dynamic Backend Search API Call for Respondent as user types (Excludes Complainant)
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
  }, [formData.respondent.searchQuery, currentComplainantName]);


  const updateComplainant = (field: string, value: string) => {
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
    setFormData((prev: ComplaintFormData) => {
      const nextIncident = { ...prev.incident, [field]: value };
      let nextRespType = respondentType;

      if (field === "relatedBarangayService" && value === "FTJS_REISSUANCE") {
        if (!nextIncident.natureOfComplaint) {
          nextIncident.natureOfComplaint = "Lost Document / Lost Certificate";
        }
        setRespondentType("NO_RESPONDENT");
        nextRespType = "NO_RESPONDENT";
      }

      return {
        ...prev,
        respondentType: nextRespType,
        incident: nextIncident,
        relatedBarangayService: field === "relatedBarangayService" ? value : prev.relatedBarangayService,
      };
    });
  };

  const handleSelectFtjs = (item: FtjsSearchItem) => {
    setSelectedFtjs(item);
    setFormData((prev: ComplaintFormData) => ({
      ...prev,
      ftjsApplicationId: item.id,
      complainant: {
        ...prev.complainant,
        firstName: item.firstName || prev.complainant.firstName,
        lastName: item.lastName || prev.complainant.lastName,
        middleName: item.middleName || prev.complainant.middleName,
        suffix: item.suffix || prev.complainant.suffix,
        contactNumber: item.contactNumber || prev.complainant.contactNumber,
        address: item.completeAddress || prev.complainant.address,
        email: item.email || prev.complainant.email,
        age: item.age || prev.complainant.age,
        gender: item.gender || prev.complainant.gender,
        civilStatus: item.civilStatus || prev.complainant.civilStatus,
      },
    }));
  };

  const handleUnlinkFtjs = () => {
    setSelectedFtjs(null);
    setFormData((prev: ComplaintFormData) => ({
      ...prev,
      ftjsApplicationId: undefined,
    }));
  };

  // Search or auto-link FTJS certificates
  useEffect(() => {
    if (formData.incident.relatedBarangayService !== "FTJS_REISSUANCE") return;
    if (selectedFtjs) return;

    const term = ftjsQuery.trim() || `${formData.complainant.firstName || ''} ${formData.complainant.lastName || ''}`.trim();
    if (!term || term.length < 2) {
      setFtjsSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingFtjs(true);
      try {
        const results = await blotterApi.searchFtjs(term);
        setFtjsSearchResults(results || []);
        if (results && results.length === 1 && !results[0].hasActiveBlotter) {
          const res = results[0];
          const cFirst = (formData.complainant.firstName || "").toLowerCase().trim();
          const cLast = (formData.complainant.lastName || "").toLowerCase().trim();
          if (cFirst && cLast && res.firstName?.toLowerCase().trim() === cFirst && res.lastName?.toLowerCase().trim() === cLast) {
            handleSelectFtjs(res);
          }
        }
      } catch {
        setFtjsSearchResults([]);
      } finally {
        setIsSearchingFtjs(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.incident.relatedBarangayService, ftjsQuery, formData.complainant.firstName, formData.complainant.lastName, selectedFtjs]);

  const [searchParams] = useSearchParams();
  const ftjsQueryParam = searchParams.get("ftjsId");

  useEffect(() => {
    if (ftjsQueryParam && !selectedFtjs) {
      updateIncident("relatedBarangayService", "FTJS_REISSUANCE");
      blotterApi
        .searchFtjs(ftjsQueryParam)
        .then((results) => {
          if (results && results.length > 0) {
            const match =
              results.find((r) => String(r.id) === ftjsQueryParam) ||
              results[0];
            handleSelectFtjs(match);
          }
        })
        .catch(console.error);
    }
  }, [ftjsQueryParam]);

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

    if (respondentType === 'KNOWN') {
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
    }

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

    const textStatement = formData.narrative?.statementText || "";
    if (!textStatement.trim() && !formData.narrative?.file) {
      newErrors.narrativeStatement =
        "Please provide either a Record Statement or upload a File";
    }

    if (!formData.isCertified) {
      newErrors.isCertified =
        "You must certify that all information logged is accurate";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const payloadData: ComplaintFormData = {
        ...formData,
        respondentType,
        relatedBarangayService: formData.incident.relatedBarangayService,
        ftjsApplicationId: selectedFtjs ? selectedFtjs.id : undefined,
        respondent:
          respondentType === 'NO_RESPONDENT'
            ? {
                ...formData.respondent,
                respondentType: 'NO_RESPONDENT',
                lastName: '',
                firstName: '',
                middleName: '',
                contactNumber: '',
                houseStreet: '',
                barangay: '',
                city: '',
                province: '',
                address: '',
                relationshipToComplainant: 'None (No Respondent)',
                currentlyLivingWithComplainant: '',
              }
            : {
                ...formData.respondent,
                respondentType: 'KNOWN',
              },
      };
      onSubmit?.(payloadData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Case Overview */}
      <ComplaintFormSection title="Record Entry Overview">
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                Record Entry No.
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
        </div>
      </ComplaintFormSection>


      {/* Complainant Information */}
      <ComplaintFormSection title="Complainant Information">
        <div className="space-y-4">
          <SearchSelect
            label="Search Complainant (Auto-fill)"
            options={complainantResidentOptions}
            value={formData.complainant.searchQuery || ""}
            onChange={(val) => updateComplainant("searchQuery", val)}
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
      <ComplaintFormSection
        title="Respondent Information"
        subtitle="Provide available respondent details, or select 'No Respondent' for lost items or informational logs."
      >
        <div className="space-y-4">
          {/* Helpful Information Notice */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-900 text-xs leading-relaxed">
            <span className="font-semibold">Notice:</span> A respondent is optional for For the Record entries. If this record is for a lost document, lost item, or general consultation without an opposing person, choose <strong className="font-semibold">No Respondent</strong>.
          </div>

          {/* Respondent Type Choice */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Respondent Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setRespondentType('KNOWN')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  respondentType === 'KNOWN'
                    ? 'border-blue-600 bg-blue-50/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <input
                  type="radio"
                  name="respondentType"
                  value="KNOWN"
                  checked={respondentType === 'KNOWN'}
                  onChange={() => setRespondentType('KNOWN')}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block leading-tight">
                    Known Respondent
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Name and details of the involved individual are known.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setRespondentType('NO_RESPONDENT')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  respondentType === 'NO_RESPONDENT'
                    ? 'border-blue-600 bg-blue-50/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <input
                  type="radio"
                  name="respondentType"
                  value="NO_RESPONDENT"
                  checked={respondentType === 'NO_RESPONDENT'}
                  onChange={() => setRespondentType('NO_RESPONDENT')}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block leading-tight">
                    No Respondent
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Lost item, document loss, or informational report with no opposing party.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Display of Fields based on respondentType */}
          {respondentType === 'NO_RESPONDENT' ? (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">No respondent required:</span> This entry will be logged under the docket without an opposing party. Suitable for incident reports, lost properties, or general walk-in logs.
            </div>
          ) : (
            <>
              <SearchSelect
                label="Search Respondent (Auto-fill)"
                options={respondentResidentOptions}
                value={formData.respondent.searchQuery || ""}
                onChange={(val) => updateRespondent("searchQuery", val)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="e.g. Neighbor, Landlord, Acquaintance"
                  helperText="Sample: Neighbor, Landlord / Tenant, Relative / Family Member"
                />
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
            </>
          )}
        </div>
      </ComplaintFormSection>

      {/* Incident Details */}
      <ComplaintFormSection title="Incident Details">
        <ComplaintIncidentFields
          values={formData.incident}
          errors={errors}
          onChange={updateIncident}
          showRelatedService
          natureLabel="Nature of Complaint"
          naturePlaceholder="Select Nature of Complaint"
          natureOptions={[
            { value: "Lost Document / Lost Certificate", label: "Lost Document / Lost Certificate" },
            { value: "Affidavit of Loss", label: "Affidavit of Loss" },
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
            {
              value: "Consultation / Legal Advice",
              label: "Consultation / Legal Advice",
            },
            {
              value: "Incident Record Only (No Case Filed)",
              label: "Incident Record Only (No Case Filed)",
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
          placePlaceholder="e.g. Purok 8, Barangay Hall"
        />

        {/* Connected FTJS Certificate Reissuance Card — Shows when FTJS_REISSUANCE is active */}
        {formData.incident.relatedBarangayService === "FTJS_REISSUANCE" && (
          <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
            {selectedFtjs ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Link2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-slate-800">
                      FTJS certificate linked
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                      Verified eligible
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUnlinkFtjs}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                    Unlink
                  </button>
                </div>

                <div className="py-3.5 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-xs">
                  <div className="sm:pr-4 py-2 sm:py-0">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      APPLICANT
                    </span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm block truncate leading-tight">
                      {selectedFtjs.applicantName || "Applicant"}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">
                      {selectedFtjs.contactNumber || "No contact"}
                    </span>
                  </div>
                  <div className="sm:px-4 py-2 sm:py-0">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      CERTIFICATE NO.
                    </span>
                    <span className="font-bold font-mono text-slate-900 text-xs sm:text-sm block leading-tight">
                      {selectedFtjs.ftjsNumber || "—"}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">
                      FTJS application
                    </span>
                  </div>
                  <div className="sm:px-4 py-2 sm:py-0">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      DATE ISSUED
                    </span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm block leading-tight">
                      {selectedFtjs.dateSubmitted || "Registered"}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">
                      Original date
                    </span>
                  </div>
                  <div className="sm:pl-4 py-2 sm:py-0">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      ELIGIBILITY
                    </span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm block leading-tight">
                      Reissuance (Copy #{(selectedFtjs.issuanceCount || 1) + 1})
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">
                      Cleared for Affidavit
                    </span>
                  </div>
                </div>

                <div className="pt-3">
                  <p className="text-[11px] text-slate-500">
                    Complainant details in Section Complainant Information are synced from this record and bound for official re-issuance clearance.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-800">
                      Link Issued FTJS Certificate
                    </span>
                  </div>
                  {isSearchingFtjs && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Searching...
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={ftjsQuery}
                    onChange={(e) => setFtjsQuery(e.target.value)}
                    placeholder="Search applicant name or certificate number (e.g. FTJS-2026-001)..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:border-blue-400 rounded-xl outline-none bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {ftjsSearchResults.length > 0 && (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white max-h-48 overflow-y-auto shadow-2xs">
                    {ftjsSearchResults.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.applicantName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {item.ftjsNumber} {item.contactNumber ? `• ${item.contactNumber}` : ""}
                          </p>
                          {item.hasActiveBlotter && (
                            <p className="text-[11px] text-amber-600 font-medium">
                              Active reissuance blotter #{item.activeBlotterNumber} already filed
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={item.hasActiveBlotter}
                          onClick={() => handleSelectFtjs(item)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 transition-colors"
                        >
                          Link Certificate
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ComplaintFormSection>

      {/* Record Statement */}
      <ComplaintFormSection title="Narrative Statement of the Complainant">
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

      {/* Witness Section */}
      <ComplaintFormSection title="Witness Information (Optional)">
        <ComplaintWitnessSection
          witnesses={formData.witnesses || []}
          onWitnessesChange={(w) =>
            setFormData((prev: ComplaintFormData) => ({ ...prev, witnesses: w }))
          }
          currentComplainantName={`${formData.complainant.firstName || ''} ${formData.complainant.lastName || ''}`.trim()}
          currentRespondentName={`${formData.respondent.firstName || ''} ${formData.respondent.lastName || ''}`.trim()}
        />
      </ComplaintFormSection>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-200 space-y-4">

        <CertificationConsentCard
          id="certify_record"
          checked={formData.isCertified}
          onChange={(checked) =>
            setFormData((prev: ComplaintFormData) => ({
              ...prev,
              isCertified: checked,
            }))
          }
          title="Record Certification"
          text="I hereby certify that the information logged in this For the Record entry is accurate and officially noted by Barangay Ugong."
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
            <Save size={16} />
            {isSubmitting
              ? (isEditing ? "Saving Changes..." : "Saving Record Entry...")
              : (isEditing ? "Save Changes" : "Save For the Record Entry")}
          </button>
        </div>
      </div>
    </form>
  );
}
