import React, { useState, useRef } from 'react';
import { LayoutTemplate, ExternalLink, Image as ImageIcon, UploadCloud, Trash2, Pencil, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWebsiteSettings } from '../../../context/WebsiteSettingsContext';
import { settingsService } from '@/config/api/cms/cms.service'
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { FeedbackDialog } from '@/components/ui/FeedbackDialog';
import { useDialogs } from '@/hooks/useDialogs';
import { sharedService } from '@/config/api/shared_api/shared.service';

const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
  isEditing,
  saving,
  onEdit,
  onCancel,
  onSave
}: any) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-3 border-b border-slate-100 gap-4">
    <div>
      <div className="flex items-center gap-2 mb-1">
        {Icon && (
          <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </div>
      <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>
    </div>
    <div className="flex items-center gap-2">
      {!isEditing ? (
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
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

const LiveEditorPreview = () => {
  return (
    <div className="relative border border-slate-200 rounded-xl overflow-hidden mb-4 bg-slate-50/70 p-3 shadow-inner">
      <div className="w-full h-40 bg-white rounded-lg border border-slate-200 p-3 relative flex flex-col justify-between overflow-hidden shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="w-16 h-3 bg-slate-200 rounded"></div>
          <div className="flex gap-2">
            <div className="w-8 h-2 bg-slate-100 rounded"></div>
            <div className="w-8 h-2 bg-slate-100 rounded"></div>
          </div>
        </div>

        <div className="space-y-2 my-auto">
          <div className="relative inline-block border border-dashed border-blue-400 bg-blue-50/40 p-1.5 rounded">
            <div className="w-32 h-3.5 bg-slate-800 rounded mb-1"></div>
            <div className="w-48 h-2 bg-slate-300 rounded"></div>
            <div className="absolute -top-2.5 -right-2.5 bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
              <Pencil className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <div className="w-12 h-4 bg-blue-600 rounded"></div>
          <div className="w-12 h-4 bg-slate-100 rounded"></div>
        </div>
      </div>
      <div className="text-center mt-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Visual Interactive Editor Preview</span>
      </div>
    </div>
  );
};

export const WebsiteSettingsPage: React.FC = () => {
  const { settings, updateSettingLocal, originalSettings, refreshSettings } = useWebsiteSettings();

  const [loading, setLoading] = useState(false);
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [imageErrors, setImageErrors] = useState<{ logo?: boolean; hero?: boolean; login?: boolean }>({});
  const [uploadingImage, setUploadingImage] = useState<'logo' | 'hero' | 'login' | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const loginInputRef = useRef<HTMLInputElement>(null);

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs();

  const handleOpenLiveEditor = () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      localStorage.setItem('temp_edit_token', token);
      sessionStorage.setItem('token', token);
    }
    sessionStorage.setItem('is_live_editing', 'true');
    window.open('/?editMode=true', '_blank');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await settingsService.updateSettings({
        'brand.logo': settings.logoUrl ?? '',
        'content.logoUrl': settings.logoUrl ?? '',
        'content.hero': JSON.stringify(settings.heroContent),
        'content.heroContent': JSON.stringify(settings.heroContent),
        'brand.loginBackground': settings.loginBackgroundUrl ?? '',
        'content.loginBackgroundUrl': settings.loginBackgroundUrl ?? '',
      });
      await refreshSettings();
      showFeedback({
        variant: "success",
        title: "Settings Saved",
        description: "Website settings have been successfully updated.",
      });
    } catch (e) {
      console.error(e);
      showFeedback({
        variant: "error",
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasImagesChanged = originalSettings ? (
    settings.logoUrl !== originalSettings.logoUrl ||
    settings.heroContent?.backgroundImage !== originalSettings.heroContent?.backgroundImage ||
    settings.loginBackgroundUrl !== originalSettings.loginBackgroundUrl
  ) : false;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    settingKey: 'logoUrl' | 'heroContent' | 'loginBackgroundUrl',
    subKey?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (settingKey === 'logoUrl') setUploadingImage('logo');
    else if (settingKey === 'heroContent') setUploadingImage('hero');
    else if (settingKey === 'loginBackgroundUrl') setUploadingImage('login');

    try {
      const uploadedUrl = await settingsService.uploadImage(file);
      updateSettingLocal(settingKey, subKey || '', uploadedUrl);
    } catch (error) {
      console.error("Failed to upload website image:", error);
      showFeedback({
        variant: "error",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Could not upload the image.",
      });
    } finally {
      setUploadingImage(null);
      e.target.value = '';
    }
  };

  const removeImage = (settingKey: 'logoUrl' | 'heroContent' | 'loginBackgroundUrl', subKey?: string) => {
    updateSettingLocal(settingKey, subKey || '', '');
  };

  const handleCancelImages = () => {
    setImageErrors({});
    if (!hasImagesChanged) {
      setIsEditingImages(false);
      return;
    }
    confirm({
      title: "Discard Changes?",
      description: "You have unsaved image changes. Are you sure you want to discard them?",
      tone: "warning",
      confirmLabel: "Discard Changes",
      onConfirm: () => {
        if (originalSettings) {
          updateSettingLocal('logoUrl', '', originalSettings.logoUrl);
          updateSettingLocal('heroContent', 'backgroundImage', originalSettings.heroContent?.backgroundImage);
          updateSettingLocal('loginBackgroundUrl', '', originalSettings.loginBackgroundUrl);
        }
        setIsEditingImages(false);
      },
    });
  };

  const handleSaveImages = () => {
    const logoErr = !settings.logoUrl;
    const heroErr = !settings.heroContent?.backgroundImage;
    const loginErr = !settings.loginBackgroundUrl;

    if (logoErr || heroErr || loginErr) {
      setImageErrors({ logo: logoErr, hero: heroErr, login: loginErr });
      return;
    }
    setImageErrors({});

    if (!hasImagesChanged) {
      setIsEditingImages(false);
      return;
    }
    confirm({
      title: "Save Image Settings?",
      description: "Confirm updating portal logos and background images.",
      tone: "primary",
      confirmLabel: "Save Changes",
      onConfirm: async () => {
        await handleSave();
        setIsEditingImages(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Appearance & Settings"
        description="Manage official barangay logos and hero background images."
      />

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col"
        >
          <SectionHeader
            icon={ImageIcon}
            title="Images & Branding"
            subtitle="Manage official seal, hero banner, and login background images."
            isEditing={isEditingImages}
            saving={loading}
            onEdit={() => setIsEditingImages(true)}
            onCancel={handleCancelImages}
            onSave={handleSaveImages}
          />

          <div className="space-y-6 flex-1">
            {/* Logo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Barangay Official Logo / Seal <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                  {uploadingImage === 'logo' && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center p-2 z-10">
                      <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-500 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "90%" }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )}
                  {settings.logoUrl ? (
                    <img src={sharedService.resolveAssetUrl(settings.logoUrl)} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                {isEditingImages && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload Logo
                    </button>
                    {settings.logoUrl && (
                      <button
                        type="button"
                        onClick={() => removeImage('logoUrl')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
              {imageErrors.logo && <p className="text-xs text-rose-500 mt-1">Official logo is required.</p>}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={logoInputRef}
                onChange={(e) => handleFileUpload(e, 'logoUrl')}
              />
            </div>

            {/* Hero Background */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Portal Hero Banner Image <span className="text-rose-500">*</span>
              </label>
              <div className="w-full h-36 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center">
                {uploadingImage === 'hero' && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center p-6 z-10">
                    <div className="w-full max-w-xs bg-slate-700 h-2 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "90%" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}
                {(settings.heroContent?.backgroundImage ?? '/assets/3s-center-new.jpg') !== '' ? (
                  <img src={sharedService.resolveAssetUrl(settings.heroContent?.backgroundImage, '/assets/3s-center-new.jpg')} alt="Hero Background" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-300" />
                )}
              </div>
              {imageErrors.hero && <p className="text-xs text-rose-500 mt-1">Hero background image is required.</p>}

              {isEditingImages && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => heroInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Upload Hero Image
                  </button>
                  {(settings.heroContent?.backgroundImage ?? '/assets/3s-center-new.jpg') !== '' && (
                    <button
                      type="button"
                      onClick={() => removeImage('heroContent', 'backgroundImage')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={heroInputRef}
                onChange={(e) => handleFileUpload(e, 'heroContent', 'backgroundImage')}
              />
            </div>

            {/* Login Background */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Login Page Background <span className="text-rose-500">*</span>
              </label>
              <div className="w-full h-36 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center">
                {uploadingImage === 'login' && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center p-6 z-10">
                    <div className="w-full max-w-xs bg-slate-700 h-2 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "90%" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}
                {(settings.loginBackgroundUrl ?? '/assets/3s-center-new.jpg') !== '' ? (
                  <img src={sharedService.resolveAssetUrl(settings.loginBackgroundUrl, '/assets/3s-center-new.jpg')} alt="Login Background" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-300" />
                )}
              </div>
              {imageErrors.login && <p className="text-xs text-rose-500 mt-1">Login background image is required.</p>}

              {isEditingImages && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => loginInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Upload Login Background
                  </button>
                  {(settings.loginBackgroundUrl ?? '/assets/3s-center-new.jpg') !== '' && (
                    <button
                      type="button"
                      onClick={() => removeImage('loginBackgroundUrl')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={loginInputRef}
                onChange={(e) => handleFileUpload(e, 'loginBackgroundUrl')}
              />
            </div>
          </div>
        </motion.div>

        {/* Live Editor & Theme Colors */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col"
        >
          <div className="mb-2">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Live Text Editor</h3>
            <p className="text-slate-500 text-xs mb-4">
              Open the visual editor in a new window to click and edit portal copy in real time.
            </p>

            <LiveEditorPreview />

            <button
              type="button"
              onClick={handleOpenLiveEditor}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              Open Live Editor
            </button>
          </div>
        </motion.div>
      </div>

      {/* Global Confirmation & Feedback Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  );
};
export default WebsiteSettingsPage;
