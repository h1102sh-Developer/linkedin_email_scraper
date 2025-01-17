const express = require('express');
const { startBrowser, linkedinLogin, scrapeProfiles } = require('./app');
require('dotenv').config(); // Add this line at the top to load .env variables


const app = express();
let browser, page;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the LinkedIn Email Scraper API! Available routes are: /linkedin-login, /scrape-profiles, /close-session');
});

app.post('/linkedin-login', async (req, res) => {
  const { browser, page } = await startBrowser();
  
  try {
    await linkedinLogin(page, process.env.LINKEDIN_USERNAME, process.env.LINKEDIN_PASSWORD);
    const results = await scrapeProfiles(page, req.body.profileLinks);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await browser.close();
  }
});

app.post('/scrape-profiles', async (req, res) => {
  const { profileLinks } = req.body;

  if (!profileLinks || !Array.isArray(profileLinks)) {
    return res.status(400).json({ error: 'Profile links must be an array.' });
  }

  if (!page) {
    return res.status(400).json({ error: 'No active session. Log in first.' });
  }

  try {
    const results = await scrapeProfiles(page, profileLinks);
    res.status(200).json({ results });
  } catch (err) {
    console.error('Scraping error:', err.message);
    res.status(500).json({ error: 'Scraping failed.' });
  }
});

app.post('/close-session', async (req, res) => {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
    res.status(200).json({ message: 'Browser session closed.' });
  } else {
    res.status(400).json({ error: 'No active session to close.' });
  }
});

module.exports = app; // Export the app for serverless deployment
