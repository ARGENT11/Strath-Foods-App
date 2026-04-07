import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient'; 
import Header from '../components/Header';

// 1. FIXED: Catch the userProfile prop here
const DeliveryDashboard = ({ userProfile }) => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputPin, setInputPin] = useState('');

  useEffect(() => {
    fetchDeliveryData();
    
    const subscription = supabase
      .channel('delivery-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDeliveryData)
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  async function fetchDeliveryData() {
    // Get the current rider's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get Available Orders (Ready status + no rider assigned)
    const { data: available } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'ready')
      .is('delivery_user_id', null);

    // 2. Get My Active Delivery
    const { data: active, error } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_user_id', user.id)
      .neq('status', 'completed')
      .maybeSingle(); // maybeSingle prevents errors if no active order exists

    setAvailableOrders(available || []);
    setActiveOrder(active || null);
    setLoading(false);
  }

  const claimOrder = async (orderId) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Generate a Delivery PIN for the customer to give the rider later
    const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();

    const { error } = await supabase
      .from('orders')
      .update({ 
        delivery_user_id: user.id,
        status: 'dispatched',
        delivery_pin: deliveryPin
      })
      .eq('id', orderId);

    if (error) alert(error.message);
    else fetchDeliveryData();
  };

  const completeDelivery = async () => {
    if (inputPin === activeOrder.delivery_pin) {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', activeOrder.id);

      if (!error) {
        alert("Delivery Successful! KES " + activeOrder.total_amount + " cleared.");
        setInputPin('');
        fetchDeliveryData();
      }
    } else {
      alert("Invalid Customer PIN. Please ask the student for their 4-digit code.");
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-[#003366] animate-pulse">Loading Deliveries...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* FIXED: Reusable Header with profile data */}
      <Header userProfile={userProfile} />

      <div className="p-6 pb-24 max-w-lg mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-[#003366]">Rider Portal</h1>
          <p className="text-gray-500 text-sm">Strathmore Delivery Network</p>
        </header>

        {activeOrder ? (
          /* ACTIVE DELIVERY VIEW */
          <div className="bg-[#003366] text-white p-6 rounded-3xl shadow-xl border-t-4 border-[#E77206]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded">CURRENT JOB</span>
                <h2 className="text-xl font-bold mt-2 leading-tight">{activeOrder.items_summary}</h2>
                <p className="opacity-70 text-sm mt-1">Deliver to: Student Center Area</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-60">Earnings</p>
                <p className="font-black text-lg">KES {activeOrder.total_amount}</p>
              </div>
            </div>

            <div className="bg-white/10 p-4 rounded-2xl mb-6">
              <p className="text-xs font-bold mb-2 text-[#E77206] uppercase text-center">Customer Verification</p>
              <input 
                type="text" 
                placeholder="0000" 
                maxLength="4"
                className="w-full bg-white text-[#003366] p-4 rounded-xl font-black text-center text-3xl tracking-[0.5em] outline-none border-2 border-transparent focus:border-[#E77206] transition-all"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
              />
              <p className="text-[10px] text-center mt-3 opacity-60">Ask the student for their 4-digit security code</p>
            </div>

            <button 
              onClick={completeDelivery}
              className="w-full bg-[#E77206] text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all uppercase tracking-wider"
            >
              Confirm Delivery
            </button>
          </div>
        ) : (
          /* AVAILABLE JOBS VIEW */
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              Available Jobs 
              <span className="bg-orange-100 text-[#E77206] text-[10px] px-2 py-0.5 rounded-full">{availableOrders.length}</span>
            </h3>
            
            {availableOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">Waiting for orders from kitchen...</p>
              </div>
            ) : (
              availableOrders.map((order) => (
                <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:border-[#003366]/20 transition-colors">
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase">Pickup: Main Canteen</p>
                    <h4 className="font-bold text-slate-800">{order.items_summary}</h4>
                    <p className="text-xs text-gray-400">KES {order.total_amount}</p>
                  </div>
                  <button 
                    onClick={() => claimOrder(order.id)}
                    className="bg-[#003366] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-sm active:scale-90 transition-all"
                  >
                    Accept
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;