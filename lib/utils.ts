export const money=(n:number)=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(n);
export const discountPercent=(price:number,sale?:number)=>sale?Math.round((1-sale/price)*100):0;
export function safeJson<T>(value:string,fallback:T):T{try{return JSON.parse(value) as T;}catch{return fallback;}}