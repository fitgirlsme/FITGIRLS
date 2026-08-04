import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../utils/firebase';
import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SupportCS from '../components/SupportCS';
import './Maxq.css';

const DEFAULT_PLAN = {
    id: "default",
    issue: "2026.09 ISSUE",
    model: {
        name: "정은미",
        engName: "Eunmi Jung",
        desc: "운동복 모델 · 뷰티&피트니스 크리에이터 · MAXQ 9월호 메인 커버",
        instagram: "https://www.instagram.com/selfit_eunmi/",
        avatarUrl: "https://via.placeholder.com/150"
    },
    looksA: {
        cover: { title: "COVER A : High-End Sensual Chic", cut: "세로(1P) 1컷", mood: "하이패션 감성의 딥하고 매혹적인 커버. 과감한 바디라인 연출.", outfitDesc: "블랙 컷아웃 바디수트 + 핀스트라이프 오버재킷, 골드 링 귀걸이", propDesc: "다크 그레이 호리존, 빈티지 바체어", lightDesc: "하드 직광 조명으로 쇄골/음영 강조", hairMakeupDesc: "세미 Wet 헤어스타일링 & 딥 스모키 뷰티 메이크업", outfits: [], refs: [] },
        look1: { title: "LOOK 1 : Modern Fashion Chic", cut: "가로 1컷 + 세로 1컷 (총 2컷)", mood: "도도하고 시크한 모던 패션 화보 (커버 의상 연장)", outfitDesc: "커버 착장에서 재킷 탈의 / 볼드 가죽 벨트 착용", propDesc: "바닥에 비스듬히 기댄 포즈 (좌측 1/3 기사 배치용 여백)", lightDesc: "하드 라이팅 연출", hairMakeupDesc: "시크 내추럴 헤어 & 스모키 메이크업", outfits: [], refs: [] },
        look2: { title: "LOOK 2 : Glam & Sweat Fitness", cut: "가로 1컷 + 세로 2컷 (총 3컷)", mood: "글래머러스 & 오일 텍스처 피트니스 바디 연출", outfitDesc: "메탈릭 비키니 Top + 바이커 쇼츠 + 글래디에이터 핸드랩", propDesc: "바디 오일/미스트 연출, 덤벨/케틀벨 소품 활용", lightDesc: "근육 리어 라인을 살리는 백라이트(Rim light) 세팅", hairMakeupDesc: "포니테일 헤어 & 브론즈 글로우 뷰티", outfits: [], refs: [] },
        look3: { title: "LOOK 3 : Soft Sunlit Diet (Pinterest)", cut: "가로 1컷 + 세로 2컷 (총 3컷)", mood: "창가 햇살 속 나른하고 순수한 감성의 핀터레스트 무드", outfitDesc: "화이트 리넨 크롭 탑 + 마이크로 데님 숏팬츠(단추 오픈)", propDesc: "창가 따스한 텅스텐 자연광 톤, 소파 및 로케이션 세트", lightDesc: "부드럽고 밝은 채광 지향", hairMakeupDesc: "내추럴 웨이브 헤어 & 누드 톤 투명 메이크업", outfits: [], refs: [] },
        look4: { title: "LOOK 4 : SKIMS Sensual Paparazzi", cut: "가로 1컷 + 세로 1컷 (총 2컷)", mood: "LA 오프듀티 셀럽의 길거리 파파라치 스냅", outfitDesc: "토프(Taupe) 립드 바디수트 + 레더 재킷 + 선글라스 + 커피 잔", propDesc: "차고/아스팔트/콘크리트 텍스처 배경지", lightDesc: "카메라 다이렉트 직광 플래시 (Direct Flash)", hairMakeupDesc: "자연스러운 슬릭백 헤어 & 캐주얼 뷰티", outfits: [], refs: [] },
        look5: { title: "LOOK 5 : Monochrome Silhouetted", cut: "가로(2P) 1컷 단독", mood: "선과 음영만으로 표현하는 예술적인 흑백 실루엣", outfitDesc: "스킨톤 심리스 모노키니", propDesc: "심플한 단색 배경막", lightDesc: "흑백(B&W) 컨버전, 로우키(Low-key) 라이팅 연출", hairMakeupDesc: "클래식 로우 번 헤어스타일링", outfits: [], refs: [] },
        look6: { title: "LOOK 6 : Additional Option", cut: "세로(1P) 1컷", mood: "추가 촬영용 룩 정보입니다.", outfitDesc: "", propDesc: "", lightDesc: "", hairMakeupDesc: "", outfits: [], refs: [] }
    },
    looksB: {
        cover: { title: "COVER B : Bright & Healthy Energy", cut: "세로(1P) 1컷", mood: "국방부 수위 준수, 밝고 청량한 스포티 아나운서 감성", outfitDesc: "하이넥 반집업 크롭 탑 + 하이웨이스트 테니스 스커트", propDesc: "스카이블루 호리존, 테니스 라켓 소품", lightDesc: "가슴/힙라인 노출 완전 배제, 상큼한 미소와 비율 중심", hairMakeupDesc: "상큼한 포니테일 & 과즙 핑크 메이크업", outfits: [], refs: [] },
        look1: { title: "LOOK 1 : Tennis Lifestyle", cut: "세로(1P) 2컷", mood: "에너제틱 라이프스타일 (Cover 의상 연장)", outfitDesc: "커버 착장 + 화이트 바이저 캡 추가 착용", propDesc: "라켓을 어깨에 멘 전신 컷 + 경쾌한 3/4 앵글 포즈", lightDesc: "밝고 활기찬 라이팅", hairMakeupDesc: "스포티 바이저 캡 연출 & 코랄 메이크업", outfits: [], refs: [] },
        look2: { title: "LOOK 2 : Dewy Skin Clean Beauty", cut: "세로(1P) 2컷", mood: "투명한 피부 결과 맑은 이목구비 강조 클린 뷰티", outfitDesc: "파스텔 핑크/크림 하이 홀터넥 Top (넥라인 높음)", propDesc: "파스텔 톤 배경막", lightDesc: "뷰티 디시 조명, 타이트 숄더 뷰티 컷", hairMakeupDesc: "촉촉한 물광 skin & 깔끔한 올림머리", outfits: [], refs: [] },
        look3: { title: "LOOK 3 : Clean Off-Duty SKIMS", cut: "가로 1컷 + 세로 1컷 (총 2컷)", mood: "노출 없이 핏감만 살린 트렌디 스트릿 파파라치", outfitDesc: "슬림핏 크롭 티 + 하이웨이스트 조거팬츠 + 볼캡 & 헤드폰", propDesc: "손을 주머니에 넣고 자연스럽게 걷는 순간 포착", lightDesc: "내추럴 야외광 연출", hairMakeupDesc: "볼캡 착용 내추럴 헤어 & 캐주얼 뷰티", outfits: [], refs: [] },
        look4: { title: "LOOK 4 : Active Upper-Body Fitness", cut: "가로 1컷 + 세로 1컷 (총 2컷)", mood: "상체 및 팔 근육 라인 중심의 에너제틱 피트니스", outfitDesc: "민소매 크롭 후디(지퍼 끝까지 올림) + 조거팬츠", propDesc: "폼롤러/짐볼 활용 상체 스트레칭", lightDesc: "근육 데피니션 강조 컨트라스트 라이팅", hairMakeupDesc: "하이 브레이드(땋은 머리) 헤어 & 피트니스 뷰티", outfits: [], refs: [] },
        look5: { title: "LOOK 5 : Refresh Preppy Anorak", cut: "가로 1컷 + 세로 1컷 (총 2컷)", mood: "파스텔 톤의 산뜻한 프리피 스포티 웰니스", outfitDesc: "버터/민트 아노락 바람막이 세트 + 니삭스 & 스니커즈", propDesc: "야외 트랙 느낌, 경쾌하게 달리는 동작 연출", lightDesc: "화사하고 선명한 채광 지향", hairMakeupDesc: "양갈래 땋은 머리 & 상큼한 피치 메이크업", outfits: [], refs: [] }
    }
};

