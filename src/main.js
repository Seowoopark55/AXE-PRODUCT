import './styles.css';
import { envReady } from './lib/supabase.js';
import {
  getSession, signInWithDiscord, signOut, onAuthStateChange,
  listCompanies, createCompany, getMemberships, updateMembershipRole, updateMembershipStatus,
  getModuleCatalog, getCompanyModules, setCompanyModule, updateCompanyModuleSettings,
  getCompanySettings, updateCompanySettings,
  getDiscordConnection, getDiscordChannels, getDiscordRoles, getDiscordCompanyConfig, saveDiscordCompanyConfig,
  createCompanyInvite, redeemCompanyInvite,
  getFundAdminRequests, getFundAdminPeriodStatus, reviewFundRequest, setFundFeeRule, getFundEvidenceSignedUrl,
  startDiscordConnection, completeDiscordConnection,
  getFundTreasurySnapshot, saveFundLedgerEntry, cancelFundLedgerEntry,
  getWebAssetsSnapshot, saveWebAsset, manageWebAsset,
  getWebAccountsSnapshot, submitWebAccountRequest, reviewWebAccountRequest,
  submitProductFeedback,
} from './lib/productApi.js';
import { renderShell, canAdmin, currentMembership, moduleEnabled, moduleRow } from './ui/render.js';

const root = document.querySelector('#app');
const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
const validPages = ['fund','members','assets','accounts','settings'];

const state = {
  envReady,
  session: null,
  companies: [],
  companyId: localStorage.getItem('axe_product_company_id') || null,
  memberships: [],
  moduleCatalog: [],
  modules: [],
  companySettings: null,
  discordConnection: null,
  discordChannels: [],
  discordRoles: [],
  discordCompanyConfig: null,
  page: validPages.includes(sessionStorage.getItem('axe_product_page')) ? sessionStorage.getItem('axe_product_page') : 'fund',
  fundTab: sessionStorage.getItem('axe_product_fund_tab') || 'ledger',
  fundMonth: currentMonth,
  fundWeeklyMonth: currentMonth,
  currentMonth,
  fundSnapshot: null,
  fundRequests: [],
  fundMonthlyRows: [],
  fundWeeklyFee: 0,
  fundWeeklyLoading: false,
  fundFilters: { person:'all', type:'all', account:'all' },
  memberFilter: 'all', memberRole:'', memberQuery:'',
  assetTab: 'assets', assetQuery:'', assetCategory:'', assetStatus:'', assetsSnapshot:null,
  accountQuery:'', accountStatus:'', accountsSnapshot:null,
  settingsTab: sessionStorage.getItem('axe_product_settings_tab') || 'basic',
  modal: null,
  loading: false,
  ready: false,
  error: '',
  notice: '',
};

let noticeTimer = null;
let mutationBusy = false;

function render() { renderShell(root, state); }
function setNotice(message) {
  state.notice = String(message || ''); state.error = ''; render();
  if (noticeTimer) clearTimeout(noticeTimer);
  if (state.notice) noticeTimer = setTimeout(() => { state.notice=''; render(); }, 3200);
}
function setError(error) { state.error = String(error?.message || error || '오류가 발생했습니다.'); render(); }
function clearCompanyData() {
  state.memberships=[]; state.moduleCatalog=[]; state.modules=[]; state.companySettings=null;
  state.discordConnection=null; state.discordChannels=[]; state.discordRoles=[]; state.discordCompanyConfig=null;
  state.fundSnapshot=null; state.fundRequests=[]; state.fundMonthlyRows=[]; state.assetsSnapshot=null; state.accountsSnapshot=null;
}

async function loadCompanies() {
  state.companies = await listCompanies();
  if (!state.companies.length) { state.companyId=null; localStorage.removeItem('axe_product_company_id'); clearCompanyData(); return; }
  if (!state.companies.some(c=>c.id===state.companyId)) state.companyId=state.companies[0].id;
  localStorage.setItem('axe_product_company_id', state.companyId);
}

