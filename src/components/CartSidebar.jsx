import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import {
  Banknote,
  CreditCard,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Truck,
  X,
} from 'lucide-react';

const CartSidebar = ({ isOpen, onClose }) => {
  const { cart, totalPrice, increaseQuantity, decreaseQuantity, clearCart, formatRupiah } = useContext(CartContext);
  const [namaPembeli, setNamaPembeli] = useState('');
  const [catatan, setCatatan] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Ambil Sendiri');
  const [metodePembayaran, setMetodePembayaran] = useState('Tunai');
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
        metode_pembayaran: metodePembayaran,
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

    const ringkasanBarang = cart.map(item => `${item.name} x${item.quantity}`).join(', ');

    if (metodePembayaran === 'Kasbon') {
      const { error: kasbonError } = await supabase.from('kasbon').insert([{
        nama_pelanggan: namaPembeli,
        keterangan: `Pesanan Online: ${ringkasanBarang}`,
        nominal: totalPrice,
        status: 'Belum Lunas',
        transaksi_id: transaksiId
      }]);
      if (kasbonError) {
        alert('Gagal menyimpan data paylater: ' + kasbonError.message);
        setProcessing(false);
        return;
      }
    }

    const phoneNumber = '6289501370501';
    const shortId = String(transaksiId).substring(0, 8).toUpperCase();
    
    const itemList = cart.map(item => {
      return `- ${item.quantity}x ${item.name} (${formatRupiah(item.price * item.quantity)})`;
    }).join('\n');

    const deliveryInfo = deliveryMethod === 'Diantar' ? `Diantar ke: ${address}` : 'Ambil Sendiri di Warung';
    const paymentInfoText = metodePembayaran === 'Tunai' ? 'Tunai / Bayar di Tempat' : 'Nontunai / QRIS';

    const message = `Halo, saya *${namaPembeli}*.\n\nNo. Order: *${shortId}*\n\n${itemList}\n\n*Total: ${formatRupiah(totalPrice)}*\n\nPengiriman: ${deliveryInfo}\n*Metode Pembayaran: ${paymentInfoText}*\n${catatan ? `Catatan: ${catatan}` : ''}\n\nMohon diproses. Terima kasih!`;

    // Clear cart and state first
    clearCart();
    setNamaPembeli('');
    setCatatan('');
    setAddress('');
    setDeliveryMethod('Ambil Sendiri');
    setMetodePembayaran('Tunai');
    setProcessing(false);
    onClose();

    // Redirect to WhatsApp using window.location.href to bypass pop-up blockers
    // Make sure the phoneNumber variable matches your actual WhatsApp number
    window.location.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <>
      {isOpen && (
        <div
          className="cart-sidebar-backdrop fixed inset-0 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`cart-sidebar fixed top-0 right-0 z-50 flex h-full w-full flex-col bg-white transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Keranjang belanja"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <header className="cart-sidebar-header flex items-center justify-between">
          <div>
            <h2>Keranjang</h2>
            <p>{cart.length} jenis barang</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cart-close-button"
            aria-label="Tutup keranjang"
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <span className="cart-empty-icon">
              <ShoppingBag size={28} strokeWidth={1.5} />
            </span>
            <h3>Keranjang masih kosong</h3>
            <p>Tambahkan produk yang Anda butuhkan, lalu pesan dari sini.</p>
            <button type="button" onClick={onClose} className="cart-continue-button">
              Lihat produk
            </button>
          </div>
        ) : (
          <>
            <div className="cart-sidebar-content">
              <section className="cart-customer-fields" aria-label="Informasi pemesan">
                <label>
                  <span>Nama pemesan <span aria-hidden="true">*</span></span>
                  <input
                    type="text"
                    placeholder="Masukkan nama Anda"
                    value={namaPembeli}
                    onChange={(e) => setNamaPembeli(e.target.value)}
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span>Catatan <span className="cart-optional">(opsional)</span></span>
                  <input
                    type="text"
                    placeholder="Contoh: jangan pakai kantong"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                  />
                </label>
              </section>

              <section className="cart-items" aria-label="Produk di keranjang">
                {cart.map((item) => (
                  <article key={item.id} className="cart-sidebar-item">
                    <div className="cart-item-details">
                      <h3>{item.name}</h3>
                      <p>{formatRupiah(item.price)} / {item.unit}</p>
                      <strong>{formatRupiah(item.price * item.quantity)}</strong>
                    </div>
                    <div className="cart-quantity-control" aria-label={`Jumlah ${item.name}`}>
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.id)}
                        aria-label={`Kurangi ${item.name}`}
                      >
                        <Minus size={15} />
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => increaseQuantity(item.id)}
                        aria-label={`Tambah ${item.name}`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </section>

              <section className="cart-checkout-options">
                <fieldset>
                  <legend>Metode pengiriman</legend>
                  <div className="cart-option-grid">
                    {[
                      { label: 'Ambil Sendiri', Icon: Store },
                      { label: 'Diantar', Icon: Truck },
                    ].map(({ label, Icon }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setDeliveryMethod(label)}
                        className={deliveryMethod === label ? 'is-selected' : ''}
                        aria-pressed={deliveryMethod === label}
                      >
                        <Icon size={17} strokeWidth={1.8} />
                        {label}
                      </button>
                    ))}
                  </div>
                  {deliveryMethod === 'Diantar' && (
                    <label className="cart-address-field">
                      <span>Alamat pengiriman <span aria-hidden="true">*</span></span>
                      <textarea
                        placeholder="Masukkan alamat lengkap"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                      />
                    </label>
                  )}
                </fieldset>

                <fieldset>
                  <legend>Metode pembayaran</legend>
                  <div className="cart-option-grid">
                    {[
                      { label: 'Tunai', Icon: Banknote },
                      { label: 'QRIS', Icon: CreditCard },
                    ].map(({ label, Icon }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setMetodePembayaran(label)}
                        className={metodePembayaran === label ? 'is-selected' : ''}
                        aria-pressed={metodePembayaran === label}
                      >
                        <Icon size={17} strokeWidth={1.8} />
                        {label === 'Tunai' ? 'Tunai di tempat' : 'Nontunai / QRIS'}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </section>
            </div>

            <footer className="cart-sidebar-footer">
              <div className="cart-total-row">
                <span>Total belanja</span>
                <strong>{formatRupiah(totalPrice)}</strong>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={processing}
                className="cart-checkout-button"
              >
                <MessageCircle size={18} />
                {processing ? 'Memproses pesanan...' : 'Pesan via WhatsApp'}
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;
