import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Pencil, Trash2, HelpCircle, Search, Sparkles } from "lucide-react";
import { settingsApi } from "../../../cms-api/settingsApi";
import {
  PageHeader,
  ConfirmationDialog,
  FeedbackDialog,
  FormModal,
  FormSection,
  LoadingState,
} from "@/components/ui";
import {
  DataTable,
  TableFilters,
  Badge,
  type Column,
  type FilterConfig,
  type FilterValues,
} from "@/components/ui/table";
import { useDialogs } from "@/hooks/useDialogs";

export type FaqItem = {
  category: string;
  question: string;
  answer: string;
};

// Character and validation limits
const LIMITS = {
  category: { min: 2, max: 40 },
  question: { min: 5, max: 150 },
  answer: { min: 10, max: 1000 },
} as const;

// Popular category quick-picks for admins
const CATEGORY_PRESETS = [
  "General",
  "Documents & Requirements",
  "Health & Sanitation",
  "Peace & Order",
  "Disaster Preparedness",
  "Community Assistance",
  "Permits & Clearances",
];

const DEFAULT_FAQS: FaqItem[] = [
  {
    category: "General",
    question: "What are the operating hours of the Barangay Hall?",
    answer:
      "The Barangay Hall is open from Monday to Friday, 8:00 AM to 5:00 PM. We are closed on weekends and regular holidays.",
  },
  {
    category: "General",
    question: "How can I contact the Barangay Hall for emergencies?",
    answer:
      "For emergencies, you can call our hotline numbers listed on the emergency page. Response teams are on standby 24/7.",
  },
  {
    category: "Documents & Requirements",
    question: "How long does it take to get a Barangay Clearance?",
    answer:
      "Barangay Clearance is typically processed on the same day within 15-30 minutes, provided all documentary requirements are submitted.",
  },
];

