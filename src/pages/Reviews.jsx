import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getReviews, getTotalReviewCount } from '../utils/reviewService';
import reviewsBackup from '../data/reviews_backup.json';
import './Reviews.css';

const Reviews = () => {
    const { t, i18n } = useTranslation();
    const [reviews, setReviews] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            try {
                const [reviewsData, count] = await Promise.all([
                    getReviews('all'),
                    getTotalReviewCount()
                ]);
                
                const combinedReviews = [...reviewsData];
                const existingIds = new Set(reviewsData.map(r => r.id));
                reviewsBackup.forEach(backup => {
                    if (!existingIds.has(backup.id)) {
                        combinedReviews.push(backup);
                    }
                });

                setReviews(combinedReviews);
                setTotalCount(Math.max(count, combinedReviews.length, reviewsBackup.length));
            } catch (error) {
                setReviews(reviewsBackup);
                setTotalCount(reviewsBackup.length);
            }
            setLoading(false);
        };
        initData();
    }, []);

    const scrollSlider = (direction) => {
        const track = document.querySelector('.review-slider-track');
        const scrollAmount = direction === 'left' ? -400 : 400;
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    return (
        <div className="review-section-container">
            <header className="review-section-header">
                <span className="section-subtitle">CUSTOMER REVIEWS</span>
                <h2 className="section-title">REVIEWS</h2>
                <div className="lang-switcher">
                    <button onClick={() => changeLanguage('ko')} className={i18n.language === 'ko' ? 'active' : ''}>KR</button>
                    <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>EN</button>
                    <button onClick={() => changeLanguage('ja')} className={i18n.language === 'ja' ? 'active' : ''}>JP</button>
                </div>
            </header>

            <div className="review-stats-bar">
                <div className="stat-item">
                    <div className="stat-value">200+</div>
                    <div className="stat-label">Total Reviews</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                    <div className="stat-value">4.94/5</div>
                    <div className="stat-label">Average Rating</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                    <div className="stat-value">8,000+</div>
                    <div className="stat-label">Total Shooters</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                    <div className="stat-value">13y+</div>
                    <div className="stat-label">Experience</div>
                </div>
            </div>

            <div className="review-slider-wrapper">
                <button className="slider-arrow left" onClick={() => scrollSlider('left')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                
                <div className="review-slider-container">
                    <div className="review-slider-track">
                        {loading ? (
                            <div className="gallery-loading-spinner">
                                <div className="spinner-ring"></div>
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className="review-card">
                                    <div className="card-header">
                                        <div className={`google-avatar`}>
                                            {review.author?.[0] || 'U'}
                                        </div>
                                        <div className="user-info">
                                            <div className="user-name">{review.author}</div>
                                            <div className="user-meta">{review.date || review.createdAt}</div>
                                        </div>
                                        <div className="platform-tag">{review.source || 'NAVER'}</div>
                                    </div>
                                    <div className="review-rating">
                                        {"★".repeat(review.rating || 5)}
                                    </div>
                                    <p className="review-text-content">
                                        {review.text || review.content}
                                    </p>
                                    {(review.img || review.imageUrl) && (
                                        <div className="review-image-wrapper">
                                            <img src={review.img || review.imageUrl} alt="Review" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        
                        {/* AI Summary Card as it is in live CSS */}
                        <div className="review-card ai-summary-card">
                            <div className="ai-badge">AI INSIGHT</div>
                            <h3 className="ai-title">Review Summary</h3>
                            <p className="ai-desc">Based on {totalCount} reviews from our customers.</p>
                            <ul className="ai-points">
                                <li><span className="dot"></span> {t('reviews.ai_summary.bullet1')}</li>
                                <li><span className="dot"></span> {t('reviews.ai_summary.bullet2')}</li>
                                <li><span className="dot"></span> {t('reviews.ai_summary.bullet3')}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <button className="slider-arrow right" onClick={() => scrollSlider('right')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </button>
            </div>

            <div className="review-footer-actions">
                <div className="review-write-buttons">
                    <a href="https://map.naver.com" target="_blank" rel="noopener noreferrer" className="btn-review btn-naver-review">
                        Write a Naver Review
                    </a>
                    <a href="https://g.page" target="_blank" rel="noopener noreferrer" className="btn-review btn-google-review">
                        Write a Google Review
                    </a>
                </div>
                <a href="/" className="report-link">Back to Home</a>
            </div>
        </div>
    );
};

export default Reviews;
