import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const runtime="nodejs";

export async function DELETE(_req:Request,{params}:{params:Promise<{productId:string}>}){
  const session=await getSession();
  if(!session)return NextResponse.json({error:"Vui lòng đăng nhập để sử dụng danh sách yêu thích."},{status:401});

  const {productId}=await params;
  if(!productId.trim())return NextResponse.json({error:"Sản phẩm không hợp lệ."},{status:400});

  try{
    const deleted=await prisma.wishlistItem.deleteMany({where:{userId:session.id,productId}});
    if(!deleted.count)return NextResponse.json({error:"Sản phẩm không có trong danh sách yêu thích."},{status:404});
    return new NextResponse(null,{status:204});
  }catch(error){
    console.error("WISHLIST_DELETE_ERROR",error);
    return NextResponse.json({error:"Không thể xóa sản phẩm yêu thích."},{status:500});
  }
}
