import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';
import { Bike, MapPin, CheckCircle2, ShieldCheck, DollarSign, PackageCheck, AlertCircle, RefreshCw, Utensils, Clock, Loader2, X } from 'lucide-react';
import Toast from '../components/Toast';

const DeliveryDashboard = ({ userProfile }) => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [toast, setToast] = useState(null);
  
  // State to manage PIN input box visibility
  const [showPin, setShowPin] = useState(true);

  // Helper to safely extract order ID regardless of DB column naming
  const getOrderId = (orderObj) => orderObj?.order_id || orderObj?.id;
  
  // Helper to get exact ID column key
  const getIdCol = (orderObj) => 
    ('order_id' in (orderObj || {}) && orderObj.order_id !== null && orderObj.order_id !== undefined)
      ? 'order_id' 
      : 'id';

  useEffect(() => {
    fetchDeliveryData();
    
    // Subscribe to real-time order updates
    const subscription = supabase
      .channel('delivery-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDeliveryData)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchDeliveryData() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      let user = sessionData?.session?.user;
      if (!user) {
        const { data: userData } = await supabase.auth.getUser();
        user = userData?.user;
      }
      if (!user) return;

      // 1. Fetch available orders with column fallbacks for ordering
      let available = [];
      const availQuery = supabase
        .from('orders')
        .select('*')
        .in('status', ['ready', 'Ready', 'in kitchen', 'In Kitchen'])
        .is('delivery_user_id', null);

      // Try order_id first, fallback to id, then created_at
      let { data, error } = await availQuery.order('order_id', { ascending: false });
      if (error) {
        let res = await availQuery.order('id', { ascending: false });
        if (res.error) {
          res = await availQuery.order('created_at', { ascending: false });
        }
        data = res.data;
      }
      available = data || [];

      // 2. Fetch active delivery assigned to current rider
      const { data: active } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_user_id', user.id)
        .in('status', ['dispatched', 'Dispatched', 'out for delivery', 'Out for Delivery'])
        .maybeSingle();

      setAvailableOrders(available);
      setActiveOrder(active || null);
    } catch (err) {
      console.error("Error fetching delivery data:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const claimOrder = async (orderObj) => {
    const targetId = getOrderId(orderObj);
    const idCol = getIdCol(orderObj);

    if (!targetId) {
      setToast({ type: 'error', message: 'Error: Unable to identify Order ID.' });
      return;
    }

    setClaimingId(targetId);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      let user = sessionData?.session?.user;
      if (!user) {
        const { data: userData } = await supabase.auth.getUser();
        user = userData?.user;
      }
      if (!user) throw new Error("Authentication required to claim orders.");
      
      const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();

      // Claim order & transition status to dispatched
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          delivery_user_id: user.id,
          status: 'dispatched',
          delivery_pin: deliveryPin
        })
        .eq(idCol, targetId)
        .select();

      if (error) throw error;

      setToast({ type: 'success', message: 'Pickup confirmed! Head to canteen kitchen to collect meal.' });
      await fetchDeliveryData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to claim order.' });
    } finally {
      setClaimingId(null);
    }
  };

  const completeDelivery = async () => {
    if (!activeOrder) return;

    const targetId = getOrderId(activeOrder);
    const idCol = getIdCol(activeOrder);

    const enteredPin = inputPin.trim();
    const expectedPin = String(activeOrder.delivery_pin || '').trim();

    if (enteredPin && enteredPin === expectedPin) {
      setIsCompleting(true);
      try {
        // 10-second network timeout failsafe
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Network timeout. Please check your connection and try again.")), 10000)
        );

        const updatePromise = supabase
          .from('orders')
          .update({ status: 'delivered' })
          .eq(idCol, targetId)
          .select();

        const { data, error } = await Promise.race([updatePromise, timeout]);

        if (error) throw error;

        // Ensure rows were actually updated (prevents silent RLS policy failures)
        if (!data || data.length === 0) {
          throw new Error("Update failed. You may lack permission to update this order.");
        }

        setToast({ 
          type: 'success', 
          message: `Delivery complete! KES ${activeOrder.total_amount} cleared.` 
        });
        setInputPin('');
        await fetchDeliveryData();
      } catch (err) {
        console.error("Completion error:", err);
        setToast({ type: 'error', message: err.message || "Error completing delivery." });
      } finally {
        setIsCompleting(false);
      }
    } else {
      setToast({ 
        type: 'error', 
        message: "Invalid Customer PIN! Please ask student for their 4-digit security PIN." 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Header userProfile={userProfile} />
        <div className="p-12 text-center max-w-md mx-auto my-12 glass-card rounded-3xl border border-slate-200">
          <div className="w-12 h-12 border-4 border-[#003366] border-t-[#E77206] rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="font-bold text-slate-800 text-lg">Loading Available Pickup Feed...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <Header userProfile={userProfile} />

      <main className="p-4 sm:p-6 max-w-lg mx-auto pt-6">
        
        {/* Header Bar */}
        <header className="mb-6 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Bike className="w-5 h-5 text-[#E77206]" />
              <h1 className="text-2xl font-black text-[#003366] tracking-tight">Rider Delivery Feed</h1>
            </div>
            <p className="text-slate-500 text-xs">Strathmore Campus Delivery Network</p>
          </div>

          <button 
            type="button"
            onClick={fetchDeliveryData}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-[#003366] hover:bg-slate-100 transition-colors shadow-sm active:scale-90 flex items-center gap-1 text-xs font-bold"
            title="Refresh feed"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        {activeOrder ? (
          /* ACTIVE DELIVERY JOB CARD */
          <div className="bg-gradient-to-br from-[#003366] via-[#0A2540] to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border-t-4 border-[#E77206] space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E77206]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black bg-[#E77206] text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Active Delivery Job
                </span>
                <h2 className="text-xl font-black mt-3 leading-tight text-white">{activeOrder.items_summary || 'Canteen Meal'}</h2>
                <div className="flex items-center gap-1.5 text-slate-300 text-xs mt-2">
                  <MapPin className="w-3.5 h-3.5 text-[#E77206]" />
                  <span>Deliver to: Student Center / Campus Area</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Order Total</p>
                <p className="font-black text-xl text-[#E77206]">KES {activeOrder.total_amount}</p>
              </div>
            </div>

            {/* Verification Input Box Toggle */}
            {showPin ? (
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 relative">
                {/* Close Button to hide PIN Input */}
                <button
                  type="button"
                  onClick={() => setShowPin(false)}
                  className="absolute top-3 right-3 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title="Hide PIN Input"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-[#E77206] uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Customer Verification PIN</span>
                </div>

                <input 
                  type="text" 
                  placeholder="0000" 
                  maxLength="4"
                  className="w-full bg-white text-[#003366] p-4 rounded-xl font-black text-center text-3xl tracking-[0.5em] outline-none border-2 border-transparent focus:border-[#E77206] transition-all shadow-inner font-mono"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                />
                <p className="text-[11px] text-center mt-3 text-slate-300">
                  Ask student for their 4-digit code before handing over food
                </p>
              </div>
            ) : (
              /* Button to reveal PIN Input */
              <button
                type="button"
                onClick={() => setShowPin(true)}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 text-white font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Enter Customer Verification PIN</span>
              </button>
            )}

            <button 
              type="button"
              disabled={isCompleting || !showPin}
              onClick={completeDelivery}
              className="w-full bg-gradient-to-r from-[#E77206] to-amber-600 hover:from-amber-600 hover:to-[#E77206] text-white py-4 rounded-2xl font-black shadow-lg shadow-[#E77206]/30 active:scale-95 transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying & Completing...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="w-5 h-5" />
                  <span>Confirm Delivery Hand-off</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* AVAILABLE JOBS FEED */
          <div className="space-y-4">
            <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
              <Utensils className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="font-semibold">
                Showing <span className="font-extrabold">only orders ready for pickup</span> prepared & confirmed by the kitchen.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span>Orders Ready for Pickup</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-black border border-emerald-300">
                  {availableOrders.length}
                </span>
              </h3>
            </div>
            
            {availableOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-6">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-sm">No orders ready for pickup right now</h4>
                <p className="text-slate-400 text-xs mt-1">Pending orders are still being prepared by the canteen kitchen.</p>
              </div>
            ) : (
              availableOrders.map((order) => {
                const orderIdVal = getOrderId(order);
                const isClaimingThis = claimingId === orderIdVal;

                return (
                  <div 
                    key={orderIdVal} 
                    className="glass-card p-5 rounded-3xl border border-slate-200/80 shadow-sm flex justify-between items-center hover:border-emerald-500/40 transition-all hover:shadow-md bg-white"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-300 flex items-center gap-1">
                          <Utensils className="w-3 h-3" /> Kitchen Ready
                        </span>
                        <span className="text-[10px] font-black text-slate-400">
                          #ORD-{orderIdVal.toString().slice(-4)}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mt-1">{order.items_summary || "Canteen Meal"}</h4>
                      <p className="text-xs font-black text-[#E77206]">Earnings: KES {order.total_amount}</p>
                    </div>

                    <button 
                      type="button"
                      disabled={isClaimingThis}
                      onClick={() => claimOrder(order)}
                      className="bg-gradient-to-r from-[#003366] to-slate-800 hover:from-slate-800 hover:to-[#003366] text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md shadow-[#003366]/20 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                    >
                      {isClaimingThis ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Accepting...</span>
                        </>
                      ) : (
                        <span>Accept Pickup</span>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DeliveryDashboard;