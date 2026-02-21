import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    // 1. Create a dummy large image file
    const dummyFilePath = './dummy_large_image.jpg';
    if (!fs.existsSync(dummyFilePath)) {
        // Red pixel PNG
        const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        fs.writeFileSync(dummyFilePath, Buffer.from(base64Png, 'base64'));
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    try {
        await page.goto('http://localhost:5173/admin');

        // Wait for login form
        await page.waitForSelector('input[type="password"]');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await page.waitForSelector('.upload-section');
        console.log("Logged in successfully.");

        // Uncheck the compression
        const checkboxSelector = 'input[type="checkbox"]';
        await page.uncheck(checkboxSelector);
        console.log("Unchecked compression checkbox.");

        // Attach file
        const fileInputSelector = 'input[type="file"]';
        // wait for file input
        await page.waitForSelector(fileInputSelector);

        // Log React state indirectly by checking UI
        await page.setInputFiles(fileInputSelector, dummyFilePath);
        console.log("File attached.");

        await page.waitForTimeout(500); // Give React time to update state

        // Check if success text appeared
        const successTextObj = await page.$('.success-text');
        if (successTextObj) {
            const text = await successTextObj.innerText();
            console.log("Success text after attach:", text);
        } else {
            console.log("No success text found!");
        }

        // Check if submit button is disabled
        const isSubmitDisabled = await page.$eval('.submit-btn', el => el.disabled);
        console.log("Is submit button disabled?", isSubmitDisabled);

        // Try to click submit
        if (!isSubmitDisabled) {
            // override window.alert to capture it
            page.on('dialog', async dialog => {
                console.log("DIALOG ALERT:", dialog.message());
                await dialog.accept();
            });

            console.log("Clicking submit button...");
            await page.click('.submit-btn', { force: true });
            await page.waitForTimeout(1000);
            console.log("Submit clicked.");
        } else {
            console.log("Cannot click submit, it is disabled.");
        }

        // What if we hit Enter inside a hashtag field?
        await page.fill('input[placeholder*="#바디프로필"]', '#hello, #world');
        await page.press('input[placeholder*="#바디프로필"]', 'Enter');
        await page.waitForTimeout(1000);

    } catch (err) {
        console.error("Error during test:", err);
    } finally {
        await browser.close();
    }
})();
