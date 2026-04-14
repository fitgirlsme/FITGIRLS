import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import './Studios.css';

const Studios = () => {
    const { t } = useTranslation();
    const [studios, setStudios] = useState([]);
    const [activeTab, setActiveTab] = useState('fitgirls');

    useEffect(() => {
        const fetchStudios = async () => {
            try {
                // Fetch without orderBy, handle sorting purely on the client side to avoid any missing index/timestamp issues
                const snap = await getDocs(query(collection(db, 'studios')));
                const loadedStudios = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Sort by createdAt desc
                loadedStudios.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
                    return timeB - timeA;
                });
                setStudios(loadedStudios);
            } catch (err) {
                console.error("Failed to load studios", err);
            }
        };
        fetchStudios();
    }, []);

    const filteredStudios = studios.filter(s => s.category === activeTab);

    return (
        <section className="studios-section" id="studios">
            <div className="container-inner">
                <FadeInSection className="studios-header">
                    <h2 className="section-title">{t('studios.title')}</h2>
                    <p className="section-subtitle">{t('studios.subtitle')}</p>
                </FadeInSection>

                <div className="zones-grid">
                    {filteredStudios.map((zone, index) => (
                        <FadeInSection key={zone.id} delay={0.05 * index} className="zone-card">
                            <div className="zone-image-placeholder" style={{ 
                                backgroundImage: `url(${zone.image})`, 
                                backgroundSize: 'cover', 
                                backgroundPosition: 'center',
                                border: 'none',
                                textIndent: zone.image ? '-9999px' : '0',
                                color: zone.image ? 'transparent' : 'inherit'
                            }}>
                                {zone.title}
                            </div>
                            <div className="zone-info">
                                <span className="zone-name">{zone.title}</span>
                                <span className="zone-tag">Studio Zone</span>
                            </div>
                        </FadeInSection>
                    ))}
                    {filteredStudios.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
                            Background not uploaded yet.
                        </div>
                    )}
                </div>

                <div className="studio-tabs-container">
                    <button 
                        className={`studio-tab-btn ${activeTab === 'fitgirls' ? 'active' : ''}`}
                        onClick={() => setActiveTab('fitgirls')}
                    >
                        FITGIRLS & INAFIT
                    </button>
                    <button 
                        className={`studio-tab-btn ${activeTab === 'mooz' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mooz')}
                    >
                        MOOZ SELF스튜디오
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Studios;
