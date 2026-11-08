"use client";
import {useRouter} from "next/navigation";
export function SignOutButton(){const router=useRouter();return <button className="btn-orange" style={{marginTop:24}} onClick={async()=>{await fetch("/api/auth",{method:"DELETE"});router.push("/tai-khoan");router.refresh();}}>Đăng xuất</button>}
