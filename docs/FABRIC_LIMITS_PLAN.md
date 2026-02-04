# Kế hoạch kiểm tra giới hạn Fabric.js

## 📋 Tổng quan các giới hạn

### 1. WebGL Texture Size Limit
- **Nguồn**: `gl.getParameter(gl.MAX_TEXTURE_SIZE)` từ WebGL context
- **Giá trị phổ biến**: 16384 (có thể khác tùy GPU/browser)
- **Vị trí trong fabric.js**: `WebGLProbe.maxTextureSize`
- **Ảnh hưởng**: Khi apply filters, nếu image > maxTextureSize sẽ gây lỗi

### 2. Config Limits (fabric.js)
- **`perfLimitSizeTotal`**: 2097152 (2MB pixels) - Tổng số pixels tối đa cho cache
- **`maxCacheSideLimit`**: 4096 - Width/height tối đa cho cache canvas
- **`minCacheSideLimit`**: 256 - Width/height tối thiểu cho cache
- **`textureSize`**: 4096 - Default texture size cho WebGL backend

### 3. Browser Canvas Limits
- **Canvas size limit**: Thường là 16384x16384 hoặc nhỏ hơn tùy browser
- **Memory limits**: Tùy browser và device

---

## 🎯 Kế hoạch thực thi

### Phase 1: Tạo utility kiểm tra giới hạn
**File**: `src/lib/utils/fabricLimits.ts`

**Chức năng**:
1. **`getWebGLMaxTextureSize()`**: Query WebGL context để lấy max texture size
2. **`getFabricConfigLimits()`**: Lấy các config limits từ fabric.js config
3. **`checkImageLimits(image: FabricImage)`**: Check xem image có vượt quá các limits không
4. **`getRecommendedMaxSize()`**: Trả về kích thước tối đa được khuyến nghị

**Return type**:
```typescript
interface ImageLimitsCheck {
  width: number;
  height: number;
  totalPixels: number;
  
  // WebGL limits
  webglMaxTextureSize: number | null;
  exceedsWebGLTexture: boolean;
  
  // Fabric config limits
  fabricMaxCacheSide: number;
  fabricPerfLimitTotal: number;
  exceedsFabricCache: boolean;
  
  // Recommendations
  recommendedMaxWidth: number;
  recommendedMaxHeight: number;
  needsScaling: boolean;
  recommendedScale: number;
}
```

### Phase 2: Tích hợp vào CanvasStage
**File**: `src/components/CanvasStage.svelte`

**Thay đổi**:
1. Import utility từ `fabricLimits.ts`
2. Trong `loadImageFromUrl()`:
   - Sau khi load image, gọi `checkImageLimits()`
   - Nếu `needsScaling === true`:
     - Hiển thị warning/notification cho user
     - Tự động scale down image nếu vượt quá limits
     - Hoặc cho user chọn: scale tự động hoặc giữ nguyên (có thể lỗi)

### Phase 3: UI Notification (Optional)
**File**: `src/components/LimitWarning.svelte` (nếu cần)

**Chức năng**:
- Hiển thị warning khi image vượt quá limits
- Cho phép user chọn:
  - Scale tự động về kích thước an toàn
  - Giữ nguyên (có thể gây lỗi khi apply filters)

---

## 🔧 Implementation Details

### 1. Query WebGL Max Texture Size
```typescript
function getWebGLMaxTextureSize(): number | null {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) return null;
  
  const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return maxSize;
}
```

### 2. Get Fabric Config
```typescript
import { config } from 'fabric';

function getFabricConfigLimits() {
  return {
    maxCacheSide: config.maxCacheSideLimit,
    perfLimitTotal: config.perfLimitSizeTotal,
    textureSize: config.textureSize,
  };
}
```

### 3. Check Image Limits
```typescript
function checkImageLimits(image: FabricImage): ImageLimitsCheck {
  const width = image.width || 0;
  const height = image.height || 0;
  const totalPixels = width * height;
  
  const webglMax = getWebGLMaxTextureSize();
  const fabricConfig = getFabricConfigLimits();
  
  const exceedsWebGL = webglMax ? (width > webglMax || height > webglMax) : false;
  const exceedsFabricCache = 
    width > fabricConfig.maxCacheSide || 
    height > fabricConfig.maxCacheSide ||
    totalPixels > fabricConfig.perfLimitTotal;
  
  // Calculate recommended max size (take the most restrictive)
  const maxDimension = Math.min(
    webglMax || Infinity,
    fabricConfig.maxCacheSide,
    Math.floor(Math.sqrt(fabricConfig.perfLimitTotal))
  );
  
  const needsScaling = exceedsWebGL || exceedsFabricCache;
  const recommendedScale = needsScaling 
    ? Math.min(maxDimension / width, maxDimension / height)
    : 1;
  
  return {
    width,
    height,
    totalPixels,
    webglMaxTextureSize: webglMax,
    exceedsWebGLTexture: exceedsWebGL,
    fabricMaxCacheSide: fabricConfig.maxCacheSide,
    fabricPerfLimitTotal: fabricConfig.perfLimitTotal,
    exceedsFabricCache,
    recommendedMaxWidth: maxDimension,
    recommendedMaxHeight: maxDimension,
    needsScaling,
    recommendedScale,
  };
}
```

### 4. Auto-scale Image (nếu cần)
```typescript
async function scaleImageToLimits(
  image: FabricImage,
  limits: ImageLimitsCheck
): Promise<FabricImage> {
  if (!limits.needsScaling) return image;
  
  const newWidth = Math.floor(image.width! * limits.recommendedScale);
  const newHeight = Math.floor(image.height! * limits.recommendedScale);
  
  // Use fabric.js Resize filter or create new image from scaled canvas
  // Implementation depends on fabric.js v6 API
}
```

---

## 📝 Notes

1. **WebGL Probe**: Fabric.js đã có `WebGLProbe` nhưng nó chỉ được query khi cần. Chúng ta có thể query sớm hơn để check limits.

2. **Performance**: Query WebGL context có thể tốn một chút thời gian, nên cache kết quả.

3. **User Experience**: 
   - Nếu image quá lớn, nên thông báo rõ ràng cho user
   - Cho phép user chọn: scale tự động hoặc giữ nguyên (risk)

4. **Browser Differences**: 
   - Một số browser có thể có limits khác nhau
   - Mobile devices thường có limits thấp hơn

---

## ✅ Checklist

- [ ] Tạo `src/lib/utils/fabricLimits.ts`
- [ ] Implement `getWebGLMaxTextureSize()`
- [ ] Implement `getFabricConfigLimits()`
- [ ] Implement `checkImageLimits()`
- [ ] Implement `getRecommendedMaxSize()`
- [ ] Tích hợp vào `CanvasStage.svelte`
- [ ] Test với image lớn (>16384px)
- [ ] Test với image vừa (4096-16384px)
- [ ] Test với image nhỏ (<4096px)
- [ ] (Optional) Tạo UI notification component

