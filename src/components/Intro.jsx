import React from 'react';
import './Intro.css';

const Intro = () => {
    return (
        <section className="snap-section hero-intro-container">
            {/* 실시간 사이트의 비디오 배경 구조 반영 */}
            <video 
                className="hero-intro-video" 
                autoPlay 
                muted 
                loop 
                playsInline
                poster="/images/hero-bg2.jpg"
            >
                <source src="/images/intro-bg.mp4" type="video/mp4" />
            </video>
            <div className="hero-intro-overlay"></div>
            
            <div className="hero-intro-inner container">
                <span className="hero-intro-label">FITORIALIST</span>
                <p className="hero-intro-desc">
                    '단순한 바디 기록을 넘어, 나만의 아우라를 한 장의 화보로 완성하는 방식!'<br />
                    올해 핏걸즈 & 이너핏이 제안하는 핏토리얼리스트의 핵심은 바로 이것이다.<br />
                    단순히 근육의 선명도에 집착하는 대신, 피사체가 가진 고유의 무드와 에너지를<br />
                    매거진 컷처럼 담아내는 것이 포인트. 이때 레드 컬러처럼 강렬하고<br />
                    주체적인 자신감을 얹으면 훨씬 더 흡입력 있는 화보를 연출할 수 있다.<br />
                    방법은 간단하다. 카메라 앞에서 가장 나다운 표정과 숨결에 집중하는 것이다.
                </p>
            </div>
        </section>
    );
};

export default Intro;
