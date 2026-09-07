function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

function config() {
  return {
    url: requiredEnv('VITE_SUPABASE_URL').replace(/\/+$/, ''),
    key: requiredEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  };
}

function bearerToken(req) {
  const auth = String(req.headers.authorization || '');
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    const error = new Error('로그인이 필요합니다.');
    error.statusCode = 401;
    throw error;
  }
  return match[1].trim();
}

async function readJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function requireUser(req) {
  const token = bearerToken(req);
  const { url, key } = config();

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await readJsonSafe(response);

  if (!response.ok || !data?.id) {
    const error = new Error('로그인 세션을 확인하지 못했습니다.');
    error.statusCode = 401;
    throw error;
  }

  return { token, user: data };
}

export async function requireCompanyAdmin(token, userId, companyId) {
  const { url, key } = config();
  const params = new URLSearchParams({
    company_id: `eq.${companyId}`,
    user_id: `eq.${userId}`,
    status: 'eq.active',
    role: 'in.(owner,admin)',
    select: 'company_id,user_id,role',
    limit: '1',
  });

  const response = await fetch(
    `${url}/rest/v1/company_memberships?${params.toString()}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        'Accept-Profile': 'axe_product',
      },
    }
  );

  const data = await readJsonSafe(response);

  if (!response.ok) {
    const error = new Error('회사 권한 확인에 실패했습니다.');
    error.statusCode = response.status;
    throw error;
  }

  if (!Array.isArray(data) || !data.length) {
    const error = new Error('OWNER / ADMIN만 Discord 서버를 연결할 수 있습니다.');
    error.statusCode = 403;
    throw error;
  }

  return data[0];
}

export async function upsertDiscordConnection({
  token,
  userId,
  companyId,
  guildId,
  guildName,
}) {
  const { url, key } = config();
  const now = new Date().toISOString();

  const response = await fetch(
    `${url}/rest/v1/discord_connections?on_conflict=company_id&select=id,company_id,guild_id,guild_name,status,connected_at,updated_at`,
    {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'axe_product',
        'Accept-Profile': 'axe_product',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        company_id: companyId,
        guild_id: guildId,
        guild_name: guildName || null,
        status: 'connected',
        linked_by: userId,
        metadata: {
          environment: 'staging',
          source: 'discord_oauth_code_grant',
          oauth_linked_at: now,
        },
        connected_at: now,
        updated_at: now,
      }),
    }
  );

  const data = await readJsonSafe(response);

  if (!response.ok) {
    const detail = `${data?.code || ''} ${data?.message || ''}`.trim();
    const error = new Error(
      detail.includes('discord_connections_guild_id_key') ||
      detail.includes('guild_id')
        ? '이 Discord 서버는 이미 다른 회사에 연결되어 있습니다.'
        : 'Discord 연결 정보를 저장하지 못했습니다.'
    );
    error.statusCode = response.status === 409 ? 409 : 400;
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.company_id) {
    const error = new Error('Discord 연결 저장 결과를 확인하지 못했습니다.');
    error.statusCode = 500;
    throw error;
  }

  return row;
}
