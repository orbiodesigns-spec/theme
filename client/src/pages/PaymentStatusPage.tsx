import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

import { User } from '../lib/types';

interface Props {
    onUserUpdate: (user: User) => void;
}

const PaymentStatusPage: React.FC<Props> = ({ onUserUpdate }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('order_id');
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        if (!orderId) {
            setStatus('failed');
            setMessage("Invalid Order ID");
            return;
        }

        const verify = async () => {
            try {
                const res = await api.verifyPayment(orderId);
                if (res.status === 'SUCCESS') {
                    if (res.user) {
                        onUserUpdate(res.user);
                    }
                    setStatus('success');
                    // Auto Redirect
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 2000);
                } else {
                    setStatus('failed');
                    setMessage(res.message || "Payment Verification Failed");
                }
            } catch (err: any) {
                setStatus('failed');
                setMessage(err.message || "Something went wrong");
            }
        };

        verify();
    }, [orderId]);

    return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">

                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                        <h2 className="text-xl font-bold">Verifying Payment</h2>
                        <p className="text-gray-400">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-green-400">Payment Successful!</h2>
                        <p className="text-gray-400">Your subscription has been activated.</p>
                        <p className="text-sm text-gray-500">Redirecting to Dashboard...</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mt-4 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            Go to Dashboard Now <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-red-400">Payment Failed</h2>
                        <p className="text-gray-400">{message}</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mt-4 bg-zinc-800 text-white px-6 py-3 rounded-full font-bold hover:bg-zinc-700 transition-colors"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentStatusPage;
