// Only these three fields in the selected ministry block may change.
export const CAMPAIGN_FILE='email-banners/campaigns.yml';
export function campaignFields(value){
 if(!value||Object.keys(value).some(key=>!['destination','campaign','end_date'].includes(key)))throw Error('Invalid fields');
 const {destination,campaign,end_date}=value;
 if(typeof destination!=='string'||destination.length>2048||/[\r\n\s'"#]/.test(destination))throw Error('Invalid destination');
 const url=new URL(destination);if(url.protocol!=='https:'||url.username||url.password)throw Error('Invalid destination');
 if(typeof campaign!=='string'||campaign.length>120||! /^[a-z0-9]+(-[a-z0-9]+)*$/.test(campaign))throw Error('Invalid campaign');
 if(typeof end_date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(end_date)||!Number.isFinite(Date.parse(end_date))||new Date(end_date).toISOString().slice(0,10)!==end_date)throw Error('Invalid date');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(end_date<today)throw Error('Past date');
 return {destination,campaign,end_date};
}
export function readCampaign(text,target){
 const block=text.match(new RegExp(`^${target}:\\r?\\n(?:[ \\t].*(?:\\r?\\n|$))*`,'m'))?.[0];if(!block)throw Error('Missing ministry');
 const result={};for(const field of ['destination','campaign','end_date']){const value=block.match(new RegExp(`^[ \\t]+${field}:[ \\t]*(.*)$`,'m'))?.[1];if(value===undefined)throw Error('Missing field');result[field]=value.trim().replace(/^['"]|['"]$/g,'');}return result;
}
export function writeCampaign(text,target,fields){
 const clean=campaignFields(fields);readCampaign(text,target);
 const pattern=new RegExp(`^${target}:\\r?\\n(?:[ \\t].*(?:\\r?\\n|$))*`,'m');
 return text.replace(pattern,block=>{for(const [key,value] of Object.entries(clean))block=block.replace(new RegExp(`^([ \\t]+${key}:[ \\t]*).*`,'m'),(_,prefix)=>prefix+value);return block;});
}
export const decodeManifest=content=>new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g,'')),c=>c.charCodeAt(0)));
export const encodeManifest=text=>btoa(String.fromCharCode(...new TextEncoder().encode(text)));
export async function campaignHash(target,expectedSha,fields){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([target,expectedSha,fields])))),b=>b.toString(16).padStart(2,'0')).join('');}
