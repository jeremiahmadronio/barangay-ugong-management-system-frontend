import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit3, FileSearch, Scale, RotateCcw, AlertTriangle } from "lucide-react";
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
import {
  blotterApi,
  type BlotterBackendResponse,
} from "@/api/modules/blotter.api";
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
  refreshKey?: number;
}

const TERMINAL_STATUSES = new Set([
  "SETTLED",
  "DISMISSED",
  "WITHDRAWN",
  "RESOLVED",
]);

function getDisplayStatus(status?: string | null) {
  if (!status) return "Pending";
  return formatEnumLabel(status);
}

function getStatusTone(status?: string | null): BadgeTone {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "SETTLED" || normalized === "RESOLVED") return "emerald";
  if (normalized === "DISMISSED" || normalized === "WITHDRAWN") return "rose";
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
  if (!filedDate) return 15;

  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsedDays = Math.floor((Date.now() - filedDate.getTime()) / msPerDay);
  return Math.max(0, 15 - elapsedDays);
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
      title: "Case Filed",
      timestamp: formatDateTime(caseDetail.createdAt),
      description: `${getFilingTypeLabel(caseDetail.filingType)} intake recorded.`,
    },
  ];

  if (caseDetail.assignedOfficer) {
    timelineItems.push({
      id: "assigned-officer",
      title: "Case Assigned",
      timestamp: formatDateTime(caseDetail.updatedAt || caseDetail.createdAt),
      description: `Assigned to ${caseDetail.assignedOfficer}.`,
    });
  }

  if (caseDetail.updatedAt && caseDetail.updatedAt !== caseDetail.createdAt) {
    timelineItems.push({
      id: "case-updated",
      title: "Latest Case Update",
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
  refreshKey = 0,
}: BlotterCaseDetailsViewProps) {
  const [activeCaseId, setActiveCaseId] = useState<string | number>(caseId);
  const [caseDetail, setCaseDetail] = useState<BlotterBackendResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [notesCount, setNotesCount] = useState<number>(0);
  const [modalMode, setModalMode] = useState<'dismiss' | 'reopen' | null>(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const { showFeedback, feedbackDialogProps } = useDialogs();

  const handleViewFile = useCallback(async (fileUrl?: string, fileTitle?: string) => {
    if (!fileUrl) return;
    try {
      if (fileUrl.startsWith("blob:") || fileUrl.startsWith("data:")) {
        window.open(fileUrl, "_blank");
        return;
      }

      // If the URL is relative (starts with /), resolve it against the API base URL
      // so we hit the Spring Boot backend (8080), not the Vite dev server (5173).
      const resolvedUrl = fileUrl.startsWith("http")
        ? fileUrl
        : `${API_BASE_URL}${fileUrl}`;

      const response = await axiosInstance.get(resolvedUrl, {
        responseType: "blob",
      });

      const contentType =
        response.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
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


  const fetchCaseDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await blotterApi.getById(activeCaseId);
      setCaseDetail(data);
    } catch (error) {
      console.error("Failed to fetch blotter case detail:", error);
      setCaseDetail(null);
    } finally {
      setIsLoading(false);
    }

  }, [activeCaseId]);

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
      const latestItem = caseDetail.caseHistory.find((h) => h.isLatestActive);
      if (latestItem && String(latestItem.id) !== String(activeCaseId) && String(caseId) === String(activeCaseId)) {
        hasAutoLoadedLatest.current = true;
        setActiveCaseId(latestItem.id);
      }
    }
  }, [caseDetail, caseId, activeCaseId]);

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

  const isTerminal = TERMINAL_STATUSES.has(
    String(caseDetail?.caseStatus || "").toUpperCase(),
  );

  const currentHistoryItem = historyItems.find((h) => h.isCurrent);
  const isLatestActive = currentHistoryItem ? Boolean(currentHistoryItem.isLatestActive) : true;
  const isAlreadyReopened = Boolean(caseDetail?.reOpenedCaseNumber && caseDetail.reOpenedCaseNumber.trim() !== "");
  const canReopen = isTerminal && isLatestActive && !isAlreadyReopened;

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

            {isLatestActive && !isTerminal && (
              <DetailQuickActionCards
                onScheduleMediation={() => setActiveTab('mediation')}
                onEscalateLupon={() => showFeedback({ variant: 'error', title: 'Lupon Referral', description: 'Refer to Lupon feature is coming soon.' })}
                onEditCase={onEdit}
                onMarkSettled={onSettle}
                onDismissCase={() => setModalMode('dismiss')}
                onReopenCase={canReopen ? () => setModalMode('reopen') : undefined}
                isEscalateDisabled={false}
              />
            )}

            {Boolean(caseDetail.previousCaseNumber || caseDetail.reopenRemarks) && (
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

            {String(caseDetail.caseStatus || '').toUpperCase() === 'DISMISSED' && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Reason for Dismissal
                  </span>
                  <Badge tone="rose">DISMISSED</Badge>
                </div>
                <p className="text-sm font-medium text-slate-800 mt-1">
                  {caseDetail.caseStatusRemarks || 'No remarks recorded.'}
                </p>
              </div>
            )}

            <DetailCaseHistoryCard
              items={historyItems}
              onViewRecord={(clickedId) => {
                if (clickedId) {
                  setActiveCaseId(clickedId);
                }
              }}
            />

            {isLatestActive && !isTerminal && (
              <DetailMediationBanner
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
                daysRemaining={getDaysRemaining(caseDetail)}
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
                {
                  label: "ASSIGNED OFFICER",
                  value: caseDetail.assignedOfficer || "Unassigned",
                },
                {
                  label: "LAST UPDATED",
                  value: formatDateTime(caseDetail.updatedAt),
                },
                ...(caseDetail.caseStatusRemarks ? [{
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
                contactNumber:
                  caseDetail.complainant?.contactNumber ||
                  caseDetail.complainantContact ||
                  "—",
                currentAddress:
                  caseDetail.complainant?.completeAddress ||
                  caseDetail.complainantAddress ||
                  "—",
                age: caseDetail.complainant?.age,
                gender: caseDetail.complainant?.gender,
                civilStatus: caseDetail.complainant?.civilStatus,
                email: caseDetail.complainant?.email,
              }}
              respondent={{
                name:
                  caseDetail.respondent?.fullName ||
                  (caseDetail.respondent?.firstName
                    ? `${caseDetail.respondent.firstName} ${caseDetail.respondent.lastName || ''}`.trim()
                    : null) ||
                  caseDetail.respondentName ||
                  "—",
                contactNumber:
                  caseDetail.respondent?.contactNumber ||
                  caseDetail.respondentContact ||
                  "—",
                relationshipToComplainant:
                  caseDetail.respondent?.relationshipToComplainant ||
                  caseDetail.relationshipToComplainant ||
                  "—",
                address:
                  caseDetail.respondent?.completeAddress ||
                  caseDetail.respondentAddress ||
                  "—",
                livingWithComplainant:
                  caseDetail.respondent?.currentlyLivingWithComplainant !== undefined
                    ? caseDetail.respondent.currentlyLivingWithComplainant
                      ? "Yes"
                      : "No"
                    : undefined,
                age: caseDetail.respondent?.age,
                gender: caseDetail.respondent?.gender,
                occupation: caseDetail.respondent?.occupation,
              }}
              incidentEvidence={{
                summary:
                  caseDetail.narrative?.statementSummary ||
                  caseDetail.narrative?.statementText ||
                  caseDetail.statementSummary ||
                  caseDetail.statementText ||
                  "—",
                narrativeFileName: caseDetail.narrative?.fileName,
                narrativeFileUrl: caseDetail.narrative?.fileName
                  ? `/api/v1/blotter/files/narrative/${caseDetail.id}`
                  : undefined,
                evidenceFiles:
                  caseDetail.evidences && caseDetail.evidences.length > 0
                    ? caseDetail.evidences.map((ev) => ({
                        type:
                          ev.evidenceTypeName ||
                          ev.evidenceType ||
                          "General Evidence",
                        name: ev.fileName || "Evidence File",
                        description: ev.description || ev.remarks,
                        url:
                          ev.mediaPath ||
                          `/api/v1/blotter/files/evidence/${ev.id || caseDetail.id}`,
                      }))
                    : caseDetail.evidence
                    ? [
                        {
                          type:
                            caseDetail.evidence.evidenceTypeName ||
                            caseDetail.evidence.evidenceType ||
                            "General Evidence",
                          name:
                            caseDetail.evidence.fileName ||
                            "Evidence File",
                          description:
                            caseDetail.evidence.description ||
                            caseDetail.evidence.remarks,
                          url:
                            caseDetail.evidence.mediaPath ||
                            `/api/v1/blotter/files/evidence/${caseDetail.evidence.id || caseDetail.id}`,
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
                      testimonyUrl: w.hasTestimonyFile
                        ? `/api/v1/blotter/files/witness/${w.id}`
                        : undefined,
                    }))
                  : []
              }

              onViewFile={handleViewFile}



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
                assignedOfficer: caseDetail.assignedOfficer || "Unassigned",
                natureOfComplaint:
                  caseDetail.incident?.natureOfComplaint ||
                  caseDetail.natureOfComplaint ||
                  "—",
                incidentDate: formatDisplayDate(
                  caseDetail.incident?.dateOfIncident ||
                    caseDetail.dateOfIncident,
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
            />

          </div>
        ),
      },
      {
        id: "mediation",
        label: "Mediation",
        content: (
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
            isTerminal={isTerminal}
            onSessionChange={fetchCaseDetail}
          />
        ),


      },
      {
        id: "notes",
        label: "Case Notes",
        content: (
          <DetailCaseNotesPanel
            caseId={caseDetail.id}
            notes={noteItems}
            onNotesCountChange={setNotesCount}
            isReadOnly={!isLatestActive || isTerminal}
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
    noteItems,
    timelineItems,
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
            await fetchCaseDetail();
            showFeedback({
              variant: "success",
              title: "Case Dismissed",
              description: `Case ${caseDetail.caseNumber || ''} has been successfully dismissed.`,
            });
          } catch (err: any) {
            console.error("Failed to dismiss case:", err);
            showFeedback({
              variant: "error",
              title: "Dismiss Case Failed",
              description: err?.response?.data?.error || "Failed to dismiss case. Please try again.",
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
            await fetchCaseDetail();
            showFeedback({
              variant: "success",
              title: "Case Reopened",
              description: `Case reopened successfully! New case created: ${newCase.caseNumber}`,
            });
          } catch (err: any) {
            console.error("Failed to reopen case:", err);
            showFeedback({
              variant: "error",
              title: "Reopen Case Failed",
              description: err?.response?.data?.error || "Failed to reopen case. Please try again.",
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
          meta={
            <div className="flex items-center gap-2">
              <Badge tone="slate">
                {getFilingTypeLabel(caseDetail?.filingType)}
              </Badge>
              {Boolean(caseDetail?.caseNumber && caseDetail.caseNumber !== rootCaseNumber) && (
                <Badge tone="indigo">
                  Viewing Cycle: {caseDetail?.caseNumber}
                </Badge>
              )}
            </div>
          }

          actions={
            <>
              {onEdit ? (
                <DetailActionButton icon={<Edit3 size={17} />} onClick={onEdit}>
                  Edit Case
                </DetailActionButton>
              ) : null}
              {canReopen ? (
                <DetailActionButton
                  tone="sky"
                  icon={<RotateCcw size={17} />}
                  onClick={() => setModalMode('reopen')}
                >
                  Re-open Case
                </DetailActionButton>
              ) : null}
            </>
          }
        />
      }
      tabs={tabs}
    />
    <FeedbackDialog {...feedbackDialogProps} />
    </>
  );
}
