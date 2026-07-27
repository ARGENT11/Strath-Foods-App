import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';
import { Search, ShoppingCart, Plus, Minus, Utensils, Sparkles, Clock, Check, AlertCircle } from 'lucide-react';
import Toast from '../components/Toast';

const Home = ({ addToCart, removeFromCart, cart = [], cartCount = 0, userProfile }) => {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('menu_items').select('*');
      if (error) throw error;
      setMenu(data || []);
    } catch (error) {
      console.error('Connection Error:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Derive item count in cart by item id
  const getItemQuantityInCart = (itemId) => {
    if (!cart) return 0;
    return cart.filter((i) => (i.id || i.item_id) === itemId).length;
  };

  const categories = ['All', 'Fast Food', 'Beverages', 'Snacks', 'Meals'];

  const filteredMenu = menu.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.restaurant_name && item.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedCategory === 'All') return matchesSearch;
    return matchesSearch && item.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const handleAddItem = (item) => {
    addToCart(item);
    setToast({ type: 'success', message: `Added "${item.name}" to cart!` });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-36">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <Header userProfile={userProfile} />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#003366] via-[#0A2540] to-slate-900 text-white pt-10 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E77206]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#E77206] text-xs font-bold mb-4 backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            <span>Strathmore Canteen Direct Delivery</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Hungry on Campus? <br />
            <span className="text-[#E77206]">Fast Food Delivered to You.</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mt-3 leading-relaxed">
            Order from Strathmore main canteen, Student Center, or specialized stands. Track your order live right to your location!
          </p>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        
        {/* Search & Categories Bar */}
        <div className="glass-card rounded-3xl p-4 sm:p-6 shadow-xl mb-8 border border-slate-200/80">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-100/80 border border-slate-200 outline-none focus:bg-white focus:border-[#E77206] focus:ring-2 focus:ring-[#E77206]/20 transition-all text-sm" 
                placeholder="Search food, drinks, canteens..." 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#003366] text-white shadow-md shadow-[#003366]/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl h-80 animate-pulse border border-slate-100 shadow-sm p-4 flex flex-col justify-between">
                <div className="w-full h-44 bg-slate-200 rounded-2xl"></div>
                <div className="space-y-2 mt-4">
                  <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/70 shadow-sm my-8">
            <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No menu items found</h3>
            <p className="text-slate-400 text-xs mt-1">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredMenu.map((item) => {
              const itemId = item.id || item.item_id;
              const quantityInCart = getItemQuantityInCart(itemId);
              const isAvailable = item.availability ?? item.is_available ?? true;

              return (
                <div 
                  key={itemId} 
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative"
                >
                  {/* Food Image / Visual */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400">
                        <Utensils className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Strath Food</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md backdrop-blur-md ${
                        isAvailable ? 'bg-emerald-500/90' : 'bg-rose-500/90'
                      }`}>
                        {isAvailable ? 'Available' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-grow justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg font-bold text-[#003366] group-hover:text-[#E77206] transition-colors leading-tight">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
                        {item.restaurant_name || "Main Canteen"}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold">Price</span>
                        <span className="text-xl font-black text-[#003366]">KES {item.price}</span>
                      </div>

                      {/* Action Button / Cart Quantity */}
                      {isAvailable ? (
                        quantityInCart > 0 ? (
                          <div className="flex items-center gap-2 bg-[#003366]/5 border border-[#003366]/20 p-1.5 rounded-2xl">
                            <button
                              onClick={() => {
                                const indexToRemove = cart.findIndex((i) => (i.id || i.item_id) === itemId);
                                if (indexToRemove !== -1 && removeFromCart) {
                                  removeFromCart(indexToRemove);
                                }
                              }}
                              className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#003366] font-bold flex items-center justify-center hover:bg-slate-100 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-extrabold text-[#003366] text-sm px-1.5">{quantityInCart}</span>
                            <button
                              onClick={() => handleAddItem(item)}
                              className="w-8 h-8 rounded-xl bg-[#003366] text-white font-bold flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleAddItem(item)}
                            className="bg-gradient-to-r from-[#003366] to-slate-800 hover:from-slate-800 hover:to-[#003366] text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md shadow-[#003366]/20 flex items-center gap-2 active:scale-95 transition-all"
                          >
                            <Plus className="w-4 h-4 text-[#E77206]" />
                            <span>Add</span>
                          </button>
                        )
                      ) : (
                        <button disabled className="bg-slate-100 text-slate-400 px-4 py-2.5 rounded-2xl font-bold text-xs cursor-not-allowed">
                          Unavailable
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-xl pointer-events-auto">
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-gradient-to-r from-[#E77206] via-amber-600 to-[#E77206] text-white p-4 rounded-3xl font-bold shadow-2xl shadow-[#E77206]/40 border border-white/20 flex justify-between items-center hover:scale-[1.02] active:scale-95 transition-all animate-bounce-short"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white text-[#E77206] flex items-center justify-center font-black text-sm shadow-md">
                  {cartCount}
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-widest font-black text-amber-100">View Cart</p>
                  <p className="text-xs font-bold opacity-90">{cartCount} {cartCount === 1 ? 'item' : 'items'} selected</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-lg font-black tracking-tight">KES {cartTotal}</span>
                <span className="bg-white/20 px-3.5 py-1.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1 backdrop-blur-md">
                  Checkout →
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;