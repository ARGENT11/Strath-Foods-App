import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed, Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import Toast from '../components/Toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setToast({ type: 'error', message: 'Please enter both email and password.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setToast({ type: 'error', message: error.message });
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#003366]/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#E77206]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#003366] to-[#0A2540] text-[#E77206] shadow-xl shadow-[#003366]/40 mb-4 border border-white/10 animate-float">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            STRATH<span className="text-[#E77206]">FOOD</span>
          </h1>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">
            Strathmore University Dining
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel-dark rounded-3xl p-8 shadow-2xl border border-white/10 relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Welcome back</h2>
              <p className="text-slate-400 text-xs mt-0.5">Sign in to order your favorite campus meals</p>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#E77206]">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                University Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                <input 
                  type="email" 
                  placeholder="student@strathmore.edu" 
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-[#E77206] focus:ring-2 focus:ring-[#E77206]/20 transition-all" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-[#E77206] focus:ring-2 focus:ring-[#E77206]/20 transition-all" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#E77206] to-amber-600 hover:from-amber-600 hover:to-[#E77206] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-[#E77206]/25 hover:shadow-xl hover:shadow-[#E77206]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#E77206] font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;