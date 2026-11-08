# Mộc Nhiên Beauty

Website bán mỹ phẩm tiếng Việt theo bố cục ảnh tham chiếu: header sáng, thanh điều hướng cam, sidebar danh mục, hero banner, ưu đãi và lưới sản phẩm. Nền trắng ngà, typography thanh lịch, ảnh sản phẩm là trung tâm.

## Stack
Next.js 16.4.5 App Router, React 19, TypeScript, Tailwind CSS 4, Prisma 6 + SQLite, Zustand, Zod và Google Gen AI SDK chính thức `@google/genai` 3.0.0. Gemini Interactions API dùng function calling và streaming.

## Cài đặt
Yêu cầu Node.js 22+ và npm.
```bash
npm install
cp .env.example .env.local
```
Đặt các giá trị trong `.env.local`:
```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="YOUR_NEW_API_KEY"
GEMINI_MODEL="gemini-3.8-flash"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Lấy Gemini API key
1. Mở https://aistudio.google.com/app/apikey
2. Tạo API key mới trong Google AI Studio.
3. Đặt key trong `.env.local` hoặc Environment Variables trên Vercel.
4. Không dùng tiền tố `NEXT_PUBLIC_` cho API key; không commit file env thật.

### Database và chạy local
```bash
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```
Mở http://localhost:3000.

## Tính năng
- Trang chủ: hero, danh mục, sản phẩm bán chạy, hàng mới, ưu đãi, gợi ý theo loại da, newsletter.
- Danh sách: tìm kiếm, lọc danh mục/thương hiệu/loại da/vấn đề da/giá/đánh giá, sắp xếp và query string.
- Chi tiết: ảnh, biến thể, mô tả, thành phần, cách dùng, review và sản phẩm liên quan.
- Giỏ hàng persist localStorage, coupon MOCHINH10/FREESHIP, tồn kho và freeship từ 500.000₫.
- Checkout COD/chuyển khoản, Zod validation, lưu Order/OrderItem; trang đơn hàng thành công.
- Trang giới thiệu, đổi trả, vận chuyển, liên hệ; sitemap, robots.
- Chatbot Mộc với 5 Gemini functions: searchProducts, getProductDetail, getStorePolicy, buildRoutine, checkStock; SSE stream token, sản phẩm hiển thị từ dữ liệu thật.
- Giới hạn 500 ký tự và rate limit IP memory-based.

## Chỉnh sửa catalog và system prompt
- 20 sản phẩm và thương hiệu giả: `lib/catalog.ts`. Chạy `npm run db:seed` để seed lại.
- System instruction + function declarations: `lib/gemini.ts`.
- Logic tool và policy: `lib/chatTools.ts`.
- Design tokens: `app/globals.css`.

## Chuyển sang PostgreSQL (Neon/Supabase)
1. Sao lưu database SQLite.
2. Đổi `provider = "sqlite"` thành `provider = "postgresql"` trong `prisma/schema.prisma`.
3. Đặt `DATABASE_URL` thành connection string PostgreSQL (pooled URL nếu yêu cầu).
4. Chạy `npx prisma migrate dev --name postgres_init`, sau đó `npm run db:seed`.
5. Production dùng `npx prisma migrate deploy`.
Đổi provider không tự chuyển dữ liệu cũ; cần export/import nếu muốn giữ đơn hàng. SQLite serverless không phù hợp production.

## Deploy Vercel
Import repo vào Vercel, cấu hình `GEMINI_API_KEY`, `GEMINI_MODEL`, `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`. Dùng PostgreSQL managed. Chạy `npx prisma migrate deploy`, seed catalog một lần và redeploy.

## Lỗi thường gặp
- Chat báo thiếu key: thêm `GEMINI_API_KEY` và restart dev server.
- Gemini 429: kiểm tra quota, billing và rate limit.
- Model 404: kiểm tra `GEMINI_MODEL` theo trang Models.
- Prisma thiếu bảng: migrate rồi seed.
- SQLite không ghi được: kiểm tra quyền hoặc chuyển PostgreSQL.
- Ảnh placeholder lỗi: thay URL ảnh HTTPS.
- Thiếu env trên Vercel: khai báo đủ biến ở Project Settings.

## Mở rộng
Đăng nhập/wishlist; VNPay/MoMo và webhook; admin quản lý sản phẩm/đơn; review có ảnh; phân tích ảnh da có consent và chính sách lưu trữ rõ ràng.

## Bảo mật
API key chỉ chạy server-side. Rate limit trong bộ nhớ chỉ phù hợp demo/đơn instance; production nhiều instance cần Redis/Upstash. Bổ sung CAPTCHA, audit log và security test trước khi bán thật.