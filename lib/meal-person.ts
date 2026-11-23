type Meal={id:string;kind:string;profileId?:unknown;slotId?:unknown;child?:unknown;date?:unknown;favoriteTemplate?:unknown};
export function mealPerson(value:unknown){return typeof value==='string'?value.trim().toLocaleLowerCase('en-US'):'';}
export function mealConflict<T extends Meal>(entries:readonly T[],item:T){
 if(item.kind!=='meal'||item.favoriteTemplate)return undefined;
 const menu=item.profileId||'main';
 return entries.find(e=>e.kind==='meal'&&!e.favoriteTemplate&&e.id!==item.id&&(e.profileId||'main')===menu&&(e.slotId||'dinner')===(item.slotId||'dinner')&&e.date===item.date&&(menu==='main'||mealPerson(e.child)===mealPerson(item.child)));
}
