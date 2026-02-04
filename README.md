# PhotoFast

PhotoFast là ứng dụng chỉnh sửa ảnh online miễn phí, chạy hoàn toàn trên trình duyệt. Ảnh được xử lý ở phía client (không upload lên server), tập trung vào tốc độ và trải nghiệm giống các công cụ kiểu Lightroom.

## Tính năng chính
- Upload ảnh và chỉnh sửa trực tiếp trên canvas
- Bộ filter đầy đủ: exposure, brightness, contrast, HSL per-channel, clarity, grain, fade, vignette...
- Preset có sẵn và preset tùy chỉnh (lưu localStorage, export preset JSON)
- Crop ảnh với nhiều tỉ lệ, hỗ trợ lưới rule-of-thirds
- Export PNG/JPEG chất lượng cao, có progress từng bước
- Dark mode
- PWA-ready (manifest + icons)

## Công nghệ sử dụng
- SvelteKit + Vite
- Fabric.js (xử lý ảnh trên canvas)
- Tailwind CSS
- Firebase Hosting (deploy static)

## Cấu trúc thư mục chính
- `src/routes` - Trang chính và layout
- `src/components` - UI components
- `src/lib/canvas` - Canvas logic & filters
- `src/lib/frames` - Frame renderer
- `src/lib/presets` - Preset logic
- `static` - PWA assets, OG image, icons

## Chạy dự án
Cài dependencies:

```bash
npm install
```

Chạy dev server:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

## Deploy
Triển khai lên Firebase Hosting:

```bash
npm run deploy
```

Xem hướng dẫn chi tiết ở `FIREBASE_DEPLOY.md`.

## Liên hệ
- Email: viethoanganh79@gmail.com
- PayPal: https://paypal.me/viethoanganh79

---

Made with Svelte + Fabric.js
