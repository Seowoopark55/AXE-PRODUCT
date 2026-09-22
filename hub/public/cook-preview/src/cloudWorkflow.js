/**
 * Phase 7 / preview-only: explicit, account-scoped cloud actions.
 * This module never starts OAuth, opens a network connection, or writes on import.
 * The host injects its existing Supabase Auth client after the COOK DB has been
 * separately approved and verified. Only an explicit button action invokes IO.
 */
import {readCloudWorkspace, saveCloudWorkspace, deleteCloudWorkspace} from './cloudWorkspace.js';

export function createCloudWorkflow({client, options, snapshot, apply, confirm}) {
  if (!client?.auth?.getUser || typeof client.schema !== 'function') throw Error('HUB 인증 연결이 필요해.');
  if (typeof snapshot !== 'function' || typeof apply !== 'function' || typeof confirm !== 'function') {
    throw Error('클라우드 작업 확인 절차가 준비되지 않았어.');
  }

  let owner = null;
  let generation = 0;
  let busy = false;
  const context = () => ({revision: options.revision, foods: options.foods});
  const stale = (userId, epoch) => epoch !== generation || owner !== userId;
  const ensureFresh = (userId, epoch) => {
    if (stale(userId, epoch)) throw Error('로그인 계정이 변경됐어. 작업을 중단했어.');
  };

  /** On logout or account switch, prevent a pending read from reaching the UI. */
  function clearIdentity() {
    ++generation;
    owner = null;
  }

  /** This only checks identity; it never reads or writes a COOK workspace. */
  async function verifyIdentity() {
    const epoch = ++generation;
    const {data, error} = await client.auth.getUser();
    if (epoch !== generation) return false;
    owner = error ? null : data?.user?.id || null;
    return Boolean(owner);
  }

  async function assertAccount(userId, epoch) {
    const {data, error} = await client.auth.getUser();
    ensureFresh(userId, epoch);
    if (error || data?.user?.id !== userId) {
      clearIdentity();
      throw Error('로그인 계정이 변경됐어. 계정을 다시 확인해 줘.');
    }
  }

  async function run(action) {
    if (busy) throw Error('다른 클라우드 작업을 처리 중이야.');
    if (!owner) throw Error('HUB Discord 로그인이 필요해.');
    busy = true;
    const userId = owner, epoch = generation;
    try {
      // Detect an account switch even if a host auth event was missed.
      await assertAccount(userId, epoch);
      const remote = await readCloudWorkspace(client, context());
      await assertAccount(userId, epoch);
      if (action === 'inspect') return remote ? {exists:true, updatedAt: remote.updatedAt, rowVersion: remote.rowVersion, orders: remote.loaded.orders.size} : {exists:false};
      if (action === 'load') {
        if (!remote) return {kind:'empty'};
        const ok = await confirm('클라우드 저장본으로 현재 화면의 제작 목록과 체크 상태를 교체할까? 현재 작업의 저장하지 않은 변경은 사라져.');
        await assertAccount(userId, epoch);
        if (!ok) return {kind:'cancelled'};
        // The remote draft is already parsed and validated by readCloudWorkspace.
        apply(remote.loaded);
        return {kind:'loaded', orders: remote.loaded.orders.size};
      }
      if (action === 'save') {
        const description = remote
          ? `클라우드 저장본 (${remote.loaded.orders.size}종, ${remote.updatedAt})을 현재 화면의 작업으로 교체할까? 다른 기기의 저장본이 덮어써질 수 있어.`
          : '현재 화면의 작업을 이 Discord 계정의 클라우드에 처음 저장할까?';
        const ok = await confirm(description);
        await assertAccount(userId, epoch);
        if (!ok) return {kind:'cancelled'};
        // Capture only after consent; no action ever reads browser localStorage.
        const draft = snapshot();
        const saved = await saveCloudWorkspace(client, draft, context(), remote?.rowVersion ?? null);
        await assertAccount(userId, epoch);
        return {kind:'saved', ...saved};
      }
      if (action === 'delete') {
        if (!remote) return {kind:'empty'};
        const ok = await confirm(`이 Discord 계정의 클라우드 저장본 (${remote.updatedAt})을 삭제할까? 이 브라우저의 작업과 로컬 저장본은 유지돼.`);
        await assertAccount(userId, epoch);
        if (!ok) return {kind:'cancelled'};
        await deleteCloudWorkspace(client, remote.rowVersion);
        await assertAccount(userId, epoch);
        return {kind:'deleted'};
      }
      throw Error('지원하지 않는 클라우드 작업이야.');
    } finally {
      busy = false;
    }
  }
  return {verifyIdentity, clearIdentity, run, get identityReady() { return Boolean(owner); }, get busy() { return busy; }};
}
