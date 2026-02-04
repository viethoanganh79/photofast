# 📋 Thống kê Logic Xử Lý Tính Năng Crop

## 📦 1. STATE VARIABLES (Biến trạng thái)

### 1.1. Crop Mode State
```typescript
let isCropMode = false;              // Trạng thái đang ở chế độ crop
let cropRect: Rect | null = null;    // Khung crop rectangle trên canvas
let cropAspectRatio: number | null = null;  // Tỷ lệ khung hình (null = tự do)
let gridLines: Line[] = [];          // Các đường grid (rule of thirds)
```

### 1.2. Backup Image State
```typescript
let imageBeforeCrop: FabricImage | null = null;      // Backup FabricImage trước khi crop
let imageBeforeCropUrl: string | null = null;        // Backup URL (dataURL) trước khi crop
let isLoadingFromBackup = false;                     // Flag ngăn xóa backup khi đang load từ backup
```

---

## 🔧 2. EXPORTED FUNCTIONS (Hàm công khai)

### 2.1. `enterCropMode(aspectRatio: number | null = null): Promise<void>`
**Mục đích**: Vào chế độ crop mode

**Logic xử lý**:
1. **Kiểm tra backup tồn tại**:
   - Nếu có `imageBeforeCropUrl` → Restore backup image (crop lại lần 2+)
     - Set `isLoadingFromBackup = true`
     - Load từ `imageBeforeCropUrl` với `autoScale = false` (skip optimization)
     - Reset `isLoadingFromBackup = false`
   - Nếu chưa có → Tạo backup (lần đầu crop)
     - Export `displayImage` hiện tại ra canvas
     - Tạo dataURL từ canvas
     - Load thành `FabricImage` và lưu vào `imageBeforeCrop` và `imageBeforeCropUrl`
     - Cũng lưu vào `originalImage` và `originalImageUrl` để consistency

2. **Khởi tạo crop mode**:
   - Set `isCropMode = true`
   - Set `cropAspectRatio = aspectRatio`
   - Enable canvas selection

3. **Tính toán kích thước crop rect ban đầu**:
   - Lấy bounds của `displayImage`
   - Crop rect = 80% kích thước image
   - Nếu có `aspectRatio` → điều chỉnh để đúng tỷ lệ

