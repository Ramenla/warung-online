import React, { useState, useEffect, useContext } from 'react';
import ProductCard from '../components/ProductCard';
import CartSidebar from '../components/CartSidebar';
import { supabase } from '../supabaseClient';
import { CartContext } from '../context/CartContext';

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // State untuk pencarian dan filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const { totalItems } = useContext(CartContext);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('produk')
          .select('*');
        
        if (error) throw error;
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Ekstrak Kategori Dinamis
  const categories = ['Semua', ...new Set(products.map(p => p.kategori))];

  // Logic Kebutuhan Primer (Sembako atau nama mengandung kata kunci)
  const primerKeywords = ['beras', 'minyak', 'telur', 'gula', 'gas', 'galon'];
  const primerProducts = products.filter(p => 
    p.kategori === 'Sembako' || primerKeywords.some(k => p.nama.toLowerCase().includes(k))
  );

  // Logika Filtering Utama
  const filteredProducts = products.filter(product => {
    // Filter by Category
    const categoryMatch = selectedCategory === "Semua" || product.kategori === selectedCategory;
    
    // Filter by Search Query
    const searchMatch = product.nama.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-neo-bg relative pb-32">
        {/* Cart Sidebar */}
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

        {/* Floating Cart Button */}
        {!isCartOpen && (
          <button 
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-neo-orange text-white p-4 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-110 transition-transform flex items-center justify-center group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-neo-purple text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-black animate-bounce">
                {totalItems}
              </span>
            )}
          </button>
        )}

        {/* STICKY HEADER SECTION */}
        <div className="sticky top-0 z-40 bg-neo-bg border-b-4 border-black shadow-lg">
          <div className="max-w-7xl mx-auto p-4 md:p-6">
              <header className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tight">
                        Katalog <span className="text-neo-orange">Warung</span>
                    </h1>
                </div>
              </header>

              {/* Search & Filters */}
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
                        className={`
                          whitespace-nowrap px-3 py-1 font-bold border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-y-1 text-sm md:text-base
                          ${selectedCategory === cat 
                            ? 'bg-neo-purple text-white' 
                            : 'bg-white text-black hover:bg-gray-100'}
                        `}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
              </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* Loading State */}
        {isLoading && (
            <div className="flex justify-center items-center h-64">
                <div className="text-2xl font-black text-black animate-pulse bg-neo-teal px-6 py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
                Memuat data warung...
                </div>
            </div>
        )}

        {!isLoading && (
            <>
                {/* SECTION: KEBUTUHAN PRIMER (Horizontal Scroll) */}
                {primerProducts.length > 0 && searchQuery === "" && selectedCategory === "Semua" && (
                    <section>
                        <h2 className="text-2xl md:text-3xl font-black mb-1 inline-block bg-black text-white px-3 py-1 transform -rotate-1 border-2 border-neo-orange">
                            Kebutuhan Pokok
                        </h2>
                        <div className="flex overflow-x-auto gap-4 pt-[10px] pb-[20px] px-2 scrollbar-hide snap-x -mx-2">
                            {primerProducts.map((product) => (
                                <div key={product.id} className="min-w-[200px] md:min-w-[250px] snap-center">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* GRID UTAMA - SEMUA BARANG */}
                <section>
                    <h2 className="text-2xl md:text-3xl font-black mb-4 border-b-4 border-black inline-block">
                        {searchQuery || selectedCategory !== "Semua" ? "Hasil Pencarian" : "Semua Barang"}
                    </h2>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center border-4 border-dashed border-black rounded-xl bg-gray-50">
                            <h3 className="text-2xl font-black text-black">Barang tidak ditemukan</h3>
                            <p className="text-gray-600 font-bold mt-2">Coba cari kata kunci lain.</p>
                        </div>
                    )}
                </section>
            </>
        )}
      </div>

       {/* Footer */}
       <footer className="mt-10 border-t-4 border-black pt-8 text-center font-bold pb-10">
            <p>&copy; 2026 Toko Semoga Berkah. Alhamdulillah</p>
       </footer>
    </div>
  );
}
