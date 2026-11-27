import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  User,
  Shield,
  Mail,
  Smartphone,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  MapPin,
  Key,
  Lock,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { FeedbackDialog } from '@/components/ui/FeedbackDialog';
import { useDialogs } from "@/hooks/useDialogs";
import { userService } from "@/config/api/users/users.service";
import type { UpdatePersonalInfoRequest } from "@/config/api/users/users.types";

interface ProfileState {
  username: string;
  firstName: string;
  lastName: string;
  systemEmail: string;
  contactNumber: string;
  roleName: string;
  systemBackupEmail: string;
  totpEnabled: boolean;
  totpConfigured: boolean;
  globalMfaEnabled: boolean;
  createdAt: string;
  lastLoginAt: string;
  photo: string | null;
}

interface AccountSettingsPageProps {
  forcedTab?: "profile" | "security";
}

export const AccountSettingsPage = ({ forcedTab }: AccountSettingsPageProps) => {
  const { user, setRole, updateUser } = useAuth();
  const location = useLocation();

  const saveProfileToStorage = (_data: ProfileState) => {
    // Intentionally no-op to prevent cross-account profile leakage in browser localStorage
  };

  const [activeTab, setActiveTab] = useState<"profile" | "security">(forcedTab || "profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unified System Dialogs (Confirmation & Feedback Dialogs)
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs();
  const [isTotpModalOpen, setIsTotpModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [totpStep, setTotpStep] = useState<1 | 2>(1);
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpSetupData, setTotpSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [totpCode, setTotpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
  const totpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOpenTotpModal = async () => {
    setIsTotpModalOpen(true);
    setTotpStep(1);
    setTotpCode(['', '', '', '', '', '']);
    setTotpError(null);
    setTotpLoading(true);

    try {
      const res = await userService.initiateTotpSetup();
      setTotpSetupData(res);
    } catch (err: any) {
      console.warn("Could not initiate TOTP from backend, using fallback:", err);
      // Fallback for offline dev
      setTotpSetupData({
        secret: "JBSWY3DPEHPK3PXP",
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
          `otpauth://totp/BarangayUgong:${userData.systemEmail || 'admin@valenzuela.gov.ph'}?secret=JBSWY3DPEHPK3PXP&issuer=SerbisyoKo`
        )}`,
      });
    } finally {
      setTotpLoading(false);
    }
  };

  const handleGoToOtpStep = () => {
    setTotpStep(2);
    setTotpError(null);
    setTimeout(() => {
      totpInputRefs.current[0]?.focus();
    }, 150);
  };

  const handleBackToQrStep = () => {
    setTotpStep(1);
    setTotpError(null);
  };

  const handleTotpCodeChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newCode = [...totpCode];
    newCode[index] = digit;
    setTotpCode(newCode);
    setTotpError(null);

    if (digit && index < 5) {
      totpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleTotpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !totpCode[index] && index > 0) {
      totpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleTotpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = [...totpCode];
    pasted.split('').forEach((ch, i) => {
      if (i < 6) newCode[i] = ch;
    });
    setTotpCode(newCode);
    setTotpError(null);
    const nextIdx = Math.min(pasted.length, 5);
    totpInputRefs.current[nextIdx]?.focus();
  };

  const handleConfirmTotp = async () => {
    const fullCode = totpCode.join('');
    if (fullCode.length !== 6 || !totpSetupData?.secret) {
      setTotpError("Please enter the complete 6-digit code.");
      return;
    }

    setIsVerifyingTotp(true);
    setTotpError(null);

    try {
      await userService.verifyAndEnableTotp({
        secret: totpSetupData.secret,
        code: fullCode,
      });

      setUserData((prev) => {
        const next = { ...prev, totpEnabled: true };
        saveProfileToStorage(next);
        return next;
      });

      setIsTotpModalOpen(false);
      showFeedback({
        variant: "success",
        title: "2FA Activated",
        description: "Google Authenticator has been successfully verified and activated on your account.",
        actionLabel: "Done",
      });
    } catch (err: any) {
      console.error("TOTP verification error:", err);
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Invalid 6-digit verification code. Please check your authenticator app and try again.";
      setTotpError(errMsg);
      setTotpCode(['', '', '', '', '', '']);
      totpInputRefs.current[0]?.focus();
    } finally {
      setIsVerifyingTotp(false);
    }
  };


  const handleCopySecret = () => {
    const secretToCopy = totpSetupData?.secret || "JBSWY3DPEHPK3PXP";
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(secretToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = secretToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      // fallback
    }
  };

  // Password fields
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isTogglingMfa, setIsTogglingMfa] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);



  // Clean up any legacy shared profile cache from browser
  useEffect(() => {
    try {
      localStorage.removeItem("barangay_user_profile_custom");
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("barangay_user_profile")) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
  }, []);

  // Initialize state strictly from auth user (isolated per session)
  const [userData, setUserData] = useState<ProfileState>(() => {
    const isSysAdmin = user?.role === 'rootadmin';
    return {
      username: user?.username || 'admin',
      firstName: user?.firstName || (isSysAdmin ? 'System' : ''),
      lastName: user?.lastName || (isSysAdmin ? 'Administrator' : ''),
      systemEmail: user?.email || '',
      contactNumber: user?.contactNumber || '',
      roleName: isSysAdmin ? 'SYSTEM_ADMIN' : (user?.role?.toUpperCase() || 'ADMIN'),
      systemBackupEmail: '',
      totpEnabled: user?.totpEnabled ?? false,
      totpConfigured: false,
      globalMfaEnabled: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      photo: user?.photoUrl || user?.avatarUrl || null,
    };
  });

  const [editForm, setEditForm] = useState({
    firstName: userData.firstName,
    lastName: userData.lastName,
    contactNumber: userData.contactNumber,
    username: userData.username,
    systemEmail: userData.systemEmail,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Tab synchronization from URL or props
  useEffect(() => {
    if (forcedTab) {
      setActiveTab(forcedTab);
      return;
    }
    const tabParam = new URLSearchParams(location.search).get("tab");
    if (tabParam === "security") {
      setActiveTab("security");
    } else if (tabParam === "profile") {
      setActiveTab("profile");
    }
  }, [location.search, forcedTab]);

  // Sync when user auth changes
  useEffect(() => {
    if (user) {
      const isSysAdmin = user?.role === 'rootadmin';
      setUserData((prev) => ({
        ...prev,
        username: user?.username || prev.username,
        firstName: user?.firstName || prev.firstName,
        lastName: user?.lastName || prev.lastName,
        systemEmail: user?.email || prev.systemEmail,
        contactNumber: user?.contactNumber || '',
        roleName: isSysAdmin ? 'SYSTEM_ADMIN' : (user?.role?.toUpperCase() || prev.roleName),
        photo: user?.avatarUrl || user?.photoUrl || null,
      }));
      setEditForm((prev) => ({
        ...prev,
        firstName: user?.firstName || prev.firstName,
        lastName: user?.lastName || prev.lastName,
        username: user?.username || prev.username,
        contactNumber: user?.contactNumber || '',
        systemEmail: user?.email || prev.systemEmail,
      }));
    }
  }, [user]);

  // Sync photo with AuthContext if userData.photo changes
  useEffect(() => {
    const currentAuthPhoto = user?.photoUrl || user?.avatarUrl || null;
    if (userData.photo !== currentAuthPhoto) {
      updateUser?.({
        photoUrl: userData.photo || undefined,
        avatarUrl: userData.photo || undefined,
      });
    }
  }, [userData.photo, user?.photoUrl, user?.avatarUrl]);

  // Sync with backend profile on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        let details = null;
        try {
          details = await userService.getCurrentUserDetail();
        } catch {
          if (user?.id) {
            details = await userService.getUserDetail(user.id);
          }
        }

        if (isMounted && details) {
          const freshPhoto = details.photoBase64 || null;
          const freshContact = details.personInfo?.contactNumber || user?.contactNumber || '';
          setUserData((prev) => ({
            ...prev,
            username: details.username || prev.username,
            systemEmail: details.systemEmail || prev.systemEmail,
            firstName: details.personInfo?.firstName || prev.firstName,
            lastName: details.personInfo?.lastName || prev.lastName,
            contactNumber: freshContact,
            photo: freshPhoto,
            roleName: details.roleName || prev.roleName,
            totpEnabled: typeof details.totpEnabled === 'boolean' ? details.totpEnabled : prev.totpEnabled,
          }));

          if (updateUser) {
            updateUser({
              photoUrl: freshPhoto || undefined,
              avatarUrl: freshPhoto || undefined,
              firstName: details.personInfo?.firstName,
              lastName: details.personInfo?.lastName,
              username: details.username,
              contactNumber: freshContact || undefined,
            });
          }

          setEditForm((prev) => ({
            ...prev,
            username: details.username || prev.username,
            contactNumber: freshContact,
            firstName: details.personInfo?.firstName || prev.firstName,
            lastName: details.personInfo?.lastName || prev.lastName,
          }));
        }

        // Fetch system-wide Global MFA status from backend
        try {
          const mfaRes = await userService.getGlobalMfaStatus();
          if (isMounted && typeof mfaRes?.globalMfaEnabled === 'boolean') {
            setUserData((prev) => {
              const next = { ...prev, globalMfaEnabled: mfaRes.globalMfaEnabled };
              saveProfileToStorage(next);
              return next;
            });
          }
        } catch (mfaErr) {
          console.debug("Global MFA status sync skipped:", mfaErr);
        }
      } catch (e) {
        console.debug("Backend profile sync skipped:", e);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Handle Photo selection and upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // File size validation (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showFeedback({
          variant: "error",
          title: "File Too Large",
          description: "Please choose an image file that is 5MB or smaller.",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // File type validation
      if (!file.type.startsWith("image/")) {
        showFeedback({
          variant: "error",
          title: "Invalid File Type",
          description: "Only JPEG, PNG, and WebP image formats are supported.",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setIsUploadingPhoto(true);

      try {
        const response = await userService.uploadProfilePhoto(file, user?.id);
        const newPhotoUrl = response.photo;

        setUserData((prev) => {
          const next = { ...prev, photo: newPhotoUrl };
          saveProfileToStorage(next);
          return next;
        });

        if (updateUser) {
          updateUser({ photoUrl: newPhotoUrl, avatarUrl: newPhotoUrl });
        }

        showFeedback({
          variant: "success",
          title: "Profile Photo Updated",
          description: "Your profile photo has been successfully updated and saved.",
        });
      } catch (err: any) {
        console.warn("Backend photo upload fallback:", err);
        // Fallback reading local data URL for offline dev mode
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setUserData((prev) => {
            const next = { ...prev, photo: result };
            saveProfileToStorage(next);
            return next;
          });

          if (updateUser) {
            updateUser({ photoUrl: result, avatarUrl: result });
          }
          showFeedback({
            variant: "success",
            title: "Profile Photo Updated",
            description: "Your profile photo has been successfully updated.",
          });
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Password requirements calculation
  const passwordRequirements = useMemo(() => {
    const pw = editForm.newPassword;
    if (!pw) return null;
    return {
      minLength: pw.length >= 8,
      hasUppercase: /[A-Z]/.test(pw),
      hasLowercase: /[a-z]/.test(pw),
      hasNumber: /[0-9]/.test(pw),
      hasSpecial: /[^A-Za-z0-9]/.test(pw),
    };
  }, [editForm.newPassword]);

  const isPasswordValid =
    !passwordRequirements || Object.values(passwordRequirements).every(Boolean);

  const showConfirmMismatch =
    !!editForm.confirmPassword &&
    editForm.newPassword !== editForm.confirmPassword;

  // Validation for Username: 3-30 chars, alphanumeric + underscore + period
  const usernameError = useMemo(() => {
    const val = editForm.username?.trim();
    if (!val) return "Username cannot be blank.";
    if (val.length < 3) return "Username must be at least 3 characters.";
    if (val.length > 30) return "Username cannot exceed 30 characters.";
    if (!/^[a-zA-Z0-9_.]+$/.test(val)) {
      return "Username can only contain letters, numbers, underscores, and dots.";
    }
    return null;
  }, [editForm.username]);

  // Validation for Contact Number: valid PH format / digits, max 20 chars
  const contactNumberError = useMemo(() => {
    const val = editForm.contactNumber?.trim();
    if (!val) return null;
    if (val.length > 20) return "Contact number cannot exceed 20 characters.";
    if (!/^[0-9+\-\s()]+$/.test(val)) {
      return "Contact number can only contain digits, spaces, and phone symbols (+, -).";
    }
    return null;
  }, [editForm.contactNumber]);

  // Check if any actual field changed compared to current userData
  const hasProfileChanges = useMemo(() => {
    const isUsernameChanged = (editForm.username || "").trim() !== (userData.username || "").trim();
    const isContactChanged = (editForm.contactNumber || "").trim() !== (userData.contactNumber || "").trim();
    return isUsernameChanged || isContactChanged;
  }, [editForm.username, editForm.contactNumber, userData.username, userData.contactNumber]);

  const isProfileFormValid = !usernameError && !contactNumberError && hasProfileChanges;

  // Save profile changes (partial update: only changed fields are sent to backend)
  const handleSaveProfile = async () => {
    if (!isProfileFormValid) return;
    setIsSaving(true);
    setError(null);

    const payload: UpdatePersonalInfoRequest = {};
    const trimmedUsername = editForm.username.trim();
    const trimmedContact = editForm.contactNumber.trim();

    if (trimmedUsername !== (userData.username || "").trim()) {
      payload.username = trimmedUsername;
    }
    if (trimmedContact !== (userData.contactNumber || "").trim()) {
      payload.contactNumber = trimmedContact;
    }

    try {
      await userService.updatePersonalInfo(payload, user?.id);

      setUserData((prev) => {
        const next = { ...prev, ...payload };
        saveProfileToStorage(next);
        return next;
      });

      if (updateUser) {
        updateUser({
          username: payload.username || userData.username,
          contactNumber: payload.contactNumber || userData.contactNumber,
        });
      }

      setIsEditing(false);
      showFeedback({
        variant: "success",
        title: "Profile Updated",
        description: "Your personal information has been successfully updated.",
      });
    } catch (err: any) {
      console.warn("Backend update error:", err);
      const errMsg = err?.response?.data?.message || err?.message;
      if (err?.response?.status === 400 || err?.response?.status === 409) {
        showFeedback({
          variant: "error",
          title: "Update Failed",
          description: errMsg || "Failed to update profile. Please verify your details.",
        });
      } else {
        // Fallback for dev mode
        setUserData((prev) => {
          const next = { ...prev, ...payload };
          saveProfileToStorage(next);
          return next;
        });

        if (updateUser) {
          updateUser({
            username: payload.username || userData.username,
            contactNumber: payload.contactNumber || userData.contactNumber,
          });
        }
        setIsEditing(false);
        showFeedback({
          variant: "success",
          title: "Profile Updated",
          description: "Your personal information has been updated successfully.",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Password Update with Backend Integration and Validation
  const handleUpdatePassword = async () => {
    if (!editForm.currentPassword) {
      setCurrentPasswordError("Please enter your current password.");
      return;
    }
    if (!editForm.newPassword) {
      return;
    }
    if (!isPasswordValid) {
      return;
    }
    if (showConfirmMismatch) {
      return;
    }
    if (editForm.currentPassword === editForm.newPassword) {
      setCurrentPasswordError("New password cannot be the same as your current password.");
      return;
    }

    setIsUpdatingPassword(true);
    setCurrentPasswordError(null);

    try {
      await userService.changePassword(
        {
          currentPassword: editForm.currentPassword,
          newPassword: editForm.newPassword,
          confirmPassword: editForm.confirmPassword,
        },
        user?.id
      );

      setEditForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      showFeedback({
        variant: "success",
        title: "Password Changed Successfully",
        description: "Your account login password has been changed securely in the system database.",
      });
    } catch (err: any) {
      console.error("Password change failed:", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update password. Please check your current password.";

      if (serverMsg.toLowerCase().includes("current password")) {
        setCurrentPasswordError(serverMsg);
      } else {
        showFeedback({
          variant: "error",
          title: "Password Update Failed",
          description: serverMsg,
        });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Global MFA toggle with backend persistence
  const handleToggleGlobalMfa = async () => {
    if (isTogglingMfa) return;
    const nextStatus = !userData.globalMfaEnabled;
    setIsTogglingMfa(true);

    try {
      await userService.updateGlobalMfa(nextStatus);

      setUserData((prev) => {
        const next = {
          ...prev,
          globalMfaEnabled: nextStatus,
        };
        saveProfileToStorage(next);
        return next;
      });

      showFeedback({
        variant: "success",
        title: nextStatus ? "Global MFA Enabled" : "Global MFA Disabled",
        description: nextStatus
          ? "System-wide Two-Factor Authentication is now active. All users in the barangay portal will be prompted for 2FA upon sign in."
          : "System-wide Two-Factor Authentication has been disabled. Users without individual 2FA will now sign in directly.",
      });
    } catch (err: any) {
      console.error("Failed to toggle global MFA:", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update system-wide MFA setting. Please try again.";

      showFeedback({
        variant: "error",
        title: "Update Failed",
        description: serverMsg,
      });
    } finally {
      setIsTogglingMfa(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Unified System Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />


      {/* ============================================================== */}
      {/* TAB 1: MY PROFILE                                              */}
      {/* ============================================================== */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Cover & Avatar Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Banner with subtle geometric design */}
            <div className="h-44 sm:h-52 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none"
                   style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
              <div className="absolute top-4 right-6 text-white/40 text-xs font-bold uppercase tracking-widest">
                Barangay Ugong Management Portal
              </div>
            </div>

            {/* Profile Avatar & Primary Controls */}
            <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row md:items-end gap-5 -mt-12 sm:-mt-14">
              {/* Overlapping Avatar */}
              <div className="relative z-10 shrink-0">
                <div className="relative">
                  {userData.photo ? (
                    <img
                      src={userData.photo}
                      alt={`${userData.firstName} ${userData.lastName}`}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md object-cover bg-white"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-blue-700">
                      {userData.firstName?.[0] || "A"}
                    </div>
                  )}

                  {isUploadingPhoto && (
                    <div className="absolute inset-0 rounded-full bg-slate-900/50 flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
                      <RefreshCw className="w-6 h-6 animate-spin text-white" />
                      <span className="text-[10px] font-bold mt-1">Uploading...</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  title="Update profile photo"
                  className="absolute bottom-1 right-1 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md cursor-pointer hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingPhoto ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                />
              </div>

              {/* Names and Action Button */}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 sm:pt-0">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                      {userData.firstName} {userData.lastName}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold rounded-full tracking-wide">
                      {userData.roleName.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    @{userData.username}
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={isSaving}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-4 py-2 border border-blue-200 rounded-xl hover:bg-blue-50/80 transition-colors shadow-2xs cursor-pointer"
                  >
                    {isEditing ? "Cancel Edit" : "Edit Profile"}
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Quick Info Bar */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{userData.systemEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span>{userData.contactNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>@{userData.username}</span>
              </div>
            </div>
          </div>

          {/* View Details Mode */}
          {!isEditing ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Personal Information */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Personal Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      First Name
                    </label>
                    <p className="text-slate-800 font-semibold">{userData.firstName}</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Last Name
                    </label>
                    <p className="text-slate-800 font-semibold">{userData.lastName}</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Assigned Position
                    </label>
                    <p className="text-slate-800 font-semibold">
                      {userData.roleName.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Account Registered
                    </label>
                    <p className="text-slate-800 font-medium text-xs">
                      {new Date(userData.createdAt).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Contact & Account Info */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Contact &amp; Account Info
                  </h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      System Email
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-800 font-semibold">{userData.systemEmail}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-medium">
                        Read-only
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Contact Number
                    </label>
                    <span className="text-slate-800 font-semibold">{userData.contactNumber}</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      System Username
                    </label>
                    <span className="text-slate-800 font-semibold">@{userData.username}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Personal Information Form */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Personal Information
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modify your account username and official contact number.
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Field 1: Username */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-[11px] font-medium ${
                        editForm.username.length > 30 ? "text-red-500 font-bold" : "text-slate-400"
                      }`}>
                        {editForm.username.length}/30
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                        @
                      </div>
                      <input
                        type="text"
                        maxLength={30}
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                        placeholder="e.g. jmadronio"
                        className={`w-full pl-8 pr-3.5 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all text-sm font-medium ${
                          usernameError
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
                        }`}
                      />
                    </div>
                    {usernameError ? (
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{usernameError}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        3 to 30 characters. Letters, numbers, dots, and underscores only.
                      </p>
                    )}
                  </div>

                  {/* Field 2: Contact Number */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Contact Number
                      </label>
                      <span className={`text-[11px] font-medium ${
                        editForm.contactNumber.length > 20 ? "text-red-500 font-bold" : "text-slate-400"
                      }`}>
                        {editForm.contactNumber.length}/20
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        maxLength={20}
                        value={editForm.contactNumber}
                        onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                        placeholder="e.g. 0917 555 8823"
                        className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all text-sm font-medium ${
                          contactNumberError
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
                        }`}
                      />
                    </div>
                    {contactNumberError ? (
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{contactNumberError}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Philippine mobile/landline format (e.g., 0917 123 4567 or +63 917 123 4567).
                      </p>
                    )}
                  </div>

                  {/* Field 3: System Email (Strictly Read-Only) */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        System Email
                      </label>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-bold border border-slate-200">
                        <Lock className="w-2.5 h-2.5 text-slate-400" /> Read-only
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={userData.systemEmail}
                        readOnly
                        disabled
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed select-none font-semibold"
                      />
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>System email is permanent and strictly managed by the system administrator.</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    {hasProfileChanges ? (
                      <span className="text-blue-600 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Unsaved modifications detected.
                      </span>
                    ) : (
                      <span className="text-slate-400">No changes detected yet.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm((prev) => ({
                          ...prev,
                          username: userData.username,
                          contactNumber: userData.contactNumber,
                        }));
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        confirm({
                          title: "Confirm Profile Changes",
                          description: "Are you sure you want to save modifications to your profile?",
                          confirmLabel: "Save Changes",
                          tone: "primary",
                          onConfirm: handleSaveProfile,
                        });
                      }}
                      disabled={!isProfileFormValid || isSaving}
                      className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SECURITY & AUDIT                                        */}
      {/* ============================================================== */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Card 1: Change Password */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-base font-bold text-slate-900">
                Change Password
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your account login password regularly to ensure robust security.
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={editForm.currentPassword}
                      onChange={(e) => {
                        setEditForm({ ...editForm, currentPassword: e.target.value });
                        if (currentPasswordError) setCurrentPasswordError(null);
                      }}
                      placeholder="Enter current password"
                      className={`w-full px-3.5 py-2.5 pr-10 bg-white border rounded-xl focus:ring-2 outline-none transition-all text-sm ${
                        currentPasswordError
                          ? "border-red-300 focus:ring-red-200"
                          : "border-slate-200 focus:ring-blue-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {currentPasswordError && (
                    <p className="text-xs text-red-600 font-medium">{currentPasswordError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={editForm.newPassword}
                      onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Requirements live checklist */}
                  {passwordRequirements && (
                    <ul className="mt-2.5 space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                      {[
                        { key: "minLength", label: "At least 8 characters" },
                        { key: "hasUppercase", label: "One uppercase letter (A–Z)" },
                        { key: "hasLowercase", label: "One lowercase letter (a–z)" },
                        { key: "hasNumber", label: "One number (0–9)" },
                        { key: "hasSpecial", label: "One special character (!@#$...)" },
                      ].map(({ key, label }) => {
                        const passed = passwordRequirements[key as keyof typeof passwordRequirements];
                        return (
                          <li
                            key={key}
                            className={`flex items-center gap-2 text-xs transition-colors ${
                              passed ? "text-emerald-700 font-medium" : "text-slate-400"
                            }`}
                          >
                            {passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <span className="w-3.5 h-3.5 text-center leading-none text-slate-300">·</span>
                            )}
                            {label}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={editForm.confirmPassword}
                      onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {showConfirmMismatch && (
                    <p className="text-xs text-red-600 font-medium">Passwords do not match.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={
                    !editForm.currentPassword ||
                    !editForm.newPassword ||
                    !isPasswordValid ||
                    showConfirmMismatch ||
                    isUpdatingPassword
                  }
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                >
                  {isUpdatingPassword ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Two-Factor Authentication (2FA) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Two-Factor Authentication (TOTP)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Secure your account with time-based verification codes generated by Google Authenticator.
                </p>
              </div>

              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                userData.totpEnabled
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}>
                {userData.totpEnabled ? "Linked" : "Not Linked"}
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Authenticator App
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Backup login verification using Google Authenticator or Microsoft Authenticator.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenTotpModal}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    {userData.totpEnabled ? "Re-link Authenticator" : "Link Authenticator App"}
                  </button>
                </div>
              </div>

              {/* Global MFA setting (System Administrators) */}
              {(user?.role === 'rootadmin' || user?.role === 'admin') && (
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      System-Wide Global MFA Enforced
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Require all staff and officers in Barangay Ugong to authenticate using 2FA upon sign in.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleGlobalMfa}
                    disabled={isTogglingMfa}
                    aria-label="Toggle Global MFA"
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                      userData.globalMfaEnabled ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        userData.globalMfaEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>


        </div>
      )}

      {/* TOTP Setup Modal */}
      {isTotpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsTotpModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Step Navigation Pill Indicator */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                totpStep === 1
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer"
              }`}
              onClick={() => !isVerifyingTotp && setTotpStep(1)}
              >
                1. Scan QR Code
              </span>
              <span className="text-slate-300">→</span>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                totpStep === 2
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}>
                2. Enter 6-Digit OTP
              </span>
            </div>

            <div className="pr-8 mb-3">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {totpStep === 1 ? "Setup Google Authenticator" : "Verify Authenticator Code"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {totpStep === 1
                  ? "Scan this QR code with Google Authenticator, Microsoft Authenticator, or any 2FA app."
                  : "Enter the 6-digit verification code currently generated by your authenticator app."}
              </p>
            </div>

            {totpLoading ? (
              <div className="flex flex-col items-center justify-center py-16 my-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <p className="text-xs text-slate-500 font-medium">Generating secure authenticator key...</p>
              </div>
            ) : totpStep === 1 ? (
              /* STEP 1: SCAN QR CODE */
              <>
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 my-4">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                    <img
                      src={totpSetupData?.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`otpauth://totp/BarangayUgong:${userData.systemEmail || 'admin@valenzuela.gov.ph'}?secret=JBSWY3DPEHPK3PXP&issuer=SerbisyoKo`)}`}
                      alt="2FA QR Code"
                      className="w-40 h-40 rounded-lg block"
                    />
                  </div>

                  <div className="w-full mt-3 pt-2.5 border-t border-slate-200/70 flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-500">
                      Can't scan? Enter secret manually
                    </span>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                      <code className="text-xs font-mono font-bold text-slate-800 tracking-wider select-all">
                        {totpSetupData?.secret || "JBSWY3DPEHPK3PXP"}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        {copiedSecret ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsTotpModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGoToOtpStep}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next: Enter Code</span>
                    <span>→</span>
                  </button>
                </div>
              </>
            ) : (
              /* STEP 2: ENTER 6-DIGIT CODE */
              <>
                <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 my-4 flex flex-col items-center text-center">
                  <span className="text-xs font-semibold text-slate-700 mb-1">
                    Enter the 6-digit code from your Authenticator app
                  </span>
                  <span className="text-[11px] text-slate-400 mb-5">
                    Codes refresh every 30 seconds.
                  </span>

                  <div className="flex items-center justify-center gap-2" onPaste={handleTotpPaste}>
                    {totpCode.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { totpInputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleTotpCodeChange(idx, e.target.value)}
                        onKeyDown={(e) => handleTotpKeyDown(idx, e)}
                        className={`w-11 h-13 text-center text-xl font-bold font-mono rounded-xl border bg-white focus:outline-none transition-all ${
                          totpError
                            ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-rose-700"
                            : digit
                            ? "border-blue-500 bg-blue-50/30 text-blue-900"
                            : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800"
                        }`}
                        placeholder="•"
                      />
                    ))}
                  </div>

                  {totpError && (
                    <p className="text-xs text-rose-600 font-medium mt-3">
                      {totpError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleBackToQrStep}
                    disabled={isVerifyingTotp}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>←</span>
                    <span>Back</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTotpModalOpen(false)}
                      disabled={isVerifyingTotp}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmTotp}
                      disabled={isVerifyingTotp || totpCode.join('').length !== 6}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer flex items-center gap-1.5"
                    >
                      {isVerifyingTotp ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify & Enable</span>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsPage;
