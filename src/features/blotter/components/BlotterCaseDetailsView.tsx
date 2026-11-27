import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit3, FileSearch, Scale, RotateCcw, AlertTriangle, Check, Clock, FileText } from "lucide-react";
import {
  DetailActionButton,
  DetailCaseDetailsShell,
  DetailCaseHeader,
  DetailCaseHistoryCard,
  DetailCaseNotesPanel,
  DetailCaseOverview,
  DetailEmptyPanel,
  DetailInfoCard,
  DetailMediationBanner,
  DetailQuickActionCards,
  DetailTimelinePanel,
  MediationHearingsPanel,
  CaseReasonModal,
  type DetailCaseNoteItem,
  type DetailTab,
  type DetailTimelineItem,
} from "@/components/ui/details";
import { Badge } from "@/components/ui/table/Badge";
import { FeedbackDialog } from "@/components/ui/FeedbackDialog";
import { useDialogs } from "@/hooks/useDialogs";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  blotterApi,
  type BlotterBackendResponse,
} from "@/config/api/modules/blotter.api";
import { luponApi, type PanelAttendanceResponse } from "@/config/api/modules/lupon.api";
import { EditCaseModal } from "./EditCaseModal";
import { ReferToLuponModal } from "./ReferToLuponModal";
import { PermissionDeniedPage } from "@/components/ui/PermissionDeniedPage";
import { axiosInstance, API_BASE_URL } from "@/config/api/axios.config";

import {
  formatDate,
  formatDateTime,
  formatEnumLabel,
} from "@/utils/formatters";


interface BlotterCaseDetailsViewProps {
  caseId: string | number;
  caseNumber?: string;
  onBack: () => void;
  onEdit?: () => void;
  onSettle?: () => void;
  onDismiss?: () => void;
  onReopen?: () => void;
  refreshKey?: number;
}

const TERMINAL_STATUSES = new Set([
  "SETTLED",
  "DISMISSED",
  "WITHDRAWN",
  "RESOLVED",
  "CERTIFIED_TO_FILE_ACTION",
  "CFA_ISSUED",
  "EXPIRED_UNACTIONED",
  "EXPIRED",
]);

function getDisplayStatus(status?: string | null) {
  if (!status) return "Pending";
  const normalized = String(status).toUpperCase();
  if (normalized === "RECORDED") return "Recorded";
  if (normalized === "CERTIFIED_TO_FILE_ACTION" || normalized === "CFA_ISSUED") return "Certified to File Action";
  if (normalized === "EXPIRED_UNACTIONED" || normalized === "EXPIRED") return "Expired Unactioned";
  return formatEnumLabel(status);
}

function getStatusTone(status?: string | null): BadgeTone {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "RECORDED") return "slate";
  if (normalized === "SETTLED" || normalized === "RESOLVED") return "emerald";
  if (normalized === "DISMISSED" || normalized === "WITHDRAWN") return "rose";
  if (normalized === "CERTIFIED_TO_FILE_ACTION" || normalized === "CFA_ISSUED") return "violet";
  if (normalized === "EXPIRED_UNACTIONED" || normalized === "EXPIRED") return "rose";
  if (normalized === "REOPENED") return "indigo";
  if (normalized.includes("MEDIATION")) return "sky";
  if (normalized.includes("CONCILIATION")) return "indigo";
  if (normalized === "ON GOING" || normalized === "ON_GOING") return "sky";

  return "amber";
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "—";
  if (/^[A-Z][a-z]{2}\s+\d{2},\s+\d{4}$/.test(value)) return value;
  return formatDate(value);
}

function formatDisplayTime(value?: string | null) {
  if (!value) return "—";
  return value;
}

