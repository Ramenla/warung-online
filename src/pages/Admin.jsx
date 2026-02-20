import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { handleSupabaseError } from '../utils/errorHandler';

// ========== CUSTOM CONFIRM MODAL ==========
function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-[95%] max-w-sm border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
        <h3 className="font-black text-xl uppercase mb-2">{title || 'Konfirmasi'}</h3>
        <p className="font-bold text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 bg-gray-200 py-2.5 font-bold border-4 border-black shadow-[3px_3px_0_0_black] hover:translate-y-1 hover:shadow-none transition-all">Batal</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-2.5 font-black border-4 border-black shadow-[3px_3px_0_0_black] hover:translate-y-1 hover:shadow-none transition-all">Yakin</button>
        </div>
      </div>
    </div>
  );
}

function AlertModal({ open, message, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#ffde59] w-[95%] max-w-sm border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
        <p className="font-bold text-sm mb-6">{message}</p>
        <button onClick={onClose} className="w-full bg-black text-white py-2.5 font-black border-4 border-black shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] hover:translate-y-1 hover:shadow-none transition-all">OK</button>
      </div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  // Custom modals
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [alertState, setAlertState] = useState({ open: false, message: '' });

  const showConfirm = (title, message) => {
    return new Promise((resolve) => {
      setConfirmState({ open: true, title, message, onConfirm: () => { setConfirmState({ open: false }); resolve(true); } });
      // onCancel handled by the modal's Batal button
    });
  };
  const closeConfirm = () => { setConfirmState({ open: false }); };
  const showAlert = (message) => { setAlertState({ open: true, message }); };
  const closeAlert = () => { setAlertState({ open: false, message: '' }); };

  const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  // ========== ALL STATE ==========
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [orders, setOrders] = useState([]);
  const [arusKas, setArusKas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [formData, setFormData] = useState({ nama: '', kategori: '', satuan: '', harga: '', stok: 0, file: null });
  const [uploading, setUploading] = useState(false);
  const [orderDetails, setOrderDetails] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ keterangan: '', nominal: '' });
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // ========== KASBON STATE ==========
  const [kasbon, setKasbon] = useState([]);
  const [showAddKasbonModal, setShowAddKasbonModal] = useState(false);
  const [addKasbonData, setAddKasbonData] = useState({ id: null, nama: '', nominal: '', keterangan_tambahan: '' });

  // ========== FILTER STATE ==========
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);

  // ========== POS STATE ==========
  const [posCart, setPosCart] = useState([]);
  const [posSearch, setPosSearch] = useState('');
  const [posSelectedCategory, setPosSelectedCategory] = useState('Semua');
  const [uangTunai, setUangTunai] = useState('');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showPosKasbonPrompt, setShowPosKasbonPrompt] = useState(false);
  const [posKasbonName, setPosKasbonName] = useState('');

  // ========== FETCH ==========
  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => { setLoading(true); await Promise.all([fetchProducts(), fetchCategories(), fetchUnits(), fetchOrders(), fetchArusKas(), fetchKasbon()]); setLoading(false); };
  const fetchProducts = async () => { const { data, error } = await supabase.from('produk').select('*').order('id', { ascending: false }); if (error) handleSupabaseError(error); setProducts(data || []); };
  const fetchCategories = async () => { const { data, error } = await supabase.from('kategori').select('*').order('nama'); if (error) handleSupabaseError(error); setCategories(data || []); };
  const fetchUnits = async () => { const { data, error } = await supabase.from('satuan').select('*').order('nama'); if (error) handleSupabaseError(error); setUnits(data || []); };
  const fetchOrders = async () => { const { data, error } = await supabase.from('transaksi').select('*').order('created_at', { ascending: false }); if (error) handleSupabaseError(error); setOrders(data || []); };
  const fetchArusKas = async () => { const { data, error } = await supabase.from('arus_kas').select('*').order('created_at', { ascending: false }); if (error) handleSupabaseError(error); setArusKas(data || []); };
  const fetchKasbon = async () => { const { data, error } = await supabase.from('kasbon').select('*').order('created_at', { ascending: false }); if (error) handleSupabaseError(error); setKasbon(data || []); };

  // ========== PRODUCT HANDLERS ==========
  const handleInputChange = (e) => { const { name, value, files } = e.target; if (name === 'file') setFormData({ ...formData, file: files[0] }); else setFormData({ ...formData, [name]: value }); };
  const openAddModal = () => { setIsEditing(false); setCurrentProductId(null); setFormData({ nama: '', kategori: categories[0]?.nama || '', satuan: units[0]?.nama || '', harga: '', stok: 10, file: null }); setIsModalOpen(true); };
  const openEditModal = (p) => { setIsEditing(true); setCurrentProductId(p.id); setFormData({ nama: p.nama, kategori: p.kategori, satuan: p.satuan, harga: p.harga, stok: p.stok || 0, file: null }); setIsModalOpen(true); };

  const handleDelete = async (id) => {
    const ok = await showConfirm('Hapus Produk', 'Yakin ingin menghapus produk ini?');
    if (ok) { await supabase.from('produk').delete().eq('id', id); fetchProducts(); setSelectedProductIds(prev => prev.filter(x => x !== id)); }
  };
  const updateStock = async (id, cur, change) => { await supabase.from('produk').update({ stok: Math.max(0, cur + change) }).eq('id', id); fetchProducts(); };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    const ok = await showConfirm('Hapus Massal', `Yakin hapus ${selectedProductIds.length} produk terpilih?`);
    if (ok) {
      const { error } = await supabase.from('produk').delete().in('id', selectedProductIds);
      if (error) showAlert('Gagal hapus massal: ' + error.message);
      else { setSelectedProductIds([]); fetchProducts(); }
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) setSelectedProductIds([]);
    else setSelectedProductIds(filteredProducts.map(p => p.id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama || !formData.harga) { showAlert('Nama dan Harga wajib diisi!'); return; }
    setUploading(true);
    let imageUrl = null;
    if (formData.file) {
      const path = `${Date.now()}.${formData.file.name.split('.').pop()}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, formData.file);
      if (upErr) { showAlert('Upload gagal: ' + upErr.message); setUploading(false); return; }
      imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
    }
    const payload = { nama: formData.nama, kategori: formData.kategori, satuan: formData.satuan, harga: parseInt(formData.harga), stok: parseInt(formData.stok) };
    if (imageUrl) payload.image_url = imageUrl;
    const { error } = isEditing ? await supabase.from('produk').update(payload).eq('id', currentProductId) : await supabase.from('produk').insert([payload]);
    if (error) showAlert('Gagal: ' + error.message); else { setIsModalOpen(false); fetchProducts(); }
    setUploading(false);
  };

  const handleAddCategory = async () => { if (!newCategory.trim()) return; await supabase.from('kategori').insert([{ nama: newCategory }]); setNewCategory(''); fetchCategories(); };
  const handleDeleteCategory = async (id) => {
    const ok = await showConfirm('Hapus Kategori', 'Yakin hapus kategori ini?');
    if (ok) { await supabase.from('kategori').delete().eq('id', id); fetchCategories(); }
  };
  const handleAddUnit = async () => { if (!newUnit.trim()) return; await supabase.from('satuan').insert([{ nama: newUnit }]); setNewUnit(''); fetchUnits(); };
  const handleDeleteUnit = async (id) => {
    const ok = await showConfirm('Hapus Satuan', 'Yakin hapus satuan ini?');
    if (ok) { await supabase.from('satuan').delete().eq('id', id); fetchUnits(); }
  };

  // ========== ORDER HANDLERS ==========
  const toggleOrderDetail = async (orderId) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); return; }
    if (!orderDetails[orderId]) { const { data } = await supabase.from('detail_transaksi').select('*').eq('transaksi_id', orderId); setOrderDetails(prev => ({ ...prev, [orderId]: data || [] })); }
    setExpandedOrder(orderId);
  };
  const completeOrder = async (order) => {
    const ok = await showConfirm('Selesaikan Pesanan', 'Selesaikan pesanan ini? Stok akan dikurangi.');
    if (!ok) return;
    let details = orderDetails[order.id];
    if (!details) { const { data } = await supabase.from('detail_transaksi').select('*').eq('transaksi_id', order.id); details = data || []; }
    for (const item of details) { const p = products.find(x => x.id === item.produk_id); if (p) await supabase.from('produk').update({ stok: Math.max(0, (p.stok || 0) - item.jumlah) }).eq('id', item.produk_id); }
    await supabase.from('transaksi').update({ status: 'Selesai' }).eq('id', order.id);
    await supabase.from('arus_kas').insert([{ tipe: 'Pemasukan', keterangan: `Order ${String(order.id).substring(0, 8).toUpperCase()}`, nominal: order.total_harga }]);
    fetchAll();
  };
  const cancelOrder = async (id) => {
    const ok = await showConfirm('Batalkan Pesanan', 'Yakin batalkan pesanan ini?');
    if (ok) { await supabase.from('transaksi').update({ status: 'Batal' }).eq('id', id); fetchOrders(); }
  };
  const deleteOrder = async (id) => {
    const ok = await showConfirm('Hapus Riwayat', 'Hapus riwayat pesanan ini secara permanen?');
    if (ok) { await supabase.from('transaksi').delete().eq('id', id); fetchOrders(); }
  };

  // ========== EXPENSE ==========
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.keterangan || !expenseForm.nominal) return;
    await supabase.from('arus_kas').insert([{ tipe: 'Pengeluaran', keterangan: expenseForm.keterangan, nominal: parseInt(expenseForm.nominal) }]);
    setShowExpenseModal(false); setExpenseForm({ keterangan: '', nominal: '' }); fetchArusKas();
  };

  // ========== KASBON HANDLERS ==========
  const handleLunasKasbon = async (item) => {
    const ok = await showConfirm('Terima Pembayaran', `Terima pembayaran ${formatRupiah(item.nominal)} dari ${item.nama_pelanggan}?`);
    if (!ok) return;

    // 1. Update Kasbon
    await supabase.from('kasbon').update({ status: 'Lunas', tanggal_lunas: new Date().toISOString() }).eq('id', item.id);
    
    // 2. Insert Pemasukan Arus Kas
    await supabase.from('arus_kas').insert([{ 
      tipe: 'Pemasukan', 
      keterangan: `Pelunasan Kasbon - ${item.nama_pelanggan}`, 
      nominal: item.nominal 
    }]);

    // 3. Update Transaksi record (opsional, jika terkait transaksi online/offline)
    if (item.transaksi_id) {
      await supabase.from('transaksi').update({
        metode_pembayaran: 'Tunai (Kasbon Lunas)'
      }).eq('id', item.transaksi_id);
    }
    
    fetchKasbon();
    fetchArusKas();
    fetchOrders();
    showAlert('Kasbon berhasil ditandai Lunas dan masuk ke Arus Kas!');
  };

  const handleDeleteKasbon = async (id) => {
    const ok = await showConfirm('Hapus Kasbon', 'Yakin ingin menghapus catatan kasbon ini? Data akan hilang permanen.');
    if (ok) {
      const { error } = await supabase.from('kasbon').delete().eq('id', id);
      if (error) {
        handleSupabaseError(error);
        showAlert('Gagal menghapus kasbon: ' + error.message);
      } else {
        fetchKasbon();
        showAlert('Catatan Kasbon berhasil dihapus.');
      }
    }
  };

  const submitAddKasbonAmount = async (e) => {
    e.preventDefault();
    if (!addKasbonData.nominal || addKasbonData.nominal <= 0) return;
    
    setIsCheckoutLoading(true);
    try {
      const kas = kasbon.find(k => k.id === addKasbonData.id);
      if (!kas) throw new Error("Kasbon tidak ditemukan");
      
      const newTotal = parseInt(kas.nominal) + parseInt(addKasbonData.nominal);
      const newKet = kas.keterangan + '\n' + `+ ${formatRupiah(parseInt(addKasbonData.nominal))} (${addKasbonData.keterangan_tambahan || 'Tanpa keterangan'})`;
      
      const { error } = await supabase.from('kasbon').update({
        nominal: newTotal,
        keterangan: newKet
      }).eq('id', addKasbonData.id);
      
      if (error) throw error;
      
      showAlert(`Berhasil menambahkan kasbon untuk ${addKasbonData.nama}. Total: ${formatRupiah(newTotal)}`);
      setShowAddKasbonModal(false);
      fetchKasbon();
    } catch (error) {
       console.error(error);
       handleSupabaseError(error);
       showAlert('Terjadi kesalahan: ' + error.message);
    } finally {
       setIsCheckoutLoading(false);
    }
  };

  // ========== EXPORT EXCEL/CSV ==========
  const exportToCSV = (data, filename) => {
    if (data.length === 0) { showAlert('Tidak ada data untuk diekspor!'); return; }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')).join('\n');
    
    const csvContent = headers + '\n' + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // ========== POS HANDLERS ==========
  const posCategories = ['Semua', ...new Set(products.map(p => p.kategori))];
  const posFilteredProducts = products.filter(p => {
    const searchMatch = p.nama.toLowerCase().includes(posSearch.toLowerCase());
    const categoryMatch = posSelectedCategory === 'Semua' || p.kategori === posSelectedCategory;
    return searchMatch && categoryMatch;
  });
  const posTotal = posCart.reduce((s, item) => s + (item.harga * item.qty), 0);
  const kembalian = parseInt(uangTunai || 0) - posTotal;

  const handlePosAddToCart = (product) => {
    if ((product.stok || 0) <= 0) return;
    setPosCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stok) return prev; // Cannot add more than stock
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updatePosQty = (id, delta) => {
    setPosCart(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQty = item.qty + delta;
        if (newQty <= 0) return null; // Marked for removal
        if (newQty > (product?.stok || 0)) return item; // Cannot exceed stock
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const handlePosCheckout = async () => {
    if (posCart.length === 0) { showAlert('Keranjang kosong!'); return; }
    if (posTotal > 0 && parseInt(uangTunai || 0) < posTotal) { showAlert('Uang tunai kurang dari total belanja!'); return; }

    setIsCheckoutLoading(true);
    try {
      // 1. Insert Transaksi
      const { data: trxData, error: trxError } = await supabase.from('transaksi').insert([{
        nama_pembeli: 'Pelanggan Offline',
        status: 'Selesai',
        metode_pembayaran: 'Tunai',
        total_harga: posTotal,
        metode_pengiriman: 'Ambil Sendiri',
        catatan: 'Transaksi Kasir POS'
      }]).select();
      if (trxError) throw trxError;
      const newTrxId = trxData[0].id;

      // 2. Insert Detail Transaksi
      const detailsPayload = posCart.map(item => ({
        transaksi_id: newTrxId,
        produk_id: item.id,
        nama_produk: item.nama,
        jumlah: item.qty,
        harga_satuan: item.harga
      }));
      const { error: detailsError } = await supabase.from('detail_transaksi').insert(detailsPayload);
      if (detailsError) throw detailsError;

      // 3. Insert Arus Kas
      const { error: kasError } = await supabase.from('arus_kas').insert([{
        tipe: 'Pemasukan',
        keterangan: `Penjualan Offline #${String(newTrxId).substring(0, 8).toUpperCase()}`,
        nominal: posTotal
      }]);
      if (kasError) throw kasError;

      // 4. Update Stok
      for (const item of posCart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await supabase.from('produk').update({ stok: Math.max(0, (product.stok || 0) - item.qty) }).eq('id', product.id);
        }
      }

      showAlert('Transaksi Offline Berhasil Disimpan!');
      setPosCart([]);
      setUangTunai('');
      setPosSearch('');
      fetchAll();

    } catch (error) {
      console.error(error);
      handleSupabaseError(error);
      showAlert('Terjadi kesalahan saat memproses checkout: ' + error.message);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handlePosKasbon = async (e) => {
    e.preventDefault();
    if (!posKasbonName.trim()) return;
    setIsCheckoutLoading(true);
    
    try {
      const ringkasanBarang = posCart.map(item => `${item.nama} x${item.qty}`).join(', ');
      
      // 1. Insert Transaksi
      const { data: trxData, error: trxError } = await supabase.from('transaksi').insert([{
        nama_pembeli: posKasbonName,
        status: 'Selesai',
        metode_pembayaran: 'Kasbon',
        total_harga: posTotal,
        metode_pengiriman: 'Ambil Sendiri',
        catatan: 'Transaksi Kasir POS (Kasbon)'
      }]).select();
      if (trxError) throw trxError;
      const newTrxId = trxData[0].id;

      // 2. Insert Detail Transaksi
      const detailsPayload = posCart.map(item => ({
        transaksi_id: newTrxId,
        produk_id: item.id,
        nama_produk: item.nama,
        jumlah: item.qty,
        harga_satuan: item.harga
      }));
      await supabase.from('detail_transaksi').insert(detailsPayload);

      // 3. Update Stok
      for (const item of posCart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await supabase.from('produk').update({ stok: Math.max(0, (product.stok || 0) - item.qty) }).eq('id', product.id);
        }
      }
      
      // 4. Insert Kasbon (Tanpa Arus Kas)
      await supabase.from('kasbon').insert([{
        nama_pelanggan: posKasbonName,
        keterangan: `Belanja Offline: ${ringkasanBarang}`,
        nominal: posTotal,
        status: 'Belum Lunas',
        transaksi_id: newTrxId
      }]);

      showAlert('Transaksi Kasbon Offline Berhasil Dicatat!');
      setPosCart([]);
      setUangTunai('');
      setPosSearch('');
      setShowPosKasbonPrompt(false);
      setPosKasbonName('');
      fetchAll();

    } catch (error) {
      console.error(error);
      handleSupabaseError(error);
      showAlert('Terjadi kesalahan kasbon: ' + error.message);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // ========== COMPUTED & FILTERING ==========
  // Filter for dashboard
  const filteredArusKas = arusKas.filter(a => {
    const d = new Date(a.created_at);
    return d.getMonth() + 1 === parseInt(filterMonth) && d.getFullYear() === parseInt(filterYear);
  });
  const filteredTransaksi = orders.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() + 1 === parseInt(filterMonth) && d.getFullYear() === parseInt(filterYear);
  });

  const totalPemasukan = filteredArusKas.filter(a => a.tipe === 'Pemasukan').reduce((s, a) => s + a.nominal, 0);
  const totalPengeluaran = filteredArusKas.filter(a => a.tipe === 'Pengeluaran').reduce((s, a) => s + a.nominal, 0);
  const saldoBersih = totalPemasukan - totalPengeluaran;
  
  // Also count total completed orders in selected month
  const completedOrders = filteredTransaksi.filter(o => o.status === 'Selesai').length;
  
  const lowStockProducts = products.filter(p => (p.stok || 0) < 5).sort((a, b) => (a.stok || 0) - (b.stok || 0)).slice(0, 5);
  const filteredProducts = products.filter(p => p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || (p.kategori && p.kategori.toLowerCase().includes(searchQuery.toLowerCase())));
  const maxFinancial = Math.max(totalPemasukan, totalPengeluaran, 1);

  const navItems = [
    { id: 'dashboard', label: 'Dasbor Utama', short: 'D' },
    { id: 'kasir', label: 'Mesin Kasir', short: 'M' },
    { id: 'produk', label: 'Daftar Produk', short: 'P' },
    { id: 'pesanan', label: 'Pesanan Masuk', short: 'O' },
    { id: 'bukukas', label: 'Buku Kas', short: 'K' },
    { id: 'kasbon', label: 'Buku Kasbon', short: 'B' }
  ];

  const handleNavClick = (id) => { setActiveView(id); setIsSidebarOpen(false); };

  return (
    <div className="min-h-screen bg-neo-bg font-sans text-black flex">

      {/* Custom Modals */}
      <ConfirmModal open={confirmState.open} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={closeConfirm} />
      <AlertModal open={alertState.open} message={alertState.message} onClose={closeAlert} />

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ====== SIDEBAR (WHITE) ====== */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-50 md:z-auto
        bg-white text-black border-r-4 border-black
        flex flex-col flex-shrink-0
        transition-all duration-300 ease-in-out
        ${isSidebarMinimized ? 'md:w-16' : 'md:w-60'}
        w-64
        ${isSidebarOpen ? 'translate-x-0 shadow-[8px_0px_0px_0px_rgba(0,0,0,1)]' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b-4 border-black">
          {!isSidebarMinimized && (
            <h1 className="font-black text-lg uppercase tracking-tight truncate">Admin Panel</h1>
          )}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden font-black text-xl hover:text-red-600 ml-auto">X</button>
        </div>

        <nav className="flex-1 flex flex-col py-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => handleNavClick(item.id)}
              className={`text-left px-4 py-3 font-bold text-sm border-b border-gray-200 transition-all
              ${activeView === item.id
                ? 'bg-black text-white'
                : 'hover:bg-gray-100'
              }
              ${isSidebarMinimized ? 'md:text-center md:px-2' : ''}
              `}
              title={isSidebarMinimized ? item.label : ''}
            >
              <span className="hidden md:inline">{isSidebarMinimized ? item.short : item.label}</span>
              <span className="md:hidden">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t-4 border-black p-3 space-y-2">
          <button onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
            className="hidden md:flex w-full items-center justify-center bg-gray-100 py-2 font-black text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition-all"
          >
            {isSidebarMinimized ? '>' : '<'}
          </button>
          {!isSidebarMinimized && (
            <button onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition-all text-sm"
            >Keluar</button>
          )}
          {isSidebarMinimized && (
            <button onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 font-bold border-2 border-black text-xs"
              title="Keluar"
            >X</button>
          )}
        </div>
      </aside>

      {/* ====== MAIN CONTENT ====== */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* Mobile Topbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-white border-b-4 border-black px-4 py-3 md:hidden shadow-md">
          <button onClick={() => setIsSidebarOpen(true)} className="font-black text-2xl border-2 border-black bg-gray-100 w-10 h-10 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5">
            &#9776;
          </button>
          <h2 className="font-black text-base uppercase truncate">{navItems.find(n => n.id === activeView)?.label}</h2>
          <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1.5 font-bold border-2 border-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Keluar</button>
        </div>

        <div className="p-4 md:p-8 space-y-6 pb-20">
          {loading && <div className="p-10 text-center font-black animate-pulse text-xl">Memuat data...</div>}

          {/* =============== DASHBOARD =============== */}
          {!loading && activeView === 'dashboard' && (
            <>
              {/* Filter Bulan/Tahun */}
              <div className="flex flex-wrap gap-4 mb-4">
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 border-4 border-black font-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white cursor-pointer uppercase text-sm">
                  {Array.from({length: 12}, (_, i) => (<option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('id-ID', {month: 'long'})}</option>))}
                </select>
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="px-3 py-2 border-4 border-black font-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white cursor-pointer uppercase text-sm">
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="Total Pendapatan" value={formatRupiah(totalPemasukan)} color="bg-green-500" text="text-white" small />
                <StatCard title="Total Pengeluaran" value={formatRupiah(totalPengeluaran)} color="bg-red-500" text="text-white" small />
                <StatCard title="Saldo Kas" value={formatRupiah(saldoBersih)} color={saldoBersih >= 0 ? 'bg-neo-purple' : 'bg-red-700'} text="text-white" small />
                <StatCard title="Order Selesai" value={completedOrders} color="bg-neo-teal" text="text-black" />
              </div>

              <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-xl mb-6 uppercase">Arus Kas</h3>
                <div className="flex items-end justify-center gap-8 h-48">
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-green-500 border-4 border-black w-20 md:w-28 transition-all duration-700" style={{ height: `${Math.max((totalPemasukan / maxFinancial) * 160, 20)}px` }}></div>
                    <span className="font-bold text-xs text-center">Pemasukan</span>
                    <span className="font-black text-sm text-green-700">{formatRupiah(totalPemasukan)}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-red-500 border-4 border-black w-20 md:w-28 transition-all duration-700" style={{ height: `${Math.max((totalPengeluaran / maxFinancial) * 160, 20)}px` }}></div>
                    <span className="font-bold text-xs text-center">Pengeluaran</span>
                    <span className="font-black text-sm text-red-600">{formatRupiah(totalPengeluaran)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-xl mb-4 uppercase">Stok Menipis</h3>
                {lowStockProducts.length === 0 ? (
                  <p className="text-gray-500 font-bold text-center py-4">Semua stok aman.</p>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts.map((p, i) => {
                      const barColors = ['bg-red-500', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-yellow-300'];
                      return (
                        <div key={p.id} className="flex items-center gap-3">
                          <span className="font-bold text-sm w-28 md:w-40 text-right truncate">{p.nama}</span>
                          <div className="flex-1 bg-gray-100 border-2 border-black h-8 relative">
                            <div className={`${barColors[i]} h-full border-r-2 border-black flex items-center justify-end pr-2 transition-all`} style={{ width: `${Math.max(((p.stok || 0) / 10) * 100, 15)}%` }}>
                              <span className="font-black text-xs text-white drop-shadow-[1px_1px_0_black]">{p.stok || 0}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* =============== KASIR (POS) =============== */}
          {!loading && activeView === 'kasir' && (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              
              {/* KIRI: Etalase */}
              <div className="w-full lg:w-2/3 flex flex-col gap-4">
                <input 
                  type="text" 
                  placeholder="Scan atau cari nama barang..." 
                  value={posSearch} 
                  onChange={(e) => setPosSearch(e.target.value)} 
                  className="w-full p-4 text-xl border-4 border-black font-black focus:outline-none shadow-[4px_4px_0_0_black] bg-white" 
                  autoFocus
                />
                
                {/* Kategori Filter */}
                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                  {posCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setPosSelectedCategory(cat)}
                      className={`whitespace-nowrap px-3 py-1 font-bold border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-y-1 text-sm md:text-base
                        ${posSelectedCategory === cat ? 'bg-neo-purple text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[600px] p-2 pt-3 pr-4 pb-6">
                  {posFilteredProducts.map(p => {
                    const isOutOfStock = (p.stok || 0) <= 0;
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => handlePosAddToCart(p)}
                        className={`border-4 border-black p-3 flex flex-col justify-between cursor-pointer transition-transform active:translate-y-1 ${isOutOfStock ? 'bg-gray-200 grayscale opacity-70 cursor-not-allowed shadow-none' : 'bg-white shadow-[4px_4px_0_0_black] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_black]'}`}
                      >
                        <div>
                          <div className="w-full h-24 bg-gray-100 border-2 border-black mb-2 overflow-hidden flex items-center justify-center">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.nama} className="w-full h-full object-cover" />
                            ) : <span className="text-gray-400 font-bold text-xs">No Image</span>}
                          </div>
                          <h4 className="font-bold text-sm leading-tight line-clamp-2">{p.nama}</h4>
                        </div>
                        <div className="mt-2">
                          <p className="font-black text-neo-teal">{formatRupiah(p.harga)}</p>
                          <p className={`text-xs font-bold mt-1 ${isOutOfStock ? 'text-red-600' : 'text-gray-600'}`}>Stok: {p.stok || 0}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KANAN: Struk/Cart */}
              <div className="w-full lg:w-1/3 bg-white border-4 border-black shadow-[6px_6px_0_0_black] p-4 sticky top-24">
                <h3 className="font-black text-xl mb-4 border-b-4 border-black pb-2 uppercase">Keranjang Kasir</h3>
                
                <div className="flex flex-col gap-3 min-h-[250px] max-h-[400px] overflow-y-auto mb-4 border-b-4 border-dashed border-gray-300 pb-4">
                  {posCart.length === 0 ? (
                    <div className="m-auto text-gray-400 font-bold text-center">Keranjang masih kosong</div>
                  ) : (
                    posCart.map(item => (
                      <div key={item.id} className="flex justify-between items-start gap-2 text-sm bg-gray-50 border-2 border-dashed border-gray-400 p-2">
                        <div className="flex-1">
                          <p className="font-bold leading-tight">{item.nama}</p>
                          <p className="text-xs text-gray-600 mt-1">{formatRupiah(item.harga)} x {item.qty}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="font-black">{formatRupiah(item.harga * item.qty)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => updatePosQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-red-200 border border-black font-bold active:translate-y-0.5">-</button>
                            <span className="font-bold">{item.qty}</span>
                            <button onClick={() => updatePosQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-green-200 border border-black font-bold active:translate-y-0.5">+</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xl">
                    <span className="font-bold uppercase">Total Belanja</span>
                    <span className="font-black text-2xl">{formatRupiah(posTotal)}</span>
                  </div>
                  
                  <div>
                    <label className="block font-bold text-sm mb-1">Diterima (Cash)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={uangTunai ? new Intl.NumberFormat('id-ID').format(uangTunai) : ''} 
                      onChange={(e) => setUangTunai(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-2 border-4 border-black font-black text-lg focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  
                  {uangTunai !== '' && (
                    <div className={`flex justify-between items-center p-2 border-4 border-black ${kembalian < 0 ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-900'}`}>
                      <span className="font-bold uppercase text-sm">Kembalian</span>
                      <span className="font-black text-lg">{kembalian < 0 ? 'Kurang bayar!' : formatRupiah(kembalian)}</span>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={handlePosCheckout}
                      disabled={isCheckoutLoading || posCart.length === 0 || (uangTunai !== '' && kembalian < 0)}
                      className="flex-1 bg-neo-teal text-black py-4 font-black text-base md:text-lg border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-y-1 hover:shadow-[2px_2px_0_0_black] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all relative"
                    >
                      {isCheckoutLoading ? 'Memproses...' : 'BAYAR TUNAI'}
                    </button>
                    <button 
                      onClick={() => setShowPosKasbonPrompt(true)}
                      disabled={isCheckoutLoading || posCart.length === 0}
                      className="flex-1 bg-yellow-400 text-black py-4 font-black text-base md:text-lg border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-y-1 hover:shadow-[2px_2px_0_0_black] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all relative"
                    >
                      KASBON
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* =============== PRODUK =============== */}
          {!loading && activeView === 'produk' && (
            <>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="font-black text-2xl uppercase hidden md:block">Manajemen Produk</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MasterCard title="Master Kategori" bg="bg-yellow-300" items={categories} val={newCategory} setVal={setNewCategory} onAdd={handleAddCategory} onDel={handleDeleteCategory} />
                <MasterCard title="Master Satuan" bg="bg-green-300" items={units} val={newUnit} setVal={setNewUnit} onAdd={handleAddUnit} onDel={handleDeleteUnit} />
              </div>

              <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                <div className="flex justify-between flex-wrap gap-2 items-center mb-4">
                  <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full md:w-1/3 p-2 font-bold border-4 border-black focus:outline-none bg-gray-100" />
                  <div className="flex gap-2">
                    {selectedProductIds.length > 0 && (
                      <button onClick={handleBulkDelete} className="bg-red-500 text-white font-bold py-2 px-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all text-sm">Hapus {selectedProductIds.length} Terpilih</button>
                    )}
                    <button onClick={openAddModal} className="bg-neo-teal text-black font-black py-2 px-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all text-sm">+ Tambah Produk</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                    <thead>
                      <tr className="bg-black text-white uppercase text-xs">
                        <th className="p-3 w-10"><input type="checkbox" checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length} onChange={toggleSelectAll} className="w-5 h-5 accent-[#ffde59] cursor-pointer" /></th>
                        <th className="p-3">Produk</th><th className="p-3">Kategori</th><th className="p-3">Harga</th><th className="p-3 text-center">Stok</th><th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className={`border-b-2 border-gray-200 hover:bg-yellow-50 ${selectedProductIds.includes(p.id) ? 'bg-yellow-100' : ''}`}>
                          <td className="p-3"><input type="checkbox" checked={selectedProductIds.includes(p.id)} onChange={() => toggleSelectProduct(p.id)} className="w-5 h-5 accent-black cursor-pointer" /></td>
                          <td className="p-3 flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 border border-black overflow-hidden flex-shrink-0">{p.image_url && <img src={p.image_url} className="w-full h-full object-cover" alt="" />}</div>
                            <span className="truncate max-w-[120px]">{p.nama}</span>
                          </td>
                          <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded border border-black text-xs">{p.kategori}</span></td>
                          <td className="p-3">{formatRupiah(p.harga)} <span className="text-gray-400 text-xs">/{p.satuan}</span></td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => updateStock(p.id, p.stok, -1)} className="w-6 h-6 bg-red-200 border border-black flex items-center justify-center text-xs">-</button>
                              <span className={`min-w-[24px] ${p.stok < 5 ? 'text-red-600 font-black' : 'text-green-600'}`}>{p.stok || 0}</span>
                              <button onClick={() => updateStock(p.id, p.stok, 1)} className="w-6 h-6 bg-green-200 border border-black flex items-center justify-center text-xs">+</button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openEditModal(p)} className="bg-yellow-300 px-2 py-1 border border-black text-xs">EDIT</button>
                              <button onClick={() => handleDelete(p.id)} className="bg-red-500 text-white px-2 py-1 border border-black text-xs">X</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =============== PESANAN =============== */}
          {!loading && activeView === 'pesanan' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard title="Total Pesanan" value={orders.length} color="bg-neo-purple" text="text-white" />
                <StatCard title="Menunggu" value={orders.filter(o => o.status === 'Menunggu').length} color="bg-yellow-400" text="text-black" />
                <StatCard title="Selesai" value={completedOrders} color="bg-green-500" text="text-white" />
              </div>

              <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                <div className="flex justify-between flex-wrap gap-2 items-center mb-4 border-b-4 border-black pb-2">
                  <h3 className="font-black text-xl uppercase">Pesanan Masuk</h3>
                  <button onClick={() => exportToCSV(orders, `Pesanan_${new Date().toLocaleDateString('id-ID')}.csv`)} className="bg-yellow-400 text-black px-3 py-1 font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all text-xs uppercase flex items-center gap-1">UNDUH Laporan (CSV)</button>
                </div>
                {orders.length === 0 ? <p className="text-center text-gray-500 font-bold py-8">Belum ada pesanan.</p> : (
                  <div className="space-y-3">
                    {orders.map(order => {
                      const shortId = String(order.id).substring(0, 8).toUpperCase();
                      const date = new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
                      return (
                        <div key={order.id} className="border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-sm bg-gray-200 px-2 border border-black">#{shortId}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 border border-black ${order.status === 'Selesai' ? 'bg-green-300' : order.status === 'Batal' ? 'bg-red-300' : 'bg-yellow-300'}`}>{order.status}</span>
                              </div>
                              <p className="font-bold mt-1">{order.nama_pembeli}</p>
                              <p className="text-xs text-gray-500">{date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-lg">{formatRupiah(order.total_harga)}</p>
                              <div className="flex gap-1 mt-1 justify-end flex-wrap">
                                <button onClick={() => toggleOrderDetail(order.id)} className="bg-gray-200 px-2 py-1 border border-black text-xs font-bold">Detail</button>
                                {order.status === 'Menunggu' && (
                                  <>
                                    <button onClick={() => completeOrder(order)} className="bg-neo-teal px-2 py-1 border border-black text-xs font-bold">Selesai</button>
                                    <button onClick={() => cancelOrder(order.id)} className="bg-red-400 text-white px-2 py-1 border border-black text-xs font-bold">Batal</button>
                                  </>
                                )}
                                <button onClick={() => deleteOrder(order.id)} className="bg-red-600 text-white px-2 py-1 border border-black text-xs font-bold">Hapus</button>
                              </div>
                            </div>
                          </div>
                          {expandedOrder === order.id && orderDetails[order.id] && (
                            <div className="mt-3 border-t-2 border-black pt-2">
                              <table className="w-full text-xs">
                                <thead><tr className="bg-gray-100"><th className="p-1 text-left">Produk</th><th className="p-1 text-center">Qty</th><th className="p-1 text-right">Subtotal</th></tr></thead>
                                <tbody>{orderDetails[order.id].map((d, i) => (<tr key={i} className="border-b border-gray-200"><td className="p-1">{d.nama_produk}</td><td className="p-1 text-center">{d.jumlah}</td><td className="p-1 text-right">{formatRupiah(d.jumlah * d.harga_satuan)}</td></tr>))}</tbody>
                              </table>
                              {order.catatan && <p className="text-xs mt-2 text-gray-600">Catatan: {order.catatan}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* =============== BUKU KAS =============== */}
          {!loading && activeView === 'bukukas' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatCard title="Pemasukan" value={formatRupiah(totalPemasukan)} color="bg-green-500" text="text-white" small />
                <StatCard title="Pengeluaran" value={formatRupiah(totalPengeluaran)} color="bg-red-500" text="text-white" small />
                <StatCard title="Saldo Bersih" value={formatRupiah(saldoBersih)} color={saldoBersih >= 0 ? "bg-neo-purple" : "bg-red-700"} text="text-white" small />
              </div>

              <div className="flex justify-end">
                <button onClick={() => setShowExpenseModal(true)} className="bg-red-500 text-white font-bold py-2 px-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 text-sm">+ Catat Pengeluaran</button>
              </div>

              <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                <div className="flex justify-between flex-wrap gap-2 items-center mb-4 border-b-4 border-black pb-2">
                  <h3 className="font-black text-xl uppercase">Riwayat Arus Kas</h3>
                  <button onClick={() => exportToCSV(arusKas, `Arus_Kas_${new Date().toLocaleDateString('id-ID')}.csv`)} className="bg-yellow-400 text-black px-3 py-1 font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all text-xs uppercase flex items-center gap-1">UNDUH Laporan (CSV)</button>
                </div>
                {arusKas.length === 0 ? <p className="text-center text-gray-500 font-bold py-8">Belum ada catatan.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                      <thead><tr className="bg-black text-white uppercase text-xs"><th className="p-3">Tanggal</th><th className="p-3">Tipe</th><th className="p-3">Keterangan</th><th className="p-3 text-right">Nominal</th></tr></thead>
                      <tbody className="font-bold">
                        {arusKas.map(a => (
                          <tr key={a.id} className="border-b-2 border-gray-200 hover:bg-yellow-50">
                            <td className="p-3 text-xs">{new Date(a.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                            <td className="p-3"><span className={`px-2 py-0.5 text-xs border border-black font-bold ${a.tipe === 'Pemasukan' ? 'bg-green-200' : 'bg-red-200'}`}>{a.tipe}</span></td>
                            <td className="p-3">{a.keterangan}</td>
                            <td className={`p-3 text-right font-black ${a.tipe === 'Pemasukan' ? 'text-green-700' : 'text-red-600'}`}>{a.tipe === 'Pemasukan' ? '+' : '-'}{formatRupiah(a.nominal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* =============== BUKU KASBON =============== */}
          {!loading && activeView === 'kasbon' && (
            <>
              <div className="flex justify-between flex-wrap gap-2 mb-4 items-center">
                <h2 className="font-black text-2xl uppercase hidden md:block">Buku Kasbon</h2>
              </div>

              <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                {kasbon.length === 0 ? <p className="text-center text-gray-500 font-bold py-8">Belum ada catatan kasbon.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                      <thead>
                        <tr className="bg-black text-white uppercase text-xs">
                          <th className="p-3">Tanggal Kasbon</th><th className="p-3">Pelanggan</th><th className="p-3">Keterangan</th><th className="p-3 text-right">Nominal</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold">
                        {kasbon.map(k => {
                          const dateObj = new Date(k.created_at);
                          const dateFormatted = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
                          return (
                            <tr key={k.id} className="border-b-2 border-gray-200 hover:bg-yellow-50">
                              <td className="p-3 text-xs">{dateFormatted}</td>
                              <td className="p-3 text-indigo-900">{k.nama_pelanggan}</td>
                              <td className="p-3 text-gray-600 truncate max-w-[250px]" title={k.keterangan}>{k.keterangan}</td>
                              <td className="p-3 text-right text-red-600 font-black">{formatRupiah(k.nominal)}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 text-xs border border-black font-bold -skew-x-6 inline-block ${k.status === 'Lunas' ? 'bg-green-300 text-green-900' : 'bg-red-500 text-white'}`}>{k.status}</span>
                              </td>
                              <td className="p-3 text-center">
                                {k.status === 'Belum Lunas' ? (
                                  <div className="flex gap-1 justify-center flex-wrap">
                                    <button onClick={() => { setAddKasbonData({ id: k.id, nama: k.nama_pelanggan, nominal: '', keterangan_tambahan: '' }); setShowAddKasbonModal(true); }} className="bg-yellow-400 text-black px-2 py-1 border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all hover:bg-yellow-500" title="Tambah Hutang">+</button>
                                    <button onClick={() => handleDeleteKasbon(k.id)} className="bg-red-500 text-white px-2 py-1 border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all hover:bg-red-600" title="Hapus">X</button>
                                    <button onClick={() => handleLunasKasbon(k)} className="bg-neo-teal text-black px-3 py-1 border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all uppercase hover:bg-teal-400">Lunas</button>
                                  </div>
                                ) : (
                                  <div className="flex gap-1 justify-center flex-wrap">
                                    <span className="text-green-700 bg-green-100 px-2 py-1 font-black text-xs border border-green-700 -skew-x-6 inline-block">Selesai</span>
                                    <button onClick={() => handleDeleteKasbon(k.id)} className="bg-red-500 text-white px-2 py-1 border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all hover:bg-red-600" title="Hapus">X</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ====== MODALS ====== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-[95%] max-w-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-6 relative max-h-[90vh] overflow-y-auto rounded-lg">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-2xl font-black text-red-500">&times;</button>
            <h2 className="text-2xl font-black mb-6 border-b-4 border-black pb-2 uppercase">{isEditing ? 'Edit Produk' : 'Tambah Produk'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block font-bold mb-1">Nama Produk</label><input name="nama" type="text" value={formData.nama} onChange={handleInputChange} className="w-full p-2 border-4 border-black font-bold focus:outline-none" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block font-bold mb-1">Kategori</label><select name="kategori" value={formData.kategori} onChange={handleInputChange} className="w-full p-2 border-4 border-black font-bold"><option value="">-- Pilih --</option>{categories.map(c => <option key={c.id} value={c.nama}>{c.nama}</option>)}</select></div>
                <div><label className="block font-bold mb-1">Satuan</label><select name="satuan" value={formData.satuan} onChange={handleInputChange} className="w-full p-2 border-4 border-black font-bold"><option value="">-- Pilih --</option>{units.map(u => <option key={u.id} value={u.nama}>{u.nama}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block font-bold mb-1">Harga (Rp)</label><input name="harga" type="number" value={formData.harga} onChange={handleInputChange} className="w-full p-2 border-4 border-black font-bold" required /></div>
                <div><label className="block font-bold mb-1">Stok</label><input name="stok" type="number" value={formData.stok} onChange={handleInputChange} className="w-full p-2 border-4 border-black font-bold" required /></div>
              </div>
              <div><label className="block font-bold mb-1">Foto (Opsional)</label><div className="border-4 border-dashed border-black p-4 bg-gray-50 text-center relative cursor-pointer"><input type="file" name="file" onChange={handleInputChange} className="absolute inset-0 opacity-0 cursor-pointer" /><span className="font-bold text-gray-500 text-sm">{formData.file ? formData.file.name : "Klik untuk upload"}</span></div></div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 py-3 font-bold border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-y-1 hover:shadow-none">Batal</button>
                <button type="submit" disabled={uploading} className="flex-1 bg-neo-purple text-white py-3 font-black border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-y-1 hover:shadow-none">{uploading ? 'Menyimpan...' : 'SIMPAN'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 backdrop-blur-sm">
          <div className="bg-white w-[95%] max-w-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-6 relative rounded-lg">
            <button onClick={() => setShowExpenseModal(false)} className="absolute top-4 right-4 text-2xl font-black text-red-500">&times;</button>
            <h2 className="text-xl font-black mb-4 border-b-4 border-black pb-2 uppercase">Catat Pengeluaran</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div><label className="block font-bold mb-1">Keterangan</label><input type="text" value={expenseForm.keterangan} onChange={(e) => setExpenseForm({...expenseForm, keterangan: e.target.value})} className="w-full p-2 border-4 border-black font-bold focus:outline-none" placeholder="Bayar listrik" required /></div>
              <div><label className="block font-bold mb-1">Nominal (Rp)</label><input type="number" value={expenseForm.nominal} onChange={(e) => setExpenseForm({...expenseForm, nominal: e.target.value})} className="w-full p-2 border-4 border-black font-bold focus:outline-none" placeholder="50000" required /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 bg-gray-200 py-3 font-bold border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-y-1 hover:shadow-none">Batal</button>
                <button type="submit" className="flex-1 bg-red-500 text-white py-3 font-black border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-y-1 hover:shadow-none">SIMPAN</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {showPosKasbonPrompt && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 backdrop-blur-sm">
          <div className="bg-white w-[95%] max-w-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-6 relative rounded-lg">
            <button onClick={() => setShowPosKasbonPrompt(false)} className="absolute top-4 right-4 text-2xl font-black text-red-500 hover:scale-110">&times;</button>
            <h2 className="text-xl font-black mb-4 border-b-4 border-black pb-2 uppercase text-yellow-500">Checkout Kasbon</h2>
            <p className="font-bold mb-4 text-sm text-gray-600">Total belanja {formatRupiah(posTotal)} ini akan dikreditkan sebagai Kasbon baru. Mohon masukkan nama pihak yang berhutang.</p>
            <form onSubmit={handlePosKasbon} className="space-y-4">
              <div><label className="block font-bold mb-1">Nama Pelanggan yang Berhutang</label><input type="text" value={posKasbonName} onChange={(e) => setPosKasbonName(e.target.value)} className="w-full p-3 border-4 border-black font-black focus:outline-none text-lg bg-yellow-50" placeholder="Cth: Ibu RT" required autoFocus /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowPosKasbonPrompt(false)} className="flex-1 bg-gray-200 py-3 font-bold border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-y-1 hover:shadow-none transition-all uppercase">Batal</button>
                <button type="submit" disabled={isCheckoutLoading} className="flex-1 bg-yellow-400 text-black py-3 font-black border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-y-1 hover:shadow-none transition-all uppercase">{isCheckoutLoading ? 'Memproses...' : 'BUAT KASBON'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddKasbonModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 backdrop-blur-sm">
          <div className="bg-white w-[95%] max-w-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-6 relative rounded-lg">
            <button onClick={() => setShowAddKasbonModal(false)} className="absolute top-4 right-4 text-2xl font-black text-red-500 hover:scale-110">&times;</button>
            <h2 className="text-xl font-black mb-4 border-b-4 border-black pb-2 uppercase text-yellow-500">Tambah Nominal Kasbon</h2>
            <p className="font-bold mb-4 text-sm text-gray-600">Tambah tagihan untuk <span className="text-indigo-900 border-b-2 border-indigo-900">{addKasbonData.nama}</span>.</p>
            <form onSubmit={submitAddKasbonAmount} className="space-y-4">
              <div>
                <label className="block font-bold mb-1">Nominal (Rp)</label>
                <input type="number" value={addKasbonData.nominal} onChange={(e) => setAddKasbonData({...addKasbonData, nominal: e.target.value})} className="w-full p-3 border-4 border-black font-black focus:outline-none text-lg bg-yellow-50" placeholder="Cth: 20000" required autoFocus />
              </div>
              <div>
                <label className="block font-bold mb-1">Keterangan (Opsional)</label>
                <input type="text" value={addKasbonData.keterangan_tambahan} onChange={(e) => setAddKasbonData({...addKasbonData, keterangan_tambahan: e.target.value})} className="w-full p-3 border-4 border-black font-bold focus:outline-none text-sm" placeholder="Contoh: Rokok Surya 1 bungkus" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddKasbonModal(false)} className="flex-1 bg-gray-200 py-3 font-bold border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-y-1 hover:shadow-none transition-all uppercase">Batal</button>
                <button type="submit" disabled={isCheckoutLoading} className="flex-1 bg-yellow-400 text-black py-3 font-black border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-y-1 hover:shadow-none transition-all uppercase">{isCheckoutLoading ? 'Memproses...' : 'SIMPAN'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color, text, small }) {
  return (
    <div className={`${color} ${text} border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
      <h3 className="text-xs font-bold uppercase opacity-80">{title}</h3>
      <p className={`${small ? 'text-lg md:text-xl' : 'text-3xl'} font-black mt-1 break-words`}>{value}</p>
    </div>
  );
}

function MasterCard({ title, bg, items, val, setVal, onAdd, onDel }) {
  return (
    <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className={`font-black text-lg mb-3 uppercase ${bg} inline-block px-2 border-2 border-black`}>{title}</h3>
      <div className="flex gap-2 mb-3">
        <input type="text" className="flex-1 border-2 border-black p-2 font-bold focus:outline-none text-sm" placeholder="Tambah baru..." value={val} onChange={(e) => setVal(e.target.value)} />
        <button onClick={onAdd} className="bg-black text-white px-3 font-bold border-2 border-black active:translate-y-1 text-sm">+</button>
      </div>
      <div className="max-h-32 overflow-y-auto border-2 border-black p-2 bg-gray-50">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center border-b border-gray-300 py-1 last:border-0">
            <span className="font-bold text-sm">{item.nama}</span>
            <button onClick={() => onDel(item.id)} className="text-red-500 font-bold text-xs hover:underline">Hapus</button>
          </div>
        ))}
      </div>
    </div>
  );
}
