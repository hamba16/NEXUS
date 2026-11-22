import {DIRECTIVES}from'../../../app/data/seed.js';
export type WheelItem={id:string;number:number;title:string;status:'green'|'amber'|'red'|'none';score:number|null};
export function directiveWheelItems():WheelItem[]{return DIRECTIVES.map((d:any)=>({id:d.id,number:d.seq,title:d.title,status:d.rag==='GREEN'?'green':d.rag==='AMBER'?'amber':d.rag==='RED'?'red':'none',score:typeof d.completion==='number'?d.completion:null}))}
