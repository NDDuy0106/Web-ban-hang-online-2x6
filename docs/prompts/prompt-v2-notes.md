# Nhật ký thay đổi prompt v2

- Baseline đối chiếu: [system-instruction-v1.md](./system-instruction-v1.md), được xác minh khớp prompt tại commit `94bcdde0c6d4bcf4d161065b01d8f8ed3fe14576`.
- Bản v2 đang dùng trong ứng dụng: `SYSTEM_INSTRUCTION` tại `lib/gemini.ts`.
- Trạng thái: bản nháp để đánh giá; chưa chạy hội thoại với Gemini.
- Phạm vi: chỉ sửa system instruction, không đổi function declarations, API chat hay dữ liệu catalog.
- Các thay đổi dữ liệu/công cụ và đối chiếu thẻ sản phẩm được thực hiện riêng sau khi chốt bản nháp v2; khi so sánh v1/v2 cần dùng cùng một phiên bản catalog và tool.

## Thay đổi so với v1

1. Nêu rõ cách xử lý do dự/phản đối: lắng nghe điều khách băn khoăn trước, không biến phản đối thành cơ hội chốt đơn.
2. Thêm hướng dẫn riêng cho năm tình huống: giá vượt ngân sách, sợ kích ứng/nổi mụn, đã thử nhiều sản phẩm, muốn suy nghĩ thêm và hỏi cam kết hiệu quả.
3. Làm rõ nhịp trả lời: ghi nhận cảm xúc khi khách thực sự bộc lộ, trả lời mối quan tâm chính, rồi mới hỏi một điều cần thiết hoặc gợi ý bước tiếp theo.
4. Hạn chế đồng cảm rập khuôn và lời mời mua hàng tự động; không giả làm người thật.
5. Chỉ giữ một ví dụ ngắn về phản hồi khách nản lòng; không chép toàn bộ bộ ví dụ vào system instruction để kiểm soát độ dài/token.
6. Giữ nguyên tên đầy đủ của sản phẩm được đề xuất để giao diện ghép đúng thẻ với câu trả lời cuối.

## Quy tắc được giữ nguyên

- Không bịa sản phẩm, giá, tồn kho, thành phần, công dụng hay dữ liệu chính sách.
- Không chẩn đoán, kê đơn, hứa kết quả điều trị hoặc bảo đảm sản phẩm không gây kích ứng.
- Giữ hướng dẫn an toàn, quyền riêng tư, sử dụng tool, tư vấn routine tối giản và không gây áp lực mua hàng.

## Kiểm thử cần làm tiếp

Dùng cùng bộ tình huống và rubric tại [../chatbot-evaluation.md](../chatbot-evaluation.md) để so sánh v1/v2. Ưu tiên rà soát T02, T03–T09, T12–T20, T22 và T24; ghi nguyên văn câu trả lời, điểm và blocker. Kiểm tra thêm rằng chỉ thẻ của sản phẩm được nêu đúng tên trong câu trả lời cuối mới hiển thị. Không xem các ví dụ trong [../chatbot-dialogue-examples.md](../chatbot-dialogue-examples.md) là đáp án cần lặp y nguyên.
