import React from 'react';
import { useNavigate } from 'react-router-dom';

const Tracking = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestOrder();

    // Subscribe to changes so the status updates automatically!
    const subscription = supabase
      .channel('my-order')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, fetchLatestOrder)
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  async function fetchLatestOrder() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    setOrder(data);
    setLoading(false);
  }

  if (loading) return <div className="p-10 text-center">Locating your meal...</div>;
  if (!order) return <div className="p-10 text-center">No active orders found.</div>;

  const steps = ['pending', 'ready', 'dispatched', 'completed'];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h1 className="text-center font-black text-[#003366] text-xl mb-8">Track Your Order</h1>

        {/* Visual Progress Bar */}
        <div className="flex justify-between mb-10 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-[#E77206] -translate-y-1/2 transition-all duration-500" 
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map((step, i) => (
            <div key={step} className={`relative z-10 w-4 h-4 rounded-full ${i <= currentStepIndex ? 'bg-[#E77206]' : 'bg-gray-200'}`}></div>
          ))}
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-400 uppercase text-[10px] font-black tracking-widest">Current Status</p>
          <h2 className="text-2xl font-bold text-slate-800 capitalize">{order.status}</h2>
          <p className="text-sm text-gray-400 mt-1">
            {order.status === 'pending' && "The kitchen is firing up the stove!"}
            {order.status === 'ready' && "Food is packed and waiting for a rider."}
            {order.status === 'dispatched' && "A rider is sprinting to your location!"}
            {order.status === 'completed' && "Enjoy your meal!"}
          </p>
        </div>

        {/* THE SECURITY PIN SECTION */}
        {order.status === 'dispatched' && (
          <div className="bg-orange-50 border-2 border-dashed border-[#E77206] p-6 rounded-2xl text-center">
            <p className="text-xs font-bold text-[#E77206] uppercase mb-2">Your Delivery PIN</p>
            <p className="text-4xl font-black text-[#003366] tracking-[0.5em]">{order.delivery_pin}</p>
            <p className="text-[10px] text-gray-500 mt-4 leading-tight">
              Give this code to the rider ONLY when <br/> you have your food in hand.
            </p>
          </div>
        )}
      </div>

      <button 
        onClick={() => window.location.href = '/'}
        className="mt-8 text-sm font-bold text-gray-400 hover:text-[#003366]"
      >
        Back to Menu
      </button>
    </div>
  );
};

export default Tracking;