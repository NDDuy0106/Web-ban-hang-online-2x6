import assert from "node:assert/strict";
import test from "node:test";
import type {Product} from "../lib/catalog";
import {rankProducts} from "../lib/product-recommendations";

function makeProduct(overrides:Partial<Product>={}):Product{
  return {
    id:"test-product",slug:"test-product",name:"Serum Niacinamide",brand:"Test brand",category:"Chăm sóc da mặt",
    price:300000,description:"Serum hỗ trợ chăm sóc da",ingredients:"Niacinamide",howTo:"Dùng theo hướng dẫn",
    volume:"30 ml",skinTypes:["Da dầu"],concerns:["Mụn","Thâm"],variants:["30 ml"],stock:10,pao:"6M",
    rating:4.5,reviews:[],tags:["serum"],image:"/test.jpg",...overrides
  };
}

test("ranks exact skin and concern matches above broad all-skin products",()=>{
  const exact=makeProduct({id:"exact",skinTypes:["Da dầu"],concerns:["Mụn"]});
  const broad=makeProduct({id:"broad",skinTypes:["Mọi loại da"],concerns:[],rating:5});
  const ranked=rankProducts([broad,exact],{query:"serum",skinType:"Da dầu",concern:"mụn"});
  assert.equal(ranked[0]?.product.id,"exact");
  assert.ok(ranked[0].matchScore>ranked[1].matchScore);
});

test("excludes out-of-stock and over-budget products",()=>{
  const inStock=makeProduct({id:"available",price:250000});
  const outOfStock=makeProduct({id:"out",stock:0,price:200000});
  const tooExpensive=makeProduct({id:"expensive",price:450000});
  const ranked=rankProducts([outOfStock,tooExpensive,inStock],{query:"serum",maxPrice:300000});
  assert.deepEqual(ranked.map(item=>item.product.id),["available"]);
});

test("returns at most three ranked recommendations",()=>{
  const products=Array.from({length:5},(_,index)=>makeProduct({
    id:`product-${index}`,slug:`product-${index}`,price:300000+index*1000
  }));
  const ranked=rankProducts(products,{query:"serum"});
  assert.equal(ranked.length,3);
  assert.ok(ranked[0].matchScore>=ranked[1].matchScore);
});

test("does not return unrelated products for an unmatched need",()=>{
  const ranked=rankProducts([makeProduct()],{query:"nước hoa"});
  assert.deepEqual(ranked,[]);
});

test("supports category synonyms while keeping category as a hard filter",()=>{
  const skincare=makeProduct({id:"skincare"});
  const makeup=makeProduct({id:"makeup",category:"Trang điểm"});
  const ranked=rankProducts([skincare,makeup],{query:"serum",category:"skincare"});
  assert.deepEqual(ranked.map(item=>item.product.id),["skincare"]);
});
