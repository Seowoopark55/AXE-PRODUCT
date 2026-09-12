import './styles.css';
import { envReady } from './lib/supabase.js';
import {
  getSession, signInWithDiscord, signOut, onAuthStateChange,
  listCompanies, createCompany, getMemberships, updateMembershipRole, updateMembershipStatus, updateMembershipAlias, updateMembershipEmploymentDate, updateMembershipNote, updateCompanyName,
  getModuleCatalog, getCompanyModules, setCompanyModule, updateCompanyModuleSettings,
  getCookingOrderTypes, saveCookingOrderType, setCookingOrderTypeEnabled, getCookingDiscordConfig, saveCookingDiscordGuide,
  getCompanySettings, updateCompanySettings,
  getDiscordConnection, getDiscordChannels, getDiscordRoles, getDiscordCompanyConfig, saveDiscordCompanyConfig,
  getFundAdminRequests, getFundAdminPeriodStatus, reviewFundRequest, setFundFeeRule, getFundEvidenceSignedUrl,
  startDiscordConnection, completeDiscordConnection, getCompanyOnboardingStatus, requestCompanyDiscordReconnect,
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
  cookingOrderTypes: [],
  cookingDiscordConfig: null,
  companySettings: null,
  discordConnection: null,
  discordChannels: [],
  discordRoles: [],
  discordCompanyConfig: null,
  onboardingStatus: null,
  page: validPages.includes(localStorage.getItem('axe_product_page')) ? localStorage.getItem('axe_product_page') : 'fund',
  fundTab: localStorage.getItem('axe_product_fund_tab') || 'ledger',
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
  settingsTab: localStorage.getItem('axe_product_settings_tab') || 'basic',
  companyMenuOpen: false,
  modal: null,
  setupDemo: null,
  loading: false,
  ready: false,
  error: '',
  notice: '',
};

let noticeTimer = null;
let mutationBusy = false;
let reconnectPollTimer = null;
let reconnectPollAttempts = 0;
let catalogPollTimer = null;
let catalogPollAttempts = 0;
async function cleanupLegacyPwa() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('axe-product-pwa-')).map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn('AXE PRODUCT legacy PWA cleanup failed', error);
  }
}

