import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';

const CartSidebar = ({ isOpen, onClose }) => {
  const { cart, totalPrice, increaseQuantity, decreaseQuantity, formatRupiah } = useContext(CartContext);

  const handleCheckout = () => {
     if (cart.length === 0) return;

    const phoneNumber = '6281234567890'; // Ganti dengan nomor WhatsApp pemilik warung
    
    // Format daftar item: "- 2x Indomie Goreng Original (Rp 7.000)"
    const itemList = cart.map(item => {
      const itemTotal = item.price * item.quantity;
      return `- ${item.quantity}x ${item.name} (${formatRupiah(itemTotal)})`;
    }).join('\n');

    // Rangkai pesan lengkap
    const message = `Halo, saya mau pesan barang dari warung:\n\n${itemList}\n\n*Total Belanja: ${formatRupiah(totalPrice)}*\n\nMohon segera diproses ya. Terima kasih!`;

    // Encode dan buka WhatsApp
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <>
      {/* Overlay Background */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white border-l-4 border-black z-50 transform transition-transform duration-300 ease-in-out shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b-4 border-black bg-neo-bg">
                <h2 className="text-2xl font-black text-black uppercase">Keranjang</h2>
                <button 
                  onClick={onClose}
                  className="text-2xl font-black hover:text-red-600 transition-colors"
                >
                  X
                </button>
            </div>

            {/* Cart Items List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <span className="text-4xl">🛒</span>
                    <p className="font-bold mt-2">Keranjang masih kosong</p>
                </div>
              ) : (
                cart.map((item) => (
                    <div key={item.id} className="flex flex-col bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-sm line-clamp-2">{item.name}</h4>
                                <p className="text-xs text-gray-600">{formatRupiah(item.price)} / {item.unit}</p>
                            </div>
                            <p className="font-black text-sm">{formatRupiah(item.price * item.quantity)}</p>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-end gap-3 mt-1">
                             <button 
                                onClick={() => decreaseQuantity(item.id)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 border-2 border-black font-black hover:bg-red-200 active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                             >
                                -
                             </button>
                             <span className="font-bold w-4 text-center">{item.quantity}</span>
                             <button 
                                onClick={() => increaseQuantity(item.id)}
                                className="w-8 h-8 flex items-center justify-center bg-neo-teal border-2 border-black font-black hover:bg-teal-400 active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                             >
                                +
                             </button>
                        </div>
                    </div>
                ))
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t-4 border-black bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-black text-2xl">{formatRupiah(totalPrice)}</span>
                </div>
                
                <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className={`w-full py-3 font-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2
                    ${cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-neo-purple hover:bg-purple-800'}`}
                >
                    Checkout (WhatsApp)
                </button>
            </div>

        </div>
      </div>
    </>
  );
};

export default CartSidebar;
