import React, { useState, useEffect, useMemo } from "react";
import {
  FileCheck,
  Plus,
  Loader2,
} from "lucide-react";
import { ComplaintFormSection } from "./ComplaintFormSection";
import { ComplaintEvidenceGrid } from "./ComplaintEvidenceGrid";
import { ComplaintWitnessSection } from "./ComplaintWitnessSection";
import { ComplaintFileUpload } from "./ComplaintFileUpload";
import { CertificationConsentCard } from "./CertificationConsentCard";
import type { WitnessData } from "./types";
import { SearchSelect, type SearchSelectOption } from "@/components/ui/SearchSelect";
import { officersApi, type OfficerOption } from "@/config/api/modules/officers.api";
import {
  residentsApi,
  type ResidentSearchOption,
} from "@/config/api/modules/residents.api";
import { userService } from "@/config/api/users/users.service";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { PermissionDeniedPage } from "@/components/ui/PermissionDeniedPage";
import {
  bcpcApi,
  fileToBase64,
  type BcpcCategory,
  type CarActCategory,
  type SpecificCarAct,
  type CarOccurrenceCategory,
  type DiscernmentStatus,
  type PenaltyRoutingCategory,
  type DiversionAuthority,
  type BcpcCarCaseCreateRequest,
  type BcpcCiclCaseCreateRequest,
} from "@/config/api/modules/bcpc.api";

