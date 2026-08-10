import React, { useState, useEffect, useRef } from 'react';

// wsrv.nl Image CDN Proxy Helper (Disabled due to Firebase CORS/Token issues)
export const getOptimizedImageUrl = (originalUrl, width = 1080) => {
    // For now, return original URL as wsrv.nl fails with Firebase Storage URLs
    return originalUrl;
};

const VirtualImage = ({ 
    src, 
    alt, 
    width = 1080, 
    className = '', 
    style = {}, 
    loading = 'lazy',
    fetchpriority = 'auto',
    // props below are kept for API compatibility but no longer used
    placeholderHeight,
    rootMargin = '1500px', // OOM 방지를 위한 가상화 마진
    scrollRootSelector 
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);
    const optimizedSrc = getOptimizedImageUrl(src, width);

    // iOS WebKit OOM 크래시 방지를 위한 Virtualization (가상화) 처리
    useEffect(() => {
        const currentRef = containerRef.current;
        if (!currentRef) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                } else {
                    // 화면에서 크게 벗어나면(rootMargin 밖) img 태그를 언마운트하여 DOM 메모리 즉각 해제
                    setIsVisible(false);
                    setIsLoaded(false);
                }
            },
            {
                rootMargin: rootMargin,
                threshold: 0
            }
        );

        observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, [rootMargin]);

    return (
        <div 
            ref={containerRef}
            className={`virtual-image-container ${className} ${!isLoaded ? 'is-loading' : ''}`} 
            style={{ 
                width: '100%',
                height: '100%',
                display: 'block', 
                position: 'relative',
                ...style 
            }}
        >
            {!isLoaded && (
                <div className="virtual-image-skeleton" style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'skeleton-loading 1.5s infinite',
                    borderRadius: '8px'
                }}></div>
            )}
            
            {isVisible && (
                <img 
                    src={optimizedSrc} 
                    alt={alt} 
                    className={className} 
                    style={{
                        ...style, 
                        width: '100%', 
                        height: '100%', // Fills the aspect-ratio container perfectly
                        objectFit: 'cover',
                        display: 'block', 
                        opacity: isLoaded ? 1 : 0, 
                        transition: 'opacity 0.3s ease'
                    }}
                    loading={loading}
                    fetchpriority={fetchpriority}
                    decoding="async"
                    onLoad={() => setIsLoaded(true)}
                />
            )}
            <style>{`
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};

export default VirtualImage;
