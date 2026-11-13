import {NextRequest,NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {clearSession,createSession,getSession,isAuthConfigured} from "@/lib/auth";

export const runtime="nodejs";

const credentialsSchema=z.object({
  email:z.string().trim().email().max(160),
  password:z.string().min(8).max(72)
});
const schema=z.discriminatedUnion("action",[
  credentialsSchema.extend({
    action:z.literal("register"),
    fullName:z.string().trim().min(2,"Họ tên phải có ít nhất 2 ký tự.").max(80)
  }),
  credentialsSchema.extend({
    action:z.literal("login"),
    fullName:z.string().optional()
  })
]);

export async function GET(){
  try{
    const session=await getSession();
    if(!session)return NextResponse.json({user:null});
    const user=await prisma.user.findUnique({
      where:{id:session.id},
      select:{id:true,email:true,fullName:true}
    });
    if(!user){
      await clearSession();
      return NextResponse.json({user:null});
    }
    return NextResponse.json({user},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    console.error("AUTH_SESSION_READ_ERROR",error);
    return NextResponse.json({error:"Không thể kiểm tra trạng thái đăng nhập."},{status:500});
  }
}

export async function POST(req:NextRequest){
  let body:unknown;
  try{body=await req.json();}
  catch{return NextResponse.json({error:"Dữ liệu gửi lên không hợp lệ."},{status:400});}

  const parsed=schema.safeParse(body);
  if(!parsed.success){
    return NextResponse.json({error:parsed.error.issues[0]?.message??"Vui lòng kiểm tra thông tin."},{status:400});
  }

  if(!isAuthConfigured()){
    return NextResponse.json({
      error:"Website chưa được cấu hình AUTH_SECRET. Hãy thêm AUTH_SECRET có ít nhất 32 ký tự vào file .env.local rồi khởi động lại website."
    },{status:503});
  }

  const data=parsed.data;
  const email=data.email.trim().toLowerCase();

  try{
    if(data.action==="register"){
      const exists=await prisma.user.findUnique({where:{email}});
      if(exists){
        return NextResponse.json({
          error:"Email này đã được đăng ký. Hãy chuyển sang Đăng nhập hoặc dùng chức năng khôi phục mật khẩu."
        },{status:409});
      }

      const passwordHash=await bcrypt.hash(data.password,12);
      const user=await prisma.user.create({
        data:{fullName:data.fullName.trim(),email,passwordHash},
        select:{id:true,email:true,fullName:true}
      });
      await createSession(user);
      return NextResponse.json({success:true,user});
    }

    const user=await prisma.user.findUnique({where:{email}});
    if(!user||!(await bcrypt.compare(data.password,user.passwordHash))){
      return NextResponse.json({error:"Email hoặc mật khẩu không chính xác."},{status:401});
    }

    const safeUser={id:user.id,email:user.email,fullName:user.fullName};
    await createSession(safeUser);
    return NextResponse.json({success:true,user:safeUser});
  }catch(error){
    if(typeof error==="object"&&error!==null&&"code" in error&&error.code==="P2002"){
      return NextResponse.json({
        error:"Email này đã được đăng ký. Hãy đăng nhập bằng email hiện có."
      },{status:409});
    }
    console.error("AUTH_ERROR",error);
    return NextResponse.json({error:"Không thể hoàn tất xác thực. Vui lòng thử lại sau."},{status:500});
  }
}

export async function DELETE(){
  await clearSession();
  return NextResponse.json({success:true});
}
