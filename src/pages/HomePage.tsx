import { useState } from 'react';
import Hero from '../components/Hero';
import MenuSection from '../components/MenuSection';
import ProductModal from '../components/ProductModal';
import FidelidadeAvisoModal from '../components/FidelidadeAvisoModal';
import PedirDeNovoStrip from '../components/PedirDeNovoStrip';
import { Produto } from '../types/Produto';

const HomePage = () => {
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProductClick = (product: Produto) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <Hero />
      <PedirDeNovoStrip onProductClick={handleProductClick} />
      <MenuSection onProductClick={handleProductClick} />

      {selectedProduct && (
        <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={handleCloseModal} />
      )}

      <FidelidadeAvisoModal />
    </>
  );
};

export default HomePage;
