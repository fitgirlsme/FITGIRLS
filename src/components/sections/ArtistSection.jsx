// Cache buster: Artist rename fix
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../utils/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { STORES } from '../../utils/db';
import FadeInSection from '../FadeInSection';
import './ArtistSection.css';

const ArtistSection = () => {
    const { t } = useTranslation();
    const history = t('chief_artist.history', { returnObjects: true }) || [];
    
    const [images, setImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const q = query(collection(db, STORES.DIRECTOR), orderBy('createdAt', 'desc'));
                const snap = await getDocs(q);
                const fetchedImages = snap.docs.map(doc => doc.data().url);
                if (fetchedImages.length > 0) {
                    setImages(fetchedImages);
                }
            } catch (err) {
                console.error("Failed to fetch artist images:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, []);

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 4000); // 4 seconds interval

        return () => clearInterval(interval);
    }, [images]);

    const displayImages = images.length > 0 ? images : ["/images/director_activity_photo.jpg"];

    return (
        <div className="director-section-container">
            <div className="director-bg-overlay"></div>
            
            <div className="director-content">
                <div className="director-header">
                    <span className="director-label">{t('chief_artist.title')}</span>
                    <h2 
                        className="director-name"
                        style={{ 
                            fontFamily: "'Inter', sans-serif", 
                            fontWeight: 800, 
                            textTransform: 'uppercase',
                            letterSpacing: '-0.04em' 
                        }}
                    >
                        {t('chief_artist.name')}
                    </h2>
                    <p 
                        className="director-slogan"
                        style={{ 
                            fontFamily: "Pretendard, sans-serif",
                            fontStyle: 'normal',
                            fontWeight: 500,
                            letterSpacing: '0.02em',
                            opacity: 0.8
                        }}
                    >
                        {t('chief_artist.slogan')}
                    </p>
                </div>

                <div className="director-main-grid">
                    <div className="director-bio-col">
                        <div className="director-activity-photo-wrap">
                            <div className="director-carousel">
                                {displayImages.map((src, index) => (
                                    <img
                                        key={index}
                                        src={src}
                                        alt={`Angelo Shin Activity ${index + 1}`}
                                        className={`director-activity-photo ${index === currentIndex ? 'active' : ''}`}
                                        style={{
                                            position: index === 0 ? 'relative' : 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: index === currentIndex ? 1 : 0,
                                            transition: 'opacity 1s ease-in-out',
                                            zIndex: index === currentIndex ? 2 : 1
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="director-bio-text">
                            <FadeInSection delay={0.1}>
                                <p className="bio-highlight">{t('chief_artist.bio_title')}</p>
                            </FadeInSection>
                            <FadeInSection delay={0.3}>
                                <p>{t('chief_artist.bio_desc1')}</p>
                            </FadeInSection>
                            <FadeInSection delay={0.5}>
                                <p>{t('chief_artist.bio_desc2')}</p>
                            </FadeInSection>
                            <FadeInSection delay={0.7}>
                                <p>{t('chief_artist.bio_desc3')}</p>
                            </FadeInSection>
                        </div>
                    </div>

                    <div className="director-info-col-wrapper">
                        {!isExpanded && (
                            <button 
                                className="view-profile-toggle-btn"
                                onClick={() => setIsExpanded(true)}
                            >
                                VIEW FULL PROFILE +
                            </button>
                        )}
                        
                        <div className={`director-info-collapsible ${isExpanded ? 'is-expanded' : ''}`}>
                            <div className="director-info-col">
                                <div className="info-group">
                                    <h3 className="info-title">{t('chief_artist.history_title')}</h3>
                                    <ul className="history-list">
                                        {Array.isArray(history) && history.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="info-group">
                                    <h3 className="info-title">{t('chief_artist.portfolio_title')}</h3>
                                    <div className="portfolio-content">
                                        <p>{t('chief_artist.portfolio_fashion')}</p>
                                        <p>{t('chief_artist.portfolio_beauty')}</p>
                                        <p>{t('chief_artist.portfolio_broadcast')}</p>
                                    </div>
                                </div>

                                <div className="info-group">
                                    <h3 className="info-title">{t('chief_artist.social_impact_title')}</h3>
                                    <p className="social-impact-desc">{t('chief_artist.social_impact_desc')}</p>
                                </div>

                                <div className="info-group vision-group">
                                    <h3 className="info-title">{t('chief_artist.vision_title')}</h3>
                                    <h4 className="vision-subtitle">{t('chief_artist.vision_subtitle')}</h4>
                                    <p className="vision-desc">{t('chief_artist.vision_desc')}</p>
                                </div>

                                <div className="info-group insta-group">
                                    <a href="https://instagram.com/angeloshin_world" target="_blank" rel="noreferrer" className="director-insta-link">
                                        <span className="insta-icon">📷</span>
                                        <span className="insta-text">{t('chief_artist.insta_label')} @angeloshin_world</span>
                                    </a>
                                </div>

                                {isExpanded && (
                                    <button 
                                        className="view-profile-close-btn"
                                        onClick={() => setIsExpanded(false)}
                                    >
                                        CLOSE PROFILE -
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtistSection;
