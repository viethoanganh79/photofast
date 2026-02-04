# Kế hoạch: Tính năng lưu Preset tùy chỉnh

## 🎯 Mục tiêu

Cho phép user:
- **Lưu thông số filter hiện tại** thành preset tùy chỉnh
- **Quản lý preset của mình** (xem, xóa, đổi tên)
- **Load lại preset đã lưu** để sử dụng
- **Preset được lưu trong localStorage** (persist giữa các sessions)

---

## 📋 Phân tích hiện trạng

### Preset hiện tại:
- **Nguồn**: Hard-coded trong `src/lib/presets/presets.ts`
- **Storage**: Không có persistence
- **UI**: Chỉ hiển thị preset mặc định
- **Quản lý**: Không có chức năng quản lý preset

### Cần thêm:
- **Custom Presets**: Preset do user tạo
- **LocalStorage**: Lưu preset vào browser storage
- **UI Components**: Button lưu, modal quản lý preset
- **CRUD Operations**: Create, Read, Update, Delete preset

---

## 🏗️ Kiến trúc mới

### Storage Structure:
```typescript
// localStorage key: 'photofast-custom-presets'
interface CustomPresetsStorage {
  presets: CustomPreset[];
  version: string; // Để migrate sau này
}

interface CustomPreset extends Preset {
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
  isCustom: true; // Flag để phân biệt với preset mặc định
}
```

### Preset Management:
```
Default Presets (hard-coded)
  └─ Không thể xóa/sửa

Custom Presets (localStorage)
  └─ Có thể xóa/sửa/đổi tên
```

---

## 📝 Kế hoạch thực thi

### Phase 1: Storage & Data Management
**File**: `src/lib/presets/customPresets.ts`

**Chức năng**:
1. **`loadCustomPresets()`**: Load preset từ localStorage
2. **`saveCustomPreset(preset: CustomPreset)`**: Lưu preset mới
3. **`updateCustomPreset(id: string, updates: Partial<CustomPreset>)`**: Update preset
4. **`deleteCustomPreset(id: string)`**: Xóa preset
5. **`getAllPresets()`**: Merge default + custom presets
6. **`exportPreset(preset: CustomPreset)`**: Export preset thành JSON (backup)
7. **`importPreset(json: string)`**: Import preset từ JSON

**Storage Key**: `photofast-custom-presets`

**Return type**:
```typescript
export interface CustomPreset extends Preset {
  createdAt: number;
  updatedAt: number;
  isCustom: true;
}

export interface PresetsStorage {
  presets: CustomPreset[];
  version: '1.0';
}
```

**Output**: Có thể CRUD preset trong localStorage

---

### Phase 2: Save Preset UI Component
**File**: `src/components/SavePresetModal.svelte`

**Chức năng**:
- Modal để nhập tên preset
- Chọn emoji (optional)
- Nhập mô tả (optional)
- Button "Lưu" và "Hủy"

**UI Elements**:
- Input: Tên preset (required)
- Emoji picker: Chọn emoji (default: 💾)
- Textarea: Mô tả (optional)
- Buttons: Lưu / Hủy

**Events**:
- `save: { name, emoji, description, filters }`
- `cancel: void`

**Output**: Modal để lưu preset

---

### Phase 3: Preset Management UI
**File**: `src/components/PresetManager.svelte`

**Chức năng**:
- Hiển thị danh sách custom presets
- Actions: Edit, Delete, Export
- Context menu hoặc dropdown cho mỗi preset

**UI Elements**:
- List custom presets
- Edit button (đổi tên, emoji, mô tả)
- Delete button (với confirmation)
- Export button (download JSON)

**Events**:
- `edit: { presetId }`
- `delete: { presetId }`
- `export: { presetId }`

**Output**: UI để quản lý preset

---

### Phase 4: Update PresetPanel
**File**: `src/components/PresetPanel.svelte`

**Thay đổi**:
1. Load cả default và custom presets
2. Hiển thị custom presets với indicator (icon khác)
3. Thêm button "Lưu preset" ở header
4. Context menu cho custom presets (edit/delete)

**UI Changes**:
- Thêm button "💾 Lưu preset" ở header
- Custom preset có icon "⭐" hoặc badge "Custom"
- Hover trên custom preset → hiển thị menu (edit/delete)

**Output**: PresetPanel hiển thị cả default và custom

---

### Phase 5: Integrate vào +page.svelte
**File**: `src/routes/+page.svelte`

**Thay đổi**:
1. Load custom presets khi mount
2. Handle save preset event
3. Handle edit/delete preset events
4. Update `activePresetId` khi preset được chọn

**State**:
```typescript
let customPresets: CustomPreset[] = [];
let showSavePresetModal = false;
let showPresetManager = false;
```

**Handlers**:
- `handleSavePreset()`: Mở modal lưu preset
- `handlePresetSaved()`: Lưu preset và refresh list
- `handlePresetDeleted()`: Xóa preset và refresh list
- `handlePresetEdited()`: Update preset và refresh list

**Output**: Tích hợp đầy đủ vào app

---

