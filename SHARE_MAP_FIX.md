# Sửa lỗi Share Map - Mất tên bản đồ

## Vấn đề ban đầu
- Khi public map từ mymap sang template, bản đồ bị mất tên
- Logic sử dụng sai endpoint và method cho từng trường hợp

## Nguyên nhân
1. **Sai endpoint**: Sử dụng `/map/?map_id` với PUT method cho tất cả trường hợp
2. **Sai payload**: Gửi toàn bộ thông tin map (name, desc, img) khi chỉ cần toggle share status
3. **Logic không đúng**: Không phân biệt giữa public và private action

## Giải pháp đã thực hiện

### 1. **Phân biệt rõ ràng 2 trường hợp**

#### Khi Public Map (Private → Public):
- **Endpoint**: `/template/?map_id`
- **Method**: POST
- **Payload**: `{}` (empty object)
- **Service**: `toPublicMap()`

#### Khi Private Map (Public → Private):
- **Endpoint**: `/map/?map_id`
- **Method**: PUT
- **Payload**: `{ share: false }`
- **Service**: `toPrivateMap()`

### 2. **Cập nhật Logic trong Component**

```typescript
// Trước (SAI):
this.mapService.toggleMapShare(mapId, currentStatus, updateData)

// Sau (ĐÚNG):
if (!currentStatus) {
  // Private → Public
  return this.mapService.toPublicMap(mapId);
} else {
  // Public → Private
  return this.mapService.toPrivateMap(mapId);
}
```

### 3. **Loại bỏ Logic Không Cần Thiết**
- Không cần lấy thông tin map từ server trước khi update
- Không cần gửi name, desc, img khi chỉ toggle share status
- Sử dụng đúng service method cho từng trường hợp

## Files đã cập nhật

### 1. **mymaps-file-card.component.ts**
- ✅ Sửa logic `onShareMap()` để sử dụng đúng endpoint
- ✅ Thêm debug logging để kiểm tra
- ✅ Sử dụng `toPublicMap()` và `toPrivateMap()` thay vì `toggleMapShare()`

### 2. **map.service.ts**
- ✅ Xóa method `toggleMapShare()` không sử dụng
- ✅ Đảm bảo `toPublicMap()` và `toPrivateMap()` có loading state

### 3. **map-api.service.ts**
- ✅ Giữ nguyên `toPublicMap()` và `toPrivateMap()` với logic đúng
- ✅ `toPublicMap()`: POST `/template/?map_id` với payload `{}`
- ✅ `toPrivateMap()`: PUT `/map/?map_id` với payload `{ share: false }`

## Testing

### Test Cases cần kiểm tra:

1. **Public Map (Private → Public)**:
   - Map có share = false
   - Click nút share (màu xanh)
   - Confirm "public bản đồ"
   - Kiểm tra gọi `toPublicMap()` với POST `/template/?map_id`
   - Kiểm tra map chuyển sang share = true (màu xám)

2. **Private Map (Public → Private)**:
   - Map có share = true
   - Click nút share (màu xám)
   - Confirm "chuyển về private"
   - Kiểm tra gọi `toPrivateMap()` với PUT `/map/?map_id`
   - Kiểm tra map chuyển sang share = false (màu xanh)

3. **Data Integrity**:
   - Tên bản đồ không bị mất sau khi public
   - Mô tả bản đồ không bị mất sau khi public
   - Ảnh bản đồ không bị mất sau khi public

### Manual Testing:

1. **Tạo map mới** với tên "Test Map"
2. **Public map** → Kiểm tra tên vẫn là "Test Map"
3. **Private map** → Kiểm tra tên vẫn là "Test Map"
4. **Refresh trang** → Kiểm tra tên vẫn đúng

## Debug Logging

Component sẽ log các thông tin sau:
```
=== SHARE MAP DEBUG ===
File data: { id: 1, name: "Test Map", share: false, ... }
Map ID: 1
Current share status: false
File share property: false
========================
🔄 Public map từ private sang template...
✅ Share action thành công: { ... }
```

## Lợi ích

1. **Đúng logic**: Sử dụng đúng endpoint và method cho từng trường hợp
2. **Không mất data**: Tên, mô tả, ảnh bản đồ được giữ nguyên
3. **Performance tốt**: Không cần gửi dữ liệu không cần thiết
4. **Maintainable**: Logic rõ ràng, dễ hiểu và maintain 