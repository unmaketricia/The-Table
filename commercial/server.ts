import {authConfig} from './auth-config';
export class BuyerError extends Error {constructor(message:string,public status=400){super(message)}}
export async function buyerIdentity(request:Request){
 const authorization=request.headers.get('authorization')||'';
 if(!authorization.startsWith('Bearer '))throw new BuyerError('Sign in first',401);
 const token=authorization.slice(7);
 const response=await fetch(authConfig.url+'/auth/v1/user',{headers:{apikey:authConfig.publishableKey,Authorization:authorization},cache:'no-store'});
 if(!response.ok)throw new BuyerError('Please sign in again',401);
 const user=await response.json();
 if(!user.email_confirmed_at)throw new BuyerError('Confirm your email before continuing',403);
 return {token,user};
}
export async function buyerRpc(token:string,name:string,args:Record<string,unknown>={}){
 const response=await fetch(authConfig.url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:authConfig.publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store'});
 if(!response.ok){const error=await response.json();throw new BuyerError(error.code==='40001'?'Your household has made another change. Please refresh and try again.':'Unable to access this household.',error.code==='40001'?409:403)}
 return response.status===204?null:response.json();
}
export function buyerFailure(error:unknown){
 return Response.json({error:error instanceof BuyerError?error.message:'Unable to complete this request. Please try again.'},{status:error instanceof BuyerError?error.status:503,headers:{'Cache-Control':'no-store'}});
}
