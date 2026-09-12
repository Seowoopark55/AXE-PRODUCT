import crypto from 'node:crypto';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

export function getDiscordConfig() {
  return {
    clientId: requiredEnv('DISCORD_CLIENT_ID'),
    clientSecret: requiredEnv('DISCORD_CLIENT_SECRET'),
    stateSecret: requiredEnv('DISCORD_OAUTH_STATE_SECRET'),
    redirectUri: String(
      process.env.DISCORD_REDIRECT_URI ||
      'https://axe-product.vercel.app/api/discord/callback'
    ).trim(),
    appUrl: String(
      process.env.AXE_PRODUCT_APP_URL ||
      'https://axe-product.vercel.app'
    ).replace(/\/+$/, ''),
  };
}

export function getDiscordBotToken() {
  return requiredEnv('DISCORD_BOT_TOKEN');
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function signatureFor(encoded, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');
}

export function signPayload(payload, secret) {
  const encoded = encodePayload(payload);
  const signature = signatureFor(encoded, secret);
  return `${encoded}.${signature}`;
}

export function verifyPayload(token, secret, expectedKind) {
  const [encoded, signature, extra] = String(token || '').split('.');
  if (!encoded || !signature || extra) throw new Error('Invalid signed payload.');

  const expected = signatureFor(encoded, secret);
  const a = Buffer.from(signature, 'utf8');
  const b = Buffer.from(expected, 'utf8');

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Signed payload verification failed.');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Signed payload cannot be decoded.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.kind !== expectedKind) throw new Error('Signed payload kind mismatch.');
  if (!Number.isFinite(payload.exp) || payload.exp < now) throw new Error('Signed payload expired.');
  if (!Number.isFinite(payload.iat) || payload.iat > now + 60) throw new Error('Signed payload time is invalid.');

  return payload;
}

export function randomNonce(bytes = 18) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function safeOAuthError(code) {
  const allowed = new Set([
    'access_denied',
    'invalid_request',
    'temporarily_unavailable',
  ]);
  return allowed.has(String(code || '')) ? String(code) : 'oauth_failed';
}
