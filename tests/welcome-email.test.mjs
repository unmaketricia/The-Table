import {test} from 'node:test';
import assert from 'node:assert/strict';
import {welcomeEmail,sendWelcome,dispatchWelcomes} from '../supabase/functions/table-paddle/welcome.mjs';
test('welcome includes checkout email, app link, and both phone installation guides',()=>{
 const email=welcomeEmail('buyer@example.com');
 for(const phrase of ['https://www.un-make.com/table/app','buyer@example.com','same email address','Create account','iPhone (Safari)','Android (Chrome)','Add to Home Screen','Install app'])assert.ok(email.text.includes(phrase),phrase);
 assert.ok(!welcomeEmail('<script>@example.com').html.includes('<script>'));
});
test('welcome is addressed individually with a stable delivery idempotency key',async()=>{
 let request;const id=await sendWelcome('key','buyer@example.com','delivery-1',async(url,options)=>{request={url,options};return new Response(JSON.stringify({id:'accepted'}))});
 assert.equal(id,'accepted');assert.equal(request.options.headers['Idempotency-Key'],'table-welcome-delivery-1');
 const body=JSON.parse(request.options.body);assert.deepEqual(body.to,['buyer@example.com']);assert.equal(body.from,'Unmake Studio <tricia@un-make.com>');
});
test('provider failure never marks an email as sent',async()=>{
 let marked=false;await assert.rejects(()=>dispatchWelcomes(async(name)=>{if(name==='table_welcome_sent')marked=true;return [{email:'buyer@example.com',delivery_key:'j'}]},'key',async()=>{throw Error('failed')}));assert.equal(marked,false);
 await assert.rejects(()=>sendWelcome('', 'buyer@example.com','j'));
 await assert.rejects(()=>sendWelcome('key','buyer@example.com','j',async()=>new Response('{}',{status:403})));
});
test('provider acceptance is recorded and an empty queue sends nothing',async()=>{
 const calls=[];assert.deepEqual(await dispatchWelcomes(async(name,body)=>{calls.push({name,body});return name==='table_welcome_queue'?[{email:'buyer@example.com',delivery_key:'j'}]:null},'key',async()=> 'provider-1'),{sent:1});
 assert.equal(calls[1].body.p_message_id,'provider-1');assert.deepEqual(await dispatchWelcomes(async()=>[],'key',async()=>{throw Error('should not send')}),{sent:0});
});
