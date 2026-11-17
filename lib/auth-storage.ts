export const REMEMBER_DAYS=30;
const lifetime=REMEMBER_DAYS*24*60*60*1000;
type Saved={value:string;expiresAt:number;sessionId:string};
function identity(value:string){try{const token=JSON.parse(value).access_token as string;return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).session_id as string}catch{return ''}}
export function rememberedStorage(storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>,now=()=>Date.now()){
 function read(key:string):Saved|null{try{const value=JSON.parse(storage.getItem(key)||'null') as Saved|null;if(value&&typeof value.value==='string'&&typeof value.expiresAt==='number'&&value.expiresAt>now())return value;storage.removeItem(key);return null}catch{storage.removeItem(key);return null}}
 return {getItem(key:string){return read(key)?.value??null},setItem(key:string,value:string){const previous=read(key),sessionId=identity(value);const expiresAt=previous&&sessionId&&previous.sessionId===sessionId?previous.expiresAt:now()+lifetime;storage.setItem(key,JSON.stringify({value,expiresAt,sessionId}))},removeItem(key:string){storage.removeItem(key)}};
}
