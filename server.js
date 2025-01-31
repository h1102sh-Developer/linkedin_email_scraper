const express = require('express');
const { startBrowser, linkedinLogin, scrapeProfiles } = require('./app');
const axios = require('axios');
require('dotenv').config();
// const queryString = require('query-string');

const app = express();
const port = 8000;

let browser, page;

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Welcome to the LinkedIn Email Scraper API! Available routes are: /linkedin-login, /scrape-profiles, /close-session');
});

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

app.get('/linkedin/callback', async (req, res) => {
  const { code } = req.query;
  const redirect_uri = 'https://linkedinemailscraper.vercel.app/linkedin/callback';

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // Fetch user info
    const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = userInfoResponse.data;

    // Redirect the user to your app with their data
    const frontendRedirectUrl = `https://linkedinemailscraper.vercel.app/scraper`; // Update with your app's frontend URL
    res.redirect(
      `${frontendRedirectUrl}?id=${userData.sub}&name=${encodeURIComponent(
        `${userData.given_name} ${userData.family_name}`
      )}&email=${encodeURIComponent(userData.email)}&picture=${encodeURIComponent(userData.picture)}`
    );
  } catch (error) {
    console.error('LinkedIn OAuth error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || 'Failed to authenticate with LinkedIn',
    });
  }
});

// Out2.0 authentication route
app.post('/out2.0-callback', async (req, res) => {
  const { code, redirect_uri } = req.body;

  try {
    // Exchange code for access token using Out2.0
    const tokenResponse = await axios.post('https://out2.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id: process.env.OUT2_CLIENT_ID,
        client_secret: process.env.OUT2_CLIENT_SECRET
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Get user profile from Out2.0 API
    const profileResponse = await axios.get('https://api.out2.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    res.json({
      success: true,
      profile: profileResponse.data
    });
  } catch (error) {
    console.error('Out2.0 OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate with Out2.0'
    });
  }
});

app.post('/linkedin-login', async (req, res) => {
  const username = req.body.username;  // Removed process.env
  const password = req.body.password;  // Removed process.env

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

module.exports = app; // Export the app for serverless deployment
