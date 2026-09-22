/** Host-only opt-in panel; preview mode does not create a Supabase client. */
import {createCloudWorkflow} from './cloudWorkflow.js';

export function mountCookCloudPanel({client, options, snapshot, apply, document: doc = document, confirm = message => window.confirm(message)}) {
  const panel = doc.getElementById('cloud-workspace');
  const account = doc.getElementById('cook-host-account');
  const status = doc.getElementById('cloud-status');
  const buttons = [...panel.querySelectorAll('button[data-cloud-action]')];
  const flow = createCloudWorkflow({client, options, snapshot, apply, confirm});
  let disposed = false, checkVersion = 0;
  const message = (text, kind = '') => { if (!disposed) { status.textContent = text; status.dataset.kind = kind; } };
  const sync = () => {
    const ready = flow.identityReady && !flow.busy;
    buttons.forEach(button => { button.disabled = !ready; });
    account.textContent = flow.identityReady ? 'HUB 계정 연결됨' : 'HUB 로그인 필요';
  };
  panel.hidden = false;
  account.hidden = false;
  message('클라우드 기능은 현재 HUB 로그인 계정에만 연결돼. 저장·불러오기·삭제는 버튼을 눌렀을 때만 실행돼.');
  async function recheck() {
    const version = ++checkVersion;
    flow.clearIdentity();sync();
    try {
      const ready = await flow.verifyIdentity();
      if (disposed || version !== checkVersion) return;
      sync();
      if (!ready) message('HUB Discord 로그인 후 클라우드를 사용할 수 있어. 기존 로컬 작업은 그대로 유지돼.');
    } catch (error) {
      if (disposed || version !== checkVersion) return;
      flow.clearIdentity();sync();message(`계정을 확인하지 못했어: ${error.message}`,'error');
    }
  }
  const handlers = buttons.map(button => {
    const handler = async () => {
      buttons.forEach(b => { b.disabled = true; });
      message('클라우드 작업을 확인하는 중이야.');
      try {
        const result = await flow.run(button.dataset.cloudAction);
        if (disposed) return;
        message(({empty:'클라우드 저장본이 없어.',cancelled:'변경 없이 취소했어.',loaded:'클라우드 저장본을 현재 화면에 불러왔어. 로컬 저장본은 그대로야.',saved:'이 계정의 클라우드에 저장했어.',deleted:'이 계정의 클라우드 저장본을 삭제했어.'})[result.kind] || (result.exists ? `저장본이 있어 · 요리 ${result.orders}종 · ${result.updatedAt}` : '클라우드 저장본이 없어.'),'success');
      } catch (error) {
        if (!disposed) message(`클라우드 작업 중단: ${error.message}`,'error');
      } finally { if (!disposed) sync(); }
    };
    button.addEventListener('click',handler);
    return handler;
  });
  // Callback schedules validation out of the Supabase auth event handler.
  const subscription = client.auth.onAuthStateChange?.(() => {
    flow.clearIdentity();sync();message('로그인 계정을 다시 확인하는 중이야.');
    queueMicrotask(() => { if (!disposed) recheck(); });
  })?.data?.subscription;
  recheck();
  return () => {
    disposed=true; ++checkVersion; flow.clearIdentity();
    subscription?.unsubscribe?.();
    buttons.forEach((button,i) => button.removeEventListener('click',handlers[i]));
    panel.hidden=true; account.hidden=true;
  };
}