### Phase 6: Export/Import Preset
**File**: `src/lib/presets/presetIO.ts`

**Chức năng**:
1. **`exportPresetToJSON(preset: CustomPreset)`**: Convert preset thành JSON string
2. **`importPresetFromJSON(json: string)`**: Parse JSON và validate
3. **`downloadPresetFile(preset: CustomPreset)`**: Download preset file
4. **`importPresetFromFile(file: File)`**: Import từ file

**Format**:
```json
{
  "version": "1.0",
  "preset": {
    "id": "custom-1234567890",
    "name": "My Custom Preset",
    "emoji": "💾",
    "description": "My favorite settings",
    "filters": { ... },
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
}
```

**Output**: Có thể export/import preset

---

## 🎨 UI Design

### Save Preset Modal:
```
┌─────────────────────────────┐
│  💾 Lưu Preset              │
├─────────────────────────────┤
│  Tên preset:                │
│  [________________]         │
│                             │
│  Emoji: [💾 ▼]             │
│                             │
│  Mô tả (tùy chọn):         │
│  [________________]         │
│  [________________]         │
│                             │
│  [Hủy]  [💾 Lưu]           │
└─────────────────────────────┘
```

### Preset Panel với Custom:
```
┌─────────────────────────────┐
│  ✨ Presets  [+ Lưu preset] │
├─────────────────────────────┤
│  📷 Original                │
│  🌈 Vivid                   │
│  🌅 Warm                    │
│  ...                        │
│  ─────────────────────      │
│  ⭐ My Preset 1  [⋮]       │
│  ⭐ Custom Warm  [⋮]       │
└─────────────────────────────┘
```

### Context Menu (hover trên custom preset):
```
┌─────────────────┐
│  ✏️ Đổi tên     │
│  🗑️ Xóa         │
│  📥 Export      │
└─────────────────┘
```

---

## 🔧 Implementation Details

### 1. Custom Presets Storage
```typescript
// src/lib/presets/customPresets.ts

const STORAGE_KEY = 'photofast-custom-presets';
const STORAGE_VERSION = '1.0';

export interface CustomPreset extends Preset {
  createdAt: number;
  updatedAt: number;
  isCustom: true;
}

export interface PresetsStorage {
  presets: CustomPreset[];
  version: string;
}

export function loadCustomPresets(): CustomPreset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const data: PresetsStorage = JSON.parse(stored);
    if (data.version !== STORAGE_VERSION) {
      // Migrate if needed
      return migratePresets(data);
    }
    
    return data.presets || [];
  } catch (error) {
    console.error('Failed to load custom presets:', error);
    return [];
  }
}

export function saveCustomPreset(preset: CustomPreset): void {
  const presets = loadCustomPresets();
  const existingIndex = presets.findIndex(p => p.id === preset.id);
  
  if (existingIndex >= 0) {
    // Update existing
    presets[existingIndex] = {
      ...preset,
      updatedAt: Date.now(),
    };
  } else {
    // Add new
    presets.push({
      ...preset,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  
  const storage: PresetsStorage = {
    presets,
    version: STORAGE_VERSION,
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

export function deleteCustomPreset(id: string): void {
  const presets = loadCustomPresets();
  const filtered = presets.filter(p => p.id !== id);
  
  const storage: PresetsStorage = {
    presets: filtered,
    version: STORAGE_VERSION,
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

export function getAllPresets(): Preset[] {
  const defaultPresets = presets; // From presets.ts
  const customPresets = loadCustomPresets();
  
  return [...defaultPresets, ...customPresets];
}
```

### 2. Generate Preset ID
```typescript
function generatePresetId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### 3. Create Preset from Current State
```typescript
export function createPresetFromState(
  name: string,
  emoji: string,
  description: string,
  filters: FilterState
): CustomPreset {
  return {
    id: generatePresetId(),
    name,
    emoji,
    description,
    filters: { ...filters }, // Deep copy
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCustom: true,
  };
}
```

### 4. Validate Preset
```typescript
export function validatePreset(preset: any): preset is CustomPreset {
  return (
    preset &&
    typeof preset.id === 'string' &&
    typeof preset.name === 'string' &&
    typeof preset.emoji === 'string' &&
    typeof preset.filters === 'object' &&
    preset.isCustom === true
  );
}
```

---

## ⚠️ Edge Cases & Considerations

### 1. Preset Name Duplication
**Vấn đề**: User có thể tạo preset trùng tên

**Giải pháp**:
- Cho phép trùng tên (ID là unique)
- Hoặc tự động thêm số: "My Preset (1)", "My Preset (2)"
- Hoặc warning khi trùng tên

**Khuyến nghị**: Cho phép trùng tên, dùng ID để phân biệt

### 2. LocalStorage Limits
**Vấn đề**: LocalStorage có giới hạn ~5-10MB

**Giải pháp**:
- Giới hạn số lượng preset (ví dụ: max 50)
- Compress preset data nếu cần
- Warn user khi gần đạt limit

**Khuyến nghị**: Giới hạn 50 presets, mỗi preset ~5-10KB → tổng ~500KB (an toàn)

### 3. Preset Migration
**Vấn đề**: Cấu trúc preset có thể thay đổi trong tương lai

**Giải pháp**:
- Version trong storage
- Migration function khi version khác
- Fallback về default nếu migration fail

### 4. Browser Compatibility
**Vấn đề**: LocalStorage không available trong một số trường hợp

**Giải pháp**:
- Check `typeof localStorage !== 'undefined'`
- Fallback về in-memory storage
- Warn user nếu không thể lưu

### 5. Preset Export/Import
**Vấn đề**: User muốn backup/restore preset

**Giải pháp**:
- Export preset thành JSON file
- Import từ JSON file
- Validate format khi import

---

## 📊 Data Flow

### Save Preset Flow:
```
User clicks "Lưu preset"
  → Open SavePresetModal
  → User enters name/emoji/description
  → Click "Lưu"
  → createPresetFromState()
  → saveCustomPreset()
  → Update localStorage
  → Refresh PresetPanel
  → Close modal
