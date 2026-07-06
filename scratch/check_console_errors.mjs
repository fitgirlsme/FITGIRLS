import puppeteer from 'puppeteer';

async function checkPage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // 모바일 뷰포트 시뮬레이션 (iPhone X 크기)
  await page.setViewport({
    width: 375,
    height: 812,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  // 콘솔 에러 수집
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.error('BROWSER PAGE EXCEPTION:', err.stack);
  });

  try {
    console.log('Navigating to http://localhost:5000...');
    await page.goto('http://localhost:5000', { waitUntil: 'domcontentloaded', timeout: 5000 });
    
    // 진단 로그 출력
    const layoutInfo = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const root = document.querySelector('#root');
      const rootLayout = document.querySelector('.root-layout');
      const appContainer = document.querySelector('.app-container');
      const snapContainer = document.querySelector('.snap-container');
      
      return {
        html: { sh: html.scrollHeight, ch: html.clientHeight, overflow: window.getComputedStyle(html).overflow },
        body: { sh: body.scrollHeight, ch: body.clientHeight, overflow: window.getComputedStyle(body).overflow },
        root: root ? { sh: root.scrollHeight, ch: root.clientHeight } : null,
        rootLayout: rootLayout ? { sh: rootLayout.scrollHeight, ch: rootLayout.clientHeight } : null,
        appContainer: appContainer ? { sh: appContainer.scrollHeight, ch: appContainer.clientHeight, overflow: window.getComputedStyle(appContainer).overflow, heightStyle: window.getComputedStyle(appContainer).height } : null,
        snapContainer: snapContainer ? { sh: snapContainer.scrollHeight, ch: snapContainer.clientHeight, overflow: window.getComputedStyle(snapContainer).overflow, heightStyle: window.getComputedStyle(snapContainer).height } : null,
      };
    });
    console.log('LAYOUT INFO:', JSON.stringify(layoutInfo, null, 2));

    console.log('Page loaded. Initial scroll position:', await page.evaluate(() => window.scrollY));
    
    // 초기(스크롤 0) 상태에서 헤더의 클래스 확인
    let headerClass = await page.evaluate(() => {
      const header = document.querySelector('.app-header');
      return header ? header.className : 'NOT_FOUND';
    });
    console.log('Initial header classes:', headerClass);

    // 스크롤을 3페이지 분량(예: 1500px) 아래로 내리기
    console.log('Scrolling down to 1500px...');
    await page.evaluate(() => {
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        appContainer.scrollTop = 1500;
      }
      window.scrollTo(0, 1500);
    });
    
    // 스크롤 완료를 대기하기 위해 500ms 지연
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Scroll position after scrolling:', await page.evaluate(() => window.scrollY));

    // 스크롤 후 상태에서 헤더의 클래스 확인
    headerClass = await page.evaluate(() => {
      const header = document.querySelector('.app-header');
      return header ? header.className : 'NOT_FOUND';
    });
    console.log('Header classes after scroll:', headerClass);

  } catch (err) {
    console.error('Navigation or test failed:', err);
  } finally {
    await browser.close();
  }
}

checkPage();
