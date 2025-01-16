const express = require('express');
const { startBrowser, linkedinLogin, scrapeProfiles } = require('./app');

const app = express();
const port = 3000;

let browser, page;

app.use(express.json());

app.post('/linkedin-login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    ({ browser, page } = await startBrowser());
    await linkedinLogin(page, username, password);
    res.status(200).json({ message: 'Logged in successfully.' });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed.' });
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