export interface BcpcComplaintFormProps {
  onSubmitSuccess?: (response: any) => void;
  onSubmitError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

export const EVIDENCE_CHECKBOX_ITEMS = [
  { id: "tanod_report", label: "Barangay / Tanod Incident Report" },
  { id: "school_referral", label: "School Report / Referral" },
  { id: "police_referral", label: "Police / Agency Referral" },
  { id: "written_statement", label: "Written Statement" },
  { id: "witness_statement", label: "Witness Statement" },
  { id: "photo_video", label: "Photo / Video" },
  { id: "cctv_footage", label: "CCTV Footage" },
  { id: "medical_cert", label: "Medical Certificate / Medical Record" },
  { id: "ordinance_citation", label: "Copy of Ordinance / Citation" },
  { id: "digital_screenshot", label: "Digital Message / Screenshot" },
];

export const CAR_ACT_CATEGORY_OPTIONS: { value: CarActCategory; label: string }[] = [
  { value: "JUVENILE_STATUS_OFFENSE", label: "Juvenile Status Offense (Chapter V, RA 9344)" },
  { value: "LIGHT_OFFENSE_MISDEMEANOR", label: "Light Offense / Misdemeanor" },
  { value: "OFFENSE_NOT_APPLICABLE_TO_CHILDREN", label: "Offense Not Applicable to Children" },
  { value: "CHILD_PROTECTION_VULNERABILITY", label: "Child Protection / Vulnerability Issue" },
];

export const SPECIFIC_CAR_ACT_MAP: Record<CarActCategory, { value: SpecificCarAct; label: string }[]> = {
  JUVENILE_STATUS_OFFENSE: [
    { value: "CURFEW_VIOLATION", label: "Curfew Violation" },
    { value: "TRUANCY", label: "Truancy" },
    { value: "RUNAWAY", label: "Runaway" },
    { value: "PARENTAL_DISOBEDIENCE", label: "Parental Disobedience" },
    { value: "ANTI_SMOKING_VIOLATION", label: "Smoking / Vaping in Public" },
    { value: "ANTI_DRINKING_VIOLATION", label: "Alcohol Consumption" },
    { value: "GAMBLING", label: "Gambling" },
    { value: "OTHER_JUVENILE_STATUS_OFFENSE", label: "Other Juvenile Status Offense" },
  ],
  LIGHT_OFFENSE_MISDEMEANOR: [
    { value: "DISORDERLY_CONDUCT", label: "Disorderly Conduct" },
    { value: "PUBLIC_SCANDAL", label: "Alarm and Scandal" },
    { value: "VANDALISM", label: "Minor Graffiti / Vandalism" },
    { value: "PETTY_THEFT", label: "Petty Theft" },
    { value: "TRESPASSING", label: "Trespassing" },
    { value: "HARASSMENT", label: "Harassment / Light Unjust Vexation" },
    { value: "PUBLIC_DISTURBANCE", label: "Public Disturbance / Noise" },
    { value: "PUBLIC_URINATION", label: "Public Urination" },
    { value: "LITTERING", label: "Littering" },
    { value: "DRUNKENNESS", label: "Drunkenness / Public Intoxication" },
    { value: "PHYSICAL_INJURIES_SLIGHT", label: "Slight Physical Injuries" },
    { value: "OTHER_LIGHT_OFFENSE", label: "Other Light Misdemeanor / Ordinance Violation" },
  ],
  OFFENSE_NOT_APPLICABLE_TO_CHILDREN: [
    { value: "MENDICANCY_EXEMPT", label: "Mendicancy / Begging (Decriminalized for Minors)" },
    { value: "SNIFFING_RUGBY_EXEMPT", label: "Solvent / Rugby / Glue Sniffing (Decriminalized)" },
    { value: "VAGRANCY", label: "Vagrancy (Decriminalized for Minors)" },
    { value: "PROSTITUTION_EXEMPT_ACT", label: "Prostitution-Exempt Act (Protected Victim)" },
    { value: "OTHER_NOT_APPLICABLE", label: "Other Decriminalized / Exclusively Minor Offense" },
  ],
  CHILD_PROTECTION_VULNERABILITY: [
    { value: "CHILD_ABUSE_VICTIM", label: "Victim of Physical / Emotional Child Abuse" },
    { value: "CHILD_EXPLOITATION_VICTIM", label: "Victim of Child Labor / Exploitation" },
    { value: "ABANDONED_OR_NEGLECTED", label: "Abandoned or Neglected Child" },
    { value: "STREET_CHILD", label: "Street Child / Living in the Street" },
    { value: "RUNAWAY", label: "Runaway / Living Away from Family" },
    { value: "OTHER_CHILD_PROTECTION", label: "Other Child Protection / Vulnerability Issue" },
  ],
};

export const GUARDIAN_UNAVAILABLE_REASONS = [
  "Parent / Guardian is deceased",
  "Parent / Guardian cannot be located / Abandoned child",
  "Parent / Guardian is working overseas (OFW) or out of town",
  "Parent / Guardian is incapacitated / Medically unable",
  "Parent / Guardian is incarcerated / In detention",
  "Parent / Guardian refused to appear or participate",
  "Child ran away from home and guardian is unknown",
  "Other Reason",
];

export const REPORTER_ROLES = [
  "Parent / Legal Guardian",
  "Barangay Official / Tanod",
  "Teacher / School Authority",
  "Concerned Citizen / Neighbor",
  "Social Worker / NGO Worker",
  "Law Enforcement Officer",
  "Victim / Offended Party",
  "Other",
];

export const RELATIONSHIPS_TO_CHILD = [
  "Mother",
  "Father",
  "Grandparent (Lolo/Lola)",
  "Aunt / Uncle (Tita/Tito)",
  "Sibling (Brother/Sister)",
  "Legal Guardian",
  "Teacher / Counselor",
  "Neighbor / Concerned Citizen",
  "Law Enforcer / Tanod",
  "No Relation / None",
  "Other",
];

export const GRADE_LEVELS = [
  "Not in School / Out of School Youth",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7 (Junior High)",
  "Grade 8 (Junior High)",
  "Grade 9 (Junior High)",
  "Grade 10 (Junior High)",
  "Grade 11 (Senior High)",
  "Grade 12 (Senior High)",
  "College / Vocational",
];

export const CICL_OFFENSE_OPTIONS = [
  "Theft",
  "Robbery",
  "Physical Injuries (Slight / Serious)",
  "Malicious Mischief (Property Damage)",
  "Curfew / Local Ordinance Violation",
  "Alarm and Scandal / Public Disturbance",
  "Vandalism / Graffiti",
  "Trespassing",
  "Illegal Possession of Bladed Weapon / Firearms",
  "Illegal Possession / Use of Dangerous Drugs (RA 9165)",
  "Snatching / Pickpocketing",
  "Estafa / Swindling",
  "Qualified Theft",
  "Sexual Assault / Act of Lasciviousness / Rape",
  "Homicide / Murder",
  "Other",
];


const inputCls =
  "w-full px-3.5 py-2.5 text-xs border border-slate-200 focus:border-blue-400 rounded-xl outline-none focus:outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white";

const sanitizeName = (val: string) => val.replace(/[^a-zA-ZñÑ\s.'-]/g, "");
const sanitizePhone = (val: string) => val.replace(/[^0-9+]/g, "");
const NAME_REGEX = /^[a-zA-ZñÑ\s.'-]+$/;
const PHILIPPINE_MOBILE_REGEX = /^(09|\+639)\d{9}$/;

export function BcpcComplaintForm({
  onSubmitSuccess,
  onSubmitError,
  onCancel,
  className = "",
}: BcpcComplaintFormProps) {
  const { user } = useAuth();

  // ---------------------------------------------------------------------------
  // SECTION: CASE OVERVIEW & ASSIGNMENT
  // ---------------------------------------------------------------------------
  const [classification, setClassification] = useState<BcpcCategory>("CAR");
  const [caseNumber, setCaseNumber] = useState<string>("");
  const [assignedOfficerId, setAssignedOfficerId] = useState<number | null>(null);
  const [assignedOfficerName, setAssignedOfficerName] = useState<string>("");
  const [officerOptions, setOfficerOptions] = useState<OfficerOption[]>([]);
  const [officerFullName, setOfficerFullName] = useState<string>("");

  // Sync Logged-in Officer's Real Full Name
  useEffect(() => {
    if (user?.firstName && user?.lastName) {
      setOfficerFullName(`${user.firstName} ${user.lastName}`.trim());
      return;
    }

    const localFirst = localStorage.getItem("firstName");
    const localLast = localStorage.getItem("lastName");
    if (localFirst && localLast) {
      setOfficerFullName(`${localFirst} ${localLast}`.trim());
      return;
    }

    try {
      const savedProfile = sessionStorage.getItem("user_profile");
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.firstName && p.lastName) {
          setOfficerFullName(`${p.firstName} ${p.lastName}`.trim());
          return;
        }
      }
    } catch {}

    userService
      .getCurrentUserDetail()
      .then((details) => {
        const pFirst = details?.personInfo?.firstName;
        const pLast = details?.personInfo?.lastName;
        if (pFirst && pLast) {
          setOfficerFullName(`${pFirst} ${pLast}`.trim());
        }
      })
      .catch(() => {});
  }, [user]);

  const receivingOfficerDisplayName = useMemo(() => {
    if (officerFullName) return officerFullName;
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`.trim();
    }
    const localFirst = localStorage.getItem("firstName");
    const localLast = localStorage.getItem("lastName");
    if (localFirst && localLast) {
      return `${localFirst} ${localLast}`.trim();
    }
    if (officerOptions.length > 0 && user?.username) {
      const u = user.username.toLowerCase();
      const match = officerOptions.find(
        (o) =>
          (o.name && o.name.toLowerCase().includes(u)) ||
          u.includes((o.name || "").toLowerCase())
      );
      if (match) return match.name;
    }
    return "Hannah Masangkay";
  }, [officerFullName, user, officerOptions]);

  // Dates and Timestamps matching Blotter
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const timeFormatted = useMemo(() => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Fetch Officers (Filter for OVERALL and BCPC departments only)
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const res = await officersApi.getActiveOfficers();
        if (res && Array.isArray(res)) {
          const bcpcOfficers = res.filter((o) => {
            const dept = (o.departmentName || "").toUpperCase();
            const pos = (o.position || "").toUpperCase();
            // Strictly exclude BLOTTER, VAWC, and LUPON officers
            if (dept.includes("BLOTTER") || dept.includes("VAWC") || dept.includes("LUPON")) {
              return false;
            }
            return (
              dept.includes("OVERALL") ||
              dept.includes("BCPC") ||
              dept.includes("DCPC") ||
              pos.includes("BCPC") ||
              pos.includes("DCPC") ||
              pos.includes("PUNONG BARANGAY")
            );
          });
          setOfficerOptions(bcpcOfficers);
        }
      } catch {
        // Fallback
      }
    };
    fetchOfficers();

    // Generate BCPC Case Number
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
    setCaseNumber(`2026-BCPC-${randomSuffix}`);
  }, []);

  // ---------------------------------------------------------------------------
  // SECTION: REPORTING PERSON (CAR) / VICTIM (CICL)
  // ---------------------------------------------------------------------------
  const [c1Search, setC1Search] = useState("");
  const [c1ResidentOptions, setC1ResidentOptions] = useState<SearchSelectOption[]>([]);
  const [c1ResidentId, setC1ResidentId] = useState<number | null>(null);
  const [c1PersonId, setC1PersonId] = useState<number | null>(null);
  const [c1FirstName, setC1FirstName] = useState("");
  const [c1MiddleName, setC1MiddleName] = useState("");
  const [c1LastName, setC1LastName] = useState("");
  const [c1Contact, setC1Contact] = useState("");
  const [c1Address, setC1Address] = useState("");
  const [c1Age, setC1Age] = useState<number | undefined>(undefined);
  const [c1Gender, setC1Gender] = useState("");
  const [c1CivilStatus, setC1CivilStatus] = useState("");
  const [c1Email, setC1Email] = useState("");
  const [c1BirthDate, setC1BirthDate] = useState("");
  const [c1Role, setC1Role] = useState("");
  const [c1RoleOther, setC1RoleOther] = useState("");
  const [c1RelationshipToChild, setC1RelationshipToChild] = useState("");
  const [c1RelationshipToChildOther, setC1RelationshipToChildOther] = useState("");
  const [isVictimless, setIsVictimless] = useState(false);

  // Search C1 Residents
  useEffect(() => {
    const query = c1Search.trim();
    if (!query) {
      setC1ResidentOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await residentsApi.searchActive(query);
        if (Array.isArray(results)) {
          setC1ResidentOptions(
            results.map((r) => ({
              id: String(r.id),
              label: r.fullName || `${r.firstName} ${r.lastName}`,
              description: `${r.contactNumber || "No contact"} • ${r.completeAddress || "Brgy. Ugong"}`,
              data: r,
            }))
          );
        }
      } catch {
        setC1ResidentOptions([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [c1Search]);

  const handleSelectC1Resident = (opt: SearchSelectOption) => {
    if (opt.data) {
      const r = opt.data as ResidentSearchOption;
      setC1ResidentId(r.id);
      setC1PersonId(r.personId);
      setC1FirstName(r.firstName || "");
      setC1MiddleName(r.middleName || "");
      setC1LastName(r.lastName || "");
      setC1Contact(r.contactNumber || "");
      setC1Address(r.completeAddress || "");
      setC1Age(r.age !== undefined && r.age !== null ? Number(r.age) : undefined);
      setC1Gender(r.gender || "");
      setC1CivilStatus(r.civilStatus || "");
      setC1Email(r.email || "");
      setC1BirthDate(r.birthDate || (r as any).birthday || "");
      setC1Search(r.fullName);
      clearError("c1LastName");
      clearError("c1FirstName");
      clearError("c1Address");
    }
  };

  // ---------------------------------------------------------------------------
  // SECTION: CHILD INFORMATION
  // ---------------------------------------------------------------------------
  const [childSearch, setChildSearch] = useState("");
  const [childResidentOptions, setChildResidentOptions] = useState<SearchSelectOption[]>([]);
  const [childResidentId, setChildResidentId] = useState<number | null>(null);
  const [childPersonId, setChildPersonId] = useState<number | null>(null);
  const [childFirstName, setChildFirstName] = useState("");
  const [childMiddleName, setChildMiddleName] = useState("");
  const [childLastName, setChildLastName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childBirthday, setChildBirthday] = useState("");
  const [childGender, setChildGender] = useState("");
  const [childGrade, setChildGrade] = useState("");
  const [childSchool, setChildSchool] = useState("");
  const [childContact, setChildContact] = useState("");
  const [childAddress, setChildAddress] = useState("");

  const formatBirthDate = (raw: any): string => {
    if (!raw) return "";
    // If array: [year, month, day]
    if (Array.isArray(raw) && raw.length >= 3) {
      const y = String(raw[0]).padStart(4, "0");
      const m = String(raw[1]).padStart(2, "0");
      const d = String(raw[2]).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    // If object: { year, monthValue, dayOfMonth } or { year, month, day }
    if (typeof raw === "object" && raw !== null) {
      const y = raw.year || raw.y;
      const m = raw.monthValue || (typeof raw.month === "number" ? raw.month : undefined) || raw.m;
      const d = raw.dayOfMonth || raw.day || raw.d;
      if (y && m && d) {
        return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
    const str = String(raw).trim();
    if (str.includes("T")) {
      return str.split("T")[0];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    // Check YYYY/MM/DD or MM/DD/YYYY or DD/MM/YYYY
    const slashParts = str.split(/[/-]/);
    if (slashParts.length === 3) {
      if (slashParts[0].length === 4) {
        return `${slashParts[0]}-${slashParts[1].padStart(2, "0")}-${slashParts[2].padStart(2, "0")}`;
      }
      if (slashParts[2].length === 4) {
        const y = slashParts[2];
        const p1 = parseInt(slashParts[0], 10);
        const p2 = parseInt(slashParts[1], 10);
        if (p1 > 12) {
          return `${y}-${String(p2).padStart(2, "0")}-${String(p1).padStart(2, "0")}`;
        } else {
          return `${y}-${String(p1).padStart(2, "0")}-${String(p2).padStart(2, "0")}`;
        }
      }
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    return "";
  };

  const calculateAgeFromDateString = (bday: string): number => {
    if (!bday) return -1;
    const bDate = new Date(bday);
    if (isNaN(bDate.getTime())) return -1;
    const now = new Date();
    let computed = now.getFullYear() - bDate.getFullYear();
    const m = now.getMonth() - bDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < bDate.getDate())) {
      computed--;
    }
    return computed >= 0 ? computed : -1;
  };

  const isChildResident = (r: ResidentSearchOption): boolean => {
    if (r.age !== undefined && r.age !== null) {
      const num = Number(r.age);
      if (!isNaN(num)) {
        return num >= 0 && num <= 17;
      }
    }
    const rawDob = (r as any).birthDate || (r as any).birthday || (r as any).dateOfBirth;
    if (rawDob) {
      const formatted = formatBirthDate(rawDob);
      const computedAge = calculateAgeFromDateString(formatted);
      if (computedAge >= 0) {
        return computedAge <= 17;
      }
    }
    return false;
  };

  // Search Child Residents (Strictly 17 years old and below for BCPC)
  useEffect(() => {
    const query = childSearch.trim();
    if (!query) {
      setChildResidentOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await residentsApi.searchActive(query);
        if (Array.isArray(results)) {
          const childOnlyResults = results.filter(isChildResident);
          setChildResidentOptions(
            childOnlyResults.map((r) => ({
              id: String(r.id),
              label: r.fullName || `${r.firstName} ${r.lastName}`,
              description: `Age: ${r.age ?? "N/A"} • ${r.completeAddress || "Brgy. Ugong"}`,
              data: r,
            }))
          );
        }
      } catch {
        setChildResidentOptions([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [childSearch]);

  const handleSelectChildResident = (opt: SearchSelectOption) => {
    if (opt.data) {
      const r = opt.data as ResidentSearchOption;
      setChildResidentId(r.id);
      setChildPersonId(r.personId);
      setChildFirstName(r.firstName || "");
      setChildMiddleName(r.middleName || "");
      setChildLastName(r.lastName || "");
      setChildContact(r.contactNumber || "");
      setChildAddress(r.completeAddress || "");
      setChildSearch(r.fullName || opt.label);
      if (r.age !== undefined && r.age !== null) setChildAge(String(r.age));
      if (r.gender) setChildGender(r.gender);

      const rawDob =
        (r as any).birthDate ||
        (r as any).birthday ||
        (r as any).dateOfBirth ||
        (r as any).person?.birthDate;
      const formattedDob = formatBirthDate(rawDob);
      if (formattedDob) {
        setChildBirthday(formattedDob);
        clearError("childBirthday");
        if (r.age === undefined || r.age === null) {
          const computedAge = calculateAgeFromDateString(formattedDob);
          if (computedAge >= 0) {
            setChildAge(String(computedAge));
            clearError("childAge");
          }
        }
      } else if (r.id || r.personId) {
        const lookupId = r.id || r.personId;
        residentsApi.getDetails(lookupId).then((details) => {
          const fallbackDob =
            details?.personInfo?.birthDate ||
            details?.data?.personInfo?.birthDate ||
            details?.birthDate ||
            details?.birthday ||
            details?.dateOfBirth;
          const parsed = formatBirthDate(fallbackDob);
          if (parsed) {
            setChildBirthday(parsed);
            clearError("childBirthday");
            if (r.age === undefined || r.age === null) {
              const computedAge = calculateAgeFromDateString(parsed);
              if (computedAge >= 0) {
                setChildAge(String(computedAge));
                clearError("childAge");
              }
            }
          } else if (r.age !== undefined && r.age !== null && Number(r.age) >= 0) {
            // Fallback estimation from age if birthDate wasn't provided in DB
            const estYear = new Date().getFullYear() - Number(r.age);
            const estBday = `${estYear}-01-01`;
            setChildBirthday(estBday);
            clearError("childBirthday");
          }
        }).catch(() => {
          if (r.age !== undefined && r.age !== null && Number(r.age) >= 0) {
            const estYear = new Date().getFullYear() - Number(r.age);
            const estBday = `${estYear}-01-01`;
            setChildBirthday(estBday);
            clearError("childBirthday");
          }
        });
      } else if (r.age !== undefined && r.age !== null && Number(r.age) >= 0) {
        const estYear = new Date().getFullYear() - Number(r.age);
        const estBday = `${estYear}-01-01`;
        setChildBirthday(estBday);
        clearError("childBirthday");
      }

      setChildSearch(r.fullName);
      clearError("childLastName");
      clearError("childFirstName");
      clearError("childAge");
      clearError("childGender");
      clearError("childAddress");
    }
  };

  const handleBirthdayChange = (bday: string) => {
    setChildBirthday(bday);
    clearError("childBirthday");
    if (bday) {
      const computed = calculateAgeFromDateString(bday);
      if (computed >= 0) {
        setChildAge(String(computed));
        clearError("childAge");
      }
    }
  };

  // ---------------------------------------------------------------------------
  // SECTION: PARENT / GUARDIAN
  // ---------------------------------------------------------------------------
  const [isGuardianUnavailable, setIsGuardianUnavailable] = useState(false);
  const [guardianSearch, setGuardianSearch] = useState("");
  const [guardianResidentOptions, setGuardianResidentOptions] = useState<SearchSelectOption[]>([]);
  const [guardianResidentId, setGuardianResidentId] = useState<number | null>(null);
  const [guardianPersonId, setGuardianPersonId] = useState<number | null>(null);
  const [guardianFirstName, setGuardianFirstName] = useState("");
  const [guardianMiddleName, setGuardianMiddleName] = useState("");
  const [guardianLastName, setGuardianLastName] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [guardianRelationshipOther, setGuardianRelationshipOther] = useState("");
  const [guardianAddress, setGuardianAddress] = useState("");
  const [guardianUnavailableReason, setGuardianUnavailableReason] = useState("");
  const [guardianUnavailableReasonOther, setGuardianUnavailableReasonOther] = useState("");
  const [guardianUnavailableNotes, setGuardianUnavailableNotes] = useState("");

  useEffect(() => {
    const query = guardianSearch.trim();
    if (!query) {
      setGuardianResidentOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await residentsApi.searchActive(query);
        if (Array.isArray(results)) {
          setGuardianResidentOptions(
            results.map((r) => ({
              id: String(r.id),
              label: r.fullName || `${r.firstName} ${r.lastName}`,
              description: `${r.contactNumber || "No contact"} • ${r.completeAddress || "Brgy. Ugong"}`,
              data: r,
            }))
          );
        }
      } catch {
        setGuardianResidentOptions([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [guardianSearch]);

  const handleSelectGuardianResident = (opt: SearchSelectOption) => {
    if (opt.data) {
      const r = opt.data as ResidentSearchOption;
      setGuardianResidentId(r.id);
      setGuardianPersonId(r.personId);
      setGuardianFirstName(r.firstName || "");
      setGuardianMiddleName(r.middleName || "");
      setGuardianLastName(r.lastName || "");
      setGuardianContact(r.contactNumber || "");
      setGuardianAddress(r.completeAddress || "");
      setGuardianSearch(r.fullName);
      clearError("guardianLastName");
      clearError("guardianFirstName");
    }
  };

  // ---------------------------------------------------------------------------
  // SECTION: INCIDENT DETAILS
  // ---------------------------------------------------------------------------
  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [incidentTime, setIncidentTime] = useState<string>("");
  const [incidentPlace, setIncidentPlace] = useState<string>("");
  const [incidentDetails, setIncidentDetails] = useState<string>("");

  // CAR specific fields
  const [carActCategory, setCarActCategory] = useState<CarActCategory | "">("");
  const [specificCarAct, setSpecificCarAct] = useState<SpecificCarAct | "">("");
  const [specificCarActOther, setSpecificCarActOther] = useState("");
  const [carOccurrence, setCarOccurrence] = useState<CarOccurrenceCategory | "">("");
  const [hasSafetyConcerns, setHasSafetyConcerns] = useState<boolean | null>(null);
  const [safetyNotes, setSafetyNotes] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // CICL specific fields
  const [allegedViolation, setAllegedViolation] = useState("");
  const [allegedViolationOther, setAllegedViolationOther] = useState("");
  const [discernmentStatus, setDiscernmentStatus] = useState<DiscernmentStatus | "">("");
  const [penaltyRouting, setPenaltyRouting] = useState<PenaltyRoutingCategory | "">("");
  const [diversionAuthority, setDiversionAuthority] = useState<DiversionAuthority | "">("");
  const [admittedOffense, setAdmittedOffense] = useState<boolean | null>(null);
  const [isRepeatOffender, setIsRepeatOffender] = useState<boolean | null>(null);
  const [apprehendingOfficerName, setApprehendingOfficerName] = useState("");
  const [apprehendingOfficerOffice, setApprehendingOfficerOffice] = useState("");

  // ---------------------------------------------------------------------------
  // SECTION: NARRATIVE
  // ---------------------------------------------------------------------------
  const [narrativeFile, setNarrativeFile] = useState<File | null>(null);
  const [narrativeText, setNarrativeText] = useState("");

  // ---------------------------------------------------------------------------
  // SECTION: EVIDENCE
  // ---------------------------------------------------------------------------
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<Record<string, File | null>>({});
  const [evidenceOtherText, setEvidenceOtherText] = useState("");


  // ---------------------------------------------------------------------------
  // SECTION: WITNESSES
  // ---------------------------------------------------------------------------
  const [witnesses, setWitnesses] = useState<WitnessData[]>([]);

  // ---------------------------------------------------------------------------
  // SECTION: CERTIFICATION
  // ---------------------------------------------------------------------------
  const [isCertified, setIsCertified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const getFieldCls = (fieldKey: string) =>
    `${inputCls} ${
      errors[fieldKey] ? "border-red-300 focus:border-red-400 bg-red-50/20" : ""
    }`;

  // Field validation on blur
  const validateNameField = (
    fieldKey: string,
    value: string,
    required: boolean,
    fieldName: string
  ) => {
    const val = value.trim();
    if (required && !val) {
      setErrors((prev) => ({ ...prev, [fieldKey]: `${fieldName} is required` }));
      return;
    }
    if (val) {
      if (val.length < 2) {
        setErrors((prev) => ({
          ...prev,
          [fieldKey]: "Minimum 2 characters required",
        }));
        return;
      }
      if (val.length > 50) {
        setErrors((prev) => ({
          ...prev,
          [fieldKey]: "Maximum 50 characters allowed",
        }));
        return;
      }
      if (!NAME_REGEX.test(val)) {
        setErrors((prev) => ({
          ...prev,
          [fieldKey]: "Name cannot contain numbers or special characters",
        }));
        return;
      }
    }
    clearError(fieldKey);
  };

  const validatePhoneField = (fieldKey: string, value: string) => {
    const val = value.trim();
    if (val && !PHILIPPINE_MOBILE_REGEX.test(val)) {
      setErrors((prev) => ({
        ...prev,
        [fieldKey]: "Enter a valid 11-digit mobile number (e.g. 09XXXXXXXXX)",
      }));
    } else {
      clearError(fieldKey);
    }
  };

  // Form Validation matching Blotter
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!assignedOfficerId && !assignedOfficerName) {
      newErrors.assignedOfficer = "Assigned Officer is required";
    }

    if (classification === "CAR" || !isVictimless) {
      if (!c1LastName.trim()) {
        newErrors.c1LastName =
          classification === "CAR"
            ? "Reporter Last Name is required"
            : "Victim Last Name is required";
      } else if (c1LastName.trim().length < 2) {
        newErrors.c1LastName = "Minimum 2 characters required";
      } else if (c1LastName.trim().length > 50) {
        newErrors.c1LastName = "Maximum 50 characters allowed";
      } else if (!NAME_REGEX.test(c1LastName.trim())) {
        newErrors.c1LastName = "Name cannot contain numbers or special characters";
      }

      if (!c1FirstName.trim()) {
        newErrors.c1FirstName =
          classification === "CAR"
            ? "Reporter First Name is required"
            : "Victim First Name is required";
      } else if (c1FirstName.trim().length < 2) {
        newErrors.c1FirstName = "Minimum 2 characters required";
      } else if (c1FirstName.trim().length > 50) {
        newErrors.c1FirstName = "Maximum 50 characters allowed";
      } else if (!NAME_REGEX.test(c1FirstName.trim())) {
        newErrors.c1FirstName = "Name cannot contain numbers or special characters";
      }

      if (c1MiddleName.trim()) {
        if (c1MiddleName.trim().length > 50) {
          newErrors.c1MiddleName = "Maximum 50 characters allowed";
        } else if (!NAME_REGEX.test(c1MiddleName.trim())) {
          newErrors.c1MiddleName = "Name cannot contain numbers or special characters";
        }
      }

      if (c1Contact.trim() && !PHILIPPINE_MOBILE_REGEX.test(c1Contact.trim())) {
        newErrors.c1Contact = "Enter a valid 11-digit mobile number (e.g. 09XXXXXXXXX)";
      }

      if (!c1Address.trim()) {
        newErrors.c1Address = "Complete Address is required";
      } else if (c1Address.trim().length > 100) {
        newErrors.c1Address = "Maximum 100 characters allowed";
      }

      if (classification === "CAR") {
        if (!c1Role) {
          newErrors.c1Role = "Reporter Role in Case is required";
        } else if (c1Role === "Other" && !c1RoleOther.trim()) {
          newErrors.c1RoleOther = "Please specify the reporter role";
        }
      }

      if (!c1RelationshipToChild) {
        newErrors.c1RelationshipToChild = "Relationship to Child is required";
      } else if (c1RelationshipToChild === "Other" && !c1RelationshipToChildOther.trim()) {
        newErrors.c1RelationshipToChildOther = "Please specify relationship to child";
      }
    }

    if (!childLastName.trim()) {
      newErrors.childLastName = "Child Last Name is required";
    } else if (childLastName.trim().length < 2) {
      newErrors.childLastName = "Minimum 2 characters required";
    } else if (childLastName.trim().length > 50) {
      newErrors.childLastName = "Maximum 50 characters allowed";
    } else if (!NAME_REGEX.test(childLastName.trim())) {
      newErrors.childLastName = "Name cannot contain numbers or special characters";
    }

    if (!childFirstName.trim()) {
      newErrors.childFirstName = "Child First Name is required";
    } else if (childFirstName.trim().length < 2) {
      newErrors.childFirstName = "Minimum 2 characters required";
    } else if (childFirstName.trim().length > 50) {
      newErrors.childFirstName = "Maximum 50 characters allowed";
    } else if (!NAME_REGEX.test(childFirstName.trim())) {
      newErrors.childFirstName = "Name cannot contain numbers or special characters";
    }

    if (childMiddleName.trim()) {
      if (childMiddleName.trim().length > 50) {
        newErrors.childMiddleName = "Maximum 50 characters allowed";
      } else if (!NAME_REGEX.test(childMiddleName.trim())) {
        newErrors.childMiddleName = "Name cannot contain numbers or special characters";
      }
    }

    if (!childAge.trim()) {
      newErrors.childAge = "Age is required";
    } else {
      const parsedAge = parseInt(childAge.trim(), 10);
      if (isNaN(parsedAge) || parsedAge < 0) {
        newErrors.childAge = "Valid age between 0 and 17 required";
      } else if (parsedAge >= 18) {
        newErrors.childAge = "Child must be under 18 years old for BCPC handling.";
      }
    }

    if (!childBirthday) {
      newErrors.childBirthday = "Birthday is required";
    }

    if (!childGender) {
      newErrors.childGender = "Gender is required";
    }

    if (!childAddress.trim()) {
      newErrors.childAddress = "Complete Address is required";
    } else if (childAddress.trim().length > 100) {
      newErrors.childAddress = "Maximum 100 characters allowed";
    }

    if (isGuardianUnavailable) {
      if (!guardianUnavailableReason) {
        newErrors.guardianUnavailableReason = "Reason for guardian unavailability is required";
      } else if (guardianUnavailableReason === "Other Reason" && !guardianUnavailableReasonOther.trim()) {
        newErrors.guardianUnavailableReasonOther = "Please specify reason for unavailability";
      }
    } else {
      if (!guardianLastName.trim()) {
        newErrors.guardianLastName = "Guardian Last Name is required";
      } else if (guardianLastName.trim().length < 2) {
        newErrors.guardianLastName = "Minimum 2 characters required";
      } else if (guardianLastName.trim().length > 50) {
        newErrors.guardianLastName = "Maximum 50 characters allowed";
      } else if (!NAME_REGEX.test(guardianLastName.trim())) {
        newErrors.guardianLastName = "Name cannot contain numbers or special characters";
      }

      if (!guardianFirstName.trim()) {
        newErrors.guardianFirstName = "Guardian First Name is required";
      } else if (guardianFirstName.trim().length < 2) {
        newErrors.guardianFirstName = "Minimum 2 characters required";
      } else if (guardianFirstName.trim().length > 50) {
        newErrors.guardianFirstName = "Maximum 50 characters allowed";
      } else if (!NAME_REGEX.test(guardianFirstName.trim())) {
        newErrors.guardianFirstName = "Name cannot contain numbers or special characters";
      }

      if (guardianMiddleName.trim()) {
        if (guardianMiddleName.trim().length > 50) {
          newErrors.guardianMiddleName = "Maximum 50 characters allowed";
        } else if (!NAME_REGEX.test(guardianMiddleName.trim())) {
          newErrors.guardianMiddleName = "Name cannot contain numbers or special characters";
        }
      }

      if (!guardianRelationship) {
        newErrors.guardianRelationship = "Relationship to Child is required";
      } else if (guardianRelationship === "Other" && !guardianRelationshipOther.trim()) {
        newErrors.guardianRelationshipOther = "Please specify relationship to child";
      }
    }

    if (apprehendingOfficerName.trim()) {
      if (apprehendingOfficerName.trim().length > 50) {
        newErrors.apprehendingOfficerName = "Maximum 50 characters allowed";
      } else if (!NAME_REGEX.test(apprehendingOfficerName.trim())) {
        newErrors.apprehendingOfficerName = "Name cannot contain numbers or special characters";
      }
    }

    if (!incidentDate) {
      newErrors.incidentDate = "Date of Incident is required";
    }

    if (!incidentPlace.trim()) {
      newErrors.incidentPlace = "Place / Location of Incident is required";
    } else if (incidentPlace.trim().length > 100) {
      newErrors.incidentPlace = "Maximum 100 characters allowed";
    }

    if (classification === "CAR") {
      if (!carActCategory) {
        newErrors.carActCategory = "Type of Incident is required";
      }
      if (!specificCarAct) {
        newErrors.specificCarAct = "Specific Incident is required";
      } else if (specificCarAct.startsWith("OTHER_") && !specificCarActOther.trim()) {
        newErrors.specificCarActOther = "Please specify the incident details or specific act";
      }
      if (!carOccurrence) {
        newErrors.carOccurrence = "How Many Times Has This Happened? is required";
      }
      if (hasSafetyConcerns === null) {
        newErrors.hasSafetyConcerns = "Please indicate if safety/welfare concerns were recorded";
      }
    } else {
      if (!allegedViolation) {
        newErrors.allegedViolation = "Alleged Offense / Violation is required";
      } else if (allegedViolation === "Other" && !allegedViolationOther.trim()) {
        newErrors.allegedViolationOther = "Please specify the alleged offense or violation";
      } else if (
        (allegedViolation === "Other" ? allegedViolationOther.trim() : allegedViolation.trim()).length > 100
      ) {
        if (allegedViolation === "Other") {
          newErrors.allegedViolationOther = "Maximum 100 characters allowed";
        } else {
          newErrors.allegedViolation = "Maximum 100 characters allowed";
        }
      }
      if (!discernmentStatus) {
        newErrors.discernmentStatus = "Discernment Assessment is required";
      }
      if (!penaltyRouting) {
        newErrors.penaltyRouting = "Offense Category is required";
      }
      if (!diversionAuthority) {
        newErrors.diversionAuthority = "Diversion Authority is required";
      }
    }

    const textStatement = narrativeText.trim() || incidentDetails.trim();
    if (!textStatement && !narrativeFile) {
      newErrors.narrative = "Please provide either a Statement Text or upload a Statement File";
    }

    if (!isCertified) {
      newErrors.isCertified = "You must certify that all information provided is true and correct";
    }

    setErrors(newErrors);

    const firstErrorKey = Object.keys(newErrors)[0];
    if (firstErrorKey) {
      const el = document.querySelector(`[data-field-key="${firstErrorKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLElement).focus?.();
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      const first = Object.values(errors)[0] || "Please check required fields.";
      onSubmitError?.(first);
      return;
    }

    setIsSubmitting(true);
    try {
      let narrativeBase64: string | undefined = undefined;
      let narrativeFormat: string | undefined = undefined;
      if (narrativeFile) {
        narrativeBase64 = await fileToBase64(narrativeFile);
        narrativeFormat = narrativeFile.type;
      }

      const evidencesPayload = await Promise.all(
        selectedEvidenceIds.map(async (evId) => {
          const item = EVIDENCE_CHECKBOX_ITEMS.find((i) => i.id === evId);
          const file = evidenceFiles[evId];
          let base64Files: string | undefined = undefined;
          if (file) {
            try {
              base64Files = await fileToBase64(file);
            } catch {
              base64Files = undefined;
            }
          }
          return {
            evidenceTypeName: item ? item.label : evId,
            fileName: file ? file.name : (item ? `${item.label}.png` : "evidence.png"),
            description: evId === "other" ? evidenceOtherText : item?.label,
            files: base64Files,
          };
        })
      );

      if (evidenceOtherText.trim()) {
        evidencesPayload.push({
          evidenceTypeName: evidenceOtherText.trim(),
          fileName: "other_evidence.txt",
          description: "Other evidence",
          files: undefined,
        });
      }

      const witnessesPayload = await Promise.all(
        witnesses.map(async (w) => {
          let b64: string | undefined = undefined;
          if (w.testimonyFile) {
            b64 = await fileToBase64(w.testimonyFile);
          }
          const fullAddress =
            w.address?.trim() ||
            [
              w.houseStreet,
              w.barangay ? `Brgy. ${w.barangay}` : undefined,
              w.city,
              w.province,
            ]
              .filter(Boolean)
              .join(", ");

          return {
            firstName: w.firstName.trim(),
            lastName: w.lastName.trim(),
            contactNumber: w.contactNumber.trim() || undefined,
            completeAddress: fullAddress || undefined,
            testimonyFileName: w.testimonyFile ? w.testimonyFile.name : (w.testimonyFileName || "testimony.pdf"),
            testimonyFile: b64,
            testimonyFileBase64: b64,
          };
        })
      );

      const parsedAge = parseInt(childAge, 10);

      const childPayload = {
        residentId: childResidentId,
        personId: childPersonId,
        firstName: childFirstName.trim(),
        middleName: childMiddleName.trim() || undefined,
        lastName: childLastName.trim(),
        contactNumber: childContact.trim() || undefined,
        completeAddress: childAddress.trim(),
        age: !isNaN(parsedAge) ? parsedAge : undefined,
        gender: childGender || undefined,
        birthDate: childBirthday || undefined,
      };

      const guardianPayload = !isGuardianUnavailable
        ? {
            residentId: guardianResidentId,
            personId: guardianPersonId,
            firstName: guardianFirstName.trim(),
            middleName: guardianMiddleName.trim() || undefined,
            lastName: guardianLastName.trim(),
            contactNumber: guardianContact.trim() || undefined,
            completeAddress: guardianAddress.trim() || childAddress.trim(),
          }
        : null;

      const finalAllegedViolation =
        allegedViolation === "Other" ? allegedViolationOther.trim() : allegedViolation.trim();

      const incidentPayload = {
        natureOfComplaint:
          classification === "CAR"
            ? (specificCarAct.startsWith("OTHER_") && specificCarActOther.trim()
                ? specificCarActOther.trim()
                : specificCarAct || carActCategory || "Child at Risk Concern")
            : finalAllegedViolation,
        dateOfIncident: incidentDate,
        timeOfIncident: incidentTime || undefined,
        placeOfIncident: incidentPlace.trim(),
        descriptionOfInjuries: incidentDetails.trim() || undefined,
      };

      const narrativePayload =
        narrativeFile || narrativeBase64 || narrativeText.trim() || incidentDetails.trim()
          ? {
              fileName: narrativeFile ? narrativeFile.name : "narrative_statement.txt",
              statementSummary:
                narrativeText.trim() ||
                incidentDetails.trim() ||
                (narrativeFile ? "Attached sworn statement document" : "Oral report statement"),
              fileData: narrativeBase64,
              documentFormat: narrativeFormat || "text/plain",
              statementFileBase64: narrativeBase64,
              textStatement: narrativeText.trim() || incidentDetails.trim(),
            }
          : undefined;

      if (classification === "CAR") {
        const carRequest: BcpcCarCaseCreateRequest = {
          caseNumber: caseNumber || undefined,
          assignedOfficerId: assignedOfficerId,
          assignedOfficer: assignedOfficerName || undefined,
          reporter: {
            residentId: c1ResidentId,
            personId: c1PersonId,
            firstName: c1FirstName.trim(),
            middleName: c1MiddleName.trim() || undefined,
            lastName: c1LastName.trim(),
            contactNumber: c1Contact.trim() || undefined,
            completeAddress: c1Address.trim(),
            age: c1Age !== undefined && c1Age !== null ? Number(c1Age) : undefined,
            gender: c1Gender || undefined,
            civilStatus: c1CivilStatus || undefined,
            email: c1Email.trim() || undefined,
            birthDate: c1BirthDate || undefined,
          },
          reporterRole: c1Role === "Other" ? (c1RoleOther.trim() || "Other") : (c1Role || undefined),
          reporterRelationshipToChild: c1RelationshipToChild === "Other" ? (c1RelationshipToChildOther.trim() || "Other") : (c1RelationshipToChild || undefined),
          child: childPayload,
          gradeLevel: childGrade || undefined,
          schoolName: childSchool.trim() || undefined,
          isGuardianAvailable: !isGuardianUnavailable,
          guardian: guardianPayload,
          guardianRelationship: !isGuardianUnavailable
            ? (guardianRelationship === "Other" ? (guardianRelationshipOther.trim() || "Other") : (guardianRelationship || undefined))
            : undefined,
          guardianUnavailableReason: isGuardianUnavailable
            ? (guardianUnavailableReason === "Other Reason" ? (guardianUnavailableReasonOther.trim() || "Other Reason") : (guardianUnavailableReason || undefined))
            : undefined,
          incident: incidentPayload,
          carActCategory: (carActCategory as CarActCategory) || undefined,
          specificCarAct: (specificCarAct as SpecificCarAct) || undefined,
          specificCarActOther: specificCarActOther.trim() || undefined,
          carOccurrenceCategory: (carOccurrence as CarOccurrenceCategory) || undefined,
          hasSafetyWelfareConcerns: hasSafetyConcerns === true,
          safetyWelfareNotes: safetyNotes.trim() || additionalNotes.trim() || undefined,
          narrative: narrativePayload,
          evidences: evidencesPayload.length > 0 ? evidencesPayload : undefined,
          witnesses: witnessesPayload.length > 0 ? witnessesPayload : undefined,
          certifiedTrue: isCertified,
        };

        const res = await bcpcApi.createCarCase(carRequest);
        onSubmitSuccess?.(res);
      } else {
        const ciclRequest: BcpcCiclCaseCreateRequest = {
          caseNumber: caseNumber || undefined,
          assignedOfficerId: assignedOfficerId,
          assignedOfficer: assignedOfficerName || undefined,
          isVictimlessOffense: isVictimless,
          victim: !isVictimless
            ? {
                residentId: c1ResidentId,
                personId: c1PersonId,
                firstName: c1FirstName.trim(),
                middleName: c1MiddleName.trim() || undefined,
                lastName: c1LastName.trim(),
                contactNumber: c1Contact.trim() || undefined,
                completeAddress: c1Address.trim(),
                age: c1Age !== undefined && c1Age !== null ? Number(c1Age) : undefined,
                gender: c1Gender || undefined,
                civilStatus: c1CivilStatus || undefined,
                email: c1Email.trim() || undefined,
                birthDate: c1BirthDate || undefined,
              }
            : null,
          victimRole: !isVictimless ? (c1Role === "Other" ? (c1RoleOther.trim() || "Other") : (c1Role || undefined)) : undefined,
          victimRelationshipToChild: !isVictimless
            ? (c1RelationshipToChild === "Other" ? (c1RelationshipToChildOther.trim() || "Other") : (c1RelationshipToChild || undefined))
            : undefined,
          child: childPayload,
          gradeLevel: childGrade || undefined,
          schoolName: childSchool.trim() || undefined,
          isGuardianAvailable: !isGuardianUnavailable,
          guardian: guardianPayload,
          guardianRelationship: !isGuardianUnavailable
            ? (guardianRelationship === "Other" ? (guardianRelationshipOther.trim() || "Other") : (guardianRelationship || undefined))
            : undefined,
          guardianUnavailableReason: isGuardianUnavailable
            ? (guardianUnavailableReason === "Other Reason" ? (guardianUnavailableReasonOther.trim() || "Other Reason") : (guardianUnavailableReason || undefined))
            : undefined,
          incident: incidentPayload,
          allegedViolation: finalAllegedViolation,
          discernmentStatus: (discernmentStatus as DiscernmentStatus) || undefined,
          penaltyRoutingCategory: (penaltyRouting as PenaltyRoutingCategory) || undefined,
          diversionAuthority: (diversionAuthority as DiversionAuthority) || undefined,
          admittedToOffense: admittedOffense === true,
          isRepeatOffender: isRepeatOffender === true,
          apprehendingOfficerName: apprehendingOfficerName.trim() || undefined,
          apprehendingOfficerOffice: apprehendingOfficerOffice.trim() || undefined,
          narrative: narrativePayload,
          evidences: evidencesPayload.length > 0 ? evidencesPayload : undefined,
          witnesses: witnessesPayload.length > 0 ? witnessesPayload : undefined,
          certifiedTrue: isCertified,
        };

        const res = await bcpcApi.createCiclCase(ciclRequest);
        onSubmitSuccess?.(res);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred while saving the BCPC case.";
      onSubmitError?.(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { hasPermission, isLoading } = useUserPermissions();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!hasPermission("File Complaint")) {
    return (
      <div className="py-12 flex justify-center">
        <PermissionDeniedPage
          title="Access Denied"
          message="The owner of the workspace has not given you permission to file BCPC complaints. Please contact the administrator."
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* ===================================================================== */}
      {/* SECTION: CASE OVERVIEW & ASSIGNMENT (EXACT BLOTTER STYLE) */}
      {/* ===================================================================== */}
      <ComplaintFormSection title="Case Overview & Assignment">
        <div className="space-y-4">
          {/* 4-column overview grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                Case / Blotter Number
              </p>
              <p className="text-xs sm:text-sm font-bold text-blue-600 mt-1">
                {caseNumber}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">(auto-generated)</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Date Filed</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
                {todayFormatted}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">(today)</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Time Filed</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
                {timeFormatted}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">(now)</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                Receiving Officer
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
                {receivingOfficerDisplayName}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">(logged in)</p>
            </div>
          </div>

          {/* Confirmed Case Classification (matches Blotter NatureOfEntrySection) */}
          <div className="space-y-2 pt-3 border-t border-slate-200/90">
            <div>
              <label className="block text-xs font-semibold text-slate-800">
                Confirmed Case Classification <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Choose the confirmed classification. This determines the fields shown in subsequent sections.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              <label
                onClick={() => {
                  setClassification("CAR");
                  clearError("classification");
                }}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  classification === "CAR"
                    ? "border-blue-600 bg-blue-50/30"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <input
                  type="radio"
                  name="caseClassification"
                  value="CAR"
                  checked={classification === "CAR"}
                  onChange={() => setClassification("CAR")}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block leading-tight">
                    Child At Risk (CAR)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Vulnerable to or victim of abuse, neglect, exploitation, or juvenile status offense.
                  </p>
                </div>
              </label>

              <label
                onClick={() => {
                  setClassification("CICL");
                  clearError("classification");
                }}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  classification === "CICL"
                    ? "border-blue-600 bg-blue-50/30"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <input
                  type="radio"
                  name="caseClassification"
                  value="CICL"
                  checked={classification === "CICL"}
                  onChange={() => setClassification("CICL")}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block leading-tight">
                    Child in Conflict with the Law (CICL)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Alleged to have committed an offense under Philippine penal laws or local ordinances.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Assigned Officer Dropdown */}
          <div className="max-w-md pt-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Officer <span className="text-red-500">*</span>
            </label>
            <select
              data-field-key="assignedOfficer"
              value={assignedOfficerId ? String(assignedOfficerId) : ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                setAssignedOfficerId(id || null);
                const opt = officerOptions.find((o) => o.id === id);
                setAssignedOfficerName(opt ? opt.name : "");
                clearError("assignedOfficer");
              }}
              className={getFieldCls("assignedOfficer")}
            >
              <option value="">Select Officer...</option>
              {officerOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} - {o.position} ({o.departmentName || "Barangay Office"})
                </option>
              ))}
            </select>
            {errors.assignedOfficer && (
              <p className="text-xs text-red-500 mt-1">{errors.assignedOfficer}</p>
            )}
          </div>
        </div>
      </ComplaintFormSection>

      {/* ===================================================================== */}
      {/* SECTION: REPORTING PERSON (CAR) / VICTIM (CICL) */}
      {/* ===================================================================== */}
      <ComplaintFormSection
        title={
          classification === "CAR"
            ? "Reporting / Referring Person Information"
            : "Victim Information"
        }
        headerExtra={
          classification === "CICL" ? (
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isVictimless}
                onChange={(e) => {
                  setIsVictimless(e.target.checked);
                  if (e.target.checked) {
                    clearError("c1LastName");
                    clearError("c1FirstName");
                    clearError("c1Address");
                    clearError("c1RelationshipToChild");
                  }
                }}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Victimless Offense / State complainant only</span>
            </label>
          ) : undefined
        }
      >
        {(!isVictimless || classification === "CAR") && (
          <div className="space-y-4">
            <SearchSelect
              label="Search Resident (Auto-fill)"
              options={c1ResidentOptions}
              value={c1Search}
              onChange={(val) => setC1Search(val)}
              onSearchQueryChange={(val) => setC1Search(val)}
              onSelect={handleSelectC1Resident}
              placeholder="Type name to search active resident..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {c1LastName.length}/50
                  </span>
                </div>
                <input
                  data-field-key="c1LastName"
                  type="text"
                  maxLength={50}
                  value={c1LastName}
                  onChange={(e) => {
                    setC1LastName(sanitizeName(e.target.value));
                    clearError("c1LastName");
                  }}
                  onBlur={() =>
                    validateNameField(
                      "c1LastName",
                      c1LastName,
                      true,
                      classification === "CAR" ? "Reporter Last Name" : "Victim Last Name"
                    )
                  }
                  placeholder="e.g. Dela Cruz"
                  className={getFieldCls("c1LastName")}
                />
                {errors.c1LastName && (
                  <p className="text-xs text-red-500 mt-1">{errors.c1LastName}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {c1FirstName.length}/50
                  </span>
                </div>
                <input
                  data-field-key="c1FirstName"
                  type="text"
                  maxLength={50}
                  value={c1FirstName}
                  onChange={(e) => {
                    setC1FirstName(sanitizeName(e.target.value));
                    clearError("c1FirstName");
                  }}
                  onBlur={() =>
                    validateNameField(
                      "c1FirstName",
                      c1FirstName,
                      true,
                      classification === "CAR" ? "Reporter First Name" : "Victim First Name"
                    )
                  }
                  placeholder="e.g. Juan"
                  className={getFieldCls("c1FirstName")}
                />
                {errors.c1FirstName && (
                  <p className="text-xs text-red-500 mt-1">{errors.c1FirstName}</p>
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
                    {c1MiddleName.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  value={c1MiddleName}
                  onChange={(e) => {
                    setC1MiddleName(sanitizeName(e.target.value));
                    clearError("c1MiddleName");
                  }}
                  onBlur={() =>
                    validateNameField("c1MiddleName", c1MiddleName, false, "Middle Name")
                  }
                  placeholder="e.g. Santos"
                  className={getFieldCls("c1MiddleName")}
                />
                {errors.c1MiddleName && (
                  <p className="text-xs text-red-500 mt-1">{errors.c1MiddleName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Contact Number{" "}
                    <span className="text-slate-400 font-normal text-[11px] ml-1">
                      (Optional)
                    </span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {c1Contact.length}/11
                  </span>
                </div>
                <input
                  data-field-key="c1Contact"
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  value={c1Contact}
                  onChange={(e) => {
                    setC1Contact(sanitizePhone(e.target.value).slice(0, 11));
                    clearError("c1Contact");
                  }}
                  onBlur={() => validatePhoneField("c1Contact", c1Contact)}
                  placeholder="09XXXXXXXXX"
                  className={getFieldCls("c1Contact")}
                />
                {errors.c1Contact && (
                  <p className="text-xs text-red-500 mt-1">{errors.c1Contact}</p>
                )}
              </div>

              <div className="sm:col-span-8">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Complete Address <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {c1Address.length}/100
                  </span>
                </div>
                <input
                  data-field-key="c1Address"
                  type="text"
                  maxLength={100}
                  value={c1Address}
                  onChange={(e) => {
                    setC1Address(e.target.value);
                    clearError("c1Address");
                  }}
                  placeholder="House No., Street, Barangay, City"
                  className={getFieldCls("c1Address")}
                />
                {errors.c1Address && (
                  <p className="text-xs text-red-500 mt-1">{errors.c1Address}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reporter Role in Case <span className="text-red-500">*</span>
                </label>
                <select
                  data-field-key="c1Role"
                  value={c1Role}
                  onChange={(e) => {
                    const val = e.target.value;
                    setC1Role(val);
                    if (val !== "Other") setC1RoleOther("");
                    clearError("c1Role");
                    clearError("c1RoleOther");
                  }}
                  className={`${getFieldCls("c1Role")} cursor-pointer`}
                >
                  <option value="">Select Role</option>
                  {REPORTER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {errors.c1Role && (
                  <p className="text-xs text-red-500 mt-1">{errors.c1Role}</p>
                )}
                {c1Role === "Other" && (
                  <div className="mt-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Please Specify Role <span className="text-red-500">*</span>
                    </label>
                    <input
                      data-field-key="c1RoleOther"
                      type="text"
                      maxLength={50}
                      value={c1RoleOther}
                      onChange={(e) => {
                        setC1RoleOther(sanitizeName(e.target.value));
                        clearError("c1RoleOther");
                      }}
                      placeholder="e.g. Barangay Health Worker, Youth Leader"
                      className={getFieldCls("c1RoleOther")}
                    />
                    {errors.c1RoleOther && (
                      <p className="text-xs text-red-500 mt-1">{errors.c1RoleOther}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship to Child <span className="text-red-500">*</span>
                </label>
                <select
                  data-field-key="c1RelationshipToChild"
                  value={c1RelationshipToChild}
                  onChange={(e) => {
                    const val = e.target.value;
                    setC1RelationshipToChild(val);
                    if (val !== "Other") setC1RelationshipToChildOther("");
                    clearError("c1RelationshipToChild");
                    clearError("c1RelationshipToChildOther");
                  }}
                  className={`${getFieldCls("c1RelationshipToChild")} cursor-pointer`}
                >
                  <option value="">Select Relationship</option>
                  {RELATIONSHIPS_TO_CHILD.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
                {errors.c1RelationshipToChild && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.c1RelationshipToChild}
                  </p>
                )}
                {c1RelationshipToChild === "Other" && (
                  <div className="mt-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Please Specify Relationship <span className="text-red-500">*</span>
                    </label>
                    <input
                      data-field-key="c1RelationshipToChildOther"
                      type="text"
                      maxLength={50}
                      value={c1RelationshipToChildOther}
                      onChange={(e) => {
                        setC1RelationshipToChildOther(sanitizeName(e.target.value));
                        clearError("c1RelationshipToChildOther");
                      }}
                      placeholder="e.g. Foster Parent, Granduncle, Stepfather"
                      className={getFieldCls("c1RelationshipToChildOther")}
                    />
                    {errors.c1RelationshipToChildOther && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.c1RelationshipToChildOther}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </ComplaintFormSection>

      {/* ===================================================================== */}
      {/* SECTION: CHILD INFORMATION */}
      {/* ===================================================================== */}
      <ComplaintFormSection
        title={
          classification === "CAR"
            ? "Child at Risk (CAR) Information"
            : "Child in Conflict with the Law (CICL) Information"
        }
      >
        <div className="space-y-4">
          <SearchSelect
            label="Search Resident (Auto-fill)"
            options={childResidentOptions}
            value={childSearch}
            onChange={(val) => setChildSearch(val)}
            onSearchQueryChange={(val) => setChildSearch(val)}
            onSelect={handleSelectChildResident}
            placeholder="Type name to search active child resident (17 years old or below)..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {childLastName.length}/50
                </span>
              </div>
              <input
                data-field-key="childLastName"
                type="text"
                maxLength={50}
                value={childLastName}
                onChange={(e) => {
                  setChildLastName(sanitizeName(e.target.value));
                  clearError("childLastName");
                }}
                onBlur={() =>
                  validateNameField("childLastName", childLastName, true, "Child Last Name")
                }
                placeholder="e.g. Santos"
                className={getFieldCls("childLastName")}
              />
              {errors.childLastName && (
                <p className="text-xs text-red-500 mt-1">{errors.childLastName}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {childFirstName.length}/50
                </span>
              </div>
              <input
                data-field-key="childFirstName"
                type="text"
                maxLength={50}
                value={childFirstName}
                onChange={(e) => {
                  setChildFirstName(sanitizeName(e.target.value));
                  clearError("childFirstName");
                }}
                onBlur={() =>
                  validateNameField("childFirstName", childFirstName, true, "Child First Name")
                }
                placeholder="e.g. Pedro"
                className={getFieldCls("childFirstName")}
              />
              {errors.childFirstName && (
                <p className="text-xs text-red-500 mt-1">{errors.childFirstName}</p>
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
                  {childMiddleName.length}/50
                </span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={childMiddleName}
                onChange={(e) => {
                  setChildMiddleName(sanitizeName(e.target.value));
                  clearError("childMiddleName");
                }}
                onBlur={() =>
                  validateNameField("childMiddleName", childMiddleName, false, "Middle Name")
                }
                placeholder="e.g. Dela Cruz"
                className={getFieldCls("childMiddleName")}
              />
              {errors.childMiddleName && (
                <p className="text-xs text-red-500 mt-1">{errors.childMiddleName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                data-field-key="childAge"
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={childAge}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 2);
                  setChildAge(cleaned);
                  clearError("childAge");
                }}
                onBlur={() => {
                  if (!childAge.trim()) {
                    setErrors((prev) => ({ ...prev, childAge: "Age is required" }));
                  } else {
                    const parsed = parseInt(childAge, 10);
                    if (isNaN(parsed) || parsed < 0) {
                      setErrors((prev) => ({ ...prev, childAge: "Valid age between 0 and 17 required" }));
                    } else if (parsed >= 18) {
                      setErrors((prev) => ({ ...prev, childAge: "Child must be under 18 years old (0-17) for BCPC handling." }));
                    }
                  }
                }}
                placeholder="e.g. 10"
                className={getFieldCls("childAge")}
              />
              {errors.childAge && (
                <p className="text-xs text-red-500 mt-1">{errors.childAge}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Birthday <span className="text-red-500">*</span>
              </label>
              <input
                data-field-key="childBirthday"
                type="date"
                value={childBirthday}
                onChange={(e) => handleBirthdayChange(e.target.value)}
                className={getFieldCls("childBirthday")}
              />
              {errors.childBirthday && (
                <p className="text-xs text-red-500 mt-1">{errors.childBirthday}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                data-field-key="childGender"
                value={childGender}
                onChange={(e) => {
                  setChildGender(e.target.value);
                  clearError("childGender");
                }}
                className={`${getFieldCls("childGender")} cursor-pointer`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.childGender && (
                <p className="text-xs text-red-500 mt-1">{errors.childGender}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grade Level
              </label>
              <select
                value={childGrade}
                onChange={(e) => setChildGrade(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="">Select Grade</option>
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  School Name{" "}
                  <span className="text-slate-400 font-normal text-[11px] ml-1">
                    (Optional)
                  </span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {childSchool.length}/100
                </span>
              </div>
              <input
                type="text"
                maxLength={100}
                value={childSchool}
                onChange={(e) => setChildSchool(e.target.value)}
                placeholder="e.g. Bagong Bayan Elementary"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Contact Number{" "}
                  <span className="text-slate-400 font-normal text-[11px] ml-1">
                    (Optional)
                  </span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {childContact.length}/11
                </span>
              </div>
              <input
                data-field-key="childContact"
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={childContact}
                onChange={(e) => {
                  setChildContact(sanitizePhone(e.target.value).slice(0, 11));
                  clearError("childContact");
                }}
                onBlur={() => validatePhoneField("childContact", childContact)}
                placeholder="09XXXXXXXXX"
                className={getFieldCls("childContact")}
              />
              {errors.childContact && (
                <p className="text-xs text-red-500 mt-1">{errors.childContact}</p>
              )}
            </div>

            <div className="sm:col-span-8">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Complete Address <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {childAddress.length}/100
                </span>
              </div>
              <input
                data-field-key="childAddress"
                type="text"
                maxLength={100}
                value={childAddress}
                onChange={(e) => {
                  setChildAddress(e.target.value);
                  clearError("childAddress");
                }}
                placeholder="House No., Street, Barangay, City"
                className={getFieldCls("childAddress")}
              />
              {errors.childAddress && (
                <p className="text-xs text-red-500 mt-1">{errors.childAddress}</p>
              )}
            </div>
          </div>
        </div>
      </ComplaintFormSection>

      {/* ===================================================================== */}
      {/* SECTION: PARENT / GUARDIAN INFORMATION */}
      {/* ===================================================================== */}
      <ComplaintFormSection
        title="Parent / Legal Guardian Information"
        headerExtra={
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isGuardianUnavailable}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsGuardianUnavailable(checked);
                if (checked) {
                  clearError("guardianLastName");
                  clearError("guardianFirstName");
                  clearError("guardianRelationship");
                  clearError("guardianRelationshipOther");
                } else {
                  clearError("guardianUnavailableReason");
                  clearError("guardianUnavailableReasonOther");
                }
              }}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">
              Parent / Guardian is currently unavailable
            </span>
          </label>
        }
      >
        {isGuardianUnavailable ? (
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Guardian Unavailability <span className="text-red-500">*</span>
              </label>
              <select
                data-field-key="guardianUnavailableReason"
                value={guardianUnavailableReason}
                onChange={(e) => {
                  const val = e.target.value;
                  setGuardianUnavailableReason(val);
                  if (val !== "Other Reason") setGuardianUnavailableReasonOther("");
                  clearError("guardianUnavailableReason");
                  clearError("guardianUnavailableReasonOther");
                }}
                className={`${getFieldCls("guardianUnavailableReason")} cursor-pointer`}
              >
                <option value="">Select Reason</option>
                {GUARDIAN_UNAVAILABLE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.guardianUnavailableReason && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.guardianUnavailableReason}
                </p>
              )}
              {guardianUnavailableReason === "Other Reason" && (
                <div className="mt-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Please Specify Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    data-field-key="guardianUnavailableReasonOther"
                    type="text"
                    maxLength={100}
                    value={guardianUnavailableReasonOther}
                    onChange={(e) => {
                      setGuardianUnavailableReasonOther(e.target.value);
                      clearError("guardianUnavailableReasonOther");
                    }}
                    placeholder="Specify the reason why guardian is unavailable..."
                    className={getFieldCls("guardianUnavailableReasonOther")}
                  />
                  {errors.guardianUnavailableReasonOther && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.guardianUnavailableReasonOther}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Additional Notes on Unavailability{" "}
                  <span className="text-slate-400 font-normal text-[11px] ml-1">
                    (Optional)
                  </span>
                </label>
                <span className="text-xs text-slate-400 font-normal">
                  {guardianUnavailableNotes.length}/500
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={500}
                value={guardianUnavailableNotes}
                onChange={(e) => setGuardianUnavailableNotes(e.target.value)}
                placeholder="State any efforts made to contact parents or alternate temporary guardians..."
                className={inputCls}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <SearchSelect
              label="Search Resident (Auto-fill)"
              options={guardianResidentOptions}
              value={guardianSearch}
              onChange={(val) => setGuardianSearch(val)}
              onSearchQueryChange={(val) => setGuardianSearch(val)}
              onSelect={handleSelectGuardianResident}
              placeholder="Type name to search active guardian resident..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {guardianLastName.length}/50
                  </span>
                </div>
                <input
                  data-field-key="guardianLastName"
                  type="text"
                  maxLength={50}
                  value={guardianLastName}
                  onChange={(e) => {
                    setGuardianLastName(sanitizeName(e.target.value));
                    clearError("guardianLastName");
                  }}
                  onBlur={() =>
                    validateNameField(
                      "guardianLastName",
                      guardianLastName,
                      true,
                      "Guardian Last Name"
                    )
                  }
                  placeholder="e.g. Santos"
                  className={getFieldCls("guardianLastName")}
                />
                {errors.guardianLastName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.guardianLastName}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {guardianFirstName.length}/50
                  </span>
                </div>
                <input
                  data-field-key="guardianFirstName"
                  type="text"
                  maxLength={50}
                  value={guardianFirstName}
                  onChange={(e) => {
                    setGuardianFirstName(sanitizeName(e.target.value));
                    clearError("guardianFirstName");
                  }}
                  onBlur={() =>
                    validateNameField(
                      "guardianFirstName",
                      guardianFirstName,
                      true,
                      "Guardian First Name"
                    )
                  }
                  placeholder="e.g. Maria Isabel"
                  className={getFieldCls("guardianFirstName")}
                />
                {errors.guardianFirstName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.guardianFirstName}
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
                    {guardianMiddleName.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  value={guardianMiddleName}
                  onChange={(e) => {
                    setGuardianMiddleName(sanitizeName(e.target.value));
                    clearError("guardianMiddleName");
                  }}
                  onBlur={() =>
                    validateNameField(
                      "guardianMiddleName",
                      guardianMiddleName,
                      false,
                      "Middle Name"
                    )
                  }
                  placeholder="e.g. Dela Cruz"
                  className={getFieldCls("guardianMiddleName")}
                />
                {errors.guardianMiddleName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.guardianMiddleName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship to Child <span className="text-red-500">*</span>
                </label>
                <select
                  data-field-key="guardianRelationship"
                  value={guardianRelationship}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGuardianRelationship(val);
                    if (val !== "Other") setGuardianRelationshipOther("");
                    clearError("guardianRelationship");
                    clearError("guardianRelationshipOther");
                  }}
                  className={`${getFieldCls("guardianRelationship")} cursor-pointer`}
                >
                  <option value="">Select Relationship</option>
                  {RELATIONSHIPS_TO_CHILD.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
                {errors.guardianRelationship && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.guardianRelationship}
                  </p>
                )}
                {guardianRelationship === "Other" && (
                  <div className="mt-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Please Specify Relationship <span className="text-red-500">*</span>
                    </label>
                    <input
                      data-field-key="guardianRelationshipOther"
                      type="text"
                      maxLength={50}
                      value={guardianRelationshipOther}
                      onChange={(e) => {
                        setGuardianRelationshipOther(sanitizeName(e.target.value));
                        clearError("guardianRelationshipOther");
                      }}
                      placeholder="e.g. Stepmother, Custodian, Guardian"
                      className={getFieldCls("guardianRelationshipOther")}
                    />
                    {errors.guardianRelationshipOther && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.guardianRelationshipOther}
                      </p>
                    )}
                  </div>
                )}
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
                    {guardianContact.length}/11
                  </span>
                </div>
                <input
                  data-field-key="guardianContact"
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  value={guardianContact}
                  onChange={(e) => {
                    setGuardianContact(sanitizePhone(e.target.value).slice(0, 11));
                    clearError("guardianContact");
                  }}
                  onBlur={() => validatePhoneField("guardianContact", guardianContact)}
                  placeholder="09XXXXXXXXX"
                  className={getFieldCls("guardianContact")}
                />
                {errors.guardianContact && (
                  <p className="text-xs text-red-500 mt-1">{errors.guardianContact}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </ComplaintFormSection>

      {/* ===================================================================== */}
      {/* SECTION: INCIDENT DETAILS */}
      {/* ===================================================================== */}
      <ComplaintFormSection title="Incident Details">
        <div className="space-y-4">
          {classification === "CAR" ? (
            <>
              {/* Row 1: Category, Specific Act, Frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nature / Type of Incident <span className="text-red-500">*</span>
                  </label>
                  <select
                    data-field-key="carActCategory"
                    value={carActCategory}
                    onChange={(e) => {
                      const cat = e.target.value as CarActCategory;
                      setCarActCategory(cat);
                      setSpecificCarAct("");
                      clearError("carActCategory");
                    }}
                    className={getFieldCls("carActCategory")}
                  >
                    <option value="">Select Type of Incident</option>
                    {CAR_ACT_CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {errors.carActCategory && (
                    <p className="text-xs text-red-500 mt-1">{errors.carActCategory}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specific Incident / Act <span className="text-red-500">*</span>
                  </label>
                  <select
                    data-field-key="specificCarAct"
                    disabled={!carActCategory}
                    value={specificCarAct}
                    onChange={(e) => {
                      setSpecificCarAct(e.target.value as SpecificCarAct);
                      clearError("specificCarAct");
                    }}
                    className={`${getFieldCls("specificCarAct")} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                  >
                    <option value="">
                      {carActCategory ? "Select specific act" : "Select a type first"}
                    </option>
                    {carActCategory &&
                      SPECIFIC_CAR_ACT_MAP[carActCategory]?.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                  </select>
                  {errors.specificCarAct && (
                    <p className="text-xs text-red-500 mt-1">{errors.specificCarAct}</p>
                  )}
                  {specificCarAct?.startsWith("OTHER_") && (
                    <div className="mt-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Please Specify Incident / Act <span className="text-red-500">*</span>
                      </label>
                      <input
                        data-field-key="specificCarActOther"
                        type="text"
                        maxLength={100}
                        value={specificCarActOther}
                        onChange={(e) => {
                          setSpecificCarActOther(e.target.value);
                          clearError("specificCarActOther");
                        }}
                        placeholder="Specify details or specific act..."
                        className={getFieldCls("specificCarActOther")}
                      />
                      {errors.specificCarActOther && (
                        <p className="text-xs text-red-500 mt-1">{errors.specificCarActOther}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frequency of Incident <span className="text-red-500">*</span>
                  </label>
                  <select
                    data-field-key="carOccurrence"
                    value={carOccurrence}
                    onChange={(e) => {
                      setCarOccurrence(e.target.value as CarOccurrenceCategory);
                      clearError("carOccurrence");
                    }}
                    className={getFieldCls("carOccurrence")}
                  >
                    <option value="">Select Frequency</option>
                    <option value="FIRST_OCCURRENCE">1st Time (First Incident)</option>
                    <option value="SECOND_OCCURRENCE">2nd Time (Repeated Incident)</option>
                    <option value="THIRD_OR_SUBSEQUENT">3 or More Times (Habitual / Chronic)</option>
                  </select>
                  {errors.carOccurrence && (
                    <p className="text-xs text-red-500 mt-1">{errors.carOccurrence}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Date, Time, Place */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Incident <span className="text-red-500">*</span>
                  </label>
                  <input
                    data-field-key="incidentDate"
                    type="date"
                    value={incidentDate}
                    onChange={(e) => {
                      setIncidentDate(e.target.value);
                      clearError("incidentDate");
                    }}
                    className={getFieldCls("incidentDate")}
                  />
                  {errors.incidentDate && (
                    <p className="text-xs text-red-500 mt-1">{errors.incidentDate}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Time of Incident{" "}
                      <span className="text-slate-400 font-normal text-[11px] ml-1">
                        (Optional)
                      </span>
                    </label>
                  </div>
                  <input
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Place of Incident <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400 font-normal">
                      {incidentPlace.length}/100
                    </span>
                  </div>
                  <input
                    data-field-key="incidentPlace"
                    type="text"
                    maxLength={100}
                    value={incidentPlace}
                    onChange={(e) => {
                      setIncidentPlace(e.target.value);
                      clearError("incidentPlace");
                    }}
                    placeholder="e.g. In front of House #45, Purok 3"
                    className={getFieldCls("incidentPlace")}
                  />
                  {errors.incidentPlace && (
                    <p className="text-xs text-red-500 mt-1">{errors.incidentPlace}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Description / Circumstances */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Description / Circumstances of Incident{" "}
                    <span className="text-slate-400 font-normal text-[11px] ml-1">
                      (Optional)
                    </span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {incidentDetails.length}/500
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={incidentDetails}
                  onChange={(e) => setIncidentDetails(e.target.value)}
                  placeholder="Describe circumstances, behavior observed, or reasons for referral..."
                  className={inputCls}
                />
              </div>

              {/* Row 4: Safety / Welfare Concerns & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Safety / Welfare Concerns <span className="text-red-500">*</span>
                  </label>
                  <select
                    data-field-key="hasSafetyConcerns"
                    value={hasSafetyConcerns === true ? "YES" : hasSafetyConcerns === false ? "NO" : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "YES") setHasSafetyConcerns(true);
                      else if (val === "NO") setHasSafetyConcerns(false);
                      else setHasSafetyConcerns(null);
                      clearError("hasSafetyConcerns");
                    }}
                    className={getFieldCls("hasSafetyConcerns")}
                  >
                    <option value="">Select Safety / Welfare Status</option>
                    <option value="NO">No immediate safety or welfare concerns recorded</option>
                    <option value="YES">Yes — Safety or welfare concerns were recorded</option>
                  </select>
                  {errors.hasSafetyConcerns && (
                    <p className="text-xs text-red-500 mt-1">{errors.hasSafetyConcerns}</p>
                  )}
                </div>

                {hasSafetyConcerns && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Safety Concerns Details
                      </label>
                      <span className="text-xs text-slate-400 font-normal">
                        {safetyNotes.length}/500
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={safetyNotes}
                      onChange={(e) => setSafetyNotes(e.target.value)}
                      placeholder="Provide details on threats, neglect, living conditions, or medical concerns..."
                      className={inputCls}
                    />
                  </div>
                )}
              </div>

              {/* Row 5: Additional Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Additional Notes{" "}
                    <span className="text-slate-400 font-normal text-[11px] ml-1">
                      (Optional)
                    </span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {additionalNotes.length}/500
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Enter any additional intake notes here..."
                  className={inputCls}
                />
              </div>
            </>
          ) : (
            <>
              {/* CICL Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alleged Offense / Violation <span className="text-red-500">*</span>
                  </label>
                  <select
                    data-field-key="allegedViolation"
                    value={allegedViolation}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAllegedViolation(val);
                      if (val !== "Other") {
                        setAllegedViolationOther("");
                      }
                      clearError("allegedViolation");
                      clearError("allegedViolationOther");
                    }}
                    className={getFieldCls("allegedViolation")}
                  >
                    <option value="">Select Alleged Offense / Violation</option>
                    {CICL_OFFENSE_OPTIONS.map((offense) => (
                      <option key={offense} value={offense}>
                        {offense}
                      </option>
                    ))}
                  </select>
                  {errors.allegedViolation && (
                    <p className="text-xs text-red-500 mt-1">{errors.allegedViolation}</p>
                  )}

                  {allegedViolation === "Other" && (
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Specify Offense / Violation <span className="text-red-500">*</span>
                        </label>
                        <span className="text-xs text-slate-400 font-normal">
                          {allegedViolationOther.length}/100
                        </span>
                      </div>
                      <input
                        data-field-key="allegedViolationOther"
                        type="text"
                        maxLength={100}
                        value={allegedViolationOther}
                        onChange={(e) => {
                          setAllegedViolationOther(e.target.value);
                          clearError("allegedViolationOther");
                        }}
                        placeholder="Please specify alleged offense or violation"
                        className={getFieldCls("allegedViolationOther")}
                        autoFocus
                      />
                      {errors.allegedViolationOther && (
                        <p className="text-xs text-red-500 mt-1">{errors.allegedViolationOther}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discernment Assessment <span className="text-red-500">*</span>
                  </label>
                  <select
                    data-field-key="discernmentStatus"
                    value={discernmentStatus}
                    onChange={(e) => {
                      setDiscernmentStatus(e.target.value as DiscernmentStatus);
                      clearError("discernmentStatus");
                    }}
                    className={getFieldCls("discernmentStatus")}
                  >
                    <option value="">Select Discernment</option>
                    <option value="PENDING_LSWDO_EVALUATION">Pending LSWDO Assessment</option>
                    <option value="WITHOUT_DISCERNMENT">Acted Without Discernment / Exempt (15 & below)</option>
                    <option value="WITH_DISCERNMENT">Acted With Discernment</option>
                  </select>
                  {errors.discernmentStatus && (
                    <p className="text-xs text-red-500 mt-1">{errors.discernmentStatus}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Penalty / Offense Severity <span className="text-red-500">*</span>
                  </label>
                  <select
                    data-field-key="penaltyRouting"
                    value={penaltyRouting}
                    onChange={(e) => {
                      setPenaltyRouting(e.target.value as PenaltyRoutingCategory);
                      clearError("penaltyRouting");
                    }}
                    className={getFieldCls("penaltyRouting")}
                  >
                    <option value="">Select Severity</option>
                    <option value="SIX_YEARS_OR_LESS">6 Years or Less (Barangay Diversion Eligible)</option>
                    <option value="ABOVE_SIX_YEARS">Above 6 Years (Court / Police Referral)</option>
                    <option value="UNDETERMINED">Undetermined / Pending Assessment</option>
                  </select>
                  {errors.penaltyRouting && (
                    <p className="text-xs text-red-500 mt-1">{errors.penaltyRouting}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diversion Authority <span className="text-red-500">*</span>
                  </label>
                  <select
                    data-field-key="diversionAuthority"
                    value={diversionAuthority}
                    onChange={(e) => {
                      setDiversionAuthority(e.target.value as DiversionAuthority);
                      clearError("diversionAuthority");
                    }}
                    className={getFieldCls("diversionAuthority")}
                  >
                    <option value="">Select Authority</option>
                    <option value="BARANGAY">Barangay Level Diversion (BCPC)</option>
                    <option value="WCPD">PNP-WCPD Referral</option>
                    <option value="LSWDO">LSWDO Intervention Program</option>
                    <option value="COURT">Family Court / Bahay Pag-Asa</option>
                    <option value="UNDETERMINED">Undetermined / To Be Assessed</option>
                  </select>
                  {errors.diversionAuthority && (
                    <p className="text-xs text-red-500 mt-1">{errors.diversionAuthority}</p>
                  )}
                </div>
              </div>

              {/* Date, Time, Place */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Incident <span className="text-red-500">*</span>
                  </label>
                  <input
                    data-field-key="incidentDate"
                    type="date"
                    value={incidentDate}
                    onChange={(e) => {
                      setIncidentDate(e.target.value);
                      clearError("incidentDate");
                    }}
                    className={getFieldCls("incidentDate")}
                  />
                  {errors.incidentDate && (
                    <p className="text-xs text-red-500 mt-1">{errors.incidentDate}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Time of Incident{" "}
                      <span className="text-slate-400 font-normal text-[11px] ml-1">
                        (Optional)
                      </span>
                    </label>
                  </div>
                  <input
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Place of Incident <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400 font-normal">
                      {incidentPlace.length}/100
                    </span>
                  </div>
                  <input
                    data-field-key="incidentPlace"
                    type="text"
                    maxLength={100}
                    value={incidentPlace}
                    onChange={(e) => {
                      setIncidentPlace(e.target.value);
                      clearError("incidentPlace");
                    }}
                    placeholder="e.g. In front of House #45, Purok 3"
                    className={getFieldCls("incidentPlace")}
                  />
                  {errors.incidentPlace && (
                    <p className="text-xs text-red-500 mt-1">{errors.incidentPlace}</p>
                  )}
                </div>
              </div>

              {/* Description / Circumstances */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Description / Circumstances of Incident{" "}
                    <span className="text-slate-400 font-normal text-[11px] ml-1">
                      (Optional)
                    </span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {incidentDetails.length}/500
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={incidentDetails}
                  onChange={(e) => setIncidentDetails(e.target.value)}
                  placeholder="Describe circumstances, behavior observed, or details of the offense..."
                  className={inputCls}
                />
              </div>

              {/* CICL Admission & Repeat Offender Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admission of Offense
                  </label>
                  <select
                    value={admittedOffense === true ? "YES" : admittedOffense === false ? "NO" : ""}
                    onChange={(e) => {
                      if (e.target.value === "YES") setAdmittedOffense(true);
                      else if (e.target.value === "NO") setAdmittedOffense(false);
                      else setAdmittedOffense(null);
                    }}
                    className={inputCls}
                  >
                    <option value="">Select Status</option>
                    <option value="NO">No / Denied offense</option>
                    <option value="YES">Yes — Child voluntarily admitted to offense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Repeat Offender Status
                  </label>
                  <select
                    value={isRepeatOffender === true ? "YES" : isRepeatOffender === false ? "NO" : ""}
                    onChange={(e) => {
                      if (e.target.value === "YES") setIsRepeatOffender(true);
                      else if (e.target.value === "NO") setIsRepeatOffender(false);
                      else setIsRepeatOffender(null);
                    }}
                    className={inputCls}
                  >
                    <option value="">Select Status</option>
                    <option value="NO">No (First-time offender)</option>
                    <option value="YES">Yes (Repeat offender / previously recorded)</option>
                  </select>
                </div>
              </div>

              {/* Apprehending Officer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Apprehending Officer Name{" "}
                      <span className="text-slate-400 font-normal text-[11px] ml-1">
                        (Optional)
                      </span>
                    </label>
                    <span className="text-xs text-slate-400 font-normal">
                      {apprehendingOfficerName.length}/50
                    </span>
                  </div>
                  <input
                    data-field-key="apprehendingOfficerName"
                    type="text"
                    maxLength={50}
                    value={apprehendingOfficerName}
                    onChange={(e) => {
                      setApprehendingOfficerName(sanitizeName(e.target.value));
                      clearError("apprehendingOfficerName");
                    }}
                    onBlur={() =>
                      validateNameField(
                        "apprehendingOfficerName",
                        apprehendingOfficerName,
                        false,
                        "Apprehending Officer Name"
                      )
                    }
                    placeholder="e.g. Patrolman Juan Dela Cruz"
                    className={getFieldCls("apprehendingOfficerName")}
                  />
                  {errors.apprehendingOfficerName && (
                    <p className="text-xs text-red-500 mt-1">{errors.apprehendingOfficerName}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Apprehending Unit / Office{" "}
                      <span className="text-slate-400 font-normal text-[11px] ml-1">
                        (Optional)
                      </span>
                    </label>
                    <span className="text-xs text-slate-400 font-normal">
                      {apprehendingOfficerOffice.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    value={apprehendingOfficerOffice}
                    onChange={(e) => {
                      setApprehendingOfficerOffice(e.target.value);
                      clearError("apprehendingOfficerOffice");
                    }}
                    placeholder="e.g. PNP Station 9 / Barangay Tanod"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Additional Notes{" "}
                    <span className="text-slate-400 font-normal text-[11px] ml-1">
                      (Optional)
                    </span>
                  </label>
                  <span className="text-xs text-slate-400 font-normal">
                    {additionalNotes.length}/500
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Enter any additional intake notes here..."
                  className={inputCls}
                />
              </div>
            </>
          )}
        </div>
      </ComplaintFormSection>

      {/* ===================================================================== */}
      {/* SECTION: NARRATIVE STATEMENT OF COMPLAINT (EXACT BLOTTER STYLE) */}
      {/* ===================================================================== */}
      <ComplaintFormSection title="Narrative Statement of Complaint">
        <div className="space-y-4">
          <ComplaintFileUpload
            file={narrativeFile}
            fileName={narrativeFile?.name}
            fileSize={narrativeFile ? `${(narrativeFile.size / 1024).toFixed(1)} KB` : ""}
            onFileSelect={(file) => {
              setNarrativeFile(file);
              clearError("narrative");
            }}
            statementText={narrativeText}
            onStatementTextChange={(text) => {
              setNarrativeText(text);
              clearError("narrative");
            }}
            error={errors.narrative}
          />
        </div>
      </ComplaintFormSection>

      {/* ===================================================================== */}
      {/* SECTION: SUPPORTING DOCUMENTS / EVIDENCE (OPTIONAL) */}
      {/* ===================================================================== */}
      <ComplaintFormSection title="Attached Evidence (Optional)">
        <ComplaintEvidenceGrid
          selectedIds={selectedEvidenceIds}
          onChange={setSelectedEvidenceIds}
          evidenceFiles={evidenceFiles}
          onFileUpload={(id, file) =>
            setEvidenceFiles((prev) => ({ ...prev, [id]: file }))
          }
          otherText={evidenceOtherText}
          onOtherTextChange={setEvidenceOtherText}
          items={EVIDENCE_CHECKBOX_ITEMS}
        />
      </ComplaintFormSection>

      {/* ===================================================================== */}
      {/* SECTION: WITNESS INFORMATION (OPTIONAL) */}
      {/* ===================================================================== */}
      <ComplaintFormSection title="Witness Information (Optional)">
        <ComplaintWitnessSection
          witnesses={witnesses}
          onWitnessesChange={setWitnesses}
          currentComplainantName={`${c1FirstName} ${c1LastName}`.trim()}
          currentRespondentName={`${childFirstName} ${childLastName}`.trim()}
        />
      </ComplaintFormSection>

      {/* ===================================================================== */}
      {/* SECTION: CERTIFICATION & ACTION BUTTONS (EXACT BLOTTER STYLE) */}
      {/* ===================================================================== */}
      <div className="pt-4 border-t border-slate-200 space-y-4">
        <CertificationConsentCard
          id="certify_bcpc"
          checked={isCertified}
          onChange={(checked) => {
            setIsCertified(checked);
            clearError("isCertified");
          }}
          title="Certification Under Oath"
          text="I hereby certify that all information provided in this BCPC Intake / Referral Form is true, accurate, and complete to the best of my knowledge and official record."
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
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Filing BCPC Case...</span>
              </>
            ) : (
              <>
                <FileCheck size={16} />
                <span>File BCPC Case</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