function CharCount({ value, max, min }: { value: string; max: number; min?: number }) {
  const len = value?.length ?? 0;
  const isNear = len >= max * 0.85;
  const isOver = len > max;
  const isUnder = min !== undefined && len > 0 && len < min;

  return (
    <span
      className={`text-[11px] tabular-nums font-medium transition-colors ${
        isOver
          ? "text-rose-500 font-bold"
          : isUnder
          ? "text-amber-500"
          : isNear
          ? "text-amber-500"
          : "text-slate-400"
      }`}
    >
      {len}/{max}
    </span>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>;
}

export const FaqManagement = () => {
  const [loading, setLoading] = useState(true);
  const [faqData, setFaqData] = useState<FaqItem[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs();

  // Form state
  const [formData, setFormData] = useState<FaqItem>({
    category: "General",
    question: "",
    answer: "",
  });
  const [initialFormData, setInitialFormData] = useState<FaqItem>({
    category: "General",
    question: "",
    answer: "",
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Filter state for DataTable
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: "",
    category: "all",
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getAllSettings();
      if (data["content.faqData"]) {
        const parsed = JSON.parse(data["content.faqData"]);
        setFaqData(Array.isArray(parsed) ? parsed : DEFAULT_FAQS);
      } else {
        setFaqData(DEFAULT_FAQS);
      }
    } catch (error) {
      console.error("Failed to load FAQs:", error);
      showFeedback({
        variant: "error",
        title: "Load Error",
        description: "Failed to load FAQ items from the server.",
      });
      setFaqData(DEFAULT_FAQS);
    } finally {
      setLoading(false);
    }
  };

  // Form validation
  const validateField = (
    field: keyof FaqItem,
    value: string,
    currentForm: FaqItem = formData
  ): string => {
    switch (field) {
      case "category": {
        const trimmed = value.trim();
        if (!trimmed) return "Category is required.";
        if (trimmed.length < LIMITS.category.min)
          return `Category must be at least ${LIMITS.category.min} characters.`;
        if (trimmed.length > LIMITS.category.max)
          return `Category cannot exceed ${LIMITS.category.max} characters.`;
        return "";
      }
      case "question": {
        const trimmed = value.trim();
        if (!trimmed) return "Question is required.";
        if (trimmed.length < LIMITS.question.min)
          return `Question must be at least ${LIMITS.question.min} characters.`;
        if (trimmed.length > LIMITS.question.max)
          return `Question cannot exceed ${LIMITS.question.max} characters.`;

        // Check for duplicates
        const lower = trimmed.toLowerCase();
        const isDuplicate = faqData.some((item, idx) => {
          if (editingIndex !== null && idx === editingIndex) return false;
          return item.question.trim().toLowerCase() === lower;
        });
        if (isDuplicate) {
          return "An identical question already exists in the FAQ directory.";
        }
        return "";
      }
      case "answer": {
        const trimmed = value.trim();
        if (!trimmed) return "Answer is required.";
        if (trimmed.length < LIMITS.answer.min)
          return `Answer must be at least ${LIMITS.answer.min} characters.`;
        if (trimmed.length > LIMITS.answer.max)
          return `Answer cannot exceed ${LIMITS.answer.max} characters.`;
        return "";
      }
      default:
        return "";
    }
  };

  const handleFieldChange = (field: keyof FaqItem, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value, updated),
    }));
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {
      category: validateField("category", formData.category, formData),
      question: validateField("question", formData.question, formData),
      answer: validateField("answer", formData.answer, formData),
    };

    setErrors(newErrors);
    setTouched({
      category: true,
      question: true,
      answer: true,
    });

    return !Object.values(newErrors).some(Boolean);
  };

  const checkHasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  };

  const handleOpenNew = () => {
    const emptyForm: FaqItem = {
      category: "General",
      question: "",
      answer: "",
    };
    setFormData(emptyForm);
    setInitialFormData(emptyForm);
    setErrors({});
    setTouched({});
    setEditingIndex(null);
    setOpenModal(true);
  };

  const handleStartEdit = (index: number) => {
    const item = faqData[index];
    if (!item) return;
    setFormData({ ...item });
    setInitialFormData({ ...item });
    setErrors({});
    setTouched({});
    setEditingIndex(index);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    if (checkHasChanges()) {
      confirm({
        title: "Discard Changes?",
        description: "You have unsaved edits in this FAQ. Are you sure you want to discard them?",
        tone: "warning",
        confirmLabel: "Discard Changes",
        onConfirm: () => setOpenModal(false),
      });
    } else {
      setOpenModal(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateAll()) {
      showFeedback({
        variant: "error",
        title: "Validation Errors",
        description: "Please correct the highlighted fields before saving.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanedItem: FaqItem = {
        category: formData.category.trim(),
        question: formData.question.trim(),
        answer: formData.answer.trim(),
      };

      const updatedList = [...faqData];
      if (editingIndex !== null) {
        updatedList[editingIndex] = cleanedItem;
      } else {
        updatedList.push(cleanedItem);
      }

      await settingsApi.updateSettings({
        "content.faqData": JSON.stringify(updatedList),
      });

      setFaqData(updatedList);
      setOpenModal(false);
      showFeedback({
        variant: "success",
        title: editingIndex !== null ? "FAQ Updated" : "FAQ Added",
        description: `"${cleanedItem.question}" has been saved and published.`,
      });
    } catch (error) {
      console.error("Save failed:", error);
      showFeedback({
        variant: "error",
        title: "Save Failed",
        description: "Failed to save FAQ item. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaq = (index: number) => {
    const target = faqData[index];
    if (!target) return;
    confirm({
      title: "Delete FAQ?",
      description: `Are you sure you want to delete "${target.question}"? This will be removed from the public portal.`,
      tone: "danger",
      confirmLabel: "Delete FAQ",
      onConfirm: async () => {
        try {
          const updated = faqData.filter((_, i) => i !== index);
          await settingsApi.updateSettings({
            "content.faqData": JSON.stringify(updated),
          });
          setFaqData(updated);
          showFeedback({
            variant: "success",
            title: "FAQ Deleted",
            description: `"${target.question}" has been removed.`,
          });
        } catch (error) {
          console.error("Delete failed:", error);
          showFeedback({
            variant: "error",
            title: "Delete Failed",
            description: "Could not remove the question. Please try again.",
          });
        }
      },
    });
  };

  // Unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    faqData.forEach((f) => {
      if (f.category?.trim()) set.add(f.category.trim());
    });
    return Array.from(set).sort();
  }, [faqData]);

  // Filtered dataset for DataTable
  const filteredFaqs = useMemo(() => {
    return faqData
      .map((item, originalIndex) => ({ ...item, originalIndex }))
      .filter((row) => {
        if (filterValues.search?.trim()) {
          const q = filterValues.search.trim().toLowerCase();
          const matchesQ = row.question.toLowerCase().includes(q);
          const matchesA = row.answer.toLowerCase().includes(q);
          const matchesC = row.category.toLowerCase().includes(q);
          if (!matchesQ && !matchesA && !matchesC) return false;
        }
        if (filterValues.category && filterValues.category !== "all") {
          if (row.category.toLowerCase() !== filterValues.category.toLowerCase()) return false;
        }
        return true;
      });
  }, [faqData, filterValues]);

  const columns: Column<FaqItem & { originalIndex: number }>[] = useMemo(
    () => [
      {
        key: "category",
        header: "CATEGORY",
        width: "140px",
        render: (row) => (
          <Badge variant="neutral" size="sm">
            {row.category || "General"}
          </Badge>
        ),
      },
      {
        key: "question",
        header: "QUESTION",
        render: (row) => (
          <div className="flex items-center gap-2 max-w-[260px] lg:max-w-xs" title={row.question}>
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-bold text-slate-900 text-sm truncate">{row.question}</span>
          </div>
        ),
      },
      {
        key: "answer",
        header: "ANSWER PREVIEW",
        render: (row) => (
          <div className="max-w-[260px] lg:max-w-md text-xs text-slate-600 truncate" title={row.answer}>
            {row.answer}
          </div>
        ),
      },
      {
        key: "actions",
        header: "ACTIONS",
        align: "center",
        width: "90px",
        render: (row) => (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStartEdit(row.originalIndex)}
              className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title="Edit Question"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteFaq(row.originalIndex)}
              className="text-rose-600 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Question"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [faqData]
  );

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        placeholder: "Search question, answer, or category...",
      },
      {
        key: "category",
        label: "Category",
        options: [
          { label: "All Categories", value: "all" },
          ...uniqueCategories.map((c) => ({ label: c, value: c })),
        ],
      },
    ],
    [uniqueCategories]
  );

  if (loading) {
    return <LoadingState message="Loading Frequently Asked Questions..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Frequently Asked Questions (FAQ)"
        description="Manage questions and answers displayed on the public barangay portal help section."
        actions={[
          {
            label: "Add FAQ",
            icon: Plus,
            onClick: handleOpenNew,
          },
        ]}
      />

      <TableFilters
        filters={filterConfigs}
        values={filterValues}
        onApply={(applied) => setFilterValues(applied)}
        onClear={() => setFilterValues({ search: "", category: "all" })}
      />

      <DataTable
        data={filteredFaqs}
        columns={columns}
        rowKey={(row) => `${row.originalIndex}-${row.question}`}
        pageSize={8}
        emptyTitle="No FAQ items found"
        emptyDescription={
          faqData.length === 0
            ? "Get started by adding questions and answers to assist residents."
            : "No questions match your current search or category filter."
        }
        emptyAction={
          faqData.length === 0 ? (
            <button
              type="button"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add First FAQ
            </button>
          ) : undefined
        }
      />

      {/* Standard FormModal */}
      <FormModal
        isOpen={openModal}
        onClose={handleCloseModal}
        title={editingIndex !== null ? "Edit FAQ Item" : "New Question & Answer"}
        subtitle="Provide a clear, resident-friendly question and comprehensive instructions."
        isSubmitting={isSubmitting}
        submitLabel={editingIndex !== null ? "Save Changes" : "Publish FAQ"}
        onSubmit={handleSubmit}
        size="lg"
      >
        <div className="space-y-6">
          <FormSection
            title="Question Classification"
            description="Categorize this question so residents can find it quickly."
          >
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Category <span className="text-rose-500">*</span>
                </label>
                <CharCount
                  value={formData.category}
                  max={LIMITS.category.max}
                  min={LIMITS.category.min}
                />
              </div>
              <input
                type="text"
                value={formData.category}
                maxLength={LIMITS.category.max}
                onChange={(e) => handleFieldChange("category", e.target.value)}
                placeholder="e.g. Documents & Requirements, General, Health"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none bg-white text-slate-800 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  touched.category && errors.category ? "border-rose-400 bg-rose-50/20" : "border-slate-300"
                }`}
              />
              <FieldError error={touched.category ? errors.category : undefined} />

              {/* Quick suggestion pills */}
              <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
                {CATEGORY_PRESETS.map((preset) => {
                  const isSelected = formData.category.trim() === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleFieldChange("category", preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Question & Explanation"
            description="State the question clearly and provide accurate, actionable steps."
          >
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Question <span className="text-rose-500">*</span>
                  </label>
                  <CharCount
                    value={formData.question}
                    max={LIMITS.question.max}
                    min={LIMITS.question.min}
                  />
                </div>
                <input
                  type="text"
                  value={formData.question}
                  maxLength={LIMITS.question.max}
                  onChange={(e) => handleFieldChange("question", e.target.value)}
                  placeholder="e.g. How can I apply for a Barangay ID or Certificate of Indigency?"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none bg-white text-slate-800 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                    touched.question && errors.question ? "border-rose-400 bg-rose-50/20" : "border-slate-300"
                  }`}
                />
                <FieldError error={touched.question ? errors.question : undefined} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Answer & Instructions <span className="text-rose-500">*</span>
                  </label>
                  <CharCount
                    value={formData.answer}
                    max={LIMITS.answer.max}
                    min={LIMITS.answer.min}
                  />
                </div>
                <textarea
                  rows={5}
                  value={formData.answer}
                  maxLength={LIMITS.answer.max}
                  onChange={(e) => handleFieldChange("answer", e.target.value)}
                  placeholder="Provide comprehensive details: prerequisites, required IDs, processing times, or office contact details..."
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none bg-white text-slate-800 placeholder:text-slate-400 transition-colors resize-y focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                    touched.answer && errors.answer ? "border-rose-400 bg-rose-50/20" : "border-slate-300"
                  }`}
                />
                <FieldError error={touched.answer ? errors.answer : undefined} />
              </div>
            </div>
          </FormSection>
        </div>
      </FormModal>

      {/* Global Confirmation & Feedback Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  );
};

export default FaqManagement;
