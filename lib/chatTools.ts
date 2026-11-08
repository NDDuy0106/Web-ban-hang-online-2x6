import {getProducts,getProductById} from "@/lib/products";
import {policy,type Product} from "@/lib/catalog";

type Args=Record<string,unknown>;
const str=(v:unknown)=>typeof v==="string"?v:"";
const num=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)?v:undefined;
const norm=(v:string)=>v.toLocaleLowerCase("vi").normalize("NFC").trim();

export async function runChatTool(name:string,args:Args):Promise<{text:string;products:Product[]}>{
  if(name==="searchProducts"){
    const all=await getProducts();
    const q=norm(str(args.query)),tokens=q.split(/\\s+/).filter(Boolean);
    const cat=norm(str(args.category)),skin=str(args.skinType),concern=norm(str(args.concern)),brand=norm(str(args.brand));
    const min=num(args.minPrice)??0,max=num(args.maxPrice)??Number.MAX_SAFE_INTEGER;
    const found=all.filter(p=>{
      const searchable=norm([p.name,p.brand,p.category,p.description,p.ingredients,p.concerns.join(" "),p.tags.join(" ")].join(" "));
      return (!tokens.length||tokens.every(token=>searchable.includes(token)))&&
        (!cat||norm(p.category).includes(cat))&&
        (!skin||p.skinTypes.includes(skin as Product["skinTypes"][number]))&&
        (!concern||norm(p.concerns.join(" ")).includes(concern))&&
        (!brand||norm(p.brand).includes(brand))&&
        (p.salePrice??p.price)>=min&&(p.salePrice??p.price)<=max;
    }).sort((a,b)=>Number(b.stock>0)-Number(a.stock>0)).slice(0,6);
    return {text:JSON.stringify(found.map(p=>({id:p.id,name:p.name,brand:p.brand,category:p.category,price:p.salePrice??p.price,stock:p.stock,skinTypes:p.skinTypes,concerns:p.concerns,description:p.description,ingredients:p.ingredients,howTo:p.howTo}))),products:found};
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
    const all=await getProducts(),skin=str(args.skinType),concern=norm(str(args.concern));
    const budget=num(args.budget)??Number.MAX_SAFE_INTEGER;
    const time=norm(str(args.timeOfDay));
    const stages=[
      {key:"cleanser",label:"Làm sạch",match:(p:Product)=>/sữa rửa mặt|gel rửa mặt|cleanser/i.test(p.name)},
      {key:"toner",label:"Cân bằng (không bắt buộc)",match:(p:Product)=>/toner/i.test(p.name)},
      {key:"serum",label:"Sản phẩm đặc trị/hỗ trợ",match:(p:Product)=>/serum/i.test(p.name)},
      {key:"moisturizer",label:"Dưỡng ẩm",match:(p:Product)=>/kem dưỡng|sữa dưỡng/i.test(p.name)},
      {key:"sunscreen",label:"Chống nắng",match:(p:Product)=>/chống nắng|sunscreen/i.test(p.name)}
    ];
    const eligible=all.filter(p=>p.stock>0&&(p.skinTypes.includes(skin as Product["skinTypes"][number])||p.skinTypes.includes("Mọi loại da")));
    const picks=stages.map(stage=>{
      const candidates=eligible.filter(stage.match).map(p=>{
        const matched=concern?p.concerns.filter(c=>norm(c).includes(concern)||concern.includes(norm(c))).length:0;
        const price=p.salePrice??p.price;
        return {p,score:matched*4+(p.skinTypes.includes(skin as Product["skinTypes"][number])?2:0)+(p.rating>=4.8?1:0),price};
      }).filter(x=>x.price<=budget).sort((a,b)=>b.score-a.score||a.price-b.price);
      return {stage,candidate:candidates[0]};
    }).filter(x=>x.candidate);
    let remaining=budget;
    const selected=[];
    for(const item of picks){
      if(item.candidate!.price<=remaining){selected.push({step:selected.length+1,stage:item.stage.label,id:item.candidate!.p.id,name:item.candidate!.p.name,price:item.candidate!.price,stock:item.candidate!.p.stock});remaining-=item.candidate!.price;}
    }
    const total=selected.reduce((sum,p)=>sum+p.price,0);
    return {text:JSON.stringify({timeOfDay:time||"sáng và tối",skinType:skin,selected,total,budget,remaining,notes:"Đây là gợi ý tham khảo từ catalog và tồn kho hiện tại; không bắt buộc dùng đủ mọi bước. Dùng chống nắng vào ban ngày."}),products:selected.map(s=>all.find(p=>p.id===s.id)!).filter(Boolean)};
  }
  return {text:"Công cụ không được hỗ trợ.",products:[]};
}