async function loadBaseCompanyData() {
  if (!state.companyId) { clearCompanyData(); return; }
  const memberships = await getMemberships(state.companyId);
  state.memberships = memberships || [];
  const [catalog, modules, settings, discord, channels, roles, config] = await Promise.all([
    getModuleCatalog(), getCompanyModules(state.companyId), getCompanySettings(state.companyId),
    getDiscordConnection(state.companyId), getDiscordChannels(state.companyId), getDiscordRoles(state.companyId), getDiscordCompanyConfig(state.companyId),
  ]);
  state.moduleCatalog=catalog||[]; state.modules=modules||[]; state.companySettings=settings||null;
  state.discordConnection=discord||null; state.discordChannels=channels||[]; state.discordRoles=roles||[]; state.discordCompanyConfig=config||null;
}

async function loadFundSnapshot() {
  if (!canAdmin(state) || !moduleEnabled(state,'fund')) { state.fundSnapshot=null; state.fundRequests=[]; return; }
  const [y,m] = state.fundMonth.split('-').map(Number);
  const [snapshot, requests] = await Promise.all([
    getFundTreasurySnapshot(state.companyId,y,m,200),
    getFundAdminRequests(state.companyId,null,100),
  ]);
  state.fundSnapshot=snapshot||{}; state.fundRequests=requests||[];
}

async function loadFundWeeklyMonth(monthValue = state.fundWeeklyMonth) {
  if (!canAdmin(state) || !moduleEnabled(state,'fund')) { state.fundMonthlyRows=[]; return; }
  state.fundWeeklyLoading=true; render();
  const [year,month]=String(monthValue).split('-').map(Number);
  const results = await Promise.all([1,2,3,4,5].map(async week => {
    try { return await getFundAdminPeriodStatus(state.companyId,year,month,week); } catch { return []; }
  }));
  const map=new Map(); let fee=0;
  results.forEach((weekRows,index)=>{
    for(const row of weekRows||[]){
      const key=row.membership_id || row.display_name;
      if(!map.has(key)) map.set(key,{name:row.display_name||'멤버',role:(row.member_role||'member').toUpperCase(),weeks:['예정','예정','예정','예정','예정']});
      map.get(key).weeks[index]=row.status||'예정';
      if(!fee && Number(row.expected_amount)>0) fee=Number(row.expected_amount);
    }
  });
  state.fundMonthlyRows=[...map.values()]; state.fundWeeklyFee=fee; state.fundWeeklyLoading=false; render();
}

async function loadAssetsAndAccounts() {
  if (!canAdmin(state) || !moduleEnabled(state,'assets')) { state.assetsSnapshot=null; state.accountsSnapshot=null; return; }
  const [assets, accounts] = await Promise.all([getWebAssetsSnapshot(state.companyId), getWebAccountsSnapshot(state.companyId)]);
  state.assetsSnapshot=assets||{}; state.accountsSnapshot=accounts||{};
}

async function loadCompanyData() {
  await loadBaseCompanyData();
  if (canAdmin(state)) {
    const jobs=[];
    if (moduleEnabled(state,'fund')) jobs.push(loadFundSnapshot());
    if (moduleEnabled(state,'assets')) jobs.push(loadAssetsAndAccounts());
    await Promise.all(jobs);
    if (state.fundTab==='weekly' && moduleEnabled(state,'fund')) await loadFundWeeklyMonth(state.fundWeeklyMonth);
  }
}

async function refreshAll() {
  if (!state.session?.user) { state.ready=true; render(); return; }
  state.loading=true; state.error=''; render();
  try { await loadCompanies(); await loadCompanyData(); state.ready=true; }
  catch(error){ state.error=String(error?.message||error); }
  finally { state.loading=false; render(); }
}

