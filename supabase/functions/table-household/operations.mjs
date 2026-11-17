
export async function householdContacts(url,service,user,account,fetcher=fetch){
 const headers={apikey:service,Authorization:'Bearer '+service};
 if(!account?.householdId)return {ownerEmail:null,members:[]};
 // householdId and member IDs must come from the authenticated table_account RPC.
 const householdResponse=await fetcher(url+'/rest/v1/table_households?select=owner_id&id=eq.'+encodeURIComponent(account.householdId)+'&limit=1',{headers});
 if(!householdResponse.ok)throw Error('Unable to load household');
 const household=(await householdResponse.json())[0];
 if(!household)return {ownerEmail:null,members:[]};
 const isOwner=household.owner_id===user.id;
 if(!isOwner){
  const membership=await fetcher(url+'/rest/v1/table_members?select=user_id&household_id=eq.'+encodeURIComponent(account.householdId)+'&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1',{headers});
  if(!membership.ok||!(await membership.json()).length)throw Error('Not a household member');
 }
 const emailFor=async(id)=>{
  const response=await fetcher(url+'/auth/v1/admin/users/'+encodeURIComponent(id),{headers});
  if(!response.ok)throw Error('Unable to load household email');
  const data=await response.json();return data.email||data.user?.email||null;
 };
 const ownerEmail=await emailFor(household.owner_id);
 const members=isOwner?await Promise.all((account.members||[]).map(async m=>({userId:m.userId,email:await emailFor(m.userId)}))):[];
 return {ownerEmail,members};
}
export async function leaveHousehold(url,service,userId,fetcher=fetch){
 // The actor is the verified session user; the client cannot choose a target.
 const response=await fetcher(url+'/rest/v1/table_members?user_id=eq.'+encodeURIComponent(userId),{method:'DELETE',headers:{apikey:service,Authorization:'Bearer '+service}});
 return response.ok;
}
