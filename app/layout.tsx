import type {Metadata} from "next";
import "./globals.css";
import "./shop.css";
import "./shop-responsive.css";
import "./shop-fixes.css";
import {Header} from "@/components/header";
import {Footer} from "@/components/footer";
import {ChatWidget} from "@/components/chat-widget";
import {ToastHost} from "@/components/toast-host";
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"),title:{default:"Sixnature | Mỹ phẩm chăm sóc sắc đẹp",template:"%s | Sixnature"},description:"Khám phá mỹ phẩm chăm sóc da, trang điểm, tóc và cơ thể tại Sixnature.",openGraph:{title:"Sixnature",description:"Nâng niu vẻ đẹp tự nhiên của bạn",type:"website",locale:"vi_VN"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body><Header/><main>{children}</main><Footer/><ChatWidget/><ToastHost/></body></html>}