function validateCredentials(username, password, minPasswordLength = 6) {
  const u = String(username || '').trim();
  const p = String(password || '');
  if (!u || !p) {
    return { ok: false, error: 'Username and password are required' };
  }
  if (u.length < 3) {
    return { ok: false, error: 'Username must be at least 3 characters' };
  }
  if (p.length < minPasswordLength) {
    return { ok: false, error: `Password must be at least ${minPasswordLength} characters` };
  }
  return { ok: true, username: u, password: p };
}

function validatePassword(password, minPasswordLength = 6) {
  const p = String(password || '');
  if (!p) return { ok: false, error: 'Password is required' };
  if (p.length < minPasswordLength) {
    return { ok: false, error: `Password must be at least ${minPasswordLength} characters` };
  }
  return { ok: true, password: p };
}

module.exports = { validateCredentials, validatePassword };
