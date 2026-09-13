import { getDiscordBotToken } from '../../server/discordSecurity.js';
import {
  getCompanyDiscordConnection,
  getCompanySettingsRow,
  requireCompanyAdmin,
  requireCompanyMember,
  requireUser,
} from '../../server/supabaseUser.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUS_NAMES = Object.freeze({ pending: '답변대기', checking: '확인중', complete: '답변완료' });
const STATUS_BY_NAME = Object.freeze(Object.fromEntries(Object.entries(STATUS_NAMES).map(([key, value]) => [value, key])));

function questionForumId(settingsRow) {
  return String(settingsRow?.settings?.question_board?.forum_channel_id || '').trim();
}

function cleanStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  return Object.hasOwn(STATUS_NAMES, status) ? status : '';
}

function snowflakeDate(id) {
  try {
    const timestamp = Number((BigInt(String(id)) >> 22n) + 1420070400000n);
    return new Date(timestamp).toISOString();
  } catch {
    return null;
  }
}

async function discordJson(path, init = {}) {
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${getDiscordBotToken()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const error = new Error(data?.message || 'Discord 질문게시판을 불러오지 못했습니다.');
    error.statusCode = response.status;
    error.discordCode = data?.code;
    throw error;
  }
  return data;
}

function mergeStatusTags(existing = []) {
  const rows = Array.isArray(existing) ? existing : [];
  const byName = new Map(rows.map((tag) => [String(tag?.name || ''), tag]));
  const preserved = rows.filter((tag) => !Object.hasOwn(STATUS_BY_NAME, String(tag?.name || '')));
  const statuses = Object.values(STATUS_NAMES).map((name) => {
    const current = byName.get(name);
    return current?.id
      ? { id: String(current.id), name, moderated: true, emoji_id: null, emoji_name: null }
      : { name, moderated: true, emoji_id: null, emoji_name: null };
  });
  return [...statuses, ...preserved].slice(0, 20);
}

async function ensureForumConfigured(forum) {
  if (!forum?.id || Number(forum.type) !== 15) {
    const error = new Error('연결된 질문게시판이 Discord 포럼 채널이 아닙니다.');
    error.statusCode = 409;
    throw error;
  }
  const names = new Set((forum.available_tags || []).map((tag) => String(tag?.name || '')));
  const missing = Object.values(STATUS_NAMES).some((name) => !names.has(name));
  const needsModeration = (forum.available_tags || []).some((tag) => Object.hasOwn(STATUS_BY_NAME, String(tag?.name || '')) && tag?.moderated !== true);
  if (!missing && !needsModeration) return forum;
  return discordJson(`/channels/${forum.id}`, {
    method: 'PATCH',
    headers: { 'X-Audit-Log-Reason': encodeURIComponent('AXE PRODUCT question board status tags') },
    body: JSON.stringify({
      topic: forum.topic || 'AXE PRODUCT 이용 중 궁금한 내용을 남겨주세요. 관리자가 확인 후 답변 상태를 업데이트합니다.',
      default_auto_archive_duration: Number(forum.default_auto_archive_duration || 10080),
      available_tags: mergeStatusTags(forum.available_tags),
    }),
  });
}

function statusTagMap(forum) {
  const map = new Map();
  for (const tag of forum?.available_tags || []) {
    const status = STATUS_BY_NAME[String(tag?.name || '')];
    if (status && tag?.id) map.set(status, String(tag.id));
  }
  return map;
}

function threadStatus(thread, forum) {
  const byId = new Map((forum?.available_tags || []).map((tag) => [String(tag?.id || ''), String(tag?.name || '')]));
  for (const id of thread?.applied_tags || []) {
    const status = STATUS_BY_NAME[byId.get(String(id))];
    if (status) return status;
  }
  return 'pending';
}

function serializeThread(thread, forum, guildId) {
  const status = threadStatus(thread, forum);
  return {
    id: String(thread.id),
    title: String(thread.name || '질문'),
    owner_id: String(thread.owner_id || ''),
    status,
    status_label: STATUS_NAMES[status],
    message_count: Number(thread.message_count || 0),
    member_count: Number(thread.member_count || 0),
    archived: Boolean(thread.thread_metadata?.archived),
    created_at: snowflakeDate(thread.id),
    archive_timestamp: thread.thread_metadata?.archive_timestamp || null,
    url: `https://discord.com/channels/${guildId}/${thread.id}`,
  };
}

async function listForumThreads(guildId, forumId) {
  const [activePayload, archivedPayload] = await Promise.all([
    discordJson(`/guilds/${guildId}/threads/active`).catch(() => ({ threads: [] })),
    discordJson(`/channels/${forumId}/threads/archived/public?limit=50`).catch(() => ({ threads: [] })),
  ]);
  const all = [
    ...(Array.isArray(activePayload?.threads) ? activePayload.threads : []),
    ...(Array.isArray(archivedPayload?.threads) ? archivedPayload.threads : []),
  ].filter((thread) => String(thread?.parent_id || '') === String(forumId));
  const deduped = new Map();
  for (const thread of all) deduped.set(String(thread.id), thread);
  return [...deduped.values()];
}

