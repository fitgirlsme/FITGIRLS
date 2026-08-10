import React, { useState, useEffect } from 'react';
import { uploadOptimizedImage } from '../utils/uploadService';
import { db } from '../utils/firebase'; 
import { collection, addDoc, serverTimestamp, vector } from 'firebase/firestore';
import { addItem, getData, STORES } from '../utils/db';
import { generateEmbedding } from '../utils/aiService';

async function generateAiTags(file, apiKey) {
  // 1. File 객체를 base64로 변환
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
  const mimeType = file.type || 'image/jpeg';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  
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

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const resData = await response.json();
  const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }
  
  return JSON.parse(text.trim());
}

function GalleryMultiUploader({ onUploadSuccess, issues = [] }) {
  const [selectedFiles, setSelectedFiles] = useState([]); 
  const [uploadStatus, setUploadStatus] = useState([]); 
  const [isUploading, setIsUploading] = useState(false);
  const [mainCategory, setMainCategory] = useState('fitorialist');
  const [subCategory, setSubCategory] = useState('women');
  const [issueId, setIssueId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);

  // Load existing tags from IndexedDB for autocomplete suggestions
  useEffect(() => {
    const loadAvailableTags = async () => {
      try {
        const items = await getData(STORES.GALLERY);
        const tags = Array.from(new Set(items.flatMap(p => p.tags || []).map(t => `#${t.replace(/^#/, '')}`)));
        setAvailableTags(tags);
      } catch (err) {
        console.warn('Failed to load available tags for suggestions:', err);
      }
    };
    loadAvailableTags();
  }, []);

  // Suggestions computation
  const editTokens = tagsInput.split(/[ ,]+/);
  const currentToken = editTokens[editTokens.length - 1] || '';
  const currentTokenNorm = currentToken.trim().toLowerCase().replace(/^#/, '');
  
  const tagSuggestions = (currentTokenNorm && currentTokenNorm !== '')
      ? availableTags.filter(tag => 
          tag.toLowerCase().replace('#', '').includes(currentTokenNorm) && 
          tag.toLowerCase() !== `#${currentTokenNorm}`
        ).slice(0, 10)
      : [];

  const handleTagSuggestionClick = (suggestion) => {
      const tokens = [...editTokens];
      tokens[tokens.length - 1] = suggestion;
      let result = tokens.join(' ');
      if (!result.endsWith(' ')) result += ' ';
      setTagsInput(result);
  };

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

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      setUploadStatus(prev => prev.map((item, index) => 
        index === i ? { ...item, status: '최적화 중 (WebP 변환)...' } : item
      ));

      try {
        const { url: optimizedUrl, path: storagePath, thumbUrl, mobileThumbUrl } = await uploadOptimizedImage(file, 'galleries');

        setUploadStatus(prev => prev.map((item, index) => 
          index === i ? { ...item, status: 'AI 태그 생성 중...' } : item
        ));

        let aiTags = [];
        let translations = { en: [], ja: [], zh: [] };
        let aiError = null;

        if (apiKey) {
          try {
            const aiResult = await generateAiTags(file, apiKey);
            if (aiResult && aiResult.ko) {
              aiTags = aiResult.ko;
              translations = {
                en: aiResult.en || [],
                ja: aiResult.ja || [],
                zh: aiResult.zh || []
              };
            }
          } catch (aiErr) {
            console.warn("AI Tag generation failed, skipping:", aiErr);
            aiError = aiErr.message || String(aiErr);
          }
        } else {
          aiError = "VITE_GEMINI_API_KEY is not defined in environment variables";
        }

        setUploadStatus(prev => prev.map((item, index) => 
          index === i ? { ...item, status: '업로드 완료! 🎉', url: optimizedUrl } : item
        ));

        const parsedTags = tagsInput.split(/[ ,#]+/).filter(t => t.trim()).map(t => t.trim());
        const mergedSeoTags = [...parsedTags, ...aiTags].join(', ');

        const galleryData = {
          mainCategory: mainCategory,
          type: subCategory,
          issueId: issueId, // Added issueId
          tags: parsedTags,
          aiTags: aiTags,
          translations: translations,
          seoTags: mergedSeoTags,
          imageUrl: optimizedUrl,
          thumbUrl: thumbUrl || optimizedUrl,
          mobileThumbUrl: mobileThumbUrl || thumbUrl || optimizedUrl,
          storagePath: storagePath,
          name: file.name,
          size: file.size,
          order: Date.now(),
          createdAt: serverTimestamp()
        };

        if (aiError) {
          galleryData.aiError = aiError;
        }

        // Generate Embedding
        try {
          const semanticText = `${mainCategory} ${subCategory} ${mergedSeoTags}`.trim();
          if (semanticText) {
            const embeddingValues = await generateEmbedding(semanticText, apiKey);
            galleryData.embedding = vector(embeddingValues);
          }
        } catch (embedErr) {
          console.warn("Embedding generation failed, skipping:", embedErr);
          galleryData.embedError = embedErr.message || String(embedErr);
        }

        const docRef = await addDoc(collection(db, STORES.GALLERY), galleryData);
        const newItem = { 
          ...galleryData, 
          id: docRef.id, 
          createdAt: Date.now(), 
          img: optimizedUrl 
        };
        // IndexedDB(idb)는 Firestore의 VectorValue 객체를 직렬화(Clone)하지 못하므로, 
        // 로컬 DB 저장 전에는 해당 필드를 제거합니다.
        delete newItem.embedding;
        await addItem(STORES.GALLERY, newItem);

        if (typeof onUploadSuccess === 'function') {
          onUploadSuccess(newItem);
        }

      } catch (error) {
        console.error(`${file.name} 업로드 실패:`, error);
        setUploadStatus(prev => prev.map((item, index) => 
          index === i ? { ...item, status: `업로드 실패 ❌ (${error.message || '알 수 없는 오류'})` } : item
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
            {tagSuggestions.length > 0 && (
                <div className="tag-suggestions-dropdown" style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  background: '#fff', 
                  border: '1px solid #ddd', 
                  borderRadius: '12px', 
                  zIndex: 100, 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                  maxHeight: '150px', 
                  overflowY: 'auto',
                  marginTop: '4px'
                }}>
                    {tagSuggestions.map((tag, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleTagSuggestionClick(tag)}
                            style={{ padding: '10px 14px', fontSize: '0.9rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#333' }}
                            onMouseEnter={e => e.target.style.background = '#f5f5f5'}
                            onMouseLeave={e => e.target.style.background = '#fff'}
                        >
                            {tag}
                        </div>
                    ))}
                </div>
            )}
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
