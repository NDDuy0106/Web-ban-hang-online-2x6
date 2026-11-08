import {NextRequest,NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {clearSession,createSession} from "@/lib/auth";
const schema=z.object({action:z.enum(["register","login"]),fullName:z.string().trim().min(2).max(80).optional(),email:z.string().trim().email().max(160),password:z.string().min(8).max(72)});
export async function POST(req:NextRequest){let body:unknown;try{body=await req.json();}catch{return NextResponse.json({error:"Dữ liệu gửi lên không hợp lệ."},{status:400});}const parsed=schema.safeParse(body);if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Vui lòng kiểm tra thông tin."},{status:400});const data=parsed.data;try{if(data.action==="register"){if(!data.fullName)return NextResponse.json({error:"Vui lòng nhập họ tên."},{status:400});const exists=await prisma.user.findUnique({where:{email:data.email.toLowerCase()}});if(exists)return NextResponse.json({error:"Email này đã được đăng ký."},{status:409});const passwordHash=await bcrypt.hash(data.password,12);const user=await prisma.user.create({data:{fullName:data.fullName,email:data.email.toLowerCase(),passwordHash},select:{id:true,email:true,fullName:true}});await createSession(user);return NextResponse.json({success:true,user});}
const user=await prisma.user.findUnique({where:{email:data.email.toLowerCase()}});if(!user||!(await bcrypt.compare(data.password,user.passwordHash)))return NextResponse.json({error:"Email hoặc mật khẩu không chính xác."},{status:401});const safeUser={id:user.id,email:user.email,fullName:user.fullName};await createSession(safeUser);return NextResponse.json({success:true,user:safeUser});
}catch(error){console.error("AUTH_ERROR",error);return NextResponse.json({error:"Máy chủ chưa sẵn sàng. Kiểm tra cấu hình AUTH_SECRET và cơ sở dữ liệu."},{status:500});}}
export async function DELETE(){await clearSession();return NextResponse.json({success:true});}
