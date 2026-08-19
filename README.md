# Skibidi IELTS

Nền tảng IELTS Learning Platform production-oriented được xây bằng Next.js App Router, TypeScript, TailwindCSS, shadcn-style UI, Framer Motion, Prisma, PostgreSQL/Neon và OpenRouter.

## Tính năng

### Public
- Landing page responsive: Vocabulary, Writing AI, Pricing; tự nhận biết session khi user đã đăng nhập.
- Login / Register chỉ bằng `username + password`.
- Pricing đọc trực tiếp từ database.

### User dashboard
- Current plan, AI requests còn lại, expiry date, quick actions.
- Responsive sidebar/mobile navigation.
- Profile menu chứa Account + Logout, username hiển thị với user icon.
- Account: đổi password và redeem promo code.

### Vocabulary
- Hierarchy: `Group -> Topic -> VocabularyWord`.
- Flashcard 3D flip animation bằng Framer Motion.
- Meaning, example, Vietnamese translation, synonyms.
- Mobile/tablet/desktop responsive.

### IELTS Writing AI
- IELTS Writing Task 1 / Task 2.
- Form tách riêng `Đề bài` và `Bài làm`; Task 1/2 dùng compact switch.
- Đề bài có thể paste text hoặc upload JPG/JPEG/PNG/WEBP/PDF tối đa 5 MB; bài làm nhập text riêng.
- Validate MIME type, size và file signature phía server.
- Gửi multimodal task prompt + essay đến OpenRouter.
- Nhận xét, lỗi, giải thích và hướng dẫn tăng band được yêu cầu trả bằng tiếng Việt; correction/sample essay vẫn giữ tiếng Anh khi phù hợp.
- Structured feedback gồm:
  - Overall Band Score.
  - Task Achievement / Task Response.
  - Coherence and Cohesion.
  - Lexical Resource.
  - Grammatical Range and Accuracy.
  - Mistakes + corrections.
  - Band 7 sample, full improved essay, next-band guidance theo feature flag của plan.
- Quota được reserve trong Serializable transaction để tránh race condition khi gửi đồng thời.
- Upload binary không được lưu vào Neon; chỉ metadata, text và AI feedback được lưu. Nếu cần giữ file lâu dài, nối thêm object storage như S3/R2 rồi ghi URL vào `WritingSubmission.imageUrl`.

### History
- Task 1 + Task 2 chung một bảng.
- Band score hiển thị đỏ nổi bật.
- Trang detail lưu toàn bộ feedback và feature snapshot tại thời điểm chấm.

### Subscription / Promo
- Free plan tự gán khi đăng ký.
- Plan có duration, price, quota, model và feature flags.
- Paid subscription mặc định seed là 30 ngày.
- Promo code có plan reward, duration, max uses, expiry, active state và chống redeem trùng.
- Hỗ trợ chuyển khoản ngân hàng bằng QR tĩnh, tạo `transferCode` riêng cho từng yêu cầu.
- User gửi yêu cầu mua plan -> trạng thái `PENDING`; admin duyệt/từ chối thủ công.
- Khi `APPROVED`, backend tự gán plan, reset kỳ quota và set ngày hết hạn theo `durationDays`.
- Revenue admin được tính từ các bank payment đã duyệt.

### Admin
Admin có route và session riêng tại `/admin`.

- Dashboard: total users, active paid subscriptions, Writing usage và doanh thu đã duyệt.
- Users: xem user và đổi plan.
- Plans: CRUD, hide/show, price, duration, quota, model slug và từng feature flag.
- Payments: xem transfer code, số tiền, user/plan và Approve/Reject thủ công.
- Promo codes: CRUD.
- Vocabulary: CRUD Group / Topic / Word + bulk import mỗi dòng một từ.
- AI Settings: model fallback + OpenRouter API key.
- API key nhập qua admin được mã hóa AES-256-GCM trước khi lưu và không bao giờ trả ngược về browser.

## Stack

- Next.js App Router + React 19 + TypeScript strict.
- TailwindCSS + reusable shadcn-style primitives.
- Framer Motion.
- PostgreSQL + Neon.
- Prisma ORM.
- `bcryptjs` cost 12 cho password hashing.
- `jose` JWT HS256 trong httpOnly cookies, session user/admin tách riêng.
- Zod validation.
- Sonner toast.
- Vitest + React Testing Library.

## Cấu trúc chính

```text
src/
  app/
    (auth)/                  # login/register
    admin/
      (panel)/               # protected admin pages
      login/                 # separate admin login
    api/                     # route handlers
    dashboard/               # protected user application
    page.tsx                 # landing page
  components/
    admin/
    auth/
    dashboard/
    ui/
    vocabulary/
    writing/
  lib/
    auth.ts
    crypto.ts
    db.ts
    openrouter.ts
    quota.ts
    rate-limit.ts
    validation.ts
prisma/
  migrations/0001_init/
  schema.prisma
  seed.ts
```

## Database

Schema có các model chính:

