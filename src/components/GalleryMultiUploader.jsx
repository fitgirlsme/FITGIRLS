import React, { useState } from 'react';
import { uploadOptimizedImage } from '../utils/uploadService';
import { db } from '../utils/firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { addItem, STORES } from '../utils/db';

function GalleryMultiUploader({ onUploadSuccess, issues = [] }) {
  const [selectedFiles, setSelectedFiles] = useState([]); 
  const [uploadStatus, setUploadStatus] = useState([]); 
  const [isUploading, setIsUploading] = useState(false);
  const [mainCategory, setMainCategory] = useState('fitorialist');
  const [subCategory, setSubCategory] = useState('women');
  const [issueId, setIssueId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Prevent browser from opening files dropped outside the dropzone
  React.useEffect(() => {
    const preventDefault = (e) => {
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'none';
        }
        e.preventDefault();
    };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    processFiles(files);
  };

  const processFiles = (newFiles) => {
    // Accumulate files instead of replacing
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    const newStatus = newFiles.map(file => ({
      name: file.name,
      status: '대기 중', 
      url: null
    }));
    setUploadStatus(prev => [...prev, ...newStatus]);
  };

  const removeFile = (index) => {
    if (isUploading) return;
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadStatus(prev => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    if (isUploading) return;
    setSelectedFiles([]);
    setUploadStatus([]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
    }
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isUploading) return;

    let files = [];
    
    // Attempt extraction from items first (modern browsers)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    } 
    // Fallback to files list
    if (files.length === 0 && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      files = Array.from(e.dataTransfer.files);
    }

    if (files.length > 0) {
      processFiles(files);
    }
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

        const parsedTags = tagsInput.split(/[ ,#]+/).filter(t => t.trim()).map(t => t.trim());
        const galleryData = {
          mainCategory: mainCategory,
          type: subCategory,
          issueId: issueId, // Added issueId
          tags: parsedTags,
          seoTags: parsedTags.join(', '),
          imageUrl: optimizedUrl,
          storagePath: storagePath,
          name: file.name,
          size: file.size,
          order: Date.now(),
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, STORES.GALLERY), galleryData);
        const newItem = { 
          ...galleryData, 
          id: docRef.id, 
          createdAt: Date.now(), 
          img: optimizedUrl 
        };
        await addItem(STORES.GALLERY, newItem);

        if (typeof onUploadSuccess === 'function') {
          onUploadSuccess(newItem);
        }

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
    <div className="admin-uploader-inner">
      <div className="admin-uploader-selectors">
        <div className="uploader-field">
          <label>대분류</label>
          <select value={mainCategory} onChange={(e) => setMainCategory(e.target.value)} disabled={isUploading}>
            <option value="fitorialist">FITORIALIST</option>
            <option value="artist">ARTIST</option>
            <option value="fashion">FASHION & BEAUTY</option>
            <option value="portrait">PORTRAIT</option>
          </select>
        </div>
        <div className="uploader-field">
          <label>게시판</label>
          <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} disabled={isUploading}>
            <option value="women">여자 (Women)</option>
            <option value="men">남자 (Men)</option>
            <option value="couple">우정&커플</option>
            <option value="outdoor">발리프로젝트</option>
          </select>
        </div>
        <div className="uploader-field">
          <label>매거진 이슈 (Optional)</label>
          <select value={issueId} onChange={(e) => setIssueId(e.target.value)} disabled={isUploading}>
            <option value="">이슈 미지정</option>
            {issues.map(iss => (
              <option key={iss.id} value={iss.id}>{iss.title} - {iss.modelName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="uploader-field" style={{ marginTop: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎨</span> 해시태그 (공백이나 #으로 구분)
        </label>
        <div className="uploader-tag-input-wrapper" style={{ position: 'relative' }}>
            <input 
              type="text" 
              value={tagsInput} 
              onChange={(e) => setTagsInput(e.target.value)} 
              placeholder="예: #오운완 #프로필 #바디프로필 (입력 후 업로드 시작)"
              disabled={isUploading}
              className="uploader-tag-input"
              style={{ 
                width: '100%',
                padding: '12px 14px', 
                border: '2px solid #eee', 
                borderRadius: '12px', 
                fontSize: '0.95rem',
                outline: 'none',
                background: '#fff',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
        </div>
      </div>

      <div className="uploader-file-area">
        <input 
          type="file" 
          id="uploader-file-input"
          accept="image/jpeg, image/png, image/webp, image/heic" 
          multiple  
          onChange={handleFileChange} 
          disabled={isUploading}
          style={{ display: 'none' }}
        />
        <label 
            htmlFor="uploader-file-input" 
            className={`uploader-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <span className="dropzone-icon">📷</span>
            <p className="dropzone-text">{selectedFiles.length > 0 ? `${selectedFiles.length}장의 사진 선택됨 (추가 가능)` : '클릭하거나 사진을 여기에 끌어다 대세요'}</p>
        </label>
      </div>

      {selectedFiles.length > 0 && !isUploading && (
        <div className="uploader-queue-actions">
          <button className="uploader-clear-btn" onClick={clearQueue}>목록 전체 삭제</button>
        </div>
      )}
      
      <button 
        className="uploader-submit-btn"
        onClick={handleStartUpload} 
        disabled={isUploading || selectedFiles.length === 0}
      >
        {isUploading ? `업로드 중... (${uploadStatus.filter(s=>s.status.includes('완료')).length}/${selectedFiles.length})` : `업로드 시작`}
      </button>

      <div className="uploader-status-list">
        <h4>업로드 현황</h4>
        {uploadStatus.length === 0 && <p className="status-empty">선택된 사진이 없습니다.</p>}
        <ul>
          {uploadStatus.map((item, index) => (
            <li key={index} className={item.status.includes('실패') ? 'error' : ''}>
              <div className="file-info-group">
                <span className="file-name">{item.name}</span>
                <span className={`status-text ${item.status.includes('완료') ? 'success' : ''}`}>
                  {item.status}
                </span>
              </div>
              {!isUploading && !item.status.includes('완료') && (
                <button className="remove-file-btn" onClick={() => removeFile(index)} title="삭제">
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GalleryMultiUploader;
