import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, orderBy, where, limit } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../utils/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Magazine.css';

const STORES = {
    ISSUES: 'issues',
    GALLERY: 'gallery'
};

const Magazine = () => {
    const { i18n } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [allModels, setAllModels] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [cols, setCols] = useState(2);
    const [isScrolled, setIsScrolled] = useState(false);

    // Responsive columns for gallery
    useEffect(() => {
        const updateCols = () => {
            const w = window.innerWidth;
            if (w >= 1440) setCols(5);
            else if (w >= 1024) setCols(4);
            else if (w >= 768) setCols(3);
            else setCols(2);
        };
        updateCols();
        window.addEventListener('resize', updateCols);
        return () => window.removeEventListener('resize', updateCols);
    }, []);

    // Load Issues & Models
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Issues
                const issueQ = query(collection(db, STORES.ISSUES), orderBy('createdAt', 'desc'));
                const issueSnap = await getDocs(issueQ);
                setIssues(issueSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // Models (for Comp Card)
                const modelSnap = await getDocs(collection(db, 'models'));
                setAllModels(modelSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error('Error loading initial data:', err);
            }
            setLoading(false);
        };
        loadInitialData();
    }, []);

    // URL 파라미터로 특정 이슈 자동 선택
    useEffect(() => {
        if (issues.length > 0) {
            const issueId = searchParams.get('id');
            if (issueId) {
                const found = issues.find(iss => iss.id === issueId);
                if (found) setSelectedIssue(found);
            }
        }
    }, [issues, searchParams]);

    // Load Photos for selected issue
    useEffect(() => {
        if (!selectedIssue) {
            setPhotos([]);
            return;
        }

        const loadPhotos = async () => {
            setLoading(true); // 사진 로딩 중에도 표시
            try {
                // 복합 인덱스 오류를 피하기 위해 orderBy를 쿼리에서 제외
                const q = query(
                    collection(db, STORES.GALLERY),
                    where('issueId', '==', selectedIssue.id),
                    limit(200) // 좀 더 넉넉하게 가져옴
                );
                const snap = await getDocs(q);
                let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                // 자바스크립트에서 정렬 (order 기준 오름차순, 없으면 createdAt 기준 내림차순)
                data.sort((a, b) => {
                    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
                    return timeB - timeA;
                });
                
                setPhotos(data);
            } catch (err) {
                console.error('Error loading photos:', err);
            }
            setLoading(false);
        };
        loadPhotos();
    }, [selectedIssue]);

    const handleIssueClick = (issue) => {
        setSelectedIssue(issue);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleModelClick = (e, model) => {
        e.stopPropagation();
        if (model) {
            const slug = model.nameEn?.toLowerCase().replace(/\s+/g, '-') || 'model';
            navigate(`/fitorialist/${slug}/${model.id}`);
        } else {
            // Fallback: 상세 페이지 상단(컴카드)으로 스크롤
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getModelForIssue = (issue) => {
        if (!issue) return null;
        let found = null;
        if (issue.modelId) {
            found = allModels.find(m => m.id === issue.modelId);
        }
        if (!found && issue.modelName) {
            found = allModels.find(m => m.nameKr === issue.modelName || m.nameEn?.toLowerCase() === issue.modelName.toLowerCase());
        }
        return found;
    };

    const closeLightbox = () => setLightboxIndex(null);
    const showPrev = (e) => {
        e.stopPropagation();
        setLightboxIndex(prev => prev > 0 ? prev - 1 : photos.length - 1);
    };
    const showNext = (e) => {
        e.stopPropagation();
        setLightboxIndex(prev => prev < photos.length - 1 ? prev + 1 : 0);
    };

    if (loading && issues.length === 0) {
        return (
            <div className="magazine-page loading">
                <Header />
                <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p>Loading FITORIALIST...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className={`magazine-page ${selectedIssue ? 'detail-mode' : ''} app-container`} onScroll={(e) => setIsScrolled(e.target.scrollTop > 50)} style={{ overflowY: 'auto', height: '100vh' }}>
            <Header 
                isScrolled={isScrolled} 
                isOnHero={false} 
                isHidden={false}
                changeLanguage={(lng) => i18n.changeLanguage(lng)}
                currentLang={i18n.language}
            />

            {!selectedIssue ? (
                /* 1. Issue List View */
                <div className="gallery-magazine-feed">
                    <div className="editorial-giant-logo">
                        <h1>FITORIALIST+</h1>
                    </div>
                    
                    <div className="magazine-feed-grid">
                        {issues.map((issue, index) => (
                            <div key={issue.id} className="magazine-issue-card" onClick={() => handleIssueClick(issue)}>
                                <div className="issue-cover-wrapper">
                                    <img src={issue.coverImg} alt={issue.title} />
                                </div>
                                <div className="issue-overlay">
                                    <div className="issue-info">
                                        <div className="issue-title-group">
                                            <span className="issue-number">ISSUE #{issues.length - index}</span>
                                            <span className="issue-model-name">
                                                {(() => {
                                                    const m = getModelForIssue(issue);
                                                    return m?.nameEn || issue.modelName;
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (() => {
                const activeModel = getModelForIssue(selectedIssue);
                const heroPhoto = photos.length > 0 ? (photos[0].imageUrl || photos[0].img) : selectedIssue.coverImg;
                const galleryPhotos = photos.length > 1 ? photos.slice(1) : photos;
                const relatedIssues = issues.filter(i => i.id !== selectedIssue.id).slice(0, 3);

                return (
                    /* 2. Editorial Detail View (Purple.fr Style) */
                    <div className="magazine-detail-view-integrated">
                        <button className="editorial-back-btn" onClick={() => setSelectedIssue(null)}>
                            ← BACK TO ARCHIVE
                        </button>

                        <div className="editorial-giant-logo">
                            <h1>FITORIALIST+</h1>
                        </div>

                        <div className="editorial-hero-section">
                            <img src={heroPhoto} alt="" className="editorial-hero-image" />
                        </div>

                        <div className="editorial-info-section">
                            <div className="editorial-label">FITORIALIST DIARY</div>
                            <h2 className="editorial-title">
                                {selectedIssue.title}
                                <span className="editorial-model-name" onClick={(e) => handleModelClick(e, activeModel)} style={{ cursor: 'pointer' }}>
                                    {activeModel?.nameEn || selectedIssue.modelName}
                                </span>
                            </h2>

                            <div className="editorial-metadata">
                                [ {
                                    (() => {
                                        const d = selectedIssue.createdAt?.toDate ? selectedIssue.createdAt.toDate() : new Date();
                                        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase().replace(/,/g, ' /');
                                    })()
                                } ]
                            </div>



                            {activeModel?.instagram && (
                                <div className="editorial-instagram-link">
                                    <a 
                                        href={`https://instagram.com/${activeModel.instagram.replace('@','')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'none', color: '#111', fontSize: '0.7rem', fontWeight: 800, borderBottom: '1px solid #111', paddingBottom: '2px' }}
                                    >
                                        @{activeModel.instagram.replace('@','')}
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="editorial-gallery-container">
                            {loading && photos.length <= 1 ? (
                                <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
                                    <p style={{ letterSpacing: '0.4em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Loading Gallery...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="editorial-masonry-grid">
                                        {galleryPhotos.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="editorial-masonry-item"
                                                onClick={() => setLightboxIndex(photos.indexOf(item))}
                                            >
                                                <img 
                                                    src={item.imageUrl || item.img} 
                                                    alt="" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {galleryPhotos.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
                                            <p>[ CONTENT UNDER CURATION ]</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* More Diary (Related Issues) Section */}
                        {relatedIssues.length > 0 && (
                            <div className="mag-related-section">
                                <div className="mag-related-label">More Fitorialist Diary</div>
                                <div className="mag-related-grid">
                                    {relatedIssues.map(issue => (
                                        <div key={issue.id} className="mag-related-card" onClick={() => handleIssueClick(issue)}>
                                            <img src={issue.coverImg} alt={issue.title} />
                                            <div className="mag-related-overlay">
                                                <div className="mag-related-meta">FITORIALIST DIARY</div>
                                                <div className="mag-related-issue-title">
                                                    {issue.title} — {(() => {
                                                        const m = getModelForIssue(issue);
                                                        return m?.nameEn || issue.modelName;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div className="lightbox-overlay" onClick={closeLightbox} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <button className="lightbox-close" onClick={closeLightbox} style={{
                        position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none',
                        color: '#fff', fontSize: '2rem', cursor: 'pointer'
                    }}>×</button>
                    
                    <button className="lightbox-prev" onClick={showPrev} style={{
                        position: 'absolute', left: '20px', background: 'none', border: 'none',
                        color: '#fff', fontSize: '3rem', cursor: 'pointer'
                    }}>‹</button>
                    
                    <div className="lightbox-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
                        <img 
                            src={photos[lightboxIndex].imageUrl || photos[lightboxIndex].img} 
                            alt="" 
                            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
                        />
                    </div>
                    
                    <button className="lightbox-next" onClick={showNext} style={{
                        position: 'absolute', right: '20px', background: 'none', border: 'none',
                        color: '#fff', fontSize: '3rem', cursor: 'pointer'
                    }}>›</button>

                    <div className="lightbox-counter" style={{
                        position: 'absolute', bottom: '20px', color: '#fff', fontSize: '0.9rem'
                    }}>
                        {lightboxIndex + 1} / {photos.length}
                    </div>
                </div>
            )}


            <Footer />
        </div>
    );
};

export default Magazine;
