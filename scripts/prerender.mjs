import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.join(__dirname, '..');

const distPath = path.join(workspaceRoot, 'dist');
const metadataPath = path.join(workspaceRoot, 'src', 'seo_metadata.json');
const indexHtmlPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
    console.error('Error: dist/index.html not found! Run npm run build first.');
    process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const indexTemplate = fs.readFileSync(indexHtmlPath, 'utf8');

const supportedLangs = ['ko', 'en', 'ja', 'zh'];
const corePaths = ['/', '/gallery', '/service', '/location', '/faq', '/studios'];

const pageBodies = {
    "/": {
        ko: "<h1>핏걸즈 & 이너핏 스튜디오</h1><p>압도적인 무드의 여자 바디프로필, 피토리얼리스트 화보 전문 촬영. 고객별 맞춤 포즈, 무드, 스타일링 무료 기획.</p>",
        en: "<h1>FITGIRLS & INAFIT Studio</h1><p>Premium female body profile and editorial photo studio in Seoul. Tailored poses, moods, and styling.</p>",
        ja: "<h1>FITGIRLS & INAFIT スタジオ</h1><p>ソウル江南・新沙洞の女性専用ボディプロフィール・プレミアムエディトリアルスタジオ。ヘアメイク・衣装プランニング無料。</p>",
        zh: "<h1>FITGIRLS & INAFIT 摄影棚</h1><p>首尔江南新沙洞的高端女子健身写真及高端时尚大片拍摄专业摄影棚。打造专属杂志级写真效果。</p>"
    },
    "/gallery": {
        ko: "<h1>핏걸즈 아카이브 갤러리</h1><p>핏걸즈 고객들의 실제 바디프로필 촬영 결과물 화보 아카이브를 확인할 수 있습니다.</p>",
        en: "<h1>FITGIRLS Archive Gallery</h1><p>Browse actual body profile and pictorial portfolio photoshoots from our clients.</p>",
        ja: "<h1>FITGIRLS アーカイブギャラリー</h1><p>FITGIRLSのお客様の実際のボディプロフィールおよびポートフォリオ作品がご覧いただけます。</p>",
        zh: "<h1>FITGIRLS 健身写真作品集</h1><p>查看客户的真实健身写真与时尚大片拍摄作品阿卡伊布。</p>"
    },
    "/service": {
        ko: "<h1>핏걸즈 서비스 및 가격 안내</h1><p>촬영 패키지별 요금표, 헤어 메이크업 및 의상 대여 서비스 가격표 상세 안내입니다.</p>",
        en: "<h1>FITGIRLS Pricing & Services</h1><p>Detailed service pricing, body profile packages, hair, makeup, and rental services guide.</p>",
        ja: "<h1>FITGIRLS 料金・サービス案内</h1><p>ボディプロフィール撮影パッケージ料金、ヘアメイク、衣装レンタルの料金案内です。</p>",
        zh: "<h1>FITGIRLS 服务套餐与费用说明</h1><p>健身写真套餐价格、发型化妆及服装租赁服务收费详情指南。</p>"
    },
    "/location": {
        ko: "<h1>핏걸즈 오시는 길</h1><p>서울특별시 강남구 신사동에 위치한 핏걸즈 스튜디오로 오시는 대중교통 및 주차 안내입니다.</p>",
        en: "<h1>FITGIRLS Location Guide</h1><p>Directions to our Gangnam Sinsa-dong studio by subway, bus, and parking options.</p>",
        ja: "<h1>FITGIRLS アクセス案内</h1><p>ソウル市江南区新沙洞（シンサドン）スタジオへの行き方。地下鉄・バス・駐車場案内。</p>",
        zh: "<h1>FITGIRLS 摄影棚地址指南</h1><p>前往首尔市江南区新沙洞工作室的地铁、公交及周边停车场收费信息指南。</p>"
    },
    "/faq": {
        ko: "<h1>핏걸즈 자주 묻는 질문 (FAQ)</h1><p>바디프로필 촬영 예약, 준비사항, 의상대여, 보정 기간에 대해 답변해 드립니다.</p>",
        en: "<h1>FITGIRLS FAQ</h1><p>Answers to common questions regarding photoshoot booking, preparations, rentals, and retouching.</p>",
        ja: "<h1>FITGIRLS よくある質問 (FAQ)</h1><p>撮影の予約、準備事項、衣装レンタル、レタッチ作業期間についてのQA集です。</p>",
        zh: "<h1>FITGIRLS 常见问题问答 (FAQ)</h1><p>为您解答有关健身写真预约、准备工作、服装租借、修图周期等常见疑问。</p>"
    },
    "/studios": {
        ko: "<h1>핏걸즈 스튜디오 룸 컨셉</h1><p>80개 이상의 프리미엄 배경 존을 갖춘 핏걸즈 강남 스튜디오 내부 룸 컨셉 정보입니다.</p>",
        en: "<h1>FITGIRLS Studio Concepts</h1><p>Explore our premium studio rooms featuring 80+ unique background zones in Gangnam.</p>",
        ja: "<h1>FITGIRLS スタジオルームコンセプト</h1><p>江南新沙洞に位置する80以上の多様なコンセプト背景を持つスタジオ撮影ルーム案内。</p>",
        zh: "<h1>FITGIRLS 摄影棚场景概念</h1><p>拥有80余种高质感立体背景墙的江南新沙洞专业摄影棚场景介绍。</p>"
    }
};

