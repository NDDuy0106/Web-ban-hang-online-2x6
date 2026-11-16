import assert from "node:assert/strict";
import test from "node:test";
import type {Product} from "../lib/catalog";
import {appendToolArguments,toolCallFromStart} from "../lib/chat-stream";
import {findMentionedProducts} from "../lib/chat-product-matching";
import {rankProducts} from "../lib/product-recommendations";
import {buildRoutine} from "../lib/routine-recommendations";

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

test("maps aging concerns to matching catalog terminology",()=>{
  const antiAge=makeProduct({id:"anti-age",name:"Anti-aging care",concerns:["Fine lines"]});
  const acne=makeProduct({id:"acne",name:"Acne care",concerns:["Mụn"]});
  const ranked=rankProducts([acne,antiAge],{concern:"lão hóa"});
  assert.deepEqual(ranked.map(item=>item.product.id),["anti-age"]);
});

test("maps melasma concerns to pigment terminology",()=>{
  const pigment=makeProduct({id:"pigment",name:"Tone care",concerns:["Dark spots"]});
  const acne=makeProduct({id:"acne",name:"Acne care",concerns:["Mụn"]});
  const ranked=rankProducts([acne,pigment],{concern:"nám"});
  assert.deepEqual(ranked.map(item=>item.product.id),["pigment"]);
});

test("maps Vietnamese primer queries to makeup primer products",()=>{
  const primer=makeProduct({id:"primer",name:"Face primer",category:"Trang điểm",concerns:["Makeup base"]});
  const lipstick=makeProduct({id:"lipstick",name:"Lip color",category:"Trang điểm",concerns:["Trang điểm môi"]});
  const ranked=rankProducts([lipstick,primer],{query:"kem lót"});
  assert.deepEqual(ranked.map(item=>item.product.id),["primer"]);
});

test("only shows product cards whose full names appear in the final answer",()=>{
  const recommended=makeProduct({id:"recommended",name:"Serum Niacinamide cân bằng dầu"});
  const lookedUp=makeProduct({id:"looked-up",name:"Serum BHA chăm sóc lỗ chân lông"});
  const mentioned=findMentionedProducts("Mình gợi ý Serum Niacinamide cân bằng dầu cho nhu cầu của bạn.",[lookedUp,recommended]);
  assert.deepEqual(mentioned.map(product=>product.id),["recommended"]);
});

test("matches product names without accents and removes duplicate cards",()=>{
  const product=makeProduct({id:"primer",name:"Kem lót mịn màng"});
  const mentioned=findMentionedProducts("Ban co the thu kem lot min mang.",[product,product]);
  assert.deepEqual(mentioned.map(item=>item.id),["primer"]);
});

test("collects Gemini arguments_delta events into valid tool arguments",()=>{
  const call=toolCallFromStart({step:{type:"function_call",id:"call-1",name:"searchProducts",arguments:{}}});
  appendToolArguments(call,{type:"arguments_delta",arguments:'{"query":"son môi","maxPrice":300000}'});
  assert.deepEqual(JSON.parse(call?.arguments??"{}"),{query:"son môi",maxPrice:300000});
});

test("builds a morning routine only from facial skincare products",()=>{
  const cleanser=makeProduct({id:"cleanser",name:"Sữa rửa mặt dịu nhẹ",category:"Chăm sóc da mặt",price:200000});
  const moisturizer=makeProduct({id:"moisturizer",name:"Kem dưỡng ẩm",category:"Chăm sóc da mặt",price:250000});
  const sunscreen=makeProduct({id:"sunscreen",name:"Kem chống nắng SPF50",category:"Chăm sóc da mặt",price:250000});
  const bodyLotion=makeProduct({id:"body-lotion",name:"Sữa dưỡng thể",category:"Chăm sóc cơ thể",price:100000});
  const routine=buildRoutine([cleanser,moisturizer,sunscreen,bodyLotion],{skinType:"Da dầu",timeOfDay:"buổi sáng"});
  assert.deepEqual(routine.products.map(product=>product.id),["cleanser","moisturizer","sunscreen"]);
  assert.equal(routine.data.total,700000);
});

test("uses a facial moisturizer instead of body lotion within the routine budget",()=>{
  const cleanser=makeProduct({id:"cleanser",name:"Sữa rửa mặt dịu nhẹ",category:"Chăm sóc da mặt",price:219000});
  const moisturizer=makeProduct({id:"moisturizer",name:"Kem dưỡng Ceramide",category:"Chăm sóc da mặt",price:429000});
  const bodyLotion=makeProduct({id:"body-lotion",name:"Sữa dưỡng thể sữa gạo",category:"Chăm sóc cơ thể",price:239000});
  const routine=buildRoutine([cleanser,moisturizer,bodyLotion],{skinType:"Da dầu",budget:700000,timeOfDay:"buổi tối"});
  assert.deepEqual(routine.products.map(product=>product.id),["cleanser","moisturizer"]);
  assert.equal(routine.data.total,648000);
});
