import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.HOME+'/.cache/ms-playwright/chromium-1223/chrome-linux/chrome', args:['--no-sandbox','--disable-gpu'] });
const p = await b.newPage({ viewport:{width:1366,height:1000} });
await p.goto('http://127.0.0.1:8099/',{waitUntil:'domcontentloaded',timeout:12000});
await p.waitForTimeout(2000);
await p.screenshot({path:'/tmp/blog-home.png'});
await b.close(); console.log('shot ok');
