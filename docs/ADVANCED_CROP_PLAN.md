# Kế hoạch: Tính năng Crop ảnh nâng cao

## 🎯 Mục tiêu

Xây dựng tính năng crop ảnh nâng cao với khả năng:
- **Crop nhiều lần**: Không thay thế ảnh, chỉ lưu crop bounds và hiển thị phần crop
- **Chỉnh sửa khung crop**: Có thể quay lại chỉnh sửa crop đã apply
- **Hiển thị phần crop**: Chỉ hiển thị vùng đã crop trên canvas
- **Export với crop**: Export chỉ phần đã crop

---

## 📋 Phân tích hiện trạng

### Workflow hiện tại:
```
Upload → Crop → Apply → Thay thế toàn bộ image bằng cropped image
```

**Vấn đề:**
- Không thể crop lại (đã mất image gốc)
- Không thể chỉnh sửa crop đã apply
- Mỗi lần crop tạo image mới → tốn bộ nhớ

### Workflow mới (mục tiêu):
```
Upload → Crop → Apply → Lưu crop bounds → Hiển thị phần crop
  ↓
Crop lại → Restore crop rect từ bounds → Chỉnh sửa → Apply → Cập nhật bounds
```

**Lợi ích:**
- Có thể crop nhiều lần
- Có thể chỉnh sửa crop đã apply
- Giữ nguyên image gốc → tiết kiệm bộ nhớ
- Export chất lượng cao (từ image gốc)

---

## 🏗️ Kiến trúc mới

### State Management:
```typescript
// Crop bounds (relative to original image dimensions)
let cropBounds: { 
  left: number; 
  top: number; 
  width: number; 
  height: number 
} | null = null;
```

### Image Display:
```
originalImage (full size)
  └─ clipPath: cropBounds (nếu có)
  └─ Hiển thị: Chỉ phần trong cropBounds
```

### Crop Workflow:
```
1. enterCropMode()
   ├─ Nếu có cropBounds: Restore crop rect từ bounds
   └─ Nếu không: Tạo crop rect mới (80% image)

2. User chỉnh sửa crop rect
   ├─ Move, resize, aspect ratio
   └─ Constrain trong image bounds

3. applyCrop()
   ├─ Tính toán crop bounds từ crop rect
   ├─ Lưu crop bounds (không thay thế image)
   ├─ Apply clipPath để hiển thị phần crop
   └─ Re-fit image to canvas

4. enterCropMode() lại
   ├─ Remove clipPath (hiển thị full image)
   └─ Restore crop rect từ bounds
```

---

## 📝 Kế hoạch thực thi

### Phase 1: Thêm Crop Bounds State
**File**: `src/components/CanvasStage.svelte`

**Thay đổi:**
1. Thêm state variable:
   ```typescript
   let cropBounds: { left: number; top: number; width: number; height: number } | null = null;
   ```

2. Reset crop bounds khi load image mới:
   ```typescript
   // Trong loadImageFromUrl()
   cropBounds = null;
   ```

**Kết quả**: Có state để lưu crop bounds

---

### Phase 2: Tạo Helper Functions
**File**: `src/components/CanvasStage.svelte`

**Functions cần tạo:**

1. **`applyCropBoundsToImage(img: FabricImage): void`**
   - Áp dụng clipPath để hiển thị chỉ phần crop
   - Tạo Rect từ cropBounds và set làm clipPath

2. **`removeCropBoundsFromImage(img: FabricImage): void`**
   - Xóa clipPath để hiển thị full image
   - Dùng khi enter crop mode

**Kết quả**: Có functions để quản lý clipPath

---

### Phase 3: Cập nhật enterCropMode()
**File**: `src/components/CanvasStage.svelte`

**Logic mới:**
1. Remove clipPath từ images (hiển thị full image)
2. Tính toán image bounds (luôn dùng original dimensions)
3. Nếu có `cropBounds`:
   - Restore crop rect từ bounds
   - Convert từ original coordinates → display coordinates
4. Nếu không có `cropBounds`:
   - Tạo crop rect mới (80% image)

**Kết quả**: Có thể restore crop rect từ bounds

---

### Phase 4: Cập nhật applyCrop()
**File**: `src/components/CanvasStage.svelte`

**Logic mới:**
1. Tính toán crop bounds từ crop rect
   - Convert từ display coordinates → original coordinates
   - Clamp trong image bounds
