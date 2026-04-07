import React from 'react';
import { supabase } from '../supabaseClient';

const Header = ({ userProfile }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login'; 
  };

  return (
    <div className="flex justify-between items-center p-6 bg-white border-b sticky top-0 z-40">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logged in as</p>
        <h2 className="font-bold text-[#003366]">{userProfile?.full_name || "User"}</h2>
      </div>
      <button 
        onClick={handleLogout}
        className="text-xs font-bold text-red-500 hover:underline px-3 py-1 rounded-lg hover:bg-red-50 transition-all"
      >
        Sign Out
      </button>
    </div>
  );
};

export default Header;