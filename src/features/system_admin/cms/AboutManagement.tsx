import { useState, useEffect, useRef } from "react";
import { settingsApi } from "../../../cms-api/settingsApi";
import { Save, Pencil, Trash2, Upload, Image as ImageIcon, Plus, X } from "lucide-react";
import { useUnsavedChanges } from "../../../context/UnsavedChangesContext";
import { PageHeader, ConfirmationDialog, FeedbackDialog } from "@/components/ui";
import { useDialogs } from "@/hooks/useDialogs";

const SectionHeader = ({
  title,
  subtitle,
  isEditing,
  saving,
  onEdit,
  onCancel,
  onSave,
}: {
  title: string;
  subtitle?: string;
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) => (
  <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
    <div>
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-2">
      {!isEditing ? (
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </>
      )}
    </div>
  </div>
);

const CharCount = ({ value, max, min }: { value?: string; max: number; min?: number }) => {
  const len = (value || "").length;
  const isOver = len > max;
  const isUnder = min !== undefined && len > 0 && len < min;
  return (
    <span
      className={`text-[11px] font-medium font-mono ${
        isOver ? "text-rose-500 font-bold" : isUnder ? "text-amber-500" : "text-slate-400"
      }`}
    >
      {len}/{max}
    </span>
  );
};

const FieldError = ({ error }: { error?: string }) => {
  if (!error) return null;
  return (
    <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
      <span>⚠</span> {error}
    </p>
  );
};

export const AboutManagement = () => {
  const LIMITS = {
    stats: {
      value: { min: 1, max: 20 },
      label: { min: 2, max: 40 },
    },
    vision: { min: 10, max: 600 },
    mission: { min: 10, max: 600 },
    history: {
      title: { min: 3, max: 100 },
      description: { min: 20, max: 1000 },
      year: { min: 1, max: 12 },
      text: { min: 3, max: 160 },
    },
    purpose: {
      title: { min: 3, max: 100 },
      description1: { min: 10, max: 600 },
      description2: { min: 5, max: 300 },
      feature: { min: 3, max: 60 },
      maxFeatures: 6,
    },
    pageHeaders: {
      title: { min: 3, max: 80 },
      description: { min: 5, max: 300 },
    },
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploadingHistoryImage, setUploadingHistoryImage] = useState(false);
  const historyFileInputRef = useRef<HTMLInputElement>(null);
  const { setHasUnsavedChanges } = useUnsavedChanges();

  const [isEditingStats, setIsEditingStats] = useState(false);
  const [isEditingVisionMission, setIsEditingVisionMission] = useState(false);
  const [isEditingHistory, setIsEditingHistory] = useState(false);
  const [isEditingPurpose, setIsEditingPurpose] = useState(false);
  const [isEditingPageHeaders, setIsEditingPageHeaders] = useState(false);

  // Stats
  const [statsData, setStatsData] = useState<{ value: string; label: string }[]>([]);
  const [originalStatsData, setOriginalStatsData] = useState<{ value: string; label: string }[]>([]);
  const [statsErrors, setStatsErrors] = useState<Record<number, { value?: string; label?: string }>>({});

  // About Section (Vision, Mission, History, Purpose)
  const [aboutSectionData, setAboutSectionData] = useState<{
    visionMission: { vision: string; mission: string };
    history: { title: string; description: string; imageUrl: string; timeline: { year: string; text: string }[] };
    purpose: { title: string; description1: string; description2: string; features: string[] };
  }>({
    visionMission: { vision: "", mission: "" },
    history: { title: "", description: "", imageUrl: "", timeline: [] },
    purpose: { title: "", description1: "", description2: "", features: [] },
  });
  const [originalAboutSectionData, setOriginalAboutSectionData] = useState<any>(null);

  // Errors
  const [visionMissionErrors, setVisionMissionErrors] = useState<{ vision?: string; mission?: string }>({});
  const [historyErrors, setHistoryErrors] = useState<{
    title?: string;
    description?: string;
    timeline?: Record<number, { year?: string; text?: string }>;
  }>({});
  const [purposeErrors, setPurposeErrors] = useState<{
    title?: string;
    description1?: string;
    description2?: string;
    features?: string;
  }>({});
  const [newFeatureText, setNewFeatureText] = useState("");
  const [featureInputError, setFeatureInputError] = useState("");

  // Page Headers
  const [pageHeadersData, setPageHeadersData] = useState({
    announcements: { title: "Announcements", description: "Official notices, advisories, and program updates published by the barangay." },
    officials: { title: "Barangay Officials", description: "The elected and appointed officers serving the community, arranged by council structure." },
  });
  const [originalPageHeadersData, setOriginalPageHeadersData] = useState(pageHeadersData);
  const [pageHeadersErrors, setPageHeadersErrors] = useState<{
    announcementsTitle?: string;
    announcementsDesc?: string;
    officialsTitle?: string;
    officialsDesc?: string;
  }>({});

  const { confirm: showConfirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs();

  const isEditingAny = isEditingStats || isEditingVisionMission || isEditingHistory || isEditingPurpose || isEditingPageHeaders;
  const isStatsDirty = JSON.stringify(statsData) !== JSON.stringify(originalStatsData);
  const isVisionMissionDirty = originalAboutSectionData && JSON.stringify(aboutSectionData.visionMission) !== JSON.stringify(originalAboutSectionData.visionMission);
  const isHistoryDirty = originalAboutSectionData && JSON.stringify(aboutSectionData.history) !== JSON.stringify(originalAboutSectionData.history);
  const isPurposeDirty = originalAboutSectionData && JSON.stringify(aboutSectionData.purpose) !== JSON.stringify(originalAboutSectionData.purpose);
  const isAboutDirty = isVisionMissionDirty || isHistoryDirty || isPurposeDirty;
  const isPageHeadersDirty = JSON.stringify(pageHeadersData) !== JSON.stringify(originalPageHeadersData);

  useEffect(() => {
    setHasUnsavedChanges(isEditingAny || isStatsDirty || isAboutDirty || isPageHeadersDirty);
  }, [isEditingAny, isStatsDirty, isAboutDirty, isPageHeadersDirty, setHasUnsavedChanges]);

  useEffect(() => {
    return () => setHasUnsavedChanges(false);
  }, [setHasUnsavedChanges]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getAllSettings();

      if (data["content.statsData"]) {
        const parsed = JSON.parse(data["content.statsData"]);
        setStatsData(parsed);
        setOriginalStatsData(parsed);
      } else {
        const defaultStats = [
          { value: "50,000+", label: "Residents Served" },
          { value: "15", label: "Puroks Covered" },
          { value: "1963", label: "Established" },
          { value: "24/7", label: "Ready to Serve" },
        ];
        setStatsData(defaultStats);
        setOriginalStatsData(defaultStats);
      }

      if (data["content.aboutSectionData"]) {
        const parsed = JSON.parse(data["content.aboutSectionData"]);
        // Ensure purpose object has structure
        if (!parsed.purpose) {
          parsed.purpose = {
            title: "Why this portal exists",
            description1: "Too often, residents find out what's needed only after lining up at the barangay hall. This portal closes that gap.",
            description2: "Information about your barangay shouldn't be hard to find.",
            features: ["Requirements published in full", "Programs announced in advance", "Officials and offices named"],
          };
        }
        setAboutSectionData(parsed);
        setOriginalAboutSectionData(JSON.parse(JSON.stringify(parsed)));
      } else {
        const defaultAbout = {
          visionMission: {
            vision: "A progressive, disaster-resilient, and united Barangay Ugong where every household enjoys safe streets, accessible health care, and transparent governance.",
            mission: "To deliver prompt and courteous frontline services, to spend funds transparently, and to bring programs closer to residents through empowered purok leaders.",
          },
          history: {
            title: "Serving the Community",
            description: "Dedicated to community welfare, safety, and resident empowerment with ongoing projects and frontline service.",
            imageUrl: "",
            timeline: [
              { year: "1963", text: "Barangay is formally established." },
              { year: "1978", text: "First permanent Barangay Hall constructed." },
              { year: "2014", text: "Health Station and VAWC desk begin round-the-clock operations." },
              { year: "2026", text: "Public services made accessible online." },
            ],
          },
          purpose: {
            title: "Why this portal exists",
            description1: "Too often, residents find out what's needed only after lining up at the barangay hall or hear about a program through word of mouth, days after it already started. This portal exists to close that gap.",
            description2: "Information about your barangay shouldn't be hard to find. That's the point of this page.",
            features: ["Requirements published in full", "Programs announced in advance", "Officials and offices named"],
          },
        };
        setAboutSectionData(defaultAbout);
        setOriginalAboutSectionData(JSON.parse(JSON.stringify(defaultAbout)));
      }

      if (data["content.pageHeadersData"]) {
        const parsed = JSON.parse(data["content.pageHeadersData"]);
        setPageHeadersData(parsed);
        setOriginalPageHeadersData(parsed);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = (
    title: string,
    message: string,
    fn: () => Promise<void> | void,
    tone: "default" | "warning" | "danger" | "primary" = "primary",
    confirmLabel: string = "Confirm"
  ) => {
    showConfirm({
      title,
      description: message,
      tone,
      confirmLabel,
      onConfirm: async () => {
        await fn();
      },
    });
  };

  const resolveImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
    return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  };

  // ── SAVE STATS ──
  const handleSaveStats = () => {
    const statsErr: Record<number, { value?: string; label?: string }> = {};
    let hasError = false;

    statsData.forEach((stat, i) => {
      const v = stat.value.trim();
      const l = stat.label.trim();
      let vMsg = "";
      let lMsg = "";

      if (!v) vMsg = "Value is required.";
      else if (v.length > LIMITS.stats.value.max) vMsg = `Max ${LIMITS.stats.value.max} chars.`;

      if (!l) lMsg = "Label is required.";
      else if (l.length < LIMITS.stats.label.min) lMsg = `Min ${LIMITS.stats.label.min} chars.`;
      else if (l.length > LIMITS.stats.label.max) lMsg = `Max ${LIMITS.stats.label.max} chars.`;

      if (vMsg || lMsg) {
        statsErr[i] = { value: vMsg, label: lMsg };
        hasError = true;
      }
    });

    if (hasError) {
      setStatsErrors(statsErr);
      showFeedback({
        variant: "error",
        title: "Validation Error",
        description: "Please check all statistics values and labels before saving.",
      });
      return;
    }

    setStatsErrors({});

    const isDirty = JSON.stringify(statsData) !== JSON.stringify(originalStatsData);
    if (!isDirty) {
      setIsEditingStats(false);
      return;
    }

    confirmAction("Save Statistics Banner?", "Save updates to public demographic stats.", async () => {
      try {
        setSaving("stats");
        await settingsApi.updateSettings({ "content.statsData": JSON.stringify(statsData) });
        setOriginalStatsData(JSON.parse(JSON.stringify(statsData)));
        setIsEditingStats(false);
        showFeedback({
          variant: "success",
          title: "Stats Saved",
          description: "Community statistics banner updated successfully.",
        });
      } catch (err) {
        showFeedback({ variant: "error", title: "Save Failed", description: "Could not save statistics." });
      } finally {
        setSaving(null);
      }
    });
  };

  // ── SAVE VISION & MISSION ──
  const handleSaveVisionMission = () => {
    const v = aboutSectionData.visionMission.vision.trim();
    const m = aboutSectionData.visionMission.mission.trim();
    const errs: { vision?: string; mission?: string } = {};

    if (!v) errs.vision = "Vision statement is required.";
    else if (v.length < LIMITS.vision.min) errs.vision = `Must be at least ${LIMITS.vision.min} characters.`;
    else if (v.length > LIMITS.vision.max) errs.vision = `Must not exceed ${LIMITS.vision.max} characters.`;

    if (!m) errs.mission = "Mission statement is required.";
    else if (m.length < LIMITS.mission.min) errs.mission = `Must be at least ${LIMITS.mission.min} characters.`;
    else if (m.length > LIMITS.mission.max) errs.mission = `Must not exceed ${LIMITS.mission.max} characters.`;

    if (errs.vision || errs.mission) {
      setVisionMissionErrors(errs);
      showFeedback({
        variant: "error",
        title: "Validation Error",
        description: "Please fix the Vision and Mission statements before saving.",
      });
      return;
    }

    setVisionMissionErrors({});

    const isDirty = JSON.stringify(aboutSectionData.visionMission) !== JSON.stringify(originalAboutSectionData?.visionMission);
    if (!isDirty) {
      setIsEditingVisionMission(false);
      return;
    }

    confirmAction("Save Vision & Mission?", "Update public vision and mission statements.", async () => {
      try {
        setSaving("visionMission");
        await settingsApi.updateSettings({ "content.aboutSectionData": JSON.stringify(aboutSectionData) });
        setOriginalAboutSectionData(JSON.parse(JSON.stringify(aboutSectionData)));
        setIsEditingVisionMission(false);
        showFeedback({
          variant: "success",
          title: "Vision & Mission Saved",
          description: "Statements updated successfully.",
        });
      } catch (err) {
        showFeedback({ variant: "error", title: "Save Failed", description: "Could not save vision & mission." });
      } finally {
        setSaving(null);
      }
    });
  };

  const handleCancelVisionMission = () => {
    setVisionMissionErrors({});
    const isDirty = JSON.stringify(aboutSectionData.visionMission) !== JSON.stringify(originalAboutSectionData?.visionMission);
    if (!isDirty) {
      setIsEditingVisionMission(false);
      return;
    }
    confirmAction(
      "Discard Changes?",
      "You have unsaved changes in Vision & Mission. Are you sure you want to discard them?",
      () => {
        setAboutSectionData((p) => ({
          ...p,
          visionMission: JSON.parse(JSON.stringify(originalAboutSectionData.visionMission)),
        }));
        setIsEditingVisionMission(false);
      },
      "warning",
      "Discard"
    );
  };

  // ── SAVE HISTORY ──
  const handleSaveHistory = () => {
    const t = aboutSectionData.history.title.trim();
    const d = aboutSectionData.history.description.trim();
    const errs: { title?: string; description?: string; timeline?: Record<number, { year?: string; text?: string }> } = {};

    if (!t) errs.title = "History title is required.";
    else if (t.length < LIMITS.history.title.min) errs.title = `Must be at least ${LIMITS.history.title.min} characters.`;
    else if (t.length > LIMITS.history.title.max) errs.title = `Must not exceed ${LIMITS.history.title.max} characters.`;

    if (!d) errs.description = "History narrative description is required.";
    else if (d.length < LIMITS.history.description.min) errs.description = `Must be at least ${LIMITS.history.description.min} characters.`;
    else if (d.length > LIMITS.history.description.max) errs.description = `Must not exceed ${LIMITS.history.description.max} characters.`;

    const timelineErr: Record<number, { year?: string; text?: string }> = {};
    let hasTimelineError = false;

    aboutSectionData.history.timeline.forEach((item, i) => {
      const yr = item.year.trim();
      const txt = item.text.trim();
      let yMsg = "";
      let tMsg = "";

      if (yr || txt) {
        if (!yr) yMsg = "Year required.";
        else if (yr.length > LIMITS.history.year.max) yMsg = `Max ${LIMITS.history.year.max} chars.`;

        if (!txt) tMsg = "Description required.";
        else if (txt.length < LIMITS.history.text.min) tMsg = `Min ${LIMITS.history.text.min} chars.`;
        else if (txt.length > LIMITS.history.text.max) tMsg = `Max ${LIMITS.history.text.max} chars.`;
      }

      if (yMsg || tMsg) {
        timelineErr[i] = { year: yMsg, text: tMsg };
        hasTimelineError = true;
      }
    });

    if (errs.title || errs.description || hasTimelineError) {
      if (hasTimelineError) errs.timeline = timelineErr;
      setHistoryErrors(errs);
      showFeedback({
        variant: "error",
        title: "Validation Error",
        description: "Please fix the history title, description, or timeline items.",
      });
      return;
    }

    setHistoryErrors({});

    const cleanedTimeline = aboutSectionData.history.timeline.filter((tl) => tl.year.trim() && tl.text.trim());
    const updatedData = {
      ...aboutSectionData,
      history: { ...aboutSectionData.history, timeline: cleanedTimeline },
    };
    setAboutSectionData(updatedData);

    const isDirty = JSON.stringify(updatedData.history) !== JSON.stringify(originalAboutSectionData?.history);
    if (!isDirty) {
      setIsEditingHistory(false);
      return;
    }

    confirmAction("Save History?", "Save changes to community background, photo, and timeline.", async () => {
      try {
        setSaving("history");
        await settingsApi.updateSettings({ "content.aboutSectionData": JSON.stringify(updatedData) });
        setOriginalAboutSectionData(JSON.parse(JSON.stringify(updatedData)));
        setIsEditingHistory(false);
        showFeedback({
          variant: "success",
          title: "History Saved",
          description: "Background story, image, and milestones updated.",
        });
      } catch (err) {
        showFeedback({ variant: "error", title: "Save Failed", description: "Could not save history." });
      } finally {
        setSaving(null);
      }
    });
  };

  const handleCancelHistory = () => {
    setHistoryErrors({});
    const isDirty = JSON.stringify(aboutSectionData.history) !== JSON.stringify(originalAboutSectionData?.history);
    if (!isDirty) {
      setIsEditingHistory(false);
      return;
    }
    confirmAction(
      "Discard Changes?",
      "You have unsaved changes in History. Are you sure you want to discard them?",
      () => {
        setAboutSectionData((p) => ({
          ...p,
          history: JSON.parse(JSON.stringify(originalAboutSectionData.history)),
        }));
        setIsEditingHistory(false);
      },
      "warning",
      "Discard"
    );
  };

  const handleHistoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      showFeedback({
        variant: "error",
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
      });
      return;
    }

    try {
      setUploadingHistoryImage(true);
      const uploadedUrl = await settingsApi.uploadImage(file);
      setAboutSectionData((prev) => ({
        ...prev,
        history: { ...prev.history, imageUrl: uploadedUrl },
      }));
      showFeedback({
        variant: "success",
        title: "Photo Uploaded",
        description: "History photo uploaded. Remember to click 'Save Changes'.",
      });
    } catch (err) {
      console.error(err);
      showFeedback({
        variant: "error",
        title: "Upload Failed",
        description: "Could not upload image. Please try again.",
      });
    } finally {
      setUploadingHistoryImage(false);
      if (historyFileInputRef.current) historyFileInputRef.current.value = "";
    }
  };

  // ── SAVE PURPOSE ──
  const handleSavePurpose = () => {
    const t = aboutSectionData.purpose.title.trim();
    const d1 = aboutSectionData.purpose.description1.trim();
    const d2 = aboutSectionData.purpose.description2.trim();
    const errs: { title?: string; description1?: string; description2?: string; features?: string } = {};

    if (!t) errs.title = "Purpose title is required.";
    else if (t.length < LIMITS.purpose.title.min) errs.title = `Must be at least ${LIMITS.purpose.title.min} characters.`;
    else if (t.length > LIMITS.purpose.title.max) errs.title = `Must not exceed ${LIMITS.purpose.title.max} characters.`;

    if (!d1) errs.description1 = "Primary description is required.";
    else if (d1.length < LIMITS.purpose.description1.min) errs.description1 = `Must be at least ${LIMITS.purpose.description1.min} characters.`;
    else if (d1.length > LIMITS.purpose.description1.max) errs.description1 = `Must not exceed ${LIMITS.purpose.description1.max} characters.`;

    if (!d2) errs.description2 = "Callout description is required.";
    else if (d2.length < LIMITS.purpose.description2.min) errs.description2 = `Must be at least ${LIMITS.purpose.description2.min} characters.`;
    else if (d2.length > LIMITS.purpose.description2.max) errs.description2 = `Must not exceed ${LIMITS.purpose.description2.max} characters.`;

    if (aboutSectionData.purpose.features.length === 0) {
      errs.features = "Please add at least one core feature badge.";
    }

    if (errs.title || errs.description1 || errs.description2 || errs.features) {
      setPurposeErrors(errs);
      showFeedback({
        variant: "error",
        title: "Validation Error",
        description: "Please fix the portal purpose fields before saving.",
      });
      return;
    }

    setPurposeErrors({});

    const isDirty = JSON.stringify(aboutSectionData.purpose) !== JSON.stringify(originalAboutSectionData?.purpose);
    if (!isDirty) {
      setIsEditingPurpose(false);
      return;
    }

    confirmAction("Save Portal Purpose?", "Save updates to 'Our Purpose' declarations and feature highlights.", async () => {
      try {
        setSaving("purpose");
        await settingsApi.updateSettings({ "content.aboutSectionData": JSON.stringify(aboutSectionData) });
        setOriginalAboutSectionData(JSON.parse(JSON.stringify(aboutSectionData)));
        setIsEditingPurpose(false);
        showFeedback({
          variant: "success",
          title: "Purpose Saved",
          description: "Portal purpose and feature badges updated.",
        });
      } catch (err) {
        showFeedback({ variant: "error", title: "Save Failed", description: "Could not save purpose section." });
      } finally {
        setSaving(null);
      }
    });
  };

  const handleCancelPurpose = () => {
    setPurposeErrors({});
    setFeatureInputError("");
    setNewFeatureText("");
    const isDirty = JSON.stringify(aboutSectionData.purpose) !== JSON.stringify(originalAboutSectionData?.purpose);
    if (!isDirty) {
      setIsEditingPurpose(false);
      return;
    }
    confirmAction(
      "Discard Changes?",
      "You have unsaved changes in Purpose. Are you sure you want to discard them?",
      () => {
        setAboutSectionData((p) => ({
          ...p,
          purpose: JSON.parse(JSON.stringify(originalAboutSectionData.purpose)),
        }));
        setIsEditingPurpose(false);
      },
      "warning",
      "Discard"
    );
  };

  const handleAddFeature = () => {
    const trimmed = newFeatureText.trim();
    if (!trimmed) {
      setFeatureInputError("Please enter badge text before adding.");
      return;
    }
    if (trimmed.length < LIMITS.purpose.feature.min) {
      setFeatureInputError(`Badge must be at least ${LIMITS.purpose.feature.min} characters.`);
      return;
    }
    if (trimmed.length > LIMITS.purpose.feature.max) {
      setFeatureInputError(`Badge must not exceed ${LIMITS.purpose.feature.max} characters.`);
      return;
    }
    if (aboutSectionData.purpose.features.some((f) => f.toLowerCase() === trimmed.toLowerCase())) {
      setFeatureInputError("This badge has already been added.");
      return;
    }
    if (aboutSectionData.purpose.features.length >= LIMITS.purpose.maxFeatures) {
      setFeatureInputError(`Maximum of ${LIMITS.purpose.maxFeatures} feature badges reached.`);
      return;
    }

    setAboutSectionData((prev) => ({
      ...prev,
      purpose: {
        ...prev.purpose,
        features: [...prev.purpose.features, trimmed],
      },
    }));
    setNewFeatureText("");
    setFeatureInputError("");
    setPurposeErrors((prev) => ({ ...prev, features: undefined }));
  };

  const handleRemoveFeature = (index: number) => {
    const remaining = aboutSectionData.purpose.features.filter((_, i) => i !== index);
    setAboutSectionData((prev) => ({
      ...prev,
      purpose: {
        ...prev.purpose,
        features: remaining,
      },
    }));
    if (remaining.length === 0) {
      setPurposeErrors((prev) => ({ ...prev, features: "At least one highlight feature badge is required." }));
    }
    if (featureInputError) setFeatureInputError("");
  };

  // ── SAVE PAGE HEADERS ──
  const handleSavePageHeaders = () => {
    const aTitle = pageHeadersData.announcements.title.trim();
    const aDesc = pageHeadersData.announcements.description.trim();
    const oTitle = pageHeadersData.officials.title.trim();
    const oDesc = pageHeadersData.officials.description.trim();

    const errs: {
      announcementsTitle?: string;
      announcementsDesc?: string;
      officialsTitle?: string;
      officialsDesc?: string;
    } = {};

    if (!aTitle) errs.announcementsTitle = "Title is required.";
    else if (aTitle.length > LIMITS.pageHeaders.title.max) errs.announcementsTitle = `Max ${LIMITS.pageHeaders.title.max} chars.`;

    if (!aDesc) errs.announcementsDesc = "Description is required.";
    else if (aDesc.length > LIMITS.pageHeaders.description.max) errs.announcementsDesc = `Max ${LIMITS.pageHeaders.description.max} chars.`;

    if (!oTitle) errs.officialsTitle = "Title is required.";
    else if (oTitle.length > LIMITS.pageHeaders.title.max) errs.officialsTitle = `Max ${LIMITS.pageHeaders.title.max} chars.`;

    if (!oDesc) errs.officialsDesc = "Description is required.";
    else if (oDesc.length > LIMITS.pageHeaders.description.max) errs.officialsDesc = `Max ${LIMITS.pageHeaders.description.max} chars.`;

    if (Object.keys(errs).length > 0) {
      setPageHeadersErrors(errs);
      showFeedback({
        variant: "error",
        title: "Validation Error",
        description: "Please check all public page header fields.",
      });
      return;
    }

    setPageHeadersErrors({});

    const isDirty = JSON.stringify(pageHeadersData) !== JSON.stringify(originalPageHeadersData);
    if (!isDirty) {
      setIsEditingPageHeaders(false);
      return;
    }

    confirmAction("Save Page Headers?", "Save updates to public page header titles and descriptions.", async () => {
      try {
        setSaving("headers");
        // Also sync with sectionHeaders so public pages like AllAnnouncementsPage and OfficialsPage immediately get the updated subtitle!
        const currentSettings = await settingsApi.getAllSettings();
        let sectionHeaders: any = {};
        if (currentSettings["content.sectionHeaders"]) {
          try {
            sectionHeaders = JSON.parse(currentSettings["content.sectionHeaders"]);
          } catch (e) {}
        }
        sectionHeaders.announcementsSubtitle = aDesc;
        sectionHeaders.officialsSubtitle = oDesc;

        await settingsApi.updateSettings({
          "content.pageHeadersData": JSON.stringify(pageHeadersData),
          "content.sectionHeaders": JSON.stringify(sectionHeaders),
        });

        setOriginalPageHeadersData(JSON.parse(JSON.stringify(pageHeadersData)));
        setIsEditingPageHeaders(false);
        showFeedback({
          variant: "success",
          title: "Headers Saved",
          description: "Page headers and subtitles have been updated across the portal.",
        });
      } catch (err) {
        showFeedback({ variant: "error", title: "Save Failed", description: "Could not save page headers." });
      } finally {
        setSaving(null);
      }
    });
  };

  const inputClass = (hasError = false) =>
    `w-full px-3 py-2 text-sm border rounded-lg outline-none bg-white text-slate-800 placeholder:text-slate-400 transition-colors ${
      hasError ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    }`;

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading About settings...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="About Barangay Management"
        description="Configure public vision, mission, history, community stats, and portal headers."
      />

      {/* ── 1. Statistics Banner ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <SectionHeader
          title="Community Statistics Banner"
          subtitle="Key numerical indicators displayed on the public portal hero & stats section."
          isEditing={isEditingStats}
          saving={saving === "stats"}
          onEdit={() => setIsEditingStats(true)}
          onCancel={() => {
            setStatsErrors({});
            const isDirty = JSON.stringify(statsData) !== JSON.stringify(originalStatsData);
            if (!isDirty) {
              setIsEditingStats(false);
              return;
            }
            confirmAction(
              "Discard Changes?",
              "You have unsaved changes in statistics. Are you sure you want to discard them?",
              () => {
                setStatsData(JSON.parse(JSON.stringify(originalStatsData)));
                setIsEditingStats(false);
              },
              "warning",
              "Discard"
            );
          }}
          onSave={handleSaveStats}
        />

        {isEditingStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {statsData.map((stat, i) => {
              const stErr = statsErrors[i];
              return (
                <div key={i} className="border border-slate-300 rounded-xl p-4 text-center bg-slate-50/70 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stat #{i + 1}</span>
                    <CharCount value={stat.value} max={LIMITS.stats.value.max} />
                  </div>
                  <input
                    type="text"
                    value={stat.value}
                    maxLength={LIMITS.stats.value.max}
                    placeholder="Value (e.g. 50,000+)"
                    onChange={(e) => {
                      const d = [...statsData];
                      d[i] = { ...d[i], value: e.target.value };
                      setStatsData(d);
                    }}
                    className={`w-full text-center text-lg font-bold text-slate-900 bg-white border rounded-lg px-2 py-1 outline-none ${
                      stErr?.value ? "border-rose-400" : "border-slate-300 focus:border-blue-500"
                    }`}
                  />
                  <FieldError error={stErr?.value} />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Label</span>
                    <CharCount value={stat.label} max={LIMITS.stats.label.max} min={LIMITS.stats.label.min} />
                  </div>
                  <input
                    type="text"
                    value={stat.label}
                    maxLength={LIMITS.stats.label.max}
                    placeholder="Label (e.g. Residents Served)"
                    onChange={(e) => {
                      const d = [...statsData];
                      d[i] = { ...d[i], label: e.target.value };
                      setStatsData(d);
                    }}
                    className={`w-full text-center text-xs font-semibold text-slate-700 bg-white border rounded-lg px-2 py-1 outline-none ${
                      stErr?.label ? "border-rose-400" : "border-slate-300 focus:border-blue-500"
                    }`}
                  />
                  <FieldError error={stErr?.label} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsData.map((stat, i) => (
              <div key={i} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 2. Vision & Mission ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <SectionHeader
          title="Vision & Mission Statements"
          subtitle="Strategic declarations guiding barangay public programs and governance."
          isEditing={isEditingVisionMission}
          saving={saving === "visionMission"}
          onEdit={() => setIsEditingVisionMission(true)}
          onCancel={handleCancelVisionMission}
          onSave={handleSaveVisionMission}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vision */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Vision Statement <span className="text-rose-500">*</span></h4>
              {isEditingVisionMission && (
                <CharCount value={aboutSectionData.visionMission.vision} max={LIMITS.vision.max} min={LIMITS.vision.min} />
              )}
            </div>
            {isEditingVisionMission ? (
              <>
                <textarea
                  rows={4}
                  maxLength={LIMITS.vision.max}
                  placeholder="Enter vision statement..."
                  className={`${inputClass(Boolean(visionMissionErrors.vision))} resize-none`}
                  value={aboutSectionData.visionMission.vision}
                  onChange={(e) =>
                    setAboutSectionData((p) => ({
                      ...p,
                      visionMission: { ...p.visionMission, vision: e.target.value },
                    }))
                  }
                />
                <FieldError error={visionMissionErrors.vision} />
              </>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {aboutSectionData.visionMission.vision || <span className="text-slate-400 italic">No vision statement set.</span>}
              </p>
            )}
          </div>

          {/* Mission */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Mission Statement <span className="text-rose-500">*</span></h4>
              {isEditingVisionMission && (
                <CharCount value={aboutSectionData.visionMission.mission} max={LIMITS.mission.max} min={LIMITS.mission.min} />
              )}
            </div>
            {isEditingVisionMission ? (
              <>
                <textarea
                  rows={4}
                  maxLength={LIMITS.mission.max}
                  placeholder="Enter mission statement..."
                  className={`${inputClass(Boolean(visionMissionErrors.mission))} resize-none`}
                  value={aboutSectionData.visionMission.mission}
                  onChange={(e) =>
                    setAboutSectionData((p) => ({
                      ...p,
                      visionMission: { ...p.visionMission, mission: e.target.value },
                    }))
                  }
                />
                <FieldError error={visionMissionErrors.mission} />
              </>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {aboutSectionData.visionMission.mission || <span className="text-slate-400 italic">No mission statement set.</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Community History & Milestones ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <SectionHeader
          title="Community History & Milestones"
          subtitle="Narrative background, historical community photo, and chronological milestones."
          isEditing={isEditingHistory}
          saving={saving === "history"}
          onEdit={() => setIsEditingHistory(true)}
          onCancel={handleCancelHistory}
          onSave={handleSaveHistory}
        />

        <div className="space-y-6">
          {/* History Image & Title/Description Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Image Preview & Upload */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Community Photo
                </label>
                {aboutSectionData.history.imageUrl && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                    Uploaded
                  </span>
                )}
              </div>

              <div className="w-full h-44 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center relative shadow-2xs">
                {aboutSectionData.history.imageUrl ? (
                  <img
                    src={resolveImageUrl(aboutSectionData.history.imageUrl)}
                    alt="Barangay History"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/Screenshot 2026-02-14 041042.png";
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                    <span className="text-xs font-medium">Default Photo in use</span>
                    <span className="text-[10px] text-slate-400">Upload a custom image to replace</span>
                  </div>
                )}
              </div>

              {isEditingHistory && (
                <div className="space-y-2 pt-1">
                  <input
                    ref={historyFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHistoryImageUpload}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingHistoryImage}
                      onClick={() => historyFileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingHistoryImage ? "Uploading..." : "Upload Photo"}
                    </button>
                    {aboutSectionData.history.imageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setAboutSectionData((prev) => ({
                            ...prev,
                            history: { ...prev.history, imageUrl: "" },
                          }))
                        }
                        className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        title="Reset to default image"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">PNG, JPG, or WEBP up to 5MB</p>
                </div>
              )}
            </div>

            {/* Title & Description Fields */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    History Title <span className="text-rose-500">*</span>
                  </label>
                  {isEditingHistory && (
                    <CharCount value={aboutSectionData.history.title} max={LIMITS.history.title.max} min={LIMITS.history.title.min} />
                  )}
                </div>
                {isEditingHistory ? (
                  <>
                    <input
                      type="text"
                      maxLength={LIMITS.history.title.max}
                      placeholder="e.g. Serving Ugong since 1963"
                      className={inputClass(Boolean(historyErrors.title))}
                      value={aboutSectionData.history.title}
                      onChange={(e) =>
                        setAboutSectionData((p) => ({
                          ...p,
                          history: { ...p.history, title: e.target.value },
                        }))
                      }
                    />
                    <FieldError error={historyErrors.title} />
                  </>
                ) : (
                  <h4 className="text-sm font-bold text-slate-900">{aboutSectionData.history.title}</h4>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    History Narrative Description <span className="text-rose-500">*</span>
                  </label>
                  {isEditingHistory && (
                    <CharCount value={aboutSectionData.history.description} max={LIMITS.history.description.max} min={LIMITS.history.description.min} />
                  )}
                </div>
                {isEditingHistory ? (
                  <>
                    <textarea
                      rows={5}
                      maxLength={LIMITS.history.description.max}
                      placeholder="Write the history and background of the barangay..."
                      className={`${inputClass(Boolean(historyErrors.description))} resize-none`}
                      value={aboutSectionData.history.description}
                      onChange={(e) =>
                        setAboutSectionData((p) => ({
                          ...p,
                          history: { ...p.history, description: e.target.value },
                        }))
                      }
                    />
                    <FieldError error={historyErrors.description} />
                  </>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{aboutSectionData.history.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Milestones */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Historical Timeline Milestones</h5>
              {isEditingHistory && (
                <span className="text-[11px] text-slate-400">Pairs of Year & milestone description</span>
              )}
            </div>

            <div className="space-y-2.5">
              {aboutSectionData.history.timeline.map((item, idx) => {
                const tlErr = historyErrors.timeline?.[idx];
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-3">
                      {isEditingHistory ? (
                        <>
                          <input
                            type="text"
                            placeholder="Year"
                            maxLength={LIMITS.history.year.max}
                            className={`w-28 px-3 py-1.5 text-xs font-bold border rounded-lg outline-none bg-white font-mono ${
                              tlErr?.year ? "border-rose-400" : "border-slate-300 focus:border-blue-500"
                            }`}
                            value={item.year}
                            onChange={(e) => {
                              const next = [...aboutSectionData.history.timeline];
                              next[idx].year = e.target.value;
                              setAboutSectionData((p) => ({
                                ...p,
                                history: { ...p.history, timeline: next },
                              }));
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Milestone description..."
                            maxLength={LIMITS.history.text.max}
                            className={`flex-1 px-3 py-1.5 text-xs border rounded-lg outline-none bg-white ${
                              tlErr?.text ? "border-rose-400" : "border-slate-300 focus:border-blue-500"
                            }`}
                            value={item.text}
                            onChange={(e) => {
                              const next = [...aboutSectionData.history.timeline];
                              next[idx].text = e.target.value;
                              setAboutSectionData((p) => ({
                                ...p,
                                history: { ...p.history, timeline: next },
                              }));
                            }}
                          />
                          <CharCount value={item.text} max={LIMITS.history.text.max} />
                          <button
                            type="button"
                            onClick={() => {
                              const next = aboutSectionData.history.timeline.filter((_, i) => i !== idx);
                              setAboutSectionData((p) => ({
                                ...p,
                                history: { ...p.history, timeline: next },
                              }));
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete milestone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-start gap-3 py-1 text-xs">
                          <span className="font-bold text-blue-600 font-mono w-16 shrink-0">{item.year}</span>
                          <span className="text-slate-600">{item.text}</span>
                        </div>
                      )}
                    </div>
                    {isEditingHistory && (tlErr?.year || tlErr?.text) && (
                      <p className="text-[11px] text-rose-500 font-medium pl-1">
                        ⚠ {tlErr?.year || tlErr?.text}
                      </p>
                    )}
                  </div>
                );
              })}

              {isEditingHistory && (
                <button
                  type="button"
                  onClick={() => {
                    const next = [...aboutSectionData.history.timeline, { year: "", text: "" }];
                    setAboutSectionData((p) => ({
                      ...p,
                      history: { ...p.history, timeline: next },
                    }));
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer pt-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Add timeline milestone
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Our Purpose (Public Portal Purpose) ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <SectionHeader
          title="Our Purpose (Portal Objectives)"
          subtitle="Declarations explaining why the portal exists and highlighting key public service commitments."
          isEditing={isEditingPurpose}
          saving={saving === "purpose"}
          onEdit={() => setIsEditingPurpose(true)}
          onCancel={handleCancelPurpose}
          onSave={handleSavePurpose}
        />

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Purpose Section Title <span className="text-rose-500">*</span>
              </label>
              {isEditingPurpose && (
                <CharCount value={aboutSectionData.purpose.title} max={LIMITS.purpose.title.max} min={LIMITS.purpose.title.min} />
              )}
            </div>
            {isEditingPurpose ? (
              <>
                <input
                  type="text"
                  maxLength={LIMITS.purpose.title.max}
                  placeholder="e.g. Why this portal exists"
                  className={inputClass(Boolean(purposeErrors.title))}
                  value={aboutSectionData.purpose.title}
                  onChange={(e) =>
                    setAboutSectionData((p) => ({
                      ...p,
                      purpose: { ...p.purpose, title: e.target.value },
                    }))
                  }
                />
                <FieldError error={purposeErrors.title} />
              </>
            ) : (
              <h4 className="text-sm font-bold text-slate-900">{aboutSectionData.purpose.title}</h4>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Primary Statement (Description 1) <span className="text-rose-500">*</span>
                </label>
                {isEditingPurpose && (
                  <CharCount value={aboutSectionData.purpose.description1} max={LIMITS.purpose.description1.max} min={LIMITS.purpose.description1.min} />
                )}
              </div>
              {isEditingPurpose ? (
                <>
                  <textarea
                    rows={4}
                    maxLength={LIMITS.purpose.description1.max}
                    placeholder="Enter main purpose narrative..."
                    className={`${inputClass(Boolean(purposeErrors.description1))} resize-none`}
                    value={aboutSectionData.purpose.description1}
                    onChange={(e) =>
                      setAboutSectionData((p) => ({
                        ...p,
                        purpose: { ...p.purpose, description1: e.target.value },
                      }))
                    }
                  />
                  <FieldError error={purposeErrors.description1} />
                </>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{aboutSectionData.purpose.description1}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Callout Statement (Description 2) <span className="text-rose-500">*</span>
                </label>
                {isEditingPurpose && (
                  <CharCount value={aboutSectionData.purpose.description2} max={LIMITS.purpose.description2.max} min={LIMITS.purpose.description2.min} />
                )}
              </div>
              {isEditingPurpose ? (
                <>
                  <textarea
                    rows={4}
                    maxLength={LIMITS.purpose.description2.max}
                    placeholder="Enter highlighted callout statement..."
                    className={`${inputClass(Boolean(purposeErrors.description2))} resize-none`}
                    value={aboutSectionData.purpose.description2}
                    onChange={(e) =>
                      setAboutSectionData((p) => ({
                        ...p,
                        purpose: { ...p.purpose, description2: e.target.value },
                      }))
                    }
                  />
                  <FieldError error={purposeErrors.description2} />
                </>
              ) : (
                <p className="text-xs text-blue-700 font-medium leading-relaxed whitespace-pre-wrap">{aboutSectionData.purpose.description2}</p>
              )}
            </div>
          </div>

          {/* Core Feature Badges */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Highlight Feature Badges <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {aboutSectionData.purpose.features.length}/{LIMITS.purpose.maxFeatures}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Cards shown at the bottom of the Purpose tab</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 min-h-[34px]">
              {aboutSectionData.purpose.features.map((feature, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 shadow-2xs"
                >
                  {feature}
                  {isEditingPurpose && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-blue-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove badge"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              ))}
              {aboutSectionData.purpose.features.length === 0 && (
                <span className="text-xs text-slate-400 italic py-1">No feature badges added yet.</span>
              )}
            </div>

            {isEditingPurpose && (
              <div className="pt-2 max-w-lg space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="New feature badge (e.g. Transparent Budget Logs)..."
                      maxLength={LIMITS.purpose.feature.max}
                      value={newFeatureText}
                      disabled={aboutSectionData.purpose.features.length >= LIMITS.purpose.maxFeatures}
                      onChange={(e) => {
                        setNewFeatureText(e.target.value);
                        if (featureInputError) setFeatureInputError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className={`w-full px-3 py-1.5 text-xs border rounded-lg outline-none pr-16 ${
                        featureInputError
                          ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                          : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      } disabled:bg-slate-100 disabled:cursor-not-allowed`}
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <CharCount value={newFeatureText} max={LIMITS.purpose.feature.max} min={LIMITS.purpose.feature.min} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    disabled={aboutSectionData.purpose.features.length >= LIMITS.purpose.maxFeatures}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                  >
                    + Add Badge
                  </button>
                </div>

                {featureInputError && (
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                    <span>⚠</span> {featureInputError}
                  </p>
                )}

                {aboutSectionData.purpose.features.length >= LIMITS.purpose.maxFeatures && (
                  <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <span>ℹ</span> Maximum limit of {LIMITS.purpose.maxFeatures} feature badges reached.
                  </p>
                )}
              </div>
            )}
            <FieldError error={purposeErrors.features} />
          </div>
        </div>
      </div>

      {/* ── 5. Public Page Headers ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <SectionHeader
          title="Public Page Headers & Subtitles"
          subtitle="Top banners and descriptions shown on the Announcements and Barangay Officials roster pages."
          isEditing={isEditingPageHeaders}
          saving={saving === "headers"}
          onEdit={() => setIsEditingPageHeaders(true)}
          onCancel={() => {
            setPageHeadersErrors({});
            setPageHeadersData(JSON.parse(JSON.stringify(originalPageHeadersData)));
            setIsEditingPageHeaders(false);
          }}
          onSave={handleSavePageHeaders}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Announcements Header */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Announcements Page</h4>
            {isEditingPageHeaders ? (
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Page Title</span>
                    <CharCount value={pageHeadersData.announcements.title} max={LIMITS.pageHeaders.title.max} />
                  </div>
                  <input
                    type="text"
                    maxLength={LIMITS.pageHeaders.title.max}
                    className={inputClass(Boolean(pageHeadersErrors.announcementsTitle))}
                    value={pageHeadersData.announcements.title}
                    onChange={(e) =>
                      setPageHeadersData((p) => ({
                        ...p,
                        announcements: { ...p.announcements, title: e.target.value },
                      }))
                    }
                  />
                  <FieldError error={pageHeadersErrors.announcementsTitle} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Page Subtitle / Description</span>
                    <CharCount value={pageHeadersData.announcements.description} max={LIMITS.pageHeaders.description.max} />
                  </div>
                  <textarea
                    rows={3}
                    maxLength={LIMITS.pageHeaders.description.max}
                    className={`${inputClass(Boolean(pageHeadersErrors.announcementsDesc))} resize-none`}
                    value={pageHeadersData.announcements.description}
                    onChange={(e) =>
                      setPageHeadersData((p) => ({
                        ...p,
                        announcements: { ...p.announcements, description: e.target.value },
                      }))
                    }
                  />
                  <FieldError error={pageHeadersErrors.announcementsDesc} />
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-bold text-slate-900">{pageHeadersData.announcements.title}</div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">{pageHeadersData.announcements.description}</div>
              </div>
            )}
          </div>

          {/* Officials Header */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Officials Page</h4>
            {isEditingPageHeaders ? (
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Page Title</span>
                    <CharCount value={pageHeadersData.officials.title} max={LIMITS.pageHeaders.title.max} />
                  </div>
                  <input
                    type="text"
                    maxLength={LIMITS.pageHeaders.title.max}
                    className={inputClass(Boolean(pageHeadersErrors.officialsTitle))}
                    value={pageHeadersData.officials.title}
                    onChange={(e) =>
                      setPageHeadersData((p) => ({
                        ...p,
                        officials: { ...p.officials, title: e.target.value },
                      }))
                    }
                  />
                  <FieldError error={pageHeadersErrors.officialsTitle} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Page Subtitle / Description</span>
                    <CharCount value={pageHeadersData.officials.description} max={LIMITS.pageHeaders.description.max} />
                  </div>
                  <textarea
                    rows={3}
                    maxLength={LIMITS.pageHeaders.description.max}
                    className={`${inputClass(Boolean(pageHeadersErrors.officialsDesc))} resize-none`}
                    value={pageHeadersData.officials.description}
                    onChange={(e) =>
                      setPageHeadersData((p) => ({
                        ...p,
                        officials: { ...p.officials, description: e.target.value },
                      }))
                    }
                  />
                  <FieldError error={pageHeadersErrors.officialsDesc} />
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-bold text-slate-900">{pageHeadersData.officials.title}</div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">{pageHeadersData.officials.description}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Confirmation & Feedback Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  );
};

export default AboutManagement;
