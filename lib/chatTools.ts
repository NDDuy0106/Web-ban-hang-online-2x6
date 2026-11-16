import {getProducts,getProductById} from "@/lib/products";
import {policy,type Product} from "@/lib/catalog";
import {rankProducts} from "@/lib/product-recommendations";
import {buildRoutine} from "@/lib/routine-recommendations";

type Args=Record<string,unknown>;
const str=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)?v:undefined;

export async function runChatTool(name:string,args:Args):Promise<{text:string;products:Product[]}>{
  if(name==="searchProducts"){
    const all=await getProducts();
    const ranked=rankProducts(all,{
      query:str(args.query),
      category:str(args.category),
      skinType:str(args.skinType),
      concern:str(args.concern),
      minPrice:num(args.minPrice),
      maxPrice:num(args.maxPrice),
      brand:str(args.brand)
    });
    const result=ranked.map(({product,matchScore,matchReasons})=>({
      id:product.id,slug:product.slug,name:product.name,brand:product.brand,category:product.category,
      price:product.salePrice??product.price,stock:product.stock,skinTypes:product.skinTypes,concerns:product.concerns,
      description:product.description,ingredients:product.ingredients,howTo:product.howTo,volume:product.volume,
      variants:product.variants,tags:product.tags,matchScore,matchReasons
    }));
    return {text:JSON.stringify({note:"Match score reflects catalog text and requested filters, not medical suitability or treatment efficacy.",recommendations:result}),products:ranked.map(item=>item.product)};
  }
  if(name==="getProductDetail"||name==="checkStock"){
    const p=await getProductById(str(args.id));
    if(!p)return {text:"Không tìm thấy sản phẩm.",products:[]};
    return {text:name==="checkStock"?JSON.stringify({id:p.id,name:p.name,stock:p.stock,available:p.stock>0}):JSON.stringify(p),products:[p]};
  }
  if(name==="getStorePolicy"){
    const key=str(args.topic) as keyof typeof policy;
    return {text:policy[key]??"Vui lòng liên hệ cửa hàng.",products:[]};
  }
  if(name==="buildRoutine"){
    const routine=buildRoutine(await getProducts(),{skinType:str(args.skinType),concern:str(args.concern),budget:num(args.budget),timeOfDay:str(args.timeOfDay)});
    return {text:JSON.stringify(routine.data),products:routine.products};
  }
  return {text:"Công cụ không được hỗ trợ.",products:[]};
}