```

### Load Preset Flow:
```
App mounts
  → loadCustomPresets()
  → getAllPresets() (merge default + custom)
  → Update PresetPanel
  → User selects preset
  → Apply filters
```

### Delete Preset Flow:
```
User clicks delete on custom preset
  → Show confirmation dialog
  → Confirm
  → deleteCustomPreset()
  → Update localStorage
  → Refresh PresetPanel
```

---

## ✅ Checklist Implementation

### Phase 1: Storage & Data Management
- [ ] Tạo `src/lib/presets/customPresets.ts`
- [ ] Implement `loadCustomPresets()`
- [ ] Implement `saveCustomPreset()`
- [ ] Implement `deleteCustomPreset()`
- [ ] Implement `updateCustomPreset()`
- [ ] Implement `getAllPresets()`
- [ ] Implement `generatePresetId()`
- [ ] Implement `createPresetFromState()`
- [ ] Implement `validatePreset()`
- [ ] Test localStorage operations

### Phase 2: Save Preset UI
- [ ] Tạo `src/components/SavePresetModal.svelte`
- [ ] Input: Tên preset (required)
- [ ] Emoji picker/input
- [ ] Textarea: Mô tả
- [ ] Buttons: Lưu / Hủy
- [ ] Validation: Tên không được trống
- [ ] Styling theo design system

### Phase 3: Preset Management UI
- [ ] Tạo `src/components/PresetManager.svelte`
- [ ] List custom presets
- [ ] Edit button (mở modal edit)
- [ ] Delete button (với confirmation)
- [ ] Export button (download JSON)
- [ ] Context menu hoặc dropdown

### Phase 4: Update PresetPanel
- [ ] Load cả default và custom presets
- [ ] Hiển thị custom preset với indicator
- [ ] Thêm button "Lưu preset" ở header
- [ ] Context menu cho custom preset
- [ ] Separate section cho custom presets (optional)

### Phase 5: Integrate vào +page.svelte
- [ ] Load custom presets on mount
- [ ] State: `customPresets`, `showSavePresetModal`
- [ ] Handler: `handleSavePreset()`
- [ ] Handler: `handlePresetSaved()`
- [ ] Handler: `handlePresetDeleted()`
- [ ] Handler: `handlePresetEdited()`
- [ ] Update `handlePresetSelect()` để support custom preset

### Phase 6: Export/Import
- [ ] Tạo `src/lib/presets/presetIO.ts`
- [ ] Implement `exportPresetToJSON()`
- [ ] Implement `importPresetFromJSON()`
- [ ] Implement `downloadPresetFile()`
- [ ] Implement `importPresetFromFile()`
- [ ] Validate preset format khi import

### Testing
- [ ] Test save preset
- [ ] Test load preset
- [ ] Test delete preset
- [ ] Test edit preset
- [ ] Test export preset
- [ ] Test import preset
- [ ] Test với nhiều preset (performance)
- [ ] Test localStorage limits
- [ ] Test browser compatibility

---

## 🎯 Kết quả mong đợi

1. **User có thể lưu preset**: Click button → Nhập tên → Lưu
2. **Preset được persist**: Reload page vẫn còn preset
3. **Quản lý preset**: Xem, xóa, đổi tên preset
4. **Export/Import**: Backup và restore preset
5. **UI intuitive**: Dễ sử dụng, phù hợp với design system

---

## 📝 Notes

1. **Preset ID**: Sử dụng timestamp + random để đảm bảo unique
2. **Validation**: Validate preset trước khi lưu
3. **Error Handling**: Handle localStorage errors gracefully
4. **Performance**: Lazy load custom presets nếu có nhiều
5. **UX**: Show feedback khi save/delete thành công

---

## 🚀 Future Enhancements

Sau khi implement xong, có thể mở rộng:
- **Preset Categories**: Phân loại preset (Portrait, Landscape, etc.)
- **Preset Preview**: Thumbnail preview cho preset
- **Preset Sharing**: Share preset qua URL hoặc file
- **Preset Marketplace**: Community presets (nếu có backend)
- **Preset Sync**: Sync preset qua cloud (nếu có backend)

