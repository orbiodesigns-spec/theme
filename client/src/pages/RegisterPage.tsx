import React, { useState, useMemo } from 'react';
import { User } from '../lib/types';
import { api } from '../lib/api';
import { Layout, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
    onRegisterSuccess: (user: User) => void;
    onLoginClick: () => void;
}

const RegisterPage: React.FC<Props> = ({ onRegisterSuccess, onLoginClick }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [age, setAge] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Calculate password strength (0-5)
    const passwordStrength = useMemo(() => {
        if (!password) return 0;
        let strength = 0;

        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;

        // Character variety checks
        if (/[a-z]/.test(password)) strength++; // lowercase
        if (/[A-Z]/.test(password)) strength++; // uppercase
        if (/[0-9]/.test(password)) strength++; // numbers
        if (/[^a-zA-Z0-9]/.test(password)) strength++; // special chars

        return Math.min(strength, 5);
    }, [password]);

    const getStrengthLabel = () => {
        if (passwordStrength === 0) return { text: '', color: '' };
        if (passwordStrength <= 2) return { text: 'Weak', color: 'text-red-400' };
        if (passwordStrength <= 3) return { text: 'Medium', color: 'text-yellow-400' };
        return { text: 'Strong', color: 'text-green-400' };
    };

    const getStrengthBarColor = () => {
        if (passwordStrength <= 2) return 'bg-red-500';
        if (passwordStrength <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const strengthLabel = getStrengthLabel();
    const isGmailValid = email.endsWith('@gmail.com') || email === '';
    const isPasswordLengthValid = password.length >= 8 || password === '';
    const doPasswordsMatch = password === confirmPassword || confirmPassword === '';

    const [registrationEnabled, setRegistrationEnabled] = useState(true);

    React.useEffect(() => {
        api.admin.getRegistrationSettings().then(res => {
            setRegistrationEnabled(res.enabled);
        }).catch(console.error);
    }, []);

    if (!registrationEnabled) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
                <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl z-10 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-xl mb-4 text-red-400">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Registration Closed</h1>
                    <p className="text-gray-400 mb-6">New user registration is currently disabled by the administrator. Please check back later.</p>
                    <button onClick={onLoginClick} className="text-blue-400 hover:text-blue-300 font-medium">
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Frontend validations
        if (!email.endsWith('@gmail.com')) {
            setError('Only Gmail accounts (@gmail.com) are allowed');
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const user = await api.register(name, email, password, phone, parseInt(age));
            onRegisterSuccess(user);
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl z-10 animate-in fade-in zoom-in duration-300">

                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-4 shadow-lg shadow-blue-500/20">
                        <Layout className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Create Account</h1>
                    <p className="text-gray-500 text-sm mt-2">Join to explore premium layouts</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 focus:border-blue-500 rounded-lg px-4 py-3 outline-none transition-colors text-white placeholder-gray-600"
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address (Gmail only)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full bg-black/50 border ${!isGmailValid ? 'border-red-500' : 'border-white/10'} focus:border-blue-500 rounded-lg px-4 py-3 outline-none transition-colors text-white placeholder-gray-600`}
                            placeholder="yourname@gmail.com"
                            required
                        />
                        {!isGmailValid && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Only Gmail accounts are allowed
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 focus:border-blue-500 rounded-lg px-4 py-3 outline-none transition-colors text-white placeholder-gray-600"
                            placeholder="Enter your phone number"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Age</label>
                        <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 focus:border-blue-500 rounded-lg px-4 py-3 outline-none transition-colors text-white placeholder-gray-600"
                            placeholder="Enter your age"
                            min="13"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Password (min 8 characters)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full bg-black/50 border ${!isPasswordLengthValid ? 'border-red-500' : 'border-white/10'} focus:border-blue-500 rounded-lg px-4 py-3 outline-none transition-colors text-white placeholder-gray-600`}
                            placeholder="••••••••"
                            required
                        />
                        {!isPasswordLengthValid && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Password must be at least 8 characters
                            </p>
                        )}

                        {/* Password Strength Indicator */}
                        {password && (
                            <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-400">Password Strength</span>
                                    <span className={`text-xs font-semibold ${strengthLabel.color}`}>{strengthLabel.text}</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full ${getStrengthBarColor()} transition-all duration-300`}
                                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full bg-black/50 border ${!doPasswordsMatch ? 'border-red-500' : 'border-white/10'} focus:border-blue-500 rounded-lg px-4 py-3 outline-none transition-colors text-white placeholder-gray-600`}
                            placeholder="••••••••"
                            required
                        />
                        {!doPasswordsMatch && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Passwords do not match
                            </p>
                        )}
                        {doPasswordsMatch && confirmPassword && (
                            <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Passwords match
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Sign Up <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <p className="text-gray-400 text-sm">
                        Already have an account? {' '}
                        <button onClick={onLoginClick} className="text-blue-400 hover:text-blue-300 font-medium">
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
