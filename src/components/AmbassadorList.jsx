import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import './AmbassadorList.css';

const AmbassadorList = () => {
  const [ambassadors, setAmbassadors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [activeBatch, setActiveBatch] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [zoomedIndex, setZoomedIndex] = useState(null);

  const FILTERS = ['ALL', 'WOMAN', 'MAN'];
  
  const getDisplayCategory = (cat) => {
    if (cat === 'WOMAN' || cat === 'MAN') return 'FITORIALIST+';
    return cat;
  };

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

  const uniqueBatches = Array.from(new Set(ambassadors.map(a => a.batch || '1st'))).sort((a, b) => b.localeCompare(a));

  const filteredByBatch = activeBatch === 'ALL'
    ? ambassadors
    : ambassadors.filter(a => (a.batch || '1st') === activeBatch);

  const finalFiltered = activeFilter === 'ALL'
    ? filteredByBatch
    : filteredByBatch.filter(a => a.category === activeFilter);

  return (
    <div className="ambassador-list-page">
      <div className="al-header">
        <h1 className="al-title">AMBASSADORS</h1>
        <p className="al-subtitle">FITORIAL+ AMBASSADOR LIST</p>
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
          finalFiltered.map(a => (
            <div key={a.id} className="al-card" onClick={() => setSelected(a)}>
              <div className="al-card-img">
                {a.profileImage ? (
                  <img src={a.profileImage} alt={a.nameEn} loading="lazy" />
                ) : (
                  <div className="al-card-no-img">NO IMAGE</div>
                )}
                {a.nationality && <span className="al-card-nationality-overlay">{a.nationality}</span>}
              </div>
              <div className="al-card-info">
                <span className="al-card-name">{a.nameEn}</span>
                {a.job && <span className="al-card-job">{a.job}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="al-modal-overlay" onClick={() => setSelected(null)}>
          <div className="al-modal" onClick={() => setSelected(null)}>
            <button className="al-modal-close" onClick={() => setSelected(null)}>×</button>
            <div className="al-modal-inner">
              <div className="al-modal-img-col">
                {selected.mainImage
                  ? <img src={selected.mainImage} alt={selected.nameEn} />
                  : <div className="al-modal-no-img">NO PHOTO</div>
                }
              </div>
              <div className="al-modal-info-col" onClick={e => e.stopPropagation()}>
                <p className="al-modal-badge">{selected.nationality}</p>
                <h2 className="al-modal-name"><strong>{selected.nameEn}</strong></h2>
                {selected.nameKr && <p className="al-modal-name-kr">{selected.nameKr}</p>}
                {selected.job && <p className="al-modal-job">{selected.job}</p>}
                {selected.bio && <p className="al-modal-bio">{selected.bio}</p>}

                <div className="al-modal-stats">
                  {selected.height && <div className="al-stat"><span>Height</span><strong>{selected.height}</strong></div>}
                  {selected.bust && <div className="al-stat"><span>Bust</span><strong>{selected.bust}</strong></div>}
                  {selected.waist && <div className="al-stat"><span>Waist</span><strong>{selected.waist}</strong></div>}
                  {selected.hips && <div className="al-stat"><span>Hips</span><strong>{selected.hips}</strong></div>}
                  {selected.shoes && <div className="al-stat"><span>Shoes</span><strong>{selected.shoes}</strong></div>}
                  {selected.hair && <div className="al-stat"><span>Hair</span><strong>{selected.hair}</strong></div>}
                  {selected.eyes && <div className="al-stat"><span>Eyes</span><strong>{selected.eyes}</strong></div>}
                </div>

                <div className="al-modal-socials">
                  {selected.instagram && (
                    <a href={`https://instagram.com/${selected.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="al-social-btn">
                      Instagram
                    </a>
                  )}
                  {selected.tiktok && (
                    <a href={`https://tiktok.com/@${selected.tiktok.replace('@', '')}`} target="_blank" rel="noreferrer" className="al-social-btn">
                      TikTok
                    </a>
                  )}
                </div>

                {selected.portfolio && selected.portfolio.length > 0 && (
                  <div className="al-modal-portfolio">
                    <p className="al-portfolio-label">PORTFOLIO</p>
                    <div className="al-portfolio-grid">
                      {selected.portfolio.map((p, i) => (
                        <img 
                          key={i} 
                          src={p.url || p} 
                          alt={`portfolio-${i}`} 
                          onClick={() => setZoomedIndex(i)}
                          style={{ cursor: 'zoom-in' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {zoomedIndex !== null && selected && selected.portfolio && (
        <div className="al-zoom-overlay" onClick={() => setZoomedIndex(null)}>
          <button className="al-zoom-nav al-prev" onClick={(e) => {
            e.stopPropagation();
            setZoomedIndex((zoomedIndex - 1 + selected.portfolio.length) % selected.portfolio.length);
          }}>
            ‹
          </button>
          
          <div className="al-zoom-content" onClick={e => e.stopPropagation()}>
            <img 
              src={selected.portfolio[zoomedIndex].url || selected.portfolio[zoomedIndex]} 
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
        </div>
      )}
    </div>
  );
};

export default AmbassadorList;
