# Kế hoạch: Export với kích thước gốc (High-Resolution Export)

## 🎯 Mục tiêu

Thay đổi workflow để:
- **Apply filters lên image gốc** (full resolution) để có chất lượng tốt nhất
- **Scale down chỉ để hiển thị** trên canvas (performance)
- **Export với kích thước gốc** đã được apply filters (chất lượng cao)

---

## 📋 Phân tích hiện trạng

### Workflow hiện tại:
```
Upload → Check limits → Scale down (nếu cần) → Load vào canvas → 
Apply filters → Export (kích thước đã scale)
```

**Vấn đề:**
- Export ra kích thước đã scale → chất lượng thấp
- Filters được apply trên image đã scale → mất chi tiết

### Workflow mới (mục tiêu):
```
Upload → Check limits → Load image gốc → Apply filters lên image gốc → 
Scale down để hiển thị → Export với image gốc đã filter
```

**Lợi ích:**
- Export chất lượng cao (kích thước gốc)
- Filters được apply với độ phân giải cao → chi tiết tốt hơn
- Preview vẫn nhanh (scale down để hiển thị)

---

## 🏗️ Kiến trúc mới

### Image Management:
```
originalImage: FabricImage (gốc, không add vào canvas)
  └─ Dùng để: Apply filters, Export

displayImage: FabricImage (scaled, add vào canvas)
  └─ Dùng để: Hiển thị trên canvas, Preview filters
```

### Filter Application:
```
User thay đổi filter → 
  ├─ Apply trên displayImage (preview nhanh)
  └─ Apply trên originalImage (background, cho export)
```

---

## 📝 Kế hoạch thực thi

### Phase 1: Refactor Image Management
**File**: `src/components/CanvasStage.svelte`

**Thay đổi:**
1. Thêm state variables:
   ```typescript
   let originalImage: FabricImage | null = null;  // Image gốc
   let displayImage: FabricImage | null = null;    // Image scaled để hiển thị
   let originalImageUrl: string | null = null;   // URL của image gốc
   ```

2. Modify `loadImageFromUrl()`:
   - Load image gốc vào `originalImage` (không add vào canvas)
   - Check limits
   - Nếu cần scale: Tạo `displayImage` từ `originalImage` (scaled)
   - Add `displayImage` vào canvas (không phải `originalImage`)
   - Lưu `originalImageUrl` để dùng cho export

3. Modify `fitImageToCanvas()`:
   - Chỉ apply cho `displayImage`
   - `originalImage` giữ nguyên kích thước gốc

**Output**: Có 2 version image riêng biệt

---

### Phase 2: Dual Filter Application
**File**: `src/lib/canvas/filters.ts`

**Thay đổi:**
1. Modify `applyFilters()`:
   ```typescript
   export function applyFilters(
     image: FabricImage, 
     state: FilterState,
     options?: {
       applyToOriginal?: boolean;  // Nếu true, apply trên originalImage
       originalImage?: FabricImage;  // Reference đến originalImage
     }
   ): void
   ```

2. Logic:
   - Nếu `applyToOriginal === true` và có `originalImage`:
     - Apply filters trên `originalImage` (background)
   - Luôn apply filters trên `displayImage` (preview)

3. Tạo helper function:
   ```typescript
   export function applyFiltersToBoth(
     originalImage: FabricImage,
     displayImage: FabricImage,
     state: FilterState
   ): void {
     // Apply trên displayImage (preview)
     applyFilters(displayImage, state);
     
     // Apply trên originalImage (background, cho export)
     applyFilters(originalImage, state, { 
       applyToOriginal: true 
     });
   }
   ```

**Output**: Filters được apply trên cả 2 version

---

### Phase 3: Update Filter Handlers
**File**: `src/routes/+page.svelte`

**Thay đổi:**
1. Modify `handleFilterChange()`:
   ```typescript
   function handleFilterChange(e: CustomEvent<FilterState>) {
     filterState = e.detail;
     activePresetId = '';
     
     if (currentImage) {
       // Apply trên displayImage (preview nhanh)
       debouncedApplyFilters(currentImage, filterState);
       
       // Apply trên originalImage (background, debounced)
       if (canvasStage?.getOriginalImage()) {
         debouncedApplyFiltersToOriginal(
           canvasStage.getOriginalImage()!,
           filterState
         );
       }
     }
   }
   ```

2. Modify `handlePresetSelect()`:
   - Tương tự, apply trên cả 2 version

3. Tạo debounced function cho originalImage:
   ```typescript
   const debouncedApplyFiltersToOriginal = debounce(
     (originalImage: FabricImage, state: FilterState) => {
       applyFilters(originalImage, state, { applyToOriginal: true });
     },
     300  // Debounce lâu hơn vì image lớn hơn
   );
   ```

