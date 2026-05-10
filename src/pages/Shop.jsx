import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../utils/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import './Shop.css';

const Shop = () => {
    const { t, i18n } = useTranslation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Failed to load products:', err);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

    const filteredProducts = activeCategory === 'ALL'
        ? products
        : products.filter(p => p.category === activeCategory);

    const getLocalized = (item, field) => {
        const lang = i18n.language.split('-')[0].toLowerCase();
        if (lang === 'en') return item[`${field}En`] || item[field];
        if (lang === 'ja') return item[`${field}Ja`] || item[field];
        if (lang === 'zh') return item[`${field}Zh`] || item[field];
        return item[field];
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ko-KR').format(price) + ' KRW';
    };

    return (
        <div className="shop-page">
            <header className="shop-header">
                <h1 className="shop-title">SHOP</h1>
                <p className="shop-subtitle">FITORIALIST+ Official Merchandise</p>
            </header>

            <div className="shop-filter-bar">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat.toUpperCase()}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="shop-loading">Loading boutique...</div>
            ) : (
                <div className="product-grid">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="product-card" onClick={() => setSelectedProduct(product)}>
                            <div className="product-image-container">
                                <img src={product.images?.[0] || 'https://via.placeholder.com/400x500'} alt={product.name} />
                                {product.status === 'SOLDOUT' && <div className="soldout-badge">SOLD OUT</div>}
                                <div className="product-overlay">
                                    <span>QUICK VIEW</span>
                                </div>
                            </div>
                            <div className="product-info">
                                <span className="product-category">{product.category}</span>
                                <h3 className="product-name">{getLocalized(product, 'name')}</h3>
                                <div className="product-price">{formatPrice(product.price)}</div>
                                {product.size && <div className="product-size-preview">Size: {product.size}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredProducts.length === 0 && !loading && (
                <div className="shop-empty">Coming soon.</div>
            )}

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="product-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedProduct(null)}>×</button>
                        <div className="modal-content">
                            <div className="modal-gallery">
                                {selectedProduct.images?.map((img, i) => (
                                    <img key={i} src={img} alt="" />
                                ))}
                            </div>
                            <div className="modal-details">
                                <div className="m-header-meta">
                                    <span className="m-category">{selectedProduct.category}</span>
                                    {selectedProduct.season && <span className="m-season">{selectedProduct.season}</span>}
                                </div>
                                <h2 className="m-name">{getLocalized(selectedProduct, 'name')}</h2>
                                <div className="m-price">{formatPrice(selectedProduct.price)}</div>
                                
                                <div className="m-info-grid">
                                    <div className="m-section">
                                        <label>PRODUCT ID</label>
                                        <div className="m-value">{selectedProduct.productID || '-'}</div>
                                    </div>
                                    <div className="m-section">
                                        <label>SIZE</label>
                                        <div className="m-value">{selectedProduct.size || 'Free Size'}</div>
                                    </div>
                                </div>

                                <div className="m-section">
                                    <label>DESCRIPTION</label>
                                    <p className="m-desc">{getLocalized(selectedProduct, 'description')}</p>
                                </div>

                                <button className="inquiry-btn" onClick={() => window.open('https://pf.kakao.com/_.../chat', '_blank')}>
                                    ORDER INQUIRY
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shop;
