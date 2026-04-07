import React from 'react';
import { useNavigate } from 'react-router-dom';

const Checkout = ({ cart, removeFromCart }) => {
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return alert("Your cart is empty!");

    const { data: { user } } = await supabase.auth.getUser();
    
    // Create a summary string for the kitchen (e.g., "1x Burger, 2x Fries")
    const summary = cart.map(item => item.name).join(', ');

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id: user.id,
          items_summary: summary,
          total_amount: total,
          status: 'pending', // Kitchen sees this immediately
        }
      ])
      .select();

    if (!error) {
      alert("Order placed! Redirecting to tracking...");
      navigate('/tracking');
    } else {
      alert("Error placing order: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-black text-[#003366] mb-6">Checkout</h1>
      
      <div className="space-y-4 mb-10">
        {cart.map((item, index) => (
          <div key={index} className="flex justify-between border-b pb-2">
            <span>{item.name}</span>
            <span className="font-bold">KES {item.price}</span>
          </div>
        ))}
        <div className="flex justify-between text-xl font-black pt-4">
          <span>Total</span>
          <span className="text-[#E77206]">KES {total}</span>
        </div>
      </div>

      <button 
        onClick={handlePlaceOrder}
        className="w-full bg-[#003366] text-white py-4 rounded-2xl font-bold text-lg shadow-lg"
      >
        Pay & Place Order
      </button>
    </div>
  );
};

export default Checkout;