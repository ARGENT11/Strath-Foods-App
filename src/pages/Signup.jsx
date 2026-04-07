import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for the confirmation link!');
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-3xl font-black text-[#003366] mb-2 text-center">Join the Canteen</h2>
        <p className="text-gray-400 text-center mb-8">Create an account to start ordering</p>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Strathmore Email</label>
            <input 
              type="email" 
              required
              className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#E77206]" 
              placeholder="student@strathmore.edu"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#E77206]" 
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-900 transition-all"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-[#E77206] font-bold">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;