const Maxq = ({ changeLanguage, currentLang }) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [issuesList, setIssuesList] = useState([]);
    const [planData, setPlanData] = useState(DEFAULT_PLAN);
    const [currentType, setCurrentType] = useState('A');
    const [activeLook, setActiveLook] = useState({ A: 'cover', B: 'cover' });
    const [loading, setLoading] = useState(true);
    const isAdminLoggedIn = localStorage.getItem('admin_logged_in') === 'true';

    // 1. 전체 월호 리스트 실시간 동기화 (onSnapshot 수신)
    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'maxq_plans'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
            setIssuesList(list);

            const paramIssueId = searchParams.get('issue');
            if (paramIssueId) {
                const selected = list.find(item => item.id === paramIssueId || item.issue?.replace(/\s+/g, '') === paramIssueId);
                if (selected) {
                    setPlanData(selected);
                    setLoading(false);
                    return;
                }
            }

            if (list.length > 0) {
                setPlanData(list[0]);
            }
            setLoading(false);
        }, (err) => {
            console.error("Firestore real-time sync failed:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [searchParams]);

    // 드롭다운 변경 시 URL 쿼리 파라미터 갱신
    const handleIssueSelectChange = (e) => {
        const docId = e.target.value;
        const target = issuesList.find(item => item.id === docId);
        if (target) {
            setPlanData(target);
            setSearchParams({ issue: docId });
        }
    };

    const handleTypeSwitch = (type) => {
        setCurrentType(type);
    };

    const handleLookSwitch = (type, lookKey) => {
        setActiveLook(prev => ({
            ...prev,
            [type]: lookKey
        }));
    };

    const targetLookKey = activeLook[currentType];
    const lookGroup = currentType === 'A' ? planData.looksA : planData.looksB;
    const currentLookData = lookGroup?.[targetLookKey] || DEFAULT_PLAN[`looks${currentType}`][targetLookKey];

    const lookKeys = currentType === 'A' ? 
        ['cover', 'look1', 'look2', 'look3', 'look4', 'look5', 'look6'] : 
        ['cover', 'look1', 'look2', 'look3', 'look4', 'look5'];

    const lookLabels = currentType === 'A' ? 
        ['COVER', 'LOOK 1 (시크)', 'LOOK 2 (피트니스)', 'LOOK 3 (다이어트)', 'LOOK 4 (SKIMS 파파라치)', 'LOOK 5 (모노키니)', 'LOOK 6 (추가 옵션)'] :
        ['COVER', 'LOOK 1 (테니스)', 'LOOK 2 (클린뷰티)', 'LOOK 3 (SKIMS 캐주얼)', 'LOOK 4 (피트니스)', 'LOOK 5 (아노락)'];

    const getIssueMonth = (issueStr) => {
        if (!issueStr) return '9월호';
        const match = issueStr.match(/\.(\d+)/);
        if (match) {
            return `${parseInt(match[1], 10)}월호`;
        }
        return issueStr.replace(' ISSUE', '');
    };
    const issueMonth = getIssueMonth(planData.issue);

    return (
        <div className="maxq-brand-container">
            <Header changeLanguage={changeLanguage} currentLang={currentLang} />

            <div className="maxq-page-wrapper">
                <div className="maxq-brand-header-zone" style={{ borderBottom: '2px solid #374151', paddingBottom: '16px', marginBottom: '28px' }}>
                    <div className="header-bar" style={{ borderBottom: 'none', marginBottom: '4px', paddingBottom: 0 }}>
                        <div className="logo" style={{ fontSize: '1.6rem', letterSpacing: '-0.5px' }}>
                            <span style={{ color: '#09090B', fontWeight: '900' }}>MAXQ {issueMonth}</span> <span style={{ color: '#6B7280', fontWeight: '300', fontSize: '1.25rem', marginLeft: '4px' }}>EDITORIAL</span>
                        </div>
                        <div className="issue-selector-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {isAdminLoggedIn && (
                                <button 
                                    onClick={() => navigate(`/admin?tab=maxq${planData.id ? `&docId=${planData.id}` : ''}`)}
                                    className="maxq-edit-btn"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: '#374151',
                                        color: '#FFFFFF',
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem',
                                        padding: '7px 14px',
                                        borderRadius: '20px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(55, 65, 81, 0.25)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    title="어드민으로 이동하여 이 기획서 수정하기"
                                >
                                    <i className="fa-solid fa-pen-to-square"></i> 기획서 수정 (어드민)
                                </button>
                            )}
                            {issuesList.length > 1 ? (
                                <select 
                                    className="maxq-issue-dropdown" 
                                    value={planData.id || ''} 
                                    onChange={handleIssueSelectChange}
                                >
                                    {issuesList.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.issue} ({item.model?.name || '모델'})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="issue-tag">{planData.issue}</div>
                            )}
                        </div>
                    </div>
                    <div className="editorial-sub-copy" style={{ fontSize: '0.72rem', color: '#6B7280', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: '600', marginTop: '2px' }}>
                        Monthly Fashion & Fitness Directing Board by FITGIRLS
                    </div>
                </div>

                {/* Model Profile Section */}
                <div className="model-card">
                    {planData.model?.avatarUrl && planData.model.avatarUrl !== 'https://via.placeholder.com/150' ? (
                        <img src={planData.model.avatarUrl} 
                            alt={planData.model?.name || '모델'} 
                            className="model-avatar" 
                            style={{ flexShrink: 0, width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #FF003C', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="%231E1E24" stroke="%23FF003C" stroke-width="2"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="%23FF003C" font-size="28">👤</text></svg>';
                            }}
                        />
                    ) : (
                        <div className="model-avatar-placeholder" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#1E1E24', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF003C', fontSize: '1.8rem', border: '2px solid #FF003C', flexShrink: 0 }}>
                            <i className="fa-solid fa-user"></i>
                        </div>
                    )}
                    <div className="model-info">
                        <h2>
                            {(() => {
                                const rawIssue = planData.issue || '';
                                const monthMatch = rawIssue.match(/\.(\d{1,2})/);
                                const monthText = monthMatch ? `${parseInt(monthMatch[1], 10)}월호` : '화보';
                                const modelName = planData.model?.name || '모델명';
                                return `${monthText} 모델 [ ${modelName} ]`;
                            })()}
                        </h2>
                        <p>{planData.model?.desc}</p>
                        {(() => {
                            const rawIg = planData.model?.instagram || '';
                            if (!rawIg) return null;
                            const igHandle = rawIg.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/$/, '');
                            if (!igHandle) return null;
                            const igUrl = `https://www.instagram.com/${igHandle}/`;
                            return (
                                <a 
                                    href={igUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="ig-btn"
                                >
                                    <i className="fa-brands fa-instagram"></i> @{igHandle} 인스타그램 바로가기
                                </a>
                            );
                        })()}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="maxq-main-content">
                    {/* Version Switcher */}
                    <div className="type-switcher">
                        <button 
                            className={`type-btn ${currentType === 'A' ? 'active' : ''}`} 
                            data-type="A" 
                            onClick={() => handleTypeSwitch('A')}
                        >
                            A형 (시중판 · Sensual)
                        </button>
                        <button 
                            className={`type-btn ${currentType === 'B' ? 'active' : ''}`} 
                            data-type="B" 
                            onClick={() => handleTypeSwitch('B')}
                        >
                            B형 (국방부 · Clean)
                        </button>
                    </div>

                    {/* Look Sub Navigation */}
                    <div className="look-nav-wrap">
                        <div className="look-nav">
                            {lookKeys.map((lookKey, idx) => (
                                <button
                                    key={lookKey}
                                    className={`look-tab-btn ${targetLookKey === lookKey ? 'active' : ''}`}
                                    onClick={() => handleLookSwitch(currentType, lookKey)}
                                >
                                    {lookLabels[idx]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Content Box */}
                    {currentLookData && (
                        <div className={`look-content active ${currentType === 'B' ? 'type-b-active' : ''}`}>
                            <div className="card-header">
                                <div className="look-title">{currentLookData.title}</div>
                                <div className="badge-group">
                                    <span className={`badge ${currentType === 'A' ? 'badge-type-a' : 'badge-type-b'}`}>
                                        {currentType === 'A' ? 'A형 시중판' : 'B형 국방부'}
                                    </span>
                                    <span className="badge badge-cut">{currentLookData.cut}</span>
                                    {currentLookData.cutCount && (
                                        <span className="badge" style={{ background: currentType === 'A' ? '#F3F4F6' : '#EFF6FF', border: '1px solid #000000', color: '#000000', fontWeight: '900' }}>
                                            목표 A컷: {currentLookData.cutCount}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 💡 기획의도 및 무드 설명 */}
                            {currentLookData.mood && (
                                <div className="maxq-concept-lead-box" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px 20px', marginBottom: '24px' }}>
                                    <div className="detail-label" style={{ fontSize: '0.85rem', color: currentType === 'A' ? '#000000' : '#2563EB', marginBottom: '8px', fontWeight: '900' }}>
                                        <i className="fa-solid fa-wand-magic-sparkles"></i> CONCEPT & INTENT (기획의도 및 콘셉트)
                                    </div>
                                    <div className="detail-value" style={{ fontSize: '1rem', color: '#000000', fontWeight: '600', lineHeight: '1.65', wordBreak: 'keep-all' }}>
                                        {currentLookData.mood}
                                    </div>
                                </div>
                            )}

                        {/* 📸 1. 포즈/무드 레퍼런스 사진 구역 */}
                        {currentLookData.refs && currentLookData.refs.length > 0 && (
                            <div className="img-section">
                                <div className="img-section-title">
                                    <i className="fa-solid fa-images"></i> POSE & MOOD REFERENCE (레퍼런스)
                                </div>
                                <div className="img-grid">
                                    {currentLookData.refs.map((url, rIdx) => {
                                        const actualUrl = (typeof url === 'object' && url?.url) ? url.url : url;
                                        return (
                                            <img key={rIdx} 
                                                src={actualUrl} 
                                                alt={`레퍼런스 ${rIdx+1}`} 
                                                className="img-item" 
                                                referrerPolicy="no-referrer" 
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%231E1E24"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%233B82F6" font-size="14" font-weight="bold">이미지 로드 차단됨</text><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%238E8E93" font-size="12">어드민에서 사진을 새로 선택해주세요</text></svg>';
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 👗 2. 실제 촬영 의상/착장 사진 구역 */}
                        {currentLookData.outfits && currentLookData.outfits.length > 0 && (
                            <div className="img-section">
                                <div className="img-section-title">
                                    <i className="fa-solid fa-shirt"></i> OUTFIT & FITTING (실제 의상컷)
                                </div>
                                <div className="img-grid">
                                    {currentLookData.outfits.map((url, uIdx) => {
                                        const actualUrl = (typeof url === 'object' && url?.url) ? url.url : url;
                                        return (
                                            <img key={uIdx} 
                                                src={actualUrl} 
                                                alt={`의상 ${uIdx+1}`} 
                                                className="img-item" 
                                                referrerPolicy="no-referrer" 
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%231E1E24"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%23FF003C" font-size="14" font-weight="bold">이미지 로드 차단됨</text><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%238E8E93" font-size="12">어드민에서 사진을 새로 선택해주세요</text></svg>';
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 상세 내용 그리드 (무드 제외) */}
                        <div className="detail-grid">


                            <div className="detail-item">
                                <div className="detail-label">
                                    <i className="fa-solid fa-shirt"></i> 의상 & 액세서리 상세
                                </div>
                                <div className="detail-value">{currentLookData.outfitDesc}</div>
                            </div>

                            <div className="detail-item">
                                <div className="detail-label">
                                    <i className="fa-solid fa-image"></i> 배경 & 소품
                                </div>
                                <div className="detail-value">{currentLookData.propDesc}</div>
                            </div>

                            <div className="detail-item">
                                <div className="detail-label">
                                    <i className="fa-solid fa-lightbulb"></i> 조명 세팅
                                </div>
                                <div className="detail-value">{currentLookData.lightDesc}</div>
                            </div>

                            <div className="detail-item">
                                <div className="detail-label">
                                    <i className="fa-solid fa-wand-magic-sparkles"></i> 헤어 & 메이크업 세팅
                                </div>
                                <div className="detail-value">{currentLookData.hairMakeupDesc}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <SupportCS />
            <Footer currentLang={currentLang} />
        </div>
    );
};

export default Maxq;
