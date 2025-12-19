import React, { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, ChevronDown, ChevronUp, Send, CheckCircle, ArrowLeft, Tv } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { api } from '../lib/api';

interface Props {
    onLoginClick: () => void;
}

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-white/10 rounded-lg bg-zinc-900 overflow-hidden mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-white/5 transition-colors"
            >
                <span className="font-semibold text-lg">{question}</span>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-gray-400 leading-relaxed border-t border-white/5 mt-2">
                    {answer}
                </div>
            )}
        </div>
    );
};

const SupportPage: React.FC<Props> = ({ onLoginClick }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject) return alert("Please select a subject");

        setLoading(true);
        try {
            await api.submitSupportQuery(formData);
            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (err) {
            console.error(err);
            alert("Failed to submit query. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
            {/* Navbar */}
            <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 w-full z-50 bg-black/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <Tv className="w-6 h-6 text-blue-500" />
                        <span className="text-xl font-bold tracking-tight">StreamTheme<span className="text-blue-500">Master</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Home</button>
                        <button
                            onClick={onLoginClick}
                            className="bg-white text-black px-5 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors text-sm"
                        >
                            Client Login
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <header className="py-20 px-6 text-center max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    How can we help?
                </h1>
                <p className="text-xl text-gray-400 mb-8 mx-auto max-w-2xl">
                    Find answers to common questions or reach out to our dedicated support team.
                </p>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-16">

                {/* Contact Form Section */}
                <div>
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-xl">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <MessageCircle className="w-6 h-6 text-blue-500" /> Send us a message
                        </h2>

                        {submitted ? (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center animate-in fade-in">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-black">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                                <p className="text-gray-400 mb-6">Thank you for contacting us. We will get back to you shortly.</p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="bg-zinc-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-zinc-700"
                                >
                                    Send Another
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                                        <input
                                            required
                                            type="email"
                                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
                                    <select
                                        className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    >
                                        <option value="">Select a topic</option>
                                        <option value="technical">Technical Support</option>
                                        <option value="billing">Billing & Subscription</option>
                                        <option value="feature">Feature Request</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</label>
                                    <textarea
                                        required
                                        rows={5}
                                        className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors resize-none"
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Describe your issue..."
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" /> Send Message
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 flex flex-col items-center text-center">
                            <Mail className="w-8 h-8 text-blue-400 mb-3" />
                            <h3 className="font-bold">Email Support</h3>
                            <p className="text-sm text-gray-500 mt-1">support@orbio.in</p>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 flex flex-col items-center text-center">
                            <MapPin className="w-8 h-8 text-purple-400 mb-3" />
                            <h3 className="font-bold">HQ Location</h3>
                            <p className="text-sm text-gray-500 mt-1">Mumbai, India</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-2">
                        <FAQItem
                            question="How do I install my purchased theme?"
                            answer="After purchase, you will receive a unique link. Simply add this link as a 'Browser Source' in OBS Studio or Streamlabs. No installation required on your local machine."
                        />
                        <FAQItem
                            question="Can I customize the colors?"
                            answer="Yes! All our themes come with a powerful real-time editor where you can change team colors, names, logos, and more directly from your dashboard."
                        />
                        <FAQItem
                            question="What happens when my subscription expires?"
                            answer="When your subscription expires, the theme will stop loading in your OBS browser source. You can renew firmly from your dashboard at any time to restore access."
                        />
                        <FAQItem
                            question="Is there a free trial?"
                            answer="We don't offer free trials, but you can preview all customization options in the demo editor before making a purchase."
                        />
                        <FAQItem
                            question="Do you offer refunds?"
                            answer="Due to the digital nature of the product, we generally do not offer refunds. However, if you face technical issues that we cannot resolve, please contact support."
                        />
                    </div>
                </div>

            </main>

            <footer className="py-10 text-center text-gray-600 text-sm border-t border-white/5 bg-black mt-20">
                <div className="flex justify-center gap-6 mb-4">
                    <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Home</button>
                    <button onClick={() => navigate('/support')} className="text-blue-500 font-bold">Support</button>
                    <button onClick={onLoginClick} className="hover:text-white transition-colors">Login</button>
                </div>
                <p>&copy; 2025 StreamThemeMaster. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default SupportPage;
