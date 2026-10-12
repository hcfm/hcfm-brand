import {CAMPAIGN_FILE,writeCampaign,decodeManifest,encodeManifest} from '../lib/banner-campaign.js';
// This route runs beside the existing publisher in the organisation's Vercel project.
// Insights verifies the person, office and saved change before Vercel uses its credential.
const APP='https://app.hcfm-weekly.pages.dev';
const REPO='https://api.github.com/repos/hcfm/hcfm-brand';
const TARGETS={eastern:['parent','family-rosary','catholic-mom','peyton-institute'],ftp:['ftp','catholic-central']};
export const config={api:{bodyParser:{sizeLimit:'500kb'}}};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1];
 if(!token||token.length>16000)return res.status(403).json({error:'not_authorized'});
 const body=req.body;
 if(!body||!TARGETS[body.office]?.includes(body.target))return res.status(400).json({error:'invalid_target'});
 try{
  const permission=await fetch(`${APP}/api/staff-tools/banner-relay-approval`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Cookie:`CF_Authorization=${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!permission.ok||!permission.headers.get('content-type')?.includes('application/json'))return res.status(403).json({error:'not_authorized'});
  const permit=await permission.json(),file=`email-banners/${body.target}/banner.png`;
  const current=`/contents/${file}?ref=main`,history=`/commits?path=${encodeURIComponent(file)}&sha=main&per_page=20`;
  const validRead=permit.path===`/contents/${CAMPAIGN_FILE}?ref=main`||permit.path===current||permit.path===history||(/^\/[a-z]/.test(permit.path||'')&&/^[a-f0-9]{40}$/.test(body.operation?.revision||'')&&permit.path===`/contents/${file}?ref=${body.operation.revision}`);
  if(!((permit.method==='GET'&&validRead)||(permit.method==='PUT'&&(permit.path===`/contents/${file}`||permit.action==='campaign'&&permit.path===`/contents/${CAMPAIGN_FILE}`))))return res.status(403).json({error:'invalid_permission'});
  if(!process.env.GITHUB_TOKEN)return res.status(503).json({error:'publisher_not_connected'});
  async function github(path,options={}){
   const response=await fetch(REPO+path,{...options,redirect:'error',signal:AbortSignal.timeout(15000),headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'HCFM-Insights',Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,'Content-Type':'application/json'}});
   if(!response.ok)throw Object.assign(Error('Publisher request failed'),{status:response.status});return response.json();
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
