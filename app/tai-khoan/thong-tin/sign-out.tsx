"use client";
import {useRouter} from "next/navigation";
export function SignOutButton(){
 const router=useRouter();
 return <button className="btn-orange" style={{marginTop:24}} onClick={async()=>{
  try{
   const response=await fetch("/api/auth",{method:"DELETE"});
   if(!response.ok)throw new Error("Không thể đăng xuất.");
   window.dispatchEvent(new Event("sixnature:auth-changed"));
   router.push("/tai-khoan");
   router.refresh();
  }catch(error){console.error("SIGN_OUT_ERROR",error);}
 }}>Đăng xuất</button>;
}
