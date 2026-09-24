import { getDiscordBotToken, getHubAppUrl } from '../../server/discordSecurity.js';
import { callAxeProductRpc, requireUser } from '../../server/supabaseUser.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DISCORD_ID = /^\d{15,22}$/;

async function discord(path,botToken,body){
  const response=await fetch(`https://discord.com/api/v10${path}`,{
    method:'POST',headers:{Authorization:`Bot ${botToken}`,'Content-Type':'application/json'},
    body:JSON.stringify(body),
  });
  if(!response.ok) throw new Error(`Discord HTTP ${response.status}`);
  return response.json();
}

export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'});}
  try{
    const id=String(req.body?.request_id||'');
    if(!UUID.test(id))return res.status(400).json({error:'신청 ID가 올바르지 않습니다.'});
    const {token}=await requireUser(req);
    // Server-only env: never expose the owner ID or bot token to the browser.
    const ownerId=String(process.env.LAC_HUB_OWNER_DISCORD_ID||'').trim();
    if(!DISCORD_ID.test(ownerId))return res.status(200).json({sent:false,reason:'owner_dm_not_configured'});
    let botToken;
    try{botToken=getDiscordBotToken();}catch{return res.status(200).json({sent:false,reason:'bot_not_configured'});}
    // Fail closed; only the authenticated original applicant can atomically claim
    // the pending request's one notification attempt. No client-supplied text/recipient.
    const claimed=await callAxeProductRpc(token,'lac_pass_claim_dm',{p_request_id:id});
    const row=Array.isArray(claimed)?claimed[0]:claimed;
    if(!row?.request_id)return res.status(200).json({sent:false,reason:'already_processed'});
    try{
      const channel=await discord('/users/@me/channels',botToken,{recipient_id:ownerId});
      if(!channel?.id)throw new Error('Cannot create DM channel.');
      await discord(`/channels/${channel.id}/messages`,botToken,{
        content:[
          '**🎟️ LAC HUB 통합 이용권 신청이 접수되었습니다.**',
          `회사: ${String(row.company_name||'회사').replace(/[@`]/g,'').slice(0,80)}`,
          `신청자: ${String(row.requester_name||'회사 멤버').replace(/[@`]/g,'').slice(0,80)}`,
          '승인/반려: HUB 로그인 → 계정 정보 → 이용권 신청 알림',
          getHubAppUrl(),
        ].join('\n'),allowed_mentions:{parse:[]},
      });
      return res.status(200).json({sent:true});
    }catch{return res.status(200).json({sent:false,reason:'dm_delivery_failed'});}
  }catch(error){
    const status=Number(error?.statusCode||500);
    return res.status(status>=400&&status<500?status:500).json({error:status>=500?'알림을 처리하지 못했습니다. 신청 내역은 HUB에서 확인할 수 있습니다.':String(error?.message||'권한을 확인하지 못했습니다.')});
  }
}
