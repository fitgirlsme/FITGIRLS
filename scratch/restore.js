import puppeteer from 'puppeteer';

(async () => {
    console.log("Starting browser...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Auto-accept all window.confirm dialogs
    page.on('dialog', async dialog => {
        console.log(`Accepted dialog: ${dialog.message()}`);
        await dialog.accept();
    });

    console.log("Navigating to https://fitgirls.me/admin");
    await page.goto('https://fitgirls.me/admin', { waitUntil: 'networkidle2' });
    
    console.log("Logging in...");
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    
    // Wait for tabs to load
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Navigating to Studios tab...");
    // Find the button with text "📸 Studio Zones"
    const tabs = await page.$$('.admin-tab');
    for (const tab of tabs) {
        const text = await page.evaluate(el => el.textContent, tab);
        if (text.includes('Studio Zones')) {
            await tab.click();
            break;
        }
    }
    await new Promise(r => setTimeout(r, 2000));

    // Wait until the old 13 items are fully loaded before deleting
    console.log("Looking for Delete buttons...");
    const deleteBtns = await page.$$('button.delete');
    for (const btn of deleteBtns) {
        await btn.click();
        await new Promise(r => setTimeout(r, 1000)); // wait for deletion
    }
    
    console.log("Clicking Restore 24 Legacy Zones...");
    // The button might be selected by text
    const buttons = await page.$$('button');
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Restore 24 Legacy Zones')) {
            await btn.click();
            break;
        }
    }
    
    console.log("Waiting for restoration to complete...");
    await new Promise(r => setTimeout(r, 5000));
    
    console.log("Done!");
    await browser.close();
})();
