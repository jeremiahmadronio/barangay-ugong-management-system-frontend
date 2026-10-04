import React, { useState } from 'react';
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";
import { Save, X, Edit3, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EditModeToolbar: React.FC = () => {
  const { settings, updateSettingLocal, editMode, setEditMode, hasUnsavedChanges, saveAllSettings, loading } = useWebsiteSettings();
  const navigate = useNavigate();
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  if (!editMode) return null;

  const handleExit = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to exit without saving?")) {
        return;
      }
    }
    setEditMode(false);
    sessionStorage.removeItem('is_live_editing');
    
    // Remove editMode & liveEditor from URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete('editMode');
    url.searchParams.delete('liveEditor');
    window.history.replaceState({}, '', url.toString());
    
    // Try to close the tab since it was opened in a new tab
    window.close();
    
    // Fallback if window.close() is blocked
    setTimeout(() => {
      navigate('/admin/website-settings');
    }, 100);
  };

  const handleSaveClick = () => {
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setShowConfirm(false);
    try {
      await saveAllSettings();
      setShowSuccess(true);
    } catch (err) {
      setShowError(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700">
      <div className="flex items-center gap-3 pr-4 border-r border-slate-700">
        <div className="bg-blue-500 p-2 rounded-full animate-pulse">
          <Edit3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Live Edit Mode</h3>
          <p className="text-xs text-slate-400">
            {hasUnsavedChanges ? "You have unsaved changes." : "Click on any text to edit."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveClick}
          disabled={!hasUnsavedChanges || loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            hasUnsavedChanges
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>

        <button
          onClick={handleExit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors text-slate-300"
        >
          <X className="w-4 h-4" />
          Exit
        </button>
      </div>
    </div>

    {/* Confirmation Modal */}
    {showConfirm && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl mx-4 animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Save Changes?</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Are you sure you want to apply these changes to the live website?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                Yes, Save
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Success Modal */}
    {showSuccess && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl mx-4 animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Success!</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Your changes have been saved and are now live on the website.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Error Modal */}
    {showError && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl mx-4 animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <X className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Error</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Failed to save changes. Please try again.
            </p>
            <button
              onClick={() => setShowError(false)}
              className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
