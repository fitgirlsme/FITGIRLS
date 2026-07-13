import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.join(__dirname, '..');
const distPath = path.join(workspaceRoot, 'dist');

console.log('=== RUNNING STATIC SMOKE TEST ===');

const pagesToCheck = [
    { path: 'index.html', expectText: '핏걸즈 & 이너핏 스튜디오' },
    { path: 'en/index.html', expectText: 'FITGIRLS & INAFIT Studio' },
    { path: 'ja/index.html', expectText: 'FITGIRLS & INAFIT スタジオ' },
    { path: 'zh/index.html', expectText: 'FITGIRLS & INAFIT 摄影棚' },
    { path: 'gallery/index.html', expectText: '핏걸즈 아카이브 갤러리' },
    { path: 'en/gallery/index.html', expectText: 'FITGIRLS Archive Gallery' },
    { path: 'service/index.html', expectText: '핏걸즈 서비스 및 가격 안내' },
    { path: 'en/service/index.html', expectText: 'FITGIRLS Pricing & Services' }
];

let failed = false;

pagesToCheck.forEach(({ path: pagePath, expectText }) => {
    const fullPath = path.join(distPath, pagePath);
    if (!fs.existsSync(fullPath)) {
        console.error(`❌ FAILED: File does not exist -> ${fullPath}`);
        failed = true;
        return;
    }

    const html = fs.readFileSync(fullPath, 'utf8');
    
    // 1. #root 자식 요소 및 프리렌더 텍스트 검출
    if (!html.includes('<div id="root">')) {
        console.error(`❌ FAILED: <div id="root"> element not found in ${pagePath}`);
        failed = true;
        return;
    }
    
    const rootMatch = html.match(/<div id="root">([\s\S]*?)<\/div>/);
    if (!rootMatch) {
        console.error(`❌ FAILED: Failed to parse #root contents in ${pagePath}`);
        failed = true;
        return;
    }

    const rootContent = rootMatch[1];
    if (!rootContent.includes(expectText)) {
        console.error(`❌ FAILED: Expected prerender text "${expectText}" not found in #root of ${pagePath}. Current #root content: "${rootContent}"`);
        failed = true;
        return;
    }

    // 2. 주요 JS 번들 및 CSS 로드 확인
    const hasJsBundle = html.includes('script type="module"') && html.includes('/assets/index-');
    const hasCssBundle = html.includes('link rel="stylesheet"') && html.includes('/assets/index-');

    if (!hasJsBundle) {
        console.error(`❌ FAILED: JS Module script bundle reference is missing in ${pagePath}`);
        failed = true;
    }
    if (!hasCssBundle) {
        console.error(`❌ FAILED: CSS Link bundle reference is missing in ${pagePath}`);
        failed = true;
    }

    if (!failed) {
        console.log(`✅ PASSED: ${pagePath} is structurally healthy. Prerendered body verified.`);
    }
});

if (failed) {
    console.error('=== SMOKE TEST FAILED! PREVENTING PRODUCTION DEPLOY ===');
    process.exit(1);
} else {
    console.log('=== SMOKE TEST PASSED SUCCESSFULLY! ===');
    process.exit(0);
}
