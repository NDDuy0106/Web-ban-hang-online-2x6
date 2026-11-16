"use client";

import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Heart,LoaderCircle} from "lucide-react";
import type {Product} from "@/lib/catalog";

export type WishlistItem={id:string;createdAt:string;product:Product};
type WishlistContextValue={items:WishlistItem[];loading:boolean;authenticated:boolean|null;pendingProductId:string|null;toggle:(product:Product)=>Promise<void>;isSaved:(productId:string)=>boolean};
const WishlistContext=createContext<WishlistContextValue|null>(null);
function notify(message:string){if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("sixnature:toast",{detail:{message}}));}

export function WishlistProvider({children}:{children:React.ReactNode}){
  const [items,setItems]=useState<WishlistItem[]>([]),[loading,setLoading]=useState(true),[authenticated,setAuthenticated]=useState<boolean|null>(null),[pendingProductId,setPendingProductId]=useState<string|null>(null);
  const router=useRouter();
  const reloadRef=useRef<(() => void)|null>(null);
  const handleAuthChanged=useCallback(()=>{setLoading(true);reloadRef.current?.();},[]);
  useEffect(()=>{
    let activeController:AbortController|null=null;
    const load=async()=>{
      activeController?.abort();
      const controller=new AbortController();
      activeController=controller;
      try{
        const response=await fetch("/api/wishlist",{cache:"no-store",signal:controller.signal});
        if(controller.signal.aborted)return;
        if(response.status===401){setAuthenticated(false);setItems([]);return;}
        const data=await response.json() as {items?:WishlistItem[];error?:string};
        if(!response.ok)throw new Error(data.error||"Không thể tải danh sách yêu thích.");
        if(controller.signal.aborted)return;
        setItems(data.items??[]);
        setAuthenticated(true);
      }catch(error){
        if(controller.signal.aborted||(error instanceof Error&&error.name==="AbortError"))return;
        setAuthenticated(null);
        notify(error instanceof Error?error.message:"Không thể tải danh sách yêu thích.");
      }finally{
        if(activeController===controller){
          activeController=null;
          setLoading(false);
        }
      }
    };
    reloadRef.current=()=>{void load();};
    void load();
    window.addEventListener("sixnature:auth-changed",handleAuthChanged);
    return()=>{
      window.removeEventListener("sixnature:auth-changed",handleAuthChanged);
      reloadRef.current=null;
      activeController?.abort();
    };
  },[handleAuthChanged]);
  const toggle=useCallback(async(product:Product)=>{if(authenticated!==true){if(authenticated===false){notify("Vui lòng đăng nhập để lưu sản phẩm yêu thích.");router.push("/tai-khoan");}return;}const saved=items.some(item=>item.product.id===product.id);setPendingProductId(product.id);try{const response=saved?await fetch(`/api/wishlist/${encodeURIComponent(product.id)}`,{method:"DELETE"}):await fetch("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:product.id})});const data=await response.json().catch(()=>({})) as {item?:WishlistItem;error?:string};if(!response.ok)throw new Error(data.error||"Không thể cập nhật danh sách yêu thích.");if(saved){setItems(current=>current.filter(item=>item.product.id!==product.id));notify("Đã xóa sản phẩm khỏi danh sách yêu thích.");}else if (data.item) {
  const newItem = data.item;

  setItems(current =>
    current.some(item => item.product.id === product.id)
      ? current
      : [newItem, ...current]
  );

  notify("Đã lưu sản phẩm vào danh sách yêu thích.");
}
}catch(error){notify(error instanceof Error?error.message:"Không thể cập nhật danh sách yêu thích.");}finally{setPendingProductId(null);}},[authenticated,items,router]);
  const value=useMemo<WishlistContextValue>(()=>({items,loading,authenticated,pendingProductId,toggle,isSaved:productId=>items.some(item=>item.product.id===productId)}),[items,loading,authenticated,pendingProductId,toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
export function useWishlist(){const context=useContext(WishlistContext);if(!context)throw new Error("useWishlist must be used inside WishlistProvider");return context;}
export function WishlistButton({product}:{product:Product}){const {authenticated,loading,pendingProductId,toggle,isSaved}=useWishlist();const saved=isSaved(product.id),pending=pendingProductId===product.id;return <button type="button" className={`wishlist-button${saved?" saved":""}`} onClick={event=>{event.preventDefault();event.stopPropagation();void toggle(product);}} disabled={loading||pending} aria-label={saved?"Xóa khỏi danh sách yêu thích":"Thêm vào danh sách yêu thích"} aria-pressed={saved} title={authenticated===false?"Đăng nhập để lưu yêu thích":saved?"Xóa khỏi yêu thích":"Thêm vào yêu thích"}>{pending?<LoaderCircle size={18} className="wishlist-spinner"/>:<Heart size={18} fill={saved?"currentColor":"none"}/>}</button>;}
