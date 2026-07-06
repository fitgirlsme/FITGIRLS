import React from 'react';
import { useNavigate } from 'react-router-dom';
import FadeInSection from '../FadeInSection';
import './ChallengePromo.css';

const ChallengePromo = () => {
    const navigate = useNavigate();

    const handleExplore = () => {
        navigate('/challenges');
        // Smooth scroll to top of page when navigating
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="challenge-promo-section-container">
            <div className="challenge-promo-bg-glow"></div>
            
            <div className="challenge-promo-content">
                <div className="challenge-promo-header">
                    <span className="promo-tag">한정 인원 모집</span>
                    <h2 className="promo-title">
                        FITGIRLS<br/>
                        <span className="gradient-text">CHALLENGE</span>
                    </h2>
                    <p className="promo-subtitle">궁극의 바디 & 비주얼 레볼루션</p>
                </div>

                <div className="promo-body-grid">
                    <div className="promo-manifesto-col">
                        <FadeInSection delay={0.1}>
                            <p className="manifesto-text">
                                단순한 다이어트나 운동 그 이상입니다. 이것은 자신의 한계를 재정의하고 자신만의 강인함을 가장 예술적인 형태로 담아내고자 하는 여성들을 위해 설계된 변화의 여정입니다.
                            </p>
                        </FadeInSection>
                        
                        <FadeInSection delay={0.3}>
                            <p className="manifesto-subtext">
                                우리는 엘리트 트레이닝 디렉션, 전문적인 스타일링, 그리고 하이패션 에디토리얼 사진 촬영을 결합합니다. 마스터 디렉터들의 가이드 아래, 당신은 스스로도 존재조차 몰랐던 수준의 자신감과 존재감을 발견하게 될 것입니다.
                            </p>
                        </FadeInSection>

                        <FadeInSection delay={0.5}>
                            <button className="promo-cta-btn" onClick={handleExplore}>
                                <span>챌린지 알아보기</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" />
                                    <polyline points="12 5 19 12 12 19" stroke="currentColor" />
                                </svg>
                            </button>
                        </FadeInSection>
                    </div>

                    <div className="promo-phases-col">
                        <div className="phase-card">
                            <div className="phase-num">01</div>
                            <div className="phase-info">
                                <h3 className="phase-title">비주얼 큐레이션</h3>
                                <p className="phase-desc">개인 맞춤형 무드보드 설정, 콘셉트 캐스팅, 맞춤형 의상 선택을 통해 나만의 독창적인 에스테틱을 정의합니다.</p>
                            </div>
                        </div>

                        <div className="phase-card">
                            <div className="phase-num">02</div>
                            <div className="phase-info">
                                <h3 className="phase-title">포징 마스터클래스</h3>
                                <p className="phase-desc">자연스럽고 자신감 넘치는 모습을 위해 자세, 포즈, 표정에 대한 전반적인 코칭을 제공합니다.</p>
                            </div>
                        </div>

                        <div className="phase-card">
                            <div className="phase-num">03</div>
                            <div className="phase-info">
                                <h3 className="phase-title">그랜드 피토리얼</h3>
                                <p className="phase-desc">베테랑 아티스트들이 디렉팅하는 프리미엄 에디토리얼 촬영을 통해 잡지 화보 수준의 비주얼 포트폴리오를 제작합니다.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChallengePromo;
