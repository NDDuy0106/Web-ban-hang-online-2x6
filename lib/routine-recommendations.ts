import type {Product} from "./catalog";
import {normalize,overlapScore,searchTerms,skinMatches} from "./product-recommendations";

type RoutineOptions={skinType:string;concern?:string;budget?:number;timeOfDay?:string};
type RoutineSelection={step:number;stage:string;id:string;name:string;price:number;stock:number};

export function buildRoutine(products:Product[],options:RoutineOptions){
  const skin=options.skinType.trim(),concern=normalize(options.concern??"");
  const budget=options.budget??Number.MAX_SAFE_INTEGER;
  const time=normalize(options.timeOfDay??"");
  const evening=/toi|evening|dem/.test(time),morning=/sang|morning|day/.test(time);
  const eveningOnly=evening&&!morning,morningOnly=morning&&!evening;
  const stages=[
    {label:"Làm sạch",weight:3,match:(p:Product)=>/sua rua mat|gel rua mat|cleanser/.test(normalize(p.name+" "+p.category))},
    {label:"Cân bằng (không bắt buộc)",weight:.5,match:(p:Product)=>/toner|nuoc can bang/.test(normalize(p.name+" "+p.category))},
    {label:"Serum hỗ trợ mục tiêu da",weight:2,match:(p:Product)=>/serum/.test(normalize(p.name+" "+p.category))&&(!morningOnly||!/bha|salicylic acid/.test(normalize(p.name+" "+p.ingredients)))},
    {label:"Dưỡng ẩm",weight:3,match:(p:Product)=>/kem duong|sua duong|moisturizer/.test(normalize(p.name+" "+p.category))},
    {label:"Chống nắng (buổi sáng)",weight:3,match:(p:Product)=>/chong nang|sunscreen|spf/.test(normalize(p.name+" "+p.category))&&!eveningOnly}
  ];
  const eligible=products.filter(p=>normalize(p.category)==="cham soc da mat"&&p.stock>0&&skinMatches(p,skin)>0);
  const optionsByStage=stages.map(stage=>({stage,items:eligible.filter(stage.match).map(p=>{
    const concernScore=overlapScore(searchTerms(concern),[p.concerns.join(" "),p.description,p.ingredients].join(" "));
    const score=stage.weight+concernScore*2+skinMatches(p,skin)+(p.rating>=4.8?.5:0);
    return {product:p,score,price:p.salePrice??p.price};
  }).sort((a,b)=>b.score-a.score||a.price-b.price).slice(0,4)}));
  let best:{items:{stage:string;product:Product;price:number}[];score:number;total:number}={items:[],score:-1,total:0};
  const walk=(index:number,chosen:{stage:string;product:Product;price:number}[],score:number,total:number)=>{
    if(total>budget)return;
    if(index===optionsByStage.length){if(score>best.score||(score===best.score&&total<best.total))best={items:[...chosen],score,total};return;}
    walk(index+1,chosen,score,total);
    const group=optionsByStage[index];
    for(const option of group.items)walk(index+1,[...chosen,{stage:group.stage.label,product:option.product,price:option.price}],score+option.score,total+option.price);
  };
  walk(0,[],0,0);
  const selected:RoutineSelection[]=best.items.map((item,index)=>({step:index+1,stage:item.stage,id:item.product.id,name:item.product.name,price:item.price,stock:item.product.stock}));
  return {
    data:{timeOfDay:time||"sáng và tối",skinType:skin,selected,total:best.total,budget,remaining:budget===Number.MAX_SAFE_INTEGER?null:budget-best.total,notes:"Routine được chọn từ sản phẩm chăm sóc da mặt còn hàng và phù hợp loại da theo catalog. Toner là bước tùy chọn; nếu có BHA/Salicylic Acid, ưu tiên dùng buổi tối theo khả năng dung nạp. Dùng chống nắng vào ban ngày."},
    products:best.items.map(item=>item.product)
  };
}