function getFiledReferenceDate(caseDetail: BlotterBackendResponse | null) {
  if (!caseDetail) return null;
  const targetDateStr = caseDetail.rootCreatedAt || caseDetail.createdAt;
  if (!targetDateStr) return null;
  const parsed = new Date(targetDateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getDaysRemaining(caseDetail: BlotterBackendResponse | null) {
  const filedDate = getFiledReferenceDate(caseDetail);
  const totalDays = caseDetail?.isExtended ? 30 : 15;
  if (!filedDate) return totalDays;

  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsedDays = Math.floor((Date.now() - filedDate.getTime()) / msPerDay);
  return Math.max(0, totalDays - elapsedDays);
}

function getFilingTypeLabel(filingType?: string | null) {
  if (!filingType) return "Blotter Case";
  return filingType === "FORMAL_COMPLAINT"
    ? "Formal Complaint"
    : "For the Record";
}

function buildNoteItems(caseDetail: BlotterBackendResponse): DetailCaseNoteItem[] {
  const noteItems: DetailCaseNoteItem[] = [];

  if (caseDetail.statementSummary?.trim()) {
    noteItems.push({
      id: "statement-summary",
      label: "Statement Summary",
      value: caseDetail.statementSummary,
      timestamp: formatDateTime(caseDetail.updatedAt || caseDetail.createdAt),
    });
  }

  if (
    caseDetail.statementText?.trim() &&
    caseDetail.statementText.trim() !== caseDetail.statementSummary?.trim()
  ) {
    noteItems.push({
      id: "full-statement",
      label: "Full Narrative",
      value: caseDetail.statementText,
      timestamp: formatDateTime(caseDetail.updatedAt || caseDetail.createdAt),
    });
  }

  return noteItems;
}

function buildTimelineItems(
  caseDetail: BlotterBackendResponse,
  displayStatus: string,
): DetailTimelineItem[] {
  const timelineItems: DetailTimelineItem[] = [
    {
      id: "case-filed",
      label: "Case Filed",
      timestamp: formatDateTime(caseDetail.createdAt),
      description: `Initial blotter entry recorded by ${
        caseDetail.receivingOfficer || "Barangay Officer"
      }.`,
    },
  ];

  if (caseDetail.updatedAt && caseDetail.updatedAt !== caseDetail.createdAt) {
    timelineItems.push({
      id: "case-updated",
      label: "Case Updated",
      timestamp: formatDateTime(caseDetail.updatedAt),
      description: `Current status: ${displayStatus}.`,
    });
  }

  return timelineItems;
}

export function BlotterCaseDetailsView({
  caseId,
  caseNumber,
  onBack,
  onEdit,
  onSettle,
  onDismiss,
  onReopen,
  refreshKey = 0,
}: BlotterCaseDetailsViewProps) {
  const { currentRole } = useAuth();
  const isSystemAdmin = currentRole === 'rootadmin' || currentRole === 'admin';
  const { hasPermission } = useUserPermissions();

  const [activeCaseId, setActiveCaseId] = useState<string | number>(caseId);
  const [caseDetail, setCaseDetail] = useState<BlotterBackendResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [notesCount, setNotesCount] = useState<number>(0);
  const [modalMode, setModalMode] = useState<'dismiss' | 'reopen' | 'settle' | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLuponModalOpen, setIsLuponModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [isSubmittingExtend, setIsSubmittingExtend] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [isVerifyingReissuance, setIsVerifyingReissuance] = useState(false);
  const { showFeedback, feedbackDialogProps } = useDialogs();
  const [pangkatMembers, setPangkatMembers] = useState<PanelAttendanceResponse[]>([]);

  const fetchCaseDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await blotterApi.getById(activeCaseId);
      setCaseDetail(data);
      luponApi.getPangkatMembers(activeCaseId)
        .then(setPangkatMembers)
        .catch(() => setPangkatMembers([]));
    } catch (error) {
      console.error("Failed to fetch blotter case detail:", error);
      setCaseDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeCaseId]);

  const handleApproveReissuance = useCallback(async () => {
    setIsVerifyingReissuance(true);
    try {
      await blotterApi.verifyDocumentReissuance(activeCaseId, {
        action: "APPROVE",
        remarks: "Affidavit of Loss duly verified. Cleared for certificate re-issuance.",
      });
      showFeedback({
        variant: "success",
        title: "Cleared for Document Reissuance",
        description: "Case has been officially approved for FTJS certificate reissuance.",
      });
      await fetchCaseDetail();
    } catch (err: any) {
      showFeedback({
        variant: "error",
        title: "Verification Failed",
        description: err?.response?.data?.message || err?.message || "Failed to approve reissuance.",
      });
    } finally {
      setIsVerifyingReissuance(false);
    }
  }, [activeCaseId, fetchCaseDetail, showFeedback]);

  const handleRejectReissuance = useCallback(async () => {
    if (!rejectRemarks.trim()) return;
    setIsVerifyingReissuance(true);
    try {
      await blotterApi.verifyDocumentReissuance(activeCaseId, {
        action: "REJECT",
        remarks: rejectRemarks.trim(),
      });
      setIsRejectModalOpen(false);
      setRejectRemarks("");
      showFeedback({
        variant: "success",
        title: "Reissuance Rejected",
        description: "Document reissuance clearance has been rejected.",
      });
      await fetchCaseDetail();
    } catch (err: any) {
      showFeedback({
        variant: "error",
        title: "Action Failed",
        description: err?.response?.data?.message || err?.message || "Failed to reject reissuance.",
      });
    } finally {
      setIsVerifyingReissuance(false);
    }
  }, [activeCaseId, rejectRemarks, fetchCaseDetail, showFeedback]);

  const handleConfirmExtend = useCallback(async (reason: string) => {
    setIsSubmittingExtend(true);
    try {
      await blotterApi.extendCase(activeCaseId, reason);
      setIsExtendModalOpen(false);
      await fetchCaseDetail();
      showFeedback({
        variant: "success",
        title: "Mediation Period Extended",
        description: "The mediation period has been successfully extended by an additional 15 days.",
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to extend mediation period.";
      showFeedback({
        variant: "error",
        title: "Extension Failed",
        description: msg,
      });
      throw err;
    } finally {
      setIsSubmittingExtend(false);
    }
  }, [activeCaseId, fetchCaseDetail, showFeedback]);

  const handleViewFile = useCallback(async (fileUrl?: string, fileTitle?: string) => {
    if (!fileUrl) return;
    try {
      if (fileUrl.startsWith("blob:") || fileUrl.startsWith("data:")) {
        window.open(fileUrl, "_blank");
        return;
      }

      const resolvedUrl = fileUrl.startsWith("http")
        ? fileUrl
        : `${API_BASE_URL}${fileUrl}`;

      const response = await axiosInstance.get(resolvedUrl);

      // If backend returns CaseNarrativeViewDTO { documentBase64: string }
      if (response.data && typeof response.data === "object" && response.data.documentBase64) {
        const base64Str = response.data.documentBase64;
        const byteCharacters = atob(base64Str);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);

        const win = window.open(blobUrl, "_blank");
        if (!win) {
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = fileTitle || "document.pdf";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        return;
      }

      // Fallback for direct binary response
      const blobResponse = await axiosInstance.get(resolvedUrl, { responseType: "blob" });
      const contentType = blobResponse.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([blobResponse.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      const win = window.open(blobUrl, "_blank");
      if (!win) {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileTitle || "file";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Failed to view file:", err);
      showFeedback({
        variant: "error",
        title: "Preview Unavailable",
        description: "Unable to preview file. Please ensure backend server is running.",
      });
    }
  }, [showFeedback]);

  const hasAutoLoadedLatest = useRef(false);

  useEffect(() => {
    hasAutoLoadedLatest.current = false;
    setActiveCaseId(caseId);
  }, [caseId]);

  useEffect(() => {
    fetchCaseDetail();
  }, [fetchCaseDetail, refreshKey]);

  useEffect(() => {
    if (caseDetail && caseDetail.caseHistory && caseDetail.caseHistory.length > 0 && !hasAutoLoadedLatest.current) {
      const latestItem = caseDetail.caseHistory.find((h) => h.isLatestActive) || caseDetail.caseHistory[caseDetail.caseHistory.length - 1];
      if (latestItem && String(latestItem.id) !== String(activeCaseId)) {
        hasAutoLoadedLatest.current = true;
        setActiveCaseId(latestItem.id);
      }
    }
  }, [caseDetail, activeCaseId]);

  const currentViewingStatus = caseDetail?.caseStatus;
  const displayStatus = getDisplayStatus(currentViewingStatus);
  const statusTone = getStatusTone(currentViewingStatus);

  const rootCaseNumber = useMemo(() => {
    if (caseDetail?.rootCaseNumber) return caseDetail.rootCaseNumber;
    if (caseDetail?.caseHistory && caseDetail.caseHistory.length > 0) {
      return caseDetail.caseHistory[0].caseNumber;
    }
    return caseDetail?.caseNumber || String(caseNumber || caseId);
  }, [caseDetail, caseNumber, caseId]);

  const historyItems = useMemo(() => {
    if (!caseDetail) return [];
    if (caseDetail.caseHistory && caseDetail.caseHistory.length > 0) {
      return caseDetail.caseHistory.map((h) => ({
        id: h.id,
        caseNo: h.caseNumber,
        filedDate: h.dateFiledFormatted,
        status: getDisplayStatus(h.status).toUpperCase(),
        isCurrent: h.isCurrent,
        isPast: h.isPast,
        isLatestActive: h.isLatestActive,
      }));
    }
    return [
      {
        id: caseDetail.id,
        caseNo: caseDetail.caseNumber,
        filedDate: formatDisplayDate(caseDetail.dateFiledFormatted || caseDetail.createdAt),
        status: displayStatus.toUpperCase(),
        isCurrent: true,
        isLatestActive: true,
      },
    ];
  }, [caseDetail, displayStatus]);

  const isForTheRecord = Boolean(
    String(caseDetail?.filingType || "").toUpperCase().includes("RECORD")
  );

  const normalizedCaseStatus = String(
    caseDetail?.caseStatus ||
    (caseDetail as any)?.effectiveStatus ||
    (caseDetail as any)?.status ||
    ''
  ).toUpperCase();
  const isSettled = normalizedCaseStatus === "SETTLED" || normalizedCaseStatus === "RESOLVED";
  const isUnderConciliation = normalizedCaseStatus.includes("CONCILIATION");
  const isCfaIssued = normalizedCaseStatus === "CERTIFIED_TO_FILE_ACTION" || normalizedCaseStatus === "CFA_ISSUED";
  const isExpired = normalizedCaseStatus === "EXPIRED_UNACTIONED" || normalizedCaseStatus === "EXPIRED";

  const isTerminal = TERMINAL_STATUSES.has(normalizedCaseStatus);

  const currentHistoryItem = historyItems.find((h) => h.isCurrent);
  const isLatestActive = currentHistoryItem ? Boolean(currentHistoryItem.isLatestActive) : true;
  const isAlreadyReopened = Boolean(caseDetail?.reOpenedCaseNumber && caseDetail.reOpenedCaseNumber.trim() !== "");
  const canReopen = hasPermission("Re-open Case") && !isForTheRecord && isTerminal && isLatestActive && !isAlreadyReopened && !isCfaIssued && !isExpired;
  const isCaseEditable = hasPermission("Edit Case") && isLatestActive && !isSettled && !isUnderConciliation && !isTerminal && !isCfaIssued && !isExpired;

  const noteItems = useMemo(
    () => (caseDetail ? buildNoteItems(caseDetail) : []),
    [caseDetail],
  );

  const timelineItems = useMemo(
    () =>
      caseDetail ? buildTimelineItems(caseDetail, displayStatus) : [],
    [caseDetail, displayStatus],
  );

  

  const tabs: DetailTab[] = useMemo(() => {
    if (!caseDetail) return [];

    return [
      {
        id: "overview",
        label: "Overview",
        content: (
          <div className="space-y-6">
            {!isLatestActive && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Historical Record
                    </span>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      This case cycle was resolved/dismissed and is currently in read-only mode.
                    </p>
                  </div>
                  <Badge tone="slate">READ ONLY</Badge>
                </div>
              </div>
            )}

            {!isSystemAdmin && isLatestActive && !isForTheRecord && (
              <DetailQuickActionCards
                onScheduleMediation={!isTerminal && !isUnderConciliation && !isSettled && hasPermission("Manage Mediation") ? () => setActiveTab('mediation') : undefined}
                onEscalateLupon={!isTerminal && !isUnderConciliation && !isSettled && hasPermission("Escalate to Lupon") ? () => setIsLuponModalOpen(true) : undefined}
                onMarkSettled={!isTerminal && !isUnderConciliation && !isSettled && hasPermission("Settled Case") ? () => setModalMode('settle') : undefined}
                onDismissCase={!isTerminal && !isUnderConciliation && !isSettled && hasPermission("Dismiss Case") ? () => setModalMode('dismiss') : undefined}
                onReopenCase={canReopen && hasPermission("Re-open Case") ? () => setModalMode('reopen') : undefined}
                isEscalateDisabled={false}
              />
            )}

            {Boolean(caseDetail.previousCaseNumber || caseDetail.reopenRemarks) && String(caseDetail.caseStatus || '').toUpperCase() !== 'SETTLED' && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Reason for Reopening
                  </span>
                  <Badge tone="sky">REOPENED CYCLE</Badge>
                </div>
                <p className="text-sm font-medium text-slate-800 mt-1">
                  {caseDetail.reopenRemarks || caseDetail.caseStatusRemarks || 'No reopening remarks recorded.'}
                </p>
              </div>
            )}

            {String(caseDetail.caseStatus || '').toUpperCase() === 'SETTLED' && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Settlement Agreement Terms
                  </span>
                  <Badge tone="emerald">SETTLED</Badge>
                </div>
                <p className="text-sm font-medium text-slate-800 mt-1">
                  {caseDetail.caseStatusRemarks || 'No settlement terms recorded.'}
                </p>
              </div>
            )}

            {String(caseDetail.caseStatus || '').toUpperCase() === 'DISMISSED' && (
              <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                    Reason for Dismissal
                  </span>
                  <Badge tone="rose">DISMISSED</Badge>
                </div>
                <p className="text-sm font-medium text-rose-950 leading-relaxed">
                  {caseDetail.caseStatusRemarks || 'No remarks recorded.'}
                </p>
              </div>
            )}

            {(String(caseDetail.caseStatus || '').toUpperCase() === 'CERTIFIED_TO_FILE_ACTION' || String(caseDetail.caseStatus || '').toUpperCase() === 'CFA_ISSUED') && (
              <div className="rounded-xl border border-purple-200/80 bg-purple-50/40 p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-purple-900 uppercase tracking-wider">
                    Certificate to File Action (CFA)
                  </span>
                  <Badge tone="violet">CERTIFIED TO FILE ACTION</Badge>
                </div>
                <p className="text-sm font-medium text-purple-950 leading-relaxed">
                  {caseDetail.caseStatusRemarks || 'Officially certified to file action in court under Katarungang Pambarangay provisions.'}
                </p>
              </div>
            )}

            {(String(caseDetail.caseStatus || '').toUpperCase() === 'EXPIRED_UNACTIONED' || String(caseDetail.caseStatus || '').toUpperCase() === 'EXPIRED') && (
              <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                    Case Status Notice
                  </span>
                  <Badge tone="rose">EXPIRED UNACTIONED</Badge>
                </div>
                <p className="text-sm font-medium text-rose-950 leading-relaxed">
                  {caseDetail.caseStatusRemarks || 'The mediation/conciliation period has lapsed without settlement action.'}
                </p>
              </div>
            )}

            {(isUnderConciliation || pangkatMembers.length > 0) && (
              <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                      Referred to Lupong Tagapamayapa
                    </span>
                    <Badge tone="indigo">UNDER CONCILIATION</Badge>
                  </div>
                  <span className="text-xs font-medium text-indigo-700">
                    Handled by Pangkat Tagapagkasundo
                  </span>
                </div>
                <p className="text-xs text-indigo-950">
                  This case has been referred to the Lupon Tagapamayapa for conciliation proceedings.
                </p>
                {pangkatMembers.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {pangkatMembers.map((m) => (
                      <div
                        key={m.panelMemberId || m.position}
                        className="p-3 rounded-xl border border-indigo-100 bg-white shadow-2xs"
                      >
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          Pangkat {m.position === 'CHAIRMAN' ? 'Chairman' : m.position === 'SECRETARY' ? 'Secretary' : 'Member'}
                        </p>
                        <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                          {m.officerName}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Document Reissuance Verification Card (FTJS Reissuance / Affidavit of Loss) */}
            {caseDetail.relatedBarangayService === 'FTJS_REISSUANCE' && (
              <div className="rounded-xl border border-blue-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        FTJS Certificate Re-issuance & Affidavit of Loss
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Official document reissuance verification for First-Time Jobseekers (RA 11261)
                      </p>
                    </div>
                  </div>
                  <div>
                    {caseDetail.documentReissuanceStatus === 'APPROVED_FOR_REISSUANCE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        Approved for Reissuance
                      </span>
                    ) : caseDetail.documentReissuanceStatus === 'COMPLETED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        Completed & Re-issued
                      </span>
                    ) : caseDetail.documentReissuanceStatus === 'REJECTED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Officer Verification
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      LINKED CERTIFICATE NO.
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                      {caseDetail.ftjsCertificateNumber || (caseDetail.ftjsApplicationId ? `FTJS Application #${caseDetail.ftjsApplicationId}` : "Linked Record")}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      REVIEWED BY
                    </span>
                    <span className="font-medium text-slate-800">
                      {caseDetail.documentReissuanceReviewedBy || "Awaiting Officer Review"}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      REVIEW TIMESTAMP
                    </span>
                    <span className="font-medium text-slate-800">
                      {caseDetail.documentReissuanceReviewedAt
                        ? formatDateTime(caseDetail.documentReissuanceReviewedAt)
                        : "—"}
                    </span>
                  </div>
                </div>

                {caseDetail.documentReissuanceRemarks && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-700 block mb-0.5">Verification Remarks:</span>
                    <span className="text-slate-600">{caseDetail.documentReissuanceRemarks}</span>
                  </div>
                )}

                {/* Action Buttons for Pending Verification */}
                {(!caseDetail.documentReissuanceStatus || caseDetail.documentReissuanceStatus === 'PENDING_VERIFICATION') && (
                  <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isVerifyingReissuance}
                      onClick={() => setIsRejectModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                    >
                      Reject Clearance
                    </button>
                    <button
                      type="button"
                      disabled={isVerifyingReissuance}
                      onClick={handleApproveReissuance}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                    >
                      {isVerifyingReissuance ? "Approving..." : "Approve for Re-issuance"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isForTheRecord && (
              <DetailCaseHistoryCard
                items={historyItems}
                onViewRecord={(clickedId) => {
                  if (clickedId) {
                    setActiveCaseId(clickedId);
                  }
                }}
              />
            )}

            {!isForTheRecord && isLatestActive && !isTerminal && (
              <DetailMediationBanner
                title="15-Day Mediation Period"
                filedDate={formatDisplayDate(
                  caseDetail.dateFiledFormatted || caseDetail.createdAt,
                )}
                deadlineDate={formatDate(
                  getFiledReferenceDate(caseDetail)
                    ? new Date(
                        getFiledReferenceDate(caseDetail)!.getTime() +
                          15 * 24 * 60 * 60 * 1000,
                      ).toISOString()
                    : null,
                )}
                totalDays={15}
                daysRemaining={getDaysRemaining(caseDetail)}
                isExtended={false}
                canExtend={false}
              />
            )}

            <DetailInfoCard
              title="Case Intake Summary"
              icon={<FileSearch className="h-4 w-4 text-blue-600" />}
              columns={2}
              fields={[
                {
                  label: "ENTRY TYPE",
                  value: getFilingTypeLabel(caseDetail.filingType),
                },
                {
                  label: "RECEIVING OFFICER",
                  value: caseDetail.receivingOfficer || "—",
                },
                ...(!isForTheRecord ? [{
                  label: isUnderConciliation ? "BLOTTER ASSIGNED OFFICER" : "ASSIGNED OFFICER",
                  value: caseDetail.assignedOfficer || "Unassigned",
                }] : []),
                ...(pangkatMembers.find(m => m.position === 'CHAIRMAN') ? [{
                  label: "PANGKAT CHAIRMAN",
                  value: pangkatMembers.find(m => m.position === 'CHAIRMAN')!.officerName,
                }] : []),
                ...(pangkatMembers.find(m => m.position === 'SECRETARY') ? [{
                  label: "PANGKAT SECRETARY",
                  value: pangkatMembers.find(m => m.position === 'SECRETARY')!.officerName,
                }] : []),
                ...(pangkatMembers.find(m => m.position === 'MEMBER') ? [{
                  label: "PANGKAT MEMBER",
                  value: pangkatMembers.find(m => m.position === 'MEMBER')!.officerName,
                }] : []),
                {
                  label: "LAST UPDATED",
                  value: formatDateTime(caseDetail.updatedAt),
                },
                ...(caseDetail.caseStatusRemarks && !caseDetail.caseStatusRemarks.toLowerCase().includes("referred to lupon") ? [{
                  label: "REASON / REMARKS",
                  value: caseDetail.caseStatusRemarks,
                }] : []),
                {
                  label: "WITNESS COUNT",
                  value: String(
                    caseDetail.witnesses?.length ??
                      caseDetail.witnessCount ??
                      0,
                  ),
                },
              ]}
            />

            <DetailCaseOverview
              complainant={{
                fullName:
                  caseDetail.complainant?.fullName ||
                  (caseDetail.complainant?.firstName
                    ? `${caseDetail.complainant.firstName} ${caseDetail.complainant.lastName || ''}`.trim()
                    : null) ||
                  caseDetail.complainantName ||
                  "—",
                name:
                  caseDetail.complainant?.fullName ||
                  (caseDetail.complainant?.firstName
                    ? `${caseDetail.complainant.firstName} ${caseDetail.complainant.lastName || ''}`.trim()
                    : null) ||
                  caseDetail.complainantName ||
                  "—",
                contactNumber:
                  caseDetail.complainant?.contactNumber ||
                  caseDetail.complainantContact ||
                  "—",
                currentAddress:
                  caseDetail.complainant?.completeAddress ||
                  caseDetail.complainantAddress ||
                  "—",
                address:
                  caseDetail.complainant?.completeAddress ||
                  caseDetail.complainantAddress ||
                  "—",
                age: caseDetail.complainant?.age,
                gender: caseDetail.complainant?.gender,
                civilStatus: caseDetail.complainant?.civilStatus,
                email: caseDetail.complainant?.email,
              }}
              respondent={{
                fullName:
                  caseDetail.respondent?.fullName ||
                  (caseDetail.respondent?.firstName
                    ? `${caseDetail.respondent.firstName} ${caseDetail.respondent.lastName || ''}`.trim()
                    : null) ||
                  (caseDetail.respondentName && caseDetail.respondentName !== '—' && caseDetail.respondentName !== 'N/A'
                    ? caseDetail.respondentName
                    : caseDetail.filingType === 'FOR_RECORD_ONLY'
                    ? "None (No Respondent)"
                    : "—"),
                name:
                  caseDetail.respondent?.fullName ||
                  (caseDetail.respondent?.firstName
                    ? `${caseDetail.respondent.firstName} ${caseDetail.respondent.lastName || ''}`.trim()
                    : null) ||
                  (caseDetail.respondentName && caseDetail.respondentName !== '—' && caseDetail.respondentName !== 'N/A'
                    ? caseDetail.respondentName
                    : caseDetail.filingType === 'FOR_RECORD_ONLY'
                    ? "None (No Respondent)"
                    : "—"),
                contactNumber:
                  caseDetail.respondent?.contactNumber ||
                  caseDetail.respondentContact ||
                  "—",
                address:
                  caseDetail.respondent?.completeAddress ||
                  caseDetail.respondentAddress ||
                  "—",
                currentAddress:
                  caseDetail.respondent?.completeAddress ||
                  caseDetail.respondentAddress ||
                  "—",
                relationshipToComplainant:
                  caseDetail.respondent?.relationshipToComplainant ||
                  caseDetail.relationshipToComplainant ||
                  "—",
                livingWithComplainant:
                  caseDetail.respondent?.currentlyLivingWithComplainant != null
                    ? (caseDetail.respondent.currentlyLivingWithComplainant ? "Yes" : "No")
                    : (caseDetail.respondent as any)?.livingWithComplainant != null
                    ? ((caseDetail.respondent as any).livingWithComplainant ? "Yes" : "No")
                    : caseDetail.currentlyLivingWithComplainant ||
                      caseDetail.isLivingTogether != null
                    ? (caseDetail.isLivingTogether ? "Yes" : "No")
                    : "No",
                age: caseDetail.respondent?.age,
                gender: caseDetail.respondent?.gender,
                civilStatus: caseDetail.respondent?.civilStatus,
                email: caseDetail.respondent?.email,
              }}
              incidentEvidence={{
                summary:
                  caseDetail.narrative?.statementSummary ||
                  caseDetail.narrativeStatement ||
                  caseDetail.statementSummary ||
                  "—",
                narrativeFileName: caseDetail.narrative?.fileName || 'Narrative_Statement.pdf',
                narrativeFileUrl:
                  (caseDetail.narrative?.hasFile || caseDetail.narrative?.fileData || caseDetail.narrative?.fileName)
                    ? `/api/v1/blotter/files/narrative/${caseDetail.id}`
                    : undefined,
                evidenceFiles:
                  caseDetail.evidences && caseDetail.evidences.length > 0
                    ? caseDetail.evidences.map((ev) => ({
                        type: ev.evidenceTypeName,
                        name: ev.fileName || 'Evidence File',
                        description: ev.description,
                        url: `/api/v1/blotter/files/evidence/${ev.id}`,
                      }))
                    : caseDetail.evidence
                    ? [
                        {
                          type: caseDetail.evidence.evidenceTypeName || 'Evidence Document',
                          name: caseDetail.evidence.fileName || 'Evidence File',
                          description: caseDetail.evidence.description,
                          url: `/api/v1/blotter/files/evidence/${caseDetail.evidence.id}`,
                        },
                      ]
                    : [],
              }}
              witnesses={
                caseDetail.witnesses && caseDetail.witnesses.length > 0
                  ? caseDetail.witnesses.map((w, idx) => ({
                      id: w.id || idx,
                      name:
                        w.fullName ||
                        (w.firstName
                          ? `${w.firstName} ${w.lastName || ''}`.trim()
                          : `Witness #${idx + 1}`),
                      address: w.address || w.completeAddress,
                      contact: w.contactNumber,
                      testimonyText: w.testimonyText,
                      testimonyUrl: (w.hasTestimonyFile || w.testimonyFile)
                        ? `/api/v1/blotter/files/witness/${w.id || w.personId}`
                        : undefined,
                    }))
                  : []
              }
              caseInfo={{
                caseNumber: caseDetail.caseNumber,
                status: displayStatus,
                remarks:
                  caseDetail.narrative?.statementSummary ||
                  caseDetail.statementSummary ||
                  "—",
                dateFiled: formatDisplayDate(
                  caseDetail.dateFiledFormatted || caseDetail.createdAt,
                ),
                assignedOfficer: !isForTheRecord && caseDetail.assignedOfficer ? caseDetail.assignedOfficer : undefined,
                natureOfComplaint:
                  caseDetail.incident?.natureOfComplaint ||
                  caseDetail.natureOfComplaint ||
                  "—",
                incidentDate: formatDisplayDate(
                  caseDetail.incident?.dateOfIncident ||
                    caseDetail.dateOfIncident,
                ),
                incidentTime: formatDisplayTime(
                  caseDetail.incident?.timeOfIncident ||
                    caseDetail.timeOfIncident,
                ),
                incidentPlace:
                  caseDetail.incident?.placeOfIncident ||
                  caseDetail.incidentLocation ||
                  "—",
                frequency: caseDetail.incident?.frequencyOfIncident,
                descriptionOfInjuries:
                  caseDetail.incident?.descriptionOfInjuries ||
                  caseDetail.injuriesDamagesDescription ||
                  "None reported",
              }}
              onViewFile={handleViewFile}
            />

          </div>
        ),
      },
      ...(!isForTheRecord
        ? [
            {
              id: "mediation",
              label: "Mediation",
              content: !hasPermission("Manage Mediation") ? (
                <div className="py-6 flex items-center justify-center">
                  <PermissionDeniedPage
                    compact
                    title="You don't have permission to access Mediation!"
                    message="The owner of the workspace has not given you permission to manage mediation hearings. Please contact the owner of the workspace."
                  />
                </div>
              ) : (
                <MediationHearingsPanel
                  caseId={caseDetail.id}
                  caseNumber={caseDetail.caseNumber}
                  dateFiled={caseDetail.dateFiledFormatted || caseDetail.createdAt}
                  complainantName={
                    caseDetail.complainant?.fullName ||
                    (caseDetail.complainant?.firstName
                      ? `${caseDetail.complainant.firstName} ${caseDetail.complainant.lastName || ''}`.trim()
                      : null) ||
                    caseDetail.complainantName ||
                    'Complainant'
                  }
                  respondentName={
                    caseDetail.respondent?.fullName ||
                    (caseDetail.respondent?.firstName
                      ? `${caseDetail.respondent.firstName} ${caseDetail.respondent.lastName || ''}`.trim()
                      : null) ||
                    caseDetail.respondentName ||
                    'Respondent'
                  }
                  natureOfComplaint={
                    caseDetail.incident?.natureOfComplaint ||
                    caseDetail.natureOfComplaint ||
                    'Barangay Complaint'
                  }
                  isTerminal={isSystemAdmin || isTerminal || isUnderConciliation || isSettled}
                  onSessionChange={fetchCaseDetail}
                />
              ),
            },
          ]
        : []),
      {
        id: "notes",
        label: "Case Notes",
        content: !hasPermission("Manage Notes") ? (
          <div className="py-6 flex items-center justify-center">
            <PermissionDeniedPage
              compact
              title="You don't have permission to access Case Notes!"
              message="The owner of the workspace has not given you permission to manage case notes. Please contact the owner of the workspace."
            />
          </div>
        ) : (
          <DetailCaseNotesPanel
            caseId={caseDetail.id}
            notes={noteItems}
            onNotesCountChange={setNotesCount}
            isReadOnly={isSystemAdmin || !isLatestActive || isTerminal || isUnderConciliation || isSettled}
            onFetchNotes={async (id) => {
              const res = await blotterApi.getCaseNotes(id);
              return res.map((n) => ({
                id: n.id,
                note: n.note,
                createdBy: n.createdBy,
                createdAt: n.createdAt,
              }));
            }}
            onAddNote={async (id, noteText) => {
              const res = await blotterApi.addCaseNote(id, noteText);
              return {
                id: res.id,
                note: res.note,
                createdBy: res.createdBy,
                createdAt: res.createdAt,
              };
            }}
            emptyTitle="Case Notes"
            emptyDescription="No case notes or narrative summary have been recorded for this case yet."
          />
        ),
      },

      {
        id: "timeline",
        label: "Timeline",
        content: (
          <DetailTimelinePanel
            caseId={caseDetail.id}
            items={timelineItems}
            emptyTitle="Case Timeline"
            emptyDescription="No timeline events are available for this case yet."
          />
        ),
      },
    ];
  }, [
    caseDetail,
    displayStatus,
    isTerminal,
    isUnderConciliation,
    isSettled,
    isForTheRecord,
    isLatestActive,
    canReopen,
    isSystemAdmin,
    historyItems,
    noteItems,
    timelineItems,
    handleViewFile,
    fetchCaseDetail,
  ]);

  
  return (
    <>
    <CaseReasonModal
      open={modalMode === 'dismiss'}
      title="Dismiss Case"
      caseNumber={caseDetail?.caseNumber}
      caseLabel={getFilingTypeLabel(caseDetail?.filingType).toLowerCase()}
      placeholder="Provide a reason for dismissing this case..."
      confirmLabel="Dismiss Case"
      confirmTone="rose"
      isLoading={isSubmittingModal}
      onCancel={() => setModalMode(null)}
      onConfirm={async (reason) => {
        if (!caseDetail) return;
        setIsSubmittingModal(true);
        try {
          await blotterApi.updateStatus(caseDetail.id, 'DISMISSED', reason);
          setModalMode(null);
          showFeedback({
            variant: "success",
            title: "Case Dismissed",
            description: `Case ${caseDetail.caseNumber || ''} has been successfully dismissed.`,
          });
          await fetchCaseDetail();
          onDismiss?.();
        } catch (err: any) {
          console.error("Failed to dismiss case:", err);
          showFeedback({
            variant: "error",
            title: "Dismiss Case Failed",
            description: err?.message || err?.response?.data?.error || "Failed to dismiss case. Please try again.",
          });
        } finally {
          setIsSubmittingModal(false);
        }
      }}
    />

    <CaseReasonModal
      open={modalMode === 'reopen'}
      title="Re-open Case"
      caseNumber={caseDetail?.caseNumber}
      caseLabel={getFilingTypeLabel(caseDetail?.filingType).toLowerCase()}
      placeholder="Provide a reason for this status change..."
      confirmLabel="Re-open Case"
      confirmTone="blue"
      isLoading={isSubmittingModal}
      onCancel={() => setModalMode(null)}
      onConfirm={async (reason) => {
        if (!caseDetail) return;
        setIsSubmittingModal(true);
        try {
          const newCase = await blotterApi.reopenCase(caseDetail.id, reason);
          setModalMode(null);
          showFeedback({
            variant: "success",
            title: "Case Reopened",
            description: `Case reopened successfully! New cycle: ${newCase.caseNumber || 'Active'}`,
          });
          onReopen?.();
          if (newCase.id) {
            setActiveCaseId(newCase.id);
          } else {
            await fetchCaseDetail();
          }
        } catch (err: any) {
          console.error("Failed to reopen case:", err);
          showFeedback({
            variant: "error",
            title: "Reopen Case Failed",
            description: err?.message || err?.response?.data?.error || "Failed to reopen case. Please try again.",
          });
        } finally {
          setIsSubmittingModal(false);
        }
      }}
    />

    <CaseReasonModal
      open={modalMode === 'settle'}
      title="Mark Case as Settled"
      caseNumber={caseDetail?.caseNumber}
      caseLabel={getFilingTypeLabel(caseDetail?.filingType).toLowerCase()}
      placeholder="Enter settlement terms or agreement summary..."
      confirmLabel="Mark as Settled"
      confirmTone="emerald"
      isLoading={isSubmittingModal}
      onCancel={() => setModalMode(null)}
      onConfirm={async (remarks) => {
        if (!caseDetail) return;
        setIsSubmittingModal(true);
        try {
          await blotterApi.updateStatus(caseDetail.id, 'SETTLED', remarks);
          setModalMode(null);
          showFeedback({
            variant: "success",
            title: "Case Settled",
            description: `Case ${caseDetail.caseNumber || ''} has been officially marked as settled.`,
          });
          await fetchCaseDetail();
          onSettle?.();
        } catch (err: any) {
          console.error("Failed to settle case:", err);
          showFeedback({
            variant: "error",
            title: "Settle Case Failed",
            description: err?.message || err?.response?.data?.error || "Failed to mark case as settled. Please try again.",
          });
        } finally {
          setIsSubmittingModal(false);
        }
      }}
    />
  
    <DetailCaseDetailsShell
      backLabel="Back to Blotter Records"
      onBack={onBack}
      isLoading={isLoading}
      isNotFound={!isLoading && !caseDetail}
      notFoundActionLabel="Return to Blotter Records"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      header={
        <DetailCaseHeader
          title={rootCaseNumber}
          subtitle={
            caseDetail?.natureOfComplaint ||
            "Barangay Case Record"
          }
          status={
            <Badge tone={statusTone}>{displayStatus.toUpperCase()}</Badge>
          }

          actions={
            !isSystemAdmin ? (
              <div className="flex items-center gap-2.5 flex-nowrap shrink-0">
                {isCaseEditable && hasPermission('Edit Case') && (
                  <DetailActionButton icon={<Edit3 size={16} />} onClick={() => setIsEditModalOpen(true)}>
                    Edit Case
                  </DetailActionButton>
                )}
                {canReopen && hasPermission('Re-open Case') ? (
                  <DetailActionButton
                    tone="primary"
                    icon={<RotateCcw size={16} />}
                    onClick={() => setModalMode('reopen')}
                  >
                    Re-open Case
                  </DetailActionButton>
                ) : null}
              </div>
            ) : undefined
          }
        />
      }
      tabs={tabs}
    />

    {/* Dedicated Edit Case Modal */}
    {caseDetail && (
      <EditCaseModal
        isOpen={isEditModalOpen}
        caseRecord={caseDetail}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          fetchCaseDetail();
          onEdit?.();
        }}
        showFeedback={showFeedback}
      />
    )}

    {/* Dedicated Refer to Lupon Modal */}
    {caseDetail && (
      <ReferToLuponModal
        isOpen={isLuponModalOpen}
        caseNumber={caseDetail.caseNumber}
        caseId={caseDetail.id}
        onClose={() => setIsLuponModalOpen(false)}
        onSuccess={() => {
          fetchCaseDetail();
        }}
        showFeedback={showFeedback}
      />
    )}

    {/* Extend Case Modal */}
    <CaseReasonModal
      open={isExtendModalOpen}
      title="Extend Mediation Period"
      label="Reason for Extension"
      caseNumber={caseDetail?.caseNumber}
      caseLabel="+15 days"
      placeholder="State the reason for extending the mediation period..."
      confirmLabel="Confirm Extension"
      confirmTone="blue"
      maxLength={1000}
      isLoading={isSubmittingExtend}
      onConfirm={handleConfirmExtend}
      onCancel={() => setIsExtendModalOpen(false)}
    />

    {/* Reject Re-issuance Modal */}
    {isRejectModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Reject Re-issuance Clearance</h3>
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              &times;
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Please provide an official reason for rejecting this document reissuance request.
          </p>
          <textarea
            rows={3}
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            placeholder="e.g. Incomplete Affidavit of Loss, discrepancy with resident identity, or unverified claims..."
            className="w-full px-3 py-2 text-xs border border-slate-200 focus:border-rose-400 rounded-xl outline-none"
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!rejectRemarks.trim() || isVerifyingReissuance}
              onClick={handleRejectReissuance}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {isVerifyingReissuance ? "Submitting..." : "Confirm Rejection"}
            </button>
          </div>
        </div>
      </div>
    )}

    <FeedbackDialog {...feedbackDialogProps} />
    </>
  );
}
