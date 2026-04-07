
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// PAGE IMPORTS (Make sure each is here only ONCE)
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Tracking from './pages/Tracking';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RestaurantDashboard from './pages/RestaurantDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';





function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'customer', 'restaurant', or 'delivery'
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

  // Function to fetch the role from the 'profiles' table
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
          element={session && userRole === 'customer' ? <Checkout cart={cart} removeFromCart={removeFromCart} /> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/tracking" 
          element={session ? <Tracking /> : <Navigate to="/login" />} 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;