import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getProductBySlug,getProducts} from "@/lib/products";
import {ProductDetailClient} from "@/components/product-detail-client";
import {ProductCard} from "@/components/product-card";
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params,p=await getProductBySlug(slug);return p?{title:p.name,description:p.description,openGraph:{title:p.name,description:p.description,images:[p.image]}}:{title:"Không tìm thấy sản phẩm"};}
export default async function ProductPage({params}:Props){const {slug}=await params,p=await getProductBySlug(slug);if(!p)notFound();const related=(await getProducts()).filter(x=>x.id!==p.id&&(x.category===p.category||x.brand===p.brand)).slice(0,4);return <div className="container"><div className="page-head"><Link href="/">Trang chủ</Link> / <Link href="/san-pham">Sản phẩm</Link> / {p.name}</div><ProductDetailClient product={p}/>{related.length>0&&<section className="section"><div className="section-heading"><h2>Sản phẩm liên quan</h2></div><div className="product-grid">{related.map(x=><ProductCard key={x.id} product={x}/>)}</div></section>}</div>}