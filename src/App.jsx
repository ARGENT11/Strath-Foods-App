
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';


import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Tracking from './pages/Tracking';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RestaurantDashboard from './pages/RestaurantDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';





function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Session Check
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) await getProfile(session.user.id);
      setLoading(false);
    };

    fetchSession();

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await getProfile(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch the role from the 'profiles' table
  const getProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUserRole(data.role);
    }
  };

  // LOGOUT LOGIC
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Error logging out: " + error.message);
    } else {
      setSession(null);
      setUserRole(null);
      setCart([]); // Clear cart on logout
    }
  };

  const addToCart = (item) => setCart((prev) => [...prev, item]);
  
  const removeFromCart = (indexToRemove) => {
    setCart((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#003366] border-t-[#E77206] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="relative min-h-screen">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/" />} />

          {/* Dynamic Home Route based on Role */}
          <Route 
            path="/" 
            element={
              session ? (
                userRole === 'restaurant' ? <RestaurantDashboard /> :
                userRole === 'delivery' ? <DeliveryDashboard /> :
                <Home addToCart={addToCart} cartCount={cart.length} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />

          {/* Customer Only Routes */}
          <Route 
            path="/checkout" 
            element={session && userRole === 'customer' ? (
              <Checkout cart={cart} removeFromCart={removeFromCart} />
            ) : (
              <Navigate to="/" />
            )} 
          />
          
          <Route 
            path="/tracking" 
            element={session ? <Tracking /> : <Navigate to="/login" />} 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {/* GLOBAL LOGOUT BUTTON */}
        {session && (
          <button 
            onClick={handleLogout}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-xl border border-gray-100 text-red-500 font-bold hover:bg-red-50 transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        )}
      </div>
    </Router>
  );
}

export default App;