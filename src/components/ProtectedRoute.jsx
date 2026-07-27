// import React, { useEffect, useState } from 'react';
// import { Navigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';

// const ProtectedRoute = ({ children, allowedRoles }) => {
//   const [role, setRole] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const checkUserRole = async () => {
//       const { data: { user } } = await supabase.auth.getUser();
      
//       if (!user) {
//         setLoading(false);
//         return;
//       }

//       // Fetch user role from profiles
//       const { data } = await supabase
//         .from('profiles')
//         .select('role')
//         .eq('id', user.id)
//         .single();

//       if (data) setRole(data.role);
//       setLoading(false);
//     };

//     checkUserRole();
//   }, []);

//   if (loading) return <div className="min-h-screen bg-[#0b132b] flex items-center justify-center text-white">Loading...</div>;
  
//   if (!role) return <Navigate to="/login" replace />;
  
//   if (!allowedRoles.includes(role)) return <Navigate to="/" replace />; // Redirect unauthorized users to home

//   return children;
// };

// export default ProtectedRoute;