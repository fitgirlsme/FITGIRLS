import { db } from './firebase';
import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';

// 오늘 날짜 키 (YYYY-MM-DD)
const getTodayKey = () => new Date().toISOString().slice(0, 10);

// 이번 달 키 (YYYY-MM)
const getMonthKey = () => new Date().toISOString().slice(0, 7);

// 현재 시간대 (0~23)
const getHourKey = () => String(new Date().getHours()).padStart(2, '0');

/**
 * 유입 경로(referrer) 분류
 */
const getReferrerSource = () => {
    const ref = document.referrer;
    if (!ref) return 'direct';
    if (ref.includes('instagram') || ref.includes('l.instagram') || ref.includes('lm.facebook')) return 'instagram';
    if (ref.includes('facebook')) return 'facebook';
    if (ref.includes('google')) return 'google';
    if (ref.includes('naver')) return 'naver';
    if (ref.includes('kakao') || ref.includes('kakaotalk')) return 'kakao';
    if (ref.includes('youtube')) return 'youtube';
    if (ref.includes('twitter') || ref.includes('t.co')) return 'twitter';
    if (ref.includes('fitgirls.me') || ref.includes('fitgirls-me-web')) return 'internal';
    return 'other';
};

/**
 * 기기 유형 감지 (mobile / tablet / pc)
 */
const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return 'tablet';
    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
    return 'pc';
};

/**
 * 페이지 방문 추적
 * @param {string} path - 방문한 페이지 경로 (예: '/service')
 */
export const trackVisit = async (path) => {
    // 관리자 로그인 상태이면 카운트 제외
    if (localStorage.getItem('admin_logged_in') === 'true') return;
    // /admin 페이지 자체도 제외
    if (path.startsWith('/admin')) return;

    try {
        const today = getTodayKey();
        const month = getMonthKey();
        const hour = getHourKey();
        const source = getReferrerSource();
        const device = getDeviceType();

        // UTM 파라미터 추출 (?utm_source=instagram&utm_campaign=ambassador_A)
        const params = new URLSearchParams(window.location.search);
        const utmSource = params.get('utm_source') || 'none';
        const utmCampaign = params.get('utm_campaign') || 'none';

        // 페이지명 정리
        const pageName = path === '/' ? 'home' : path.replace('/', '');

        // 일별 통계 저장
        const dailyRef = doc(db, 'analytics_daily', today);
        const dailySnap = await getDoc(dailyRef);

        const dailyUpdateData = {
            total: increment(1),
            [`pages.${pageName}`]: increment(1),
            [`hours.${hour}`]: increment(1),
            [`sources.${source}`]: increment(1),
            [`devices.${device}`]: increment(1),
            updatedAt: serverTimestamp(),
        };

        if (utmSource !== 'none') dailyUpdateData[`utmSources.${utmSource}`] = increment(1);
        if (utmCampaign !== 'none') dailyUpdateData[`utmCampaigns.${utmCampaign}`] = increment(1);

        if (dailySnap.exists()) {
            await setDoc(dailyRef, dailyUpdateData, { merge: true });
        } else {
            const initialData = {
                date: today,
                total: 1,
                pages: { [pageName]: 1 },
                hours: { [hour]: 1 },
                sources: { [source]: 1 },
                devices: { [device]: 1 },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            if (utmSource !== 'none') initialData.utmSources = { [utmSource]: 1 };
            if (utmCampaign !== 'none') initialData.utmCampaigns = { [utmCampaign]: 1 };

            await setDoc(dailyRef, initialData);
        }

        // 월별 총계 저장
        const monthRef = doc(db, 'analytics_monthly', month);
        const monthUpdateData = {
            total: increment(1),
            [`pages.${pageName}`]: increment(1),
            [`sources.${source}`]: increment(1),
            [`devices.${device}`]: increment(1),
            updatedAt: serverTimestamp(),
        };
        
        if (utmSource !== 'none') monthUpdateData[`utmSources.${utmSource}`] = increment(1);
        if (utmCampaign !== 'none') monthUpdateData[`utmCampaigns.${utmCampaign}`] = increment(1);

        await setDoc(monthRef, monthUpdateData, { merge: true });

    } catch (e) {
        console.debug('Analytics track skipped:', e.message);
    }
};

/**
 * 예약 버튼 클릭 추적
 */
export const trackReservationClick = async () => {
    try {
        const today = getTodayKey();
        const dailyRef = doc(db, 'analytics_daily', today);
        await setDoc(dailyRef, {
            reservationClicks: increment(1),
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (e) {
        console.debug('Reservation click track skipped:', e.message);
    }
};
