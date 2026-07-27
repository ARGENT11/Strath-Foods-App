import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed, Mail, Lock, User, UserCheck, Bike, Store, GraduationCap, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Toast from '../components/Toast';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('customer'); // customer, , delivery
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setToast({ type: 'error', message: 'Please complete all required fields.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });

    setLoading(false);
    if (error) {
      setToast({ type: 'error', message: error.message });
    } else {
      setToast({ 
        type: 'success', 
        message: 'Account created! Check your email for confirmation or log in.' 
      });
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  const roleOptions = [
    {
      id: 'customer',
      title: 'Student',
      desc: 'Order food on campus',
      icon: GraduationCap,
    },
    {
      id: 'restaurant',
      title: 'Canteen Staff',
      desc: 'Manage kitchen & orders',
      icon: Store,
    },
    {
      id: 'delivery',
      title: 'Delivery Rider',
      desc: 'Deliver orders across campus',
      icon: Bike,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Ambient backgrounds */}
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-[#003366]/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 -left-20 w-96 h-96 bg-[#E77206]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg z-10 my-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#003366] to-[#0A2540] text-[#E77206] shadow-xl shadow-[#003366]/40 mb-4 border border-white/10 animate-float">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Join STRATH<span className="text-[#E77206]">FOOD</span>
          </h1>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">
            Create your campus dining account
          </p>
        </div>

        {/* Signup Card */}
        <div className="glass-panel-dark rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
          <form onSubmit={handleSignup} className="space-y-5">
            
            {/* Full Name */}
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="e.g. Wanjiku Kimani" 
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-[#E77206] focus:ring-2 focus:ring-[#E77206]/20 transition-all" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                Strathmore Email
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

            {/* Role Selection Chips */}
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                Account Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {roleOptions.map((opt) => {
                  const Icon = opt.icon;
                  const selected = role === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setRole(opt.id)}
                      className={`cursor-pointer p-3.5 rounded-2xl border text-left transition-all ${
                        selected 
                          ? 'bg-gradient-to-b from-[#E77206]/20 to-amber-600/10 border-[#E77206] text-white shadow-md' 
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-5 h-5 ${selected ? 'text-[#E77206]' : 'text-slate-400'}`} />
                        {selected && <UserCheck className="w-4 h-4 text-[#E77206]" />}
                      </div>
                      <p className="font-bold text-xs text-white">{opt.title}</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Password */}
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
              className="w-full bg-gradient-to-r from-[#003366] to-slate-800 hover:from-slate-800 hover:to-[#003366] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-[#003366]/30 border border-white/10 hover:border-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 text-[#E77206]" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-[#E77206] font-bold hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;