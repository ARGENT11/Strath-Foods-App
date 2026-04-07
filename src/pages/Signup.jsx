import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('customer'); // Default role
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role, // This sends the choice from the dropdown
        }
      }
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Registration successful! Check your email for a confirmation link.");
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form onSubmit={handleSignup} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-black text-[#003366] mb-2 text-center">Join StrathFood</h2>
        <p className="text-gray-400 text-sm text-center mb-8">Create your account to get started</p>

        <div className="space-y-4">
          {/* Full Name Input */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. John Doe"
              className="w-full p-4 mt-1 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#E77206] transition-all"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
            <input 
              type="email" 
              placeholder="student@strathmore.edu"
              className="w-full p-4 mt-1 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#E77206] transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Role Selection Dropdown */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">I am a...</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-4 mt-1 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#E77206] transition-all appearance-none cursor-pointer"
            >
              <option value="customer">Student (Customer)</option>
              <option value="restaurant">Canteen Staff (Restaurant)</option>
              <option value="delivery">Rider (Delivery)</option>
            </select>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full p-4 mt-1 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#E77206] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-[#003366] text-white p-4 rounded-2xl font-bold mt-8 shadow-lg active:scale-95 transition-all"
        >
          Create Account
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <span onClick={() => navigate('/login')} className="text-[#E77206] font-bold cursor-pointer hover:underline">Log In</span>
        </p>
      </form>
    </div>
  );
};

export default Signup;