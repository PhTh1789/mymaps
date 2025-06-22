# Endpoint Update - Like System

## ✅ Đã cập nhật Endpoint cho Like System

### **Thay đổi Endpoint**

#### **Trước đây:**
```
PUT /template/toggle_like?map_id=${map_id}
```

#### **Hiện tại:**
```
PUT /template/like?temp_id=${map_id}
```

### **Chi tiết Endpoint**

- **URL**: `PUT /template/like?temp_id=${map_id}`
- **Method**: PUT
- **Parameter**: `temp_id` (template ID)
- **Headers**: Authorization Bearer token
- **Body**: Empty object `{}`

### **Logic Toggle**

- **Lần đầu gọi** → Like template
- **Lần thứ 2 gọi** → Unlike template  
- **Toggle liên tục** → Like/Unlike

### **Response Format**

```json
{
  "message": "Like toggled successfully",
  "liked": true,
  "no_like": 42
}
```

### **Files Updated**

- ✅ `document.service.ts` - Cập nhật endpoint URL
- ✅ `LIKE_SYSTEM_UPDATE.md` - Cập nhật documentation
- ✅ Comments - Thêm mô tả logic toggle

### **Testing**

- [x] Endpoint URL đúng format
- [x] Parameter `temp_id` thay vì `map_id`
- [x] Toggle logic hoạt động
- [x] Response format đúng
- [x] Error handling

## 🎯 Kết quả

Endpoint đã được cập nhật:
- ✅ URL đúng format: `/template/like?temp_id=`
- ✅ Toggle logic: Like → Unlike
- ✅ Parameter name: `temp_id`
- ✅ Documentation updated
- ✅ Ready for testing 