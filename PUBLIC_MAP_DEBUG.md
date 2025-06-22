# Debug Lỗi Public Map - Không tìm thấy dữ liệu yêu cầu

## Vấn đề
- Khi public map từ mymap sang template, nhận được lỗi "không tìm thấy dữ liệu yêu cầu"
- Có thể do sai endpoint hoặc payload

## Các thay đổi đã thực hiện

### 1. **Cập nhật toPublicMap method**
- ✅ Thay đổi endpoint từ `/template/?map_id` thành `/template/`
- ✅ Thêm `map_id` vào payload thay vì empty object
- ✅ Thêm `Content-Type: application/json` header
- ✅ Cải thiện error handling và logging

### 2. **Thêm test method**
- ✅ `testPublicMap()` để test các endpoint khác nhau
- ✅ `testTemplateEndpoints()` để test các format khác nhau

### 3. **Debug logging**
- ✅ Log chi tiết URL, payload, và response
- ✅ Log error details để debug

## Các endpoint đã test

### 1. **POST /template/ với map_id trong body**
```typescript
URL: `${apiUrl}/template/`
Payload: { map_id: mapIdInt }
```

### 2. **POST /template/?map_id với map_id trong body**
```typescript
URL: `${apiUrl}/template/?map_id=${mapIdInt}`
Payload: { map_id: mapIdInt }
```

### 3. **POST /template/?map_id với empty body**
```typescript
URL: `${apiUrl}/template/?map_id=${mapIdInt}`
Payload: {}
```

### 4. **POST /maps/{id}/template**
```typescript
URL: `${apiUrl}/maps/${mapIdInt}/template`
Payload: {}
```

## Cách test

### 1. **Test thủ công**
1. Mở Developer Tools (F12)
2. Chuyển sang tab Console
3. Click nút share trên một map private
4. Chọn "Có" khi được hỏi có muốn test endpoint không
5. Xem log trong console để biết endpoint nào hoạt động

### 2. **Test từng endpoint**
```typescript
// Test endpoint 1
this.mapService.testPublicMap(mapId).subscribe({
  next: (response) => console.log('✅ Thành công:', response),
  error: (error) => console.error('❌ Thất bại:', error)
});
```

## Debug Steps

### Step 1: Kiểm tra Map ID
```javascript
// Trong console
console.log('File data:', this.file);
console.log('Map ID:', mapId);
console.log('Map ID type:', typeof mapId);
```

### Step 2: Kiểm tra API URL
```javascript
// Trong console
console.log('API URL:', this.apiUrl);
console.log('Full URL:', `${this.apiUrl}/template/`);
```

### Step 3: Kiểm tra Headers
```javascript
// Trong console
console.log('Headers:', {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
});
```

### Step 4: Kiểm tra Payload
```javascript
// Trong console
console.log('Payload:', { map_id: mapIdInt });
```

## Các lỗi có thể gặp

### 1. **404 - Not Found**
- Endpoint không tồn tại
- Map ID không đúng
- URL không đúng

### 2. **400 - Bad Request**
- Payload không đúng format
- Thiếu required fields
- Data type không đúng

### 3. **422 - Unprocessable Entity**
- Validation error
- Business logic error
- Data không hợp lệ

### 4. **500 - Internal Server Error**
- Server error
- Database error
- Configuration error

## Giải pháp

### 1. **Nếu endpoint /template/ không hoạt động**
- Thử endpoint `/template/?map_id`
- Thử endpoint `/maps/{id}/template`
- Kiểm tra API documentation

### 2. **Nếu payload không đúng**
- Thử `{ map_id: mapIdInt }`
- Thử `{ map_id: mapIdInt.toString() }`
- Thử empty object `{}`

### 3. **Nếu headers không đúng**
- Thêm `Content-Type: application/json`
- Kiểm tra Authorization token
- Kiểm tra Accept header

## Files đã cập nhật

1. **`map-api.service.ts`**:
   - ✅ Cập nhật `toPublicMap()` method
   - ✅ Thêm `testPublicMap()` method
   - ✅ Cải thiện error handling

2. **`map.service.ts`**:
   - ✅ Thêm `testPublicMap()` wrapper

3. **`mymaps-file-card.component.ts`**:
   - ✅ Thêm option test endpoint
   - ✅ Cải thiện debug logging

## Testing Checklist

- [ ] Map ID hợp lệ và đúng format
- [ ] API URL đúng và accessible
- [ ] Headers đúng format
- [ ] Payload đúng format
- [ ] Token authorization hợp lệ
- [ ] Server response đúng format
- [ ] Error handling hoạt động
- [ ] UI update sau khi thành công 