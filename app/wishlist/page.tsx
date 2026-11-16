import type {Metadata} from "next";
import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth";
import {WishlistPage} from "@/components/wishlist-page";
export const metadata:Metadata={title:"Sản phẩm yêu thích"};
export default async function WishlistRoute(){const session=await getSession();if(!session)redirect("/tai-khoan");return <WishlistPage/>;}
