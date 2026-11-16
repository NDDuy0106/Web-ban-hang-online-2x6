import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {getSession} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {mapProduct} from "@/lib/products";

export const runtime="nodejs";

const createWishlistSchema=z.object({productId:z.string().trim().min(1).max(100)});

function unauthorized(){
  return NextResponse.json({error:"Vui lòng đăng nhập để sử dụng danh sách yêu thích."},{status:401});
}

export async function GET(){
  const session=await getSession();
  if(!session)return unauthorized();

  try{
    const items=await prisma.wishlistItem.findMany({
      where:{userId:session.id},
      orderBy:{createdAt:"desc"},
      include:{product:true}
    });
    return NextResponse.json({items:items.map(item=>({
      id:item.id,
      createdAt:item.createdAt,
      product:mapProduct(item.product)
    }))},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    console.error("WISHLIST_GET_ERROR",error);
    return NextResponse.json({error:"Không thể tải danh sách yêu thích."},{status:500});
  }
}

export async function POST(req:NextRequest){
  const session=await getSession();
  if(!session)return unauthorized();

  let body:unknown;
  try{body=await req.json();}
  catch{return NextResponse.json({error:"Dữ liệu gửi lên không hợp lệ."},{status:400});}

  const parsed=createWishlistSchema.safeParse(body);
  if(!parsed.success){
    return NextResponse.json({error:"Sản phẩm không hợp lệ."},{status:400});
  }

  try{
    const product=await prisma.product.findUnique({where:{id:parsed.data.productId}});
    if(!product)return NextResponse.json({error:"Sản phẩm không tồn tại."},{status:404});

    const item=await prisma.wishlistItem.upsert({
      where:{userId_productId:{userId:session.id,productId:product.id}},
      update:{},
      create:{userId:session.id,productId:product.id},
      include:{product:true}
    });
    return NextResponse.json({item:{id:item.id,createdAt:item.createdAt,product:mapProduct(item.product)}},{status:201});
  }catch(error){
    console.error("WISHLIST_CREATE_ERROR",error);
    return NextResponse.json({error:"Không thể lưu sản phẩm yêu thích."},{status:500});
  }
}
