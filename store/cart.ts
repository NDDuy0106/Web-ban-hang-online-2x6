"use client";
import {create} from "zustand";
import {persist,createJSONStorage} from "zustand/middleware";
import type {Product} from "@/lib/catalog";
export type CartItem={product:Product;quantity:number;variant?:string};
type CartState={items:CartItem[];addItem:(product:Product,variant?:string)=>void;setQuantity:(id:string,quantity:number)=>void;removeItem:(id:string,variant?:string)=>void;clear:()=>void};
export const useCartStore=create<CartState>()(persist((set,get)=>({items:[],addItem:(product,variant)=>{const found=get().items.find(i=>i.product.id===product.id&&i.variant===variant);set({items:found?get().items.map(i=>i===found?{...i,quantity:Math.min(i.quantity+1,product.stock)}:i):[...get().items,{product,quantity:1,variant}].slice(-30)});},setQuantity:(id,quantity)=>set({items:get().items.map(i=>i.product.id===id?{...i,quantity:Math.max(1,Math.min(quantity,i.product.stock))}:i)}),removeItem:(id,variant)=>set({items:get().items.filter(i=>!(i.product.id===id&&i.variant===variant))}),clear:()=>set({items:[]})}),{name:"moc-nhien-cart",storage:createJSONStorage(()=>localStorage)}));