import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {getSession} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const runtime="nodejs";
const schema=z.object({
  consent:z.literal(true),
  skinType:z.enum(["da_dau","da_kho","da_hon_hop","da_thuong","da_nhay_cam","chua_ro"]),
  concerns:z.array(z.enum(["mun","tham_sau_mun","kho_thieu_am","do_nhay_cam","lao_hoa","khong_deu_mau","lo_chan_long","khac"])).max(8),
  sensitivity:z.enum(["low","normal","high"]),
  goals:z.string().trim().max(300).default(""),
  budget:z.number().int().min(0).max(10000000).nullable().default(null),
  preferences:z.string().trim().max(300).default("")
});
function present(profile:{skinType:string;concerns:string;sensitivity:string;goals:string;budget:number|null;preferences:string;consentAt:Date}){
  let concerns:string[]=[];try{const value=JSON.parse(profile.concerns);if(Array.isArray(value))concerns=value.filter((x):x is string=>typeof x==="string");}catch{}
  return {skinType:profile.skinType,concerns,sensitivity:profile.sensitivity,goals:profile.goals,budget:profile.budget,preferences:profile.preferences,consentAt:profile.consentAt.toISOString()};
}
export async function GET(){
  const session=await getSession();if(!session)return NextResponse.json({error:"Vui lòng đăng nhập để xem hồ sơ."},{status:401});
  const profile=await prisma.beautyProfile.findUnique({where:{userId:session.id}});
  return NextResponse.json({profile:profile?present(profile):null});
}
export async function PUT(req:NextRequest){
  const session=await getSession();if(!session)return NextResponse.json({error:"Vui lòng đăng nhập để lưu hồ sơ."},{status:401});
  let body:unknown;try{body=await req.json();}catch{return NextResponse.json({error:"Dữ liệu không hợp lệ."},{status:400});}
  const parsed=schema.safeParse(body);if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Vui lòng kiểm tra thông tin."},{status:400});
  const data=parsed.data;
  const profile=await prisma.beautyProfile.upsert({where:{userId:session.id},create:{userId:session.id,skinType:data.skinType,concerns:JSON.stringify(data.concerns),sensitivity:data.sensitivity,goals:data.goals,budget:data.budget,preferences:data.preferences,consentAt:new Date()},update:{skinType:data.skinType,concerns:JSON.stringify(data.concerns),sensitivity:data.sensitivity,goals:data.goals,budget:data.budget,preferences:data.preferences,consentAt:new Date()}});
  return NextResponse.json({success:true,profile:present(profile)});
}
export async function DELETE(){
  const session=await getSession();if(!session)return NextResponse.json({error:"Vui lòng đăng nhập."},{status:401});
  await prisma.beautyProfile.deleteMany({where:{userId:session.id}});
  return NextResponse.json({success:true});
}
