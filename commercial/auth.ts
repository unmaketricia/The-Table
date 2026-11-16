'use client';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {authConfig} from './auth-config';
import {rememberedStorage} from '@/lib/auth-storage';
let client:SupabaseClient|null=null;
export function authClient(){
 const url=authConfig.url,key=authConfig.publishableKey;
 if(!url||!key)return null;
 return client??=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:rememberedStorage(window.localStorage)}});
}
export const loginProviders={google:process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED==='true',facebook:process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_ENABLED==='true'};
export const MAX_HOUSEHOLD_USERS=4;
export const MAX_ADDITIONAL_MEMBERS=3;
