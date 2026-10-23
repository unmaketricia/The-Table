export function moveGrocery(order:readonly string[],item:string,direction:-1|1){const next=[...order],from=next.indexOf(item),to=from+direction;if(from<0||to<0||to>=next.length)return next;[next[from],next[to]]=[next[to],next[from]];return next;}
export function placeGrocery(order:readonly string[],item:string,target:string,after:boolean){if(item===target||!order.includes(item)||!order.includes(target))return [...order];const next=order.filter(id=>id!==item);next.splice(next.indexOf(target)+(after?1:0),0,item);return next;}

// Stable partition preserves manual order within both groups.
export function prioritizeGroceries<T extends {important?:boolean}>(items:readonly T[]):T[]{
 return [...items.filter(item=>item.important),...items.filter(item=>!item.important)];
}
