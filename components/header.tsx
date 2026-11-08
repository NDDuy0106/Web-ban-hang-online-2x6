"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {Menu,Search,ShoppingBag,UserRound,ChevronDown,X,Trash2} from "lucide-react";
import {useCartStore} from "@/store/cart";
import {money} from "@/lib/utils";
type HeaderUser={id:string;email:string;fullName:string};
export function Header(){
const [open,setOpen]=useState(false),[cartOpen,setCartOpen]=useState(false),[user,setUser]=useState<HeaderUser|null>(null);
const pathname=usePathname(),router=useRouter();
useEffect(()=>{
 let active=true;
 const loadUser=async()=>{
  try{const response=await fetch("/api/auth",{cache:"no-store"});const data=await response.json();if(active)setUser(response.ok?(data.user??null):null);}
  catch{if(active)setUser(null);}
 };
 void loadUser();
 const onAuthChanged=()=>{void loadUser();};
 window.addEventListener("sixnature:auth-changed",onAuthChanged);
 return ()=>{active=false;window.removeEventListener("sixnature:auth-changed",onAuthChanged);};
},[pathname]);
async function handleSignOut(){
 try{
  const response=await fetch("/api/auth",{method:"DELETE"});
  if(!response.ok)throw new Error("Không thể đăng xuất.");
  setUser(null);
  window.dispatchEvent(new Event("sixnature:auth-changed"));
  router.push("/tai-khoan");
  router.refresh();
 }catch(error){console.error("SIGN_OUT_ERROR",error);}
}
const items=useCartStore(s=>s.items),remove=useCartStore(s=>s.removeItem);const count=items.reduce((n,i)=>n+i.quantity,0),subtotal=items.reduce((n,i)=>n+(i.product.salePrice??i.product.price)*i.quantity,0);return <><header className="top-header"><div className="container header-inner"><Link href="/" className="logo">Sixnature<small>BEAUTY & SKINCARE</small></Link><div className="header-search"><form action="/san-pham" className="search-row"><input name="q" placeholder="Nhập từ khóa cần tìm..." aria-label="Tìm sản phẩm"/><select name="category" defaultValue=""><option value="">Tất cả danh mục</option><option>Chăm sóc da mặt</option><option>Trang điểm</option><option>Chăm sóc tóc</option><option>Chăm sóc cơ thể</option><option>Nước hoa</option></select><button className="btn-orange"><Search size={15}/> Tìm kiếm</button></form><p className="suggestion"><b>Gợi ý từ khóa:</b> Serum, chống nắng, dưỡng ẩm, son môi, nước hoa...</p></div><div className="header-actions"><div className="mini-cart-wrap"><button className="header-action" onClick={()=>setCartOpen(v=>!v)} aria-expanded={cartOpen} aria-label="Mở giỏ hàng"><span className="action-icon"><ShoppingBag size={20}/></span><span className="action-copy"><strong>Giỏ hàng</strong><small>{count} sản phẩm</small></span></button>{cartOpen&&<div className="mini-cart"><div className="mini-cart-title"><b>Giỏ hàng của bạn</b><button onClick={()=>setCartOpen(false)} aria-label="Đóng"><X size={15}/></button></div>{items.length?items.slice(0,4).map(i=><div className="mini-cart-item" key={i.product.id+i.variant}><img src={i.product.image} alt={i.product.name}/><div><Link href={`/san-pham/${i.product.slug}`} onClick={()=>setCartOpen(false)}>{i.product.name}</Link><small>{i.quantity} × {money(i.product.salePrice??i.product.price)}</small></div><button onClick={()=>remove(i.product.id,i.variant)} aria-label="Xóa"><Trash2 size={14}/></button></div>):<p className="muted">Giỏ hàng đang trống.</p>}<div className="mini-cart-total">Tạm tính <b>{money(subtotal)}</b></div><Link href="/gio-hang" onClick={()=>setCartOpen(false)} className="mini-cart-cta">Xem giỏ hàng</Link></div>}</div>{user?<><Link href="/tai-khoan/thong-tin" className="header-action"><span className="action-icon"><UserRound size={20}/></span><span className="action-copy"><strong>{user.fullName}</strong><small>{user.email}</small></span></Link><button type="button" onClick={handleSignOut} aria-label="Đăng xuất" title="Đăng xuất" style={{border:0,background:"transparent",color:"inherit",cursor:"pointer",fontSize:12,padding:"6px"}}>Đăng xuất</button></>:<Link href="/tai-khoan" className="header-action"><span className="action-icon"><UserRound size={20}/></span><span className="action-copy"><strong>Tài khoản</strong><small>Đăng nhập</small></span></Link>}</div></div></header><button className="mobile-menu" aria-expanded={open} onClick={()=>setOpen(!open)}><Menu size={19}/> DANH MỤC & ĐIỀU HƯỚNG <ChevronDown size={15}/></button><nav className={`main-nav ${open?"open":""}`}><div className="container nav-inner">{[["TRANG CHỦ","/"],["SẢN PHẨM","/san-pham"],["CHĂM SÓC DA","/san-pham?category=Chăm%20sóc%20da%20mặt"],["TRANG ĐIỂM","/san-pham?category=Trang%20điểm"],["CHĂM SÓC TÓC","/san-pham?category=Chăm%20sóc%20tóc"],["ƯU ĐÃI","/san-pham?sort=discount"],["GIỚI THIỆU","/gioi-thieu"],["LIÊN HỆ","/lien-he"]].map(([label,href])=><Link key={href} className="nav-link" href={href} onClick={()=>setOpen(false)}>{label}</Link>)}</div></nav></>}