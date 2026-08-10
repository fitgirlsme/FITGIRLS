import React, { useState, useEffect, useRef } from 'react';

// wsrv.nl Image CDN Proxy Helper (Disabled due to Firebase CORS/Token issues)
export const getOptimizedImageUrl = (originalUrl, width = 1080) => {
    // For now, return original URL as wsrv.nl fails with Firebase Storage URLs
    return originalUrl;
};

const VirtualImage = ({ 
    src, 
    mobileSrc,
    tabletSrc,
    srcSet,
    sizes,
    alt, 
    width = 1080, 
    className = '', 
    style = {}, 
    loading = 'lazy',
    fetchpriority = 'auto',
    isPriority = false,
    placeholderHeight,
    rootMargin, 
    scrollRootSelector 
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(isPriority);
    const containerRef = useRef(null);
    const optimizedSrc = getOptimizedImageUrl(src, width);

    // HTML5 반응형 이미지 srcSet 및 sizes 생성 (480p 모바일 / 1080p 태블릿 / 1980p 원본)
    const computedSrcSet = srcSet || (() => {
        if (!mobileSrc && !tabletSrc) return undefined;
        const mob = mobileSrc || tabletSrc || src;
        const tab = tabletSrc || src;
        return `${mob} 480w, ${tab} 1080w, ${src} 1980w`;
    })();

    const computedSizes = sizes || (computedSrcSet ? "(max-width: 768px) 48vw, (max-width: 1024px) 30vw, 22vw" : undefined);

    // 모바일 환경에선 300px, 데스크톱에선 800px로 동적 가상화 마진 할당 (네트워크 병목 방지)
    const dynamicRootMargin = rootMargin || (typeof window !== 'undefined' && window.innerWidth < 768 ? '300px' : '800px');

    // iOS WebKit OOM 크래시 방지 및 가상화 처리
    useEffect(() => {
        if (isPriority) {
            setIsVisible(true);
            return;
        }

        const currentRef = containerRef.current;
        if (!currentRef) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                    setIsLoaded(false);
                }
            },
            {
                rootMargin: dynamicRootMargin,
                threshold: 0
            }
        );

        observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, [dynamicRootMargin, isPriority]);

    const finalLoading = isPriority ? 'eager' : loading;
    const finalPriority = isPriority ? 'high' : fetchpriority;

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
                    srcSet={computedSrcSet}
                    sizes={computedSizes}
                    alt={alt} 
                    className={className} 
                    style={{
                        ...style, 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        display: 'block', 
                        opacity: isLoaded ? 1 : 0, 
                        transition: 'opacity 0.3s ease'
                    }}
                    loading={finalLoading}
                    fetchpriority={finalPriority}
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
