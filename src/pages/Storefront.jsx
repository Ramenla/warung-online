import React, { useState, useEffect, useContext } from "react";
import ProductCard from "../components/ProductCard";
import CartSidebar from "../components/CartSidebar";
import { supabase } from "../supabaseClient";
import { CartContext } from "../context/CartContext";
import { handleSupabaseError } from "../utils/errorHandler";
import { Minus, Plus, X } from "lucide-react";

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
          supabase.from("produk").select("*"),
          supabase
            .from("storefront_sections")
            .select("*")
            .order("urutan", { ascending: true }),
        ]);

        if (prodRes.error) throw prodRes.error;
        if (secRes.error) throw secRes.error;

        setProducts(prodRes.data || []);
        setSections(secRes.data || []);
      } catch (error) {
        console.error("Error fetching storefront data:", error.message);
        handleSupabaseError(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const categories = ["Semua", ...new Set(products.map((p) => p.kategori))];

  const filteredProducts = products.filter((product) => {
    const categoryMatch =
      selectedCategory === "Semua" || product.kategori === selectedCategory;
    const searchMatch = product.nama
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
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
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
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
    <div className="storefront min-h-screen bg-white relative pb-32">
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* HEADER */}
      <div className="storefront-header sticky top-0 z-40 bg-neo-bg border-b-4 border-black shadow-lg">
        <div className="storefront-header-inner max-w-7xl mx-auto p-4 md:p-6">
          <header className="storefront-topbar flex justify-between items-center mb-4">
            <div>
              <h1 className="storefront-brand text-3xl md:text-5xl font-black text-black uppercase tracking-tight">
                TOKO <span className="text-neo-orange">SEMOGA BERKAH</span>
              </h1>
            </div>
            <div className="storefront-search-row">
              <div className="storefront-search relative">
                <input
                  type="text"
                  placeholder="Cari barang warung..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="storefront-search-input w-full p-2 md:p-3 border-4 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-y-1 focus:shadow-none transition-all font-bold text-base md:text-xl placeholder-gray-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="storefront-cart-trigger flex items-center justify-center gap-2"
                aria-label={`Buka keranjang, ${totalItems} barang`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="storefront-cart-label">Keranjang</span>
                <span className="storefront-cart-count">{totalItems}</span>
              </button>
            </div>
          </header>
          <nav
            className="storefront-navigation storefront-categories flex overflow-x-auto gap-2 pb-2 scrollbar-hide"
            aria-label="Kategori produk"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={selectedCategory === cat}
                className={`storefront-category whitespace-nowrap px-3 py-1 font-bold border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-y-1 text-sm md:text-base
                        ${selectedCategory === cat ? "is-active bg-neo-purple text-white" : "bg-white text-black hover:bg-gray-100"}`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="storefront-content max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="storefront-loading text-2xl font-black text-black animate-pulse bg-neo-teal px-6 py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Memuat data warung...
            </div>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Custom Admin Sections (when NOT searching) */}
            {!isSearching &&
              sections.length > 0 &&
              sections.map((section) => {
                const sectionProducts = products.filter((p) =>
                  (section.produk_ids || []).includes(p.id),
                );
                if (sectionProducts.length === 0) return null; // Don't show empty sections
                return (
                  <section key={section.id}>
                    <h2 className="storefront-section-title text-lg md:text-2xl lg:text-3xl font-black uppercase tracking-wide truncate mb-2 md:mb-4 inline-block bg-[#ffde59] text-black px-3 py-1 border-4 border-black mt-4 shadow-[4px_4px_0_0_black] pr-4 max-w-full">
                      {section.nama}
                    </h2>
                    <div className="storefront-product-row flex overflow-x-auto gap-3 md:gap-4 pb-4 pt-2 px-1 snap-x scrollbar-hide">
                      {sectionProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex-shrink-0 w-36 md:w-48 snap-start"
                        >
                          <ProductCard
                            product={product}
                            onClick={handleCardClick}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}

            {/* All Products Section (when NOT searching) */}
            {!isSearching && (
              <section className={`storefront-catalog ${sections.length > 0 ? "pt-1" : ""}`}>
                <div className="storefront-catalog-heading">
                  <div>
                    <p className="storefront-eyebrow">Belanja kebutuhan harian</p>
                    <h2 className="storefront-section-title">
                      {sections.length > 0 ? "Semua produk" : "Katalog"}
                    </h2>
                  </div>
                  <span className="storefront-product-count">
                    {products.length} produk
                  </span>
                </div>
                <div className="storefront-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 w-full">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Filtered/Search Results */}
            {isSearching && (
              <section>
                <h2 className="storefront-results-title text-2xl md:text-3xl font-black mb-4 border-b-4 border-black inline-block">
                  Hasil Pencarian
                </h2>

                {filteredProducts.length > 0 ? (
                  <div className="storefront-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onClick={handleCardClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="storefront-empty flex flex-col items-center justify-center py-10 text-center border-4 border-dashed border-black rounded-xl bg-gray-50">
                    <h3 className="text-2xl font-black text-black">
                      Barang tidak ditemukan
                    </h3>
                    <p className="text-gray-600 font-bold mt-2">
                      Coba cari kata kunci lain.
                    </p>
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

      <div
        className={`storefront-product-sheet fixed bottom-0 left-0 w-full bg-white border-t-4 border-black z-50 transform transition-transform duration-300 rounded-t-xl overflow-hidden ${isDrawerOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        {selectedMobileProduct && (
          <div className="storefront-product-sheet-inner">
            <div className="storefront-sheet-handle" aria-hidden="true" />
            <div className="storefront-sheet-heading">
              <div>
                <p className="storefront-sheet-eyebrow">Detail produk</p>
                <h2>Tambahkan ke keranjang</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="storefront-sheet-close"
                aria-label="Tutup detail produk"
              >
                <X size={19} strokeWidth={1.8} />
              </button>
            </div>

            <div className="storefront-sheet-product">
              <div className="storefront-sheet-image">
                  {selectedMobileProduct.image_url ? (
                    <img
                      src={selectedMobileProduct.image_url}
                      alt={selectedMobileProduct.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      Foto produk
                    </span>
                  )}
              </div>
              <div className="storefront-sheet-product-info">
                <span className="storefront-sheet-category">
                  {selectedMobileProduct.kategori}
                </span>
                <h3>{selectedMobileProduct.nama}</h3>
                <p className="storefront-sheet-price">
                  {formatRupiah(selectedMobileProduct.harga)}
                  <span> / {selectedMobileProduct.satuan}</span>
                </p>
                <p className={`storefront-sheet-stock ${(selectedMobileProduct.stok || 0) > 0 ? "is-available" : "is-unavailable"}`}>
                  {(selectedMobileProduct.stok || 0) > 0
                    ? `${selectedMobileProduct.stok} tersedia`
                    : "Stok habis"}
                </p>
              </div>
            </div>

            {(selectedMobileProduct.stok || 0) > 0 ? (
              <>
                <div className="storefront-sheet-quantity-row">
                  <div>
                    <span>Jumlah</span>
                    <p>Atur jumlah produk</p>
                  </div>
                  <div className="storefront-sheet-quantity">
                    <button
                      type="button"
                      onClick={() => setMobileQty(Math.max(1, mobileQty - 1))}
                      aria-label="Kurangi jumlah"
                    >
                      <Minus size={16} />
                    </button>
                    <span aria-live="polite">
                      {mobileQty}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setMobileQty(
                          Math.min(
                            selectedMobileProduct.stok || 0,
                            mobileQty + 1,
                          ),
                        )
                      }
                      aria-label="Tambah jumlah"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleDrawerAddToCart}
                  className="storefront-sheet-add"
                >
                  <span>Tambah ke keranjang</span>
                  <strong>{formatRupiah(selectedMobileProduct.harga * mobileQty)}</strong>
                </button>
              </>
            ) : (
              <p className="storefront-sheet-unavailable">
                Produk ini sedang tidak tersedia.
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="storefront-footer mt-10 border-t-4 border-black pt-8 text-center font-bold pb-10">
        <p>&copy; 2026 Toko Semoga Berkah. Alhamdulillah</p>
      </footer>
    </div>
  );
}
