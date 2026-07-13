import React, { useState } from 'react';
import { uploadOptimizedImage } from '../utils/uploadService';
import { db } from '../utils/firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { addItem, STORES } from '../utils/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
          index === i ? { ...item, status: 'AI 태그 분석 중... 🤖', url: optimizedUrl } : item
        ));

        // Gemini API를 사용한 이미지 자동 분석 및 태깅 + 멀티모달 임베딩 벡터 생성
        let aiTags = [];
        let imageEmbedding = null;
        try {
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (apiKey && apiKey.trim()) {
            const genAI = new GoogleGenerativeAI(apiKey);
            
            // 1. File Base64 변환
            const filePart = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve({
                inlineData: {
                  data: reader.result.split(',')[1],
                  mimeType: file.type
                }
              });
              reader.readAsDataURL(file);
            });

            // 2. AI 해시태그 추출 및 다국어 번역본 생성 (gemini-2.5-flash)
            let translations = { en: [], ja: [], zh: [] };
            try {
              const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" }
              });
              const prompt = `이 사진의 인물 포즈, 분위기, 장소, 의상(종류 및 색상) 등을 분석해서, 갤러리 검색용으로 적합한 상세 해시태그 단어를 한국어(ko), 영어(en), 일본어(ja), 중국어(zh)로 각각 추출해줘.
              결과는 다른 부연설명 없이 오직 순수한 JSON 포맷으로만 응답해야 해.
              JSON 스키마:
              {
                "ko": ["단어1", "단어2", ...],
                "en": ["word1", "word2", ...],
                "ja": ["ワード1", "ワード2", ...],
                "zh": ["词语1", "词语2", ...]
              }
              한국어(ko) 해시태그는 최대 8개까지로 하고, 영어/일본어/중국어는 한국어 단어를 직역 또는 그에 걸맞게 매칭하여 동일한 순서와 개수로 번역/대응해서 추출해줘. '#' 문자는 포함하지 마.`;
              
              const result = await model.generateContent([prompt, filePart]);
              const responseText = result.response.text();
              const parsed = JSON.parse(responseText);
              
              aiTags = parsed.ko || [];
              translations = {
                en: parsed.en || [],
                ja: parsed.ja || [],
                zh: parsed.zh || []
              };
              console.log(`[AI Auto-Tagging Success] File: ${file.name}, Tags:`, aiTags, 'Translations:', translations);
            } catch (aiError) {
              console.error(`[AI Auto-Tagging Failed] ${file.name} 자동 태깅 실패:`, aiError);
            }

            // 3. 이미지 임베딩 벡터 추출 (gemini-embedding-2)
            try {
              const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
              const embedResult = await embeddingModel.embedContent({
                content: {
                  parts: [
                    {
                      inlineData: {
                        data: filePart.inlineData.data,
                        mimeType: filePart.inlineData.mimeType
                      }
                    }
                  ]
                }
              });
              if (embedResult && embedResult.embedding && embedResult.embedding.values) {
                imageEmbedding = embedResult.embedding.values;
                console.log(`[AI Image Embedding Success] File: ${file.name}, Dimensions:`, imageEmbedding.length);
              }
            } catch (embedError) {
              console.error(`[AI Image Embedding Failed] ${file.name} 임베딩 벡터 생성 실패:`, embedError);
            }
          }
        } catch (aiOuterError) {
          console.error(`[AI Processing Outer Failed] ${file.name} AI 연동 실패:`, aiOuterError);
        }

        setUploadStatus(prev => prev.map((item, index) => 
          index === i ? { ...item, status: '업로드 완료! 🎉' } : item
        ));

        const parsedTags = tagsInput.split(/[ ,#]+/).filter(t => t.trim()).map(t => t.trim());
        const galleryData = {
          mainCategory: mainCategory,
          type: subCategory,
          issueId: issueId,
          tags: parsedTags,
          aiTags: aiTags, // AI 상세 태그 저장
          imageEmbedding: imageEmbedding, // AI 이미지 벡터 저장
          translations: translations, // 다국어 번역 저장
          seoTags: [...parsedTags, ...aiTags].join(', '), // SEO 최적화 (수동+AI 태그 결합)
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
          <select 
            value={mainCategory} 
            onChange={(e) => {
              const nextCat = e.target.value;
              setMainCategory(nextCat);
              if (nextCat === 'fashion') setSubCategory('fashion_item');
              else setSubCategory('women');
            }} 
            disabled={isUploading}
          >
            <option value="fitorialist">FITORIALIST</option>
            <option value="artist">ARTIST</option>
            <option value="fashion">FASHION & BEAUTY</option>
            <option value="portrait">PORTRAIT</option>
            <option value="self">NEVERLAND SELF</option>
          </select>
        </div>
        <div className="uploader-field">
          <label>게시판</label>
          <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} disabled={isUploading}>
            {mainCategory === 'fashion' ? (
              <>
                <option value="fashion_item">패션 (Fashion)</option>
                <option value="beauty_item">뷰티 (Beauty)</option>
                <option value="broadcast">방송&기업 (Broadcast)</option>
              </>
            ) : (
              <>
                <option value="women">여자 (Women)</option>
                <option value="men">남자 (Men)</option>
                <option value="couple">우정&커플</option>
                <option value="outdoor">발리프로젝트</option>
              </>
            )}
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
