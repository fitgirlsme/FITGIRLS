import React, { useState, useEffect } from 'react';
import { fetchData } from '../utils/dataService';
import './Notice.css';

const Notice = () => {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const getNotices = async () => {
      const data = await fetchData('notices', 'createdAt', 'desc', 3);
      setNotices(data);
    };
    getNotices();
  }, []);

  return (
    <section className="snap-section notice-section">
      <div className="container notice-content flex-center">
        <h2 className="notice-title">NOTICE & EVENT</h2>
        
        <div className="notice-list">
          {notices.map((item) => (
            <div key={item.id} className="notice-item">
              <span className="notice-item-title">{item.title}</span>
              <span className="notice-item-date">{item.date || (item.createdAt?.toDate?.()?.toLocaleDateString()) || ''}</span>
            </div>
          ))}
          {notices.length === 0 && <p className="empty-msg">등록된 공지사항이 없습니다.</p>}
        </div>

        <button className="btn-dashboard" onClick={() => window.location.href = '/admin'}>
          대시보드 이벤트 관리로 이동 ⚙️
        </button>
      </div>
    </section>
  );
};

export default Notice;