- `User`
- `Admin`
- `Plan`
- `VocabularyGroup`
- `VocabularyTopic`
- `VocabularyWord`
- `WritingSubmission`
- `PromoCode`
- `PromoRedemption`
- `AIUsage`
- `AISetting`
- `RateLimitBucket`
- `BankPaymentRequest`

Các model bổ sung (`Admin`, `PromoRedemption`, `AISetting`, `RateLimitBucket`, `BankPaymentRequest`) phục vụ separation of privilege, idempotency, encrypted configuration, rate limiting và manual bank-transfer review.

## Chạy local

Yêu cầu Node.js 22.16+ (project khóa `<25`).

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Mở `http://localhost:3000`.

Admin login: `http://localhost:3000/admin/login` với `ADMIN_USERNAME` và `ADMIN_PASSWORD` trong `.env`.

> `prisma:seed` sẽ dừng nếu thiếu `ADMIN_USERNAME`, thiếu `ADMIN_PASSWORD`, hoặc password admin ngắn hơn 12 ký tự. Không có admin password mặc định.

## Neon PostgreSQL

Điền hai connection strings:

```env
DATABASE_URL="<Neon pooled runtime connection string>"
DIRECT_URL="<Neon direct connection string for migrations>"
```

`schema.prisma` sử dụng `DATABASE_URL` cho runtime và `DIRECT_URL` cho migration.

## OpenRouter

Có hai cách cấu hình API key:

1. `OPENROUTER_API_KEY` trong environment variables.
2. Admin -> AI Settings -> lưu key trong database; key này được mã hóa trước khi lưu.

Plan-level `aiModel` có ưu tiên cao hơn global fallback model. Seed dùng `openrouter/auto` để có default an toàn; admin có thể thay bằng exact OpenRouter model slug theo policy/cost/quality của từng plan.

Các environment variables liên quan:

```env
OPENROUTER_API_KEY=""
OPENROUTER_SITE_URL="https://your-domain.com"
OPENROUTER_APP_NAME="Skibidi IELTS"
```

## Security checklist đã triển khai

- Bcrypt password hashing.
- HttpOnly + SameSite cookies; `secure` trong production.
- User/admin session secrets tách riêng.
- Full DB/JWT authorization trong protected layouts/API; middleware chỉ là optimistic redirect layer.
- Rate limit login/register/admin login/password change lưu trong PostgreSQL.
- Server-side input validation bằng Zod.
- File size/type/signature validation.
- OpenRouter key không expose về client.
- AES-256-GCM cho key lưu DB.
- Serializable transaction cho AI quota và promo redemption.
- Generic API errors; không gửi stack trace ra client.
- Security response headers trong `next.config.ts`.

## Test / QA

```bash
npm run typecheck
npm test
npm run build
```

GitHub Actions ở `.github/workflows/ci.yml` chạy generate Prisma, typecheck, tests và production build cho push / pull request.

Trong môi trường tạo artifact hiện tại, npm registry không truy cập được nên dependencies không thể được cài để chạy dependency-backed `tsc`, Vitest và Next production build. Toàn bộ file TS/TSX đã được parse bằng TypeScript compiler API để kiểm tra syntax trước khi đóng gói. CI được cung cấp để thực hiện vòng QA đầy đủ khi repository chạy trong GitHub/Render có network.

## Deploy Render + Neon

Repository có `render.yaml`:

- Node web service Free tại region Singapore.
- Build Next.js server app.
- `prisma migrate deploy` chạy trong build trước mỗi deploy (Free tier không hỗ trợ pre-deploy command).
- `prisma:seed` sau lần deploy thành công đầu tiên.
- `/api/health` làm health check.
- Secrets được khai báo bằng `sync: false` hoặc generated values.

Flow đề xuất:

1. Tạo Neon project và database.
2. Push source code lên GitHub.
3. Trên Render, tạo Blueprint từ `render.yaml`.
4. Nhập `DATABASE_URL`, `DIRECT_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_SITE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` khi Render yêu cầu.
5. Deploy.
6. Vào `/admin` để chỉnh plans, model slugs, pricing, vocabulary và promo codes.

## Production follow-ups nên làm trước khi thu tiền thật

- Nếu cần tự động hóa thanh toán, có thể thay manual QR review bằng PayOS/MoMo/Stripe webhook mà không đổi Plan/quota core.
- Thêm S3/R2 nếu muốn lưu ảnh/PDF gốc để xem lại trong history.
- Cấu hình error monitoring/observability và database backups/retention.
- Review exact OpenRouter models, cost ceilings và data/privacy policy của provider trước khi mở production traffic.
- Thêm end-to-end tests (Playwright) cho register -> writing -> history và admin CRUD.

## Seed data

Seed tạo sẵn:

- Free / Plus / Pro / Max.
- Seed baseline: Free 1 lượt, Plus 3 lượt, Pro 10 lượt, Max 30 lượt. Existing plan settings are not overwritten when seed runs again.
- Academic Vocabulary -> Environment.
- `sustainable`, `pollution`, `biodiversity`.
- AI fallback: `openrouter/auto`.
- Admin từ biến môi trường.

---

Skibidi IELTS includes a manual QR bank-transfer workflow and keeps automated payment providers/object storage as isolated upgrade points.
