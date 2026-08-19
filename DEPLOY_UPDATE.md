# Deploy update - QR payments + Writing UX

## Những thay đổi chính

- Pricing: Plus / Pro / Max được làm nổi bật hơn; quota hiển thị là `lượt chấm Writing`.
- Thanh toán: user chọn plan -> tạo transfer code -> quét `public/bank-transfer-qr.png` -> admin duyệt/từ chối tại `/admin/payments`.
- Khi admin Approve: plan được gán cho user, `planStartedAt` reset, `planExpireDate` lấy theo `durationDays`, quota bắt đầu kỳ mới.
- Admin revenue: tổng các `BankPaymentRequest` đã `APPROVED`.
- Sidebar user: Account + Logout nằm trong profile menu; bỏ `@`; thêm user icon.
- Dashboard logo quay về `/dashboard`. Landing page cũng nhận biết session và không hiện Login/Register khi user đã đăng nhập.
- Landing: bỏ FAQ và footer cuối trang.
- Dashboard: bỏ các explanatory grey notes được yêu cầu.
- Writing: tách `Đề bài` và `Bài làm`; Task 1 / Task 2 là compact switch; đề bài hỗ trợ text hoặc JPG/JPEG/PNG/WEBP/PDF <= 5MB.
- AI feedback: examiner commentary bằng tiếng Việt; English corrections / sample essays vẫn giữ tiếng Anh.

## Database migration

Migration mới:

`prisma/migrations/0002_bank_payments_and_writing_prompt/migration.sql`

Migration thêm:

- `WritingSubmission.taskPrompt`
- `WritingSubmission.promptAttachmentName`
- `BankPaymentRequest`

Không xóa hay reset dữ liệu user/plan/submission hiện có.

## Deploy trên Render hiện tại

1. Copy/push source mới lên branch `main`.
2. Render auto-deploy.
3. `render.yaml` đã dùng Free tier + Singapore và chạy:

   `npm install --no-audit --no-fund && npx prisma migrate deploy && npm run build`

4. Chờ log `prisma migrate deploy` chạy migration `0002_bank_payments_and_writing_prompt` thành công.
5. Mở `/admin/payments` để kiểm tra trang review.
6. Login user -> Pricing -> chọn Plus/Pro/Max -> tạo QR payment request.
7. Admin Approve -> refresh user -> kiểm tra plan và expiry.

Không cần chạy seed lại cho update này. Seed mới cũng không overwrite cấu hình plan hiện có nếu vô tình chạy lại.

## Lưu ý

- QR hiện là asset tĩnh `public/bank-transfer-qr.png`. Muốn đổi tài khoản nhận tiền chỉ cần thay file này bằng QR mới cùng tên rồi deploy lại.
- User phải chuyển đúng `amount` và `transferCode` hiển thị để admin đối soát.
- Feedback tiếng Việt chỉ áp dụng cho các bài chấm mới; history cũ giữ nguyên JSON đã lưu.
