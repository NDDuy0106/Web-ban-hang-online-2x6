"use client";
import Link from "next/link";
import {Heart,LoaderCircle} from "lucide-react";
import {ProductCard} from "@/components/product-card";
import {useWishlist} from "@/components/wishlist";
export function WishlistPage(){const {items,loading}=useWishlist();return <div className="container"><div className="page-head"><Link href="/">Trang chủ</Link> / Sản phẩm yêu thích</div><section className="section wishlist-page"><div className="section-heading"><h1>Sản phẩm yêu thích</h1><span className="muted">{loading?"Đang tải…":`${items.length} sản phẩm`}</span></div>{loading?<div className="empty-state"><LoaderCircle size={30} className="wishlist-spinner"/><p>Đang tải danh sách yêu thích…</p></div>:items.length?<div className="product-grid">{items.map(item=><ProductCard key={item.id} product={item.product}/>)}</div>:<div className="empty-state"><Heart size={38} style={{margin:"0 auto 12px",color:"var(--brand)"}}/><h2>Chưa có sản phẩm yêu thích</h2><p className="muted">Lưu những sản phẩm bạn muốn xem lại khi mua sắm.</p><Link href="/san-pham" className="hero-cta">Khám phá sản phẩm</Link></div>}</section></div>;}
