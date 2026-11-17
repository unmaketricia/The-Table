'use client';
import {createContext,useContext} from 'react';
import {defaultSettings,type Settings} from './settings';
export const HouseholdContext=createContext<{workspace:{settings:Settings};ready:boolean;demo:boolean;openAccount:()=>void;addMenu:(name:string)=>Promise<string|null>}>({workspace:{settings:defaultSettings},ready:false,demo:false,openAccount:()=>{},addMenu:async()=>null});
export const useHousehold=()=>useContext(HouseholdContext);
