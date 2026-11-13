import {getProducts,getProductById} from "@/lib/products";
import {policy,type Product} from "@/lib/catalog";
import {normalize,overlapScore,rankProducts,searchTerms,skinMatches} from "@/lib/product-recommendations";

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
    const all=await getProducts(),skin=str(args.skinType),concern=normalize(str(args.concern));
    const budget=num(args.budget)??Number.MAX_SAFE_INTEGER;
    const time=normalize(str(args.timeOfDay));
    const evening=/toi|evening|dem/.test(time),morning=/sang|morning|day/.test(time);
    const eveningOnly=evening&&!morning,morningOnly=morning&&!evening;
    const stages=[
      {key:"cleanser",label:"Làm sạch",weight:3,match:(p:Product)=>/sua rua mat|gel rua mat|cleanser/.test(normalize(p.name+" "+p.category))},
      {key:"toner",label:"Cân bằng (không bắt buộc)",weight:.5,match:(p:Product)=>/toner|nuoc can bang/.test(normalize(p.name+" "+p.category))},
      {key:"serum",label:"Serum hỗ trợ mục tiêu da",weight:2,match:(p:Product)=>/serum/.test(normalize(p.name+" "+p.category))&&(!morningOnly||!/bha|salicylic acid/.test(normalize(p.name+" "+p.ingredients)))},
      {key:"moisturizer",label:"Dưỡng ẩm",weight:3,match:(p:Product)=>/kem duong|sua duong|moisturizer/.test(normalize(p.name+" "+p.category))},
      {key:"sunscreen",label:"Chống nắng (buổi sáng)",weight:3,match:(p:Product)=>/chong nang|sunscreen|spf/.test(normalize(p.name+" "+p.category))&&!eveningOnly}
    ];
    const eligible=all.filter(p=>p.stock>0&&skinMatches(p,skin)>0);
    const options=stages.map(stage=>({stage,items:eligible.filter(stage.match).map(p=>{
      const concernScore=overlapScore(searchTerms(concern),[p.concerns.join(" "),p.description,p.ingredients].join(" "));
      const score=stage.weight+concernScore*2+skinMatches(p,skin)+(p.rating>=4.8?.5:0);
      return {p,score,price:p.salePrice??p.price};
    }).sort((a,b)=>b.score-a.score||a.price-b.price).slice(0,4)}));
    let best:{items:{stage:string;p:Product;price:number}[];score:number;total:number}={items:[],score:-1,total:0};
    const walk=(index:number,chosen:{stage:string;p:Product;price:number}[],score:number,total:number)=>{
      if(total>budget)return;
      if(index===options.length){if(score>best.score||(score===best.score&&total<best.total))best={items:[...chosen],score,total};return;}
      walk(index+1,chosen,score,total);
      const group=options[index];
      for(const option of group.items)walk(index+1,[...chosen,{stage:group.stage.label,p:option.p,price:option.price}],score+option.score,total+option.price);
    };
    walk(0,[],0,0);
    const selected=best.items.map((item,index)=>({step:index+1,stage:item.stage,id:item.p.id,name:item.p.name,price:item.price,stock:item.p.stock}));
    return {text:JSON.stringify({timeOfDay:time||"sáng và tối",skinType:skin,selected,total:best.total,budget,remaining:budget===Number.MAX_SAFE_INTEGER?null:budget-best.total,notes:"Routine được chọn từ sản phẩm còn hàng và phù hợp loại da theo catalog. Toner là bước tùy chọn; nếu có BHA/Salicylic Acid, ưu tiên dùng buổi tối theo khả năng dung nạp. Dùng chống nắng vào ban ngày."}),products:best.items.map(x=>x.p)};
  }
  return {text:"Công cụ không được hỗ trợ.",products:[]};
}