function suppressBrowserFormHistory() {
  root.querySelectorAll('form').forEach(form => form.setAttribute('autocomplete','off'));
  root.querySelectorAll('input, textarea').forEach(field => {
    if (!field.hasAttribute('autocomplete')) field.setAttribute('autocomplete','off');
    field.setAttribute('autocorrect','off');
    field.setAttribute('autocapitalize','off');
    field.setAttribute('spellcheck','false');
  });
}
function render() { renderShell(root, state); suppressBrowserFormHistory(); }
function setNotice(message) {
  state.notice = String(message || ''); state.error = ''; render();
  if (noticeTimer) clearTimeout(noticeTimer);
  if (state.notice) noticeTimer = setTimeout(() => {
    state.notice = '';
    // Do not re-render the whole app just to hide a notice. A full root.innerHTML
    // replacement closes an open native <select>, which made role/channel
    // dropdowns appear to close by themselves a few seconds after catalog load.
    root.querySelector('.runtime-banner--notice')?.remove();
  }, 3200);
}
function setError(error) { state.error = String(error?.message || error || '오류가 발생했습니다.'); render(); }
function clearCompanyData() {
  state.memberships=[]; state.moduleCatalog=[]; state.modules=[]; state.cookingOrderTypes=[]; state.cookingDiscordConfig=null; state.companySettings=null;
  state.discordConnection=null; state.discordChannels=[]; state.discordRoles=[]; state.discordCompanyConfig=null; state.onboardingStatus=null;
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
  const [catalog, modules, cookingTypes, cookingConfig, settings, discord, channels, roles, config, onboarding] = await Promise.all([
    getModuleCatalog(), getCompanyModules(state.companyId), getCookingOrderTypes(state.companyId), getCookingDiscordConfig(state.companyId), getCompanySettings(state.companyId),
    getDiscordConnection(state.companyId), getDiscordChannels(state.companyId), getDiscordRoles(state.companyId), getDiscordCompanyConfig(state.companyId),
    getCompanyOnboardingStatus(state.companyId),
  ]);
  state.moduleCatalog=catalog||[]; state.modules=modules||[]; state.cookingOrderTypes=cookingTypes||[]; state.cookingDiscordConfig=cookingConfig||null; state.companySettings=settings||null;
  state.discordConnection=discord||null; state.discordChannels=channels||[]; state.discordRoles=roles||[]; state.discordCompanyConfig=config||null; state.onboardingStatus=onboarding||null;
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

function fundWeekNumbersForMonth(year, month) {
  const safeYear=Number(year);
  const safeMonth=Number(month);
  const lastDay=new Date(Date.UTC(safeYear,safeMonth,0)).getUTCDate();
  const weeks=[];
  for(let day=1;day<=lastDay;day+=1){
    if(new Date(Date.UTC(safeYear,safeMonth-1,day)).getUTCDay()===6) weeks.push(weeks.length+1);
  }
  return weeks;
}

async function loadFundWeeklyMonth(monthValue = state.fundWeeklyMonth) {
  if (!canAdmin(state) || !moduleEnabled(state,'fund')) { state.fundMonthlyRows=[]; return; }
  state.fundWeeklyLoading=true; render();
  const [year,month]=String(monthValue).split('-').map(Number);
  const weekNumbers=fundWeekNumbersForMonth(year,month);
  const results = await Promise.all(weekNumbers.map(async week => {
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

function clearReconnectPoll() {
  if (reconnectPollTimer) clearTimeout(reconnectPollTimer);
  reconnectPollTimer = null;
  reconnectPollAttempts = 0;
}

function clearCatalogPoll() {
  if (catalogPollTimer) clearTimeout(catalogPollTimer);
  catalogPollTimer = null;
  catalogPollAttempts = 0;
}

function discordCatalogPending(status = state.onboardingStatus) {
  return state.discordConnection?.status === 'connected' && status?.catalog_ready === false;
}

function startCatalogStatusPoll() {
  clearCatalogPoll();
  const run = async () => {
    if (!state.companyId || !state.session?.user) return clearCatalogPoll();
    catalogPollAttempts += 1;
    try {
      const status = await getCompanyOnboardingStatus(state.companyId);
      state.onboardingStatus = status || null;
      if (!status?.discord_connected) {
        clearCatalogPoll();
        render();
        return;
      }
      if (status?.catalog_ready === true) {
        clearCatalogPoll();
        await loadBaseCompanyData();
        setNotice(`Discord 역할 ${Number(status.role_count||0)}개 · 채널 ${Number(status.channel_count||0)}개를 불러왔습니다.`);
        return;
      }
      render();
    } catch (error) {
      if (catalogPollAttempts >= 30) {
        clearCatalogPoll();
        setError(error);
        return;
      }
    }
    if (catalogPollAttempts < 30) catalogPollTimer=setTimeout(run,2000);
    else {
      clearCatalogPoll();
      setNotice('Discord 역할·채널 동기화가 지연되고 있습니다. 잠시 후 새로고침해 주세요.');
    }
  };
  catalogPollTimer=setTimeout(run,600);
}

function startReconnectStatusPoll() {
  clearReconnectPoll();
  const run = async () => {
    if (!state.companyId || !state.session?.user) return clearReconnectPoll();
    reconnectPollAttempts += 1;
    try {
      const status = await getCompanyOnboardingStatus(state.companyId);
      state.onboardingStatus = status || null;
      const phase = String(status?.status || '');
      if (phase === 'error') {
        clearReconnectPoll();
        setError(status?.last_error || 'Discord 연결 초기화에 실패했습니다.');
        return;
      }
      if (!['reset_requested','resetting'].includes(phase)) {
        clearReconnectPoll();
        await loadBaseCompanyData();
        state.settingsTab='basic';
        localStorage.setItem('axe_product_settings_tab','basic');
        setNotice('기존 Discord 연결 정리가 완료됐습니다. 다시 연결할 수 있습니다.');
        return;
      }
      render();
    } catch (error) {
      if (reconnectPollAttempts >= 20) {
        clearReconnectPoll();
        setError(error);
        return;
      }
    }
    if (reconnectPollAttempts < 20) reconnectPollTimer=setTimeout(run,2500);
    else { clearReconnectPoll(); setNotice('Discord 연결 정리가 진행 중입니다. 잠시 후 새로고침해 주세요.'); }
  };
  reconnectPollTimer=setTimeout(run,1200);
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
  const connection=await completeDiscordConnection(token); clearReconnectPoll(); clearCatalogPoll(); state.companyId=connection.company_id; localStorage.setItem('axe_product_company_id',state.companyId); await refreshAll(); state.page='settings'; state.settingsTab='basic'; localStorage.setItem('axe_product_page','settings'); localStorage.setItem('axe_product_settings_tab','basic');
  if(discordCatalogPending()){setNotice(`Discord 서버 ${connection.guild_name||''} 연결 완료 · 역할·채널 정보를 불러오는 중입니다.`);startCatalogStatusPoll();}
  else setNotice(`Discord 서버 ${connection.guild_name||''} 연결이 완료됐습니다.`);
}

async function boot() {
  if(!envReady){state.ready=true;render();return;}
  try{state.session=await getSession();}catch(error){state.error=String(error?.message||error);} render(); await refreshAll();
  if(discordCatalogPending()) startCatalogStatusPoll();
  try{await handleDiscordOAuthReturn();}catch(error){setError(error);}
  onAuthStateChange(async (_event,session)=>{const before=state.session?.user?.id||null; const after=session?.user?.id||null; state.session=session; if(before!==after){state.ready=false;await refreshAll();}});
}

function closeModal({force=false}={}) {
  if(state.modal?.type==='feedback' && !force){
    const form=root.querySelector('form[data-form="feedback"]');
    const dirty=form && [...form.querySelectorAll('input,textarea')].some(el=>String(el.value||'').trim());
    if(dirty && !window.confirm('작성 중인 피드백 내용이 사라질 수 있습니다. 닫을까요?')) return false;
  }
  if(state.modal?.type==='setup-demo') state.setupDemo=null; state.modal=null; render(); return true;
}

async function withMutation(fn){ if(mutationBusy)return; mutationBusy=true; state.loading=true; render(); try{await fn();}catch(error){setError(error);}finally{mutationBusy=false;state.loading=false;render();} }

function onboardingPhase(){ return String(state.onboardingStatus?.status||''); }
function onboardingStep(){ return String(state.onboardingStatus?.current_step||''); }
function isOnboardingStep(step){ return onboardingPhase()==='onboarding' && onboardingStep()===step; }

function assertOnboardingRoles(data){
  if(!isOnboardingStep('roles')) return;
  if(discordCatalogPending()) throw new Error('Discord 역할·채널 정보를 불러오는 중입니다. 잠시만 기다려 주세요.');
  if(!String(data.get('admin_role_id')||'').trim()) throw new Error('관리자 역할을 선택해 주세요.');
  if(!String(data.get('member_role_id')||'').trim()) throw new Error('일반 멤버 역할을 선택해 주세요.');
}

async function saveBasicSettingsData(data,{requireOnboardingRoles=false}={}){
  if(requireOnboardingRoles) assertOnboardingRoles(data);
  const companyName=String(data.get('company_name')||'').trim();
  if(!companyName) throw new Error('회사 이름을 입력해 주세요.');
  if(companyName!==(state.companies.find(c=>c.id===state.companyId)?.name||'')) await updateCompanyName(state.companyId,companyName);
  let settings={...(state.companySettings?.settings||{})};
  await updateCompanySettings(state.companyId,{locale:state.companySettings?.locale||'ko-KR',timezone:state.companySettings?.timezone||'Asia/Seoul',settings},state.session.user.id);
  await saveDiscordCompanyConfig(state.companyId,{notification_channel_id:state.discordCompanyConfig?.notification_channel_id||null,command_channel_id:state.discordCompanyConfig?.command_channel_id||null,admin_role_id:String(data.get('admin_role_id')||'')||null,member_role_id:String(data.get('member_role_id')||'')||null},state.session.user.id);
}

async function saveModuleSettingsData(form,data){
  for(const mod of state.modules){
    const settings={...(mod.settings||{})};
    for(const key of ['status_channel_id','three_channel_id','ten_channel_id','record_channel_id','order_channel_id']){
      const field=`module_${mod.module_key}_${key}`; if(form.elements[field])settings[key]=String(data.get(field)||'')||null;
    }
    await updateCompanyModuleSettings(state.companyId,mod.module_key,settings,state.session.user.id);
  }
}

root.addEventListener('click', async event => {
  const pageBtn=event.target.closest('[data-page]');
  if(pageBtn){ state.page=pageBtn.dataset.page; localStorage.setItem('axe_product_page',state.page); if(state.page==='fund'&&!state.fundSnapshot) await withMutation(loadFundSnapshot); if(['assets','accounts'].includes(state.page)&&!state.assetsSnapshot) await withMutation(loadAssetsAndAccounts); render(); return; }
  const fundTab=event.target.closest('[data-fund-tab]');
  if(fundTab){state.fundTab=fundTab.dataset.fundTab;localStorage.setItem('axe_product_fund_tab',state.fundTab);render();if(state.fundTab==='weekly') await loadFundWeeklyMonth();return;}
  const memberFilter=event.target.closest('[data-member-filter]'); if(memberFilter){state.memberFilter=memberFilter.dataset.memberFilter;render();return;}
  const assetTab=event.target.closest('[data-asset-tab]'); if(assetTab){state.assetTab=assetTab.dataset.assetTab;render();return;}
  const settingsTab=event.target.closest('[data-settings-tab]');
  if(settingsTab){
    const nextTab=String(settingsTab.dataset.settingsTab||'basic');
    if(nextTab==='modules' && state.settingsTab==='basic' && isOnboardingStep('roles')){
      if(discordCatalogPending()){setError('Discord 역할·채널 정보를 불러오는 중입니다. 잠시만 기다려 주세요.');startCatalogStatusPoll();return;}
      const activeForm=root.querySelector('form[data-form="settings-basic"]');
      if(!activeForm){setError('기본 설정 화면을 다시 열어 주세요.');return;}
      const activeData=new FormData(activeForm);
      await withMutation(async()=>{
        await saveBasicSettingsData(activeData,{requireOnboardingRoles:true});
        await loadBaseCompanyData();
        state.settingsTab='modules';
        localStorage.setItem('axe_product_settings_tab','modules');
        setNotice('역할 설정을 저장했습니다. 기능·채널 설정으로 이동합니다.');
      });
      return;
    }
    if(nextTab==='modules' && state.settingsTab==='basic' && isOnboardingStep('discord')){
      setError('먼저 Discord 서버를 연결해 주세요.');
      return;
    }
    state.settingsTab=nextTab;localStorage.setItem('axe_product_settings_tab',state.settingsTab);render();return;
  }
  if(event.target.matches('[data-modal-backdrop]')){ if(['feedback','cooking-menu'].includes(state.modal?.type))return; closeModal(); return; }

  const actionEl=event.target.closest('[data-action]'); if(!actionEl)return; const action=actionEl.dataset.action;
  if(action==='toggle-company-menu'){state.companyMenuOpen=!state.companyMenuOpen;render();return;}
  if(action==='switch-company'){const next=String(actionEl.dataset.companyId||'');clearReconnectPoll();clearCatalogPoll();state.companyMenuOpen=false;if(!next||next===state.companyId){render();return;}state.companyId=next;localStorage.setItem('axe_product_company_id',next);state.fundSnapshot=null;state.assetsSnapshot=null;state.accountsSnapshot=null;state.fundMonthlyRows=[];await withMutation(loadCompanyData);return;}
  if(action==='dismiss-error'){state.error='';render();return;}
  if(action==='close-modal'){closeModal();return;}
  if(action==='open-create-company'){state.modal={type:'create-company'};render();return;}
  if(action==='open-setup-demo'){state.setupDemo={step:0,connected:false,adminRole:'대표',memberRole:'회사원',modules:{fund:true,ammo:true,outlaw:false,cooking:false,assets:true},channels:{fund:'#공금-현황',ammo3:'#3시-총알',ammo10:'#10시-총알',outlaw:'#전적-등록',cooking:'#요리-주문'}};state.modal={type:'setup-demo'};render();return;}
  if(action==='setup-demo-connect'){if(!state.setupDemo)return;state.setupDemo.connected=true;render();return;}
  if(action==='setup-demo-next'){if(!state.setupDemo)return;if(state.setupDemo.step===1&&!state.setupDemo.connected){state.setupDemo.connected=true;render();return;}state.setupDemo.step=Math.min(5,Number(state.setupDemo.step||0)+1);render();return;}
  if(action==='setup-demo-back'){if(!state.setupDemo)return;state.setupDemo.step=Math.max(0,Number(state.setupDemo.step||0)-1);render();return;}
  if(action==='setup-demo-restart'){if(!state.setupDemo)return;state.setupDemo={step:0,connected:false,adminRole:'대표',memberRole:'회사원',modules:{fund:true,ammo:true,outlaw:false,cooking:false,assets:true},channels:{fund:'#공금-현황',ammo3:'#3시-총알',ammo10:'#10시-총알',outlaw:'#전적-등록',cooking:'#요리-주문'}};render();return;}
  if(action==='setup-demo-finish'){state.setupDemo=null;state.modal=null;render();return;}
  if(action==='setup-demo-jump'){if(!state.setupDemo)return;const target=Number(actionEl.dataset.step||0);if(target<=Number(state.setupDemo.step||0)){state.setupDemo.step=Math.max(0,Math.min(5,target));render();}return;}
  if(action==='setup-demo-toggle-module'){if(!state.setupDemo)return;const key=String(actionEl.dataset.moduleKey||'');if(key&&Object.prototype.hasOwnProperty.call(state.setupDemo.modules,key)){state.setupDemo.modules[key]=!state.setupDemo.modules[key];render();}return;}
  if(action==='open-feedback'){state.modal={type:'feedback'};render();return;}
  if(action==='open-ledger'){state.modal={type:'ledger',entryId:null};render();return;}
  if(action==='edit-ledger'){state.modal={type:'ledger',entryId:actionEl.dataset.entryId};render();return;}
  if(action==='edit-member'){state.modal={type:'member',membershipId:actionEl.dataset.membershipId};render();return;}
  if(action==='open-asset'){state.modal={type:'asset',assetId:null};render();return;}
  if(action==='edit-asset'){state.modal={type:'asset',assetId:actionEl.dataset.assetId};render();return;}
  if(action==='open-account-request'){state.modal={type:'account'};render();return;}
  if(action==='reset-fund-filter'){state.fundFilters={person:'all',type:'all',account:'all'};render();return;}
  if(action==='open-discord-reconnect'){if(!canAdmin(state)){setError('관리자 권한이 필요합니다.');return;}if(state.discordConnection?.status!=='connected'){setError('현재 연결된 Discord 서버가 없습니다.');return;}state.modal={type:'discord-reconnect'};render();return;}
  await withMutation(async()=>{
    if(action==='discord-login'){await signInWithDiscord();return;}
    if(action==='logout'){clearReconnectPoll();await signOut();state.modal=null;return;}
    if(action==='refresh'){await refreshAll();setNotice('최신 데이터를 불러왔습니다.');return;}
    if(action==='refresh-fund'){await loadFundSnapshot();if(state.fundTab==='weekly')await loadFundWeeklyMonth();setNotice('공금 데이터를 새로고침했습니다.');return;}
    if(action==='connect-discord'){if(!canAdmin(state))throw new Error('관리자 권한이 필요합니다.');if(['reset_requested','resetting'].includes(String(state.onboardingStatus?.status||'')))throw new Error('기존 Discord 연결을 정리 중입니다. 완료 후 다시 연결해 주세요.');const started=await startDiscordConnection(state.companyId);location.assign(started.authorize_url);return;}
    if(action==='toggle-module'){
      if(!canAdmin(state))throw new Error('관리자 권한이 필요합니다.');if(['reset_requested','resetting'].includes(String(state.onboardingStatus?.status||'')))throw new Error('Discord 연결을 정리 중에는 기능 설정을 변경할 수 없습니다.'); const key=actionEl.dataset.moduleKey; const current=moduleRow(state,key); if(!current)throw new Error('기능 설정을 찾지 못했습니다.');
      await setCompanyModule(state.companyId,key,!current.enabled,state.session.user.id); await loadCompanyData(); setNotice(`${(current.enabled?'기능을 껐습니다.':'기능을 켰습니다.')}`); return;
    }
    if(action==='open-cooking-menu'){if(!canAdmin(state))throw new Error('요리 메뉴 관리는 OWNER 또는 관리자만 가능합니다.');state.modal={type:'cooking-menu',typeKey:null};render();return;}
    if(action==='edit-cooking-menu'){if(!canAdmin(state))throw new Error('요리 메뉴 관리는 OWNER 또는 관리자만 가능합니다.');state.modal={type:'cooking-menu',typeKey:String(actionEl.dataset.typeKey||'')};render();return;}
    if(action==='toggle-cooking-menu'){
      if(!canAdmin(state))throw new Error('요리 메뉴 관리는 OWNER 또는 관리자만 가능합니다.');
      const typeKey=String(actionEl.dataset.typeKey||''); const current=state.cookingOrderTypes.find(x=>String(x.type_key)===typeKey);
      if(!current)throw new Error('요리 메뉴를 찾지 못했습니다.');
      await setCookingOrderTypeEnabled(state.companyId,typeKey,current.enabled===false);
      state.cookingOrderTypes=await getCookingOrderTypes(state.companyId);
      setNotice(current.enabled===false?'요리 메뉴를 사용하도록 변경했습니다.':'요리 메뉴를 숨겼습니다.');return;
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
    if(event.target.matches('[data-fund-ledger-month]')){state.fundMonth=event.target.value;await withMutation(loadFundSnapshot);return;}
    if(event.target.matches('[data-fund-weekly-month]')){state.fundWeeklyMonth=event.target.value;state.fundMonthlyRows=[];await loadFundWeeklyMonth();return;}
    if(event.target.matches('[data-fund-filter]')){state.fundFilters[event.target.dataset.fundFilter]=event.target.value;render();return;}
    if(event.target.matches('[data-member-role]')){state.memberRole=event.target.value;render();return;}
    if(event.target.matches('[data-asset-category]')){state.assetCategory=event.target.value;render();return;}
    if(event.target.matches('[data-asset-status]')){state.assetStatus=event.target.value;render();return;}
    if(event.target.matches('[data-account-status]')){state.accountStatus=event.target.value;render();return;}
    if(event.target.matches('[data-asset-holder]')){const status=root.querySelector('[data-asset-modal-status]');if(status)status.value=event.target.value?'보유':'미배정';return;}
    if(event.target.matches('[data-asset-modal-status]')){const holder=root.querySelector('[data-asset-holder]');if(event.target.value==='미배정'&&holder)holder.value='';return;}
    if(event.target.matches('[data-setup-role]')){if(!state.setupDemo)return;state.setupDemo[event.target.dataset.setupRole]=String(event.target.value||'');render();return;}
    if(event.target.matches('[data-setup-channel]')){if(!state.setupDemo)return;const key=String(event.target.dataset.setupChannel||'');state.setupDemo.channels=state.setupDemo.channels||{};const map={'공금-현황':'fund','3시-총알':'ammo3','10시-총알':'ammo10','전적-등록':'outlaw','요리-주문':'cooking'};state.setupDemo.channels[map[key]||key]=String(event.target.value||'');render();return;}
  }catch(error){setError(error);}
});
root.addEventListener('input', event => {
  if(event.target.matches('[data-member-query]')){state.memberQuery=event.target.value;const pos=event.target.selectionStart;render();const el=root.querySelector('[data-member-query]');el?.focus();el?.setSelectionRange?.(pos,pos);}
  if(event.target.matches('[data-asset-query]')){state.assetQuery=event.target.value;const pos=event.target.selectionStart;render();const el=root.querySelector('[data-asset-query]');el?.focus();el?.setSelectionRange?.(pos,pos);}
  if(event.target.matches('[data-account-query]')){state.accountQuery=event.target.value;const pos=event.target.selectionStart;render();const el=root.querySelector('[data-account-query]');el?.focus();el?.setSelectionRange?.(pos,pos);}
});

document.addEventListener('click', event => {
  if(state.companyMenuOpen && !event.target.closest('.runtime-company-picker')){state.companyMenuOpen=false;render();}
});

root.addEventListener('submit', async event => {
  const form=event.target.closest('form[data-form]'); if(!form)return; event.preventDefault(); const type=form.dataset.form; const data=new FormData(form);
  await withMutation(async()=>{
    if(type==='create-company'){const created=await createCompany(String(data.get('name')||'').trim(),String(data.get('slug')||'').trim());if(!created?.id)throw new Error('생성된 회사 정보를 받지 못했습니다.');state.companyId=created.id;localStorage.setItem('axe_product_company_id',created.id);state.modal=null;state.page='settings';state.settingsTab='basic';localStorage.setItem('axe_product_page','settings');localStorage.setItem('axe_product_settings_tab','basic');await loadCompanies();await loadCompanyData();state.ready=true;setNotice('새 회사가 생성됐습니다. Discord 연결부터 설정해 주세요.');return;}
    if(type==='reconnect-discord'){clearCatalogPoll();if(data.get('confirm')!=='yes')throw new Error('Discord 연결 초기화 안내를 확인해 주세요.');const jobId=await requestCompanyDiscordReconnect(state.companyId);state.modal=null;state.onboardingStatus=await getCompanyOnboardingStatus(state.companyId);setNotice(`Discord 연결 정리를 시작했습니다. 작업 ${jobId.slice(0,8)}…`);startReconnectStatusPoll();return;}
    if(type==='feedback'){const result=await submitProductFeedback(state.companyId,String(data.get('category')),String(data.get('title')||'').trim(),String(data.get('detail')||'').trim(),String(data.get('contact')||'').trim());state.modal=null;setNotice(`피드백을 보냈습니다. 접수번호 ${result?.reference||''}`);return;}
    if(type==='ledger'){await saveFundLedgerEntry(state.companyId,{entryId:String(data.get('entry_id')||'')||null,direction:String(data.get('direction')||''),amount:Number(data.get('amount')||0),account:String(data.get('account')||'공용계좌'),category:String(data.get('category')||'').trim(),membershipId:String(data.get('membership_id')||'')||null,memo:String(data.get('memo')||'').trim(),ledgerDate:String(data.get('ledger_date')||'')});state.modal=null;await loadFundSnapshot();setNotice('공금 내역을 저장했습니다.');return;}
    if(type==='member'){const id=String(data.get('membership_id'));const row=state.memberships.find(m=>m.id===id);const role=String(data.get('role'));const status=String(data.get('status'));const aliasName=String(data.get('alias_name')||'').trim();const employmentStartedOn=String(data.get('employment_started_on')||'');const memberNote=String(data.get('member_note')||'').trim();if(String(row.alias_name||'')!==aliasName)await updateMembershipAlias(id,aliasName);if(row.role!==role)await updateMembershipRole(id,role);if(row.status!==status)await updateMembershipStatus(id,status);if(String(row.employment_started_on||'')!==employmentStartedOn)await updateMembershipEmploymentDate(id,employmentStartedOn);if(String(row.member_note||'')!==memberNote)await updateMembershipNote(id,memberNote);state.modal=null;await loadCompanyData();setNotice('멤버 정보를 저장했습니다.');return;}
    if(type==='asset'){let membershipId=String(data.get('membership_id')||'')||null;let status=String(data.get('status')||'').trim()||(membershipId?'보유':'미배정');if(status==='미배정')membershipId=null;if(membershipId)status='보유';const holder=membershipId?(state.assetsSnapshot?.members||[]).find(m=>m.id===membershipId):null;const assetId=String(data.get('asset_id')||'')||null;const existing=assetId?(state.assetsSnapshot?.assets||[]).find(a=>a.id===assetId):null;await saveWebAsset(state.companyId,{assetId,legacyNo:existing?.legacy_no||null,membershipId,ownerName:holder?.display_name||'미배정',category:String(data.get('asset_category')||'기타').trim(),name:String(data.get('asset_name')||'').trim(),acquisitionMethod:String(data.get('acquisition_method')||'').trim()||null,status,note:String(data.get('note')||'').trim()||null});state.modal=null;await loadAssetsAndAccounts();setNotice(membershipId?'자산을 저장하고 보유자를 배정했습니다.':'자산을 미배정 상태로 저장했습니다.');return;}
    if(type==='account-request'){await submitWebAccountRequest(state.companyId,String(data.get('account')||''),String(data.get('note')||''));state.modal=null;await loadAssetsAndAccounts();setNotice('계좌 등록·변경 신청을 제출했습니다.');return;}
    if(type==='fund-balance'){const game=Number(data.get('game_balance'));if(!Number.isFinite(game)||game<0)throw new Error('게임 내 공용계좌 잔액을 확인해 주세요.');const settings={...(state.companySettings?.settings||{}),fund_balance_check:{game_balance:game,note:String(data.get('note')||'').trim(),calculated_balance:Number(state.fundSnapshot?.balance?.public||0),checked_at:new Date().toISOString()}};await updateCompanySettings(state.companyId,{settings},state.session.user.id);state.companySettings=await getCompanySettings(state.companyId);setNotice('잔액 점검을 저장했습니다.');return;}
    if(type==='fund-fee-rule'){const feeMonth=String(data.get('fee_month')||state.fundMonth||state.currentMonth);const [feeYear,feeMonthNo]=feeMonth.split('-').map(Number);if(!feeYear||!feeMonthNo)throw new Error('적용 월을 확인해 주세요.');await setFundFeeRule(state.companyId,feeYear,feeMonthNo,Number(data.get('week')),Number(data.get('weekly_fee')),'WEB 공금 설정');const settings={...(state.companySettings?.settings||{}),fund_default_account:String(data.get('default_account')||'공용계좌')};await updateCompanySettings(state.companyId,{settings},state.session.user.id);state.companySettings=await getCompanySettings(state.companyId);state.fundMonth=feeMonth;await loadFundSnapshot();setNotice(`${feeYear}년 ${feeMonthNo}월 공금 설정을 저장했습니다.`);return;}
    if(type==='cooking-guide'){
      if(!canAdmin(state))throw new Error('요리 주문 안내 관리는 OWNER 또는 관리자만 가능합니다.');
      const membershipId=currentMembership(state)?.id||null;
      if(!membershipId)throw new Error('현재 회사 멤버 정보를 확인하지 못했습니다.');
      state.cookingDiscordConfig=await saveCookingDiscordGuide(state.companyId,{
        scheduleText:String(data.get('schedule_text')||''),
        extraGuide:String(data.get('extra_guide')||''),
      },membershipId);
      setNotice('Discord 요리 주문 안내를 저장했습니다.');return;
    }
    if(type==='cooking-menu'){
      if(!canAdmin(state))throw new Error('요리 메뉴 관리는 OWNER 또는 관리자만 가능합니다.');
      const existingKey=String(data.get('type_key')||'').trim();
      const randomPart=(globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`).replace(/-/g,'').slice(0,12);
      const typeKey=existingKey||`m_${randomPart}`;
      const label=String(data.get('label')||'').trim(); const shortLabel=String(data.get('short_label')||'').trim();
      if(!label)throw new Error('메뉴 이름을 입력해 주세요.');
      await saveCookingOrderType(state.companyId,{typeKey,label,shortLabel:shortLabel||label,detail:String(data.get('detail')||'').trim(),pricePerSet:Number(data.get('price_per_set')||0),sortOrder:Number(data.get('sort_order')||0),enabled:data.get('enabled')==='on'});
      state.cookingOrderTypes=await getCookingOrderTypes(state.companyId); state.modal=null;
      setNotice(existingKey?'요리 메뉴를 저장했습니다.':'요리 메뉴를 추가했습니다.');return;
    }
    if(type==='settings-basic'){
      const wasRoleStep=isOnboardingStep('roles');
      await saveBasicSettingsData(data,{requireOnboardingRoles:wasRoleStep});
      await loadCompanies();
      await loadBaseCompanyData();
      if(wasRoleStep || state.onboardingStatus?.current_step==='modules'){
        state.settingsTab='modules';
        localStorage.setItem('axe_product_settings_tab','modules');
      }
      setNotice(wasRoleStep?'역할 설정을 저장했습니다. 기능·채널 설정으로 이동합니다.':'기본 정보를 저장했습니다.');return;
    }
    if(type==='settings-modules'){
      const wasModuleStep=isOnboardingStep('modules');
      await saveModuleSettingsData(form,data);
      await loadBaseCompanyData();
      const completed=wasModuleStep && (String(state.onboardingStatus?.status||'')==='ready' || String(state.onboardingStatus?.current_step||'')==='complete');
      setNotice(completed?'초기 설정이 완료됐습니다.':'기능 설정을 저장했습니다.');return;
    }
  });
});

cleanupLegacyPwa();
boot();
