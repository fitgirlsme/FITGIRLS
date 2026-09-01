import React, { useEffect } from 'react';
import './Retouch.css';

const Retouch = () => {
    useEffect(() => {
        // 즉시 오걸즈 보정 시스템으로 리다이렉트
        window.location.replace('https://book.fitgirls.me/retouch');
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#0a0a0a',
            color: '#fff',
            fontFamily: 'Inter, Pretendard, sans-serif',
            padding: '24px',
            textAlign: 'center'
        }}>
            <div style={{
                background: '#141414',
                border: '1px solid #222',
                borderRadius: '16px',
                padding: '40px 24px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>✨</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.02em' }}>
                    핏걸즈(FITGIRLS) 보정 시스템으로 이동 중입니다
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '28px' }}>
                    보정본 확인 및 요청 시스템이 <strong>핏걸즈(fitgirls.me)</strong>로 통합되었습니다.<br />
                    잠시 후 자동으로 이동합니다.
                </p>
                <a
                    href="https://book.fitgirls.me/retouch"
                    style={{
                        display: 'inline-block',
                        background: '#FF003C',
                        color: '#fff',
                        textDecoration: 'none',
                        padding: '14px 28px',
                        borderRadius: '30px',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        transition: 'opacity 0.2s ease'
                    }}
                >
                    지금 바로 이동하기 →
                </a>
            </div>
        </div>
    );
};

export default Retouch;

