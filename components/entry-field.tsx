'use client';
export function EntryField({label,value,onChange,multiline=false,required=false,maxLength,list,placeholder}:{label:string;value:string;onChange:(value:string)=>void;multiline?:boolean;required?:boolean;maxLength?:number;list?:string;placeholder?:string}){
 return <label>{label}{multiline?<textarea value={value} onChange={e=>onChange(e.target.value)} required={required} maxLength={maxLength}/>:<input value={value} onChange={e=>onChange(e.target.value)} required={required} maxLength={maxLength} list={list} placeholder={placeholder}/>}</label>
}
