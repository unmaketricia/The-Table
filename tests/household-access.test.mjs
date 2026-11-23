import {test} from 'node:test';
import assert from 'node:assert/strict';
import {invitationSignup} from '../supabase/functions/table-household/signup.mjs';
import {householdContacts,leaveHousehold} from '../supabase/functions/table-household/operations.mjs';
const token='b'.repeat(64),base='https://example.supabase.co',password='A secure password 123!';
function validLookup(url){
 if(url.includes('/table_invitations?'))return Response.json([{email:'invited@example.com',household_id:'home-a'}]);
 if(url.includes('/table_households?'))return Response.json([{id:'home-a'}]);
 throw Error('Unexpected URL: '+url);
}
test('invitation signup rejects invalid or expired tokens before creating any account',async()=>{
 let called=false;const invalid=await invitationSignup({action:'register',token:'bad'},base,'secret',async()=>{called=true});
 assert.equal(invalid.status,400);assert.equal(called,false);
 const expired=await invitationSignup({action:'register',token,password,confirmation:password},base,'secret',async()=>Response.json([]));
 assert.equal(expired.status,410);
});
test('invitation preview only returns its recipient and never creates an account',async()=>{
 const result=await invitationSignup({action:'preview',token},base,'secret',async(url,init)=>{assert.equal(init.method,undefined);return validLookup(url)});
 assert.deepEqual(result,{status:200,data:{email:'invited@example.com'}});
});
test('new account uses the invitation recipient, ignoring client-supplied email',async()=>{
 let creates=0;const result=await invitationSignup({action:'register',token,email:'attacker@example.com',password,confirmation:password},base,'secret',async(url,init)=>{
 if(url.endsWith('/auth/v1/admin/users')){
  creates++;assert.equal(init.method,'POST');const body=JSON.parse(init.body);assert.equal(body.email,'invited@example.com');assert.equal(body.email_confirm,true);return Response.json({id:'new-user'});
 }return validLookup(url);
 });assert.equal(result.status,200);assert.equal(creates,1);
});
test('existing accounts cannot have passwords overwritten through an invitation',async()=>{
 const result=await invitationSignup({action:'register',token,password,confirmation:password},base,'secret',async(url,init)=>{
 if(url.endsWith('/auth/v1/admin/users')){assert.equal(init.method,'POST');return Response.json({code:'email_exists',msg:'A user with this email address has already been registered'},{status:422})}
 return validLookup(url);
 });assert.equal(result.status,409);assert.equal(result.data.accountExists,true);
});
test('weak or mismatched passwords do not create an account',async()=>{
 for(const body of [{password:'short',confirmation:'short'},{password,confirmation:'mismatch'}]){
 const result=await invitationSignup({action:'register',token,...body},base,'secret',async url=>validLookup(url));assert.equal(result.status,400);
 }
});
test('owner sees actual member emails only from their scoped account',async()=>{
 const result=await householdContacts(base,'secret',{id:'owner'},{householdId:'home-a',members:[{userId:'member-a'}]},async url=>{
 if(url.includes('/table_households?'))return Response.json([{owner_id:'owner'}]);
 if(url.endsWith('/users/owner'))return Response.json({email:'owner@example.com'});
 if(url.endsWith('/users/member-a'))return Response.json({email:'member@example.com'});
 throw Error('Unexpected request');
 });assert.deepEqual(result,{ownerEmail:'owner@example.com',members:[{userId:'member-a',email:'member@example.com'}]});
});
test('member sees owner email, and an unrelated user is denied',async()=>{
 let allowed=true;
 const fetcher=async url=>{
 if(url.includes('/table_households?'))return Response.json([{owner_id:'owner'}]);
 if(url.includes('/table_members?'))return Response.json(allowed?[{user_id:'member-a'}]:[]);
 if(url.endsWith('/users/owner'))return Response.json({email:'owner@example.com'});
 throw Error('Unexpected contact request');
 };
 const result=await householdContacts(base,'secret',{id:'member-a'},{householdId:'home-a',members:[{userId:'other-member'}]},fetcher);
 assert.deepEqual(result,{ownerEmail:'owner@example.com',members:[]});
 allowed=false;await assert.rejects(()=>householdContacts(base,'secret',{id:'outsider'},{householdId:'home-a'},fetcher),/Not a household member/);
});
test('leaving removes only the verified actor membership, never household data',async()=>{
 let calls=0;assert.equal(await leaveHousehold(base,'secret','member-a',async(url,init)=>{
 calls++;assert.equal(url,base+'/rest/v1/table_members?user_id=eq.member-a');assert.equal(init.method,'DELETE');assert.equal(init.body,undefined);return new Response(null,{status:204});
 }),true);assert.equal(calls,1);
});
