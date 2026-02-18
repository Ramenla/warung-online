import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';

const ProductCard = ({ product }) => {
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
    <div className="w-full bg-white border-2 md:border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      {/* Gambar Produk - DIPERBESAR */}
      <div className="h-40 md:h-56 bg-neo-teal border-b-2 md:border-b-4 border-black flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={nama} className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-lg md:text-2xl text-black">FOTO</span>
        )}
      </div>

      {/* Info Produk */}
      <div className="p-3 md:p-5">
        <span className="bg-neo-purple text-white px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-bold border-2 border-black rounded-full uppercase tracking-wide">
          {kategori}
        </span>

        <h2 className="mt-2 md:mt-3 text-base md:text-xl font-extrabold text-black leading-tight min-h-[2.5rem] md:min-h-[3.5rem] line-clamp-2">
          {nama}
        </h2>
        <p className="mt-1 text-gray-700 font-medium text-xs md:text-base">Satuan: {satuan}</p>

        <div className="mt-3 md:mt-5 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
          <div className="flex flex-col">
            <span className="text-base md:text-xl font-black text-black">{formatRupiah(harga)}</span>
            <span className={`text-[10px] md:text-xs font-bold ${product.stok > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Stok: {product.stok !== undefined ? product.stok : '0'}
            </span>
          </div>

          <button 
            onClick={product.stok > 0 ? handleAddToCart : null}
            disabled={!product.stok || product.stok <= 0}
            className={`font-bold py-1.5 px-3 md:py-2 md:px-4 text-xs md:text-sm border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all w-full md:w-auto text-center
            ${product.stok > 0 
              ? 'bg-neo-orange text-white active:shadow-none active:translate-y-1 active:translate-x-1 cursor-pointer hover:bg-orange-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none border-gray-400'}`}
          >
            {product.stok > 0 ? 'Tambah' : 'Stok Habis'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
