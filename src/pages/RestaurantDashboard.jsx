import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';
import { Store, Utensils, CheckCircle2, Clock, Upload, Edit3, Save, X, RefreshCw, Image as ImageIcon, Bike, PackageCheck, Loader2 } from 'lucide-react';
import Toast from '../components/Toast';

const RestaurantDashboard = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu'
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'pending' | 'ready' | 'dispatched' | 'completed'
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null); // Tracks button loading state
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  // Helper to safely normalize status strings regardless of database casing
  const getNormStatus = (status) => {
    const s = (status || '').toString().toLowerCase();
    if (s === 'pending') return 'pending';
    if (s === 'ready' || s === 'in kitchen') return 'ready';
    if (s === 'dispatched' || s === 'out for delivery') return 'dispatched';
    if (s === 'completed' || s === 'delivered') return 'completed';
    return s || 'pending';
  };

  useEffect(() => {
    fetchOrders();
    fetchMenu();

    const orderSubscription = supabase
      .channel('kitchen-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderSubscription);
    };
  }, []);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('order_id', { ascending: false });

      if (error) {
        // Fallback query if column is named 'id' instead of 'order_id'
        const { data: fallbackData } = await supabase
          .from('orders')
          .select('*')
          .order('id', { ascending: false });
        setOrders(fallbackData || []);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMenu() {
    try {
      const { data } = await supabase.from('menu_items').select('*').order('name', { ascending: true });
      setMenuItems(data || []);
    } catch (err) {
      console.error("Error fetching menu:", err.message);
    }
  }

  // Kitchen confirms food is prepared & ready for rider pickup
  const confirmReadyForPickup = async (orderObj) => {
    // 1. Determine which ID column exists on the object
    const idCol = ('order_id' in orderObj && orderObj.order_id !== null && orderObj.order_id !== undefined) 
      ? 'order_id' 
      : 'id';
    
    const targetId = orderObj[idCol];

    if (!targetId) {
      alert("Error: Missing order ID");
      return;
    }

    setUpdatingId(targetId);

    try {
      // 2. Update status to capitalized 'Ready' to satisfy orders_status_check constraint
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Ready' })
        .eq(idCol, targetId);

      if (error) throw error;

      // 3. Optimistically update local state so UI updates immediately
      setOrders(prev => prev.map(o => {
        const itemKey = o[idCol] || o.order_id || o.id;
        if (itemKey === targetId) {
          return { ...o, status: 'Ready' };
        }
        return o;
      }));

      setToast({ 
        type: 'success', 
        message: `Order #${targetId.toString().slice(-4)} marked as Ready for Pickup!` 
      });

      // 4. Refresh full list from DB
      await fetchOrders();
    } catch (err) {
      console.error("Failed to update order:", err);
      alert(`Database Error: ${err.message || 'Could not update status.'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleImageUpload = async (event, itemId) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('food-images')
        .getPublicUrl(filePath);

      const idCol = ('id' in (menuItems[0] || {})) ? 'id' : 'item_id';

      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ image_url: publicUrl })
        .eq(idCol, itemId);

      if (updateError) throw updateError;

      await fetchMenu();
      setToast({ type: 'success', message: 'Menu image updated successfully!' });
    } catch (error) {
      setToast({ type: 'error', message: 'Upload failed: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  const toggleAvailability = async (itemId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const idCol = ('id' in (menuItems[0] || {})) ? 'id' : 'item_id';

      const { error } = await supabase
        .from('menu_items')
        .update({ availability: newStatus })
        .eq(idCol, itemId);

      if (error) throw error;
      
      setMenuItems(prev => prev.map(item => {
        if ((item.id || item.item_id) === itemId) {
          return { ...item, availability: newStatus };
        }
        return item;
      }));

      setToast({ 
        type: 'info', 
        message: `Item marked as ${newStatus ? 'Available' : 'Out of Stock'}` 
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const updatePrice = async (itemId) => {
    try {
      if (!newPrice || isNaN(newPrice)) {
        setToast({ type: 'error', message: 'Please enter a valid price.' });
        return;
      }

      const idCol = ('id' in (menuItems[0] || {})) ? 'id' : 'item_id';

      const { error } = await supabase
        .from('menu_items')
        .update({ price: Number(newPrice) })
        .eq(idCol, itemId);

      if (error) throw error;

      setEditingId(null);
      setToast({ type: 'success', message: 'Price updated!' });
      fetchMenu();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Header userProfile={userProfile} />
        <div className="p-12 text-center max-w-md mx-auto my-12 glass-card rounded-3xl border border-slate-200">
          <div className="w-12 h-12 border-4 border-[#003366] border-t-[#E77206] rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="font-bold text-slate-800 text-lg">Opening Kitchen Portal...</h2>
        </div>
      </div>
    );
  }

  const pendingOrdersCount = orders.filter(o => getNormStatus(o.status) === 'pending').length;
  const readyOrdersCount = orders.filter(o => getNormStatus(o.status) === 'ready').length;

  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'all') return true;
    return getNormStatus(order.status) === orderFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <Header userProfile={userProfile} />

      {/* Sub-Header Nav */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#E77206]" />
            <h1 className="text-lg font-black text-[#003366] tracking-tight uppercase">Kitchen Management</h1>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button 
              type="button"
              onClick={() => setActiveTab('orders')} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'orders' 
                  ? 'bg-white shadow-md text-[#003366]' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Kitchen Orders</span>
              {pendingOrdersCount > 0 && (
                <span className="bg-[#E77206] text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab('menu')} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'menu' 
                  ? 'bg-white shadow-md text-[#003366]' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Menu Items</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 pt-6">
        
        {/* TAB 1: KITCHEN ORDERS FEED */}
        {activeTab === 'orders' ? (
          <div className="space-y-4">
            
            {/* Status Filter Chips */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All Orders', count: orders.length },
                  { id: 'pending', label: 'Pending Prep', count: pendingOrdersCount },
                  { id: 'ready', label: 'Ready for Pickup', count: readyOrdersCount },
                  { id: 'dispatched', label: 'In Transit', count: orders.filter(o => getNormStatus(o.status) === 'dispatched').length },
                  { id: 'completed', label: 'Completed', count: orders.filter(o => getNormStatus(o.status) === 'completed').length },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setOrderFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      orderFilter === f.id
                        ? 'bg-[#003366] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${orderFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              <button 
                type="button"
                onClick={fetchOrders}
                className="text-xs font-bold text-[#003366] flex items-center gap-1 hover:underline flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Orders
              </button>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center border border-slate-200 bg-white">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base">No orders in this category</h3>
                <p className="text-slate-400 text-xs mt-1">Orders submitted by students will appear here in real time.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const orderIdVal = order.order_id || order.id;
                const normStatus = getNormStatus(order.status);
                const isUpdatingThis = updatingId === orderIdVal;

                return (
                  <div 
                    key={orderIdVal} 
                    className={`glass-card rounded-3xl p-6 border transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white ${
                      normStatus === 'pending' 
                        ? 'border-[#E77206]/50 bg-orange-50/20 shadow-md' 
                        : normStatus === 'ready'
                        ? 'border-emerald-300 bg-emerald-50/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-[#003366] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          ORD-#{orderIdVal.toString().slice(-4)}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          normStatus === 'ready' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : normStatus === 'dispatched'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : normStatus === 'completed'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {normStatus === 'pending' && 'Pending Kitchen Prep'}
                          {normStatus === 'ready' && 'Ready for Rider Pickup'}
                          {normStatus === 'dispatched' && 'Picked Up by Rider'}
                          {normStatus === 'completed' && 'Delivered'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-800 mt-1">{order.items_summary || "Canteen Meal"}</h3>
                      <p className="text-xs font-black text-[#E77206]">KES {order.total_amount}</p>
                    </div>
                    
                    {/* Kitchen Actions */}
                    <div>
                      {normStatus === 'pending' ? (
                        <button 
                          type="button"
                          disabled={isUpdatingThis}
                          onClick={() => confirmReadyForPickup(order)} 
                          className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isUpdatingThis ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Updating Order...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                              <span>Confirm Food Ready for Pickup</span>
                            </>
                          )}
                        </button>
                      ) : normStatus === 'ready' ? (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-2xl text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center justify-center gap-1">
                            <Bike className="w-3.5 h-3.5" /> Awaiting Rider Pickup
                          </p>
                          {order.delivery_pin && (
                            <p className="text-sm font-black text-[#003366] mt-0.5 font-mono">
                              PIN: {order.delivery_pin}
                            </p>
                          )}
                        </div>
                      ) : normStatus === 'dispatched' ? (
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-2xl text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 flex items-center justify-center gap-1">
                            <PackageCheck className="w-3.5 h-3.5" /> Rider Picked Up
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 capitalize bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                          Order Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* TAB 2: MENU MANAGEMENT */
          <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                Canteen Menu List ({menuItems.length} items)
              </h3>
              <p className="text-[11px] text-slate-400">Click image or price to edit</p>
            </div>

            <div className="divide-y divide-slate-100">
              {menuItems.map((item) => {
                const itemId = item.id || item.item_id;
                const isAvailable = item.availability ?? item.is_available ?? true;

                return (
                  <div key={itemId} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                    
                    {/* Image & Title */}
                    <div className="flex items-center gap-4">
                      <div className="relative group w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} className="w-full h-full rounded-2xl object-cover border border-slate-200 shadow-xs" alt={item.name} />
                        ) : (
                          <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                        <label className="absolute inset-0 bg-slate-900/70 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-white">
                          <Upload className="w-4 h-4 mb-0.5" />
                          <span className="text-[9px] font-black uppercase">{uploading ? '...' : 'Upload'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, itemId)} 
                            disabled={uploading} 
                          />
                        </label>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 text-sm sm:text-base">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => toggleAvailability(itemId, isAvailable)}
                            className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 ${
                              isAvailable 
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            <span>{isAvailable ? 'In Stock' : 'Sold Out'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Price & Price Edit */}
                    <div className="text-right flex-shrink-0">
                      {editingId === itemId ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-20 p-2 border border-[#E77206] rounded-xl text-sm font-bold outline-none bg-white text-slate-800" 
                            value={newPrice} 
                            onChange={(e) => setNewPrice(e.target.value)} 
                          />
                          <button type="button" onClick={() => updatePrice(itemId)} className="bg-emerald-600 text-white p-2 rounded-xl text-xs font-bold hover:bg-emerald-700">
                            <Save className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="font-black text-[#003366] text-base sm:text-lg">KES {item.price}</span>
                          <button 
                            type="button"
                            onClick={() => { setEditingId(itemId); setNewPrice(item.price); }} 
                            className="text-[#E77206] text-[11px] font-bold uppercase tracking-tight hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Edit3 className="w-3 h-3" /> Edit Price
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RestaurantDashboard;