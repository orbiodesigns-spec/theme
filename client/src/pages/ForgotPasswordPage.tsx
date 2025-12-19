import React, { useState } from 'react';
import { api } from '../lib/api';
import { Mail, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
    onBack: () => void;
}

const ForgotPasswordPage: React.FC<Props> = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        await api.resetPassword(email);

        setLoading(false);
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute bottom-[20%] left-[20%] w-[30%] h-[30%] bg-blue-900/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl z-10 animate-in fade-in zoom-in duration-300">

                <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>

                {!submitted ? (
                    <>
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                            <p className="text-gray-400">Enter your email and we'll send you instructions to reset your password.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 focus:border-blue-500 rounded-lg px-4 py-3 outline-none transition-colors text-white placeholder-gray-600"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3 rounded-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Send Reset Link <Mail className="w-4 h-4" /></>}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
                        <p className="text-gray-400 mb-8">If an account exists for <strong>{email}</strong>, we have sent password reset instructions.</p>

                        <button onClick={onBack} className="text-blue-400 hover:text-white font-medium">
                            Return to Login
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ForgotPasswordPage;
