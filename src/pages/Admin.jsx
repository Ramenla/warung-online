import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Master Data Inputs
  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    kategori: '',
    satuan: '',
    harga: '',
    stok: 0,
    file: null
  });
  const [uploading, setUploading] = useState(false);

  // Quick Units for form
  const quickUnits = ['1kg', '1/2kg', '1/4kg', '1 butir', '1 bungkus', '1 renceng'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchCategories(), fetchUnits()]);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('produk')
      .select('*')
      .order('id', { ascending: false });
    if (error) console.error('Error fetching products:', error);
    else setProducts(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('kategori').select('*').order('nama', { ascending: true });
    if (error) console.error('Error fetching categories:', error);
    else setCategories(data || []);
  };

  const fetchUnits = async () => {
    const { data, error } = await supabase.from('satuan').select('*').order('nama', { ascending: true });
    if (error) console.error('Error fetching units:', error);
    else setUnits(data || []);
  };

  // --- MASTER DATA HANDLERS ---
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const { error } = await supabase.from('kategori').insert([{ nama: newCategory }]);
    if (error) alert('Gagal menambah kategori: ' + error.message);
    else {
        setNewCategory('');
        fetchCategories();
    }
  };

  const handleDeleteCategory = async (id) => {
      if (window.confirm('Hapus kategori ini?')) {
          const { error } = await supabase.from('kategori').delete().eq('id', id);
          if (error) alert('Gagal hapus: ' + error.message);
          else fetchCategories();
      }
  };

  const handleAddUnit = async () => {
    if (!newUnit.trim()) return;
    const { error } = await supabase.from('satuan').insert([{ nama: newUnit }]);
    if (error) alert('Gagal menambah satuan: ' + error.message);
    else {
        setNewUnit('');
        fetchUnits();
    }
  };

  const handleDeleteUnit = async (id) => {
      if (window.confirm('Hapus satuan ini?')) {
          const { error } = await supabase.from('satuan').delete().eq('id', id);
          if (error) alert('Gagal hapus: ' + error.message);
          else fetchUnits();
      }
  };

  // --- PRODUCT HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleQuickUnit = (unitVal) => {
      setFormData({ ...formData, satuan: unitVal });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentProductId(null);
    setFormData({ 
        nama: '', 
        kategori: categories.length > 0 ? categories[0].nama : '', 
        satuan: units.length > 0 ? units[0].nama : '', 
        harga: '', 
        stok: 10,
        file: null 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setIsEditing(true);
    setCurrentProductId(product.id);
    setFormData({
      nama: product.nama,
      kategori: product.kategori,
      satuan: product.satuan,
      harga: product.harga,
      stok: product.stok || 0,
      file: null 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus produk ini?')) {
      const { error } = await supabase.from('produk').delete().eq('id', id);
      if (error) alert('Gagal menghapus: ' + error.message);
      else fetchProducts();
    }
  };

  const updateStock = async (id, currentStock, change) => {
      const newStock = Math.max(0, currentStock + change);
      const { error } = await supabase.from('produk').update({ stok: newStock }).eq('id', id);
      if (error) alert('Gagal update stok: ' + error.message);
      else fetchProducts();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama || !formData.harga) {
      alert('Nama dan Harga wajib diisi!');
      return;
    }

    setUploading(true);
    let imageUrl = null;

    if (formData.file) {
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, formData.file);

      if (uploadError) {
        alert('Gagal upload gambar: ' + uploadError.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      imageUrl = data.publicUrl;
    }

    const payload = {
      nama: formData.nama,
      kategori: formData.kategori,
      satuan: formData.satuan,
      harga: parseInt(formData.harga),
      stok: parseInt(formData.stok)
    };

    if (imageUrl) payload.image_url = imageUrl;

    let error = null;
    if (isEditing) {
      const { error: updateError } = await supabase.from('produk').update(payload).eq('id', currentProductId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('produk').insert([payload]);
      error = insertError;
    }

    if (error) alert('Gagal menyimpan: ' + error.message);
    else {
      setIsModalOpen(false);
      fetchProducts();
    }
    setUploading(false);
  };

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  // --- STATS & FINANCIALS ---
  const totalProducts = products.length;
  const noPhotoProducts = products.filter(p => !p.image_url).length;
  const lowStockProducts = products.filter(p => (p.stok || 0) < 5).length;
  
  // Financial Calcs
  const totalAssetValue = products.reduce((acc, curr) => acc + (curr.harga * (curr.stok || 0)), 0);
  const totalStockItems = products.reduce((acc, curr) => acc + (curr.stok || 0), 0);

  const filteredProducts = products.filter(p => 
    p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.kategori && p.kategori.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-neo-bg font-sans text-black relative pb-20">
        
        {/* --- STICKY HEADER --- */}
        <div className="sticky top-0 z-30 bg-neo-bg border-b-4 border-black px-4 py-4 md:px-10 md:py-6 shadow-md transition-all">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(255,255,255,1)]">
                        Dashboard Admin
                    </h1>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleLogout}
                        className="bg-red-500 text-white font-bold py-2 px-3 md:py-3 md:px-4 border-2 md:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all text-xs md:text-sm"
                    >
                        Keluar
                    </button>
                    <button 
                        onClick={openAddModal}
                        className="bg-neo-teal text-black font-black py-2 px-3 md:py-3 md:px-6 border-2 md:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2 text-sm md:text-base animate-pulse"
                    >
                        <span className="text-lg md:text-xl">+</span> <span className="hidden md:inline">Tambah Produk</span><span className="md:hidden">Baru</span>
                    </button>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8">

            {/* --- FINANCIAL STATS --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                <StatCard title="Total Jenis" value={totalProducts} color="bg-neo-purple" text="text-white" />
                <StatCard title="Stok Menipis" value={lowStockProducts} color="bg-red-500" text="text-white" />
                <StatCard title="Potensi Omzet" value={formatRupiah(totalAssetValue)} color="bg-green-500" text="text-white" isCurrency={true} />
                <StatCard title="Total Unit Barang" value={totalStockItems} color="bg-neo-orange" text="text-white" />
            </div>

            {/* --- MASTER DATA MANAGEMENT --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kategori */}
                <div className="bg-white border-4 border-black p-4 md:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black text-xl mb-4 uppercase bg-yellow-300 inline-block px-2 border-2 border-black">Pengaturan Master Kategori</h3>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            className="flex-1 border-2 border-black p-2 font-bold focus:outline-none" 
                            placeholder="Kategori baru..." 
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <button onClick={handleAddCategory} className="bg-black text-white px-4 font-bold border-2 border-black active:translate-y-1">+</button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border-2 border-black p-2 bg-gray-50">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex justify-between items-center border-b border-gray-300 py-1 last:border-0">
                                <span className="font-bold">{cat.nama}</span>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 font-bold hover:underline text-xs">Hapus</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Satuan */}
                <div className="bg-white border-4 border-black p-4 md:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black text-xl mb-4 uppercase bg-green-300 inline-block px-2 border-2 border-black">Pengaturan Master Satuan</h3>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            className="flex-1 border-2 border-black p-2 font-bold focus:outline-none" 
                            placeholder="Satuan baru..." 
                            value={newUnit}
                            onChange={(e) => setNewUnit(e.target.value)}
                        />
                        <button onClick={handleAddUnit} className="bg-black text-white px-4 font-bold border-2 border-black active:translate-y-1">+</button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border-2 border-black p-2 bg-gray-50">
                        {units.map(unit => (
                            <div key={unit.id} className="flex justify-between items-center border-b border-gray-300 py-1 last:border-0">
                                <span className="font-bold">{unit.nama}</span>
                                <button onClick={() => handleDeleteUnit(unit.id)} className="text-red-500 font-bold hover:underline text-xs">Hapus</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- PRODUCT TABLE --- */}
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="font-black text-2xl uppercase">Daftar Produk</h3>
                    <input 
                        type="text" 
                        placeholder="Cari nama barang..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-1/3 p-2 font-bold border-4 border-black focus:outline-none focus:bg-gray-50 bg-gray-100"
                    />
                </div>

                {loading ? (
                    <div className="p-10 text-center font-black animate-pulse">Memuat data...</div>
                ) : (
                    <div className="overflow-x-auto pb-2">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-black text-white uppercase text-xs md:text-sm tracking-wider">
                                    <th className="p-3 border-b-4 border-black">Produk</th>
                                    <th className="p-3 border-b-4 border-black">Kategori</th>
                                    <th className="p-3 border-b-4 border-black">Harga/Satuan</th>
                                    <th className="p-3 border-b-4 border-black text-center">Stok</th>
                                    <th className="p-3 border-b-4 border-black text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="font-bold text-sm md:text-base">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="border-b-2 border-gray-200 hover:bg-yellow-50 transition-colors">
                                        <td className="p-3 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 border-2 border-black overflow-hidden flex-shrink-0">
                                                {product.image_url && <img src={product.image_url} className="w-full h-full object-cover" alt="" />}
                                            </div>
                                            <span className="truncate max-w-[150px]">{product.nama}</span>
                                        </td>
                                        <td className="p-3">
                                            <span className="bg-gray-100 px-2 py-1 rounded border border-black text-xs">{product.kategori}</span>
                                        </td>
                                        <td className="p-3">
                                            {formatRupiah(product.harga)} <span className="text-gray-500 font-normal text-xs">/{product.satuan}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => updateStock(product.id, product.stok, -1)} className="w-6 h-6 bg-red-200 border border-black flex items-center justify-center hover:bg-red-300">-</button>
                                                <span className={`min-w-[30px] ${product.stok < 5 ? 'text-red-600 font-black' : 'text-green-600'}`}>{product.stok || 0}</span>
                                                <button onClick={() => updateStock(product.id, product.stok, 1)} className="w-6 h-6 bg-green-200 border border-black flex items-center justify-center hover:bg-green-300">+</button>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEditModal(product)} className="bg-yellow-300 p-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs">EDIT</button>
                                                <button onClick={() => handleDelete(product.id)} className="bg-red-500 text-white p-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs">HAPUS</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- LAPORAN RINGKAS --- */}
            <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 mt-8">
                <h3 className="font-black text-xl mb-4 uppercase border-b-4 border-black pb-2">Laporan Ringkas</h3>
                <table className="w-full border-2 border-black text-sm md:text-base">
                    <tbody>
                        <tr className="border-b-2 border-black">
                            <td className="p-3 font-bold bg-gray-100 border-r-2 border-black w-1/2">Total Modal Tersimpan (Estimasi)</td>
                            <td className="p-3 font-mono font-bold text-gray-500">Data Modal Belum Tersedia</td>
                        </tr>
                        <tr>
                            <td className="p-3 font-bold bg-green-100 border-r-2 border-black">Potensi Pendapatan (Jual Habis)</td>
                            <td className="p-3 font-mono font-black text-green-700 text-lg">{formatRupiah(totalAssetValue)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>

        {/* --- MODAL --- */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 backdrop-blur-sm overflow-y-auto">
                <div className="bg-white w-[95%] max-w-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-6 relative animate-bounce-in max-h-[90vh] overflow-y-auto rounded-lg">
                    <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-2xl font-black text-red-500 hover:scale-110">&times;</button>
                    <h2 className="text-2xl font-black mb-6 border-b-4 border-black pb-2 uppercase">{isEditing ? 'Edit Produk' : 'Tambah Produk'}</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block font-bold mb-1">Nama Produk</label>
                            <input name="nama" type="text" value={formData.nama} onChange={handleInputChange} className="w-full p-2 border-4 border-black font-bold focus:outline-none focus:shadow-[4px_4px_0_0_black]" required />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold mb-1">Kategori</label>
                                <select name="kategori" value={formData.kategori} onChange={handleInputChange} className="w-full p-2 border-4 border-black font-bold focus:outline-none focus:shadow-[4px_4px_0_0_black]">
                                    <option value="">-- Pilih --</option>
                                    {categories.map(c => <option key={c.id} value={c.nama}>{c.nama}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block font-bold mb-1">Satuan</label>
                                <select name="satuan" value={formData.satuan} onChange={handleInputChange} className="w-full p-2 border-4 border-black font-bold focus:outline-none focus:shadow-[4px_4px_0_0_black] mb-2">
                                    <option value="">-- Pilih --</option>
                                    {units.map(u => <option key={u.id} value={u.nama}>{u.nama}</option>)}
                                </select>
                                <div className="flex flex-wrap gap-1">
                                    {quickUnits.map(unit => (
                                        <button 
                                            key={unit} 
                                            type="button" 
                                            onClick={() => handleQuickUnit(unit)}
                                            className="bg-gray-200 text-[10px] px-2 py-1 font-bold border border-black hover:bg-black hover:text-white transition-colors"
                                        >
                                            {unit}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold mb-1">Harga (Rp)</label>
                                <input name="harga" type="number" value={formData.harga} onChange={handleInputChange} className="w-full p-2 border-4 border-black font-bold focus:outline-none focus:shadow-[4px_4px_0_0_black]" required />
                            </div>
                            <div>
                                <label className="block font-bold mb-1">Stok</label>
                                <input name="stok" type="number" value={formData.stok} onChange={handleInputChange} className="w-full p-2 border-4 border-black font-bold focus:outline-none focus:shadow-[4px_4px_0_0_black]" required />
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold mb-1">Foto (Opsional)</label>
                            <div className="border-4 border-dashed border-black p-4 bg-gray-50 text-center relative cursor-pointer">
                                <input type="file" name="file" onChange={handleInputChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <span className="font-bold text-gray-500 text-sm">{formData.file ? formData.file.name : "Klik untuk upload"}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 py-3 font-bold border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-y-1 hover:shadow-none">Batal</button>
                            <button type="submit" disabled={uploading} className="flex-1 bg-neo-purple text-white py-3 font-black border-4 border-black shadow-[4px_4px_0_0_black] hover:translate-y-1 hover:shadow-none">{uploading ? 'Menyimpan...' : 'SIMPAN'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}

function StatCard({ title, value, color, text, isCurrency }) {
    return (
        <div className={`${color} ${text} border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
            <h3 className="text-xs font-bold uppercase opacity-80">{title}</h3>
            <p className={`${isCurrency ? 'text-lg md:text-2xl' : 'text-3xl'} font-black mt-1 break-words`}>{value}</p>
        </div>
    );
}
