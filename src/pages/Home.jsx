import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'

const Home = ({ addToCart, cartCount }) => {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredMenu = menu.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())

  );


  
const [userRole, setUserRole] = useState(null);

useEffect(() => {
  const getUserProfile = async (user) => {
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setUserRole(data?.role);
    }
  };

  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    if (session) getUserProfile(session.user);
    setLoading(false);
  });
}, []);



  return (
    <div className="bg-white text-slate-900 font-sans antix,laliased min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white flex justify-between items-center px-6 py-4 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-[#003366] font-bold uppercase tracking-tight">Strath Fast Foods</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
          <img src="https://ui-avatars.com/api/?name=Student&background=003366&color=fff" alt="User" />
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-6xl mx-auto">
        {/* Search */}
        <div className="mb-10 max-w-md">
          <div className="bg-gray-50 rounded-2xl px-5 py-3 border border-gray-200 shadow-sm">
            <input className="bg-transparent outline-none w-full text-sm" placeholder="What are you craving?" type="text" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-gray-400 animate-pulse">Loading menu...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menu.map((item) => (
              <div key={item.item_id} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                {/* Image */}
                <div className="relative h-48 bg-slate-100">
                  {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase ${item.availability ? 'bg-green-500' : 'bg-red-500'}`}>
                    {item.availability ? 'Available' : 'Out of Stock'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-[#003366] mb-1">{item.name}</h3>
                  <p className="text-gray-400 text-xs mb-4 uppercase tracking-widest font-semibold">{item.restaurant_name}</p>
                  
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-lg font-black text-[#003366]">KES {item.price}</span>
                    <button 
                      onClick={() => addToCart(item)}
                      disabled={!item.availability}
                      className="bg-[#003366] text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-blue-900 active:scale-90 transition-all disabled:bg-gray-200"
                    >
                      <span className="text-2xl leading-none">+</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating View Cart - Appears when items are added */}
      {cartCount > 0 && (
  <div className="fixed bottom-10 left-0 w-full px-6 z-50 flex justify-center">
    <button 
      onClick={() => navigate('/checkout')}
      className="w-full max-w-md bg-[#E77206] text-white py-4 rounded-2xl font-bold shadow-xl flex justify-between px-8 items-center transition-transform active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center gap-3">
        <span className="bg-white text-[#E77206] w-6 h-6 rounded-full text-xs flex items-center justify-center font-black">
          {cartCount}
        </span>
        <span className="uppercase tracking-wider text-sm">View Cart</span>
      </div>
      <span className="font-bold">Checkout →</span>
    </button>
  </div>
)}
    </div>
  );
};

export default Home;