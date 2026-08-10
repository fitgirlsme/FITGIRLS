import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://fitgirls.me/lookbook', { waitUntil: 'networkidle0' });
  
  // check if 404 is visible
  const is404 = await page.evaluate(() => {
    return document.body.innerText.includes('404');
  });
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log("Is 404?", is404);
  console.log("Body text starts with:", text.substring(0, 100));
  
  await browser.close();
})();
