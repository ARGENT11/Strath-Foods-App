import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-3xl font-black text-[#003366] mb-2 text-center">Welcome Back</h2>
        <p className="text-gray-400 text-center mb-8">Login to your Strathmore account</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none" 
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none" 
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-[#E77206] text-white py-4 rounded-xl font-bold shadow-lg">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          New here? <Link to="/signup" className="text-[#003366] font-bold">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;