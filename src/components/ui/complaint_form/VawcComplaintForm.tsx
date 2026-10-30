import React, { useState, useEffect, useMemo } from "react";
import {
  AlertCircle,
  Plus,
  Trash2,
  FileCheck,
  Loader2,
} from "lucide-react";
import { ComplaintFormSection } from "./ComplaintFormSection";
import { ComplaintEvidenceGrid } from "./ComplaintEvidenceGrid";
import { ComplaintFileUpload } from "./ComplaintFileUpload";
import { ComplaintWitnessSection } from "./ComplaintWitnessSection";
import {
  SearchSelect,
  type SearchSelectOption,
} from "@/components/ui/SearchSelect";
import {
  NatureInputField,
  type NatureOption,
} from "./NatureInputField";
import {
  PhAddressSelector,
  type PhAddressValue,
} from "@/components/ui/PhAddressSelector";
import type { WitnessData } from "./types";
import { officersApi, type OfficerOption } from "@/api/modules/officers.api";
import {
  residentsApi,
  type ResidentSearchOption,
} from "@/api/modules/residents.api";
import { useAuth } from "@/hooks/useAuth";
import {
  vawcApi,
  fileToBase64,
  type VawcCaseCreateRequest,
  type VawcChildInvolved,
  type VawcEvidence,
} from "@/api/modules/vawc.api";

