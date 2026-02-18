import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { supabase } from '../supabaseClient';

const CartSidebar = ({ isOpen, onClose }) => {
  const { cart, totalPrice, increaseQuantity, decreaseQuantity, clearCart, formatRupiah } = useContext(CartContext);
  const [namaPembeli, setNamaPembeli] = useState('');
  const [catatan, setCatatan] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Ambil Sendiri');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [address, setAddress] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!namaPembeli.trim()) { alert('Nama Pembeli wajib diisi!'); return; }
    if (deliveryMethod === 'Diantar' && !address.trim()) { alert('Alamat pengiriman wajib diisi!'); return; }

    setProcessing(true);

    const { data: trxData, error: trxError } = await supabase
      .from('transaksi')
      .insert([{
        nama_pembeli: namaPembeli,
        catatan: catatan || null,
        total_harga: totalPrice,
        status: 'Menunggu',
        metode_pembayaran: paymentMethod,
        metode_pengiriman: deliveryMethod,
        alamat_pengiriman: deliveryMethod === 'Diantar' ? address : null
      }])
      .select('id')
      .single();

    if (trxError) {
      alert('Gagal membuat pesanan: ' + trxError.message);
      setProcessing(false);
      return;
    }

    const transaksiId = trxData.id;

    const details = cart.map(item => ({
      transaksi_id: transaksiId,
      produk_id: item.id,
      nama_produk: item.name,
      jumlah: item.quantity,
      harga_satuan: item.price
    }));

    const { error: detailError } = await supabase.from('detail_transaksi').insert(details);
    if (detailError) {
      alert('Gagal menyimpan detail: ' + detailError.message);
      setProcessing(false);
      return;
    }

    const phoneNumber = '6287874668656';
    const shortId = String(transaksiId).substring(0, 8).toUpperCase();
    
    const itemList = cart.map(item => {
      return `- ${item.quantity}x ${item.name} (${formatRupiah(item.price * item.quantity)})`;
    }).join('\n');

    const deliveryInfo = deliveryMethod === 'Diantar' ? `Diantar ke: ${address}` : 'Ambil Sendiri di Warung';
    const paymentInfo = paymentMethod === 'COD' ? 'Bayar Tunai (COD)' : 'QRIS / Non-Tunai';

    const message = `Halo, saya *${namaPembeli}*.\n\nNo. Order: *${shortId}*\n\n${itemList}\n\n*Total: ${formatRupiah(totalPrice)}*\n\nPengiriman: ${deliveryInfo}\nPembayaran: ${paymentInfo}\n${catatan ? `Catatan: ${catatan}` : ''}\n\nMohon diproses. Terima kasih!`;

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');

    clearCart();
    setNamaPembeli('');
    setCatatan('');
    setAddress('');
    setDeliveryMethod('Ambil Sendiri');
    setPaymentMethod('COD');
    setProcessing(false);
    onClose();
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white border-l-4 border-black z-50 transform transition-transform duration-300 shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
            
            <div className="flex justify-between items-center p-4 border-b-4 border-black bg-neo-bg">
                <h2 className="text-2xl font-black uppercase">Keranjang</h2>
                <button onClick={onClose} className="text-2xl font-black hover:text-red-600">X</button>
            </div>

            <div className="flex-1 overflow-y-auto">

              <div className="p-4 border-b-2 border-gray-200 space-y-2 bg-yellow-50">
                <input type="text" placeholder="Nama Pembeli *" value={namaPembeli} onChange={(e) => setNamaPembeli(e.target.value)} className="w-full p-2 border-2 border-black font-bold focus:outline-none text-sm" />
                <input type="text" placeholder="Catatan (opsional)" value={catatan} onChange={(e) => setCatatan(e.target.value)} className="w-full p-2 border-2 border-black font-bold focus:outline-none text-sm" />
              </div>

              <div className="p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                    <p className="font-bold text-lg">Keranjang Kosong</p>
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
                      <div className="flex items-center justify-end gap-3 mt-1">
                        <button onClick={() => decreaseQuantity(item.id)} className="w-8 h-8 flex items-center justify-center bg-gray-200 border-2 border-black font-black hover:bg-red-200 active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">-</button>
                        <span className="font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => increaseQuantity(item.id)} className="w-8 h-8 flex items-center justify-center bg-neo-teal border-2 border-black font-black hover:bg-teal-400 active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t-2 border-gray-200 space-y-4">
                  <div>
                    <label className="block font-black text-sm mb-2 uppercase">Pengiriman</label>
                    <div className="flex gap-2">
                      {['Ambil Sendiri', 'Diantar'].map(opt => (
                        <button key={opt} type="button" onClick={() => setDeliveryMethod(opt)}
                          className={`flex-1 py-2 font-bold text-sm border-2 border-black transition-all
                          ${deliveryMethod === opt ? 'bg-black text-white shadow-none' : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none'}`}
                        >{opt}</button>
                      ))}
                    </div>
                    {deliveryMethod === 'Diantar' && (
                      <textarea placeholder="Alamat lengkap *" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border-2 border-black font-bold focus:outline-none text-sm mt-2 h-16 resize-none" />
                    )}
                  </div>

                  <div>
                    <label className="block font-black text-sm mb-2 uppercase">Pembayaran</label>
                    <div className="flex gap-2">
                      {['COD', 'QRIS'].map(opt => (
                        <button key={opt} type="button" onClick={() => setPaymentMethod(opt)}
                          className={`flex-1 py-2 font-bold text-sm border-2 border-black transition-all
                          ${paymentMethod === opt ? 'bg-black text-white shadow-none' : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none'}`}
                        >{opt === 'COD' ? 'Tunai (COD)' : 'QRIS'}</button>
                      ))}
                    </div>
                    {paymentMethod === 'QRIS' && (
                      <div className="bg-blue-100 border-2 border-black p-2 mt-2 text-xs font-bold">
                        QRIS akan dikirim via WhatsApp setelah pesanan dikonfirmasi.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t-4 border-black bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-black text-2xl">{formatRupiah(totalPrice)}</span>
                </div>
                <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || processing}
                    className={`w-full py-3 font-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all
                    ${cart.length === 0 || processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-neo-purple hover:bg-purple-800'}`}
                >
                    {processing ? 'Memproses...' : 'Pesan via WhatsApp'}
                </button>
            </div>
        </div>
      </div>
    </>
  );
};

export default CartSidebar;
