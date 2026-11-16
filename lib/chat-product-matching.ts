import type {Product} from "./catalog";
import {normalize} from "./product-recommendations";

export function findMentionedProducts(answer:string,products:Product[]):Product[]{
  const normalizedAnswer=` ${normalize(answer)} `;
  const seen=new Set<string>();
  return products.filter(product=>{
    if(seen.has(product.id))return false;
    const name=normalize(product.name);
    if(!name||!normalizedAnswer.includes(` ${name} `))return false;
    seen.add(product.id);
    return true;
  });
}
