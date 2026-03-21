import React, { useState } from 'react';
import { uploadOptimizedImage } from '../utils/uploadService';
import { db } from '../utils/firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { addItem, STORES } from '../utils/db';

function GalleryMultiUploader() {
  const [selectedFiles, setSelectedFiles] = useState([]); 
  const [uploadStatus, setUploadStatus] = useState([]); 
  const [isUploading, setIsUploading] = useState(false);
  const [mainCategory, setMainCategory] = useState('fitorialist');
  const [subCategory, setSubCategory] = useState('women');

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    
    const initialStatus = files.map(file => ({
      name: file.name,
      status: '대기 중', 
      url: null
    }));
    setUploadStatus(initialStatus);
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("업로드할 사진을 먼저 선택해 주세요, 대표님!");
      return;
    }

    setIsUploading(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      setUploadStatus(prev => prev.map((item, index) => 
        index === i ? { ...item, status: '최적화 중 (WebP 변환)...' } : item
      ));

      try {
        const { url: optimizedUrl, path: storagePath } = await uploadOptimizedImage(file, 'galleries');

        setUploadStatus(prev => prev.map((item, index) => 
          index === i ? { ...item, status: '업로드 완료! 🎉', url: optimizedUrl } : item
        ));

        const galleryData = {
          mainCategory: mainCategory,
          type: subCategory,
          tags: [],
          seoTags: '',
          imageUrl: optimizedUrl,
          storagePath: storagePath,
          name: file.name,
          size: file.size,
          order: Date.now(),
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, STORES.GALLERY), galleryData);
        await addItem(STORES.GALLERY, { ...galleryData, id: docRef.id, createdAt: new Date().toISOString() });

      } catch (error) {
        console.error(`${file.name} 업로드 실패:`, error);
        setUploadStatus(prev => prev.map((item, index) => 
          index === i ? { ...item, status: '업로드 실패 ❌' } : item
        ));
      }
    }

    setIsUploading(false);
    alert("모든 핏걸즈 화보 업로드 작업이 완료되었습니다!");
    setSelectedFiles([]); 
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>👟 핏걸즈 갤러리 멀티 업로드</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ marginRight: '10px' }}>대분류:</label>
        <select value={mainCategory} onChange={(e) => setMainCategory(e.target.value)} disabled={isUploading} style={{ marginRight: '20px', padding: '5px' }}>
          <option value="fitorialist">FITORIALIST</option>
          <option value="artist">ARTIST</option>
          <option value="fashion">FASHION & BEAUTY</option>
          <option value="portrait">PORTRAIT</option>
        </select>
        <label style={{ marginRight: '10px' }}>게시판(탭):</label>
        <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} disabled={isUploading} style={{ padding: '5px' }}>
          <option value="women">여자 (Women)</option>
          <option value="men">남자 (Men)</option>
          <option value="couple">우정&커플</option>
          <option value="outdoor">발리프로젝트</option>
        </select>
      </div>

      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp, image/heic" 
        multiple  
        onChange={handleFileChange} 
        disabled={isUploading}
        style={{ marginBottom: '10px' }}
      />
      
      <button 
        onClick={handleStartUpload} 
        disabled={isUploading || selectedFiles.length === 0}
        style={{
          padding: '8px 16px',
          backgroundColor: isUploading ? '#ccc' : '#e91e63', 
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          marginLeft: '10px'
        }}
      >
        {isUploading ? `업로드 중... (${uploadStatus.filter(s=>s.status.includes('완료')).length}/${selectedFiles.length})` : `화보 ${selectedFiles.length}장 업로드 시작`}
      </button>

      <div style={{ marginTop: '20px', maxHeight: '300px', overflowY: 'auto', borderTop: '1px solid #eee' }}>
        <h4 style={{ marginBottom: '10px' }}>업로드 현황</h4>
        {uploadStatus.length === 0 && <p style={{ color: '#888' }}>선택된 사진이 없습니다.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {uploadStatus.map((item, index) => (
            <li key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              borderBottom: '1px solid #eee',
              backgroundColor: item.status.includes('실패') ? '#fff1f1' : 'transparent'
            }}>
              <span style={{ fontWeight: '500', maxWidth: '60%' }} className="text-truncate">
                {item.name}
              </span>
              <span style={{ 
                color: item.status.includes('완료') ? '#4caf50' : item.status.includes('실패') ? '#f44336' : '#888',
                fontSize: '0.9rem'
              }}>
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GalleryMultiUploader;
