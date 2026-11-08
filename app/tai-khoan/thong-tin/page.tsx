import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth";
import {SignOutButton} from "./sign-out";
import {BeautyProfileForm} from "@/components/beauty-profile-form";
export default async function AccountInfo(){const user=await getSession();if(!user)redirect("/tai-khoan");return <div className="container" style={{paddingTop:40,paddingBottom:70,maxWidth:850}}><p className="page-head">Trang chủ / Tài khoản</p><h1 style={{font:"30px Georgia"}}>Xin chào, {user.fullName}</h1><p style={{marginTop:12}}>Email: {user.email}</p><p style={{color:"#777",marginTop:8}}>Quản lý tài khoản và hồ sơ tư vấn làm đẹp của bạn tại Sixnature.</p><BeautyProfileForm/><SignOutButton/></div>}