export interface VawcComplaintFormProps {
  initialData?: Partial<VawcCaseCreateRequest>;
  onSubmitSuccess?: (response: any) => void;
  onSubmitError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

interface ChildFormRow {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  age: string;
  role: string;
}

const inputCls =
  "w-full px-3.5 py-2.5 text-xs border border-slate-200 focus:border-blue-400 rounded-xl outline-none focus:outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white";

export interface DangerFactorOption {
  text: string;
  severity: "HIGH" | "MODERATE" | "LOW";
}

export const DANGER_ASSESSMENT_OPTIONS: DangerFactorOption[] = [
  // High Risk Factors
  {
    text: "Respondent has access to weapons or firearms",
    severity: "HIGH",
  },
  {
    text: "Ongoing threat of physical harm or death threats",
    severity: "HIGH",
  },
  {
    text: "Violence is escalating in frequency and severity",
    severity: "HIGH",
  },
  // Moderate Risk Factors
  {
    text: "Respondent controls or restricts finances / movement",
    severity: "MODERATE",
  },
  {
    text: "Respondent lives in the same house or nearby",
    severity: "MODERATE",
  },
  {
    text: "History of repeated disputes or emotional distress",
    severity: "MODERATE",
  },
  // Low Risk / Mitigating Factors
  {
    text: "First-time or isolated incident without physical harm",
    severity: "LOW",
  },
  {
    text: "Complainant and respondent now live separately",
    severity: "LOW",
  },
  {
    text: "Non-physical dispute without threats or weapons",
    severity: "LOW",
  },
];

export const VIOLENCE_TYPE_OPTIONS: NatureOption[] = [
  { value: "Physical Abuse", label: "Physical Abuse" },
  {
    value: "Psychological / Emotional Abuse",
    label: "Psychological / Emotional Abuse",
  },
  { value: "Economic Abuse", label: "Economic Abuse" },
  { value: "Sexual Abuse", label: "Sexual Abuse" },
  { value: "Stalking / Harassment", label: "Stalking / Harassment" },
  { value: "Battery", label: "Battery" },
  {
    value: "Verbal Abuse & Intimidation",
    label: "Verbal Abuse & Intimidation",
  },
  {
    value: "Deprivation of Financial Support",
    label: "Deprivation of Financial Support",
  },
  { value: "Other", label: "Other" },
];

export const VAWC_NATURE_OF_COMPLAINT_OPTIONS: NatureOption[] = [
  { value: "Physical Abuse / Violence", label: "Physical Abuse / Violence" },
  { value: "Threats & Intimidation", label: "Threats & Intimidation" },
  { value: "Emotional & Psychological Abuse", label: "Emotional & Psychological Abuse" },
  { value: "Economic & Financial Abuse / Deprivation", label: "Economic & Financial Abuse / Deprivation" },
  { value: "Sexual Harassment / Abuse", label: "Sexual Harassment / Abuse" },
  { value: "Stalking & Harassment", label: "Stalking & Harassment" },
  { value: "Denial of Financial / Child Support", label: "Denial of Financial / Child Support" },
  { value: "Verbal Abuse & Public Humiliation", label: "Verbal Abuse & Public Humiliation" },
  { value: "Destruction of Personal Property", label: "Destruction of Personal Property" },
  { value: "Unlawful Deprivation of Child Custody", label: "Unlawful Deprivation of Child Custody" },
  { value: "Battery / Infliction of Bodily Harm", label: "Battery / Infliction of Bodily Harm" },
  { value: "Repeated Harassment & Coercion", label: "Repeated Harassment & Coercion" },
  { value: "Other VAWC Violation (RA 9262)", label: "Other VAWC Violation (RA 9262)" },
];

const FREQUENCY_OPTIONS = [
  "First Time",
  "Occasionally",
  "Repeatedly",
  "Chronic / Daily",
];

const RELATIONSHIP_OPTIONS = [
  "Spouse/Husband",
  "Live-in Partner",
  "Ex-Spouse",
  "Former Partner",
  "Boyfriend/Dating Partner",
  "Father of Child",
  "Relative",
  "Neighbor",
  "Other",
];

export const CHILD_ROLE_OPTIONS: NatureOption[] = [
  { value: "Affected Child", label: "Affected Child" },
  { value: "Witness", label: "Witness" },
  { value: "Victim", label: "Victim" },
  { value: "Dependent", label: "Dependent" },
  { value: "Other", label: "Other" },
];

const getTodayFormattedDate = () => {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeGender = (g?: string) => {
  if (!g) return "";
  const lower = g.trim().toLowerCase();
  if (lower === "female") return "Female";
  if (lower === "male") return "Male";
  if (lower === "other") return "Other";
  return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
};

const normalizeCivilStatus = (cs?: string) => {
  if (!cs) return "";
  const lower = cs.trim().toLowerCase();
  if (lower === "single") return "Single";
  if (lower === "married") return "Married";
  if (lower === "widowed") return "Widowed";
  if (lower === "separated") return "Separated";
  if (lower === "divorced") return "Divorced";
  if (lower === "live-in" || lower === "livein" || lower === "common_law" || lower === "common law") return "Live-in";
  return cs.charAt(0).toUpperCase() + cs.slice(1).toLowerCase();
};

export function VawcComplaintForm({
  initialData,
  onSubmitSuccess,
  onSubmitError,
  onCancel,
  className = "",
}: VawcComplaintFormProps) {
  const { user } = useAuth();

  // Officers list
  const [officerOptions, setOfficerOptions] = useState<OfficerOption[]>([]);
  const [assignedOfficerId, setAssignedOfficerId] = useState<number | string>(
    initialData?.assignedOfficerId || ""
  );

  // Section A: Case Info
  const [caseNumber] = useState<string>(
    initialData?.caseNumber ||
      `${new Date().getFullYear()}-VAWC-${String(
        Math.floor(1 + Math.random() * 999)
      ).padStart(3, "0")}`
  );

  const [dateFiled] = useState<string>(
    getTodayFormattedDate()
  );

  const [timeFiled] = useState<string>(
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );

  const reportingOfficerName =
    user?.name || user?.username || "Princess Tupas";

  // Section B: Complainant Search & State
  const [complainantResidentOptions, setComplainantResidentOptions] = useState<
    SearchSelectOption[]
  >([]);
  const [complainantSearch, setComplainantSearch] = useState("");

  const [complainantLastName, setComplainantLastName] = useState(
    initialData?.complainant?.lastName || ""
  );
  const [complainantFirstName, setComplainantFirstName] = useState(
    initialData?.complainant?.firstName || ""
  );
  const [complainantMiddleName, setComplainantMiddleName] = useState(
    initialData?.complainant?.middleName || ""
  );
  const [complainantContact, setComplainantContact] = useState(
    initialData?.complainant?.contactNumber || ""
  );
  const [complainantAge, setComplainantAge] = useState<string>(
    initialData?.complainant?.age ? String(initialData.complainant.age) : ""
  );
  const [complainantGender, setComplainantGender] = useState(
    normalizeGender(initialData?.complainant?.gender)
  );
  const [complainantCivilStatus, setComplainantCivilStatus] = useState(
    normalizeCivilStatus(initialData?.complainant?.civilStatus)
  );
  const [complainantHouseStreet, setComplainantHouseStreet] = useState(
    initialData?.complainant?.completeAddress
      ? initialData.complainant.completeAddress.split(",")[0].trim()
      : ""
  );
  const [complainantBarangay, setComplainantBarangay] = useState("Ugong");
  const [complainantCity, setComplainantCity] = useState("Valenzuela City");
  const [complainantProvince, setComplainantProvince] =
    useState("NCR, Third District");
  const [complainantAddress, setComplainantAddress] = useState(
    initialData?.complainant?.completeAddress || ""
  );

  // Section C: Respondent Search & State
  const [respondentResidentOptions, setRespondentResidentOptions] = useState<
    SearchSelectOption[]
  >([]);
  const [respondentSearch, setRespondentSearch] = useState("");

  const [respondentLastName, setRespondentLastName] = useState(
    initialData?.respondent?.lastName || ""
  );
  const [respondentFirstName, setRespondentFirstName] = useState(
    initialData?.respondent?.firstName || ""
  );
  const [respondentMiddleName, setRespondentMiddleName] = useState(
    initialData?.respondent?.middleName || ""
  );
  const [respondentContact, setRespondentContact] = useState(
    initialData?.respondent?.contactNumber || ""
  );
  const [respondentAge, setRespondentAge] = useState<string>(
    initialData?.respondent?.age ? String(initialData.respondent.age) : ""
  );
  const [respondentGender, setRespondentGender] = useState(
    normalizeGender(initialData?.respondent?.gender)
  );
  const [relationship, setRelationship] = useState(
    initialData?.respondent?.relationshipToComplainant || ""
  );
  const [respondentHouseStreet, setRespondentHouseStreet] = useState(
    initialData?.respondent?.completeAddress
      ? initialData.respondent.completeAddress.split(",")[0].trim()
      : ""
  );
  const [respondentBarangay, setRespondentBarangay] = useState("Ugong");
  const [respondentCity, setRespondentCity] = useState("Valenzuela City");
  const [respondentProvince, setRespondentProvince] =
    useState("NCR, Third District");
  const [respondentAddress, setRespondentAddress] = useState(
    initialData?.respondent?.completeAddress || ""
  );
  const [currentlyLivingWith, setCurrentlyLivingWith] = useState<
    "Yes" | "No"
  >(
    initialData?.respondent?.currentlyLivingWithComplainant ? "Yes" : "No"
  );

  // Section D: Incident
  const [natureOfComplaint, setNatureOfComplaint] = useState(
    initialData?.incident?.natureOfComplaint || ""
  );
  const [dateOfIncident, setDateOfIncident] = useState(
    initialData?.incident?.dateOfIncident || ""
  );
  const [timeOfIncident, setTimeOfIncident] = useState(
    initialData?.incident?.timeOfIncident || ""
  );
  const [placeOfIncident, setPlaceOfIncident] = useState(
    initialData?.incident?.placeOfIncident || ""
  );
  const [frequencyOfIncident, setFrequencyOfIncident] = useState(
    initialData?.incident?.frequencyOfIncident || ""
  );
  const [violenceType, setViolenceType] = useState(
    initialData?.violenceType || ""
  );
  const [descriptionOfInjuries, setDescriptionOfInjuries] = useState(
    initialData?.incident?.descriptionOfInjuries || ""
  );

  // Section E: Danger Assessment
  const [checkedDangerFactors, setCheckedDangerFactors] = useState<string[]>(
    initialData?.dangerAssessments || []
  );
  const [otherDangerChecked, setOtherDangerChecked] = useState(
    Boolean(initialData?.otherDangerAssessment)
  );
  const [otherDangerText, setOtherDangerText] = useState(
    initialData?.otherDangerAssessment || ""
  );
  const [manualRiskLevel, setManualRiskLevel] = useState<string | null>(
    initialData?.riskLevel || null
  );

  // Section F: Children Involved
  const [hasChildrenInvolved, setHasChildrenInvolved] = useState<"Yes" | "No">(
    initialData?.hasChildrenInvolved ? "Yes" : "No"
  );
  const [childrenRows, setChildrenRows] = useState<ChildFormRow[]>(
    initialData?.children && initialData.children.length > 0
      ? initialData.children.map((c, idx) => ({
          id: `child_${idx}_${Date.now()}`,
          firstName: c.firstName || "",
          middleName: c.middleName || "",
          lastName: c.lastName || "",
          suffix: (c as any).suffix || "",
          age: c.age ? String(c.age) : "",
          role: c.role || "",
        }))
      : [
          {
            id: `child_init_${Date.now()}`,
            firstName: "",
            middleName: "",
            lastName: "",
            suffix: "",
            age: "",
            role: "",
          },
        ]
  );

  // Section G: Method of Filing
  const [filingMethod, setFilingMethod] = useState<
    "ORAL_REPORT_ONLY" | "WITH_WRITTEN_SWORN_STATEMENT"
  >("WITH_WRITTEN_SWORN_STATEMENT");

  // Section H: Narrative / Sworn Statement
  const [narrativeFile, setNarrativeFile] = useState<File | null>(null);
  const [narrativeSummary, setNarrativeSummary] = useState("");

  // Section I: Evidence
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<
    Record<string, File | null>
  >({});
  const [otherEvidenceText, setOtherEvidenceText] = useState("");

  // Section J: Witnesses
  const [witnesses, setWitnesses] = useState<WitnessData[]>([]);

  // Section K: Complainant's Immediate Request
  const [immediateRequests, setImmediateRequests] = useState<string[]>([]);

  // Section L: Certification
  const [isCertified, setIsCertified] = useState(false);

  // Submitting state and error messages
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Fetch active officers on mount (Filter for OVERALL and VAWC departments)
  useEffect(() => {
    let isMounted = true;
    officersApi
      .getActiveOfficers()
      .then((data) => {
        if (isMounted) {
          if (data && data.length > 0) {
            const vawcOfficers = data.filter((o) => {
              const dept = (o.departmentName || "").toUpperCase();
              return (
                dept.includes("OVERALL") ||
                dept.includes("VAWC") ||
                dept.includes("BARANGAY OFFICE") ||
                dept === ""
              );
            });
            const finalOfficers =
              vawcOfficers.length > 0 ? vawcOfficers : data;
            setOfficerOptions(finalOfficers);
          } else {
            const fallbackOfficers: OfficerOption[] = [
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
            ];
            setOfficerOptions(fallbackOfficers);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          const fallbackOfficers: OfficerOption[] = [
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
          ];
          setOfficerOptions(fallbackOfficers);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to normalize names for cross-role exclusion
  const normalizeClean = (str?: string) => (str || "").trim().toLowerCase();

  const currentComplainantName = normalizeClean(
    `${complainantFirstName} ${complainantLastName}`
  );
  const currentRespondentName = normalizeClean(
    `${respondentFirstName} ${respondentLastName}`
  );
  const currentWitnessNames = (witnesses || []).map((w) =>
    normalizeClean(`${w.firstName} ${w.lastName}`)
  );

  // Complainant Resident Search (Excludes Respondent & Witnesses)
  useEffect(() => {
    const query = complainantSearch.trim();
    const timer = setTimeout(async () => {
      try {
        const residents = await residentsApi.searchActive(query);
        if (residents && Array.isArray(residents)) {
          const mapped: SearchSelectOption[] = residents
            .filter((r: ResidentSearchOption) => {
              const rName = normalizeClean(`${r.firstName} ${r.lastName}`);
              const rFull = normalizeClean(r.fullName);
              if (
                currentRespondentName &&
                (rName === currentRespondentName || rFull === currentRespondentName)
              )
                return false;
              if (
                currentWitnessNames.some(
                  (w) => w && (w === rName || w === rFull)
                )
              )
                return false;
              return true;
            })
            .map((r: ResidentSearchOption) => ({
              id: String(r.id),
              label: r.fullName || "Resident",
              description: `${r.contactNumber || "No contact"} • ${
                r.completeAddress || r.barangayIdNumber || "Brgy. Ugong"
              }`,
              data: r,
            }));
          setComplainantResidentOptions(mapped);
        }
      } catch {
        // Fail silently
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [complainantSearch, currentRespondentName, currentWitnessNames.join(",")]);

  const handleSelectComplainant = (opt: SearchSelectOption) => {
    if (opt.data) {
      const r = opt.data as ResidentSearchOption;
      setComplainantLastName(r.lastName || "");
      setComplainantFirstName(r.firstName || "");
      setComplainantMiddleName(r.middleName || "");
      if (r.contactNumber) setComplainantContact(r.contactNumber);
      if (r.age) setComplainantAge(String(r.age));
      if (r.gender) setComplainantGender(normalizeGender(r.gender));
      if (r.civilStatus)
        setComplainantCivilStatus(normalizeCivilStatus(r.civilStatus));

      const houseStr = r.completeAddress
        ? r.completeAddress.split(",")[0].trim()
        : "";
      setComplainantHouseStreet(houseStr);
      setComplainantBarangay("Ugong");
      setComplainantCity("Valenzuela City");
      setComplainantProvince("NCR, Third District");
      setComplainantAddress(
        r.completeAddress ||
          (houseStr
            ? `${houseStr}, Brgy. Ugong, Valenzuela City, NCR, Third District`
            : "Brgy. Ugong, Valenzuela City, NCR, Third District")
      );
      setComplainantSearch(r.fullName || opt.label);
    } else {
      const [first, ...lastParts] = opt.label.split(" ");
      const parts = opt.description?.split("•") || [];
      setComplainantFirstName(first || "");
      setComplainantLastName(lastParts.join(" ") || "");
      if (parts[0]?.trim() && parts[0]?.trim() !== "No contact") {
        setComplainantContact(parts[0].trim());
      }
      setComplainantHouseStreet("Purok 7");
      setComplainantBarangay("Ugong");
      setComplainantCity("Valenzuela City");
      setComplainantProvince("NCR, Third District");
      setComplainantAddress(
        parts[1]?.trim() ||
          "Purok 7, Brgy. Ugong, Valenzuela City, NCR, Third District"
      );
      setComplainantSearch(opt.label);
    }
  };

  // Respondent Resident Search (Excludes Complainant & Witnesses)
  useEffect(() => {
    const query = respondentSearch.trim();
    const timer = setTimeout(async () => {
      try {
        const residents = await residentsApi.searchActive(query);
        if (residents && Array.isArray(residents)) {
          const mapped: SearchSelectOption[] = residents
            .filter((r: ResidentSearchOption) => {
              const rName = normalizeClean(`${r.firstName} ${r.lastName}`);
              const rFull = normalizeClean(r.fullName);
              if (
                currentComplainantName &&
                (rName === currentComplainantName || rFull === currentComplainantName)
              )
                return false;
              if (
                currentWitnessNames.some(
                  (w) => w && (w === rName || w === rFull)
                )
              )
                return false;
              return true;
            })
            .map((r: ResidentSearchOption) => ({
              id: String(r.id),
              label: r.fullName || "Resident",
              description: `${r.contactNumber || "No contact"} • ${
                r.completeAddress || r.barangayIdNumber || "Brgy. Ugong"
              }`,
              data: r,
            }));
          setRespondentResidentOptions(mapped);
        }
      } catch {
        // Fail silently
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [respondentSearch, currentComplainantName, currentWitnessNames.join(",")]);

  const handleSelectRespondent = (opt: SearchSelectOption) => {
    if (opt.data) {
      const r = opt.data as ResidentSearchOption;
      setRespondentLastName(r.lastName || "");
      setRespondentFirstName(r.firstName || "");
      setRespondentMiddleName(r.middleName || "");
      if (r.contactNumber) setRespondentContact(r.contactNumber);
      if (r.age) setRespondentAge(String(r.age));
      if (r.gender) setRespondentGender(normalizeGender(r.gender));

      const houseStr = r.completeAddress
        ? r.completeAddress.split(",")[0].trim()
        : "";
      setRespondentHouseStreet(houseStr);
      setRespondentBarangay("Ugong");
      setRespondentCity("Valenzuela City");
      setRespondentProvince("NCR, Third District");
      setRespondentAddress(
        r.completeAddress ||
          (houseStr
            ? `${houseStr}, Brgy. Ugong, Valenzuela City, NCR, Third District`
            : "Brgy. Ugong, Valenzuela City, NCR, Third District")
      );
      setRespondentSearch(r.fullName || opt.label);
    } else {
      const [first, ...lastParts] = opt.label.split(" ");
      const parts = opt.description?.split("•") || [];
      setRespondentFirstName(first || "");
      setRespondentLastName(lastParts.join(" ") || "");
      if (parts[0]?.trim() && parts[0]?.trim() !== "No contact") {
        setRespondentContact(parts[0].trim());
      }
      setRespondentHouseStreet("Purok 7");
      setRespondentBarangay("Ugong");
      setRespondentCity("Valenzuela City");
      setRespondentProvince("NCR, Third District");
      setRespondentAddress(
        parts[1]?.trim() ||
          "Purok 7, Brgy. Ugong, Valenzuela City, NCR, Third District"
      );
      setRespondentSearch(opt.label);
    }
  };

  // Manual risk level selection is strictly permitted ONLY when ONLY "Other" is checked (0 standard factors)
  const isManualRiskAllowed =
    checkedDangerFactors.length === 0 && otherDangerChecked;

  // Compute calculated risk level based on selected High, Moderate, and Low factors
  const computedRiskLevel = useMemo(() => {
    // If standard danger factors are checked, calculate automatically
    if (checkedDangerFactors.length > 0) {
      const selectedOptions = DANGER_ASSESSMENT_OPTIONS.filter((opt) =>
        checkedDangerFactors.includes(opt.text)
      );

      const highCount = selectedOptions.filter(
        (opt) => opt.severity === "HIGH"
      ).length;
      const modCount = selectedOptions.filter(
        (opt) => opt.severity === "MODERATE"
      ).length;
      const lowCount = selectedOptions.filter(
        (opt) => opt.severity === "LOW"
      ).length;

      // 1. If any HIGH factor is present, OR 2+ MODERATE factors are present -> HIGH-IMMINENT
      if (highCount >= 1 || modCount >= 2 || checkedDangerFactors.length >= 4) {
        return "HIGH-IMMINENT";
      }

      // 2. If 1 MODERATE factor is present, OR 3+ LOW factors are present -> MODERATE
      if (modCount >= 1 || lowCount >= 3) {
        return "MODERATE";
      }

      // 3. If 1 or 2 LOW factors are present -> LOW
      return "LOW";
    }

    // When ONLY "Other" is checked, use manual selection if selected, or default to MODERATE
    if (otherDangerChecked) {
      if (manualRiskLevel) return manualRiskLevel;
      return "MODERATE";
    }

    // Default when 0 factors are selected
    return "LOW";
  }, [checkedDangerFactors, otherDangerChecked, manualRiskLevel]);

  // Danger Assessment factor toggle
  const toggleDangerFactor = (factor: string) => {
    setCheckedDangerFactors((prev) => {
      const next = prev.includes(factor)
        ? prev.filter((item) => item !== factor)
        : [...prev, factor];
      if (next.length > 0) {
        setManualRiskLevel(null);
      }
      return next;
    });
  };

  // Immediate Request factor single-select (can toggle off since optional)
  const toggleImmediateRequest = (req: string) => {
    setImmediateRequests((prev) => (prev.includes(req) ? [] : [req]));
  };

  // Child row helpers
  const addChildRow = () => {
    setChildrenRows((prev) => [
      ...prev,
      {
        id: `child_${Date.now()}_${Math.random()}`,
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        age: "",
        role: "",
      },
    ]);
  };

  const removeChildRow = (id: string) => {
    setChildrenRows((prev) => prev.filter((c) => c.id !== id));
  };

  const updateChildRow = (
    id: string,
    field: keyof ChildFormRow,
    value: string
  ) => {
    setChildrenRows((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};

    // Validations
    if (!assignedOfficerId) {
      errors.assignedOfficer = "Assigned Officer is required";
    }
    if (!complainantLastName.trim()) {
      errors.complainantLastName = "Complainant Last Name is required";
    }
    if (!complainantFirstName.trim()) {
      errors.complainantFirstName = "Complainant First Name is required";
    }
    if (complainantContact && (complainantContact.length !== 11 || !complainantContact.startsWith("09"))) {
      errors.complainantContact = "Contact number must be an 11-digit mobile number starting with 09 (e.g. 09123456789)";
    }
    if (!complainantAge) {
      errors.complainantAge = "Age is required";
    } else {
      const compAge = parseInt(complainantAge, 10);
      if (isNaN(compAge) || compAge < 0 || compAge > 120) {
        errors.complainantAge = "Age must be between 0 and 120";
      }
    }
    if (!complainantGender) {
      errors.complainantGender = "Gender is required";
    }
    if (!complainantCivilStatus) {
      errors.complainantCivilStatus = "Civil Status is required";
    }

    if (!respondentLastName.trim()) {
      errors.respondentLastName = "Respondent Last Name is required";
    }
    if (!respondentFirstName.trim()) {
      errors.respondentFirstName = "Respondent First Name is required";
    }
    if (respondentContact && (respondentContact.length !== 11 || !respondentContact.startsWith("09"))) {
      errors.respondentContact = "Contact number must be an 11-digit mobile number starting with 09 (e.g. 09123456789)";
    }
    if (respondentAge) {
      const respAge = parseInt(respondentAge, 10);
      if (isNaN(respAge) || respAge < 0 || respAge > 120) {
        errors.respondentAge = "Age must be between 0 and 120";
      }
    }
    if (!relationship.trim()) {
      errors.relationship = "Relationship to Complainant is required";
    }

    if (!natureOfComplaint.trim()) {
      errors.natureOfComplaint = "Nature of Complaint is required";
    }
    if (!dateOfIncident) {
      errors.dateOfIncident = "Date of Incident is required";
    }
    if (!placeOfIncident.trim()) {
      errors.placeOfIncident = "Place of Incident is required";
    }
    if (!violenceType.trim()) {
      errors.violenceType = "Type of Violence is required";
    }

    if (filingMethod === "ORAL_REPORT_ONLY") {
      if (!narrativeSummary.trim() && !narrativeFile) {
        errors.narrative = "Statement of facts / narrative summary is required for oral reports";
      }
    } else {
      if (!narrativeFile && !narrativeSummary.trim()) {
        errors.narrative = "Written / sworn statement document is required";
      }
    }

    if (!isCertified) {
      errors.certification = "You must acknowledge and certify this complaint.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const errorMsg = "Please fill in all required fields indicated in the form.";
      setFormError(errorMsg);
      if (onSubmitError) {
        onSubmitError(errorMsg);
      }
      window.scrollTo({ top: 150, behavior: "smooth" });
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    try {
      // 1. Process Narrative File if uploaded
      let narrativeFileData: string | null = null;
      if (narrativeFile) {
        try {
          narrativeFileData = await fileToBase64(narrativeFile);
        } catch {
          narrativeFileData = null;
        }
      }

      // 2. Process Evidences
      const mappedEvidences: VawcEvidence[] = await Promise.all(
        selectedEvidenceIds.map(async (id) => {
          const file = evidenceFiles[id];
          let base64Data: string | null = null;
          if (file) {
            try {
              base64Data = await fileToBase64(file);
            } catch {
              base64Data = null;
            }
          }
          return {
            evidenceTypeName: id.replace(/_/g, " ").toUpperCase(),
            fileName: file ? file.name : "evidence.pdf",
            description: id.replace(/_/g, " "),
            files: base64Data,
          };
        })
      );

      if (otherEvidenceText.trim()) {
        mappedEvidences.push({
          evidenceTypeName: "OTHER",
          fileName: "other_evidence.txt",
          description: otherEvidenceText.trim(),
          files: null,
        });
      }

      // 3. Process Witnesses
      const mappedWitnesses = await Promise.all(
        witnesses.map(async (w) => {
          let testimonyData: string | null = null;
          if (w.testimonyFile) {
            try {
              testimonyData = await fileToBase64(w.testimonyFile);
            } catch {
              testimonyData = null;
            }
          }
          return {
            firstName: w.firstName || "Witness",
            lastName: w.lastName || "",
            contactNumber: w.contactNumber || "",
            completeAddress: w.address || "",
            testimonyFileName: w.testimonyFile
              ? w.testimonyFile.name
              : "testimony.pdf",
            testimonyFile: testimonyData,
          };
        })
      );

      // 4. Process Children Involved
      const mappedChildren: VawcChildInvolved[] =
        hasChildrenInvolved === "Yes"
          ? childrenRows
              .filter((c) => c.firstName.trim() || c.lastName.trim())
              .map((c) => ({
                firstName: c.firstName.trim(),
                middleName: c.middleName.trim() || undefined,
                lastName: c.lastName.trim(),
                suffix: c.suffix.trim() || undefined,
                age: c.age ? parseInt(c.age, 10) : null,
                role: c.role || "Affected Child",
              }))
          : [];

      // Find assigned officer name
      const selOfficer = officerOptions.find(
        (o) => String(o.id) === String(assignedOfficerId)
      );
      const assignedOfficerName = selOfficer
        ? `${selOfficer.name} (${selOfficer.position})`
        : undefined;

      // Construct Complete Payload
      const payload: VawcCaseCreateRequest = {
        caseNumber: caseNumber.trim(),
        assignedOfficerId: assignedOfficerId
          ? Number(assignedOfficerId)
          : null,
        assignedOfficer: assignedOfficerName,

        complainant: {
          lastName: complainantLastName.trim(),
          firstName: complainantFirstName.trim(),
          middleName: complainantMiddleName.trim() || undefined,
          contactNumber: complainantContact.trim() || undefined,
          age: complainantAge ? parseInt(complainantAge, 10) : null,
          gender: complainantGender || undefined,
          civilStatus: complainantCivilStatus || undefined,
          completeAddress:
            complainantAddress.trim() || "Brgy. Ugong, Valenzuela City",
        },

        respondent: {
          lastName: respondentLastName.trim(),
          firstName: respondentFirstName.trim(),
          middleName: respondentMiddleName.trim() || undefined,
          contactNumber: respondentContact.trim() || undefined,
          age: respondentAge ? parseInt(respondentAge, 10) : null,
          gender: respondentGender || undefined,
          relationshipToComplainant: relationship.trim(),
          completeAddress:
            respondentAddress.trim() || "Brgy. Ugong, Valenzuela City",
          currentlyLivingWithComplainant: currentlyLivingWith === "Yes",
        },

        incident: {
          natureOfComplaint: natureOfComplaint.trim(),
          dateOfIncident: dateOfIncident,
          timeOfIncident: timeOfIncident || undefined,
          placeOfIncident: placeOfIncident.trim(),
          frequencyOfIncident: frequencyOfIncident || undefined,
          descriptionOfInjuries: descriptionOfInjuries.trim() || undefined,
        },

        violenceType: violenceType || undefined,

        dangerAssessments: checkedDangerFactors,
        otherDangerAssessment: otherDangerChecked ? otherDangerText : undefined,
        riskLevel: computedRiskLevel,

        hasChildrenInvolved: hasChildrenInvolved === "Yes",
        children: mappedChildren,

        filingMethod: filingMethod,
        filingType:
          filingMethod === "ORAL_REPORT_ONLY"
            ? "FOR_RECORD_ONLY"
            : "FORMAL_COMPLAINT",

        narrative: (narrativeFile || narrativeSummary.trim())
          ? {
              fileName: narrativeFile
                ? narrativeFile.name
                : filingMethod === "ORAL_REPORT_ONLY"
                ? "oral_statement.txt"
                : "written_statement.txt",
              statementSummary:
                narrativeSummary.trim() ||
                (narrativeFile ? "Attached sworn statement document" : "Oral report statement"),
              fileData: narrativeFileData,
            }
          : undefined,

        evidences: mappedEvidences,
        otherEvidenceDescription: otherEvidenceText.trim() || undefined,
        witnesses: mappedWitnesses,
        immediateRequests: immediateRequests,
      };

      const response = await vawcApi.create(payload);
      if (onSubmitSuccess) {
        onSubmitSuccess(response);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred while filing the VAWC case. Please try again.";
      setFormError(errorMsg);
      if (onSubmitError) {
        onSubmitError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 select-none ${className}`}>
      {/* Top Privacy Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 text-xs shadow-2xs">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          <span className="font-bold text-amber-950">Privacy Notice:</span> In
          compliance with the Data Privacy Act of 2012 (R.A. 10173), all personal
          information collected in this VAWC complaint shall be kept strictly
          confidential. Access to full details is restricted to authorized
          barangay personnel only.
        </p>
      </div>

      {formError && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* SECTION: Case Overview & Assignment */}
      <ComplaintFormSection title="Case Overview & Assignment">
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                Case / Blotter Number
              </p>
              <p className="text-xs sm:text-sm font-bold text-blue-600 mt-1">
                {caseNumber}
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
                {dateFiled}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">[today]</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                Time Filed
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
                {timeFiled}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">(now)</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                Receiving Officer
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
                {reportingOfficerName}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">(logged in)</p>
            </div>
          </div>

          <div className="max-w-md">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Officer <span className="text-red-500">*</span>
            </label>
            <select
              value={assignedOfficerId}
              onChange={(e) => setAssignedOfficerId(e.target.value)}
              className={inputCls}
            >
              <option value="">Select Officer...</option>
              {officerOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} - {o.position} ({o.departmentName || "Barangay Office"})
                </option>
              ))}
            </select>
            {validationErrors.assignedOfficer && (
              <p className="text-xs text-red-500 mt-1">
                {validationErrors.assignedOfficer}
              </p>
            )}
          </div>
        </div>
      </ComplaintFormSection>

      {/* SECTION: Complainant Information */}
      <ComplaintFormSection title="Complainant Information">
        <div className="space-y-4">
          <SearchSelect
            label="Search Resident (Auto-fill)"
            options={complainantResidentOptions}
            value={complainantSearch}
            onChange={(val) => setComplainantSearch(val)}
            onSearchQueryChange={(val) => setComplainantSearch(val)}
            onSelect={handleSelectComplainant}
            placeholder="Type name to search active resident..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={50}
                value={complainantLastName}
                onChange={(e) => setComplainantLastName(e.target.value.slice(0, 50))}
                placeholder="e.g. Dela Cruz"
                className={inputCls}
              />
              {validationErrors.complainantLastName && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.complainantLastName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={50}
                value={complainantFirstName}
                onChange={(e) => setComplainantFirstName(e.target.value.slice(0, 50))}
                placeholder="e.g. Maria"
                className={inputCls}
              />
              {validationErrors.complainantFirstName && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.complainantFirstName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Middle Name (Optional)
              </label>
              <input
                type="text"
                maxLength={50}
                value={complainantMiddleName}
                onChange={(e) => setComplainantMiddleName(e.target.value.slice(0, 50))}
                placeholder="e.g. Santos"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Number (Optional)
              </label>
              <input
                type="text"
                maxLength={11}
                value={complainantContact}
                onChange={(e) => setComplainantContact(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="09XX XXX XXXX"
                className={inputCls}
              />
              {validationErrors.complainantContact && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.complainantContact}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                value={complainantAge}
                onChange={(e) => setComplainantAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="e.g. 35"
                className={inputCls}
              />
              {validationErrors.complainantAge && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.complainantAge}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={complainantGender}
                onChange={(e) => setComplainantGender(e.target.value)}
                className={inputCls}
              >
                <option value="">Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
              {validationErrors.complainantGender && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.complainantGender}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Civil Status <span className="text-red-500">*</span>
              </label>
              <select
                value={complainantCivilStatus}
                onChange={(e) => setComplainantCivilStatus(e.target.value)}
                className={inputCls}
              >
                <option value="">Select Civil Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
                <option value="Divorced">Divorced</option>
                <option value="Live-in">Live-in / Common Law</option>
              </select>
              {validationErrors.complainantCivilStatus && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.complainantCivilStatus}
                </p>
              )}
            </div>
          </div>

          <PhAddressSelector
            value={{
              houseStreet: complainantHouseStreet || "",
              barangayName: complainantBarangay || "Ugong",
              cityName: complainantCity || "Valenzuela City",
              provinceName: complainantProvince || "NCR, Third District",
            }}
            onChange={(val: PhAddressValue) => {
              setComplainantHouseStreet(val.houseStreet);
              setComplainantBarangay(val.barangayName);
              setComplainantCity(val.cityName);
              setComplainantProvince(val.provinceName);
              setComplainantAddress(
                `${val.houseStreet ? val.houseStreet + ", " : ""}Brgy. ${val.barangayName}, ${val.cityName}, ${val.provinceName}`
              );
            }}
          />
        </div>
      </ComplaintFormSection>

      {/* SECTION: Respondent Information */}
      <ComplaintFormSection title="Respondent Information">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50/60 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="font-medium">
              Per RA 9262, the relationship of the respondent to the complainant
              must be documented.
            </p>
          </div>

          <SearchSelect
            label="Search Resident (Auto-fill)"
            options={respondentResidentOptions}
            value={respondentSearch}
            onChange={(val) => setRespondentSearch(val)}
            onSearchQueryChange={(val) => setRespondentSearch(val)}
            onSelect={handleSelectRespondent}
            placeholder="Type name to search active resident..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={50}
                value={respondentLastName}
                onChange={(e) => setRespondentLastName(e.target.value.slice(0, 50))}
                placeholder="e.g. Santos"
                className={inputCls}
              />
              {validationErrors.respondentLastName && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.respondentLastName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={50}
                value={respondentFirstName}
                onChange={(e) => setRespondentFirstName(e.target.value.slice(0, 50))}
                placeholder="e.g. Pedro"
                className={inputCls}
              />
              {validationErrors.respondentFirstName && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.respondentFirstName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Middle Name (Optional)
              </label>
              <input
                type="text"
                maxLength={50}
                value={respondentMiddleName}
                onChange={(e) => setRespondentMiddleName(e.target.value.slice(0, 50))}
                placeholder="e.g. Reyes"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Number (Optional)
              </label>
              <input
                type="text"
                maxLength={11}
                value={respondentContact}
                onChange={(e) => setRespondentContact(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="09XX XXX XXXX"
                className={inputCls}
              />
              {validationErrors.respondentContact && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.respondentContact}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age (Optional)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                value={respondentAge}
                onChange={(e) => setRespondentAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="Age"
                className={inputCls}
              />
              {validationErrors.respondentAge && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.respondentAge}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={respondentGender}
                onChange={(e) => setRespondentGender(e.target.value)}
                className={inputCls}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relationship to Complainant <span className="text-red-500">*</span>
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className={inputCls}
              >
                <option value="">Select Relationship</option>
                {RELATIONSHIP_OPTIONS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
              {validationErrors.relationship && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.relationship}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Currently Living with Complainant?
              </label>
              <div className="flex items-center gap-6 text-xs font-medium text-slate-700 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="livingWith"
                    value="Yes"
                    checked={currentlyLivingWith === "Yes"}
                    onChange={() => setCurrentlyLivingWith("Yes")}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="livingWith"
                    value="No"
                    checked={currentlyLivingWith === "No"}
                    onChange={() => setCurrentlyLivingWith("No")}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          <PhAddressSelector
            value={{
              houseStreet: respondentHouseStreet || "",
              barangayName: respondentBarangay || "Ugong",
              cityName: respondentCity || "Valenzuela City",
              provinceName: respondentProvince || "NCR, Third District",
            }}
            onChange={(val: PhAddressValue) => {
              setRespondentHouseStreet(val.houseStreet);
              setRespondentBarangay(val.barangayName);
              setRespondentCity(val.cityName);
              setRespondentProvince(val.provinceName);
              setRespondentAddress(
                `${val.houseStreet ? val.houseStreet + ", " : ""}Brgy. ${val.barangayName}, ${val.cityName}, ${val.provinceName}`
              );
            }}
          />
        </div>
      </ComplaintFormSection>

      {/* SECTION: Incident Details */}
      <ComplaintFormSection title="Incident Details">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NatureInputField
              label="Nature of Complaint"
              value={natureOfComplaint}
              onChange={(val) => setNatureOfComplaint(val)}
              required
              error={validationErrors.natureOfComplaint}
              placeholder="Select Nature of Complaint"
              options={VAWC_NATURE_OF_COMPLAINT_OPTIONS}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Frequency of Incident
              </label>
              <select
                value={frequencyOfIncident}
                onChange={(e) => setFrequencyOfIncident(e.target.value)}
                className={inputCls}
              >
                <option value="">Select Frequency</option>
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Incident <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dateOfIncident}
                onChange={(e) => setDateOfIncident(e.target.value)}
                className={inputCls}
              />
              {validationErrors.dateOfIncident && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.dateOfIncident}
                </p>
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
                value={timeOfIncident}
                onChange={(e) => setTimeOfIncident(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Place of Incident <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={150}
                value={placeOfIncident}
                onChange={(e) => setPlaceOfIncident(e.target.value.slice(0, 150))}
                placeholder="e.g. In front of House #45, Purok 3"
                className={inputCls}
              />
              {validationErrors.placeOfIncident && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.placeOfIncident}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <NatureInputField
                label="Type of Violence"
                value={violenceType}
                onChange={(val) => setViolenceType(val)}
                required
                error={validationErrors.violenceType}
                placeholder="Select or type Type of Violence"
                options={VIOLENCE_TYPE_OPTIONS}
                maxLength={150}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description of Injuries / Damages{" "}
                <span className="text-slate-400 font-normal text-[11px] ml-1">
                  (Optional)
                </span>
              </label>
              <input
                type="text"
                maxLength={500}
                value={descriptionOfInjuries}
                onChange={(e) => setDescriptionOfInjuries(e.target.value.slice(0, 500))}
                placeholder="Describe physical injuries, property damages, or financial loss..."
                className={inputCls}
              />
            </div>
          </div>
        </div>
      </ComplaintFormSection>

      {/* SECTION: Danger Assessment */}
      <ComplaintFormSection
        title="Danger Assessment"
        headerExtra={
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px] tracking-wider uppercase">
            OPTIONAL
          </span>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-normal">
            Check all factors that apply to automatically calculate the risk level
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {DANGER_ASSESSMENT_OPTIONS.map((opt) => {
              const checked = checkedDangerFactors.includes(opt.text);

              return (
                <label
                  key={opt.text}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                    checked
                      ? "border-blue-500 bg-blue-50/50 text-slate-900"
                      : "border-slate-200 bg-slate-50/30 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDangerFactor(opt.text)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0 mt-0.5"
                  />
                  <span className="leading-snug">{opt.text}</span>
                </label>
              );
            })}

            <div
              className={`p-3 rounded-xl border text-xs font-medium transition-all md:col-span-2 ${
                otherDangerChecked
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-slate-200 bg-slate-50/30 hover:bg-slate-50"
              }`}
            >
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={otherDangerChecked}
                  onChange={(e) => {
                    setManualRiskLevel(null);
                    setOtherDangerChecked(e.target.checked);
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                />
                <span className="text-slate-800">Other (please specify)</span>
              </label>
              {otherDangerChecked && (
                <input
                  type="text"
                  maxLength={250}
                  value={otherDangerText}
                  onChange={(e) => setOtherDangerText(e.target.value.slice(0, 250))}
                  placeholder="Specify other danger or risk indicator"
                  className={`${inputCls} mt-2.5`}
                />
              )}
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 tracking-wider">
                RISK LEVEL:
              </span>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
                <button
                  type="button"
                  disabled={!isManualRiskAllowed}
                  onClick={() =>
                    isManualRiskAllowed && setManualRiskLevel("LOW")
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    computedRiskLevel === "LOW"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  } ${
                    !isManualRiskAllowed
                      ? "cursor-default"
                      : "cursor-pointer"
                  }`}
                >
                  LOW
                </button>
                <button
                  type="button"
                  disabled={!isManualRiskAllowed}
                  onClick={() =>
                    isManualRiskAllowed && setManualRiskLevel("MODERATE")
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    computedRiskLevel === "MODERATE"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  } ${
                    !isManualRiskAllowed
                      ? "cursor-default"
                      : "cursor-pointer"
                  }`}
                >
                  MODERATE
                </button>
                <button
                  type="button"
                  disabled={!isManualRiskAllowed}
                  onClick={() =>
                    isManualRiskAllowed && setManualRiskLevel("HIGH-IMMINENT")
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    computedRiskLevel === "HIGH-IMMINENT"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  } ${
                    !isManualRiskAllowed
                      ? "cursor-default"
                      : "cursor-pointer"
                  }`}
                >
                  HIGH-IMMINENT
                </button>
              </div>
            </div>

            <div>
              {checkedDangerFactors.length > 0 ? (
                <span className="text-slate-500 text-xs font-medium">
                  Auto-calculated from selected danger factors
                </span>
              ) : otherDangerChecked ? (
                <span className="text-amber-700 text-xs font-medium">
                  Manual selection unlocked for other specified reason
                </span>
              ) : (
                <span className="text-slate-400 text-xs font-medium">
                  Default: LOW (No danger factors selected)
                </span>
              )}
            </div>
          </div>
        </div>
      </ComplaintFormSection>

      {/* SECTION: Children Involved */}
      <ComplaintFormSection
        title="Children Involved"
        headerExtra={
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px] tracking-wider uppercase">
            OPTIONAL
          </span>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Are there children affected/who witnessed the incident?
            </p>
            <div className="flex items-center gap-6 text-xs font-medium text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="hasChildren"
                  value="Yes"
                  checked={hasChildrenInvolved === "Yes"}
                  onChange={() => setHasChildrenInvolved("Yes")}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                Yes
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="hasChildren"
                  value="No"
                  checked={hasChildrenInvolved === "No"}
                  onChange={() => setHasChildrenInvolved("No")}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                No
              </label>
            </div>
          </div>

          {hasChildrenInvolved === "Yes" && (
            <div className="space-y-3 pt-2">
              {childrenRows.map((child) => (
                <div
                  key={child.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 relative grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={child.firstName}
                      onChange={(e) =>
                        updateChildRow(child.id, "firstName", e.target.value.slice(0, 50))
                      }
                      placeholder="First name"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={child.middleName}
                      onChange={(e) =>
                        updateChildRow(child.id, "middleName", e.target.value.slice(0, 50))
                      }
                      placeholder="Middle name"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={child.lastName}
                      onChange={(e) =>
                        updateChildRow(child.id, "lastName", e.target.value.slice(0, 50))
                      }
                      placeholder="Last name"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Suffix
                    </label>
                    <select
                      value={child.suffix}
                      onChange={(e) =>
                        updateChildRow(child.id, "suffix", e.target.value)
                      }
                      className={inputCls}
                    >
                      <option value="">None</option>
                      <option value="Jr.">Jr.</option>
                      <option value="Sr.">Sr.</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                      <option value="V">V</option>
                      <option value="VI">VI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Age
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      value={child.age}
                      onChange={(e) =>
                        updateChildRow(child.id, "age", e.target.value.replace(/\D/g, "").slice(0, 3))
                      }
                      placeholder="Age"
                      className={inputCls}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <NatureInputField
                        label="Role"
                        value={child.role}
                        onChange={(val) => updateChildRow(child.id, "role", val)}
                        placeholder="Select or type Role"
                        options={CHILD_ROLE_OPTIONS}
                        maxLength={50}
                        labelClassName="block text-[11px] font-semibold text-slate-700 mb-1"
                        direction="auto"
                      />
                    </div>

                    {childrenRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChildRow(child.id)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer mt-5"
                        title="Remove child"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addChildRow}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors pt-1"
              >
                <Plus size={14} /> Add Child
              </button>
            </div>
          )}
        </div>
      </ComplaintFormSection>

      {/* SECTION: Method of Filing */}
      <ComplaintFormSection
        title="Method of Filing"
        headerExtra={
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px] tracking-wider uppercase">
            OPTIONAL
          </span>
        }
      >
        <div className="space-y-3">
          <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="filingMethod"
              value="ORAL_REPORT_ONLY"
              checked={filingMethod === "ORAL_REPORT_ONLY"}
              onChange={() => setFilingMethod("ORAL_REPORT_ONLY")}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            Oral report only
          </label>

          <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="filingMethod"
              value="WITH_WRITTEN_SWORN_STATEMENT"
              checked={filingMethod === "WITH_WRITTEN_SWORN_STATEMENT"}
              onChange={() => setFilingMethod("WITH_WRITTEN_SWORN_STATEMENT")}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            With written/sworn statement
          </label>
        </div>
      </ComplaintFormSection>

      {/* SECTION: Narrative / Sworn Statement */}
      <ComplaintFormSection
        title={
          filingMethod === "ORAL_REPORT_ONLY"
            ? "Narrative / Statement of Facts (Required for Oral Report)"
            : "Narrative / Sworn Statement (Required)"
        }
      >
        <ComplaintFileUpload
          file={narrativeFile}
          onFileSelect={setNarrativeFile}
          statementText={narrativeSummary}
          onStatementTextChange={setNarrativeSummary}
          filingMethod={filingMethod}
          error={validationErrors.narrative}
        />
      </ComplaintFormSection>

      {/* SECTION: Evidence Provided */}
      <ComplaintFormSection title="Evidence Provided (Optional)">
        <ComplaintEvidenceGrid
          selectedIds={selectedEvidenceIds}
          onChange={setSelectedEvidenceIds}
          evidenceFiles={evidenceFiles}
          onFileUpload={(id, file) =>
            setEvidenceFiles((prev) => ({ ...prev, [id]: file }))
          }
          otherText={otherEvidenceText}
          onOtherTextChange={setOtherEvidenceText}
        />
      </ComplaintFormSection>

      {/* SECTION: Witnesses */}
      <ComplaintFormSection title="Witnesses (Optional)">
        <ComplaintWitnessSection
          witnesses={witnesses}
          onWitnessesChange={setWitnesses}
          currentComplainantName={`${complainantFirstName} ${complainantLastName}`.trim()}
          currentRespondentName={`${respondentFirstName} ${respondentLastName}`.trim()}
        />
      </ComplaintFormSection>

      {/* SECTION: Complainant's Immediate Request */}
      <ComplaintFormSection
        title="Complainant's Immediate Request"
        headerExtra={
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px] tracking-wider uppercase">
            OPTIONAL
          </span>
        }
      >
        <div className="space-y-3">
          {[
            "Record only for now",
            "Requesting a barangay protection order (BPO)",
            "Intends to file a criminal complaint",
          ].map((req) => {
            const checked = immediateRequests.includes(req);
            return (
              <label
                key={req}
                onClick={() => toggleImmediateRequest(req)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  checked
                    ? "border-blue-500 bg-blue-50/50 text-slate-900 shadow-xs"
                    : "border-slate-200 bg-slate-50/30 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="immediateRequest"
                  checked={checked}
                  onChange={() => {}}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                />
                <span>{req}</span>
              </label>
            );
          })}
        </div>
      </ComplaintFormSection>

      {/* SECTION: Certification */}
      <ComplaintFormSection title="Certification">
        <div
          onClick={() => setIsCertified(!isCertified)}
          className={`flex items-start gap-3.5 p-4 rounded-xl border text-xs transition-all cursor-pointer ${
            isCertified
              ? "border-blue-500 bg-blue-50/40 text-slate-900"
              : "border-slate-200 bg-slate-50/40 text-slate-700 hover:border-slate-300"
          }`}
        >
          <input
            type="checkbox"
            checked={isCertified}
            onChange={(e) => setIsCertified(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5 shrink-0 cursor-pointer"
          />
          <p className="leading-relaxed font-normal text-[11px] sm:text-xs">
            I hereby certify that the above information is true and correct to
            the best of my knowledge and belief. I understand that any false
            statement made herein may subject me to the penalties prescribed by
            law. I am voluntarily executing this complaint and authorize the
            Barangay to take appropriate action in accordance with RA 9262
            (Anti-Violence Against Women and Their Children Act).
          </p>
        </div>
        {validationErrors.certification && (
          <p className="text-[11px] text-red-500 mt-1.5 font-medium">
            {validationErrors.certification}
          </p>
        )}
      </ComplaintFormSection>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Filing VAWC
              Complaint...
            </>
          ) : (
            <>
              <FileCheck size={14} /> File VAWC Complaint
            </>
          )}
        </button>
      </div>
    </form>
  );
}
export default VawcComplaintForm;
