import {getProducts,getProductById} from "@/lib/products";
import {policy,type Product} from "@/lib/catalog";

type Args=Record<string,unknown>;
const str=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)?v:undefined;
const normalize=(value:string)=>value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9]+/g," ").trim();
const words=(value:string)=>normalize(value).split(/\s+/).filter(Boolean);
function searchTerms(value:string){const normalized=normalize(value);const phrases=Object.keys(aliases).filter(key=>key.includes(" ")&&normalized.includes(key));const covered=new Set(phrases.flatMap(key=>key.split(" ")));return [...phrases,...words(normalized).filter(t=>!covered.has(t)&&!stopWords.has(t))];}
const stopWords=new Set(["minh","toi","ban","voi","cho","mot","nhung","cac","nao","gi","la","co","va","hay","nen","muon","tim","mua","su","dung","loai","san","pham","nao","giup","tu","van","ve","da","cua","tren","web","website","sixnature"]);
const aliases:Record<string,string[]>={
  "mun":["mun","mun an","mun dau den","mun viem","mụn"],
  "mun an":["mun","mun an","lo chan long","bha","salicylic acid"],
  "lo chan long":["lo chan long","dau thua","mun an","bha"],
  "dau thua":["dau thua","da dau","niacinamide","zinc"],
  "tham":["tham","tham mun","khong deu mau","vitamin c","niacinamide"],
  "cap am":["cap am","duong am","da kho","hyaluronic acid","glycerin"],
  "phuc hoi":["phuc hoi","da nhay cam","ceramide","panthenol","lam diu"],
  "nhay cam":["nhay cam","lam diu","phuc hoi","ceramide","panthenol"],
  "chong nang":["chong nang","spf","uv","bao ve da"],
  "lam sach":["lam sach","sua rua mat","cleanser","tay trang"],
  "toc kho":["toc kho","kho xo","duong toc","keratin","argan"],
  "duong the":["duong the","co the","body lotion","duong am co the"]
};
function overlapScore(terms:string[],haystack:string){
  if(!terms.length)return 0;
  const h=words(haystack);
  let score=0;
  for(const term of terms){
    const expanded=aliases[term]??[term];
    if(expanded.some(alias=>normalize(haystack).includes(normalize(alias))))score+=2;
    else if(h.some(word=>word.startsWith(term)||term.startsWith(word)))score+=1;
  }
  return score;
}
function skinMatches(p:Product,skin:string){
  if(!skin)return 0;
  const wanted=normalize(skin);
  return p.skinTypes.some(s=>normalize(s)===wanted||wanted.includes(normalize(s)))?4:p.skinTypes.some(s=>normalize(s)==="moi loai da")?2:0;
}
function categoryMatches(p:Product,category:string){
  if(!category)return true;
  const c=normalize(category),actual=normalize(p.category);
  const groups:[RegExp,string][]=[
    [/skincare|cham soc da|duong da/,"cham soc da mat"],
    [/makeup|trang diem/,"trang diem"],
    [/hair|toc/,"cham soc toc"],
    [/body|co the/,"cham soc co the"],
    [/perfume|nuoc hoa/,"nuoc hoa"]
  ];
  return actual.includes(c)||groups.some(([pattern,target])=>pattern.test(c)&&actual===target);
}
function productText(p:Product){return [p.name,p.brand,p.category,p.description,p.ingredients,p.howTo,p.skinTypes.join(" "),p.concerns.join(" "),p.tags.join(" ")].join(" ");}

export async function runChatTool(name:string,args:Args):Promise<{text:string;products:Product[]}>{
  if(name==="searchProducts"){
    const all=await getProducts();
    const query=normalize(str(args.query));
    const queryTerms=searchTerms(query);
    const category=str(args.category),skin=str(args.skinType),concern=str(args.concern),brand=normalize(str(args.brand));
    const min=num(args.minPrice)??0,max=num(args.maxPrice)??Number.MAX_SAFE_INTEGER;
    const candidates=all.filter(p=>{
      const price=p.salePrice??p.price;
      return price>=min&&price<=max&&(!brand||normalize(p.brand).includes(brand))&&categoryMatches(p,category);
    }).map(p=>{
      const haystack=productText(p),text=normalize(haystack);
      const phraseBonus=query&&text.includes(query)?5:0;
      const queryScore=overlapScore(queryTerms,haystack);
      const concernScore=overlapScore(searchTerms(concern),[p.concerns.join(" "),p.description,p.ingredients,p.tags.join(" ")].join(" "));
      const skinScore=skinMatches(p,skin);
      const stockScore=p.stock>0?2:-3;
      const brandScore=brand&&normalize(p.brand).includes(brand)?3:0;
      return {p,queryScore,concernScore,score:phraseBonus+queryScore+concernScore*2+skinScore+stockScore+brandScore};
    }).filter(x=>(!queryTerms.length||x.queryScore+x.concernScore*2>=Math.min(2,queryTerms.length))&&(!skin||skinMatches(x.p,skin)>0))
      .sort((a,b)=>b.score-a.score||(b.p.stock>0?1:0)-(a.p.stock>0?1:0)||(a.p.salePrice??a.p.price)-(b.p.salePrice??b.p.price))
      .slice(0,6).map(x=>x.p);
    return {text:JSON.stringify(candidates.map(p=>({id:p.id,slug:p.slug,name:p.name,brand:p.brand,category:p.category,price:p.salePrice??p.price,stock:p.stock,skinTypes:p.skinTypes,concerns:p.concerns,description:p.description,ingredients:p.ingredients,howTo:p.howTo,volume:p.volume,variants:p.variants,tags:p.tags}))),products:candidates};
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
