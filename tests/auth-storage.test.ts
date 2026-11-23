import test from 'node:test';
import assert from 'node:assert/strict';
import {persistentAuthStorage} from '../lib/auth-storage.ts';
function browserStorage() {
  const values = new Map<string,string>();
  return {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);},removeItem:(key:string)=>{values.delete(key);}};
}
const key='sb-project-auth-token';
const session=JSON.stringify({access_token:'access',refresh_token:'refresh',expires_at:3600});
test('old remembered sessions migrate without losing the refresh token',()=>{
  const disk=browserStorage();disk.setItem(key,JSON.stringify({value:session,expiresAt:Date.now()+10000,sessionId:'session'}));
  const storage=persistentAuthStorage(disk);
  assert.equal(storage.getItem(key),session);
  assert.equal(disk.getItem(key),session);
});
test('the old app deadline does not discard a session that Supabase may still refresh',()=>{
  const disk=browserStorage();disk.setItem(key,JSON.stringify({value:session,expiresAt:1,sessionId:'session'}));
  assert.equal(persistentAuthStorage(disk).getItem(key),session);
});
test('sessions persist across adapter recreation without an extra deadline',()=>{
  const disk=browserStorage();persistentAuthStorage(disk).setItem(key,session);
  assert.equal(persistentAuthStorage(disk).getItem(key),session);
  assert.equal(disk.getItem(key),session);
});
test('refreshed tokens replace old tokens and sign-out removes the saved session',()=>{
  const disk=browserStorage(),storage=persistentAuthStorage(disk);
  storage.setItem(key,session);
  const refreshed=JSON.stringify({access_token:'new-access',refresh_token:'new-refresh'});
  storage.setItem(key,refreshed);
  assert.equal(storage.getItem(key),refreshed);
  storage.removeItem(key);
  assert.equal(persistentAuthStorage(disk).getItem(key),null);
});
test('auxiliary SDK values remain intact',()=>{
  const disk=browserStorage(),storage=persistentAuthStorage(disk);
  storage.setItem('code-verifier','a-plain-sdk-value');
  assert.equal(storage.getItem('code-verifier'),'a-plain-sdk-value');
});
