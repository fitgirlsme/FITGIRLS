import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('dist/index.html', 'utf8');

const dom = new JSDOM(html, {
  url: 'https://fitgirls.me/lookbook',
  runScripts: "dangerously",
  resources: "usable",
  beforeParse(window) {
    window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
    window.scrollTo = () => {};
    window.IntersectionObserver = class {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

dom.window.console.log = (...args) => console.log('LOG:', ...args);
dom.window.console.error = (...args) => console.error('ERR:', ...args);
dom.window.console.warn = (...args) => console.warn('WARN:', ...args);

setTimeout(() => {
  console.log("BODY CONTENT AFTER 3 SECONDS:");
  const inner = dom.window.document.body.innerHTML;
  if (inner.includes('404')) {
    console.log("FOUND 404!");
  } else {
    console.log("Did not find 404.");
    console.log(inner.substring(0, 1000)); // Print start of HTML
  }
  process.exit(0);
}, 3000);
