import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth";
import {SignOutButton} from "./sign-out";
export default async function AccountInfo(){const user=await getSession();if(!user)redirect("/tai-khoan");return <div className="container" style={{paddingTop:40,paddingBottom:70}}><p className="page-head">Trang chủ / Tài khoản</p><h1 style={{font:"30px Georgia"}}>Xin chào, {user.fullName}</h1><p style={{marginTop:12}}>Email: {user.email}</p><p style={{color:"#777",marginTop:8}}>Bạn đã đăng nhập thành công vào tài khoản Sixnature.</p><SignOutButton/></div>}
