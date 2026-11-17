import {test} from 'node:test';
import assert from 'node:assert/strict';
import {invitationUrl,invitationEmail,sendInvitation} from '../supabase/functions/table-household/invitation.mjs';
const token='a'.repeat(64);
test('invitation contains a fixed-origin household link and no signup auto-login token',()=>{
 assert.equal(invitationUrl(token),'https://www.un-make.com/table/app/login?invite='+token);
 const email=invitationEmail(token);assert.ok(email.html.includes('Accept invitation'));assert.ok(email.text.includes('seven days'));assert.ok(email.html.includes(invitationUrl(token)));
 assert.throws(()=>invitationUrl('javascript:alert(1)'));
});
test('mail is sent only to the invited address with a private backend key',async()=>{
 let calls=0;const result=await sendInvitation('server-key','guest@example.com',token,async(url,init)=>{
 calls++;assert.equal(url,'https://api.resend.com/emails');assert.equal(init.headers.Authorization,'Bearer server-key');
 const body=JSON.parse(init.body);assert.deepEqual(body.to,['guest@example.com']);assert.equal(body.from,'Unmake Studio <tricia@un-make.com>');assert.ok(!body.html.includes('server-key'));
 return Response.json({id:'accepted-email'});
 });assert.deepEqual(result,{sent:true});assert.equal(calls,1);
});
test('missing configuration and rejected or timed-out mail never report success',async()=>{
 assert.deepEqual(await sendInvitation('', 'guest@example.com',token,()=>{throw Error('must not call')}),{sent:false});
 assert.deepEqual(await sendInvitation('key','guest@example.com',token,async()=>new Response('',{status:403})),{sent:false});
 assert.deepEqual(await sendInvitation('key','guest@example.com',token,async()=>{throw Error('network')}),{sent:false});
 assert.deepEqual(await sendInvitation('key','guest@example.com',token,async()=>Response.json({})),{sent:false});
});
