/**
 * 현재 브라우저의 도메인(hostname) 또는 쿼리 파라미터를 기반으로
 * 네버랜드 브랜드 페이지에 접속 중인지 판단합니다.
 */
export const isNeverlandDomain = () => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    // 쿼리 매개변수로 ?brand=neverland가 들어오거나 URL 경로가 /neverland로 시작하는 경우
    return path.startsWith('/neverland') || searchParams.get('brand') === 'neverland';
};
