import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import FadeInSection from './FadeInSection';
import { useTranslation } from 'react-i18next';
import './AmbassadorList.css';


const AmbassadorList = () => {
  const [ambassadors, setAmbassadors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [activeBatch, setActiveBatch] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const { t } = useTranslation();
  const [zoomedIndex, setZoomedIndex] = useState(null);
  const [showSwipeGuide, setShowSwipeGuide] = useState(false);
  const touchStart = React.useRef(null);
  const portfolioRefs = React.useRef([]);

  // Clear portfolio refs when selected changes
  useEffect(() => {
    portfolioRefs.current = [];
  }, [selected]);


  const FILTERS = ['ALL', 'WOMAN', 'MAN'];
  

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

  // Lock ALL scroll containers when detail modal or zoom is open
  useEffect(() => {
    const snapContainer = document.querySelector('.snap-container');
    const section = document.getElementById('ambassadors');
    
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


  return (
    <div className="ambassador-list-page">
      <div className="al-header">
        <h1 className="al-title">AMBASSADORS</h1>
        <p className="al-subtitle">AMBASSADOR LIST</p>
      </div>

      <div className="al-filter-section">
        <div className="al-batch-selector">
          {uniqueBatches.map(b => (
            <span
              key={b}
              className={`al-batch-item ${activeBatch === b ? 'active' : ''}`}
              onClick={() => setActiveBatch(b)}
            >
              {b}
            </span>
          ))}
        </div>
        <div className="al-filter-bar">
          <div className="al-filters">
            {FILTERS.map(f => (
              <span
                key={f}
                className={`al-filter ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

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
              <div className="al-card" onClick={() => setSelected(a)}>
                <div className="al-card-img">
                  {(a.mainImage || a.imageUrl)
                    ? <img src={a.mainImage || a.imageUrl} alt={a.nameEn} />
                    : <div className="al-card-no-img">NO PHOTO</div>
                  }
                </div>
                <div className="al-card-info">
                  <span className="al-card-name">{a.nameEn}</span>
                  {a.job && <span className="al-card-job">{a.job}</span>}
                </div>
              </div>
            </FadeInSection>
          ))

        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="al-modal-overlay" onClick={() => setSelected(null)}>
          <div className="al-modal" onClick={(e) => e.stopPropagation()} id="al-modal-root">
            <button className="al-modal-close" onClick={() => setSelected(null)}>✕</button>
            <div className="al-modal-content">
              {/* Header: Name and Stats */}
              <div className="al-modal-header-ford">
                <h2 className="al-modal-name-ford">
                  <em>{selected.nameEn?.toLowerCase()}</em>
                  <span className="al-modal-name-kr-ford">{selected.nameKr}</span>
                </h2>

                <div className="al-modal-hero-ford">
                  <img src={selected.mainImage || selected.imageUrl} alt={selected.nameEn} />
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
                      >
                        @{selected.instagram.replace('@','')}
                      </a>
                    </div>
                  )}
                </div>

                {/* Right Side: Masonry Gallery */}
                <div className="al-modal-gallery-ford">
                  <div className="al-masonry-grid">
                    {selected.portfolio
                      ?.filter(img => {
                        const url = img.url || img;
                        return !!url && url !== (selected.mainImage || selected.imageUrl);
                      })
                      .map((img, idx) => (
                        <div 
                          key={idx} 
                          className="al-masonry-item al-animate-item"
                          onClick={() => setZoomedIndex(idx)}
                          style={{ animationDelay: `${(idx % 8) * 0.15 + 0.2}s` }}
                        >
                          <img src={img.url || img} alt={`Portfolio ${idx}`} loading="lazy" />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
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

    </div>
  );
};

export default AmbassadorList;
