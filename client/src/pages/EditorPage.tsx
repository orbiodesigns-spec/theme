
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Check, Loader2 } from 'lucide-react';
import ThemePreview from '../components/ThemePreview';
import ThemeEditorPanel from '../components/ThemeEditorPanel';
import { themes } from '../themes/registry';
import { ThemeConfig, DEFAULT_THEME, User } from '../lib/types';
import { api } from '../lib/api';

interface Props {
    user: User | null;
    onUserUpdate?: (user: User) => void;
}

const EditorPage: React.FC<Props> = (props) => {
    const { user } = props;
    const { layoutId } = useParams<{ layoutId: string }>();
    const navigate = useNavigate();
    const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    // Load saved config
    useEffect(() => {
        // Refresh user data functionality could be implemented here if we had a reloadUser function
        // For now, we rely on the passed 'user' prop being up to date.
        // However, to fix "Link not working", we must verify the token exists.
    }, []);

    useEffect(() => {
        if (user && layoutId) {
            const purchase = user.purchases.find(p => p.layoutId === layoutId);
            if (purchase) {
                if (purchase.savedThemeConfig) {
                    setTheme(purchase.savedThemeConfig);
                }
            } else {
                // Verify if we should be here
                console.warn("No purchase found for this layout");
            }
        }
    }, [user, layoutId]);

    // Auto-Save Effect (Debounced)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (user && layoutId) {
                // Ensure we only save if user owns it
                const purchase = user.purchases.find(p => p.layoutId === layoutId);
                if (purchase) {
                    setIsSaving(true);
                    await api.saveThemeConfig(layoutId, theme).then(updatedUser => {
                        if (updatedUser && props.onUserUpdate) {
                            props.onUserUpdate(updatedUser);
                        }
                    });
                    setIsSaving(false);
                }
            }
        }, 2000); // Save after 2 seconds of no changes

        return () => clearTimeout(timer);
    }, [theme, layoutId, user]);

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleCopyOBSLink = () => {
        if (!user || !layoutId) return;

        const purchase = user.purchases.find(p => p.layoutId === layoutId);

        if (!purchase) {
            alert("Error: Layout not found in your purchases. Please try refreshing the page.");
            return;
        }

        if (!purchase.publicToken) {
            alert("Error: Public Token missing. Please log out and log in again to refresh your session data.");
            return;
        }

        const url = `${window.location.origin}/view/${purchase.publicToken}`;

        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy API link: ', err);
            // Fallback for secure context issues locally (though localhost is secure)
            alert(`Link (Manual Copy): ${url}`);
        });
    };

    const handleManualSave = async () => {
        if (!user || !layoutId) return;
        const purchase = user.purchases.find(p => p.layoutId === layoutId);
        if (purchase) {
            setIsSaving(true);
            const updatedUser = await api.saveThemeConfig(layoutId, theme);
            if (updatedUser && props.onUserUpdate) {
                props.onUserUpdate(updatedUser);
            }
            setIsSaving(false);
        }
    };

    return (
        <div className="min-w-screen min-h-screen bg-neutral-900 flex items-center justify-center relative overflow-auto p-10">

            {/* Top Bar */}
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-between pointer-events-none">
                <button
                    onClick={handleBackToDashboard}
                    className="pointer-events-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors backdrop-blur-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="flex items-center gap-4">
                    {/* Legacy global saving indicator - can remove if button loader is sufficient, keeping for now or remove if redundant */}
                    {isSaving && (
                        <span className="text-white/50 text-sm flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                            <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                        </span>
                    )}
                </div>
            </div>

            {/* Background Grid Pattern */}
            <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}></div>

            {/* Fixed Canvas Container 1280x720 */}
            <div
                style={{
                    width: '1280px',
                    height: '720px',
                    flexShrink: 0 // Prevent flexbox shrinking
                }}
                className="shadow-2xl border border-white/5 bg-black relative z-10"
            >
                <ThemePreview theme={theme} layoutId={layoutId || 'master-standard'} />
            </div>

            {(() => {
                const CurrentTheme = themes[layoutId || 'master-standard'] || themes['master-standard'];
                const ControlsComponent = CurrentTheme.Controls;
                return (
                    <ThemeEditorPanel
                        onReset={() => setTheme(DEFAULT_THEME)}
                        onSave={handleManualSave}
                        isSaving={isSaving}
                    >
                        <ControlsComponent theme={theme} setTheme={setTheme} />
                    </ThemeEditorPanel>
                );
            })()}

            <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2 pointer-events-none">
                <button
                    onClick={handleCopyOBSLink}
                    className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full transition-all font-bold backdrop-blur-sm shadow-lg ${copied ? 'bg-green-500 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                    {copied ? <Check className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    {copied ? 'Link Copied!' : 'Copy OBS Public Link'}
                </button>
                <div className="text-white/30 text-xs font-mono select-none">
                    Layout: {layoutId} • Resolution: 1280x720p (Fixed)
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
