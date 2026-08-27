const fs = require('fs');
const path = require('path');
const { hasValidSession, credentialsConfigured } = require('./_auth');

module.exports = async (req, res) => {
  if (!credentialsConfigured() || !hasValidSession(req)) {
    res.writeHead(302, { Location: '/login.html' });
    res.end();
    return;
  }

  const filePath = path.join(process.cwd(), 'private', 'app.html');
  const html = fs.readFileSync(filePath, 'utf8');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};
