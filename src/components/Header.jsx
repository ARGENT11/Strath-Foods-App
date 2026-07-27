import React from 'react';
import { supabase } from '../supabaseClient';
import { UtensilsCrossed, LogOut, User, Store, Bike, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ userProfile }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      // Clear local storage fallbacks
      localStorage.removeItem('strathfood_latest_order');
      localStorage.removeItem('strathfood_latest_order_id');
      
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Logout error:', error.message);
      
      // Redirect directly to /login route
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/login');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 border border-purple-500/20">
            <ShieldCheck className="w-3 h-3" /> Manager
          </span>
        );
      case 'restaurant':
      case 'kitchen':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <Store className="w-3 h-3" /> Kitchen Staff
          </span>
        );
      case 'delivery':
      case 'rider':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
            <Bike className="w-3 h-3" /> Rider
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20">
            <User className="w-3 h-3" /> Student
          </span>
        );
    }
  };

  const isCustomer = userProfile?.role === 'customer' || !userProfile?.role;
  const isManager = userProfile?.role === 'manager';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#003366] to-[#0A2540] flex items-center justify-center text-white shadow-md shadow-[#003366]/20 group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5 text-[#E77206]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-[#003366] tracking-tight group-hover:text-[#E77206] transition-colors">
                STRATH<span className="text-[#E77206]">FOOD</span>
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1">
              Campus Dining
            </p>
          </div>
        </div>

        {/* Quick Nav & User Status */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Student: My Orders Button */}
          {isCustomer && location.pathname !== '/tracking' && (
            <button 
              type="button"
              onClick={() => navigate('/tracking')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#003366] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-[#E77206]" />
              <span className="hidden sm:inline">My Orders</span>
            </button>
          )}

          {/* Manager: Dashboard Quick Link */}
          {isManager && location.pathname !== '/manager/dashboard' && (
            <button 
              type="button"
              onClick={() => navigate('/manager/dashboard')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#003366] px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-all active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline">Manager Portal</span>
            </button>
          )}

          {/* User Profile Card */}
          <div className="flex items-center gap-2.5 bg-slate-50/80 border border-slate-200/60 p-1.5 pl-3 rounded-2xl">
            <div className="text-right hidden sm:block">
              <h2 className="font-bold text-[#003366] text-xs leading-snug">
                {userProfile?.full_name || "Strathmore User"}
              </h2>
              <div className="mt-0.5">
                {getRoleBadge(userProfile?.role)}
              </div>
            </div>

            <div className="relative cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#003366] to-slate-800 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-white font-bold text-xs">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || 'User')}&background=003366&color=fff&bold=true`} 
                  alt="User avatar"
                  className="w-full h-full object-cover" 
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>

            {/* Logout Button */}
            <button 
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95 ml-0.5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;