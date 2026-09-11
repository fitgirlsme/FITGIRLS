import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getReviews, getTotalReviewStats } from '../utils/reviewService';
import './Reviews.css';

const ReviewCard = ({ review, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const content = review.body || review.text || review.content || '';
    const shouldShowMore = content.length > 110;
    const rating = review.rating || 5;

    return (
        <div className="review-card">
            <div className="card-header">
                <div className="user-profile-group">
                    <div className={`naver-avatar ${review.source === 'google' ? 'google-avatar' : ''}`}>
                        {review.source === 'google' ? 'G' : (review.author?.[0] || 'N')}
                    </div>
                    <div className="user-info">
                        <div className="user-name-row">
                            <span className="user-name">{review.author}</span>
                            {review.source === 'naver' && (
                                <span className="source-badge naver-badge">NAVER</span>
                            )}
                            {review.source === 'google' && (
                                <span className="source-badge google-badge">GOOGLE</span>
                            )}
                            {review.brand === 'neverland' && (
                                <span className="brand-badge neverland-badge">NEVERLAND</span>
                            )}
                        </div>
                        <div className="user-meta">
                            <span className="rating-stars">{'★'.repeat(rating)}</span>
                            {review.created && <span className="review-date"> · {review.created}</span>}
                            {review.verified && <span className="verified-badge">인증방문</span>}
                        </div>
                    </div>
                </div>
            </div>

            {(review.img || review.imageUrl) && (
                <div className="review-image-wrapper">
                    <img src={review.img || review.imageUrl} alt="Review Photo" loading="lazy" />
                    {review.photos && review.photos.length > 1 && (
                        <span className="photo-count-badge">+{review.photos.length}</span>
                    )}
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

const ReviewGuide = ({ t }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`review-guide-container ${isOpen ? 'is-open' : ''}`}>
            <button className="guide-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                <span className="toggle-icon">✍️</span>
                <span className="toggle-text">리뷰 작성 가이드 {isOpen ? '접기' : '보기'}</span>
                <svg className={`chevron-icon ${isOpen ? 'up' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className="guide-content-wrapper">
                <div className="guide-content-inner">
                    <p className="guide-desc">아래 내용을 참고하여 더욱 풍성한 기록을 남겨보세요.</p>
                    <ul className="guide-questions">
                        <li><span>•</span> 가장 마음에 들었던 분위기는 어떤 느낌이었나요?</li>
                        <li><span>•</span> 촬영하면서 새롭게 발견한 모습이 있었나요?</li>
                        <li><span>•</span> 가장 만족했던 디렉팅이나 무드는 무엇이었나요?</li>
                        <li><span>•</span> 핏걸즈에서 어떤 FITORIAL을 남기셨나요?</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

const Reviews = () => {
    const { t, i18n } = useTranslation();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ totalCount: 800, photoCount: 250, avgRating: '4.95' });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    const filterTabs = [
        { id: 'all', label: 'ALL 전체' },
        { id: 'fitgirls', label: 'FITGIRLS 바디프로필' },
        { id: 'neverland', label: 'NEVERLAND 셀프' },
        { id: 'photo', label: '포토리뷰 📸' },
        { id: 'google', label: 'Google 리뷰' }
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const s = await getTotalReviewStats();
                setStats(s);
            } catch (err) {
                console.warn(err);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadReviews = async () => {
            setLoading(true);
            try {
                const data = await getReviews(activeTab);
                if (isMounted) {
                    setReviews(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Load reviews error:", err);
                if (isMounted) setLoading(false);
            }
        };
        loadReviews();
        return () => { isMounted = false; };
    }, [activeTab, i18n.language]);

    const scrollSlider = (direction) => {
        const track = document.querySelector('.review-slider-track');
        if (!track) return;
        const scrollAmount = direction === 'left' ? -400 : 400;
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    return (
        <div className="review-section-container">
            <header className="review-section-header">
                <span className="section-subtitle">REAL CUSTOMER REVIEWS</span>
                <h2 className="section-title">REVIEWS</h2>
            </header>

            {/* 실시간 리뷰 통계 바 */}
            <div className="review-stats-bar">
                <div className="stat-item">
                    <div className="stat-value">{stats.totalCount}+</div>
                    <div className="stat-label">Total Reviews</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                    <div className="stat-value">{stats.avgRating} / 5</div>
                    <div className="stat-label">Average Rating</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                    <div className="stat-value">{stats.photoCount}+</div>
                    <div className="stat-label">Photo Reviews</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                    <div className="stat-value">13y+</div>
                    <div className="stat-label">Experience</div>
                </div>
            </div>

            {/* 필터 탭 */}
            <div className="review-filter-tabs">
                {filterTabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`review-filter-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 리뷰 슬라이더 */}
            <div className="review-slider-wrapper">
                <button className="slider-arrow left" onClick={() => scrollSlider('left')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                
                <div className="review-slider-container">
                    <div className="review-slider-track">
                        {loading ? (
                            <div className="gallery-loading-spinner" style={{ padding: '60px 0' }}>
                                <div className="spinner-ring"></div>
                            </div>
                        ) : reviews.length > 0 ? (
                            reviews.map((review) => (
                                <ReviewCard key={review.id} review={review} t={t} />
                            ))
                        ) : (
                            <div className="no-reviews-msg" style={{ padding: '40px', color: '#888' }}>
                                선택하신 카테고리의 리뷰가 없습니다.
                            </div>
                        )}
                        
                        {/* AI Summary Card */}
                        <div className="review-card ai-summary-card">
                            <div className="ai-badge">AI INSIGHT</div>
                            <h3 className="ai-title">Review Summary</h3>
                            <p className="ai-desc">Based on {stats.totalCount}+ reviews from our customers.</p>
                            <ul className="ai-points">
                                <li><span className="dot"></span> {t('reviews.ai_summary.bullet1', '자연스럽고 고급스러운 디렉팅과 편안한 촬영 분위기')}</li>
                                <li><span className="dot"></span> {t('reviews.ai_summary.bullet2', '섬세한 체형 보정과 독보적인 감성 톤앤매너')}</li>
                                <li><span className="dot"></span> {t('reviews.ai_summary.bullet3', '첫 바디프로필이나 셀프 촬영도 화보처럼 완성')}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <button className="slider-arrow right" onClick={() => scrollSlider('right')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </button>
            </div>

            <div className="review-footer-actions">
                <ReviewGuide t={t} />
                <div className="review-write-buttons">
                    <a href="https://m.place.naver.com/place/1976065694/review/visitor" target="_blank" rel="noopener noreferrer" className="btn-review btn-naver-review">
                        {t('reviews.writeNaver', '네이버 리뷰 작성')}
                    </a>
                    <a href="https://share.google/zu3rKArDgSZmss9n4" target="_blank" rel="noopener noreferrer" className="btn-review btn-google-review">
                        {t('reviews.writeGoogle', '구글 리뷰 작성')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Reviews;