function discordOAuthErrorMessage(code) {
  const map={access_denied:'Discord 서버 연결이 취소됐습니다.',invalid_request:'Discord 인증 요청이 올바르지 않습니다.',temporarily_unavailable:'Discord 인증 서비스를 잠시 사용할 수 없습니다.',token_exchange_failed:'Discord 인증 코드 교환에 실패했습니다.',guild_not_returned:'선택한 Discord 서버 정보를 확인하지 못했습니다.',oauth_validation_failed:'Discord 인증 보안 검증에 실패했습니다.',missing_oauth_response:'Discord 인증 결과가 비어 있습니다.',oauth_failed:'Discord 서버 연결에 실패했습니다.'};
  return map[code]||'Discord 서버 연결에 실패했습니다.';
}
async function handleDiscordOAuthReturn() {
  const raw=String(location.hash||'').replace(/^#/,''); if(!raw)return;
  const params=new URLSearchParams(raw); const token=params.get('discord_link'); const error=params.get('discord_error');
  if(!token&&!error)return; history.replaceState(null,'',`${location.pathname}${location.search}`);
  if(error) throw new Error(discordOAuthErrorMessage(error));
  if(!state.session?.user) throw new Error('Discord 서버 연결을 완료하려면 다시 로그인해 주세요.');
  const connection=await completeDiscordConnection(token); state.companyId=connection.company_id; localStorage.setItem('axe_product_company_id',state.companyId); await refreshAll(); state.page='settings'; state.settingsTab='basic';
  setNotice(`Discord 서버 ${connection.guild_name||''} 연결이 완료됐습니다.`);
}

async function boot() {
  if(!envReady){state.ready=true;render();return;}
  try{state.session=await getSession();}catch(error){state.error=String(error?.message||error);} render(); await refreshAll();
  try{await handleDiscordOAuthReturn();}catch(error){setError(error);}
  onAuthStateChange(async (_event,session)=>{const before=state.session?.user?.id||null; const after=session?.user?.id||null; state.session=session; if(before!==after){state.ready=false;await refreshAll();}});
}

function closeModal({force=false}={}) {
  if(state.modal?.type==='feedback' && !force){
    const form=root.querySelector('form[data-form="feedback"]');
    const dirty=form && [...form.querySelectorAll('input,textarea')].some(el=>String(el.value||'').trim());
    if(dirty && !window.confirm('작성 중인 피드백 내용이 사라질 수 있습니다. 닫을까요?')) return false;
  }
  state.modal=null; render(); return true;
}

async function withMutation(fn){ if(mutationBusy)return; mutationBusy=true; state.loading=true; render(); try{await fn();}catch(error){setError(error);}finally{mutationBusy=false;state.loading=false;render();} }

root.addEventListener('click', async event => {
  const pageBtn=event.target.closest('[data-page]');
  if(pageBtn){ state.page=pageBtn.dataset.page; sessionStorage.setItem('axe_product_page',state.page); if(state.page==='fund'&&!state.fundSnapshot) await withMutation(loadFundSnapshot); if(['assets','accounts'].includes(state.page)&&!state.assetsSnapshot) await withMutation(loadAssetsAndAccounts); render(); return; }
  const fundTab=event.target.closest('[data-fund-tab]');
  if(fundTab){state.fundTab=fundTab.dataset.fundTab;sessionStorage.setItem('axe_product_fund_tab',state.fundTab);render();if(state.fundTab==='weekly'&&!state.fundMonthlyRows.length) await loadFundWeeklyMonth();return;}
  const memberFilter=event.target.closest('[data-member-filter]'); if(memberFilter){state.memberFilter=memberFilter.dataset.memberFilter;render();return;}
  const assetTab=event.target.closest('[data-asset-tab]'); if(assetTab){state.assetTab=assetTab.dataset.assetTab;render();return;}
  const settingsTab=event.target.closest('[data-settings-tab]'); if(settingsTab){state.settingsTab=settingsTab.dataset.settingsTab;sessionStorage.setItem('axe_product_settings_tab',state.settingsTab);render();return;}
  if(event.target.matches('[data-modal-backdrop]')){ if(state.modal?.type==='feedback')return; closeModal(); return; }

  const actionEl=event.target.closest('[data-action]'); if(!actionEl)return; const action=actionEl.dataset.action;
  if(action==='dismiss-error'){state.error='';render();return;}
  if(action==='close-modal'){closeModal();return;}
  if(action==='open-create-company'){state.modal={type:'create-company'};render();return;}
  if(action==='open-join-company'){state.modal={type:'join-company'};render();return;}
  if(action==='open-feedback'){state.modal={type:'feedback'};render();return;}
  if(action==='open-ledger'){state.modal={type:'ledger',entryId:null};render();return;}
  if(action==='edit-ledger'){state.modal={type:'ledger',entryId:actionEl.dataset.entryId};render();return;}
  if(action==='edit-member'){state.modal={type:'member',membershipId:actionEl.dataset.membershipId};render();return;}
  if(action==='open-asset'){state.modal={type:'asset',assetId:null};render();return;}
  if(action==='edit-asset'){state.modal={type:'asset',assetId:actionEl.dataset.assetId};render();return;}
  if(action==='open-account-request'){state.modal={type:'account'};render();return;}
  if(action==='create-invite'){state.modal={type:'invite'};render();return;}
  if(action==='copy-invite'){await navigator.clipboard.writeText(actionEl.dataset.inviteCode||'');setNotice('초대코드를 복사했습니다.');return;}
  if(action==='reset-fund-filter'){state.fundFilters={person:'all',type:'all',account:'all'};render();return;}

  await withMutation(async()=>{
    if(action==='discord-login'){await signInWithDiscord();return;}
    if(action==='logout'){await signOut();state.modal=null;return;}
    if(action==='refresh'){await refreshAll();setNotice('최신 데이터를 불러왔습니다.');return;}
    if(action==='refresh-fund'){await loadFundSnapshot();setNotice('공금 데이터를 새로고침했습니다.');return;}
    if(action==='connect-discord'){if(!canAdmin(state))throw new Error('관리자 권한이 필요합니다.');const started=await startDiscordConnection(state.companyId);location.assign(started.authorize_url);return;}
    if(action==='toggle-module'){
      if(!canAdmin(state))throw new Error('관리자 권한이 필요합니다.'); const key=actionEl.dataset.moduleKey; const current=moduleRow(state,key); if(!current)throw new Error('기능 설정을 찾지 못했습니다.');
      await setCompanyModule(state.companyId,key,!current.enabled,state.session.user.id); await loadCompanyData(); setNotice(`${(current.enabled?'기능을 껐습니다.':'기능을 켰습니다.')}`); return;
    }
    if(action==='cancel-ledger'){const id=actionEl.dataset.entryId;if(!window.confirm('이 공금 내역을 취소할까요?'))return;const input=window.prompt('취소 사유를 입력해 주세요.','');if(input===null)return;const reason=input.trim();if(!reason)throw new Error('취소 사유를 입력해 주세요.');await cancelFundLedgerEntry(state.companyId,id,reason);state.modal=null;await loadFundSnapshot();setNotice('공금 내역을 취소했습니다.');return;}
    if(action==='return-asset'){const id=actionEl.dataset.assetId;if(!window.confirm('이 자산을 반납 처리할까요?'))return;const note=window.prompt('반납 메모 (선택)','')??'';await manageWebAsset(state.companyId,id,'return',note);state.modal=null;await loadAssetsAndAccounts();setNotice('자산을 반납 처리했습니다.');return;}
    if(action==='account-review'){const req=actionEl.dataset.requestId;const reviewAction=actionEl.dataset.reviewAction;const note=reviewAction==='reject'?(window.prompt('반려 사유 (선택)','')??''):'';await reviewWebAccountRequest(state.companyId,req,reviewAction,note);await loadAssetsAndAccounts();setNotice(reviewAction==='approve'?'계좌 신청을 승인했습니다.':'계좌 신청을 반려했습니다.');return;}
    if(action==='fund-review'){const req=actionEl.dataset.requestId;const reviewAction=actionEl.dataset.reviewAction;const note=reviewAction!=='approve'?(window.prompt(reviewAction==='reject'?'반려 사유 (선택)':'보류 메모 (선택)','')??''):'';await reviewFundRequest(state.companyId,req,reviewAction,note);await loadFundSnapshot();setNotice(reviewAction==='approve'?'납부를 승인했습니다.':reviewAction==='hold'?'납부 신청을 보류했습니다.':'납부 신청을 반려했습니다.');return;}
    if(action==='open-evidence'){const url=await getFundEvidenceSignedUrl(actionEl.dataset.evidencePath,300);if(url)window.open(url,'_blank','noopener,noreferrer');return;}
  });
});

root.addEventListener('change', async event => {
  try{
    if(event.target.matches('[data-action="switch-company"]')){state.companyId=event.target.value;localStorage.setItem('axe_product_company_id',state.companyId);state.fundSnapshot=null;state.assetsSnapshot=null;state.accountsSnapshot=null;state.fundMonthlyRows=[];await withMutation(loadCompanyData);return;}
    if(event.target.matches('[data-fund-ledger-month]')){state.fundMonth=event.target.value;await withMutation(loadFundSnapshot);return;}
    if(event.target.matches('[data-fund-weekly-month]')){state.fundWeeklyMonth=event.target.value;state.fundMonthlyRows=[];await loadFundWeeklyMonth();return;}
    if(event.target.matches('[data-fund-filter]')){state.fundFilters[event.target.dataset.fundFilter]=event.target.value;render();return;}
    if(event.target.matches('[data-member-role]')){state.memberRole=event.target.value;render();return;}
    if(event.target.matches('[data-asset-category]')){state.assetCategory=event.target.value;render();return;}
    if(event.target.matches('[data-asset-status]')){state.assetStatus=event.target.value;render();return;}
    if(event.target.matches('[data-account-status]')){state.accountStatus=event.target.value;render();return;}
  }catch(error){setError(error);}
});
root.addEventListener('input', event => {
  if(event.target.matches('[data-member-query]')){state.memberQuery=event.target.value;const pos=event.target.selectionStart;render();const el=root.querySelector('[data-member-query]');el?.focus();el?.setSelectionRange?.(pos,pos);}
  if(event.target.matches('[data-asset-query]')){state.assetQuery=event.target.value;const pos=event.target.selectionStart;render();const el=root.querySelector('[data-asset-query]');el?.focus();el?.setSelectionRange?.(pos,pos);}
  if(event.target.matches('[data-account-query]')){state.accountQuery=event.target.value;const pos=event.target.selectionStart;render();const el=root.querySelector('[data-account-query]');el?.focus();el?.setSelectionRange?.(pos,pos);}
});

root.addEventListener('submit', async event => {
  const form=event.target.closest('form[data-form]'); if(!form)return; event.preventDefault(); const type=form.dataset.form; const data=new FormData(form);
  await withMutation(async()=>{
    if(type==='create-company'){const created=await createCompany(String(data.get('name')||'').trim(),String(data.get('slug')||'').trim());if(!created?.id)throw new Error('생성된 회사 정보를 받지 못했습니다.');state.companyId=created.id;localStorage.setItem('axe_product_company_id',created.id);state.modal=null;await loadCompanies();await loadCompanyData();state.ready=true;setNotice('새 회사가 생성됐습니다.');return;}
    if(type==='redeem-invite'){const joined=await redeemCompanyInvite(String(data.get('invite_code')||'').trim());if(!joined?.company_id)throw new Error('가입된 회사 정보를 받지 못했습니다.');state.companyId=joined.company_id;localStorage.setItem('axe_product_company_id',state.companyId);state.modal=null;await loadCompanies();await loadCompanyData();setNotice('회사에 참가했습니다.');return;}
    if(type==='feedback'){const result=await submitProductFeedback(state.companyId,String(data.get('category')),String(data.get('title')||'').trim(),String(data.get('detail')||'').trim(),String(data.get('contact')||'').trim());state.modal=null;setNotice(`피드백을 보냈습니다. 접수번호 ${result?.reference||''}`);return;}
    if(type==='ledger'){await saveFundLedgerEntry(state.companyId,{entryId:String(data.get('entry_id')||'')||null,direction:String(data.get('direction')||''),amount:Number(data.get('amount')||0),account:String(data.get('account')||'공용계좌'),category:String(data.get('category')||'').trim(),membershipId:String(data.get('membership_id')||'')||null,memo:String(data.get('memo')||'').trim(),ledgerDate:String(data.get('ledger_date')||'')});state.modal=null;await loadFundSnapshot();setNotice('공금 내역을 저장했습니다.');return;}
    if(type==='member'){const id=String(data.get('membership_id'));const row=state.memberships.find(m=>m.id===id);const role=String(data.get('role'));const status=String(data.get('status'));if(row.role!==role)await updateMembershipRole(id,role);if(row.status!==status)await updateMembershipStatus(id,status);state.modal=null;await loadCompanyData();setNotice('멤버 정보를 저장했습니다.');return;}
    if(type==='asset'){const membershipId=String(data.get('membership_id')||'')||null;const holder=membershipId?(state.assetsSnapshot?.members||[]).find(m=>m.id===membershipId):null;await saveWebAsset(state.companyId,{assetId:String(data.get('asset_id')||'')||null,legacyNo:String(data.get('legacy_no')||'').trim()||null,membershipId,ownerName:holder?.display_name||'미배정',category:String(data.get('asset_category')||'기타').trim(),name:String(data.get('asset_name')||'').trim(),acquisitionMethod:String(data.get('acquisition_method')||'').trim()||null,status:String(data.get('status')||'').trim()||(membershipId?'보유':'미배정'),note:String(data.get('note')||'').trim()||null});state.modal=null;await loadAssetsAndAccounts();setNotice('자산을 저장했습니다.');return;}
    if(type==='account-request'){await submitWebAccountRequest(state.companyId,String(data.get('account')||''),String(data.get('note')||''));state.modal=null;await loadAssetsAndAccounts();setNotice('계좌 등록·변경 신청을 제출했습니다.');return;}
    if(type==='invite'){const result=await createCompanyInvite(state.companyId,Number(data.get('max_uses')||1),Number(data.get('expires_in_hours')||168));state.modal={type:'invite',code:result?.invite_code||''};render();return;}
    if(type==='fund-balance'){const game=Number(data.get('game_balance'));if(!Number.isFinite(game)||game<0)throw new Error('게임 내 공용계좌 잔액을 확인해 주세요.');const settings={...(state.companySettings?.settings||{}),fund_balance_check:{game_balance:game,note:String(data.get('note')||'').trim(),calculated_balance:Number(state.fundSnapshot?.balance?.public||0),checked_at:new Date().toISOString()}};await updateCompanySettings(state.companyId,{settings},state.session.user.id);state.companySettings=await getCompanySettings(state.companyId);setNotice('잔액 점검을 저장했습니다.');return;}
    if(type==='fund-fee-rule'){await setFundFeeRule(state.companyId,Number(data.get('year')),Number(data.get('month')),Number(data.get('week')),Number(data.get('weekly_fee')),'WEB 공금 설정');const settings={...(state.companySettings?.settings||{}),fund_default_account:String(data.get('default_account')||'공용계좌')};await updateCompanySettings(state.companyId,{settings},state.session.user.id);state.companySettings=await getCompanySettings(state.companyId);await loadFundSnapshot();setNotice('공금 설정을 저장했습니다.');return;}
    if(type==='settings-basic'){
      await updateCompanySettings(state.companyId,{brand_name:String(data.get('brand_name')||'').trim(),locale:state.companySettings?.locale||'ko-KR',timezone:state.companySettings?.timezone||'Asia/Seoul'},state.session.user.id);
      await saveDiscordCompanyConfig(state.companyId,{notification_channel_id:state.discordCompanyConfig?.notification_channel_id||null,command_channel_id:state.discordCompanyConfig?.command_channel_id||null,admin_role_id:String(data.get('admin_role_id')||'')||null,member_role_id:String(data.get('member_role_id')||'')||null},state.session.user.id);await loadBaseCompanyData();setNotice('기본 정보를 저장했습니다.');return;
    }
    if(type==='settings-modules'){
      for(const mod of state.modules){
        const settings={...(mod.settings||{})};
        for(const key of ['status_channel_id','three_channel_id','ten_channel_id','record_channel_id','order_channel_id']){
          const field=`module_${mod.module_key}_${key}`; if(form.elements[field])settings[key]=String(data.get(field)||'')||null;
        }
        await updateCompanyModuleSettings(state.companyId,mod.module_key,settings,state.session.user.id);
      }
      await loadBaseCompanyData();setNotice('기능 설정을 저장했습니다.');return;
    }
  });
});

boot();
