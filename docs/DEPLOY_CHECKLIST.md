# 🚀 PhotoFast - Checklist Deploy

Tài liệu này liệt kê tất cả các file và vị trí cần thay đổi khi deploy ứng dụng lên production.

---

## 📋 Thông tin cần chuẩn bị

Trước khi deploy, hãy chuẩn bị các thông tin sau:

| Thông tin | Ví dụ | Ghi chú |
|-----------|-------|---------|
| Domain chính | `https://photofast.app` | Không có `/` ở cuối |
| Tên tác giả | `Tran Anh Hoang Viet` | Tên đầy đủ |
| Twitter handle | `@photofast` | Nếu có |
| Số tài khoản ngân hàng | `666688886124` | Cho nút donate |

---

## 📁 Các file cần thay đổi

### 1. `src/routes/+layout.svelte`

**Dòng 9:** Thay đổi URL website
```typescript
const siteUrl = 'https://photofast.app'; // ⚠️ Thay đổi thành URL thật
```

**Dòng 11:** Tên tác giả (nếu cần)
```typescript
const siteAuthor = 'Tran Anh Hoang Viet';
```

**Dòng 49-50:** Twitter handles (nếu có)
```html
<meta name="twitter:site" content="@photofast" />
<meta name="twitter:creator" content="@photofast" />
```

---

### 2. `static/sitemap.xml`

**Dòng 5:** Thay đổi URL
```xml
<loc>https://photofast.app/</loc>
```

**Dòng 10:** Thay đổi URL ảnh
```xml
<image:loc>https://photofast.app/og-image.svg</image:loc>
```

---

### 3. `static/robots.txt`

**Dòng 2:** Thay đổi URL (comment)
```
# https://photofast.app
```

**Dòng 7:** Thay đổi URL sitemap
```
Sitemap: https://photofast.app/sitemap.xml
```

---

### 4. `static/manifest.json`

**Không cần thay đổi** - Manifest sử dụng đường dẫn tương đối.

Tuy nhiên, nếu muốn thêm `id` cho PWA:
```json
{
  "id": "https://photofast.app/",
  ...
}
```

---

### 5. `src/routes/+page.svelte`

**Dòng ~353:** Số tài khoản ngân hàng (trong popup donate)
```svelte
<button 
    class="bank-value copyable" 
    on:click={() => navigator.clipboard.writeText('666688886124')}
>
    666688886124
```

**Dòng ~345-349:** Thông tin ngân hàng
```svelte
<span class="bank-value">Techcombank</span>
...
<span class="bank-value">TRAN ANH HOANG VIET</span>
```

---

## 🖼️ Assets cần chuẩn bị (Tùy chọn)

Nếu muốn sử dụng ảnh PNG thay vì SVG cho tương thích tốt hơn:

| File | Kích thước | Định dạng |
|------|------------|-----------|
| `og-image.png` | 1200x630 | PNG |
| `apple-touch-icon.png` | 180x180 | PNG |
| `icon-192.png` | 192x192 | PNG |
| `icon-512.png` | 512x512 | PNG |

**Lưu ý:** Nếu chuyển sang PNG, cần cập nhật:
- `+layout.svelte`: `const siteImage = '/og-image.png';`
- `manifest.json`: Thay đổi `type` từ `image/svg+xml` sang `image/png`

---

## ✅ Checklist trước khi deploy

- [ ] Đã thay đổi URL trong `+layout.svelte`
- [ ] Đã thay đổi URL trong `sitemap.xml`
- [ ] Đã thay đổi URL trong `robots.txt`
- [ ] Đã cập nhật thông tin ngân hàng (nếu cần)
- [ ] Đã cập nhật Twitter handles (nếu có)
- [ ] Đã test trên localhost
- [ ] Đã build production: `npm run build`
- [ ] Đã preview build: `npm run preview`

---

## 🔧 Lệnh deploy

```bash
# Build production
npm run build

# Preview trước khi deploy
npm run preview

# Deploy (tùy platform)
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# Cloudflare Pages
wrangler pages deploy build
```

---

## 🧪 Kiểm tra sau deploy

1. **SEO Check:**
   - https://www.opengraph.xyz/ - Kiểm tra OG tags
   - https://cards-dev.twitter.com/validator - Kiểm tra Twitter Card
   - https://search.google.com/test/rich-results - Kiểm tra Structured Data

2. **Performance:**
   - https://pagespeed.web.dev/ - Google PageSpeed
   - https://gtmetrix.com/ - GTmetrix

3. **PWA:**
   - Chrome DevTools → Application → Manifest
   - https://www.pwabuilder.com/ - PWA Builder

---

## 📝 Ghi chú thêm

- File `qr-bank.jpg` trong thư mục `static/` là QR code chuyển khoản
- Để thay đổi QR, chỉ cần thay file này (giữ nguyên tên)
- Dark mode preference được lưu trong `localStorage` với key `photofast-theme`

---

*Cập nhật lần cuối: 23/12/2025*

