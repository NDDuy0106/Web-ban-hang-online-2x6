import {cookies} from "next/headers";
import {SignJWT,jwtVerify} from "jose";
const COOKIE="sixnature_session";
export function isAuthConfigured(){return typeof process.env.AUTH_SECRET==="string"&&process.env.AUTH_SECRET.length>=32;}
function secret(){const value=process.env.AUTH_SECRET;if(!value||value.length<32)throw new Error("AUTH_SECRET must contain at least 32 characters");return new TextEncoder().encode(value);}
export async function createSession(user:{id:string;email:string;fullName:string}){const token=await new SignJWT({email:user.email,name:user.fullName}).setProtectedHeader({alg:"HS256"}).setSubject(user.id).setIssuedAt().setExpirationTime("7d").sign(secret());const jar=await cookies();jar.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*7});}
export async function getSession(){try{const jar=await cookies();const token=jar.get(COOKIE)?.value;if(!token)return null;const {payload}=await jwtVerify(token,secret());if(!payload.sub)return null;return {id:payload.sub,email:String(payload.email??""),fullName:String(payload.name??"")};}catch{return null;}}
export async function clearSession(){const jar=await cookies();jar.delete(COOKIE);}
