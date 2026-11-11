import {deleteSession,sameOrigin} from '../../../../lib/auth';
export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  try{await deleteSession();return Response.json({ok:true});}
  catch(error){console.error(error);return Response.json({error:'Unable to sign out right now.'},{status:503});}
}