**Output**: Filters sync giữa preview và export

---

### Phase 4: High-Resolution Export
**File**: `src/components/CanvasStage.svelte`

**Thay đổi:**
1. Modify `exportImage()`:
   ```typescript
   export function exportImage(format: 'png' | 'jpeg'): string | null {
     // Nếu có originalImage đã filter → export từ đó
     if (originalImage && originalImage.filters && originalImage.filters.length > 0) {
       // Apply filters nếu chưa apply
       originalImage.applyFilters();
       
       // Export với kích thước gốc
       return originalImage.toDataURL({
         format,
         quality: format === 'jpeg' ? 0.95 : 1,
         multiplier: 1  // Không scale
       });
     }
     
     // Fallback: export từ displayImage (như cũ)
     if (displayImage) {
       return displayImage.toDataURL({
         format,
         quality: format === 'jpeg' ? 0.95 : 1,
         multiplier: 1
       });
     }
     
     return null;
   }
   ```

2. Thêm export function:
   ```typescript
   export function getOriginalImage(): FabricImage | null {
     return originalImage;
   }
   
   export function getDisplayImage(): FabricImage | null {
     return displayImage;
   }
   ```

**Output**: Export với kích thước gốc

---

### Phase 5: Handle Limits & Scaling
**File**: `src/components/CanvasStage.svelte` + `src/lib/utils/fabricLimits.ts`

**Thay đổi:**
1. Modify `loadImageFromUrl()`:
   ```typescript
   export async function loadImageFromUrl(url: string, autoScale: boolean = false): Promise<FabricImage> {
     // Load image gốc
     const originalImg = await FabricImage.fromURL(url, ...);
     
     // Check limits
     const limitsCheck = checkImageLimits(originalImg);
     
     // Store original
     originalImage = originalImg;
     originalImageUrl = url;
     
     // Tạo displayImage (scaled nếu cần)
     let displayImg: FabricImage;
     if (limitsCheck.needsScaling) {
       if (autoScale) {
         // Scale down để hiển thị
         displayImg = await createScaledImage(originalImg, limitsCheck.recommendedScale);
       } else {
         // Vẫn scale để hiển thị, nhưng giữ original
         displayImg = await createScaledImage(originalImg, limitsCheck.recommendedScale);
         // Dispatch warning
         dispatch('limitsExceeded', limitsCheck);
       }
     } else {
       // Không cần scale, dùng chung reference
       displayImg = originalImg;
     }
     
     // Add displayImage vào canvas
     displayImage = displayImg;
     fitImageToCanvas(displayImg);
     canvas.add(displayImg);
     // ...
   }
   ```

2. Tạo helper function:
   ```typescript
   async function createScaledImage(
     image: FabricImage,
     scale: number
   ): Promise<FabricImage> {
     // Tạo canvas để scale
     const canvas = document.createElement('canvas');
     const ctx = canvas.getContext('2d');
     
     const newWidth = Math.floor(image.width! * scale);
     const newHeight = Math.floor(image.height! * scale);
     
     canvas.width = newWidth;
     canvas.height = newHeight;
     
     // Draw scaled image
     ctx?.drawImage(image.getElement(), 0, 0, newWidth, newHeight);
     
     // Convert to data URL và load lại
     const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
     return await FabricImage.fromURL(dataUrl);
   }
   ```

**Output**: Original giữ nguyên, display scaled

---

### Phase 6: Frame Synchronization
**File**: `src/lib/frames/frameRenderer.ts` + `src/routes/+page.svelte`

**Thay đổi:**
1. Frame rendering:
   - Render frame dựa trên `displayImage` bounds (cho preview)
   - Khi export: Render frame dựa trên `originalImage` bounds (cho export)

2. Export với frame:
   ```typescript
   export function exportImageWithFrame(format: 'png' | 'jpeg'): string | null {
     if (!originalImage) return null;
     
     // Tạo off-screen canvas với kích thước gốc
     const exportCanvas = document.createElement('canvas');
     exportCanvas.width = originalImage.width!;
     exportCanvas.height = originalImage.height!;
     const ctx = exportCanvas.getContext('2d');
     
     // Draw originalImage đã filter
     originalImage.applyFilters();
     ctx?.drawImage(originalImage.getElement(), 0, 0);
     
     // Render frame trên export canvas (nếu có)
     if (activeFrameId !== 'none' && currentFrameOptions) {
       // Render frame với kích thước gốc
       renderFrameOnCanvas(exportCanvas, originalImage, activeFrameId, currentFrameOptions);
     }
     
     return exportCanvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
   }
   ```

**Output**: Frame sync với image gốc khi export

