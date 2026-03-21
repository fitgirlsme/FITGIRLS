import React, { useState, useEffect } from 'react';
import { getGalleries } from '../utils/galleryService';
import './Zone.css';

const Zone = () => {
    const [activeTab, setActiveTab] = useState('STUDIO');
    const [galleries, setGalleries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGalleries = async () => {
            setLoading(true);
            const data = await getGalleries(activeTab === 'STUDIO' ? 'STUDIO' : 'LOOKBOOK');
            setGalleries(data);
            setLoading(false);
        };
        fetchGalleries();
    }, [activeTab]);

    return (
        <section className="snap-section zone-full-container">
            <div className="zone-header-wrapper">
                <h2 className="zone-main-title">ZONE</h2>
                <p className="zone-subtitle">
                    핏걸즈에서만 할수 있는 다양한 배경을 다양하게 선택해 보세요.
                </p>
                <p className="zone-subtitle-insta">
                    더 다양한 배경은 인스타그램에서 
                    <a href="https://www.instagram.com/explore/tags/핏걸즈" target="_blank" rel="noopener noreferrer" className="zone-insta-hashtag"> #핏걸즈</a>
                    를 검색하면 보실수 있습니다.
                </p>
            </div>

            <div className="zone-grid-container">
                <nav className="zone-tabs">
                    <button 
                        className={`tab-item ${activeTab === 'STUDIO' ? 'active' : ''}`}
                        onClick={() => setActiveTab('STUDIO')}
                    >
                        STUDIO ZONE
                    </button>
                    <button 
                        className={`tab-item ${activeTab === 'LOOKBOOK' ? 'active' : ''}`}
                        onClick={() => setActiveTab('LOOKBOOK')}
                    >
                        LOOKBOOK
                    </button>
                </nav>

                {loading ? (
                    <div className="gallery-loading-spinner">
                        <div className="spinner-ring"></div>
                        <p className="spinner-text">Loading Zones...</p>
                    </div>
                ) : (
                    <div className="zone-grid">
                        {galleries.map((item) => (
                            <div key={item.id} className="zone-card">
                                <div className="zone-img-wrapper">
                                    <img src={item.imageUrl || item.img || item.src} alt={item.title || item.subCategory || item.outfitName} />
                                </div>
                                <div className="zone-info">
                                    <span className="zone-badge">{item.mainCategory || item.category || (activeTab === 'LOOKBOOK' ? 'LOOKBOOK' : '')}</span>
                                    <h3 className="zone-name">{item.title || item.subCategory || item.outfitName}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Zone;
