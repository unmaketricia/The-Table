'use client';
import {createContext,useContext} from 'react';
import {defaultSettings,type Settings} from './settings';
export const HouseholdContext=createContext<{workspace:{settings:Settings};ready:boolean;demo:boolean;openAccount:()=>void;addMenu:(name:string)=>Promise<string|null>;editMealTimes:(id:string)=>void;removeMenu:(id:string)=>Promise<boolean>;choosePalette:(accent:string,surface:string)=>Promise<boolean>}>({workspace:{settings:defaultSettings},ready:false,demo:false,openAccount:()=>{},addMenu:async()=>null,editMealTimes:()=>{},removeMenu:async()=>false,choosePalette:async()=>false});
export const useHousehold=()=>useContext(HouseholdContext);
