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
  await page.goto('https://www.linkedin.com/login');
  await page.type('#username', username);
  await page.type('#password', password);
  await page.click('.btn__primary--large');
  await page.waitForNavigation();
  console.log('Logged in successfully');
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
