// api/myFunction.js
module.exports = async (req, res) => {
  // Handle OPTIONS request for preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  // Set CORS for other methods
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Your function logic here
  res.status(200).json({ message: "CORS works!" });
};
