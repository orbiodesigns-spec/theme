import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ThemeConfig } from '../lib/types';
import ThemePreview from '../components/ThemePreview';
import { Loader2, AlertTriangle } from 'lucide-react';

const PublicViewPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lockError, setLockError] = useState(false);
    const [data, setData] = useState<{ layoutId: string; config: ThemeConfig | null } | null>(null);

    // Generate Session ID once per load
    const [sessionId] = useState(() => Math.random().toString(36).substring(2) + Date.now().toString(36));

    useEffect(() => {
        let heartbeatInterval: any;

        const load = async () => {
            if (!token) return;

            try {
                const result = await api.getPublicLayout(token, sessionId);

                if (!result) {
                    setError('Invalid Link');
                } else if (result.isExpired) {
                    setError('Stream Offline: Subscription Expired');
                } else {
                    setData({ layoutId: result.layoutId, config: result.config });

                    // Start Heartbeat
                    heartbeatInterval = setInterval(async () => {
                        try {
                            await api.sendHeartbeat(token, sessionId);
                        } catch (err: any) {
                            if (err.message === 'LOCK_LOST') {
                                setLockError(true);
                                clearInterval(heartbeatInterval);
                            }
                        }
                    }, 10000); // 10 seconds
                }
            } catch (err: any) {
                if (err.message === 'SESSION_LOCKED') {
                    setLockError(true);
                } else {
                    setError(err.message || 'Failed to load');
                }
            } finally {
                setLoading(false);
            }
        };

        load();

        return () => {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
        };
    }, [token, sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (lockError) {
        return (
            <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center text-white p-10 text-center">
                <div className="bg-red-500/10 p-6 rounded-full mb-6 ring-1 ring-red-500/50">
                    <AlertTriangle className="w-16 h-16 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold mb-4">Session Active on Another Device</h1>
                <p className="text-gray-400 max-w-md mx-auto mb-8">
                    This overlay is currently open in another browser or OBS source.
                    <br /><br />
                    Please close the other instance to view it here. The lock will automatically release in 30 seconds after the other session is closed.
                </p>
                <button onClick={() => window.location.reload()} className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors border border-neutral-700">
                    Try Again
                </button>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-10 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
                <h1 className="text-4xl font-bold mb-4">{error || 'Layout Not Found'}</h1>
                <p className="text-gray-500">Please contact the broadcaster or renew the subscription.</p>
            </div>
        );
    }

    // Render Clean Layout
    // We force 1920x1080 scale to fit window
    return (
        <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
            <div style={{ width: '1920px', height: '1080px', transform: 'scale(1)', transformOrigin: 'center' }}>
                <ThemePreview
                    theme={data.config || undefined} // Fallback to default if no config saved
                    layoutId={data.layoutId}
                />
            </div>
        </div>
    );
};

export default PublicViewPage;
