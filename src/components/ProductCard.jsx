import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';

const ProductCard = ({ product, onClick }) => {
  const { nama, kategori, satuan, harga } = product;
  const { addToCart } = useContext(CartContext);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  const handleAddToCart = () => {
    addToCart({
      ...product,
      name: nama,
      price: harga,
      unit: satuan,
      category: kategori
    });
  };

  return (
    <div 
      onClick={() => onClick && onClick(product)}
      className="w-full bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-transform hover:-translate-y-1 cursor-pointer flex flex-col h-full"
    >
      {/* Gambar Produk */}
      <div className="aspect-square w-full bg-neo-teal border-b-2 border-black flex items-center justify-center overflow-hidden shrink-0">
        {product.image_url ? (
          <img src={product.image_url} alt={nama} className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-sm text-black">FOTO</span>
        )}
      </div>

      {/* Info Produk */}
      <div className="p-2 md:p-3 flex flex-col flex-1">
        <span className="bg-neo-purple text-white px-2 py-0.5 text-[9px] md:text-[10px] font-bold border border-black rounded-full uppercase tracking-wide self-start mb-1 md:mb-2">
          {kategori}
        </span>

        <h2 className="text-xs md:text-sm font-bold text-black leading-tight line-clamp-2 flex-1 min-h-[2rem]">
          {nama}
        </h2>
        
        <div className="mt-1 md:mt-2 flex flex-col gap-1">
          <span className="text-sm md:text-base font-black text-black">{formatRupiah(harga)}</span>
          <span className={`text-[10px] font-bold ${product.stok > 0 ? 'text-green-600' : 'text-red-600'}`}>
            Stok: {product.stok !== undefined ? product.stok : '0'}
          </span>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (product.stok > 0) handleAddToCart();
          }}
          disabled={!product.stok || product.stok <= 0}
          className={`hidden md:block w-full mt-2 font-bold py-1.5 px-2 text-xs border-2 border-black rounded shrink-0
          ${product.stok > 0 
            ? 'bg-neo-orange text-white shadow-[2px_2px_0_0_black] active:shadow-none active:translate-y-0.5 cursor-pointer hover:bg-orange-600' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}`}
          >
            {product.stok > 0 ? '+ Keranjang' : 'Habis'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
