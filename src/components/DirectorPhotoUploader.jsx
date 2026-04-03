import React, { useState, useEffect } from 'react';
import { uploadOptimizedImage } from '../utils/uploadService';
import { db } from '../utils/firebase'; 
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { STORES } from '../utils/db';

function DirectorPhotoUploader() {
  const [selectedFiles, setSelectedFiles] = useState([]); 
  const [uploadStatus, setUploadStatus] = useState([]); 
  const [isUploading, setIsUploading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, STORES.DIRECTOR), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error loading activities:', err);
    }
    setLoading(false);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    
    const newStatus = files.map(file => ({
      name: file.name,
      status: '대기 중',
      url: null
    }));
    setUploadStatus(prev => [...prev, ...newStatus]);
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadStatus(prev => prev.map((item, idx) => idx === i ? { ...item, status: '최적화 및 업로드 중...' } : item));

      try {
        const { url, path } = await uploadOptimizedImage(file, 'director_activities');
        
        await addDoc(collection(db, STORES.DIRECTOR), {
          url,
          storagePath: path,
          createdAt: serverTimestamp(),
          order: Date.now()
        });

        setUploadStatus(prev => prev.map((item, idx) => idx === i ? { ...item, status: '완료! ✨' } : item));
      } catch (err) {
        setUploadStatus(prev => prev.map((item, idx) => idx === i ? { ...item, status: '실패 ❌' } : item));
      }
    }

    setIsUploading(false);
    setSelectedFiles([]);
    loadActivities();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 이 활동 사진을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, STORES.DIRECTOR, id));
      loadActivities();
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="director-uploader">
      <div className="upload-controls" style={{ marginBottom: 30, padding: 25, background: '#fff', borderRadius: 16, border: '1px solid #eee' }}>
        <h4 style={{ margin: '0 0 15px' }}>활동 사진 추가 (Activity Photos)</h4>
        <input 
          type="file" 
          multiple 
          onChange={handleFileChange} 
          disabled={isUploading}
          style={{ marginBottom: 15, display: 'block' }}
        />
        <button 
          className="submit-btn" 
          onClick={handleStartUpload} 
          disabled={isUploading || selectedFiles.length === 0}
          style={{ width: 'auto', padding: '10px 30px' }}
        >
          {isUploading ? '업로드 중...' : '업로드 시작'}
        </button>

        {uploadStatus.length > 0 && (
          <ul style={{ marginTop: 20, fontSize: '0.9rem', color: '#666', listStyle: 'none', padding: 0 }}>
            {uploadStatus.map((s, i) => (
              <li key={i} style={{ marginBottom: 5 }}>{s.name}: <strong>{s.status}</strong></li>
            ))}
          </ul>
        )}
      </div>

      <div className="activity-list">
        <h4 style={{ marginBottom: 20 }}>현재 활동 사진 목록</h4>
        {loading ? <p>로딩 중...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 15 }}>
            {activities.map(act => (
              <div key={act.id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', border: '1px solid #eee' }}>
                <img src={act.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  onClick={() => handleDelete(act.id)}
                  style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(231, 76, 60, 0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: '12px' }}
                >
                  ×
                </button>
              </div>
            ))}
            {activities.length === 0 && <p style={{ gridColumn: '1/-1', color: '#999' }}>등록된 사진이 없습니다.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default DirectorPhotoUploader;