4. **Tạo crop rectangle**:
   - Tạo `Rect` với style xanh lá (#22c55e)
   - Có corner controls (8 điểm: tl, tr, bl, br, ml, mr, mt, mb)
   - Lock rotation
   - Đặt ở giữa image

5. **Tạo grid lines** (rule of thirds):
   - 4 đường: 2 dọc, 2 ngang
   - Chia crop rect thành 9 phần bằng nhau

6. **Thêm event listeners**:
   - `moving`: Constrain + update grid
   - `scaling`: Constrain + update grid + maintain aspect ratio
   - `modified`: Update grid

7. **Dispatch event**: `cropModeChange(true)`

**Vị trí code**: ```1044:1203:src/components/CanvasStage.svelte```

---

### 2.2. `applyCrop(): Promise<void>`
**Mục đích**: Áp dụng crop và tạo image mới từ vùng đã crop

**Logic xử lý**:
1. **Lấy crop bounds**:
   - Tính toán vị trí và kích thước crop rect trong canvas coordinates
   - Convert sang original image coordinates (chia cho scale)

2. **Tạo temporary canvas**:
   - Kích thước = kích thước crop region
   - Draw phần crop từ image element vào canvas

3. **Export cropped image**:
   - Export canvas thành dataURL (PNG)

4. **Exit crop mode**:
   - Gọi `exitCropMode()` để cleanup

5. **Load cropped image**:
   - Load dataURL mới vào canvas (thay thế image cũ)
   - **Lưu ý**: Backup KHÔNG bị xóa → cho phép crop lại

**Vị trí code**: ```1345:1394:src/components/CanvasStage.svelte```

---

### 2.3. `exitCropMode(): void`
**Mục đích**: Thoát khỏi crop mode (cancel hoặc sau khi apply)

**Logic xử lý**:
1. Remove grid lines
2. Remove crop rect khỏi canvas
3. Set `isCropMode = false`
4. Set `cropAspectRatio = null`
5. **Lưu ý**: Backup KHÔNG bị xóa (để có thể crop lại)
6. Disable canvas selection
7. Dispatch event: `cropModeChange(false)`

**Vị trí code**: ```1396:1420:src/components/CanvasStage.svelte```

---

### 2.4. `updateCropAspectRatio(aspectRatio: number | null): void`
**Mục đích**: Cập nhật tỷ lệ khung hình crop

**Logic xử lý**:
1. Set `cropAspectRatio = aspectRatio`
2. Nếu có aspect ratio:
   - Tính lại height dựa trên width hiện tại
   - Update `scaleY` của crop rect
   - Constrain lại để đảm bảo trong bounds
3. Request render

**Vị trí code**: ```1325:1343:src/components/CanvasStage.svelte```

---

### 2.5. `getImageBeforeCrop(): FabricImage | null`
**Mục đích**: Lấy backup image (nếu cần restore)

**Vị trí code**: ```1422:1425:src/components/CanvasStage.svelte```

---

### 2.6. `getImageBeforeCropUrl(): string | null`
**Mục đích**: Lấy backup URL (nếu cần restore)

**Vị trí code**: ```1427:1429:src/components/CanvasStage.svelte```

---

### 2.7. `isInCropMode(): boolean`
**Mục đích**: Kiểm tra có đang ở crop mode không

**Vị trí code**: ```1431:1434:src/components/CanvasStage.svelte```

---

## 🔒 3. INTERNAL FUNCTIONS (Hàm nội bộ)

### 3.1. `createGridLines(): void`
**Mục đích**: Tạo grid lines (rule of thirds)

**Logic**:
- Remove grid lines cũ
- Tạo 4 `Line` objects (2 dọc, 2 ngang)
- Style: trắng mờ, không selectable, không evented
- Gọi `updateGridLines()` để đặt vị trí

**Vị trí code**: ```1205:1228:src/components/CanvasStage.svelte```

---

### 3.2. `updateGridLines(): void`
**Mục đích**: Cập nhật vị trí grid lines theo crop rect

**Logic**:
- Tính toán 1/3 và 2/3 của width/height
- Đặt vị trí 4 đường:
  - Vertical line 1: 1/3 từ trái
  - Vertical line 2: 2/3 từ trái
  - Horizontal line 1: 1/3 từ trên
  - Horizontal line 2: 2/3 từ trên
- Bring crop rect to front

**Vị trí code**: ```1230:1278:src/components/CanvasStage.svelte```

---

### 3.3. `removeGridLines(): void`
**Mục đích**: Xóa grid lines khỏi canvas

**Logic**:
- Loop qua `gridLines` array
- Remove từng line khỏi canvas
- Clear array

**Vị trí code**: ```1280:1288:src/components/CanvasStage.svelte```

---

### 3.4. `constrainCropRect(): void`
**Mục đích**: Giới hạn crop rect trong bounds của image

**Logic**:
1. Tính toán image bounds:
   - `imgWidth = image.width * image.scaleX`
   - `imgHeight = image.height * image.scaleY`
   - `imgLeft = image.left - imgWidth/2`
   - `imgTop = image.top - imgHeight/2`

2. Tính toán crop rect size:
   - `cropWidth = cropRect.width * cropRect.scaleX`
   - `cropHeight = cropRect.height * cropRect.scaleY`

3. Constrain position:
   - `left = max(imgLeft, min(left, imgLeft + imgWidth - cropWidth))`
   - `top = max(imgTop, min(top, imgTop + imgHeight - cropHeight))`

4. Update crop rect position

**Vị trí code**: ```1290:1311:src/components/CanvasStage.svelte```

---

### 3.5. `maintainAspectRatio(): void`
**Mục đích**: Duy trì tỷ lệ khung hình khi scale crop rect

**Logic**:
- Nếu có `cropAspectRatio`:
  - Tính `height = width / aspectRatio`
  - Update `scaleY` của crop rect

**Vị trí code**: ```1313:1323:src/components/CanvasStage.svelte```

---

## 🔄 4. INTEGRATION WITH OTHER FUNCTIONS

### 4.1. `loadImageFromUrl()` - Backup Management
**Logic**:
- Khi load image mới (upload):
  - Nếu `!isLoadingFromBackup && url !== imageBeforeCropUrl`:
    - Clear backup (`imageBeforeCrop = null`, `imageBeforeCropUrl = null`)
- Khi load từ backup:
  - `isLoadingFromBackup = true` → Backup không bị xóa

**Vị trí code**: ```199:204:src/components/CanvasStage.svelte```

---

## 📊 5. EVENT FLOW (Luồng sự kiện)

### 5.1. Enter Crop Mode Flow
```
User clicks Crop button
  ↓
handleCropStart() in +page.svelte
  ↓
canvasStage.enterCropMode(aspectRatio)
  ↓
Check backup exists?
  ├─ YES → Load backup image (isLoadingFromBackup = true)
  └─ NO → Create backup from displayImage
  ↓
Create crop rect (80% of image)
  ↓
Create grid lines
  ↓
Add event listeners (moving, scaling, modified)
  ↓
Dispatch 'cropModeChange' event (true)
```

### 5.2. Crop Interaction Flow
```
User moves/scales crop rect
  ↓
cropRect.on('moving') or cropRect.on('scaling')
  ↓
constrainCropRect() → Keep rect within image bounds
  ↓
updateGridLines() → Update grid position
  ↓
If scaling + has aspectRatio → maintainAspectRatio()
  ↓
canvas.requestRenderAll()
```

### 5.3. Apply Crop Flow
```
User clicks Apply
  ↓
handleCropApply() in +page.svelte
  ↓
canvasStage.applyCrop()
  ↓
Calculate crop bounds (convert to original image coords)
  ↓
Create temp canvas → Draw cropped region
  ↓
Export to dataURL
  ↓
exitCropMode() → Cleanup UI
  ↓
loadImageFromUrl(croppedDataUrl) → Load new image
  ↓
Backup still exists → Can crop again
```

### 5.4. Cancel Crop Flow
```
User clicks Cancel
  ↓
handleCropCancel() in +page.svelte
  ↓
canvasStage.exitCropMode()
  ↓
Remove grid lines + crop rect
  ↓
Backup still exists → Can crop again
```

---

## 🎯 6. KEY DESIGN DECISIONS

### 6.1. Backup Strategy
- **Tạo backup khi**: Lần đầu vào crop mode
- **Giữ backup khi**: 
  - Apply crop (để có thể crop lại)
  - Cancel crop (để có thể crop lại)
- **Xóa backup khi**: 
  - Upload image mới
  - Load image mới (không phải từ backup)

### 6.2. Crop Multiple Times
- Backup được giữ lại sau khi apply crop
- Khi vào crop mode lần 2+, restore từ backup
- Cho phép crop nhiều lần trên cùng một image gốc

### 6.3. Coordinate System
- **Canvas coordinates**: Dùng cho crop rect (có scale)
- **Original image coordinates**: Dùng khi apply crop (chia cho scale)
- Conversion: `originalCoord = canvasCoord / imageScale`

### 6.4. Grid Lines
- Rule of thirds (chia 9 phần)
- Update realtime khi crop rect thay đổi
- Không selectable, không evented
- Excluded from export

---

## 🐛 7. POTENTIAL ISSUES & EDGE CASES

### 7.1. Image Scale
- Crop rect tính toán dựa trên `displayImage.scaleX/scaleY`
- Khi apply crop, convert về original coordinates
- **Cần đảm bảo**: Scale conversion chính xác

### 7.2. Backup Loading
- Khi load từ backup, có thể bị optimize lại
- **Giải pháp**: `autoScale = false` và `isLoadingFromBackup = true`

### 7.3. Memory Management
- Backup image được lưu trong memory
- **Lưu ý**: Có thể tốn memory với image lớn
- **Giải pháp**: Chỉ lưu dataURL, load khi cần

### 7.4. Crop Rect Bounds
- Crop rect có thể bị scale ra ngoài image bounds
- **Giải pháp**: `constrainCropRect()` được gọi trong events

---

## 📝 8. TODO / IMPROVEMENTS

1. **Undo/Redo**: Có thể thêm undo/redo cho crop operations
2. **Crop Presets**: Lưu các crop presets phổ biến
3. **Crop History**: Lưu lịch sử các lần crop
4. **Memory Optimization**: Optimize cách lưu backup (chỉ lưu URL, load khi cần)
5. **Better Grid**: Thêm các grid options khác (golden ratio, etc.)

---

## 📚 9. RELATED FILES

- **CanvasStage.svelte**: Main crop logic
- **+page.svelte**: UI handlers (`handleCropStart`, `handleCropApply`, etc.)
- **CropTool.svelte**: Crop UI component (nếu có)

---

**Tài liệu được tạo tự động từ code analysis**
**Cập nhật lần cuối**: 2024

