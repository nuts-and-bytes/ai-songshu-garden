import { chromium } from 'playwright';
const exec = process.env.HOME + '/.cache/ms-playwright/chromium-1223/chrome-linux/chrome';
const b = await chromium.launch({ executablePath: exec, args:['--no-sandbox'] });
const p = await b.newPage({ viewport:{width:1440,height:1500}, deviceScaleFactor:1 });
async function shot(url, file){ await p.goto(url,{waitUntil:'networkidle'}); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(800); await p.screenshot({path:file, fullPage:false}); console.log('shot',file); }
await shot('http://localhost:8099/', '/tmp/blog-home.png');
await shot('http://localhost:8099/如何用-Claude-Code-搭一个会自动整理的知识库', '/tmp/blog-post.png');
await shot('http://localhost:8099/Wiki/Andrej-Karpathy', '/tmp/blog-wiki.png');
await b.close(); console.log('done');
