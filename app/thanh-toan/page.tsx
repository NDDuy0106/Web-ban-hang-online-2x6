import type {Metadata} from "next";
import {CheckoutForm} from "@/components/checkout-form";
export const metadata:Metadata={title:"Thanh toán đơn hàng"};
export default async function CheckoutPage({searchParams}:{searchParams:Promise<{coupon?:string}>}){const {coupon}=await searchParams;return <div className="container"><div className="page-head">Trang chủ / Giỏ hàng / Thanh toán</div><h1 style={{font:"30px Georgia"}}>Thanh toán</h1><CheckoutForm initialCoupon={coupon??""}/></div>}