import React, { useState, useRef } from 'react';
import { LayoutTemplate, ExternalLink, Palette, Image as ImageIcon, Save, UploadCloud, Trash2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWebsiteSettings } from '../../../context/WebsiteSettingsContext';
import { useUnsavedChanges } from '../../../context/UnsavedChangesContext';
import { settingsApi } from '../../../cms-api/settingsApi';
import { PageHeader, ConfirmationDialog, FeedbackDialog } from '@/components/ui';
import { useDialogs } from '@/hooks/useDialogs';

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
  const { setHasUnsavedChanges } = useUnsavedChanges();

  const [loading, setLoading] = useState(false);
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [imageErrors, setImageErrors] = useState<{ logo?: boolean; hero?: boolean; login?: boolean }>({});
  const [uploadingImage, setUploadingImage] = useState<'logo' | 'hero' | 'login' | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const loginInputRef = useRef<HTMLInputElement>(null);

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs();

  const handleOpenLiveEditor = () => {
    window.open('/?liveEditor=true', '_blank');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await settingsApi.updateSettings({
        'content.logoUrl': settings.logoUrl ?? '',
        'content.heroContent': JSON.stringify(settings.heroContent),
        'content.loginBackgroundUrl': settings.loginBackgroundUrl ?? '',
        'theme.colorTheme': JSON.stringify(settings.colorTheme)
      });
      await refreshSettings();
      setHasUnsavedChanges(false);
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

  const hasColorChanged = originalSettings ? (
    settings.colorTheme.primary !== originalSettings.colorTheme.primary ||
    settings.colorTheme.accent !== originalSettings.colorTheme.accent
  ) : false;

  const hasUnsavedChanges = hasImagesChanged || hasColorChanged;

  React.useEffect(() => {
    setHasUnsavedChanges(hasUnsavedChanges);
  }, [hasUnsavedChanges, setHasUnsavedChanges]);

  React.useEffect(() => {
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [setHasUnsavedChanges]);

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

    const fakeUrl = URL.createObjectURL(file);
    updateSettingLocal(settingKey, subKey || '', fakeUrl);

    setTimeout(() => {
      setUploadingImage(null);
    }, 1500);
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

  const handleCancelColors = () => {
    if (!hasColorChanged) return;
    confirm({
      title: "Discard Color Changes?",
      description: "Are you sure you want to discard changes to the theme colors?",
      tone: "warning",
      confirmLabel: "Discard Changes",
      onConfirm: () => {
        if (originalSettings) {
          updateSettingLocal('colorTheme', 'primary', originalSettings.colorTheme.primary);
          updateSettingLocal('colorTheme', 'accent', originalSettings.colorTheme.accent);
        }
      },
    });
  };

  const handleSaveColors = () => {
    if (!hasColorChanged) return;
    confirm({
      title: "Save Theme Colors?",
      description: "Confirm updating the color theme palette of the public website.",
      tone: "primary",
      confirmLabel: "Save Theme",
      onConfirm: async () => {
        await handleSave();
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Appearance & Settings"
        description="Manage official barangay logos, hero background images, and portal branding accents."
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
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
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
                {(settings.heroContent?.backgroundImage ?? '/3s-center-new.jpg') !== '' ? (
                  <img src={settings.heroContent?.backgroundImage ?? '/3s-center-new.jpg'} alt="Hero Background" className="w-full h-full object-cover" />
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
                  {(settings.heroContent?.backgroundImage ?? '/3s-center-new.jpg') !== '' && (
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
                {(settings.loginBackgroundUrl ?? '/3s-center-new.jpg') !== '' ? (
                  <img src={settings.loginBackgroundUrl ?? '/3s-center-new.jpg'} alt="Login Background" className="w-full h-full object-cover" />
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
                  {(settings.loginBackgroundUrl ?? '/3s-center-new.jpg') !== '' && (
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

          <hr className="border-slate-100 my-6" />

          <div>
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-3">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-0.5">Color Theme</h3>
                <p className="text-slate-500 text-xs">Choose the primary and accent theme colors for the portal.</p>
              </div>
              {hasColorChanged && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCancelColors}
                    disabled={loading}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveColors}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Theme
                  </button>
                </div>
              )}
            </div>

            {/* Accent Presets */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Accent Color Palette
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {[
                  { name: 'Original', color: '#2563eb' },
                  { name: 'Sky', color: '#0284c7' },
                  { name: 'Cyan', color: '#0891b2' },
                  { name: 'Teal', color: '#0d9488' },
                  { name: 'Green', color: '#16a34a' },
                  { name: 'Lime', color: '#4d7c0f' },
                  { name: 'Amber', color: '#d97706' },
                  { name: 'Orange', color: '#ea580c' },
                  { name: 'Red', color: '#dc2626' },
                  { name: 'Rose', color: '#e11d48' },
                  { name: 'Pink', color: '#db2777' },
                  { name: 'Violet', color: '#7c3aed' },
                  { name: 'Indigo', color: '#4f46e5' },
                  { name: 'Purple', color: '#9333ea' },
                  { name: 'Slate', color: '#475569' },
                ].map(({ name, color }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateSettingLocal('colorTheme', 'accent', color)}
                    title={name}
                    className={`w-full h-8 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer ${
                      settings.colorTheme.accent === color
                        ? 'border-slate-800 scale-110 shadow-sm ring-2 ring-blue-500/30'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Theme preview */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mt-4">
              <div className="w-6 h-6 rounded-md shadow-2xs border border-white" style={{ backgroundColor: settings.colorTheme.primary }} />
              <div className="w-6 h-6 rounded-md shadow-2xs border border-white" style={{ backgroundColor: settings.colorTheme.accent }} />
              <span className="text-xs text-slate-500 font-medium">Selected theme palette preview</span>
            </div>
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
