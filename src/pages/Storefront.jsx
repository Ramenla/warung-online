import React, { useState, useEffect, useContext } from 'react';
import ProductCard from '../components/ProductCard';
import CartSidebar from '../components/CartSidebar';
import { supabase } from '../supabaseClient';
import { CartContext } from '../context/CartContext';
import { handleSupabaseError } from '../utils/errorHandler';

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMobileProduct, setSelectedMobileProduct] = useState(null);
  const [mobileQty, setMobileQty] = useState(1);
  const [sections, setSections] = useState([]);

  const { totalItems, addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const [prodRes, secRes] = await Promise.all([
          supabase.from('produk').select('*'),
          supabase.from('storefront_sections').select('*').order('urutan', { ascending: true })
        ]);
        
        if (prodRes.error) throw prodRes.error;
        if (secRes.error) throw secRes.error;

        setProducts(prodRes.data || []);
        setSections(secRes.data || []);
      } catch (error) {
        console.error('Error fetching storefront data:', error.message);
        handleSupabaseError(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const categories = ['Semua', ...new Set(products.map(p => p.kategori))];

  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === "Semua" || product.kategori === selectedCategory;
    const searchMatch = product.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const isSearching = searchQuery !== "" || selectedCategory !== "Semua";

  const handleCardClick = (product) => {
    if (window.innerWidth <= 768) {
      setSelectedMobileProduct(product);
      setMobileQty(1);
      setIsDrawerOpen(true);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  const handleDrawerAddToCart = () => {
    if (selectedMobileProduct) {
      // Create an explicit payload to avoid qty overwrites in standard addToCart
      const itemToCart = {
        ...selectedMobileProduct,
        name: selectedMobileProduct.nama,
        price: selectedMobileProduct.harga,
        unit: selectedMobileProduct.satuan,
        category: selectedMobileProduct.kategori,
      };
      // We manually add it `mobileQty` times or the cart should handle it, 
      // but generic addToCart usually adds 1. We will iteratively add to cart based on mobileQty to be safe if context doesn't support generic qty input.
      const currentQty = selectedMobileProduct.stok || 0;
      const amountToAdd = Math.min(mobileQty, currentQty);
      for (let i = 0; i < amountToAdd; i++) {
        addToCart(itemToCart);
      }
      setIsDrawerOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative pb-32">
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

        {/* Floating Cart Button */}
        {!isCartOpen && (
          <button 
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-neo-orange text-white p-4 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-110 transition-transform flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-neo-purple text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-black">
                {totalItems}
              </span>
            )}
          </button>
        )}

        {/* HEADER */}
        <div className="sticky top-0 z-40 bg-neo-bg border-b-4 border-black shadow-lg">
          <div className="max-w-7xl mx-auto p-4 md:p-6">
              <header className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tight">
                        TOKO<span className="text-neo-orange">SEMOGA BERKAH</span>
                    </h1>
                </div>
              </header>

              <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Cari barang warung..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-2 md:p-3 border-4 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-y-1 focus:shadow-none transition-all font-bold text-base md:text-xl placeholder-gray-500"
                    />
                  </div>

                  <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`whitespace-nowrap px-3 py-1 font-bold border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-y-1 text-sm md:text-base
                          ${selectedCategory === cat ? 'bg-neo-purple text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
              </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        
        {isLoading && (
            <div className="flex justify-center items-center h-64">
                <div className="text-2xl font-black text-black animate-pulse bg-neo-teal px-6 py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
                Memuat data warung...
                </div>
            </div>
        )}

        {!isLoading && (
            <>
                {/* Custom Admin Sections (when NOT searching) */}
                {!isSearching && sections.length > 0 && sections.map(section => {
                  const sectionProducts = products.filter(p => (section.produk_ids || []).includes(p.id));
                  if (sectionProducts.length === 0) return null; // Don't show empty sections
                  return (
                    <section key={section.id}>
                      <h2 className="text-lg md:text-2xl lg:text-3xl font-black uppercase tracking-wide truncate mb-2 md:mb-4 inline-block bg-[#ffde59] text-black px-3 py-1 transform -rotate-1 border-4 border-black mt-4 shadow-[4px_4px_0_0_black] pr-4 max-w-full">
                        {section.nama}
                      </h2>
                      <div className="flex overflow-x-auto gap-3 md:gap-4 pb-4 pt-2 px-1 snap-x scrollbar-hide">
                        {sectionProducts.map((product) => (
                          <div key={product.id} className="flex-shrink-0 w-36 md:w-48 snap-start">
                            <ProductCard product={product} onClick={handleCardClick} />
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}

                {/* All Products Section (when NOT searching) */}
                {!isSearching && (
                  <section className={sections.length > 0 ? "pt-1" : ""}>
                    <h2 className="text-lg md:text-2xl lg:text-3xl font-black uppercase tracking-wide truncate mb-2 md:mb-4 inline-block bg-black text-white px-3 py-1 transform -rotate-1 border-2 border-neo-orange mt-2 pr-4 max-w-full">
                      {sections.length > 0 ? "SEMUA PRODUK" : "KATALOG"}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 w-full">
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product} onClick={handleCardClick} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Filtered/Search Results */}
                {isSearching && (
                  <section>
                    <h2 className="text-2xl md:text-3xl font-black mb-4 border-b-4 border-black inline-block">
                      Hasil Pencarian
                    </h2>

                    {filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                        {filteredProducts.map((product) => (
                          <ProductCard key={product.id} product={product} onClick={handleCardClick} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center border-4 border-dashed border-black rounded-xl bg-gray-50">
                        <h3 className="text-2xl font-black text-black">Barang tidak ditemukan</h3>
                        <p className="text-gray-600 font-bold mt-2">Coba cari kata kunci lain.</p>
                      </div>
                    )}
                  </section>
                )}
            </>
        )}
      </div>

      {/* MOBILE DRAWER */}
       {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      
      <div className={`fixed bottom-0 left-0 w-full bg-white border-t-4 border-black z-50 transform transition-transform duration-300 rounded-t-xl overflow-hidden ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        {selectedMobileProduct && (
          <div className="p-4">
            <div className="flex justify-between items-start mb-4 relative">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-neo-teal border-2 border-black rounded shrink-0 overflow-hidden">
                  {selectedMobileProduct.image_url ? (
                     <img src={selectedMobileProduct.image_url} alt={selectedMobileProduct.nama} className="w-full h-full object-cover" />
                  ) : (
                     <span className="font-bold text-xs flex h-full items-center justify-center text-black">FOTO</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm line-clamp-2 text-black leading-tight mb-1">{selectedMobileProduct.nama}</h3>
                  <p className="font-black text-rose-600 text-lg">{formatRupiah(selectedMobileProduct.harga)}</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">Stok: {selectedMobileProduct.stok || 0}</p>
                </div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center bg-red-500 text-white border-2 border-black font-black hover:bg-red-600 active:translate-y-0.5 shadow-[2px_2px_0_0_black]">X</button>
            </div>
            
            {(selectedMobileProduct.stok || 0) > 0 ? (
              <>
                <div className="flex justify-between items-center py-4 border-y-2 border-dashed border-gray-300 mb-4">
                  <span className="font-bold text-sm text-black">Jumlah</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setMobileQty(Math.max(1, mobileQty - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 border-2 border-black font-black text-lg active:translate-y-0.5 shadow-[2px_2px_0_0_black]"
                    >-</button>
                    <span className="w-10 text-center font-bold text-black border-2 border-black py-1">{mobileQty}</span>
                    <button 
                      onClick={() => setMobileQty(Math.min(selectedMobileProduct.stok || 0, mobileQty + 1))}
                      className="w-8 h-8 flex items-center justify-center bg-neo-teal border-2 border-black font-black text-lg active:translate-y-0.5 shadow-[2px_2px_0_0_black]"
                    >+</button>
                  </div>
                </div>

                <button 
                  onClick={handleDrawerAddToCart}
                  className="w-full bg-neo-orange text-white py-3 font-black text-sm border-2 border-black shadow-[4px_4px_0_0_black] active:shadow-none active:translate-y-1 transition-all rounded"
                >
                  MASUKKAN KERANJANG
                </button>
              </>
            ) : (
              <div className="py-4 text-center">
                 <p className="font-black text-red-500 bg-red-100 p-2 border-2 border-red-500 rounded">Stok Barang Habis</p>
              </div>
            )}
          </div>
        )}
      </div>

       <footer className="mt-10 border-t-4 border-black pt-8 text-center font-bold pb-10">
            <p>&copy; 2026 Toko Semoga Berkah. Alhamdulillah</p>
       </footer>
    </div>
  );
}
