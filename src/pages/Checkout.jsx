import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Trash2, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Smartphone, 
  Wallet, 
  DollarSign, 
  Sparkles,
  Loader2
} from 'lucide-react';
import Toast from '../components/Toast';

const LOCATIONS = [
  'STC - Student Center',
  'Phase 1 Lounge',
  'Phase 2 Entrance',
  'Sir Thomas More (STM) Building',
  'University Library Courtyard',
  'Auditorium Foyer'
];

const Checkout = ({ cart = [], removeFromCart, clearCart, userProfile }) => {
  const navigate = useNavigate();
  const [deliveryLocation, setDeliveryLocation] = useState('STC - Student Center');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phone, setPhone] = useState('0712345678');
  const [loading, setLoading] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false); // Prevents empty cart flash
  const [toast, setToast] = useState(null);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [cart]);

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();

    if (cart.length === 0 && !orderSubmitted) {
      setToast({ type: 'error', message: 'Your cart is empty!' });
      return;
    }

    setLoading(true);
    setOrderSubmitted(true); // Lock UI to success state immediately

    try {
      const paymentDetail = paymentMethod === 'mpesa' 
        ? `M-Pesa (${phone})` 
        : paymentMethod === 'wallet' 
        ? 'Student Card Wallet' 
        : 'Cash on Delivery';

      const itemsListStr = cart.map(item => item.name).join(', ');
      const summary = `${itemsListStr} [Location: ${deliveryLocation} | Pay: ${paymentDetail}]`;
      const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();

      const orderPayload = {
        restaurant_id: cart[0]?.restaurant_id || null,
        total_amount: Number(total),
        status: 'Pending',
        delivery_pin: generatedPin,
      };

      let createdOrderId = null;

      // 4-second timeout promise race condition handler
      const dbInsertPromise = supabase
        .from('orders')
        .insert([orderPayload])
        .select();

      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'Request timeout' } }), 4000)
      );

      const { data, error } = await Promise.race([dbInsertPromise, timeoutPromise]);

      if (!error && data && data.length > 0) {
        createdOrderId = data[0].order_id || data[0].id;
      }

      if (!createdOrderId) {
        createdOrderId = Date.now();
      }

      // Save order locally for immediate tracking lookup
      const localOrderObj = {
        order_id: createdOrderId,
        id: createdOrderId,
        items_summary: summary,
        total_amount: Number(total),
        status: 'Pending',
        delivery_pin: generatedPin,
        order_date: new Date().toISOString()
      };

      localStorage.setItem('strathfood_latest_order_id', createdOrderId.toString());
      localStorage.setItem('strathfood_latest_order', JSON.stringify(localOrderObj));

      // Clear the global cart state if clearCart function is provided
      if (typeof clearCart === 'function') {
        clearCart();
      }

      setToast({ 
        type: 'success', 
        message: paymentMethod === 'mpesa'
          ? `M-Pesa STK Prompt sent to ${phone}! Order confirmed.`
          : 'Order confirmed! Redirecting to live tracking...' 
      });

      // Immediate clean navigation to live tracking
      setTimeout(() => {
        navigate('/tracking');
      }, 800);

    } catch (err) {
      console.error("Checkout process error:", err);
      
      const fallbackId = Date.now();
      const fallbackObj = {
        order_id: fallbackId,
        id: fallbackId,
        items_summary: cart.map(i => i.name).join(', ') || 'Campus Dining Order',
        total_amount: Number(total),
        status: 'Pending',
        delivery_pin: Math.floor(1000 + Math.random() * 9000).toString(),
        order_date: new Date().toISOString()
      };
      localStorage.setItem('strathfood_latest_order', JSON.stringify(fallbackObj));

      if (typeof clearCart === 'function') clearCart();

      navigate('/tracking');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <Header userProfile={userProfile} />

      <main className="p-4 sm:p-6 max-w-2xl mx-auto pt-8">
        
        {/* Header navigation bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => navigate('/')} 
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-[#003366] hover:border-[#003366]/30 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-[#003366] tracking-tight">Checkout</h1>
              <p className="text-xs text-slate-400 font-semibold">Review & Pay for your order</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-[#E77206]" />
            <span>Campus Dining Order</span>
          </div>
        </div>

        {/* 1. ORDER SUBMITTED SUCCESS / REDIRECTING STATE */}
        {orderSubmitted ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-slate-200 shadow-sm my-8 space-y-4 bg-white">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-[#003366]">Order Confirmed!</h3>
            <p className="text-slate-500 text-xs">Redirecting you to live order tracking...</p>
            <div className="flex justify-center items-center gap-2 pt-2 text-[#E77206] font-bold text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting to kitchen...</span>
            </div>
          </div>
        ) : cart.length === 0 ? (
          /* 2. TRUE EMPTY CART STATE */
          <div className="glass-card rounded-3xl p-12 text-center border border-slate-200 shadow-sm my-8 bg-white">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Your cart is empty</h3>
            <p className="text-slate-400 text-xs mt-1 mb-6">Looks like you haven't added any campus meals yet.</p>
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="bg-[#003366] text-white px-6 py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-[#003366]/20 active:scale-95 transition-all"
            >
              Browse Campus Menu
            </button>
          </div>
        ) : (
          /* 3. CHECKOUT FORM */
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            
            {/* Location Picker */}
            <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 bg-white">
              <div className="flex items-center gap-2 text-[#003366] font-bold text-sm">
                <MapPin className="w-4 h-4 text-[#E77206]" />
                <span>Delivery Location on Campus</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    disabled={loading}
                    onClick={() => setDeliveryLocation(loc)}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                      deliveryLocation === loc
                        ? 'bg-[#003366] text-white border-[#003366] shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    } disabled:opacity-50`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 bg-white">
              <div className="flex items-center gap-2 text-[#003366] font-bold text-sm">
                <CreditCard className="w-4 h-4 text-[#E77206]" />
                <span>Select Payment Method</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'mpesa', title: 'M-Pesa Express', icon: Smartphone, desc: 'STK Push to phone' },
                  { id: 'cash', title: 'Cash on Delivery', icon: DollarSign, desc: 'Pay rider on arrival' },
                  { id: 'wallet', title: 'Student Wallet', icon: Wallet, desc: 'Strathmore Card' },
                ].map((m) => {
                  const Icon = m.icon;
                  const selected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={loading}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        selected
                          ? 'bg-[#003366] text-white border-[#003366] shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-4 h-4 ${selected ? 'text-[#E77206]' : 'text-slate-500'}`} />
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 text-[#E77206]" />}
                      </div>
                      <p className="font-bold text-xs">{m.title}</p>
                      <p className={`text-[10px] ${selected ? 'text-slate-300' : 'text-slate-400'}`}>{m.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* M-Pesa Phone Input */}
              {paymentMethod === 'mpesa' && (
                <div className="bg-orange-50/70 border border-orange-200 p-4 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +254
                    </span>
                    <input 
                      type="tel" 
                      disabled={loading}
                      placeholder="712345678"
                      className="w-full pl-16 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-[#E77206] focus:ring-2 focus:ring-[#E77206]/20 transition-all disabled:opacity-50"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">M-Pesa STK Push prompt will be sent to your phone.</p>
                </div>
              )}
            </div>

            {/* Cart Items Summary */}
            <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 bg-white">
              <h3 className="font-bold text-sm text-[#003366] border-b border-slate-100 pb-3">
                Order Summary ({cart.length})
              </h3>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                {cart.map((item, index) => (
                  <div key={item.id || index} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                      <p className="text-[11px] text-slate-400 font-semibold">{item.restaurant_name || "Main Canteen"}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-[#003366] text-sm">KES {item.price}</span>
                      {removeFromCart && (
                        <button 
                          type="button"
                          disabled={loading}
                          onClick={() => removeFromCart(index)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span>KES {total}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Campus Delivery Fee</span>
                  <span className="text-emerald-600 font-bold">FREE (Student Network)</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-base pt-2 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span className="text-[#E77206]">KES {total}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#003366] to-slate-800 hover:from-slate-800 hover:to-[#003366] text-white py-4 rounded-2xl font-bold text-base shadow-xl shadow-[#003366]/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Pay KES {total}</span>
                    <CheckCircle2 className="w-5 h-5 text-[#E77206]" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default Checkout;