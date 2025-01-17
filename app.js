const puppeteer = require('puppeteer-extra');
const UserAgent = require('fake-useragent');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const startBrowser = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Set a random User-Agent
  const userAgent = UserAgent();
  await page.setUserAgent(userAgent);
  console.log(`Using User-Agent: ${userAgent}`);

  return { browser, page };
};

const linkedinLogin = async (page, username, password) => {
  try {
    console.log('Navigating to LinkedIn login...');
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

    console.log('Typing username...');
    await page.type('#username', username, { delay: 100 });

    console.log('Typing password...');
    await page.type('#password', password, { delay: 100 });

    console.log('Clicking login button...');
    await page.click('.btn__primary--large');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Logged in successfully');
  } catch (error) {
    console.error('LinkedIn login error:', error.message);
    throw new Error('LinkedIn login failed.');
  }
};

const scrapeProfiles = async (page, profileLinks) => {
  const results = [];

  for (const url of profileLinks) {
    try {
      const profileUrl = `${url}/overlay/contact-info/`;
      await page.goto(profileUrl);

      await page.waitForSelector('title', { timeout: 5000 });
      const name = await page.title().then(title => title.split(' | ')[0].trim());
      let email = null;

      try {
        await page.waitForSelector('a[href^="mailto:"]', { timeout: 5000 });
        email = await page.$eval('a[href^="mailto:"]', el => el.textContent.trim());
      } catch {
        console.warn(`No email found for: ${url}`);
      }

      results.push(email ? { name, email } : { url, error: 'Email not found' });
    } catch (err) {
      console.error(`Failed to scrape ${url}: ${err.message}`);
      results.push({ url, error: err.message });
    }
  }

  return results;
};

module.exports = { startBrowser, linkedinLogin, scrapeProfiles };
