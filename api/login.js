const { setSessionCookie, credentialsConfigured } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!credentialsConfigured()) {
    res.status(503).json({
      error: 'Set LEDGER_USERNAME, LEDGER_PASSWORD, and LEDGER_SESSION_SECRET in Vercel.'
    });
    return;
  }

  const { username, password } = req.body || {};

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    username !== process.env.LEDGER_USERNAME ||
    password !== process.env.LEDGER_PASSWORD
  ) {
    res.status(401).json({ error: 'Incorrect username or password.' });
    return;
  }

  setSessionCookie(
    res,
    process.env.LEDGER_USERNAME,
    process.env.LEDGER_PASSWORD,
    process.env.LEDGER_SESSION_SECRET
  );

  res.status(200).json({ ok: true });
};
