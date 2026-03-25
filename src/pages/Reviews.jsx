import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getReviews, getTotalReviewCount } from '../utils/reviewService';
import reviewsBackup from '../data/reviews_backup.json';
import './Reviews.css';

const ReviewCard = ({ review, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const content = review.text || review.content || '';
    const shouldShowMore = content.length > 120;

    return (
        <div className="review-card">
            <div className="card-header">
                <div className="user-profile-group">
                    <div className="naver-avatar">
                        {review.author?.[0] || 'U'}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{review.author}</div>
                        <div className="user-meta">{t('reviews.stats_fake', '리뷰 {{count1}} · 사진 {{count2}}', { count1: Math.floor(Math.random() * 20) + 1, count2: Math.floor(Math.random() * 10) + 1 })}</div>
                    </div>
                </div>
            </div>

            {(review.img || review.imageUrl) && (
                <div className="review-image-wrapper">
                    <img src={review.img || review.imageUrl} alt="Review" />
                </div>
            )}

            <div className="review-content-body">
                <h4 className="review-item-title">
                    {review.title || t('reviews.default_title', '핏걸즈&이너핏 스튜디오 예약')}
                </h4>
                <div className="review-text-wrapper">
                    <p className={`review-text-content ${isExpanded ? 'expanded' : ''}`}>
                        {content}
                    </p>
                    {shouldShowMore && !isExpanded && (
                        <button className="btn-show-more" onClick={() => setIsExpanded(true)}>
                            {t('reviews.show_more', '더보기')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

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
                
                let combinedReviews = [...reviewsData];
                const existingIds = new Set(reviewsData.map(r => r.id));
                
                // Backup reviews filtering/mapping by language
                const lang = i18n.language;
                const translatedBackup = reviewsBackup.map(backup => {
                    // Simple check for translations in backup data if they exist
                    // For now, we'll keep the original but show how it could be done
                    if (lang !== 'ko' && backup.translations?.[lang]) {
                        return {
                            ...backup,
                            text: backup.translations[lang].text,
                            title: backup.translations[lang].title
                        };
                    }
                    return backup;
                });

                translatedBackup.forEach(backup => {
                    if (!existingIds.has(backup.id)) {
                        combinedReviews.push(backup);
                    }
                });

                // Sort and set
                setReviews(combinedReviews);
                setTotalCount(Math.max(count, combinedReviews.length, reviewsBackup.length));
            } catch (error) {
                setReviews(reviewsBackup);
                setTotalCount(reviewsBackup.length);
            }
            setLoading(false);
        };
        initData();
    }, [i18n.language]);

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
                                <ReviewCard key={review.id} review={review} t={t} />
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
                    <a href="https://m.place.naver.com/place/1976065694/review/visitor" target="_blank" rel="noopener noreferrer" className="btn-review btn-naver-review">
                        {t('reviews.writeNaver', '네이버 리뷰 작성')}
                    </a>
                    <a href="https://share.google/zu3rKArDgSZmss9n4" target="_blank" rel="noopener noreferrer" className="btn-review btn-google-review">
                        {t('reviews.writeGoogle', '구글 리뷰 작성')}
                    </a>
                </div>
                <a href="/" className="back-to-main-btn">
                    <svg className="back-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span>HOME</span>
                </a>
            </div>
        </div>
    );
};


export default Reviews;
