import React, { useState } from 'react';
import { api } from '../lib/api';
import { User } from '../lib/types';
import { Loader2 } from 'lucide-react';

interface Props {
  onLoginSuccess: (user: User) => void;
  onBack: () => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
}

const LoginPage: React.FC<Props> = ({ onLoginSuccess, onBack, onRegisterClick, onForgotPasswordClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await api.login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-white/10 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-gray-400 mb-8">Enter your credentials to access your dashboard.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="flex justify-end mb-4">
            <button type="button" onClick={onForgotPasswordClick} className="text-sm text-blue-400 hover:text-blue-300">
              Forgot password?
            </button>
          </div>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <button onClick={onBack} className="mt-6 text-sm text-gray-500 hover:text-white w-full text-center">
          &larr; Back to Home
        </button>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account? {' '}
            <button type="button" onClick={onRegisterClick} className="text-blue-400 hover:text-blue-300 font-medium">
              Create Account
            </button>
          </p>
        </div>

        <div className="mt-4 text-center text-xs text-gray-600">
          Hint: Use demo@example.com / password
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
