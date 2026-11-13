import type {Product} from "@/lib/catalog";

export type ProductSearchCriteria={
  query?:string;
  category?:string;
  skinType?:string;
  concern?:string;
  minPrice?:number;
  maxPrice?:number;
  brand?:string;
};

export type RankedProduct={
  product:Product;
  matchScore:number;
  matchReasons:string[];
};

const stopWords=new Set(["minh","toi","ban","voi","cho","mot","nhung","cac","nao","gi","la","co","va","hay","nen","muon","tim","mua","su","dung","loai","san","pham","giup","tu","van","ve","da","cua","tren","web","website","sixnature"]);
const aliases:Record<string,string[]>={
  "mun":["mun","mun an","mun dau den","mun viem"],
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

export function normalize(value:string){
  return value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9]+/g," ").trim();
}

function words(value:string){return normalize(value).split(/\s+/).filter(Boolean);}

export function searchTerms(value:string){
  const normalized=normalize(value);
  const phrases=Object.keys(aliases).filter(key=>key.includes(" ")&&normalized.includes(key));
  const covered=new Set(phrases.flatMap(key=>key.split(" ")));
  return [...phrases,...words(normalized).filter(term=>!covered.has(term)&&!stopWords.has(term))];
}

function termsMatching(terms:string[],haystack:string){
  const normalized=` ${normalize(haystack)} `;
  return terms.filter(term=>(aliases[term]??[term]).some(alias=>normalized.includes(` ${normalize(alias)} `))).length;
}

export function overlapScore(terms:string[],haystack:string){
  if(!terms.length)return 0;
  return termsMatching(terms,haystack);
}

export function skinMatches(product:Product,skin:string){
  if(!skin)return 0;
  const wanted=normalize(skin);
  return product.skinTypes.some(type=>normalize(type)===wanted||wanted.includes(normalize(type)))?4:
    product.skinTypes.some(type=>normalize(type)==="moi loai da")?2:0;
}

function categoryMatches(product:Product,category:string){
  if(!category)return true;
  const wanted=normalize(category),actual=normalize(product.category);
  const groups:[RegExp,string][]=[
    [/skincare|cham soc da|duong da/,"cham soc da mat"],
    [/makeup|trang diem/,"trang diem"],
    [/hair|toc/,"cham soc toc"],
    [/body|co the/,"cham soc co the"],
    [/perfume|nuoc hoa/,"nuoc hoa"]
  ];
  return actual.includes(wanted)||groups.some(([pattern,target])=>pattern.test(wanted)&&actual===target);
}

function productText(product:Product){
  return [product.name,product.brand,product.category,product.description,product.ingredients,product.howTo,product.skinTypes.join(" "),product.concerns.join(" "),product.tags.join(" ")].join(" ");
}

export function rankProducts(products:Product[],criteria:ProductSearchCriteria,limit=3):RankedProduct[]{
  const queryTerms=searchTerms(criteria.query??"");
  const concernTerms=searchTerms(criteria.concern??"");
  const requestedSkin=criteria.skinType?.trim()??"";
  const requestedCategory=criteria.category?.trim()??"";
  const requestedBrand=normalize(criteria.brand??"");
  const hasMinPrice=typeof criteria.minPrice==="number"&&Number.isFinite(criteria.minPrice);
  const hasMaxPrice=typeof criteria.maxPrice==="number"&&Number.isFinite(criteria.maxPrice);
  const minPrice=hasMinPrice?criteria.minPrice!:0;
  const maxPrice=hasMaxPrice?criteria.maxPrice!:Number.MAX_SAFE_INTEGER;

  if(!queryTerms.length&&!concernTerms.length&&!requestedSkin&&!requestedCategory&&!requestedBrand&&!hasMinPrice&&!hasMaxPrice)return [];

  const ranked=products.flatMap(product=>{
    const price=product.salePrice??product.price;
    if(product.stock<=0||price<minPrice||price>maxPrice)return [];
    if(requestedBrand&&!normalize(product.brand).includes(requestedBrand))return [];
    if(!categoryMatches(product,requestedCategory))return [];
    const skinScore=skinMatches(product,requestedSkin);
    if(requestedSkin&&!skinScore)return [];

    const text=productText(product);
    const queryMatches=termsMatching(queryTerms,text);
    const concernMatches=termsMatching(concernTerms,[product.concerns.join(" "),product.description,product.ingredients,product.tags.join(" ")].join(" "));
    if((queryTerms.length||concernTerms.length)&&!queryMatches&&!concernMatches)return [];

    const dimensions:{weight:number;score:number}[]=[];
    const matchReasons=["in_stock"];
    if(queryTerms.length){
      dimensions.push({weight:35,score:queryMatches/queryTerms.length});
      if(queryMatches)matchReasons.push("need_match");
    }
    if(concernTerms.length){
      dimensions.push({weight:35,score:concernMatches/concernTerms.length});
      if(concernMatches)matchReasons.push("concern_match");
    }
    if(requestedSkin){
      dimensions.push({weight:20,score:skinScore===4?1:.5});
      matchReasons.push(skinScore===4?"skin_type_match":"all_skin_types");
    }
    if(hasMaxPrice){
      dimensions.push({weight:10,score:1});
      matchReasons.push("within_budget");
    }
    if(requestedCategory)dimensions.push({weight:15,score:1});
    if(requestedBrand)dimensions.push({weight:5,score:1});
    const totalWeight=dimensions.reduce((total,dimension)=>total+dimension.weight,0);
    const matchScore=Math.round(dimensions.reduce((total,dimension)=>total+dimension.weight*dimension.score,0)/totalWeight*100);
    return [{product,matchScore,matchReasons}];
  });

  return ranked
    .sort((a,b)=>b.matchScore-a.matchScore||(a.product.salePrice??a.product.price)-(b.product.salePrice??b.product.price)||b.product.rating-a.product.rating)
    .slice(0,Math.max(0,limit));
}
