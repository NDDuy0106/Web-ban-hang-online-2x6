import type {Metadata} from "next";
import "./globals.css";
import "./shop.css";
import "./shop-responsive.css";
import {Header} from "@/components/header";
import {Footer} from "@/components/footer";
import {ChatWidget} from "@/components/chat-widget";
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"),title:{default:"Mộc Nhiên Beauty | Mỹ phẩm chăm sóc sắc đẹp",template:"%s | Mộc Nhiên Beauty"},description:"Khám phá mỹ phẩm chăm sóc da, trang điểm, tóc và cơ thể tại Mộc Nhiên Beauty.",openGraph:{title:"Mộc Nhiên Beauty",description:"Nâng niu vẻ đẹp tự nhiên của bạn",type:"website",locale:"vi_VN"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body><Header/><main>{children}</main><Footer/><ChatWidget/></body></html>}