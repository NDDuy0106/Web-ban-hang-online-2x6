# Sixnature

Website bán mỹ phẩm tiếng Việt và chatbot tư vấn làm đẹp sử dụng Gemini. Tài liệu này dành cho thành viên mới: cài dự án, chạy local, bảo vệ API key, phối hợp trên GitHub và thực hiện kế hoạch cải thiện chatbot.

## Công nghệ

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Prisma 6 với SQLite cho phát triển local.
- Gemini qua Google Gen AI SDK (`@google/genai`), function calling và streaming SSE.
- Đăng nhập bằng mật khẩu bcrypt và session JWT trong cookie HttpOnly.

Yêu cầu: Node.js 22 trở lên và npm.

## Bắt đầu trên Windows

Mở PowerShell tại thư mục dự án:

```powershell
npm install
Copy-Item .env.example .env.local
```

Mở `.env.local` và điền cấu hình local:

```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
GEMINI_MODEL="gemini-3.8-flash"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
AUTH_SECRET="YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS"
```

Tạo API key Gemini trong [Google AI Studio](https://aistudio.google.com/app/apikey). Tạo `AUTH_SECRET` riêng cho môi trường phát triển; có thể dùng `openssl rand -base64 32` nếu máy đã cài OpenSSL.

Sau đó chạy migration, nạp catalog mẫu và khởi động website:

```powershell
npx prisma migrate dev
npm run db:seed
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Để dừng server, nhấn `Ctrl+C` trong terminal đang chạy server.

Nếu chỉ làm frontend và không cần đăng nhập hoặc gọi chatbot, vẫn có thể chạy website sau khi cài dependencies, nhưng các chức năng cần `AUTH_SECRET` hoặc `GEMINI_API_KEY` sẽ không hoạt động đầy đủ.

### Biến môi trường và API key

- `.env.local` là file riêng trên máy; không commit hoặc gửi API key trong GitHub, source code, issue, pull request, Excel hay chat.
- Mỗi thành viên nên dùng key phát triển riêng. Nếu nhóm bắt buộc dùng chung project/key, chia sẻ qua password manager hoặc secret manager được nhóm phê duyệt; quota và giới hạn có thể được dùng chung.
- Chỉ người được phân công kiểm thử AI chạy bộ hội thoại chính thức. Các thành viên khác dùng kiểm thử tĩnh hoặc trao đổi kết quả để tránh lãng phí quota.
- Key production phải được đặt trong Environment Variables/Secrets của nền tảng deploy, không dùng key cá nhân để chạy production.
- Nếu key bị lộ, thu hồi key đó và tạo key mới. Đừng xóa hoặc sửa quy tắc `.gitignore` để đưa `.env.local` lên Git.

## Kiểm tra dự án

Chạy các kiểm tra sau trước khi tạo pull request:

```powershell
npm run lint
npx tsc --noEmit --incremental false
node --import tsx --test tests/product-recommendations.test.ts
```

Các lệnh lint, type-check và test xếp hạng sản phẩm không gọi Gemini. Gửi tin nhắn trong chatbot mới sử dụng API và quota Gemini.

## Chatbot hiện tại

- Prompt, vai trò tư vấn, quy tắc an toàn và khai báo Gemini functions: `lib/gemini.ts`.
- Tìm kiếm, chấm điểm sản phẩm và xây routine: `lib/product-recommendations.ts`, `lib/chatTools.ts`.
- API Gemini, function calling, hồ sơ làm đẹp có consent và SSE: `app/api/chat/route.ts`.
- Giao diện chat và hiển thị sản phẩm: `components/chat-widget.tsx`.
- Catalog mẫu 20 sản phẩm: `lib/catalog.ts`; `npm run db:seed` upsert catalog vào database local.
- Các function hiện có: `searchProducts`, `getProductDetail`, `getStorePolicy`, `buildRoutine`, `checkStock`.

Catalog hiện là dữ liệu mẫu phục vụ phát triển, không thay thế dữ liệu sản phẩm đã xác minh từ nhà sản xuất. Điểm khớp sản phẩm là mức khớp với dữ liệu catalog, không phải hiệu quả điều trị hay bảo đảm phù hợp y khoa. Không tự suy diễn thành phần, công dụng hoặc hướng dẫn dùng.

Mã ưu đãi trong checkout hiện tại: `SIXNATURE10` giảm 10% cho đơn từ 300.000₫, tối đa 150.000₫; `FREESHIP` miễn phí vận chuyển. Đơn có tổng sau giảm từ 500.000₫ cũng được miễn phí vận chuyển.

## Kế hoạch nhóm cải thiện chatbot

Điền tên người phụ trách và trạng thái trong file phân công. Mỗi thành viên làm trên một nhánh riêng của cùng repository, không cần tạo repository riêng nếu đã có quyền ghi vào repository chung.

| Thành viên | Phạm vi | File chính | Bàn giao |
|---|---|---|---|
| 1 — Prompt | Lưu prompt hiện tại làm v1; cải thiện prompt v2 về phong cách trò chuyện, quy trình tư vấn và xử lý phản đối. Tích hợp ví dụ mẫu, chỉnh theo kết quả đánh giá. Chỉ thành viên này sửa prompt trong thời gian làm việc song song. | `lib/gemini.ts` | Prompt v1/v2, nhật ký thay đổi và lý do chỉnh. |
| 2 — Hội thoại mẫu | Soạn 10–15 ví dụ “máy móc/người thật”; 4–5 tình huống phản đối như giá cao, sợ kích ứng, đã thử nhiều sản phẩm hoặc muốn suy nghĩ thêm; đề xuất cách nhận biết và phản hồi cảm xúc. | Tài liệu ví dụ trong nhánh riêng; bàn giao cho thành viên 1 và 5. | Bộ ví dụ được rà soát, không đưa toàn bộ ví dụ dài vào prompt nếu không cần. |
| 3 — Dữ liệu và công cụ | Chỉ thêm sản phẩm demo khi ghi rõ dữ liệu nào là giả/chưa xác minh. Bổ sung từ đồng nghĩa cần thiết vào `lib/product-recommendations.ts`, thêm test. Đối chiếu mọi thông tin khuyến mãi với checkout trước khi hướng dẫn AI. | `lib/catalog.ts`, `lib/product-recommendations.ts`, `tests/` | Catalog demo, thay đổi search và test chạy được. |
| 4 — Giao diện và luồng chat | Cải thiện thẻ sản phẩm và giao diện; nếu làm 👍/👎 thì thống nhất nơi lưu và cách xử lý phản hồi. Phối hợp với nhóm trước khi đổi định dạng SSE hoặc contract sản phẩm. | `components/chat-widget.tsx`, `app/api/chat/route.ts` | Chat UI và bản demo ổn định. |
| 5 — Kiểm thử và đánh giá | Soạn 20–25 tình huống: câu hỏi chung, cảm xúc, phản đối giá, routine, so sánh, tình huống nhạy cảm, ngoài phạm vi và prompt injection. Chấm v1/v2 theo 4 tiêu chí: tự nhiên, đúng nhu cầu, an toàn, ngắn gọn/có bước tiếp theo. | Tài liệu tình huống và bảng đánh giá; phối hợp nếu thêm test code. | Điểm trước/sau, lỗi cụ thể, đề xuất vòng sửa tiếp theo. |

### Thứ tự và tiêu chí kiểm thử

1. Thành viên 2 chuẩn bị ví dụ và thành viên 5 chuẩn bị tình huống kiểm thử.
2. Thành viên 1 lưu prompt hiện hành làm baseline v1, tạo v2 và chỉ chọn một số ví dụ ngắn, tiêu biểu để đưa vào system instruction. Prompt được gửi mỗi lượt gọi Gemini, nên ví dụ dài làm tăng token và chi phí.
3. Thành viên 3 hoàn tất thay đổi catalog/search độc lập và chạy test trước khi thành viên 5 đánh giá.
4. Thành viên 5 chạy cùng bộ tình huống cho v1 và v2, ghi lại câu trả lời, điểm và lỗi. Chỉ người phụ trách này chạy bộ kiểm thử chính thức để tiết kiệm quota.
5. Thành viên 4 hoàn thiện cách hiển thị thẻ theo sản phẩm mà câu trả lời cuối thực sự khuyến nghị. Kết quả function call chưa chắc đã được AI đề xuất; không nên mặc định hiển thị mọi sản phẩm từng được tra ở các vòng tool.
6. Sau mỗi PR, cập nhật nhánh từ `main`, chạy lint/type-check/test. Chỉ demo và kiểm tra Gemini sau khi các thay đổi đã tích hợp.

Các ca an toàn nghiêm trọng (bịa thành phần/công dụng, chẩn đoán bệnh hoặc khuyên dùng không an toàn) nên được ghi là lỗi chặn, không để điểm cao ở tiêu chí khác bù trừ.

## Làm việc với GitHub

1. Mỗi người tạo nhánh từ `main` mới nhất và chỉ sửa phạm vi đã được phân công:

   ```powershell
   git fetch origin
   git switch main
   git pull origin main
   git switch -c feat/ten-cong-viec
   ```

2. Trước khi commit, xem các file sẽ được đưa lên:

   ```powershell
   git status
   git diff
   git add <cac-file-thuoc-cong-viec>
   git diff --cached --check
   git diff --cached
   ```

3. Commit và push nhánh cá nhân:

   ```powershell
   git commit -m "Describe the change"
   git push -u origin feat/ten-cong-viec
   ```

4. Mở Pull Request từ nhánh cá nhân vào `main`. Yêu cầu thành viên khác review; không push trực tiếp vào `main`.
5. Nếu `main` đã tiến lên, cập nhật nhánh bằng `git fetch origin` và `git merge origin/main` (hoặc dùng rebase nếu nhóm đã thống nhất). Xử lý xung đột rồi chạy lại kiểm tra trước khi merge.
6. Nếu không có quyền ghi vào repository chung, tạo fork rồi mở Pull Request từ fork.

Không stage `.env`, `.env.local`, database local, hoặc file build. Tách nhánh giúp giảm xung đột Git; vẫn cần trao đổi khi nhiều phần phụ thuộc cùng contract, đặc biệt là `app/api/chat/route.ts` và `components/chat-widget.tsx`.

## Database và deploy

- Local sử dụng SQLite qua `DATABASE_URL="file:./dev.db"`. Migration đã có trong `prisma/migrations/`; dùng `npx prisma migrate dev` để áp dụng.
- Chạy `npm run db:seed` để nạp/cập nhật dữ liệu catalog mẫu local.
- Deploy thật nên dùng PostgreSQL được quản lý. Cần cấu hình `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `NEXT_PUBLIC_SITE_URL`, `AUTH_SECRET` trong môi trường deploy và chạy `npx prisma migrate deploy`.
- SQLite local hoặc file database không phù hợp cho nhiều instance serverless. Không chuyển database hoặc deploy production nếu chưa sao lưu và thống nhất với người phụ trách.

## Xử lý lỗi thường gặp

- Chat báo chưa cấu hình: kiểm tra `GEMINI_API_KEY` trong `.env.local`, rồi khởi động lại server.
- Gemini báo 429/quota: dừng lượt thử lặp, kiểm tra quota và báo người phụ trách API key.
- Lỗi model: kiểm tra `GEMINI_MODEL` có được tài khoản/project hỗ trợ không.
- Thiếu bảng Prisma: chạy `npx prisma migrate dev`.
- Không đăng nhập được local: kiểm tra `AUTH_SECRET` có ít nhất 32 ký tự và database đã migrate.
- Port 3000 đang dùng: dừng server cũ bằng `Ctrl+C` hoặc dùng địa chỉ port Next.js thông báo.

## Bảo mật và dữ liệu khách hàng

API key chỉ được dùng phía server; không đặt tiền tố `NEXT_PUBLIC_`. Hồ sơ làm đẹp chỉ được sử dụng khi khách đã đồng ý lưu và có thể xóa trong trang tài khoản. Không đưa dữ liệu cá nhân hoặc thông tin nhạy cảm của khách vào tình huống kiểm thử. Rate limit hiện lưu trong bộ nhớ, phù hợp demo/đơn instance hơn là triển khai production nhiều instance.
