import React, { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import './RetouchChecklist.css';

// ─── 상수 데이터 ───────────────────────────────────────────────
const DESIRED_STYLES = [
    {
        id: 'natural',
        label: 'A. 촬영 당시의\n나를 자연스럽게',
        desc: '피부결 최대한 압금하게 정리하고 얼굴과 몸에는 최대한 그대로 유지하고 싶어요.',
        faceLvl: '1~2단계',
        bodyLvl: '1~2단계',
        skinLvl: '피부: 피부결 유지',
    },
    {
        id: 'balanced',
        label: 'B. 가장 예쁜\n나의 모습으로',
        desc: '내 얼굴의 형상은 유지하면서 균형있고 매끈한 라인이 자연스럽게 정돈되면 좋겠어요.',
        faceLvl: '2~3단계',
        bodyLvl: '2~3단계',
        skinLvl: '피부: 자연스럽게',
        recommended: true,
    },
    {
        id: 'dramatic',
        label: 'C. 사진에서 변화가\n확실하게',
        desc: '얼굴과 몸매가 다 슬림하고 균형있고 보이도록 전후 차이가 확실하면 좋겠어요.',
        faceLvl: '4단계',
        bodyLvl: '4단계',
        skinLvl: '피부: 매끈하게',
    },
    {
        id: 'fantasy',
        label: 'D. 화보처럼\n드라마틱하게',
        desc: '한쪽으로 가볍도록 목/어깨/얼굴 윤곽의 비율이 돋보이는 최강 같은 결과를 원해요.',
        faceLvl: '4~5단계',
        bodyLvl: '4~5단계',
        skinLvl: '피부: 최보어링',
    },
];

const FACE_LEVELS = [
    { level: 1, label: '1단계', desc: '거의 없이' },
    { level: 2, label: '2단계', desc: '자연스럽게' },
    { level: 3, label: '3단계', desc: '적당히' },
    { level: 4, label: '4단계', desc: '확실히' },
    { level: 5, label: '5단계', desc: '드라마틱' },
];

const BODY_LEVELS = [
    { level: 1, label: '1단계', desc: '거의 없이' },
    { level: 2, label: '2단계', desc: '자연스럽게' },
    { level: 3, label: '3단계', desc: '적당히' },
    { level: 4, label: '4단계', desc: '확실히' },
    { level: 5, label: '5단계', desc: '드라마틱' },
];

const SKIN_FINISHES = [
    { id: 'natural', label: '자연스럽게', desc: '피부결을 살리면서 최소한의 보정' },
    { id: 'smooth', label: '매끈하게', desc: '잡티 제거 + 균일한 피부 톤' },
    { id: 'glossy', label: '광채있게', desc: '빛이 나는 촉촉하고 탱탱한 피부' },
    { id: 'matte', label: '시원하게', desc: '매트하고 깨끗한 편집 화보 느낌' },
];

const BODY_RATIO_OPTIONS = [
    { id: 'keep', label: '유지', desc: '현재 비율 그대로' },
    { id: 'slim', label: '슬림', desc: '전체적으로 슬림하게' },
    { id: 'taller', label: '다리 길게', desc: '하체 비율을 길고 슬림하게' },
    { id: 'shoulder', label: '어깨 좁게', desc: '어깨를 좁히고 얼굴 커버' },
];

const FOCUS_AREAS = [
    { id: 'waist', label: '허리' },
    { id: 'pelvis', label: '골반' },
    { id: 'thigh', label: '허벅지' },
    { id: 'arm', label: '팔뚝' },
    { id: 'shoulder', label: '어깨/승모근' },
    { id: 'trapezius', label: '승모근' },
    { id: 'calf', label: '종아리' },
    { id: 'face_line', label: '얼굴 라인' },
    { id: 'jaw', label: '턱선' },
    { id: 'nose', label: '코' },
    { id: 'eyes', label: '눈' },
    { id: 'lips', label: '입술' },
];

const PRESERVE_FEATURES = [
    { id: 'face_shape', label: '얼굴형 유지' },
    { id: 'nose_shape', label: '코 모양 유지' },
    { id: 'leg_length', label: '다리 길이 유지' },
    { id: 'waist_curve', label: '허리 곡선 유지' },
    { id: 'shoulder_width', label: '어깨 너비 유지' },
    { id: 'muscle_line', label: '근육 라인 유지' },
];

const STEPS = [
    '원하는 결과 느낌',
    '얼굴 보정 강도',
    '몸매 보정 강도',
    '피부 표현',
    '집중 보정 부위',
    '유지할 특징',
    '최종 확인',
];

// ─── 컴포넌트 ───────────────────────────────────────────────
const RetouchChecklist = () => {
    const [step, setStep] = useState(1);
    const [customer, setCustomer] = useState(null);
    const [projectId, setProjectId] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const [form, setForm] = useState({
        desired_style: '',
        face_level: 0,
        body_level: 0,
        skin_finish: '',
        body_ratio_change: '',
        focus_areas: [],
        preserve_features: [],
        additional_request: '',
    });

    // 로그인 정보 가져오기
    useEffect(() => {
        try {
            const saved = localStorage.getItem('retouch_user');
            if (saved) {
                const { id } = JSON.parse(saved);
                if (id) {
                    const unsub = onSnapshot(doc(db, 'retouch_masters', id), snap => {
                        if (snap.exists()) {
                            const data = { id: snap.id, ...snap.data() };
                            setCustomer(data);
                            // 가장 최근 프로젝트 자동 선택
                            const history = data.projectHistory || [];
                            if (history.length > 0) {
                                const latest = history[history.length - 1];
                                setProjectId(latest);
                                // 기존 저장된 체크리스트 불러오기
                                const existing = data.retouchChecklists?.[latest];
                                if (existing) {
                                    setForm(f => ({ ...f, ...existing }));
                                }
                            }
                        }
                    });
                    return () => unsub();
                }
            }
        } catch (e) { console.error(e); }
    }, []);

    const toggleArray = (key, val) => {
        setForm(f => {
            const arr = f[key] || [];
            return {
                ...f,
                [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val],
            };
        });
    };

    const handleSubmit = async () => {
        if (!customer || !projectId) {
            alert('로그인 후 이용해 주세요. 보정 대시보드에서 로그인하신 뒤 다시 시도해 주세요.');
            return;
        }
        try {
            await updateDoc(doc(db, 'retouch_masters', customer.id), {
                [`retouchChecklists.${projectId}`]: {
                    ...form,
                    submittedAt: new Date().toISOString(),
                },
            });
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            alert('저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
        }
    };

    const canNext = () => {
        if (step === 1) return !!form.desired_style;
        if (step === 2) return form.face_level > 0;
        if (step === 3) return form.body_level > 0;
        if (step === 4) return !!form.skin_finish;
        if (step === 5) return form.focus_areas.length > 0;
        if (step === 6) return true;
        return true;
    };

    // ─── 제출 완료 화면 ─────────────────────────────────────────
    if (submitted) {
        return (
            <div className="rcl-page">
                <div className="rcl-done-wrap">
                    <div className="rcl-done-icon">🎉</div>
                    <h2 className="rcl-done-title">보정 요청서가 전달되었습니다!</h2>
                    <p className="rcl-done-desc">
                        작가님이 고객님의 취향을 꼼꼼히 확인한 뒤<br />
                        최고의 보정본으로 찾아뵙겠습니다.
                    </p>
                    <div className="rcl-done-summary">
                        <div className="rcl-done-row"><span>원하는 결과</span><strong>{DESIRED_STYLES.find(s => s.id === form.desired_style)?.label.replace('\n', ' ') || '-'}</strong></div>
                        <div className="rcl-done-row"><span>얼굴 보정</span><strong>{form.face_level}단계</strong></div>
                        <div className="rcl-done-row"><span>몸매 보정</span><strong>{form.body_level}단계</strong></div>
                        <div className="rcl-done-row"><span>피부 표현</span><strong>{SKIN_FINISHES.find(s => s.id === form.skin_finish)?.label || '-'}</strong></div>
                    </div>
                    <a href="/retouch" className="rcl-done-btn">보정 대시보드로 돌아가기</a>
                </div>
            </div>
        );
    }

    return (
        <div className="rcl-page">
            {/* 헤더 */}
            <header className="rcl-header">
                <a href="/retouch" className="rcl-logo">
                    <span className="rcl-logo-fit">FIT</span><span className="rcl-logo-girls">GiRLS</span>
                </a>
                <p className="rcl-header-sub">BODY PROFILE</p>
            </header>

            {/* 스텝 바 */}
            <nav className="rcl-stepbar">
                {STEPS.map((s, i) => (
                    <div
                        key={i}
                        className={`rcl-step-item ${i + 1 === step ? 'active' : ''} ${i + 1 < step ? 'done' : ''}`}
                        onClick={() => i + 1 < step && setStep(i + 1)}
                    >
                        <div className="rcl-step-num">{i + 1 < step ? '✓' : i + 1}</div>
                        <span className="rcl-step-label">{s}</span>
                    </div>
                ))}
            </nav>

            <main className="rcl-main">
                <div className="rcl-content">

                    {/* ── STEP 1: 원하는 결과 느낌 ─────── */}
                    {step === 1 && (
                        <section className="rcl-section">
                            <div className="rcl-step-badge">STEP 1</div>
                            <h1 className="rcl-title">원하는 결과의 느낌을<br />선택해 주세요</h1>
                            <p className="rcl-subtitle">완성된 사진이 어떤 느낌이면 좋을지 선택해 주세요.<br />이 선택을 바탕으로 보정 강도를 추천해 드립니다.</p>
                            <div className="rcl-style-grid">
                                {DESIRED_STYLES.map(s => (
                                    <div
                                        key={s.id}
                                        className={`rcl-style-card ${form.desired_style === s.id ? 'selected' : ''} ${s.recommended ? 'recommended' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, desired_style: s.id }))}
                                    >
                                        {s.recommended && <div className="rcl-recommend-badge">핏걸즈 추천</div>}
                                        {form.desired_style === s.id && <div className="rcl-check-icon">✓</div>}
                                        <div className="rcl-style-label">{s.label}</div>
                                        <p className="rcl-style-desc">{s.desc}</p>
                                        <div className="rcl-style-meta">
                                            <span>얼굴 보정: {s.faceLvl}</span>
                                            <span>몸매 보정: {s.bodyLvl}</span>
                                            <span>{s.skinLvl}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="rcl-info-banner">
                                ℹ️ 선택하신 느낌을 기준으로 보정 강도를 추천해 드려요. 다음 단계에서 얼굴과 몸매를 각각 조정할 수 있습니다.
                            </div>
                        </section>
                    )}

                    {/* ── STEP 2: 얼굴 보정 강도 ────────── */}
                    {step === 2 && (
                        <section className="rcl-section">
                            <div className="rcl-step-badge">STEP 2</div>
                            <h1 className="rcl-title">얼굴 보정 강도를<br />선택해 주세요</h1>
                            <p className="rcl-subtitle">눈코입 비율, 얼굴 라인, 피부톤 등<br />얼굴 전반의 보정 강도를 조절합니다.</p>
                            <div className="rcl-level-row">
                                {FACE_LEVELS.map(lv => (
                                    <div
                                        key={lv.level}
                                        className={`rcl-level-card ${form.face_level === lv.level ? 'selected' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, face_level: lv.level }))}
                                    >
                                        <div className="rcl-level-num">{lv.level}</div>
                                        <div className="rcl-level-lbl">{lv.label}</div>
                                        <div className="rcl-level-desc">{lv.desc}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="rcl-level-scale">
                                <span>최소 보정</span>
                                <div className="rcl-scale-bar"><div className="rcl-scale-fill" style={{ width: `${(form.face_level / 5) * 100}%` }} /></div>
                                <span>드라마틱</span>
                            </div>
                            <div className="rcl-level-guide">
                                <div className="rcl-guide-row"><strong>1~2단계</strong> 잡티 제거 + 피부결 정돈, 자연스러운 윤곽</div>
                                <div className="rcl-guide-row"><strong>3단계</strong> 이목구비 비율 조정, 얼굴 라인 정리</div>
                                <div className="rcl-guide-row"><strong>4~5단계</strong> 확실한 성형급 보정, 드라마틱한 변화</div>
                            </div>
                        </section>
                    )}

                    {/* ── STEP 3: 몸매 보정 강도 ────────── */}
                    {step === 3 && (
                        <section className="rcl-section">
                            <div className="rcl-step-badge">STEP 3</div>
                            <h1 className="rcl-title">몸매 보정 강도를<br />선택해 주세요</h1>
                            <p className="rcl-subtitle">허리, 다리, 어깨 등 몸매 라인 전반의<br />보정 강도를 조절합니다.</p>
                            <div className="rcl-level-row">
                                {BODY_LEVELS.map(lv => (
                                    <div
                                        key={lv.level}
                                        className={`rcl-level-card ${form.body_level === lv.level ? 'selected' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, body_level: lv.level }))}
                                    >
                                        <div className="rcl-level-num">{lv.level}</div>
                                        <div className="rcl-level-lbl">{lv.label}</div>
                                        <div className="rcl-level-desc">{lv.desc}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="rcl-level-scale">
                                <span>최소 보정</span>
                                <div className="rcl-scale-bar"><div className="rcl-scale-fill" style={{ width: `${(form.body_level / 5) * 100}%` }} /></div>
                                <span>드라마틱</span>
                            </div>
                            <div className="rcl-ratio-section">
                                <h3 className="rcl-sub-title">신체 비율 변경 방향</h3>
                                <div className="rcl-ratio-grid">
                                    {BODY_RATIO_OPTIONS.map(r => (
                                        <div
                                            key={r.id}
                                            className={`rcl-ratio-card ${form.body_ratio_change === r.id ? 'selected' : ''}`}
                                            onClick={() => setForm(f => ({ ...f, body_ratio_change: r.id }))}
                                        >
                                            <div className="rcl-ratio-label">{r.label}</div>
                                            <div className="rcl-ratio-desc">{r.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── STEP 4: 피부 표현 ──────────────── */}
                    {step === 4 && (
                        <section className="rcl-section">
                            <div className="rcl-step-badge">STEP 4</div>
                            <h1 className="rcl-title">피부 표현을<br />선택해 주세요</h1>
                            <p className="rcl-subtitle">완성된 사진에서 피부가 어떻게 보이길 원하시나요?</p>
                            <div className="rcl-skin-grid">
                                {SKIN_FINISHES.map(s => (
                                    <div
                                        key={s.id}
                                        className={`rcl-skin-card ${form.skin_finish === s.id ? 'selected' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, skin_finish: s.id }))}
                                    >
                                        <div className="rcl-skin-icon">
                                            {s.id === 'natural' ? '🌿' : s.id === 'smooth' ? '✨' : s.id === 'glossy' ? '💎' : '🖤'}
                                        </div>
                                        <div className="rcl-skin-label">{s.label}</div>
                                        <div className="rcl-skin-desc">{s.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── STEP 5: 집중 보정 부위 ─────────── */}
                    {step === 5 && (
                        <section className="rcl-section">
                            <div className="rcl-step-badge">STEP 5</div>
                            <h1 className="rcl-title">집중적으로 보정할<br />부위를 선택해 주세요</h1>
                            <p className="rcl-subtitle">특별히 신경 써주셨으면 하는 부위를 선택해 주세요.<br />중복 선택 가능합니다.</p>
                            <div className="rcl-area-grid">
                                {FOCUS_AREAS.map(a => (
                                    <div
                                        key={a.id}
                                        className={`rcl-area-chip ${form.focus_areas.includes(a.id) ? 'selected' : ''}`}
                                        onClick={() => toggleArray('focus_areas', a.id)}
                                    >
                                        {form.focus_areas.includes(a.id) && <span className="rcl-chip-check">✓</span>}
                                        {a.label}
                                    </div>
                                ))}
                            </div>
                            <p className="rcl-selected-hint">
                                선택한 부위: {form.focus_areas.length > 0 ? form.focus_areas.map(id => FOCUS_AREAS.find(a => a.id === id)?.label).join(', ') : '아직 선택 없음'}
                            </p>
                        </section>
                    )}

                    {/* ── STEP 6: 유지할 특징 ──────────── */}
                    {step === 6 && (
                        <section className="rcl-section">
                            <div className="rcl-step-badge">STEP 6</div>
                            <h1 className="rcl-title">유지하고 싶은<br />특징을 선택해 주세요</h1>
                            <p className="rcl-subtitle">변화시키지 않았으면 하는 특징을 알려주세요.<br />중복 선택 가능합니다.</p>
                            <div className="rcl-area-grid">
                                {PRESERVE_FEATURES.map(f => (
                                    <div
                                        key={f.id}
                                        className={`rcl-area-chip preserve ${form.preserve_features.includes(f.id) ? 'selected' : ''}`}
                                        onClick={() => toggleArray('preserve_features', f.id)}
                                    >
                                        {form.preserve_features.includes(f.id) && <span className="rcl-chip-check">✓</span>}
                                        {f.label}
                                    </div>
                                ))}
                            </div>
                            <div className="rcl-additional-section">
                                <h3 className="rcl-sub-title">✍️ 추가 요청사항</h3>
                                <p className="rcl-add-guide">위 항목 외에 작가님께 특별히 전달하고 싶은 내용을 자유롭게 적어주세요.</p>
                                <textarea
                                    className="rcl-textarea"
                                    placeholder="예) 허리는 정리하되 골반은 과하게 넓히지 말아주세요."
                                    value={form.additional_request}
                                    onChange={e => setForm(f => ({ ...f, additional_request: e.target.value }))}
                                    rows={4}
                                />
                            </div>
                        </section>
                    )}

                    {/* ── STEP 7: 최종 확인 ─────────────── */}
                    {step === 7 && (
                        <section className="rcl-section">
                            <div className="rcl-step-badge">STEP 7</div>
                            <h1 className="rcl-title">보정 요청서를<br />최종 확인해 주세요</h1>
                            <p className="rcl-subtitle">아래 내용을 확인하신 후 제출해 주세요.</p>

                            <div className="rcl-summary-card">
                                <div className="rcl-summary-row">
                                    <span className="rcl-summary-key">원하는 결과 느낌</span>
                                    <span className="rcl-summary-val">
                                        {DESIRED_STYLES.find(s => s.id === form.desired_style)?.label.replace('\n', ' ') || '미선택'}
                                    </span>
                                </div>
                                <div className="rcl-summary-row">
                                    <span className="rcl-summary-key">얼굴 보정 강도</span>
                                    <span className="rcl-summary-val">{form.face_level ? `${form.face_level}단계` : '미선택'}</span>
                                </div>
                                <div className="rcl-summary-row">
                                    <span className="rcl-summary-key">몸매 보정 강도</span>
                                    <span className="rcl-summary-val">{form.body_level ? `${form.body_level}단계` : '미선택'}</span>
                                </div>
                                <div className="rcl-summary-row">
                                    <span className="rcl-summary-key">신체 비율 방향</span>
                                    <span className="rcl-summary-val">
                                        {BODY_RATIO_OPTIONS.find(r => r.id === form.body_ratio_change)?.label || '미선택'}
                                    </span>
                                </div>
                                <div className="rcl-summary-row">
                                    <span className="rcl-summary-key">피부 표현</span>
                                    <span className="rcl-summary-val">
                                        {SKIN_FINISHES.find(s => s.id === form.skin_finish)?.label || '미선택'}
                                    </span>
                                </div>
                                <div className="rcl-summary-row">
                                    <span className="rcl-summary-key">집중 보정 부위</span>
                                    <span className="rcl-summary-val">
                                        {form.focus_areas.length > 0
                                            ? form.focus_areas.map(id => FOCUS_AREAS.find(a => a.id === id)?.label).join(', ')
                                            : '미선택'}
                                    </span>
                                </div>
                                <div className="rcl-summary-row">
                                    <span className="rcl-summary-key">유지할 특징</span>
                                    <span className="rcl-summary-val">
                                        {form.preserve_features.length > 0
                                            ? form.preserve_features.map(id => PRESERVE_FEATURES.find(f => f.id === id)?.label).join(', ')
                                            : '없음'}
                                    </span>
                                </div>
                                {form.additional_request && (
                                    <div className="rcl-summary-row full">
                                        <span className="rcl-summary-key">추가 요청</span>
                                        <span className="rcl-summary-val">{form.additional_request}</span>
                                    </div>
                                )}
                            </div>

                            {!customer && (
                                <div className="rcl-login-warn">
                                    ⚠️ 로그인이 필요합니다. <a href="/retouch">보정 대시보드</a>에서 먼저 로그인해 주세요.
                                </div>
                            )}

                            <button className="rcl-submit-btn" onClick={handleSubmit}>
                                🎨 보정 요청서 제출하기
                            </button>
                            <p className="rcl-submit-note">제출 후에는 수정이 어렵습니다. 꼼꼼히 확인해 주세요.</p>
                        </section>
                    )}

                    {/* 네비게이션 버튼 */}
                    <div className="rcl-nav-buttons">
                        {step > 1 && (
                            <button className="rcl-btn-prev" onClick={() => setStep(s => s - 1)}>
                                ← 이전 단계
                            </button>
                        )}
                        {step < 7 && (
                            <button
                                className={`rcl-btn-next ${!canNext() ? 'disabled' : ''}`}
                                onClick={() => canNext() && setStep(s => s + 1)}
                            >
                                다음 단계로 →
                            </button>
                        )}
                    </div>
                </div>

                {/* 사이드 요약 패널 */}
                <aside className="rcl-sidebar">
                    <div className="rcl-sidebar-inner">
                        <div className="rcl-sidebar-header">나의 보정 요청 요약</div>
                        <div className="rcl-sidebar-rows">
                            <div className={`rcl-sb-row ${form.desired_style ? 'filled' : ''}`}>
                                <span>원하는 결과 느낌</span>
                                <strong>{DESIRED_STYLES.find(s => s.id === form.desired_style)?.label.replace('\n', ' ') || '–'}</strong>
                            </div>
                            <div className={`rcl-sb-row ${form.face_level ? 'filled' : ''}`}>
                                <span>얼굴 보정 강도</span>
                                <strong>{form.face_level ? `${form.face_level}단계` : '–'}</strong>
                            </div>
                            <div className={`rcl-sb-row ${form.body_level ? 'filled' : ''}`}>
                                <span>몸매 보정 강도</span>
                                <strong>{form.body_level ? `${form.body_level}단계` : '–'}</strong>
                            </div>
                            <div className={`rcl-sb-row ${form.skin_finish ? 'filled' : ''}`}>
                                <span>피부 표현</span>
                                <strong>{SKIN_FINISHES.find(s => s.id === form.skin_finish)?.label || '–'}</strong>
                            </div>
                            <div className={`rcl-sb-row ${form.focus_areas.length > 0 ? 'filled' : ''}`}>
                                <span>집중 보정 부위</span>
                                <strong>{form.focus_areas.length > 0 ? `${form.focus_areas.length}개 선택` : '–'}</strong>
                            </div>
                            <div className={`rcl-sb-row ${form.preserve_features.length > 0 ? 'filled' : ''}`}>
                                <span>유지할 특징</span>
                                <strong>{form.preserve_features.length > 0 ? `${form.preserve_features.length}개 선택` : '–'}</strong>
                            </div>
                        </div>
                        <a href="/retouch" className="rcl-sb-consult-btn">📋 상담 예약하기</a>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default RetouchChecklist;
