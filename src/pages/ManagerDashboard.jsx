import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';
import { Users, TrendingUp, ShoppingBag, Bike, AlertCircle, RefreshCw } from 'lucide-react';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeRiders: 0,
    revenue: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Total Orders
      const { count: totalOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // 2. Fetch Active Riders (from profiles table based on role)
      const { count: activeRiders, error: ridersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'delivery');

      // 3. Fetch Pending/In-Kitchen Orders
      const { count: pendingOrders, error: pendingError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in kitchen', 'ready']);

      // 4. Calculate Total Revenue (fetching completed/delivered orders)
      const { data: completedOrders, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount')
        .in('status', ['completed', 'delivered']);

      const totalRevenue = completedOrders 
        ? completedOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)
        : 0;

      // 5. Fetch Recent Orders (Joining with customers table)
      const { data: latestOrders, error: latestError } = await supabase
        .from('orders')
        .select(`
          order_id,
          total_amount,
          status,
          order_date,
          customers (username)
        `)
        .order('order_date', { ascending: false })
        .limit(6);

      if (ordersError || ridersError || pendingError || revenueError || latestError) {
        console.error("Error fetching data");
      }

      setStats({
        totalOrders: totalOrders || 0,
        activeRiders: activeRiders || 0,
        revenue: totalRevenue,
        pendingOrders: pendingOrders || 0
      });
      setRecentOrders(latestOrders || []);

    } catch (error) {
      console.error("Error loading dashboard data:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Optional: Set up real-time subscription for new orders
    const ordersSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, []);

  const kpiCards = [
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-blue-600" },
    { title: "Total Revenue", value: `KES ${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: "text-green-600" },
    { title: "Active Riders", value: stats.activeRiders, icon: Bike, color: "text-orange-500" },
    { title: "Active/Pending Orders", value: stats.pendingOrders, icon: AlertCircle, color: "text-red-500" },
  ];

  // Helper function to color-code statuses based on your schema check constraints
  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'delivered') return 'bg-green-500/20 text-green-400';
    if (s === 'dispatched' || s === 'out for delivery') return 'bg-blue-500/20 text-blue-400';
    if (s === 'ready') return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-orange-500/20 text-orange-400'; // pending, in kitchen
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b132b] text-slate-200">
      <Header />

      <main className="flex-grow p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Management <span className="text-gradient-orange">Dashboard</span>
            </h1>
            <p className="text-slate-400">Platform overview and live administration</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium shadow-md hover:bg-slate-700 transition-colors flex items-center gap-2 border border-slate-700"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-[#E77206] to-[#ff8c00] text-white rounded-lg font-semibold shadow-lg glow-orange transition-transform hover:-translate-y-1">
              Generate Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="glass-card p-6 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {isLoading ? "..." : card.value}
                  </h3>
                </div>
                <div className={`p-3 rounded-full bg-slate-100 ${card.color}`}>
                  <Icon size={24} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity Section */}
          <div className="lg:col-span-2 glass-panel-dark p-6 rounded-xl flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
              <h2 className="text-xl font-semibold text-white">Recent Order Activity</h2>
              <span className="text-sm text-slate-400 animate-pulse">Live Updates Active</span>
            </div>
            
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-sm border-b border-slate-700">
                    <th className="pb-3 font-medium">Order ID</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {isLoading && recentOrders.length === 0 ? (
                    <tr><td colSpan="5" className="py-8 text-center text-slate-500">Loading data...</td></tr>
                  ) : recentOrders.length === 0 ? (
                    <tr><td colSpan="5" className="py-8 text-center text-slate-500">No recent orders found.</td></tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.order_id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 font-mono text-[#ff8c00]">#ORD-{order.order_id}</td>
                        <td className="py-4 font-medium">{order.customers?.username || 'Unknown User'}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 font-semibold">KES {order.total_amount}</td>
                        <td className="py-4 text-slate-400">
                          {new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions / System Status */}
          <div className="glass-panel-dark p-6 rounded-xl flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-white mb-2 border-b border-slate-700 pb-2">
              System Operations
            </h2>
            
            <div className="flex flex-col gap-3">
              <button className="w-full py-3 px-4 glass-card text-slate-800 font-medium rounded-lg text-left hover:bg-slate-50 transition-colors flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="bg-[#003366]/10 p-2 rounded-md group-hover:bg-[#003366]/20 transition-colors"><ShoppingBag size={18} className="text-[#003366]" /></div>
                  <span>Manage Menus</span>
                </div>
                <span className="text-[#003366]">&rarr;</span>
              </button>
              
              <button className="w-full py-3 px-4 glass-card text-slate-800 font-medium rounded-lg text-left hover:bg-slate-50 transition-colors flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="bg-[#E77206]/10 p-2 rounded-md group-hover:bg-[#E77206]/20 transition-colors"><Bike size={18} className="text-[#E77206]" /></div>
                  <span>Rider Registrations</span>
                </div>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse-glow">New</span>
              </button>
              
              <button className="w-full py-3 px-4 glass-card text-slate-800 font-medium rounded-lg text-left hover:bg-slate-50 transition-colors flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-200 p-2 rounded-md group-hover:bg-slate-300 transition-colors"><Users size={18} className="text-slate-700" /></div>
                  <span>User Accounts</span>
                </div>
                <span className="text-[#003366]">&rarr;</span>
              </button>
            </div>

            <div className="mt-auto pt-6">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">System Status</h4>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-400">Database Connected</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-400">Realtime Services Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;