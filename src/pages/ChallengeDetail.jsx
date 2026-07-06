import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import SupportCS from '../components/SupportCS';
import Footer from '../components/Footer';
import { getData, STORES } from '../utils/db';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import './ChallengeDetail.css';

const formatPrice = (val) => {
    if (!val) return '';
    const valStr = val.toString().trim();
    if (valStr.includes('원') || valStr.includes(',')) {
        return valStr;
    }
    const num = parseInt(valStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return valStr;
    return num.toLocaleString() + '원';
};

const ChallengeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const fetchChallengeDetail = async () => {
            try {
                // 1. IndexedDB에서 개별 id 조회 시도
                const localData = await getData(STORES.CHALLENGES);
                if (localData && localData.length > 0) {
                    const found = localData.find(item => item.id === id);
                    if (found) {
                        setChallenge(found);
                        setLoading(false);
                        return;
                    }
                }
            } catch (err) {
                console.error('IndexedDB single fetch error:', err);
            }

            // 2. 로컬에 데이터가 없으면 Firestore에서 직접 로드
            try {
                const docRef = doc(db, 'challenges', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setChallenge({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (err) {
                console.error('Firestore single fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchChallengeDetail();
    }, [id]);

    const handleScroll = (e) => {
        setIsScrolled(e.target.scrollTop > 50);
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    // 정가와 할인가 할인 비율 계산
    const getDiscountPercentage = () => {
        if (!challenge || !challenge.price || !challenge.discountedPrice) return null;
        const regNum = parseInt(challenge.price.replace(/[^0-9]/g, ''), 10);
        const disNum = parseInt(challenge.discountedPrice.replace(/[^0-9]/g, ''), 10);
        if (isNaN(regNum) || isNaN(disNum) || regNum <= disNum) return null;
        return Math.round(((regNum - disNum) / regNum) * 100);
    };

    if (loading) {
        return (
            <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' }}>
                상세 정보를 불러오는 중...
            </div>
        );
    }

    if (!challenge) {
        return (
            <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#111', gap: '20px' }}>
                <p>챌린지를 찾을 수 없습니다.</p>
                <a href="/" style={{ padding: '10px 20px', background: '#111', color: '#fff', textDecoration: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>홈으로</a>
            </div>
        );
    }

    const discountRate = getDiscountPercentage();

    return (
        <div className="app-container" onScroll={handleScroll} style={{ overflowY: 'auto', height: '100vh', background: '#ffffff' }}>
            <Header 
                isScrolled={isScrolled} 
                isOnHero={false} 
                changeLanguage={changeLanguage} 
                currentLang={i18n.language} 
            />
            
            <main style={{ paddingTop: '80px', minHeight: '101vh', background: '#ffffff', paddingBottom: '60px' }}>
                <section className="model-apply-section" style={{ padding: '40px 20px 20px' }}>
                    <div className="model-apply-container" style={{ maxWidth: '1000px' }}>
                        
                        {/* 자이언트 에디토리얼 헤더 단독 추가 */}
                        <div className="challenges-header" style={{ marginBottom: '45px', textAlign: 'center' }}>
                            <p className="subtitle" style={{ letterSpacing: '0.4em', fontSize: '0.8rem', color: '#ff3b30' }}>스페셜 프로젝트</p>
                            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, fontFamily: 'Playfair Display, serif', color: '#111', marginTop: '10px' }}>FITGIRLS CHALLENGE</h1>
                        </div>

                        <div className="challenge-detail-split-container">
                            {/* Left Panel: Cover Image(s) */}
                            <div className="challenge-detail-image-panel">
                                {challenge.imageUrls && challenge.imageUrls.length > 0 ? (
                                    challenge.imageUrls.map((url, idx) => (
                                        <img key={idx} src={url} alt="" />
                                    ))
                                ) : challenge.imageUrl ? (
                                    <img src={challenge.imageUrl} alt="" />
                                ) : (
                                    <div style={{ background: '#f5f5f5', aspectRatio: '3/4', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>이미지 없음</div>
                                )}
                            </div>

                            {/* Right Panel: Content Box */}
                            <div className="challenge-detail-info-panel">
                                <div className="challenge-detail-meta">
                                    <h2 style={{ marginTop: '0', color: '#111' }}>{challenge.title}</h2>
                                    <p className="challenge-detail-period" style={{ color: '#555' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#FF3B30', marginRight: '6px' }}>
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <span style={{ color: '#555' }}>{challenge.period}</span>
                                    </p>
                                </div>

                                <div className="challenge-detail-desc-box">
                                    <div 
                                        className="challenge-detail-desc ql-editor" 
                                        dangerouslySetInnerHTML={{ __html: challenge.detail }}
                                    />
                                </div>

                                {/* Price Box */}
                                {(challenge.price || challenge.discountedPrice) && (
                                    <div className="challenge-detail-price-box">
                                        {challenge.price && (
                                            <div className="price-row-item">
                                                <span className="price-lbl">정가</span>
                                                <span className="price-val reg">{formatPrice(challenge.price)}</span>
                                            </div>
                                        )}
                                        {challenge.discountedPrice && (
                                            <div className="price-row-item">
                                                <span className="price-lbl">할인가</span>
                                                <span className="price-val dis">{formatPrice(challenge.discountedPrice)}</span>
                                            </div>
                                        )}
                                        {discountRate && (
                                            <div className="price-disc-tag">
                                                스페셜 혜택 {discountRate}% 할인
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Call to Action Button */}
                                {challenge.applyLink && (
                                    <a 
                                        href={challenge.applyLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="challenge-apply-split-btn"
                                    >
                                        <span>지금 예약하기 (네이버 예약)</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* 하단 이동 및 네비게이션 */}
                        <div className="model-list-link-container" style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                            <a href="/" className="model-list-link-btn" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 30px',
                                background: 'transparent',
                                border: '1px solid #ddd',
                                borderRadius: '30px',
                                color: '#111',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                transition: 'all 0.3s'
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                <span>홈으로</span>
                            </a>
                        </div>

                    </div>
                </section>
            </main>
            
            <SupportCS />
            <Footer isHidden={false} />
        </div>
    );
};

export default ChallengeDetail;
