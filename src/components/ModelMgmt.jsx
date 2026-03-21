import React, { useState, useEffect } from 'react';
import { getGalleries } from '../utils/galleryService';
import './ModelMgmt.css';

const ModelMgmt = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      // FITORIALIST.MGMT 섹션이므로 기본적으로 FITORIALIST 카테고리 데이터를 가져옴
      const data = await getGalleries(activeFilter === 'ALL' ? 'FITORIALIST' : activeFilter);
      setModels(data);
      setLoading(false);
    };
    fetchModels();
  }, [activeFilter]);

  return (
    <section className="snap-section mgmt-section">
      <div className="container mgmt-content">
        <div className="mgmt-header">
          <h2 className="mgmt-title">FITORIALIST.MGMT</h2>
          <p className="mgmt-subtitle">HIGH-END MODEL MANAGEMENT</p>
        </div>

        <div className="mgmt-filter-bar">
          <div className="mgmt-filters">
            {['ALL', 'WOMEN', 'MEN', 'ARTIST', 'FASHION', 'PORTRAIT'].map(filter => (
              <span 
                key={filter}
                className={`mgmt-filter ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </span>
            ))}
          </div>
          <div className="mgmt-search">
            <input type="text" placeholder="SEARCH NAME..." />
          </div>
        </div>

        <div className="mgmt-grid">
          {loading ? (
            <div className="mgmt-placeholder">모델 데이터를 불러오는 중입니다...</div>
          ) : (
            models.map(model => (
              <div key={model.id} className="model-card">
                <img src={model.imageUrl} alt={model.title || model.subCategory} />
                <div className="model-info">
                  <span className="model-name">{model.title || model.subCategory}</span>
                </div>
              </div>
            ))
          )}
          {!loading && models.length === 0 && (
            <div className="mgmt-placeholder">등록된 모델이 없습니다.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ModelMgmt;

