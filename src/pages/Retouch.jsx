import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { getAlimtalkTemplate, sendAlimtalk } from '../utils/aligoService';
import './Retouch.css';

const ADMIN_PHONE = '01046961441';

const ReviewGuide = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`retouch-review-guide-container ${isOpen ? 'is-open' : ''}`}>
            <button className="retouch-guide-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                <span className="retouch-toggle-icon">✍️</span>
                <span className="retouch-toggle-text">리뷰 작성 가이드 {isOpen ? '접기' : '보기'}</span>
                <svg className={`retouch-chevron-icon ${isOpen ? 'up' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className="retouch-guide-content-wrapper">
                <div className="retouch-guide-content-inner">
                    <p className="retouch-guide-desc">아래 내용을 참고하여 더욱 풍성한 기록을 남겨보세요.</p>
                    <ul className="retouch-guide-questions">
                        <li><span>•</span> 가장 마음에 들었던 분위기는 어떤 느낌이었나요?</li>
                        <li><span>•</span> 촬영하면서 새롭게 발견한 내 모습이 있었나요?</li>
                        <li><span>•</span> 작가님의 디렉팅(포즈, 표정 코칭)은 어떠셨나요?</li>
                        <li><span>•</span> 촬영부터 보정 과정까지 좋았던 점이나 아쉬운 점(개선사항)이 있었다면 들려주세요.</li>
                        <li><span>•</span> 핏걸즈에서 나만의 어떤 FITORIAL을 남기셨나요?</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

const RETOUCH_LEVELS = [
    { level: 1, title: '1단계: 기본 잡티만 제거', desc: '피부결 정돈 및 기본 잡티 수준의 최소 보정' },
    { level: 2, title: '2단계: 자연스럽게 티 안 나게', desc: '이목구비 대칭 및 라인을 티 나지 않고 자연스럽게 정돈' },
    { level: 3, title: '3단계: 새로운 나 (얼굴만)', desc: '얼굴 위주로 확실한 이목구비 비율과 얼굴 라인 보정' },
    { level: 4, title: '4단계: 새로운 나 (얼굴+몸)', desc: '얼굴과 몸매 라인 모두를 조화롭고 완벽하게 성형 보정' },
    { level: 5, title: '5단계: 새로 태어나고 싶어요!', desc: '비율과 윤곽 등 극적이고 드라마틱한 최고 강도의 정밀 보정' }
];

// ─── 체크리스트 모달 상수 ─────────────────────────────────────
const CL_DESIRED_STYLES = [
    { id: 'natural',  label: 'A. 자연스럽게',   desc: '피부결 최대한 압금하게 정리하고 얼굴과 몸은 최대한 그대로' },
    { id: 'balanced', label: 'B. 가장 예쁜 나', desc: '내 얼굴 형상 유지하며 균형있고 매끈한 라인으로 정돈', recommended: true },
    { id: 'dramatic', label: 'C. 확실한 변화',  desc: '얼굴과 몸매 모두 슬림하고 전후 차이가 확실하게' },
    { id: 'fantasy',  label: 'D. 드라마틱하게', desc: '가볍고 윤곽이 돋보이는 최강 결과를 원해요' },
];
const CL_SKIN = [
    { id: 'natural', label: '자연스럽게', icon: '🌿' },
    { id: 'smooth',  label: '매끈하게',   icon: '✨' },
    { id: 'glossy',  label: '광채있게',   icon: '💎' },
    { id: 'matte',   label: '시원하게',   icon: '🖤' },
];
const CL_RATIO = [
    { id: 'keep',     label: '유지' },
    { id: 'slim',     label: '슬림' },
    { id: 'taller',   label: '다리 길게' },
    { id: 'shoulder', label: '어깨 좁게' },
];
const CL_FOCUS = [
    { id: 'waist', label: '허리' }, { id: 'pelvis', label: '골반' },
    { id: 'thigh', label: '허벅지' }, { id: 'arm', label: '팔뚝' },
    { id: 'trapezius', label: '승모근' }, { id: 'calf', label: '종아리' },
    { id: 'face_line', label: '얼굴 라인' }, { id: 'jaw', label: '턱선' },
    { id: 'nose', label: '코' }, { id: 'eyes', label: '눈' },
    { id: 'lips', label: '입술' },
];
const CL_PRESERVE = [
    { id: 'face_shape', label: '얼굴형 유지' }, { id: 'nose_shape', label: '코 유지' },
    { id: 'leg_length', label: '다리 길이 유지' }, { id: 'waist_curve', label: '허리 곡선 유지' },
    { id: 'shoulder_width', label: '어깨 너비 유지' }, { id: 'muscle_line', label: '근육 라인 유지' },
];
const CL_STEPS = ['원하는 결과', '얼굴 강도', '몸매 강도', '피부 표현', '집중 부위', '유지 특징', '최종 확인'];

// ─── 체크리스트 모달 컴포넌트 ────────────────────────────────
const ChecklistModal = ({ customer, projectId, onClose, onDone }) => {
    const existing = customer?.retouchChecklists?.[projectId];
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        desired_style: existing?.desired_style || '',
        face_level: existing?.face_level || 0,
        body_level: existing?.body_level || 0,
        skin_finish: existing?.skin_finish || '',
        body_ratio_change: existing?.body_ratio_change || '',
        focus_areas: existing?.focus_areas || [],
        preserve_features: existing?.preserve_features || [],
        additional_request: existing?.additional_request || '',
    });
    const [saving, setSaving] = useState(false);

    const toggle = (key, val) => setForm(f => ({
        ...f,
        [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val]
    }));

    const canNext = () => {
        if (step === 1) return !!form.desired_style;
        if (step === 2) return form.face_level > 0;
        if (step === 3) return form.body_level > 0;
        if (step === 4) return !!form.skin_finish;
        if (step === 5) return form.focus_areas.length > 0;
        return true;
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'retouch_masters', customer.id), {
                [`retouchChecklists.${projectId}`]: {
                    ...form,
                    submittedAt: new Date().toISOString(),
                },
            });
            onDone();
        } catch (err) {
            console.error(err);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const STYLE_MAP = { natural: '자연스럽게', balanced: '가장 예쁜 나', dramatic: '확실한 변화', fantasy: '드라마틱' };
    const SKIN_MAP  = { natural: '자연스럽게', smooth: '매끈하게', glossy: '광채있게', matte: '시원하게' };
    const RATIO_MAP = { keep: '유지', slim: '슬림하게', taller: '다리 길게', shoulder: '어깨 좁게' };

    return (
        <div className="cl-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="cl-modal">
                {/* 헤더 */}
                <div className="cl-modal-header">
                    <div className="cl-modal-title">📋 디테일 보정 체크리스트</div>
                    <button className="cl-modal-close" onClick={onClose}>✕</button>
                </div>

                {/* 스텝 바 */}
                <div className="cl-stepbar">
                    {CL_STEPS.map((s, i) => (
                        <div key={i} className={`cl-step ${i + 1 === step ? 'active' : ''} ${i + 1 < step ? 'done' : ''}`}
                            onClick={() => i + 1 < step && setStep(i + 1)}>
                            <div className="cl-step-num">{i + 1 < step ? '✓' : i + 1}</div>
                            <span className="cl-step-lbl">{s}</span>
                        </div>
                    ))}
                </div>

                {/* 컨텐츠 */}
                <div className="cl-modal-body">

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div className="cl-section">
                            <h3 className="cl-section-title">원하는 결과의 느낌을 선택해 주세요</h3>
                            <div className="cl-style-grid">
                                {CL_DESIRED_STYLES.map(s => (
                                    <div key={s.id}
                                        className={`cl-style-card ${form.desired_style === s.id ? 'selected' : ''} ${s.recommended ? 'recommended' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, desired_style: s.id }))}>
                                        {s.recommended && <span className="cl-rec-badge">핏걸즈 추천</span>}
                                        {form.desired_style === s.id && <span className="cl-check">✓</span>}
                                        <div className="cl-style-lbl">{s.label}</div>
                                        <p className="cl-style-desc">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div className="cl-section">
                            <h3 className="cl-section-title">얼굴 보정 강도를 선택해 주세요</h3>
                            <div className="cl-level-row">
                                {[1,2,3,4,5].map(lv => (
                                    <div key={lv} className={`cl-lv-card ${form.face_level === lv ? 'selected' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, face_level: lv }))}>
                                        <div className="cl-lv-num">{lv}</div>
                                        <div className="cl-lv-lbl">{lv}단계</div>
                                    </div>
                                ))}
                            </div>
                            <div className="cl-level-guide">
                                <div><strong>1~2단계</strong> 잡티·피부결 정돈, 자연스러운 윤곽</div>
                                <div><strong>3단계</strong> 이목구비 비율 조정, 얼굴 라인 정리</div>
                                <div><strong>4~5단계</strong> 확실한 성형급 보정, 드라마틱한 변화</div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <div className="cl-section">
                            <h3 className="cl-section-title">몸매 보정 강도를 선택해 주세요</h3>
                            <div className="cl-level-row">
                                {[1,2,3,4,5].map(lv => (
                                    <div key={lv} className={`cl-lv-card ${form.body_level === lv ? 'selected' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, body_level: lv }))}>
                                        <div className="cl-lv-num">{lv}</div>
                                        <div className="cl-lv-lbl">{lv}단계</div>
                                    </div>
                                ))}
                            </div>
                            <h4 className="cl-sub-title">신체 비율 방향</h4>
                            <div className="cl-ratio-grid">
                                {CL_RATIO.map(r => (
                                    <div key={r.id}
                                        className={`cl-ratio-card ${form.body_ratio_change === r.id ? 'selected' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, body_ratio_change: r.id }))}>
                                        {r.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 4 */}
                    {step === 4 && (
                        <div className="cl-section">
                            <h3 className="cl-section-title">피부 표현을 선택해 주세요</h3>
                            <div className="cl-skin-grid">
                                {CL_SKIN.map(s => (
                                    <div key={s.id}
                                        className={`cl-skin-card ${form.skin_finish === s.id ? 'selected' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, skin_finish: s.id }))}>
                                        <div className="cl-skin-icon">{s.icon}</div>
                                        <div className="cl-skin-lbl">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 5 */}
                    {step === 5 && (
                        <div className="cl-section">
                            <h3 className="cl-section-title">집중 보정 부위를 선택해 주세요 <small>(복수 선택)</small></h3>
                            <div className="cl-chip-grid">
                                {CL_FOCUS.map(a => (
                                    <div key={a.id}
                                        className={`cl-chip ${form.focus_areas.includes(a.id) ? 'selected' : ''}`}
                                        onClick={() => toggle('focus_areas', a.id)}>
                                        {form.focus_areas.includes(a.id) && '✓ '}{a.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 6 */}
                    {step === 6 && (
                        <div className="cl-section">
                            <h3 className="cl-section-title">유지하고 싶은 특징 <small>(복수 선택)</small></h3>
                            <div className="cl-chip-grid">
                                {CL_PRESERVE.map(f => (
                                    <div key={f.id}
                                        className={`cl-chip preserve ${form.preserve_features.includes(f.id) ? 'selected' : ''}`}
                                        onClick={() => toggle('preserve_features', f.id)}>
                                        {form.preserve_features.includes(f.id) && '✓ '}{f.label}
                                    </div>
                                ))}
                            </div>
                            <h4 className="cl-sub-title">✍️ 추가 요청사항</h4>
                            <textarea
                                className="cl-textarea"
                                placeholder="예) 허리는 정리하되 골반은 과하게 넓히지 말아주세요."
                                value={form.additional_request}
                                onChange={e => setForm(f => ({ ...f, additional_request: e.target.value }))}
                                rows={3}
                            />
                        </div>
                    )}

                    {/* STEP 7 */}
                    {step === 7 && (
                        <div className="cl-section">
                            <h3 className="cl-section-title">최종 확인 후 제출해 주세요</h3>
                            <div className="cl-summary">
                                {[
                                    ['원하는 결과', STYLE_MAP[form.desired_style] || '미선택'],
                                    ['얼굴 보정',   form.face_level ? `${form.face_level}단계` : '미선택'],
                                    ['몸매 보정',   form.body_level ? `${form.body_level}단계` : '미선택'],
                                    ['비율 방향',   RATIO_MAP[form.body_ratio_change] || '미선택'],
                                    ['피부 표현',   SKIN_MAP[form.skin_finish] || '미선택'],
                                    ['집중 부위',   form.focus_areas.length > 0 ? form.focus_areas.map(id => CL_FOCUS.find(a => a.id === id)?.label).join(', ') : '없음'],
                                    ['유지 요청',   form.preserve_features.length > 0 ? form.preserve_features.map(id => CL_PRESERVE.find(a => a.id === id)?.label).join(', ') : '없음'],
                                ].map(([k, v]) => (
                                    <div key={k} className="cl-summary-row">
                                        <span className="cl-sum-key">{k}</span>
                                        <span className="cl-sum-val">{v}</span>
                                    </div>
                                ))}
                                {form.additional_request && (
                                    <div className="cl-summary-row full">
                                        <span className="cl-sum-key">추가 요청</span>
                                        <span className="cl-sum-val">{form.additional_request}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 푸터 버튼 */}
                <div className="cl-modal-footer">
                    {step > 1 && (
                        <button className="cl-btn-prev" onClick={() => setStep(s => s - 1)}>← 이전</button>
                    )}
                    {step < 7 ? (
                        <button
                            className={`cl-btn-next ${!canNext() ? 'disabled' : ''}`}
                            onClick={() => canNext() && setStep(s => s + 1)}>
                            다음 →
                        </button>
                    ) : (
                        <button className="cl-btn-submit" onClick={handleSubmit} disabled={saving}>
                            {saving ? '저장 중...' : '🎨 체크리스트 제출 완료'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const Retouch = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [customer, setCustomer] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(false);
    // 체크리스트 모달: { projectId } or null
    const [checklistModal, setChecklistModal] = useState(null);

    const statuses = ['보정대기', '선보정(당일보정)', '보정중', '1차보정완료(피드백요청)', '2차보정', '최종컴펌완료', '최종보정완료'];

    const statusGuides = {
        '보정대기': '원본 셀렉 파일을 기다리고 있습니다. 셀렉 완료 후 메일(inafit@daum.net)로 회신 주시면 보정 작업이 시작됩니다. (셀렉 후 약 4주 소요). 보정본 수령 후 추가로 보정이 더 필요할 시 핏걸즈 스마트 플레이스 (핏걸즈스튜디오)에서 추가 구매가 가능합니다.',
        '선보정(당일보정)': '먼저 받고 싶은 사진 한 장에 대해 우선적으로 보정을 진행하는 단계입니다.',
        '보정중': '선택하신 사진을 작가가 정성스럽게 보정하고 있는 단계입니다. 조금만 더 기다려 주세요!',
        '1차보정완료(피드백요청)': '여기에서 보정을 확인하신 후, 추가로 2차보정이 필요한 부분이 있으시면 말씀해 주세요. 추가로 보정이 필요 없으시면 \'최종 컨펌\'을 해주시면 매거진 커버와 함께 최종본을 발송해 드리도록 하겠습니다.',
        '2차보정': '전달해주신 피드백을 바탕으로 2차 보정 작업을 진행 중입니다.',
        '최종컴펌완료': '모든 보정 작업에 대한 컨펌이 완료되었습니다. 최종 파일을 정리 중입니다.',
        '최종보정완료': '모든 보정 작업이 완료되었습니다! 최종 보정본을 다운로드하실 수 있습니다.'
    };

    const [selectedStatuses, setSelectedStatuses] = useState({});

    // Robust Date Formatter
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const str = String(dateStr).replace(/[^0-9]/g, '');
        
        // MMDD (4자리) 처리
        if (str.length === 4) {
            const month = str.substring(0, 2);
            const day = str.substring(2, 4);
            return `2026.${month}.${day}`;
        }
        
        // YYMMDD (6자리) 처리
        if (str.length === 6) {
            const year = '20' + str.substring(0, 2);
            const month = str.substring(2, 4);
            const day = str.substring(4, 6);
            return `${year}.${month}.${day}`;
        }
        
        return dateStr;
    };

    // Helper to calculate days passed
    const getDaysPassed = (dateStr) => {
        if (!dateStr) return null;
        try {
            const str = String(dateStr).replace(/[^0-9]/g, '');
            let targetDate;
            if (str.length === 6) {
                const year = 2000 + parseInt(str.substring(0, 2));
                const month = parseInt(str.substring(2, 4)) - 1;
                const day = parseInt(str.substring(4, 6));
                targetDate = new Date(year, month, day);
            } else {
                targetDate = new Date(dateStr);
            }
            if (isNaN(targetDate.getTime())) return null;
            const today = new Date();
            today.setHours(0,0,0,0);
            targetDate.setHours(0,0,0,0);
            const diffTime = today - targetDate;
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        } catch (e) { return null; }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const phoneId = phone.replace(/[^0-9]/g, '');
        try {
            const docRef = doc(db, 'retouch_masters', phoneId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.password === password) {
                    setCustomer({ id: docSnap.id, ...data });
                    setIsLoggedIn(true);
                    try { localStorage.setItem('retouch_user', phoneId); } catch(e) {}
                } else { alert('비밀번호가 일치하지 않습니다.'); }
            } else { alert('등록된 정보를 찾을 수 없습니다.'); }
        } catch (err) { console.error(err); alert('로그인 중 오류가 발생했습니다.'); }
        setLoading(false);
    };

    useEffect(() => {
        let unsub;
        try {
            const savedUser = localStorage.getItem('retouch_user');
            if (savedUser) {
                unsub = onSnapshot(doc(db, 'retouch_masters', savedUser), (snapshot) => {
                    if (snapshot.exists()) {
                        setCustomer({ id: snapshot.id, ...snapshot.data() });
                        setIsLoggedIn(true);
                    }
                });
            }
        } catch (e) { console.error(e); }
        return () => { if (unsub) unsub(); };
    }, []);

    const handleLogout = () => {
        try { localStorage.removeItem('retouch_user'); } catch(e) {}
        setIsLoggedIn(false);
        setCustomer(null);
    };

    if (!isLoggedIn) {
        return (
            <div className="retouch-login-wrapper">
                <div className="retouch-login-box">
                    <h2 className="login-title">RETOUCH <span>DASHBOARD</span></h2>
                    <p className="login-subtitle">고객님의 보정 현황을 확인하세요.</p>
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-input">
                            <label>아이디 (전화번호)</label>
                            <input type="text" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="01012345678" required />
                        </div>
                        <div className="form-input">
                            <label>비밀번호 (전화번호 뒤 4자리)</label>
                            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="****" required />
                        </div>
                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="retouch-dashboard-main">
            <header className="dashboard-header">
                <h1 className="logo-text">RETOUCH <span>CLIENT</span></h1>
                <div className="user-info">
                    <span><strong>{customer?.name || '고객'}</strong> 님</span>
                    <button onClick={handleLogout} className="logout-button">로그아웃</button>
                </div>
            </header>

            <main className="dashboard-container">
                <div className="welcome-banner">
                    <h2>반갑습니다, {customer?.name || '고객'}님!</h2>
                    <p>요청하신 보정 작업의 실시간 현황입니다.</p>
                </div>

                <div className="project-list">
                    {customer?.projectHistory?.slice().reverse().map(pId => {
                        const status = customer.projectStatuses?.[pId] || '보정대기';
                        const currentIdx = statuses.indexOf(status);
                        const link = customer.dropboxArchives?.[pId] || '';
                        const base = customer.projectBaseRetouchCounts?.[pId] || 0;
                        const insta = customer.instaConsents?.[pId] || false;
                        const review = customer.reviewConsents?.[pId] || false;
                        const bonus = (insta ? 1 : 0) + (review ? 1 : 0);
                        const extra = customer.projectExtraRetouchCounts?.[pId] || 0;
                        const total = base + bonus + extra;
                        const requestDate = customer.requestDates?.[pId] || '';
                        const daysPassed = getDaysPassed(requestDate);

                        return (
                            <div key={pId} className={`project-item-card ${status === '최종보정완료' ? 'completed' : ''}`}>
                                <div className="card-top">
                                    <div className="p-header">
                                        <span className="p-id">촬영일: {formatDate(pId)}</span>
                                        <div className="p-status-badge" data-status={status}>{status}</div>
                                    </div>
                                    <h3 className="p-title">{customer.name} 님 FITORIAL PROJECT</h3>

                                    {/* Visual Stepper */}
                                    <div className="p-stepper-container">
                                        <div className="stepper-track">
                                            <div className="stepper-progress" style={{ width: `${(currentIdx / (statuses.length - 1)) * 100}%` }}></div>
                                        </div>
                                        <div className="stepper-steps">
                                            {statuses.map((s, idx) => {
                                                const currentStatus = customer.projectStatuses?.[pId] || '보정대기';
                                                const isSelected = (selectedStatuses[pId] || currentStatus) === s;
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        className={`step-item ${idx <= statuses.indexOf(currentStatus) ? 'active' : ''} ${isSelected ? 'selected' : ''} ${
                                                            s.includes('보정대기') ? 'status-waiting' :
                                                            s.includes('선보정') ? 'status-pre-retouch' :
                                                            s.includes('보정중') ? 'status-processing' :
                                                            s.includes('1차보정완료') ? 'status-1st-done' :
                                                            s.includes('2차보정') ? 'status-2nd-processing' :
                                                            s.includes('최종컴펌완료') ? 'status-confirm' :
                                                            s.includes('최종보정완료') ? 'status-final-done' : ''
                                                        }`}
                                                        onClick={() => setSelectedStatuses(prev => ({ ...prev, [pId]: s }))}
                                                    >
                                                        <div className="step-dot"></div>
                                                        <span className="step-label">
                                                            {s.replace('(피드백요청)', '').replace(' 진행', '')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="p-status-guide-box">
                                        <p className="guide-text">
                                            {statusGuides[selectedStatuses[pId] || customer.projectStatuses?.[pId] || '보정대기']}
                                        </p>
                                    </div>
                                    
                                    {/* 📅 보정 요청일 + 진행기간 박스 */}
                                    <div className="section-block">
                                        <div className="p-timeline">
                                            <div className="time-col">
                                                <span className="time-label">보정 요청일</span>
                                                <span className="time-val">{formatDate(requestDate)}</span>
                                            </div>
                                            <div className="time-col">
                                                <span className="time-label">진행 기간</span>
                                                <span className="time-val highlight">{daysPassed !== null ? `D+${daysPassed}일째` : '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 📊 전체 보정 수량 박스 */}
                                    <div className="section-block">
                                        <div className="stats-header">
                                            <div className="stats-main">
                                                <span className="stats-label">전체 보정 수량</span>
                                                <span className="stats-num">{total}<span>장</span></span>
                                            </div>
                                            <div className="stats-breakdown">
                                                기본 {base} {bonus > 0 && `+ 이벤트 ${bonus}`} {extra > 0 && `+ 추가 ${extra}`}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 📂 원본파일 확인하기 박스 */}
                                    {link && (
                                        <div className="section-block section-block-link">
                                            <a href={link} target="_blank" rel="noreferrer" className="dropbox-btn">
                                                {status === '최종보정완료' ? '최종보정본 확인하기' : 
                                                 status.includes('1차보정완료') ? '1차보정본 확인하기' :
                                                 status.includes('선보정') ? '선보정본 확인하기' : 
                                                 status === '보정대기' ? '원본파일 확인하기' : '보정본 확인하기'}
                                            </a>
                                        </div>
                                    )}

                                    {/* 🎨 보정 강도 선택 박스 */}
                                    <div className="section-block">
                                        <div className="retouch-level-section">
                                            <h4 className="retouch-level-title">
                                                🎨 {status === '보정대기' ? '원하시는 보정의 강도를 선택해 주세요' : '선택하신 보정의 강도'}
                                            </h4>
                                            <p className="retouch-level-subtitle">아티스트의 보정 작업 시 원하는 변신의 정도를 조율하기 위한 기준입니다.</p>
                                            
                                            <div className="retouch-level-grid">
                                                {RETOUCH_LEVELS.map((item) => {
                                                    const currentLevel = customer.retouchLevels?.[pId] || 0;
                                                    const isSelected = currentLevel === item.level;
                                                    const disabled = status !== '보정대기';
                                                    
                                                    return (
                                                        <div 
                                                            key={item.level} 
                                                            className={`retouch-level-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                                                            onClick={async () => {
                                                                if (disabled) return;
                                                                try {
                                                                    await updateDoc(doc(db, 'retouch_masters', customer.id), {
                                                                        [`retouchLevels.${pId}`]: item.level
                                                                    });
                                                                } catch (err) {
                                                                    console.error("Failed to update retouch level:", err);
                                                                    alert("보정 강도 저장 중 오류가 발생했습니다.");
                                                                }
                                                            }}
                                                        >
                                                            <div className="level-radio-icon">
                                                                <div className="radio-circle"></div>
                                                            </div>
                                                            <div className="level-info">
                                                                <div className="level-header">
                                                                    <span className="level-num-title">{item.title}</span>
                                                                </div>
                                                                <p className="level-desc">{item.desc}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* 체크리스트 링크 - 보정 강도 박스 내부 하단 */}
                                            <div className="retouch-checklist-inline-link">
                                                {customer.retouchChecklists?.[pId] ? (
                                                    <div className="checklist-inline-done">
                                                        <span className="checklist-done-icon">✓</span>
                                                        <div>
                                                            <p className="checklist-done-title">✅ 체크리스트 작성완료</p>
                                                            <p className="checklist-done-sub">
                                                                {['balanced','natural','dramatic','fantasy'].includes(customer.retouchChecklists[pId]?.desired_style) && (
                                                                    <>결과: <strong>{
                                                                        customer.retouchChecklists[pId]?.desired_style === 'natural' ? '자연스럽게' :
                                                                        customer.retouchChecklists[pId]?.desired_style === 'balanced' ? '가장 예쁜 나' :
                                                                        customer.retouchChecklists[pId]?.desired_style === 'dramatic' ? '확실한 변화' : '드라마틱'
                                                                    }</strong> · </>
                                                                )}
                                                                얼굴 {customer.retouchChecklists[pId]?.face_level || '-'}단계 · 몸매 {customer.retouchChecklists[pId]?.body_level || '-'}단계
                                                            </p>
                                                        </div>
                                                        {status === '보정대기' && (
                                                            <button
                                                                className="checklist-inline-edit-btn"
                                                                onClick={() => setChecklistModal(pId)}>
                                                                수정하기
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="checklist-inline-prompt">
                                                        <div className="checklist-prompt-left">
                                                            <span className="checklist-prompt-icon">📋</span>
                                                            <div>
                                                                <p className="checklist-prompt-title">디테일한 보정을 원하시나요?</p>
                                                                <p className="checklist-prompt-desc">얼굴·몸매·피부·집중 부위를 세부 설정할 수 있습니다.</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="checklist-inline-link-btn"
                                                            onClick={() => setChecklistModal(pId)}>
                                                            체크리스트 작성 →
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="card-stats">

                                    {customer.artistResponses?.[pId] && (
                                        <div className="artist-response-notice">
                                            <div className="response-header">
                                                <span className="response-icon">💬</span>
                                                <span className="response-title">작가님의 답변이 도착했습니다</span>
                                            </div>
                                            <div className="response-body">
                                                {customer.artistResponses[pId]}
                                            </div>
                                        </div>
                                    )}

                                    {customer.clientFeedbacks?.[pId] && (
                                        <div className="client-feedback-history">
                                            <p className="history-label">📝 나의 수정 요청 사항</p>
                                            <div className="history-content">{customer.clientFeedbacks[pId]}</div>
                                        </div>
                                    )}
                                </div>

                                <div className="card-actions">
                                    <div className="action-ready">
                                        {/* ✅ 인스타/리뷰 동의 박스 */}
                                        <div className="section-block">
                                            <div className="consent-options">
                                                <label className={`opt-item ${insta ? 'checked' : ''}`}>
                                                    <input type="checkbox" checked={insta} onChange={async (e) => {
                                                        await updateDoc(doc(db, 'retouch_masters', customer.id), { [`instaConsents.${pId}`]: e.target.checked });
                                                    }} />
                                                    인스타그램 업로드 동의 (서비스 +1장)
                                                </label>
                                                <label className={`opt-item ${review ? 'checked' : ''}`}>
                                                    <input type="checkbox" checked={review} onChange={async (e) => {
                                                        await updateDoc(doc(db, 'retouch_masters', customer.id), { [`reviewConsents.${pId}`]: e.target.checked });
                                                    }} />
                                                    리뷰 작성 완료 (서비스 +1장)
                                                </label>
                                            </div>
                                        </div>

                                        {/* 📸 인스타 아이디 입력 박스 */}
                                        {insta && (
                                            <div className="section-block">
                                                <div className="insta-id-input-box">
                                                    <p className="insta-guide">📸 인스타그램 업로드 시 태그를 위해 아이디를 알려주세요!</p>
                                                    <div className="insta-input-group">
                                                        <input 
                                                            type="text" 
                                                            id={`insta-input-${pId}`}
                                                            placeholder="인스타그램 아이디" 
                                                            defaultValue={customer.instaIds?.[pId] || ''}
                                                        />
                                                        <button 
                                                            className="insta-save-btn"
                                                            onClick={async () => {
                                                                const val = document.getElementById(`insta-input-${pId}`).value;
                                                                if (!val) return alert('아이디를 입력해주세요.');
                                                                await updateDoc(doc(db, 'retouch_masters', customer.id), { 
                                                                    [`instaIds.${pId}`]: val 
                                                                });
                                                                alert('인스타 아이디가 저장되었습니다!');
                                                            }}
                                                        >
                                                            저장
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {status === '1차보정완료(피드백요청)' && (
                                            <div className="feedback-section">
                                                <p className="feedback-guide">보정본을 확인하시고 피드백이 있으시면 아래에 적어주세요. 추가 보정이 필요 없으시면 '최종 컨펌'을 눌러주세요.</p>
                                                <textarea 
                                                    id={`feedback-input-${pId}`}
                                                    className="feedback-textarea"
                                                    placeholder="수정 요청 사항을 자세히 적어주세요..."
                                                    defaultValue={customer.clientFeedbacks?.[pId] || ''}
                                                />
                                                <div className="feedback-btn-group">
                                                    <button 
                                                        className="feedback-submit-btn"
                                                        onClick={async () => {
                                                            const val = document.getElementById(`feedback-input-${pId}`).value;
                                                            if (!val) return alert('피드백 내용을 입력해주세요.');
                                                            await updateDoc(doc(db, 'retouch_masters', customer.id), { 
                                                                [`clientFeedbacks.${pId}`]: val,
                                                                [`projectStatuses.${pId}`]: '2차보정',
                                                                [`statusUpdatedAts.${pId}`]: new Date().toISOString()
                                                            });
                                                            
                                                            // 관리자에게 피드백 알림 전송
                                                            const template = getAlimtalkTemplate('UH_6959', {
                                                                name: customer.name,
                                                                projectTitle: pId,
                                                                feedback: val
                                                            });
                                                            if (template) {
                                                                sendAlimtalk(ADMIN_PHONE, template.code, template.message);
                                                            }

                                                            alert('피드백이 전달되었습니다. 2차 보정을 진행하겠습니다!');
                                                        }}
                                                    >
                                                        피드백 제출 (2차보정 요청)
                                                    </button>
                                                    <button 
                                                        className="final-confirm-btn"
                                                        onClick={async () => {
                                                            if (window.confirm('이대로 최종 컨펌하시겠습니까? 더 이상의 추가 수정은 불가능합니다.')) {
                                                                await updateDoc(doc(db, 'retouch_masters', customer.id), { 
                                                                    [`projectStatuses.${pId}`]: '최종컴펌완료',
                                                                    [`statusUpdatedAts.${pId}`]: new Date().toISOString()
                                                                });

                                                                // 관리자에게 컨펌 완료 알림 전송
                                                                const template = getAlimtalkTemplate('UH_6960', {
                                                                    name: customer.name,
                                                                    projectTitle: pId,
                                                                    date: new Date().toLocaleString('ko-KR')
                                                                });
                                                                if (template) {
                                                                    sendAlimtalk(ADMIN_PHONE, template.code, template.message);
                                                                }

                                                                alert('최종 컨펌해주셔서 감사합니다. 최종 파일을 정리해 드릴게요!');
                                                            }
                                                        }}
                                                    >
                                                        최종 컨펌하기 (수정 없음)
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {status === '보정대기' && (
                                            <div className="retouch-submit-section">
                                                {customer.levelSubmitteds?.[pId] ? (
                                                    <div className="retouch-submitted-box">
                                                        <span className="submitted-check-icon">✓</span>
                                                        <p className="submitted-main-text">보정 요청 정보가 작가님께 전달되었습니다.</p>
                                                        <small className="submitted-sub-text">선택하신 강도: <strong>{RETOUCH_LEVELS.find(l => l.level === (customer.retouchLevels?.[pId] || 0))?.title || '기본'}</strong></small>
                                                    </div>
                                                ) : (
                                                    <div className="retouch-unsubmitted-box">
                                                        <p className="retouch-unsubmit-guide">보정 강도와 이벤트 동의 여부를 모두 설정하신 후, 아래 버튼을 눌러 보정 요청을 최종 제출해 주세요!</p>
                                                        <button 
                                                            className="retouch-final-submit-btn"
                                                            onClick={async () => {
                                                                const level = customer.retouchLevels?.[pId];
                                                                if (!level) {
                                                                    alert('원하시는 보정의 강도를 선택해 주세요!');
                                                                    const sectionEl = document.querySelector('.retouch-level-section');
                                                                    if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                    return;
                                                                }
                                                                
                                                                try {
                                                                    await updateDoc(doc(db, 'retouch_masters', customer.id), {
                                                                        [`levelSubmitteds.${pId}`]: true,
                                                                        [`statusUpdatedAts.${pId}`]: new Date().toISOString()
                                                                    });
                                                                    alert('보정 요청 정보가 정상적으로 제출되었습니다! 작가님이 확인 후 예쁜 보정본으로 찾아뵙겠습니다.');
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert('제출 처리 중 오류가 발생했습니다.');
                                                                }
                                                            }}
                                                        >
                                                            🎨 보정 요청 정보 작성 완료 (작가 전달)
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!link && status !== '보정대기' && (
                                            <div className="action-waiting">
                                                <div className="wait-icon">🎨</div>
                                                <p>작가님이 요청사항을 확인 후 순차적으로 보정을 시작합니다.<br/>조금만 기다려 주세요!</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* 📝 리뷰 작성 가이드 박스 */}
                                    <div className="section-block">
                                        <div className="retouch-review-section-box">
                                            <ReviewGuide />
                                            <div className="retouch-review-write-buttons">
                                                <a href="https://m.place.naver.com/place/1976065694/review/visitor" target="_blank" rel="noopener noreferrer" className="retouch-btn-review retouch-btn-naver-review">
                                                    네이버 리뷰 작성
                                                </a>
                                                <a href="https://share.google/zu3rKArDgSZmss9n4" target="_blank" rel="noopener noreferrer" className="retouch-btn-review retouch-btn-google-review">
                                                    구글 리뷰 작성
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 🛒 추가 보정 구매 박스 */}
                                    <div className="section-block">
                                        <div className="extra-purchase-box">
                                            <p className="extra-guide-text">보정본 수령 후 추가로 보정이 더 필요하신가요?</p>
                                            <a href="https://smartstore.naver.com/imfitgirl" target="_blank" rel="noreferrer" className="extra-purchase-btn">
                                                추가 보정 구매하기 (네이버 스마트스토어)
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </main>

            {/* 체크리스트 모달 */}
            {checklistModal && customer && (
                <ChecklistModal
                    customer={customer}
                    projectId={checklistModal}
                    onClose={() => setChecklistModal(null)}
                    onDone={() => setChecklistModal(null)}
                />
            )}
        </div>
    );
};

export default Retouch;
