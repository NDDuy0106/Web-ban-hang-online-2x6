import assert from "node:assert/strict";
import test from "node:test";

const baseUrl=process.env.WISHLIST_TEST_BASE_URL||"http://localhost:3000";
const productId=process.env.WISHLIST_TEST_PRODUCT_ID;
const userA={email:process.env.WISHLIST_TEST_USER_A_EMAIL,password:process.env.WISHLIST_TEST_USER_A_PASSWORD};
const userB={email:process.env.WISHLIST_TEST_USER_B_EMAIL,password:process.env.WISHLIST_TEST_USER_B_PASSWORD};
const configured=Boolean(productId&&userA.email&&userA.password&&userB.email&&userB.password&&process.env.WISHLIST_TEST_RUN==="1");

function cookieFrom(response:Response){
  const raw=response.headers.get("set-cookie")||"";
  const match=raw.match(/sixnature_session=([^;]+)/);
  assert.ok(match,"Expected authentication cookie");
  return `sixnature_session=${match[1]}`;
}

async function registerOrLogin(user:{email?:string;password?:string}){
  assert.ok(user.email&&user.password);
  const register=await fetch(`${baseUrl}/api/auth`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"register",fullName:"Wishlist Test User",email:user.email,password:user.password})});
  if(register.status!==201&&register.status!==200&&register.status!==409)assert.fail(`Could not register test user: ${register.status}`);
  const login=await fetch(`${baseUrl}/api/auth`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",email:user.email,password:user.password})});
  assert.equal(login.status,200);
  return cookieFrom(login);
}

test("Wishlist API supports isolation, duplicate protection, CRUD, and guest rejection",{skip:!configured?"Set WISHLIST_TEST_RUN=1, product ID, and two test user credentials to run API integration tests.":false},async()=>{
  const cookieA=await registerOrLogin(userA);
  const cookieB=await registerOrLogin(userB);
  const jsonHeaders={"Content-Type":"application/json"};

  const guest=await fetch(`${baseUrl}/api/wishlist`);
  assert.equal(guest.status,401);
  const guestCreate=await fetch(`${baseUrl}/api/wishlist`,{method:"POST",headers:jsonHeaders,body:JSON.stringify({productId})});
  assert.equal(guestCreate.status,401);

  const first=await fetch(`${baseUrl}/api/wishlist`,{method:"POST",headers:{...jsonHeaders,cookie:cookieA},body:JSON.stringify({productId})});
  assert.equal(first.status,201);
  const missing=await fetch(`${baseUrl}/api/wishlist`,{method:"POST",headers:{...jsonHeaders,cookie:cookieA},body:JSON.stringify({productId:"missing-product-id"})});
  assert.equal(missing.status,404);
  const duplicate=await fetch(`${baseUrl}/api/wishlist`,{method:"POST",headers:{...jsonHeaders,cookie:cookieA},body:JSON.stringify({productId})});
  assert.equal(duplicate.status,201);

  const listA=await fetch(`${baseUrl}/api/wishlist`,{headers:{cookie:cookieA}});
  assert.equal(listA.status,200);
  const itemsA=await listA.json() as {items:Array<{product:{id:string}}>};
  assert.equal(itemsA.items.filter(item=>item.product.id===productId).length,1);

  const listB=await fetch(`${baseUrl}/api/wishlist`,{headers:{cookie:cookieB}});
  assert.equal(listB.status,200);
  const itemsB=await listB.json() as {items:Array<{product:{id:string}}>};
  assert.equal(itemsB.items.some(item=>item.product.id===productId),false);

  const forbiddenDelete=await fetch(`${baseUrl}/api/wishlist/${productId}`,{method:"DELETE",headers:{cookie:cookieB}});
  assert.equal(forbiddenDelete.status,404);
  const deleted=await fetch(`${baseUrl}/api/wishlist/${productId}`,{method:"DELETE",headers:{cookie:cookieA}});
  assert.equal(deleted.status,204);
  const afterDelete=await fetch(`${baseUrl}/api/wishlist`,{headers:{cookie:cookieA}});
  const itemsAfterDelete=await afterDelete.json() as {items:Array<{product:{id:string}}>};
  assert.equal(itemsAfterDelete.items.some(item=>item.product.id===productId),false);
});