async function sendCompletionDm(ownerId, thread, guildId) {
  if (!/^\d{15,22}$/.test(String(ownerId || ''))) return false;
  try {
    const dm = await discordJson('/users/@me/channels', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: String(ownerId) }),
    });
    if (!dm?.id) return false;
    await discordJson(`/channels/${dm.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: [
          '**AXE PRODUCT 질문 답변이 완료되었습니다.**',
          `> ${String(thread?.name || '질문').slice(0, 160)}`,
          `https://discord.com/channels/${guildId}/${thread.id}`,
        ].join('\n'),
        allowed_mentions: { parse: [] },
      }),
    });
    return true;
  } catch {
    return false;
  }
}

async function contextFor(req, { admin = false } = {}) {
  const companyId = String(req.method === 'GET' ? req.query?.company_id : req.body?.company_id || '').trim();
  if (!UUID_RE.test(companyId)) {
    const error = new Error('회사 ID가 올바르지 않습니다.');
    error.statusCode = 400;
    throw error;
  }
  const { token, user } = await requireUser(req);
  const membership = admin
    ? await requireCompanyAdmin(token, user.id, companyId)
    : await requireCompanyMember(token, user.id, companyId);
  const [connection, settingsRow] = await Promise.all([
    getCompanyDiscordConnection(token, companyId),
    getCompanySettingsRow(token, companyId),
  ]);
  return { companyId, token, user, membership, connection, settingsRow };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const ctx = await contextFor(req);
      const forumId = questionForumId(ctx.settingsRow);
      if (!forumId) {
        return res.status(200).json({
          configured: false,
          forum_channel_id: null,
          forum_url: null,
          counts: { pending: 0, checking: 0, complete: 0, total: 0 },
          items: [],
        });
      }
      const forum = await discordJson(`/channels/${forumId}`);
      if (Number(forum?.type) !== 15) {
        return res.status(200).json({
          configured: false,
          needs_reconfigure: true,
          forum_channel_id: forumId,
          forum_url: null,
          counts: { pending: 0, checking: 0, complete: 0, total: 0 },
          items: [],
        });
      }
      const threads = await listForumThreads(String(ctx.connection.guild_id), forumId);
      const allItems = threads
        .map((thread) => serializeThread(thread, forum, String(ctx.connection.guild_id)))
        .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
      const counts = { pending: 0, checking: 0, complete: 0, total: allItems.length };
      for (const item of allItems) counts[item.status] += 1;
      const items = allItems.slice(0, 60);
      return res.status(200).json({
        configured: true,
        forum_channel_id: forumId,
        forum_name: String(forum.name || '질문게시판'),
        forum_url: `https://discord.com/channels/${ctx.connection.guild_id}/${forumId}`,
        counts,
        items,
      });
    }

    if (req.method === 'POST') {
      const action = String(req.body?.action || 'status').trim().toLowerCase();
      const ctx = await contextFor(req, { admin: true });
      const forumId = questionForumId(ctx.settingsRow);
      if (!forumId) return res.status(409).json({ error: '질문게시판 채널이 아직 연결되지 않았습니다.' });
      let forum = await discordJson(`/channels/${forumId}`);
      forum = await ensureForumConfigured(forum);

      if (action === 'configure') {
        return res.status(200).json({ configured: true, forum_channel_id: forumId });
      }

      const status = cleanStatus(req.body?.status);
      const threadId = String(req.body?.thread_id || '').trim();
      if (!status || !/^\d{15,22}$/.test(threadId)) {
        return res.status(400).json({ error: '질문 상태 변경 요청이 올바르지 않습니다.' });
      }
      const thread = await discordJson(`/channels/${threadId}`);
      if (String(thread?.parent_id || '') !== forumId) {
        return res.status(404).json({ error: '이 질문게시판의 글을 찾지 못했습니다.' });
      }
      const currentStatus = threadStatus(thread, forum);
      if (currentStatus === status) {
        return res.status(200).json({ updated: false, status, dm_sent: false });
      }
      const tags = statusTagMap(forum);
      const nextTagId = tags.get(status);
      if (!nextTagId) return res.status(500).json({ error: '질문 상태 태그를 준비하지 못했습니다.' });
      const statusIds = new Set(tags.values());
      const nextTags = (thread.applied_tags || []).map(String).filter((id) => !statusIds.has(id));
      nextTags.push(nextTagId);
      await discordJson(`/channels/${threadId}`, {
        method: 'PATCH',
        headers: { 'X-Audit-Log-Reason': encodeURIComponent(`AXE PRODUCT question status: ${status}`) },
        body: JSON.stringify({ applied_tags: nextTags.slice(0, 5) }),
      });
      const dmSent = status === 'complete'
        ? await sendCompletionDm(thread.owner_id, thread, String(ctx.connection.guild_id))
        : false;
      return res.status(200).json({ updated: true, status, dm_sent: dmSent });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    let status = Number(error?.statusCode || 500);
    let message = error?.message || '질문게시판 요청을 처리하지 못했습니다.';
    if (status === 403 && /Missing Permissions|권한/i.test(message)) {
      message = '질문 상태를 변경하려면 Discord의 스레드 관리 권한이 필요합니다. 회사 설정에서 권한 다시 승인을 진행해 주세요.';
    }
    if (status >= 500) status = 500;
    return res.status(status).json({ error: message });
  }
}
