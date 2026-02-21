import React, { useState } from 'react';
import { addGalleryItem } from '../utils/db';
import './Admin.css';

const Admin = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'admin123') {
            setIsLoggedIn(true);
            localStorage.setItem('isAdmin', 'true'); // 갤러리에서 관리자 UI 표시용
        } else {
            alert('비밀번호가 틀렸습니다.');
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="admin-page">
                <div className="login-box">
                    <h2>Admin Login</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            placeholder="비밀번호 입력"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="submit">접속</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page dashboard-active">
            <div className="admin-container">
                <header className="admin-header">
                    <h2>Dashboard</h2>
                    <button className="logout-btn" onClick={() => {
                        setIsLoggedIn(false);
                        localStorage.removeItem('isAdmin'); // 로그아웃 시 관리자 플래그 제거
                    }}>로그아웃</button>
                </header>
                <div className="admin-content">
                    <UploadForm />
                </div>
            </div>
        </div>
    );
};

const UploadForm = () => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [category, setCategory] = useState('women');
    const [hashtags, setHashtags] = useState('');
    const [showSuccess, setShowSuccess] = useState(false); // 업로드 성공 모달

    const [savedTags, setSavedTags] = useState(() => {
        const saved = localStorage.getItem('adminHashtags');
        return saved ? JSON.parse(saved) : ['#바디프로필', '#이너핏'];
    });

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) {
            setFile(null);
            setPreviewUrl(null);
            return;
        }

        setFile(selected);

        // 이미지 미리보기 생성
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(selected);

        // 동일 파일 재선택 가능하도록 DOM input 안전하게 리셋
        e.target.value = '';
    };

    const parsedTags = hashtags.split(/[\s,]+/).filter(Boolean);

    const handleTagClick = (tag) => {
        if (!parsedTags.includes(tag)) {
            if (parsedTags.length >= 3) {
                alert("해시태그는 최대 3개까지만 입력할 수 있습니다.");
                return;
            }
            setHashtags(prev => prev ? `${prev}, ${tag}` : tag);
        }
    };

    // 저장된 태그 데이터베이스에서 X로 제거
    const handleTagDelete = (tagToDelete) => {
        const updated = savedTags.filter(t => t !== tagToDelete);
        setSavedTags(updated);
        localStorage.setItem('adminHashtags', JSON.stringify(updated));
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (parsedTags.length > 3) {
            alert("해시태그는 최대 3개까지만 입력 가능합니다.");
            return;
        }

        if (!file) {
            alert("파일을 첨부해주세요.");
            return;
        }

        const newSavedTags = Array.from(new Set([...savedTags, ...parsedTags]));
        setSavedTags(newSavedTags);
        localStorage.setItem('adminHashtags', JSON.stringify(newSavedTags));

        try {
            // IndexedDB에 실제로 저장 (previewUrl = Base64 이미지 데이터)
            await addGalleryItem({
                type: category,
                tags: parsedTags,
                img: previewUrl,   // base64 data URL (FileReader로 이미 생성된 것)
                name: file.name,
                size: file.size,
            });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000); // 3초 후 자동 닫기
        } catch (err) {
            console.error('IndexedDB 저장 실패:', err);
            alert('저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
        }

        // 폼 초기화
        setFile(null);
        setPreviewUrl(null);
        setHashtags('');
    };

    return (
        <div className="upload-section">
            {/* 업로드 성공 인앱 팝업 */}
            {showSuccess && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    padding: '18px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    animation: 'slideDown 0.3s ease',
                    minWidth: '280px',
                }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <div>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>업로드 완료!</p>
                        <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>갤러리에서 확인해 보세요</p>
                    </div>
                    <button
                        onClick={() => setShowSuccess(false)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.2rem', marginLeft: 'auto' }}
                    >×</button>
                </div>
            )}
            <style>{`@keyframes slideDown { from { opacity:0; transform: translateX(-50%) translateY(-20px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>
            <h3>New Gallery Upload</h3>
            <div className="admin-form">

                <div className="form-group">
                    <label>1. 이미지 첨부 및 확인</label>
                    {/* 숨겨진 파일 input - ref로 제어 */}
                    <input
                        id="admin-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    {/* 클릭/드래그 모두 가능한 큰 드롭존 */}
                    <div
                        onClick={() => document.getElementById('admin-file-input').click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(255,80,80,0.8)'; }}
                        onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                            const dropped = e.dataTransfer.files[0];
                            if (dropped && dropped.type.startsWith('image/')) {
                                setFile(dropped);
                                const reader = new FileReader();
                                reader.onloadend = () => setPreviewUrl(reader.result);
                                reader.readAsDataURL(dropped);
                            }
                        }}
                        style={{
                            border: '2px dashed var(--color-border)',
                            borderRadius: '12px',
                            padding: '32px 20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s',
                            marginTop: '8px',
                            background: 'var(--color-surface)',
                        }}
                    >
                        <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>📷</p>
                        <p style={{ color: 'var(--color-text)', fontWeight: 'bold', margin: '0 0 4px' }}>클릭하거나 사진을 여기에 드래그하세요</p>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>JPG, PNG, HEIC 등 모든 이미지 형식 지원</p>
                    </div>


                    {previewUrl && (
                        <div style={{ marginTop: '15px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px', background: 'var(--color-surface)' }}>
                            <p className="success-text" style={{ marginBottom: '10px', fontWeight: 'bold' }}>✅ 파일 첨부 완료 (미리보기)</p>
                            <img
                                src={previewUrl}
                                alt="미리보기"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    objectFit: 'contain',
                                    borderRadius: '4px',
                                    display: 'block',
                                    margin: '0 auto'
                                }}
                            />
                            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                                이름: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>2. 1차 카테고리 (성별/그룹 분류)</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ width: '100%', padding: '12px', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '1rem' }}
                    >
                        <option value="women">여자</option>
                        <option value="men">남자</option>
                        <option value="couple">우정&amp;커플</option>
                        <option value="outdoor">OUTDOOR</option>
                        <option value="fashion">FASHION &amp; BEAUTY</option>
                        <option value="dancer">DANCER &amp; DJ</option>
                        <option value="self">SELF</option>
                        <option value="portrait">PORTRAIT</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>3. 해시태그 (공백 또는 콤마 구분, 최대 3개)</label>
                    <input
                        type="text"
                        placeholder="#바디프로필, #이너핏, #레드포인트"
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        onKeyDown={(e) => {
                            // 해시태그 작성 중 무심코 Enter를 눌렀을 때 폼이 통째로 날아가며 "파일을 첨부해주세요" 경고가 뜨는 현상 원천 차단
                            if (e.key === 'Enter') {
                                e.preventDefault();
                            }
                        }}
                    />
                    <small className={parsedTags.length <= 3 ? 'success-text' : 'error-text'}>
                        현재 입력: {parsedTags.length} / 최대 3개
                    </small>

                    {savedTags.length > 0 && (
                        <div className="saved-tags-container" style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {savedTags.map((tag, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-secondary)',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {/* 태그 클릭 시 입력란에 자동 필 */}
                                    <button
                                        type="button"
                                        onClick={() => handleTagClick(tag)}
                                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}
                                    >
                                        {tag}
                                    </button>
                                    {/* X 버튼: 저장된 태그 영구 삭제 */}
                                    <button
                                        type="button"
                                        onClick={() => handleTagDelete(tag)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'rgba(255,80,80,0.7)',
                                            cursor: 'pointer',
                                            padding: '0 2px',
                                            fontSize: '0.9rem',
                                            lineHeight: 1,
                                            fontWeight: 'bold',
                                        }}
                                        title="태그 삭제"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleSubmit}
                    className="submit-btn"
                    disabled={!file || parsedTags.length > 3}
                    style={{
                        marginTop: '20px',
                        cursor: (!file || parsedTags.length > 3) ? 'not-allowed' : 'pointer',
                        opacity: (!file || parsedTags.length > 3) ? 0.5 : 1
                    }}
                >
                    새 사진 업로드 완료
                </button>
                <button
                    type="button"
                    onClick={() => window.location.href = '/'}
                    style={{
                        marginTop: '10px',
                        padding: '14px',
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.3)',
                        background: 'rgba(0,0,0,0.05)',
                        color: '#111',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        letterSpacing: '0.5px',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => { e.target.style.background = 'rgba(0,0,0,0.1)'; e.target.style.borderColor = 'rgba(0,0,0,0.5)'; }}
                    onMouseOut={(e) => { e.target.style.background = 'rgba(0,0,0,0.05)'; e.target.style.borderColor = 'rgba(0,0,0,0.3)'; }}
                >
                    📸 갤러리로 이동
                </button>
            </div>
        </div>
    );
};

export default Admin;
