import { BadRequestException } from '@nestjs/common';
const variablePattern=/{{\s*([a-z_]+\.[a-z_]+)\s*}}/g;
export function renderTemplate(input:string,variables:Record<string,string>){return input.replace(variablePattern,(_,key:string)=>{const value=variables[key];if(value===undefined)throw new BadRequestException(`Eksik e-posta değişkeni: ${key}`);return escapeHtml(value)})}
export function renderEmailBody(input:string,variables:Record<string,string>){
  const escaped=escapeHtml(input);
  return escaped
    .replace(variablePattern,(_,key:string)=>{const value=variables[key];if(value===undefined)throw new BadRequestException(`Eksik e-posta değişkeni: ${key}`);return escapeHtml(value)})
    .replace(/\r?\n/g,'<br>');
}
export function validateTemplate(input:string,allowed:Set<string>){for(const match of input.matchAll(variablePattern))if(!allowed.has(match[1]))throw new BadRequestException(`Desteklenmeyen e-posta değişkeni: ${match[1]}`);if(/<script|javascript:/i.test(input))throw new BadRequestException('E-posta şablonu güvenli olmayan HTML içeriyor.');}
function escapeHtml(v:string){return v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))}
export const emailVariables=new Set(['participant.first_name','participant.full_name','organization.name','event.name','event.start_date','event.start_datetime','event.start_time','event.end_date','event.end_time','event.location','event.public_url','event.participant_url','certificate.url']);
