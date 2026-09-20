// STAGING preparation only. This endpoint normalizes a Discord OAuth identify
// userinfo response for a Supabase generic OAuth2 provider. It is not a login
// endpoint and does not create users, sessions, or Supabase identities.
// Do not log the Authorization header or return the provider's raw response.
const DISCORD_SELF_URL = 'https://discord.com/api/v10/users/@me';
const DISCORD_ID_RE = /^[0-9]{15,22}$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const authHeader = req.headers?.authorization;
  const match = typeof authHeader === 'string' && authHeader.match(/^Bearer ([\w.\-~+/=]{16,4096})$/i);
  if (!match) return res.status(401).json({ error: 'A Discord OAuth bearer token is required.' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const upstream = await fetch(DISCORD_SELF_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${match[1]}`, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (upstream.status === 401 || upstream.status === 403) {
      return res.status(401).json({ error: 'Discord OAuth token is invalid or lacks identify scope.' });
    }
    if (!upstream.ok) return res.status(502).json({ error: 'Discord identity is temporarily unavailable.' });

    const profile = await upstream.json();
    const subject = String(profile?.id ?? '').trim();
    if (!DISCORD_ID_RE.test(subject)) {
      return res.status(502).json({ error: 'Discord returned an invalid user ID.' });
    }

    // Discord sends "id"; Supabase generic OAuth2 expects "sub". Never expose
    // the email field (even if an old token has previously been granted email).
    return res.status(200).json({
      sub: subject,
      provider_id: subject,
      name: String(profile?.global_name || profile?.username || '').slice(0, 120),
      preferred_username: String(profile?.username || '').slice(0, 120),
    });
  } catch {
    return res.status(502).json({ error: 'Unable to verify Discord identity.' });
  } finally {
    clearTimeout(timeout);
  }
}
