import {currentUser} from '../../../../lib/auth';
export async function GET(){
  try{return Response.json({user:await currentUser()},{headers:{'Cache-Control':'no-store'}});}
  catch(error){console.error(error);return Response.json({error:'Unable to check your session.'},{status:503});}
}
