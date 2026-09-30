import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  title: string;
  message: React.ReactNode | string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "reject" | "success";
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
  loading?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  reasonLabel,
  reasonPlaceholder = "Enter reason...",
  reasonRequired = false,
  loading = false,
}: ConfirmModalProps) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reasonRequired && !reason.trim()) return;
    onConfirm(reason.trim() || undefined);
    setReason("");
  };

  const handleCancel = () => {
    setReason("");
    onCancel();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCancel();
      } else if (event.key === "Enter") {
        if (document.activeElement?.tagName === "TEXTAREA") return;
        event.preventDefault();
        if (loading) return;
        if (reasonRequired && !reason.trim()) return;
        handleConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, reason, reasonRequired]);

  if (!isOpen) return null;

  const config = {
    danger: {
      iconBg: "bg-red-500",
      confirmBtn: "bg-red-600 text-white hover:bg-red-700",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
    reject: {
      iconBg: "bg-red-500",
      confirmBtn: "bg-red-600 text-white hover:bg-red-700",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      iconBg: "bg-amber-500",
      confirmBtn: "bg-amber-600 text-white hover:bg-amber-700",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      iconBg: "bg-blue-600",
      confirmBtn: "bg-blue-600 text-white hover:bg-blue-700",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    success: {
      iconBg: "bg-green-500",
      confirmBtn: "bg-green-600 text-white hover:bg-green-700",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  };

  const { iconBg, confirmBtn, icon } = config[type] || config.info;
  const isDisabled = reasonRequired && !reason.trim();

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] transition-opacity duration-200">
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm py-8 px-6 text-center transition-all duration-200">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className={`w-16 h-16 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {icon}
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
        <div className="text-slate-600 text-sm mb-5 leading-relaxed">{message}</div>

        {reasonLabel && (
          <div className="text-left mb-5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              {reasonLabel}
              {reasonRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-800"
            />
            {reasonRequired && !reason.trim() && (
              <p className="text-xs text-red-600 mt-1">This field is required.</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2.5 font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDisabled || loading}
            className={`flex-1 py-2.5 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${confirmBtn}`}
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {loading ? "Saving..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: "success" | "danger" | "info" | "warning";
  children: React.ReactNode;
}

export const ActionModal = ({
  isOpen,
  onClose,
  title,
  type = "info",
  children,
}: ActionModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const config = {
    success: {
      iconBg: "bg-emerald-500",
      buttonStyle: "bg-emerald-600 text-white hover:bg-emerald-700",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    danger: {
      iconBg: "bg-red-500",
      buttonStyle: "bg-red-600 text-white hover:bg-red-700",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    info: {
      iconBg: "bg-blue-600",
      buttonStyle: "bg-blue-600 text-white hover:bg-blue-700",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    warning: {
      iconBg: "bg-amber-500",
      buttonStyle: "bg-amber-600 text-white hover:bg-amber-700",
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  };

  const { iconBg, buttonStyle, icon } = config[type] || config.info;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] transition-opacity duration-200">
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm py-8 px-6 text-center transition-all duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className={`w-16 h-16 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {icon}
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
        <div className="text-slate-600 text-sm mb-6 leading-relaxed">{children}</div>

        <button
          onClick={onClose}
          autoFocus
          className={`w-full py-2.5 font-medium rounded-lg transition-colors cursor-pointer ${buttonStyle}`}
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );
};
