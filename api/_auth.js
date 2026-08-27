const crypto = require('crypto');

const SESSION_COOKIE = 'ledger_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function sessionValue(username, password, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${username}\0${password}\0ledger-session`)
    .digest('base64url');
}

function parseCookies(req) {
  const header = req.headers?.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    out[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return out;
}

function hasValidSession(req) {
  const username = process.env.LEDGER_USERNAME;
  const password = process.env.LEDGER_PASSWORD;
  const secret = process.env.LEDGER_SESSION_SECRET;
  if (!username || !password || !secret) return false;
  const cookies = parseCookies(req);
  const expected = sessionValue(username, password, secret);
  return cookies[SESSION_COOKIE] === expected;
}

function setSessionCookie(res, username, password, secret) {
  const token = sessionValue(username, password, secret);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; Max-Age=${SESSION_MAX_AGE_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`);
}

function credentialsConfigured() {
  return Boolean(process.env.LEDGER_USERNAME && process.env.LEDGER_PASSWORD && process.env.LEDGER_SESSION_SECRET);
}

module.exports = { hasValidSession, setSessionCookie, clearSessionCookie, credentialsConfigured };
