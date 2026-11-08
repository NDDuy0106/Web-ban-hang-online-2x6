# Mộc Nhiên Beauty

Website bán mỹ phẩm tiếng Việt theo bố cục ảnh tham chiếu: header sáng, thanh điều hướng cam, sidebar danh mục, hero banner, ưu đãi và lưới sản phẩm. Giao diện được tinh chỉnh cho ngành làm đẹp với nền trắng ngà, typography thanh lịch và ảnh sản phẩm là trung tâm.

## Công nghệ
- Next.js 16.4.5 App Router, React 19, TypeScript, Tailwind CSS 4.
- Prisma ORM 6 + SQLite local; có thể đổi sang PostgreSQL bằng provider và DATABASE_URL.
- Zustand persist cho giỏ localStorage; Zod validate API và checkout.
- Google Gen AI SDK chính thức @google/genai, Gemini Interactions API, function calling và streaming SSE.
- Route Handlers của Next.js, không dựng server riêng.

## Cài đặt
Yêu cầu Node.js 22+ và npm.
```bash
npm install
cp .env.example .env.local
```
Cấu hình .env.local:
```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="YOUR_NEW_API_KEY"
GEMINI_MODEL="gemini-3.6-flash"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Lấy Gemini API key
1. Mở https://aistudio.google.com/app/apikey
2. Tạo API key mới trong Google AI Studio.
3. Điền key trong .env.local hoặc Environment Variables trên Vercel.
4. Không đặt key trong biến NEXT_PUBLIC_*, không commit file env thật.

### Database và seed
```bash
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```
Mở http://localhost:3000.

## Tính năng
- Trang chủ: hero, danh mục, sản phẩm bán chạy, hàng mới, ưu đãi, gợi ý theo loại da, newsletter.
- Danh sách sản phẩm: tìm kiếm, lọc category/brand/skin/concern/price/rating, sắp xếp và query string.
- Chi tiết sản phẩm: ảnh, biến thể, mô tả, thành phần, cách dùng, đánh giá và sản phẩm liên quan.
- Giỏ hàng persistent, coupon MOCHINH10/FREESHIP, kiểm tra tồn kho và freeship từ 500.000₫.
- Checkout COD/chuyển khoản, validate Zod, lưu Order/OrderItem trong SQLite và trang xác nhận.
- Giới thiệu, đổi trả, vận chuyển, liên hệ; sitemap và robots.
- Chatbot Mộc dùng Gemini function calling: searchProducts, getProductDetail, getStorePolicy, buildRoutine, checkStock. Product cards được client render từ dữ liệu thật trả riêng.
- Rate limit IP bộ nhớ process và giới hạn tin nhắn 500 ký tự.

## Tùy chỉnh
- Catalog và 20 sản phẩm mẫu: lib/catalog.ts; chạy lại npm run db:seed sau khi thay đổi.
- System instruction và function declarations: lib/gemini.ts.
- Logic truy vấn catalog/chính sách: lib/chatTools.ts.
- Design tokens màu/font/spacing/radius/shadow: app/globals.css.

## Chuyển SQLite sang PostgreSQL (Neon/Supabase)
1. Sao lưu dữ liệu local.
2. Đổi provider = "sqlite" thành provider = "postgresql" trong prisma/schema.prisma.
3. Đặt DATABASE_URL thành connection string PostgreSQL; dùng pooled URL khi chạy serverless nếu nhà cung cấp yêu cầu.
4. Chạy npx prisma migrate dev --name postgres_init và npm run db:seed.
5. Production dùng npx prisma migrate deploy.
Đổi provider không tự chuyển dữ liệu SQLite hiện có; cần export/import nếu muốn giữ đơn hàng. SQLite trên filesystem serverless không phù hợp cho dữ liệu production.

## Deploy Vercel
1. Import repo GitHub vào Vercel.
2. Thêm GEMINI_API_KEY, GEMINI_MODEL, DATABASE_URL, NEXT_PUBLIC_SITE_URL trong Project Settings → Environment Variables.
3. Dùng PostgreSQL managed (Neon/Supabase) cho production.
4. Chạy npx prisma migrate deploy, seed catalog một lần và redeploy.

## Lỗi thường gặp
- Chat báo thiếu key: thêm GEMINI_API_KEY và khởi động lại dev server.
- Gemini 429: kiểm tra quota, billing và rate limit tại Google AI Studio/Cloud.
- Model không tồn tại: đặt GEMINI_MODEL theo danh sách model Gemini API hiện hành.
- Prisma thiếu bảng: chạy migrate rồi seed.
- SQLite không ghi được: kiểm tra quyền ghi; dùng PostgreSQL trên Vercel.
- Ảnh placeholder lỗi: thay URL bằng ảnh HTTPS có quyền sử dụng.
- Build thiếu env: khai báo đủ biến trong môi trường deploy.

## Hướng mở rộng
1. Đăng nhập, lịch sử mua hàng và wishlist.
2. Thanh toán online VNPay/MoMo + webhook xác thực.
3. Admin quản trị sản phẩm, tồn kho, voucher và đơn.
4. Đánh giá có ảnh/video, kiểm duyệt và tích điểm.
5. Chatbot phân tích ảnh da có consent và chính sách lưu trữ rõ ràng; không thay thế bác sĩ.

## Bảo mật
Gemini API key chỉ dùng server-side. Rate limit hiện dùng memory, phù hợp demo/đơn instance; triển khai nhiều instance cần Redis/Upstash. Bổ sung CAPTCHA, audit log, kiểm thử bảo mật và tích hợp cổng thanh toán thật trước khi bán thực tế.