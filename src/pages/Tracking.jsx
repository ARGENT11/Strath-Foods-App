import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';
import { Clock, Utensils, Bike, CheckCircle2, Copy, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import Toast from '../components/Toast';

const Tracking = ({ userProfile }) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  async function fetchLatestOrder() {
    try {
      setLoading(true);
      let foundOrder = null;

      // 1. Fetch latest order from Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      let user = sessionData?.session?.user;
      if (!user) {
        const { data: userData } = await supabase.auth.getUser();
        user = userData?.user;
      }

      if (user) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .order('order_id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) foundOrder = data;
      }

      // 2. LocalStorage Fallback
      if (!foundOrder) {
        const localData = localStorage.getItem('strathfood_latest_order');
        if (localData) {
          try {
            foundOrder = JSON.parse(localData);
          } catch (e) {
            console.error("Local order parse error:", e);
          }
        }
      }

      setOrder(foundOrder);
    } catch (err) {
      console.error("Error fetching order:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLatestOrder();

    // Listen for realtime kitchen updates from Supabase
    const subscription = supabase
      .channel('order-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrder(payload.new);
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  const copyPin = () => {
    if (order?.delivery_pin) {
      navigator.clipboard.writeText(order.delivery_pin);
      setCopied(true);
      setToast({ type: 'success', message: 'Delivery PIN copied!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Header userProfile={userProfile} />
        <div className="p-12 text-center max-w-md mx-auto my-12 glass-card rounded-3xl border border-slate-200">
          <div className="w-12 h-12 border-4 border-[#003366] border-t-[#E77206] rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="font-bold text-slate-800 text-lg">Locating active order...</h2>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Header userProfile={userProfile} />
        <div className="p-12 text-center max-w-md mx-auto my-12 glass-card rounded-3xl border border-slate-200 shadow-sm">
          <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="font-bold text-slate-800 text-lg">No active orders found</h2>
          <button 
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 bg-[#003366] text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-md active:scale-95 transition-all"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  // Exact mapping matching SQL check constraints
  const steps = [
    { key: 'pending', label: 'Order Received', icon: Clock },
    { key: 'in kitchen', label: 'In Kitchen', icon: Utensils },
    { key: 'out for delivery', label: 'Dispatched', icon: Bike },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  const currentStatus = (order.status || 'Pending').toLowerCase();
  let currentStepIndex = steps.findIndex(s => s.key === currentStatus);
  if (currentStepIndex === -1) currentStepIndex = 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <Header userProfile={userProfile} />

      <main className="p-4 sm:p-6 max-w-xl mx-auto pt-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#003366]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Sync</span>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-8 bg-white">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Order ID: #{order.order_id || order.id}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#003366] mt-3 capitalize">
              {order.status}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              {currentStatus === 'pending' && "Awaiting kitchen confirmation..."}
              {currentStatus === 'in kitchen' && "Kitchen is preparing your meal!"}
              {currentStatus === 'out for delivery' && "Rider is on the way to your location!"}
              {currentStatus === 'delivered' && "Order delivered. Enjoy your meal!"}
            </p>
          </div>

          {/* Stepper Bar */}
          <div className="relative pt-2 pb-4">
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
            <div 
              className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-[#003366] to-[#E77206] -translate-y-1/2 rounded-full transition-all duration-700" 
              style={{ width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 92)}%` }}
            />

            <div className="relative z-10 flex justify-between items-center">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const isPassed = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      isCurrent 
                        ? 'bg-[#E77206] text-white shadow-lg scale-110 ring-4 ring-orange-100' 
                        : isPassed 
                        ? 'bg-[#003366] text-white shadow-md' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold mt-2 ${isPassed ? 'text-[#003366]' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Summary</span>
              <span className="font-bold text-slate-800">{order.items_summary || "Meal Order"}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
              <span className="text-slate-500 font-medium">Total Paid</span>
              <span className="font-black text-[#003366] text-sm">KES {order.total_amount}</span>
            </div>
          </div>

          {/* Security PIN */}
          {order.delivery_pin && (
            <div className="bg-orange-50/60 border-2 border-dashed border-[#E77206] p-5 rounded-3xl text-center">
              <div className="inline-flex items-center gap-1 text-[10px] font-black text-[#E77206] uppercase tracking-widest mb-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Delivery PIN</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-black text-[#003366] tracking-[0.3em] font-mono">
                  {order.delivery_pin}
                </span>
                <button 
                  type="button"
                  onClick={copyPin}
                  className="p-2 rounded-xl bg-white border border-orange-200 text-[#E77206]"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Tracking;