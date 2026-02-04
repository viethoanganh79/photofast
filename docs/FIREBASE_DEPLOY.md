# 🚀 Hướng dẫn Deploy lên Firebase Hosting

Tài liệu này hướng dẫn cách deploy ứng dụng PhotoFast lên Firebase Hosting.

---

## 📋 Yêu cầu trước khi deploy

1. **Node.js** (phiên bản 18 trở lên)
2. **npm** hoặc **yarn**
3. **Firebase CLI** đã được cài đặt
4. **Tài khoản Firebase** và đã tạo project trên Firebase Console

---

## 🔧 Bước 1: Cài đặt Firebase CLI

Nếu chưa cài đặt Firebase CLI:

```bash
npm install -g firebase-tools
```

Đăng nhập vào Firebase:

```bash
firebase login
```

---

## 🔧 Bước 2: Khởi tạo Firebase project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Lưu lại **Project ID**

---

## 🔧 Bước 3: Cấu hình Firebase trong dự án

1. **Cập nhật `.firebaserc`** với Project ID của bạn:

```json
{
	"projects": {
		"default": "your-project-id-here"
	}
}
```

2. **Kiểm tra `firebase.json`** đã được tạo đúng:

File này đã được tạo tự động với cấu hình:
- Public directory: `build` (output từ SvelteKit)
- Rewrites: Tất cả routes về `/index.html` (SPA routing)
- Cache headers: Tối ưu cache cho assets

---

## 🔧 Bước 4: Build ứng dụng

Build ứng dụng để tạo static files:

```bash
npm run build
```

Sau khi build thành công, thư mục `build/` sẽ chứa các file tĩnh sẵn sàng deploy.

---

## 🔧 Bước 5: Deploy lên Firebase Hosting

### Deploy lần đầu:

```bash
firebase deploy --only hosting
```

Hoặc sử dụng script đã được cấu hình:

```bash
npm run deploy
```

Script này sẽ:
1. Build ứng dụng (`npm run build`)
2. Deploy lên Firebase Hosting (`firebase deploy --only hosting`)

### Deploy các lần sau:

Chỉ cần chạy:

```bash
npm run deploy
```

---

## 🔧 Bước 6: Kiểm tra sau khi deploy

1. Truy cập URL được cung cấp sau khi deploy thành công
2. Kiểm tra các tính năng:
   - Upload và chỉnh sửa ảnh
   - Export ảnh
   - Dark mode
   - Responsive trên mobile
   - PWA (nếu đã cấu hình)

---

## 🔧 Bước 7: Cấu hình Custom Domain (Tùy chọn)

1. Vào Firebase Console → Hosting
2. Click "Add custom domain"
3. Nhập domain của bạn
4. Làm theo hướng dẫn để verify domain
5. Cập nhật DNS records theo hướng dẫn

Sau khi cấu hình domain, nhớ cập nhật:
- `src/routes/+layout.svelte`: `siteUrl`
- `static/sitemap.xml`: URLs
- `static/robots.txt`: URLs

---

## 📝 Lưu ý quan trọng

### 1. Prerendering

Ứng dụng đã được cấu hình để prerender tất cả các pages (`src/routes/+layout.ts`). Điều này đảm bảo:
- SEO tốt hơn
- Tải trang nhanh hơn
- Hoạt động như một static site

### 2. Environment Variables

Nếu bạn cần sử dụng environment variables:
- Tạo file `.env.production`
- Thêm các biến cần thiết
- Sử dụng `import.meta.env.VITE_*` trong code

**Lưu ý**: Không commit file `.env.production` vào Git!

### 3. Build Output

Sau khi build, thư mục `build/` sẽ chứa:
- `index.html` - Entry point
- `_app/` - SvelteKit app code
- `assets/` - CSS, JS, images
- Các routes khác nếu có

### 4. Cache Headers

Firebase đã được cấu hình với cache headers tối ưu:
- Images: Cache 1 năm
- JS/CSS: Cache 1 năm
- Fonts: Cache 1 năm

---

## 🐛 Troubleshooting

### Lỗi: "Build directory not found"

**Nguyên nhân**: Chưa chạy `npm run build`

**Giải pháp**: Chạy `npm run build` trước khi deploy

### Lỗi: "Firebase project not found"

**Nguyên nhân**: Project ID trong `.firebaserc` không đúng

**Giải pháp**: 
1. Kiểm tra Project ID trên Firebase Console
2. Cập nhật `.firebaserc` với Project ID đúng

### Lỗi: "Permission denied"

**Nguyên nhân**: Chưa đăng nhập hoặc không có quyền

**Giải pháp**: 
1. Chạy `firebase login`
2. Kiểm tra quyền trên Firebase Console

### Build thành công nhưng trang không load

**Nguyên nhân**: Có thể do routing hoặc adapter configuration

**Giải pháp**:
1. Kiểm tra `svelte.config.js` - adapter-static đã được cấu hình đúng
2. Kiểm tra `src/routes/+layout.ts` - prerender = true
3. Kiểm tra console browser để xem lỗi cụ thể

---

## 📚 Tài liệu tham khảo

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [SvelteKit Adapter Static](https://kit.svelte.dev/docs/adapter-static)
- [SvelteKit Prerendering](https://kit.svelte.dev/docs/page-options#prerender)

---

## ✅ Checklist trước khi deploy

- [ ] Đã cài đặt Firebase CLI
- [ ] Đã đăng nhập Firebase (`firebase login`)
- [ ] Đã tạo Firebase project và lưu Project ID
- [ ] Đã cập nhật `.firebaserc` với Project ID đúng
- [ ] Đã cập nhật `src/routes/+layout.svelte` với URL production
- [ ] Đã cập nhật `static/sitemap.xml` với URL production
- [ ] Đã cập nhật `static/robots.txt` với URL production
- [ ] Đã test build local (`npm run build`)
- [ ] Đã test preview local (`npm run preview`)
- [ ] Đã xóa tất cả `console.log` debug
- [ ] Đã kiểm tra responsive trên mobile
- [ ] Đã kiểm tra dark mode
- [ ] Đã test các tính năng chính (upload, edit, export)

---

Chúc bạn deploy thành công! 🎉

