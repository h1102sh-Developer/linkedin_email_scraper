const app = require('../server'); // Import the app

module.exports = (req, res) => {
  app(req, res); // Delegate request handling to the app
};