const baseDomain = 'https://fitgirls.me';

// Generate all target pages
const pagesToPrerender = [];

corePaths.forEach(corePath => {
    supportedLangs.forEach(lang => {
        pagesToPrerender.push({ corePath, lang });
    });
});

console.log(`Starting prerendering for ${pagesToPrerender.length} pages...`);

pagesToPrerender.forEach(({ corePath, lang }) => {
    // Determine target output path
    let routePath = '';
    if (lang === 'ko') {
        routePath = corePath === '/' ? '/' : corePath;
    } else {
        routePath = corePath === '/' ? `/${lang}` : `/${lang}${corePath}`;
    }

    // Load meta mapping (resolve `/gallery` mapping to `/archive` in json)
    const metaKey = corePath === '/gallery' ? '/archive' : corePath;
    const langMeta = metadata[metaKey]?.[lang === 'zh' ? 'zh' : lang] || metadata[metaKey]?.['ko'];
    
    if (!langMeta) {
        console.warn(`Warning: Meta not found for key: ${metaKey}, lang: ${lang}`);
        return;
    }

    const title = langMeta.title;
    const desc = langMeta.desc;
    const keywords = langMeta.keywords;
    const canonicalUrl = `${baseDomain}${routePath}`;
    const htmlLang = lang === 'zh' ? 'zh-Hans' : lang;

    // Generate Hreflangs
    let hreflangTags = '';
    supportedLangs.forEach(l => {
        let hreflangPath = '';
        if (l === 'ko') {
            hreflangPath = corePath === '/' ? '/' : corePath;
        } else {
            hreflangPath = corePath === '/' ? `/${l}` : `/${l}${corePath}`;
        }
        const mappedHreflang = l === 'zh' ? 'zh-Hans' : l;
        hreflangTags += `  <link rel="alternate" hreflang="${mappedHreflang}" href="${baseDomain}${hreflangPath}" />\n`;
    });
    
    // Add x-default pointing to default Korean URL
    const defaultKoreanPath = corePath === '/' ? '/' : corePath;
    hreflangTags += `  <link rel="alternate" hreflang="x-default" href="${baseDomain}${defaultKoreanPath}" />`;

    // Fetch static core body
    const bodyContent = pageBodies[corePath]?.[lang] || '';

    // Replace header values in HTML template
    let prerenderedHtml = indexTemplate;

    // Replace Lang
    prerenderedHtml = prerenderedHtml.replace(/<html lang="[^"]*">/, `<html lang="${htmlLang}">`);

    // Replace Title
    prerenderedHtml = prerenderedHtml.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

    // Replace Description
    prerenderedHtml = prerenderedHtml.replace(/<meta name="description"[^>]*\/>/, `<meta name="description" content="${desc}" />`);

    // Replace Keywords
    prerenderedHtml = prerenderedHtml.replace(/<meta name="keywords"[^>]*\/>/, `<meta name="keywords" content="${keywords}" />`);

    // Replace Canonical
    prerenderedHtml = prerenderedHtml.replace(/<link rel="canonical"[^>]*\/>/, `<link rel="canonical" href="${canonicalUrl}" />`);

    // Replace Hreflang block (target our hreflangs block)
    // index.html contains multiple alternate links line by line. Let's find and strip them out
    const alternateRegex = /<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\s*/g;
    prerenderedHtml = prerenderedHtml.replace(alternateRegex, '');
    
    // Inject new hreflangs before target link rel="preconnect"
    prerenderedHtml = prerenderedHtml.replace('<link rel="preconnect"', `${hreflangTags}\n  <link rel="preconnect"`);

    // Inject prerendered body inside <div id="root">
    prerenderedHtml = prerenderedHtml.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);

    // Write file to target folder
    if (routePath === '/') {
        // Direct overwrite main index
        fs.writeFileSync(indexHtmlPath, prerenderedHtml, 'utf8');
        console.log(`Prerendered default root -> ${indexHtmlPath}`);
    } else {
        const outputDir = path.join(distPath, routePath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, 'index.html');
        fs.writeFileSync(outputPath, prerenderedHtml, 'utf8');
        console.log(`Prerendered page -> ${outputPath}`);
    }
});

console.log('Prerendering successfully finished!');
