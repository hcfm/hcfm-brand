import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {CAMPAIGN_FILE,campaignFields,writeCampaign,decodeManifest,encodeManifest} from '../lib/banner-campaign.js';
// This route runs beside the existing publisher in the organisation's Vercel project.
// Insights verifies the person, office and saved change before Vercel uses its credential.
const REPO='https://api.github.com/repos/hcfm/hcfm-brand';
// The one address Vercel asks for approval. It is fixed here, so no request can point it elsewhere.
const CALLBACK='https://hcfm-insights-banner-approval.pages.dev/api/banner-approval';
const TARGETS={eastern:['parent','family-rosary','catholic-mom','peyton-institute'],ftp:['ftp','catholic-central']};
// Vercel must not reshape the body: the ticket is signed over its exact bytes, so the route reads them itself.
export const config={api:{bodyParser:false}};
// Read a reply, but give up past a size limit, so an oversized reply cannot exhaust memory.
async function boundedJson(response,max){
 const length=Number(response.headers.get('content-length'));
 if(Number.isFinite(length)&&length>max)throw Error('Response too large');
 if(!response.body)throw Error('Missing response body');
 const reader=response.body.getReader(),chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('Response too large');}chunks.push(value);}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks.map(chunk=>Buffer.from(chunk)))));
}
// Read the request body, refusing anything over 360 KB.
async function rawBody(req){
 const chunks=[];let size=0;
 for await(const chunk of req){size+=chunk.length;if(size>360000)throw Error('Body too large');chunks.push(chunk);}
 return Buffer.concat(chunks);
}
// Check the ticket Insights signed with the shared secret: genuine, unexpired (two minutes at most),
// for one of the six banners, and for exactly these request bytes. Anything else is no ticket at all.
function verify(token,raw,secret){
 if(typeof token!=='string'||token.length>2500||!/^br1\.[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+$/.test(token)||typeof secret!=='string'||!/^[-_A-Za-z0-9]{43,}$/.test(secret))return null;
 try{
  const [,payload,signature]=token.split('.'),key=Buffer.from(secret,'base64url');if(key.length<32)return null;
  const actual=Buffer.from(signature,'base64url'),expected=createHmac('sha256',key).update(`br1.${payload}`).digest();
  if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
  const claim=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')),now=Math.floor(Date.now()/1000);
  if(claim.v!==1||typeof claim.jti!=='string'||!/^[-_A-Za-z0-9]{43}$/.test(claim.jti)||!TARGETS[claim.office]?.includes(claim.target)||!['GET','PUT'].includes(claim.method)||typeof claim.path!=='string'||!Number.isInteger(claim.iat)||!Number.isInteger(claim.exp)||claim.iat>now+5||claim.exp<=now||claim.exp>claim.iat+120||claim.hash!==createHash('sha256').update(raw).digest('hex'))return null;
  return claim;
 }catch{return null;}
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 // A browser sign-in or any other credential is never accepted here; only a signed ticket.
 if(req.headers.authorization||req.headers.cookie)return res.status(403).json({error:'not_authorized'});
 let raw,body;try{raw=await rawBody(req);body=JSON.parse(raw.toString('utf8'));}catch{return res.status(400).json({error:'invalid_request'});}
 const token=req.headers['x-hcfm-banner-capability'],claim=verify(token,raw,process.env.HCFM_BANNER_CAPABILITY_SECRET);
 if(!claim||!body||body.office!==claim.office||body.target!==claim.target||body.path!==claim.path||claim.method!==(Object.hasOwn(body,'write')?'PUT':'GET')||claim.action!==(body.operation?.action||'')||claim.requestId!==(body.operation?.requestId||''))return res.status(403).json({error:'not_authorized'});
 try{
  // Ask the approval callback, which re-checks the person's banner switch in People and access.
  const permission=await fetch(CALLBACK,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(15000),headers:{'X-HCFM-Banner-Capability':token,'Content-Type':'application/json'},body:raw});
  if(!permission.ok||!permission.headers.get('content-type')?.includes('application/json'))return res.status(403).json({error:'not_authorized'});
  const permit=await boundedJson(permission,360000),file=`email-banners/${body.target}/banner.png`;
  const current=`/contents/${file}?ref=main`,history=`/commits?path=${encodeURIComponent(file)}&sha=main&per_page=20`,campaignHistory=`/commits?path=${encodeURIComponent(CAMPAIGN_FILE)}&sha=main&per_page=100`;
  const validRead=permit.path===`/contents/${CAMPAIGN_FILE}?ref=main`||permit.path===campaignHistory||permit.path===current||permit.path===history||(/^\/[a-z]/.test(permit.path||'')&&/^[a-f0-9]{40}$/.test(body.operation?.revision||'')&&permit.path===`/contents/${file}?ref=${body.operation.revision}`);
  if(permit.method!==claim.method||permit.path!==claim.path||!((permit.method==='GET'&&validRead)||(permit.method==='PUT'&&(permit.path===`/contents/${file}`||permit.action==='campaign'&&permit.path===`/contents/${CAMPAIGN_FILE}`))))return res.status(403).json({error:'invalid_permission'});
  // For a change, the approval must describe exactly the change that was asked for.
  if(permit.method==='PUT'){
   const op=body.operation;
   if(!op||permit.action!==op.action||permit.target!==body.target||permit.expectedSha!==op.expectedSha||permit.message!==`Email banner ${op.action}: ${body.target}`&&!(op.action==='campaign'&&permit.message===`Email banner campaign: ${body.target}`))return res.status(403).json({error:'invalid_permission'});
   if(op.action==='campaign'){
    let fields;try{fields=campaignFields(op.fields);}catch{return res.status(403).json({error:'invalid_permission'});}
    if(permit.path!==`/contents/${CAMPAIGN_FILE}`||JSON.stringify(permit.fields)!==JSON.stringify(fields))return res.status(403).json({error:'invalid_permission'});
   }else if(op.action==='publish'){
    if(permit.path!==`/contents/${file}`||typeof body.write?.content!=='string'||permit.content!==body.write.content)return res.status(403).json({error:'invalid_permission'});
   }else if(op.action==='restore'){
    if(permit.path!==`/contents/${file}`||permit.revision!==op.revision||permit.content!==undefined)return res.status(403).json({error:'invalid_permission'});
   }else return res.status(403).json({error:'invalid_permission'});
  }
  if(!process.env.GITHUB_TOKEN)return res.status(503).json({error:'publisher_not_connected'});
  async function github(path,options={}){
   const response=await fetch(REPO+path,{...options,redirect:'error',signal:AbortSignal.timeout(15000),headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'HCFM-Insights',Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,'Content-Type':'application/json'}});
   if(!response.ok)throw Object.assign(Error('Publisher request failed'),{status:response.status});return boundedJson(response,2*1024*1024);
  }
  if(permit.method==='GET')return res.status(200).json(await github(permit.path));
  if(permit.action==='campaign'){
   if(permit.target!==body.target)return res.status(403).json({error:'invalid_permission'});
   const manifest=await github(`/contents/${CAMPAIGN_FILE}?ref=main`);
   if(manifest.sha!==permit.expectedSha)return res.status(409).json({error:'campaign_changed_reload'});
   const content=encodeManifest(writeCampaign(decodeManifest(manifest.content),permit.target,permit.fields));
   return res.status(200).json(await github(permit.path,{method:'PUT',body:JSON.stringify({message:permit.message,content,sha:manifest.sha,branch:'main'})}));
  }
  let content=permit.content;
  if(permit.action==='restore'){
   // Restore only bytes from a revision belonging to this ministry's own banner.
   const revisions=await github(history);
   if(!Array.isArray(revisions)||!revisions.some(row=>row.sha===permit.revision))return res.status(400).json({error:'revision_not_in_history'});
   content=(await github(`/contents/${file}?ref=${permit.revision}`)).content?.replace(/\s/g,'');
  }
  if(typeof content!=='string'||content.length>350000)return res.status(400).json({error:'invalid_image'});
  return res.status(200).json(await github(permit.path,{method:'PUT',body:JSON.stringify({message:permit.message,content,sha:permit.expectedSha,branch:'main'})}));
 }catch(error){return res.status([400,401,403,404,409,422].includes(error.status)?error.status:502).json({error:'publisher_request_failed'});}
}