2. Lưu crop bounds (không tạo image mới)
3. Exit crop mode
4. Apply clipPath để hiển thị phần crop
5. Re-fit image to canvas

**Kết quả**: Crop không thay thế image, chỉ lưu bounds

---

### Phase 5: Cập nhật loadImageFromUrl()
**File**: `src/components/CanvasStage.svelte`

**Thay đổi:**
- Sau khi load image, apply crop bounds nếu có
- Đảm bảo hiển thị đúng phần crop

**Kết quả**: Image mới load vẫn áp dụng crop bounds

---

### Phase 6: Cập nhật Export Functions
**File**: `src/components/CanvasStage.svelte`

**Functions cần cập nhật:**
1. **`exportImageToCanvas()`**
   - Nếu có cropBounds: Export chỉ phần crop
   - Tính toán canvas size và image position dựa trên cropBounds

2. **`exportImageWithFrame()`**
   - Tương tự, áp dụng cropBounds khi export với frame

**Kết quả**: Export chỉ phần đã crop

---

### Phase 7: Cập nhật constrainCropRect()
**File**: `src/components/CanvasStage.svelte`

**Thay đổi:**
- Luôn constrain trong original image bounds (không phải cropped bounds)
- Tính toán dựa trên original dimensions

**Kết quả**: Crop rect luôn nằm trong image bounds

---

## 🔧 Chi tiết kỹ thuật

### Coordinate System:
- **Original coordinates**: `image.width`, `image.height` (không scale)
- **Display coordinates**: `image.width * scale`, `image.height * scale`
- **Crop bounds**: Luôn lưu trong original coordinates

### Conversion:
```typescript
// Display → Original
originalX = displayX / scale
originalY = displayY / scale

// Original → Display
displayX = originalX * scale
displayY = originalY * scale
```

### ClipPath:
- Fabric.js clipPath sử dụng absolute coordinates
- Cần set `absolutePositioned: true`
- Coordinates relative to image (0,0 là top-left của image)

---

## 🧪 Test Cases

### Test 1: Crop lần đầu
1. Upload image
2. Enter crop mode
3. Chỉnh sửa crop rect
4. Apply crop
5. ✅ Kiểm tra: Chỉ hiển thị phần crop

### Test 2: Crop lại
1. Sau khi apply crop
2. Enter crop mode lại
3. ✅ Kiểm tra: Crop rect được restore từ bounds
4. Chỉnh sửa crop rect
5. Apply crop
6. ✅ Kiểm tra: Crop bounds được cập nhật

### Test 3: Export với crop
1. Apply crop
2. Export image
3. ✅ Kiểm tra: Export chỉ phần crop

### Test 4: Load image mới
1. Apply crop
2. Upload image mới
3. ✅ Kiểm tra: Crop bounds được reset

---

## 📊 Ưu tiên thực thi

1. **Phase 1-2**: Foundation (State + Helpers) - **Quan trọng nhất**
2. **Phase 3-4**: Core logic (Enter + Apply) - **Quan trọng**
3. **Phase 5**: Image loading - **Quan trọng**
4. **Phase 6**: Export - **Quan trọng**
5. **Phase 7**: Constrain - **Cải thiện UX**

---

## 🚨 Lưu ý

1. **Coordinate conversion**: Phải chính xác 100%
2. **ClipPath**: Phải test với nhiều kích thước image
3. **Performance**: ClipPath có thể ảnh hưởng performance, cần test
4. **Export quality**: Đảm bảo export chất lượng cao từ original image

---

## ✅ Checklist

- [ ] Phase 1: Thêm crop bounds state
- [ ] Phase 2: Tạo helper functions
- [ ] Phase 3: Cập nhật enterCropMode()
- [ ] Phase 4: Cập nhật applyCrop()
- [ ] Phase 5: Cập nhật loadImageFromUrl()
- [ ] Phase 6: Cập nhật export functions
- [ ] Phase 7: Cập nhật constrainCropRect()
- [ ] Test: Crop lần đầu
- [ ] Test: Crop lại
- [ ] Test: Export với crop
- [ ] Test: Load image mới

---

## 📚 Tài liệu tham khảo

- Fabric.js clipPath: https://github.com/fabricjs/fabric.js/blob/master/src/shapes/object.class.js
- Coordinate system: Fabric.js uses center-based coordinates by default

