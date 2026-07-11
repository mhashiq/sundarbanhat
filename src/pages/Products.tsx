import React, { useState, useEffect } from 'react';
import { getProducts } from '../data/db';
import type { Product } from '../data/db';
import { Link } from 'react-router-dom';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    getProducts().then(prods => {
      setProducts(prods);
      setFilteredProducts(prods);
    });
  }, []);

  const handleFilter = (category: string) => {
    setActiveFilter(category);
    if (category === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === category));
    }
  };

  const openDrawer = (product: Product) => {
    setSelectedProduct(product);
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    setSelectedProduct(null);
    document.body.style.overflow = '';
  };

  return (
    <>
      <section style={{ backgroundColor: 'var(--color-sand-dark)', padding: '50px 0', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.5rem', color: 'var(--color-forest-dark)' }}>আমাদের উপকূলীয় খাদ্যপণ্য</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-charcoal-light)', marginTop: '8px' }}>
            ১০০% খাঁটি ও প্রাকৃতিকভাবে সংগৃহীত উপকূলের সেরা সব খাদ্যপণ্য একনজরে।
          </p>
        </div>
      </section>

      <section className="section" style={{ backgroundColor: 'var(--color-sand)' }}>
        <div className="container">
          {/* Category Filter Chips */}
          <div className="filter-chips-row">
            <button className={`filter-chip-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => handleFilter('all')}>সব পণ্য ({products.length})</button>
            <button className={`filter-chip-btn ${activeFilter === 'honey' ? 'active' : ''}`} onClick={() => handleFilter('honey')}>মধু</button>
            <button className={`filter-chip-btn ${activeFilter === 'shrimp' ? 'active' : ''}`} onClick={() => handleFilter('shrimp')}>তাজা চিংড়ি</button>
            <button className={`filter-chip-btn ${activeFilter === 'fruit' ? 'active' : ''}`} onClick={() => handleFilter('fruit')}>ফল</button>
            <button className={`filter-chip-btn ${activeFilter === 'oil' ? 'active' : ''}`} onClick={() => handleFilter('oil')}>খাঁটি তেল</button>
            <button className={`filter-chip-btn ${activeFilter === 'grain' ? 'active' : ''}`} onClick={() => handleFilter('grain')}>দেশি চাল</button>
          </div>

          {/* Pinterest Magazine style layout */}
          <div className="magazine-pinterest-layout">
            {filteredProducts.map((prod, idx) => (
              <div key={prod.id} className="magazine-item-container">
                <div className="wooden-crate-card">
                  <div className="crate-header-bar">
                    <span>CRATE #SH-00{idx + 1}</span>
                    <span style={{ color: prod.status === 'in-stock' ? '#64dd17' : '#F39C12' }}>
                      ● {prod.status === 'in-stock' ? 'ইন স্টক' : 'আসন্ন'}
                    </span>
                  </div>
                  
                  <div className="crate-image-container">
                    <span className="crate-status-tag">{prod.subcategory}</span>
                    <img src={prod.img} alt={prod.title} loading="lazy" />
                  </div>

                  <div className="crate-body-content">
                    <div className="crate-info-row">
                      <span>📍 {prod.location}</span>
                      <span>📅 {prod.harvest}</span>
                    </div>
                    <h3 className="crate-prod-title">{prod.title}</h3>
                    <p className="crate-story-teaser">{prod.story.substring(0, 90)}...</p>
                    
                    <div className="crate-footer-row">
                      <div className="crate-price-block">
                        <span style={{ fontSize: '0.75rem', color: 'gray' }}>মূল্য</span>
                        <span className="crate-price-val">{prod.price}</span>
                      </div>
                      <span className="crate-weight-val">{prod.weight}</span>
                    </div>

                    <div className="crate-actions-row">
                      <a href={`tel:+8801873520181`} className="btn btn-primary" style={{ padding: '8px' }}>📞 অর্ডার করুন</a>
                      <button className="btn btn-outline" onClick={() => openDrawer(prod)} style={{ padding: '8px' }}>বিস্তারিত</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Details Drawer/Modal Overlay */}
      {selectedProduct && (
        <div 
          onClick={closeDrawer}
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(7, 34, 17, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-white)',
              borderRadius: 'var(--border-radius-lg)',
              border: '4px solid var(--color-mud)',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '240px' }}>
              <img 
                src={selectedProduct.img} 
                alt={selectedProduct.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button 
                onClick={closeDrawer}
                style={{
                  position: 'absolute',
                  top: '15px', right: '15px',
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
              <div style={{ position: 'absolute', bottom: '15px', left: '20px', color: 'white', textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                <span style={{ background: 'var(--color-honey)', color: 'var(--color-forest-dark)', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '4px' }}>
                  {selectedProduct.subcategory}
                </span>
                <h2 style={{ color: 'white', marginTop: '6px', fontSize: '1.6rem' }}>{selectedProduct.title}</h2>
              </div>
            </div>

            <div style={{ padding: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.85rem', color: 'var(--color-charcoal-light)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px' }}>
                <span>📍 {selectedProduct.location}</span>
                <span>📅 সংগ্রহ: {selectedProduct.harvest}</span>
              </div>

              <p style={{ fontSize: '0.98rem', lineHeight: '1.7', color: 'var(--color-charcoal-light)', marginBottom: '20px' }}>
                {selectedProduct.story}
              </p>

              <h4 style={{ color: 'var(--color-forest-dark)', marginBottom: '8px' }}>📋 পণ্যের বিশেষ উপকারিতা:</h4>
              <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                {selectedProduct.benefits.map((b, idx) => (
                  <li key={idx} style={{ listStyle: 'disc', fontSize: '0.92rem', marginBottom: '6px', color: 'var(--color-charcoal-light)' }}>
                    {b}
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-sand)', padding: '15px', borderRadius: 'var(--border-radius-md)', marginBottom: '25px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'gray' }}>মূল্যমান</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-mangrove)' }}>{selectedProduct.price}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'gray' }}>প্যাক সাইজ</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedProduct.weight}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <a href={`tel:+8801873520181`} className="btn btn-primary">📞 কল করুন</a>
                <Link to={`/product/${selectedProduct.id}`} onClick={closeDrawer} className="btn btn-outline">🔗 পূর্ণ বিবরণ</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
