import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import Header from '../components/Header';


const RestaurantDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'menu'
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchMenu();

    const orderSubscription = supabase
      .channel('kitchen-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => supabase.removeChannel(orderSubscription);
  }, []);

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  async function fetchMenu() {
    const { data } = await supabase.from('menu_items').select('*').order('name', { ascending: true });
    setMenuItems(data || []);
  }

  // --- IMAGE UPLOAD LOGIC (Using your 'food-images' bucket) ---
  const handleImageUpload = async (event, itemId) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to your specific bucket
      let { error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('food-images')
        .getPublicUrl(filePath);

      // 3. Update the menu_items table
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ image_url: publicUrl })
        .eq('id', itemId);

      if (updateError) throw updateError;
      
      await fetchMenu();
      alert("Menu image updated!");
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const markAsReady = async (orderId) => {
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    await supabase.from('orders').update({ status: 'ready', pickup_pin: generatedPin }).eq('id', orderId);
    fetchOrders();
  };

  const updatePrice = async (itemId) => {
    await supabase.from('menu_items').update({ price: Number(newPrice) }).eq('id', itemId);
    setEditingId(null);
    fetchMenu();
  };

  if (loading) return <div className="p-10 text-center font-bold text-[#003366] animate-pulse">Opening Kitchen...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
    <Header userProfile={userProfile} />
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Nav */}
      <nav className="bg-white border-b px-6 py-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black text-[#003366] tracking-tighter">STRATH KITCHEN</h1>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('orders')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white shadow-sm text-[#003366]' : 'text-gray-400'}`}>Orders</button>
          <button onClick={() => setActiveTab('menu')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'menu' ? 'bg-white shadow-sm text-[#003366]' : 'text-gray-400'}`}>Menu</button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        {activeTab === 'orders' ? (
          /* ORDERS LIST */
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black bg-blue-50 text-[#003366] px-2 py-0.5 rounded uppercase">ORD-{order.id.toString().slice(-4)}</span>
                  </div>
                  <h3 className="font-bold text-slate-800">{order.items_summary || "Canteen Order"}</h3>
                  <p className="text-sm font-medium text-[#E77206]">KES {order.total_amount}</p>
                </div>
                {order.status === 'ready' ? (
                  <div className="bg-[#003366] text-white px-4 py-2 rounded-xl text-center">
                    <p className="text-[9px] font-bold opacity-70 uppercase">Pickup PIN</p>
                    <p className="text-xl font-black tracking-widest">{order.pickup_pin}</p>
                  </div>
                ) : (
                  <button onClick={() => markAsReady(order.id)} className="bg-[#003366] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-900 transition-all">Ready</button>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* MENU MANAGEMENT */
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <div className="divide-y divide-gray-50">
              {menuItems.map((item) => (
                <div key={item.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative group w-20 h-20">
                      <img src={item.image_url} className="w-full h-full rounded-2xl object-cover border border-gray-100" alt="" />
                      <label className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                        <span className="text-[9px] text-white font-black uppercase">{uploading ? '...' : 'Change'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, item.id)} disabled={uploading} />
                      </label>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{item.name}</h4>
                      <span className={`text-[10px] font-bold uppercase ${item.is_available ? 'text-green-500' : 'text-red-400'}`}>
                        {item.is_available ? 'In Stock' : 'Sold Out'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input type="number" className="w-20 p-2 border rounded-lg text-sm font-bold outline-none border-[#E77206]" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                        <button onClick={() => updatePrice(item.id)} className="bg-green-500 text-white px-3 py-2 rounded-lg text-xs font-bold">OK</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="font-black text-[#003366] text-lg">KES {item.price}</span>
                        <button onClick={() => { setEditingId(item.id); setNewPrice(item.price); }} className="text-[#E77206] text-[10px] font-black uppercase tracking-tighter">Update Price</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
    </div>
  );
};

export default RestaurantDashboard;