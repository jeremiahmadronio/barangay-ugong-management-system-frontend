import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit3, FileSearch, Scale } from "lucide-react";
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
  DetailTimelinePanel,
  type DetailCaseNoteItem,
  type DetailTab,
  type DetailTimelineItem,
} from "@/components/ui/details";
import { Badge } from "@/components/ui/table/Badge";
import {
  blotterApi,
  type BlotterBackendResponse,
} from "@/api/modules/blotter.api";
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

function getStatusTone(status?: string | null) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "SETTLED" || normalized === "RESOLVED") return "emerald";
  if (normalized === "DISMISSED" || normalized === "WITHDRAWN") return "slate";
  if (normalized.includes("MEDIATION") || normalized.includes("CONCILIATION"))
    return "amber";

  return "sky";
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "—";
  if (/^[A-Z][a-z]{2}\s+\d{2},\s+\d{4}$/.test(value)) return value;
  return formatDate(value);
}

function getFiledReferenceDate(caseDetail: BlotterBackendResponse | null) {
  if (!caseDetail?.createdAt) return null;
  const parsed = new Date(caseDetail.createdAt);
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
  const [caseDetail, setCaseDetail] = useState<BlotterBackendResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    let isMounted = true;

    const fetchCaseDetail = async () => {
      setIsLoading(true);
      try {
        const data = await blotterApi.getById(caseId);
        if (isMounted) {
          setCaseDetail(data);
        }
      } catch (error) {
        console.error("Failed to fetch blotter case detail:", error);
        if (isMounted) {
          setCaseDetail(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCaseDetail();

    return () => {
      isMounted = false;
    };
  }, [caseId, refreshKey]);

  const displayStatus = getDisplayStatus(caseDetail?.caseStatus);
  const statusTone = getStatusTone(caseDetail?.caseStatus);
  const isTerminal = TERMINAL_STATUSES.has(
    String(caseDetail?.caseStatus || "").toUpperCase(),
  );

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
            <DetailCaseHistoryCard
              items={[
                {
                  caseNo: caseDetail.caseNumber,
                  filedDate: formatDisplayDate(
                    caseDetail.dateFiledFormatted || caseDetail.createdAt,
                  ),
                  status: displayStatus.toUpperCase(),
                  isCurrent: true,
                },
              ]}
            />

            {!isTerminal && (
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
                {
                  label: "WITNESS COUNT",
                  value: String(caseDetail.witnessCount ?? 0),
                },
              ]}
            />

            <DetailCaseOverview
              complainant={{
                fullName: caseDetail.complainantName || "—",
                contactNumber: caseDetail.complainantContact || "—",
                currentAddress: caseDetail.complainantAddress || "—",
              }}
              respondent={{
                name: caseDetail.respondentName || "—",
                contactNumber: caseDetail.respondentContact || "—",
                relationshipToComplainant:
                  caseDetail.relationshipToComplainant || "—",
                address: caseDetail.respondentAddress || "—",
              }}
              incidentEvidence={{
                summary:
                  caseDetail.statementSummary ||
                  caseDetail.statementText ||
                  "—",
              }}
              caseInfo={{
                caseNumber: caseDetail.caseNumber,
                status: displayStatus,
                remarks: caseDetail.statementSummary || "—",
                dateFiled: formatDisplayDate(
                  caseDetail.dateFiledFormatted || caseDetail.createdAt,
                ),
                assignedOfficer: caseDetail.assignedOfficer || "Unassigned",
                natureOfComplaint: caseDetail.natureOfComplaint || "—",
                incidentDate: formatDisplayDate(caseDetail.dateOfIncident),
                incidentPlace: caseDetail.incidentLocation || "—",
                descriptionOfInjuries:
                  caseDetail.injuriesDamagesDescription || "None reported",
              }}
            />
          </div>
        ),
      },
      {
        id: "mediation",
        label: "Mediation",
        content: isTerminal ? (
          <DetailEmptyPanel
            icon={<Scale className="h-10 w-10" />}
            title="Mediation Proceedings"
            description={`This case is already ${displayStatus.toLowerCase()}, so there are no active mediation steps to show.`}
          />
        ) : (
          <DetailEmptyPanel
            icon={<Scale className="h-10 w-10" />}
            title="Mediation Proceedings"
            description="Scheduled mediation sessions and hearing notes will appear here once they are recorded."
          />
        ),
      },
      {
        id: "notes",
        label: `Case Notes (${noteItems.length})`,
        content: (
          <DetailCaseNotesPanel
            notes={noteItems}
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
          title={caseDetail?.caseNumber || String(caseNumber || caseId)}
          subtitle={
            caseDetail?.natureOfComplaint ||
            "Barangay Case Record"
          }
          status={
            <Badge tone={statusTone}>{displayStatus.toUpperCase()}</Badge>
          }
          meta={
            <Badge tone="slate">
              {getFilingTypeLabel(caseDetail?.filingType)}
            </Badge>
          }

          actions={
            <>
              {onEdit ? (
                <DetailActionButton icon={<Edit3 size={17} />} onClick={onEdit}>
                  Edit Case
                </DetailActionButton>
              ) : null}
              {onSettle && !isTerminal ? (
                <DetailActionButton
                  tone="emerald"
                  icon={<CheckCircle2 size={17} />}
                  onClick={onSettle}
                >
                  Mark as Settled
                </DetailActionButton>
              ) : null}
            </>
          }
        />
      }
      tabs={tabs}
    />
  );
}
