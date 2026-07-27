import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Tracking from './pages/Tracking';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RestaurantDashboard from './pages/RestaurantDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [userProfile, setUserProfile] = useState(null); 
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const getProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUserProfile(data);
      setUserRole(data.role);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) await getProfile(session.user.id);
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await getProfile(session.user.id);
      } else {
        setUserRole(null);
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const addToCart = (item) => setCart((prev) => [...prev, item]);
  
  const removeFromCart = (indexToRemove) => {
    setCart((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <div className="w-12 h-12 border-4 border-[#003366] border-t-[#E77206] rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading StrathFood...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="relative min-h-screen bg-slate-50 font-sans">
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/" />} />
          
          {/* Secured Manager Dashboard Route */}
          <Route 
            path="/manager/dashboard" 
            element={
              session && userRole === 'manager' ? (
                <ManagerDashboard userProfile={userProfile} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          <Route 
            path="/" 
            element={
              session ? (
                userRole === 'manager' ? <Navigate to="/manager/dashboard" replace /> :
                userRole === 'restaurant' ? <RestaurantDashboard userProfile={userProfile} /> :
                userRole === 'delivery' ? <DeliveryDashboard userProfile={userProfile} /> :
                
                <Home 
                  addToCart={addToCart} 
                  removeFromCart={removeFromCart} 
                  cart={cart} 
                  cartCount={cart.length} 
                  userProfile={userProfile} 
                />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />

          <Route 
            path="/checkout" 
            element={session && (userRole === 'customer' || !userRole) ? (
              <Checkout cart={cart} removeFromCart={removeFromCart} userProfile={userProfile} />
            ) : (
              <Navigate to="/" />
            )} 
          />
          
          <Route 
            path="/tracking" 
            element={session ? <Tracking userProfile={userProfile} /> : <Navigate to="/login" />} 
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;