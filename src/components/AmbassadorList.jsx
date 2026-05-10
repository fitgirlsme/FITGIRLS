import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { db } from '../utils/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import FadeInSection from './FadeInSection';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Footer from './Footer';
import './AmbassadorList.css';


const AmbassadorList = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const { modelName, modelId } = useParams();
  const [ambassadors, setAmbassadors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [activeBatch, setActiveBatch] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [issues, setIssues] = useState([]);
  const [zoomedIndex, setZoomedIndex] = useState(null);
  const [showSwipeGuide, setShowSwipeGuide] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const touchStart = React.useRef(null);
  const portfolioRefs = React.useRef([]);
  const modalOverlayRef = React.useRef(null);

  // Sync selected with URL on load and changes
  useEffect(() => {
    if (ambassadors.length > 0) {
      if (modelId) {
        // High priority: Find by unique ID
        const found = ambassadors.find(a => a.id === modelId);
        setSelected(found || null);
      } else if (modelName) {
        // Fallback: Find by name slug (for backward compatibility)
        const found = ambassadors.find(a => 
          a.nameEn?.toLowerCase().replace(/\s+/g, '-') === modelName.toLowerCase()
        );
        setSelected(found || null);
      } else {
        setSelected(null);
      }
    }
  }, [ambassadors, modelName, modelId]);

  const handleSelect = (a) => {
    if (a) {
      const slug = a.nameEn?.toLowerCase().replace(/\s+/g, '-') || 'model';
      // If we are on the homepage (routes start without fitorialist), stay on the homepage
      if (location.pathname === '/' || !location.pathname.startsWith('/fitorialist')) {
        // Use 'ambassadors' as default section to ensure scrolling
        const currentSection = location.pathname.split('/')[1] || 'ambassadors';
        navigate(`/${currentSection}/${slug}/${a.id}`);
      } else {
        navigate(`/fitorialist/${slug}/${a.id}`);
      }
    } else {
      if (location.pathname === '/' || !location.pathname.startsWith('/fitorialist')) {
        const currentSection = location.pathname.split('/')[1] || '';
        navigate(`/${currentSection}`);
      } else {
        navigate('/fitorialist');
      }
    }
  };

  // Clear portfolio refs when selected changes
  useEffect(() => {
    portfolioRefs.current = [];
  }, [selected]);

  // Scroll listener for the modal top button
  useEffect(() => {
    const handleScroll = () => {
      if (modalOverlayRef.current) {
        setShowScrollTop(modalOverlayRef.current.scrollTop > 500);
      }
    };

    const overlay = modalOverlayRef.current;
    if (overlay) {
      overlay.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (overlay) {
        overlay.removeEventListener('scroll', handleScroll);
      }
    };
  }, [selected]);

  const scrollToTop = () => {
    if (modalOverlayRef.current) {
      modalOverlayRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  const FILTERS = ['ALL', 'WOMAN', 'MAN', 'MAGAZINE'];
  

  useEffect(() => {
    const fetchAmbassadors = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'models'), orderBy('createdAt', 'desc')));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAmbassadors(data);
        
        // Find all batches and set the latest one as default if possible
        const batches = Array.from(new Set(data.map(a => a.batch || '1st'))).sort((a, b) => String(b).localeCompare(String(a)));
        if (batches.length > 0) setActiveBatch(batches[0]);
      } catch (err) {
        console.error('Failed to load ambassadors:', err);
      }
      setLoading(false);
    };
    fetchAmbassadors();
  }, []);

  // Fetch issues for linking
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'issues'), orderBy('createdAt', 'desc')));
        setIssues(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Failed to load issues:', err);
      }
    };
    fetchIssues();
  }, []);

  const isStandalone = location.pathname.startsWith('/fitorialist');
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Lock ALL scroll containers when detail modal or zoom is open
  useEffect(() => {
    const snapContainer = document.querySelector('.snap-container');
    const section = document.getElementById('fitorialist');
    
    if (selected || zoomedIndex !== null) {
      document.body.style.overflow = 'hidden';
      if (snapContainer) snapContainer.style.overflow = 'hidden';
      if (section) section.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (snapContainer) snapContainer.style.overflow = '';
      if (section) section.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      if (snapContainer) snapContainer.style.overflow = '';
      if (section) section.style.overflow = '';
    };
  }, [selected, zoomedIndex]);

  // Show swipe guide when zoomed portfolio opens
  useEffect(() => {
    if (zoomedIndex !== null) {
      setShowSwipeGuide(true);
      const timer = setTimeout(() => setShowSwipeGuide(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [zoomedIndex !== null]); // only trigger on open/close, not index change

  const uniqueBatches = Array.from(new Set(ambassadors.map(a => a.batch || '1st'))).sort((a, b) => b.localeCompare(a));

  const filteredByBatch = activeBatch === 'ALL'
    ? ambassadors
    : ambassadors.filter(a => (a.batch || '1st') === activeBatch);

  const finalFiltered = activeFilter === 'ALL'
    ? filteredByBatch
    : filteredByBatch.filter(a => a.category === activeFilter);

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart.current - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe Left -> Next
        setZoomedIndex((prev) => (prev + 1) % selected.portfolio.length);
      } else {
        // Swipe Right -> Prev
        setZoomedIndex((prev) => (prev - 1 + selected.portfolio.length) % selected.portfolio.length);
      }
      if (e.cancelable) e.preventDefault();
    }
    touchStart.current = null;
  };


  const renderMissionText = () => {
    const text = t('ambassador.mission');
    if (!text || text === 'ambassador.mission') return null;

    const highlightsMap = {
      ko: ['자기애', '꾸준함', '자기관리', '직업윤리', '성장', '영향력', '책임감', '리더십', '긍정적인 영감'],
      en: ['self-love', 'consistency', 'self-management', 'professional ethics', 'grow constantly', 'influence', 'responsibility', 'leadership', 'positive inspiration'],
      ja: ['自己愛', '継続性', '自己管理', '職業倫理', '成長', '影響力', '責任感', 'リーダーシップ', '肯定的なインスピレーション'],
      zh: ['自爱', '持之以恒', '自我管理', '职业道德', '完善自我', '影响力', '责任感', '领导力', '积极灵感']
    };

    const currentLang = i18n.language?.split('-')[0] || 'ko';
    const highlights = highlightsMap[currentLang] || [];

    // Simple regex-based highlighting
    let parts = [text];
    highlights.forEach(word => {
      const newParts = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const regex = new RegExp(`(${word})`, 'gi');
          const split = part.split(regex);
          newParts.push(...split);
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return (
      <p className="al-grid-description-ford" style={{ marginTop: '10px', marginBottom: '20px', textAlign: 'center', whiteSpace: 'pre-wrap' }}>
        {parts.map((p, i) => {
          if (typeof p === 'string' && highlights.some(h => h.toLowerCase() === p.toLowerCase())) {
            return <span key={i} className="al-highlight-ford">{p}</span>;
          }
          return p;
        })}
      </p>
    );
  };

  const renderContent = () => (
    <div className={`ambassador-list-page ${isStandalone ? 'standalone' : ''}`} id="fitorialist">
      <div className="al-editorial-logo">
        <h1>FITORIALIST+</h1>
      </div>
      
      <div className="al-filter-section">
        <div className="al-batch-selector">
          {uniqueBatches.map(b => (
            <span
              key={b}
              className={`al-batch-item ${activeBatch === b ? 'active' : ''}`}
              onClick={() => setActiveBatch(b)}
            >
              {b} AMBASSADOR LIST
            </span>
          ))}
        </div>
        {renderMissionText()}
        <div className="al-filter-bar">
          <div className="al-filters">
            {FILTERS.map(f => (
              <span
                key={f}
                className={`al-filter ${activeFilter === f ? 'active' : ''} ${f === 'MAGAZINE' ? 'mag-tab' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>


      {/* Magazine Issues View (Only in MAGAZINE tab) */}
      {activeFilter === 'MAGAZINE' && (
        issues.length === 0 ? (
          <div className="al-placeholder" style={{ padding: '40px 0', textAlign: 'center' }}>등록된 매거진이 없습니다.</div>
        ) : (
          <div className="al-featured-magazine" style={{ width: '100%', borderTop: 'none', paddingTop: 0 }}>
            <div className="al-section-header">
              <h3 className="al-section-subtitle">NEW GEN of FITGIRLS.</h3>
              <h2 className="al-section-title">MAGAZINES</h2>
              <Link to="/magazine" className="al-view-all-btn">VIEW ALL MAGAZINES →</Link>
            </div>
            <div className="al-magazine-grid">
              {issues.map((issue, idx) => (
                <Link 
                  key={issue.id} 
                  to={`/magazine?id=${issue.id}`} 
                  className="al-mag-card"
                >
                  <div className="al-mag-card-img">
                    <img src={issue.coverImg} alt={issue.title} />
                  </div>
                  <div className="al-mag-card-info">
                    <span className="al-mag-issue-num">ISSUE #{issues.length - idx}</span>
                    <span className="al-mag-model-name">{issue.modelName}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      )}

      {activeFilter !== 'MAGAZINE' && (
        <div className="al-grid-wrapper-ford">
          <div className="al-grid">
          {loading ? (
            <div className="al-placeholder">불러오는 중...</div>
          ) : finalFiltered.length === 0 ? (
            <div className="al-placeholder">등록된 앰버서더가 없습니다.</div>
          ) : (
            finalFiltered.map((a, index) => (
            <FadeInSection 
              key={a.id} 
              delay={(index % 10) * 0.1}
            >
              <div className="al-card" onClick={() => handleSelect(a)}>
                <div className="al-card-img">
                  {(a.mainImage || a.imageUrl)
                    ? <img src={a.mainImage || a.imageUrl} alt={a.nameEn} />
                    : <div className="al-card-no-img">NO PHOTO</div>
                  }
                </div>
                <div className="al-card-info">
                  <span className="al-batch-label-ford">{a.batch || activeBatch} FITORIALIST+</span>
                  <span className="al-card-name">{a.nameEn}</span>
                  {a.job && <span className="al-card-job">{a.job}</span>}
                  <div className="al-card-meta">
                    <div className="al-card-name-group-ford">
                      <span className="al-card-name-kr">{a.nameKr}</span>
                    </div>
                    {a.nationality && <span className="al-card-nationality">{a.nationality}</span>}
                  </div>
                </div>
              </div>
            </FadeInSection>
          ))
          )}
        </div>
      </div>
      )}



      {/* Detail Modal */}
      {selected && (
        <div 
          className="al-modal-overlay" 
          onClick={() => handleSelect(null)}
          ref={modalOverlayRef}
        >
          <div className="al-modal" id="al-modal-root">
            <button className="al-modal-close" onClick={() => handleSelect(null)}>
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="al-modal-content">
              {/* Header: Name and Stats */}
              <div className="al-modal-header-ford">
                <h2 className="al-modal-name-ford">
                  <em>{selected.nameEn?.toLowerCase()}</em>
                </h2>

                <div className="al-modal-hero-ford">
                  <img src={selected.mainImage || selected.imageUrl} alt={selected.nameEn} loading="eager" />
                </div>

                {selected.job && <div className="al-modal-job-centered-ford">{selected.job}</div>}

                <div className="al-modal-label-row-ford">
                  <div className="al-modal-label-group-ford">
                    <span className="al-modal-label-ford">{selected.batch || activeBatch} FITORIALIST+ AMBASSADORIST</span>
                    {selected.bio && (
                      <div className="al-modal-bio-label-ford">
                        <p>{selected.bio}</p>
                      </div>
                    )}
                  </div>
                  <div className="al-modal-name-group-ford">
                    <span className="al-modal-name-kr-ford">{selected.nameKr}</span>
                    {selected.nationality && <span className="al-modal-nationality-small-ford">{selected.nationality}</span>}
                  </div>
                </div>

                <div className="al-modal-stats-ford">
                  {selected.height && <div className="al-stat-item"><span>{t('ambassador.profile.height')}</span><strong>{selected.height}</strong></div>}
                  {selected.bust && <div className="al-stat-item"><span>{t('ambassador.profile.bust')}</span><strong>{selected.bust}</strong></div>}
                  {selected.waist && <div className="al-stat-item"><span>{t('ambassador.profile.waist')}</span><strong>{selected.waist}</strong></div>}
                  {selected.hips && <div className="al-stat-item"><span>{t('ambassador.profile.hips')}</span><strong>{selected.hips}</strong></div>}
                  {selected.shoes && <div className="al-stat-item"><span>{t('ambassador.profile.shoes')}</span><strong>{selected.shoes}</strong></div>}
                  {selected.hair && <div className="al-stat-item"><span>{t('ambassador.profile.hair')}</span><strong>{selected.hair}</strong></div>}
                  {selected.eyes && <div className="al-stat-item"><span>{t('ambassador.profile.eyes')}</span><strong>{selected.eyes}</strong></div>}
                </div>

                {/* Official Magazine Issue Link Button */}
                {issues.some(iss => iss.modelName === selected.nameKr) && (
                  <div className="al-modal-issue-link-box" onClick={(e) => e.stopPropagation()}>
                    {issues.filter(iss => iss.modelName === selected.nameKr).map(iss => (
                      <button 
                        key={iss.id}
                        className="al-official-issue-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/magazine?id=${iss.id}`);
                        }}
                      >
                        <span className="btn-label">VIEW OFFICIAL ISSUE</span>
                        <span className="btn-title">{iss.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="al-modal-body-ford">
                {/* Left Side: Labels and IG */}
                <div className="al-modal-side-ford">
                  <div className="al-side-label-clip">{t('ambassador.labels.portfolio')}</div>
                  {selected.instagram && (
                    <div className="al-side-social-ford">
                      <div className="al-side-label">{t('ambassador.labels.instagram')}</div>
                      <a 
                        href={`https://instagram.com/${selected.instagram.replace('@','')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="al-ig-link-ford"
                        onClick={(e) => e.stopPropagation()}
                      >
                        @{selected.instagram.replace('@','')}
                      </a>
                    </div>
                  )}
                </div>

                {/* Right Side: Masonry Gallery */}
                <div className="al-modal-gallery-ford">
                  <div className="al-masonry-grid">
                      {selected.portfolio && selected.portfolio.filter(img => !!img).map((img, idx) => (
                          <div key={idx} className="al-masonry-item">
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomedIndex(idx);
                              }}
                              className="al-masonry-img-wrapper al-double-render"
                              style={{ 
                                backgroundImage: `url(${img.url || img})`,
                              }}
                            >
                              <img 
                                src={img.url || img} 
                                alt={`Portfolio ${idx}`} 
                                loading={idx < 10 ? "eager" : "lazy"}
                                decoding={idx < 10 ? "sync" : "async"}
                              />
                            </div>
                          </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Scroll to Top Arrow */}
              {showScrollTop && (
                <button 
                  className={`al-scroll-top-btn ${showScrollTop ? 'visible' : ''}`} 
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToTop();
                  }}
                  aria-label="Scroll to top"
                >
                  <span className="al-arrow-up">↑</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {zoomedIndex !== null && selected && selected.portfolio && (
        <div 
          className="al-zoom-overlay" 
          onClick={() => setZoomedIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className="al-zoom-nav al-prev" onClick={(e) => {
            e.stopPropagation();
            setZoomedIndex((zoomedIndex - 1 + selected.portfolio.length) % selected.portfolio.length);
          }}>
            ‹
          </button>
          
          <div className="al-zoom-content">
            <img 
              key={zoomedIndex}
              src={selected.portfolio?.filter(img => !!img)[zoomedIndex]?.url || selected.portfolio?.filter(img => !!img)[zoomedIndex]} 
              alt="Zoomed" 
              className="al-zoomed-img" 
            />

          </div>


          <button className="al-zoom-nav al-next" onClick={(e) => {
            e.stopPropagation();
            setZoomedIndex((zoomedIndex + 1) % selected.portfolio.length);
          }}>
            ›
          </button>

          <button className="al-zoom-close" onClick={() => setZoomedIndex(null)}>×</button>

          {/* Swipe Guide (Gallery Style) */}
          {showSwipeGuide && (
            <div className="al-swipe-guide-overlay">
              <div className="al-swipe-finger-icon">
                <svg viewBox="0 0 100 100">
                  <path d="M50,80 C30,80 20,60 20,40 C20,20 35,10 50,10 C65,10 80,20 80,40 C80,60 70,80 50,80 Z" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
                  <circle cx="50" cy="50" r="8" fill="white" className="al-finger-anim" />
                </svg>
              </div>
              <p>SWIPE TO BROWSE</p>
            </div>
          )}
        </div>
      )}

      <Footer isHidden={isStandalone ? false : true} />
    </div>
  );

  if (isStandalone) {
    return (
      <div className="ambassador-list-page-standalone" onScroll={(e) => setIsScrolled(e.target.scrollTop > 50)} style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
        <Header 
            isScrolled={isScrolled} 
            isOnHero={false} 
            isHidden={false} 
            changeLanguage={(lng) => i18n.changeLanguage(lng)}
            currentLang={i18n.language}
        />
        <div style={{ paddingTop: '80px' }}>
            {renderContent()}
        </div>
      </div>
    );
  }

  return renderContent();
};

export default AmbassadorList;
