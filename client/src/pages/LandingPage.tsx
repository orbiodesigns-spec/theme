import React, { useEffect, useState } from 'react';
import { LayoutItem } from '../lib/types';
import { api } from '../lib/api';
import { Check, Tv, Layout, Zap, Lock, Loader2, ArrowRight, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  onLoginClick: () => void;
}

const LandingPage: React.FC<Props> = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const [layouts, setLayouts] = useState<LayoutItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await api.getLayouts();
      setLayouts(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-y-auto">
      {/* Navbar */}
      <nav className="border-b border-white/10 backdrop-blur-md fixed top-0 w-full z-50 bg-black/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <Tv className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold tracking-tight">StreamTheme<span className="text-blue-500">Master</span></span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/support')} className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Support</button>
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
      <header className="pt-40 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-block mb-4 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium animate-pulse">
          New: Neon Strike Layout Available
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
          Broadcast Graphics <br /> Made Simple.
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Preview and customize professional scorecard themes directly in your browser.
          Purchase exactly what you need, when you need it.
        </p>
        <button
          onClick={onLoginClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] flex items-center gap-2 mx-auto"
        >
          Get Started Now <ArrowRight className="w-5 h-5" />
        </button>
      </header>

      {/* Features */}
      <section className="py-20 bg-white/5 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="p-8 rounded-2xl bg-black/40 border border-white/5 hover:border-blue-500/50 transition-colors group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
              <Layout className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Pixel Perfect</h3>
            <p className="text-gray-400 leading-relaxed">Built on a 1920x1080 broadcast grid. What you see is exactly what goes on air.</p>
          </div>
          <div className="p-8 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/50 transition-colors group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Live Customization</h3>
            <p className="text-gray-400 leading-relaxed">Tweak team colors, gradients, and backgrounds in real-time with instant preview.</p>
          </div>
          <div className="p-8 rounded-2xl bg-black/40 border border-white/5 hover:border-green-500/50 transition-colors group">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-500/20 transition-colors">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Delivery</h3>
            <p className="text-gray-400 leading-relaxed">Purchase a theme and start using it immediately. Flexible durations available.</p>
          </div>
        </div>
      </section>

      {/* Layout Store Preview */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Explore Our Themes</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Professional broadcast packages ready for your next stream.
            <br />Login to purchase and unlock full customization.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {layouts.map((layout) => (
              <div key={layout.id} className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden relative group hover:border-blue-500/30 transition-all hover:-translate-y-1 duration-300">

                {/* Lock Overlay on Hover/Default */}
                <div className="absolute inset-0 z-20 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                  <Lock className="w-8 h-8 text-white mb-3" />
                  <button
                    onClick={onLoginClick}
                    className="bg-white text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
                  >
                    Login to Buy
                  </button>
                </div>

                <div className="h-56 w-full relative overflow-hidden bg-zinc-800">
                  {layout.thumbnail_url ? (
                    <img src={layout.thumbnail_url} alt={layout.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full" style={{ background: layout.thumbnail || 'linear-gradient(45deg, #111, #333)' }}></div>
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors"></div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-bold border border-white/10">
                    1920 x 1080
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white">{layout.name}</h3>
                    <div className="text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded text-sm">
                      ₹{layout.price_1mo || layout.base_price}<span className="text-xs font-normal text-blue-300">/mo</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-6 h-10 line-clamp-2">{layout.description}</p>

                  <button
                    onClick={onLoginClick}
                    className="w-full bg-zinc-800 text-gray-300 border border-white/5 px-4 py-3 rounded-lg font-bold group-hover:bg-blue-600 group-hover:text-white transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" /> Purchase Theme
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Bottom */}
      <section className="py-20 bg-gradient-to-b from-transparent to-blue-900/20 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold mb-6">Ready to upgrade your stream?</h2>
          <p className="text-gray-400 mb-8">Join hundreds of broadcasters using StreamThemeMaster today.</p>
          <button
            onClick={onLoginClick}
            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
          >
            Create Free Account
          </button>
        </div>
      </section>

      <footer className="py-10 text-center text-gray-600 text-sm border-t border-white/5 bg-black">
        <div className="flex justify-center gap-6 mb-4">
          <button onClick={() => window.scrollTo(0, 0)} className="hover:text-white transition-colors">Home</button>
          <button onClick={() => navigate('/support')} className="hover:text-white transition-colors">Support</button>
          <button onClick={onLoginClick} className="hover:text-white transition-colors">Login</button>
        </div>
        <p>&copy; 2025 StreamThemeMaster. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;