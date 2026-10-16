export type DatedMeal={id:string;kind:string;date?:string;favoriteTemplate?:boolean};

// Keep record IDs and all dish details; only exchange the two calendar dates.
export function mealDateSwap<T extends DatedMeal>(entries:readonly T[],from:string,to:string):T[]{
 if(from===to||!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to))return [];
 const scheduled=(e:T)=>e.kind==='meal'&&!e.favoriteTemplate;
 if(!entries.some(e=>scheduled(e)&&e.date===from))return [];
 return entries.filter(e=>scheduled(e)&&(e.date===from||e.date===to)).map(e=>({...e,date:e.date===from?to:from}));
}