---

## ⚠️ Thách thức & Giải pháp

### 1. WebGL Limits vẫn áp dụng
**Vấn đề**: Nếu `originalImage` > 16384px, WebGL không thể apply filters

**Giải pháp**:
- **Option A**: Fallback về Canvas2D filters (chậm hơn nhưng không bị giới hạn)
- **Option B**: Tiling approach (chia image thành tiles, apply filters từng phần)
- **Option C**: Chỉ apply filters trên `displayImage` nếu `originalImage` quá lớn

**Khuyến nghị**: Option C (đơn giản nhất, vẫn tốt hơn hiện tại)

### 2. Memory Usage
**Vấn đề**: Lưu 2 version image → memory tăng gấp đôi

**Giải pháp**:
- Lazy load `originalImage` chỉ khi cần export
- Clear `originalImage` khi load image mới
- Monitor memory và warn user nếu quá lớn

### 3. Performance
**Vấn đề**: Apply filters trên image lớn chậm hơn

**Giải pháp**:
- Debounce filter application trên `originalImage` (300-500ms)
- Apply filters trên `displayImage` ngay lập tức (preview)
- Show loading indicator khi đang apply trên `originalImage`

### 4. Filter Synchronization
**Vấn đề**: Cần đảm bảo filters sync giữa 2 version

**Giải pháp**:
- Luôn apply filters trên cả 2 version
- Sử dụng cùng `FilterState` object
- Validate filters đã apply trước khi export

---

## 📊 So sánh Performance

### Hiện tại:
- Load: 1 image (scaled)
- Memory: ~X MB
- Filter apply: 1 lần (trên scaled)
- Export: Kích thước scaled

### Sau khi implement:
- Load: 2 images (original + scaled)
- Memory: ~2X MB
- Filter apply: 2 lần (original debounced, display immediate)
- Export: Kích thước gốc ✅

**Trade-off**: Memory tăng, nhưng export chất lượng cao hơn

---

## ✅ Checklist Implementation

### Phase 1: Image Management
- [ ] Thêm state `originalImage`, `displayImage`, `originalImageUrl`
- [ ] Modify `loadImageFromUrl()` để load cả 2 version
- [ ] Modify `fitImageToCanvas()` chỉ apply cho `displayImage`
- [ ] Test load image với/không scale

### Phase 2: Dual Filter Application
- [ ] Modify `applyFilters()` với options parameter
- [ ] Tạo `applyFiltersToBoth()` helper
- [ ] Test apply filters trên cả 2 version

### Phase 3: Update Filter Handlers
- [ ] Modify `handleFilterChange()` để apply trên cả 2
- [ ] Modify `handlePresetSelect()` để apply trên cả 2
- [ ] Tạo debounced function cho `originalImage`
- [ ] Test filter sync

### Phase 4: High-Resolution Export
- [ ] Modify `exportImage()` để export từ `originalImage`
- [ ] Thêm `getOriginalImage()`, `getDisplayImage()`
- [ ] Test export với kích thước gốc

### Phase 5: Limits & Scaling
- [ ] Modify `loadImageFromUrl()` với scaling logic
- [ ] Tạo `createScaledImage()` helper
- [ ] Test với image lớn (>16384px)

### Phase 6: Frame Synchronization
- [ ] Modify frame rendering để support cả 2 version
- [ ] Modify export để include frame với kích thước gốc
- [ ] Test export với frame

### Testing
- [ ] Test với image nhỏ (<4096px)
- [ ] Test với image vừa (4096-16384px)
- [ ] Test với image lớn (>16384px)
- [ ] Test apply filters và export
- [ ] Test với frame
- [ ] Test memory usage
- [ ] Test performance (filter apply time)

---

## 🎯 Kết quả mong đợi

1. **Export chất lượng cao**: Export với kích thước gốc (không bị scale down)
2. **Preview nhanh**: Vẫn hiển thị image scaled trên canvas
3. **Filters chất lượng**: Filters được apply trên image gốc
4. **User experience tốt**: Preview responsive, export chất lượng

---

## 📝 Notes

1. **WebGL Limits**: Nếu image > 16384px, vẫn cần scale trước khi apply filters. Có thể implement tiling approach sau.

2. **Memory Management**: Cần monitor memory và có cơ chế cleanup khi cần.

3. **Progressive Enhancement**: Có thể implement từng phase, test từng bước.

4. **Backward Compatibility**: Đảm bảo không break existing functionality.

---

## 🚀 Next Steps

Sau khi implement xong, có thể mở rộng:
- **Tiling approach** cho image > 16384px
- **Progressive filter application** (apply filters từng phần)
- **Web Worker** để apply filters trên background thread
- **Image compression** options khi export

