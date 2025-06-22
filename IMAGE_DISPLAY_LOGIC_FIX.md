# Sửa Logic Hiển Thị Ảnh Cho List Card

## 🔍 Vấn Đề Đã Xác Định
- Logic hiển thị ảnh chỉ kiểm tra `file?.image_url` 
- Không hỗ trợ trường `img` từ API response
- Không có fallback khi ảnh lỗi hoặc không tồn tại
- Không xử lý base64 images đúng cách

## 🛠️ Các Thay Đổi Đã Thực Hiện

### 1. **Cập Nhật mymaps-file-card.component.html**
```html
<!-- Trước -->
<img *ngIf="file?.image_url" [src]="file.image_url" alt="map image" />

<!-- Sau -->
<img 
  *ngIf="getImageUrl()" 
  [src]="getImageUrl()" 
  alt="map image" 
  (error)="onImageError($event)"
  onerror="this.onerror=null; this.src='assets/img/default-map.png';"
/>
<div *ngIf="!getImageUrl()" class="no-image-placeholder">
  <ion-icon name="map-outline"></ion-icon>
  <span>Không có ảnh</span>
</div>
```

### 2. **Thêm Method getImageUrl() trong mymaps-file-card.component.ts**
```typescript
getImageUrl(): string | null {
  if (!this.file) return null;
  
  // Ưu tiên image_url trước, sau đó mới đến img
  if (this.file.image_url && this.file.image_url.trim() !== '') {
    return this.file.image_url;
  }
  
  if (this.file.img && this.file.img.trim() !== '') {
    // Nếu img là base64, thêm prefix
    if (this.file.img.startsWith('data:')) {
      return this.file.img;
    }
    // Nếu là URL, trả về trực tiếp
    if (this.file.img.startsWith('http')) {
      return this.file.img;
    }
    // Nếu là base64 không có prefix, thêm prefix
    return `data:image/jpeg;base64,${this.file.img}`;
  }
  
  return null;
}
```

### 3. **Cập Nhật file-card.component.html (Tab Template)**
```html
<!-- Tương tự như mymaps-file-card -->
<img 
  *ngIf="getImageUrl()" 
  [src]="getImageUrl()" 
  alt="map image" 
  (error)="onImageError($event)"
  onerror="this.onerror=null; this.src='assets/img/default-map.png';"
/>
<div *ngIf="!getImageUrl()" class="no-image-placeholder">
  <ion-icon name="map-outline"></ion-icon>
  <span>Không có ảnh</span>
</div>
```

### 4. **Thêm CSS cho Placeholder**
```scss
.no-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
  color: #666;
  font-size: 12px;
  
  ion-icon {
    font-size: 24px;
    margin-bottom: 4px;
    color: #999;
  }
  
  span {
    font-size: 10px;
    text-align: center;
  }
}
```

### 5. **Restore Full Form Functionality**
```typescript
// Restore full form functionality
const mapData: CreateMapRequest = {
  name: this.createMapForm.value.name.trim(),
  desc: this.createMapForm.value.desc?.trim() || null,
  category: this.createMapForm.value.category?.trim() || null,
  share: this.createMapForm.value.share || false,
  img: base64Image || null
};
```

## 🎯 Logic Mới

### **Thứ Tự Ưu Tiên Hiển Thị Ảnh**
1. **image_url** (nếu có và không rỗng)
2. **img** (nếu có và không rỗng)
   - Nếu là base64 có prefix: sử dụng trực tiếp
   - Nếu là URL: sử dụng trực tiếp  
   - Nếu là base64 không có prefix: thêm prefix
3. **Placeholder** (nếu không có ảnh)

### **Xử Lý Lỗi Ảnh**
- **onerror attribute**: Tự động chuyển sang default image
- **Error handler**: Log lỗi để debug
- **Fallback**: Hiển thị placeholder với icon

### **Hỗ Trợ Các Định Dạng**
- ✅ URL images (http/https)
- ✅ Base64 images (có/không có prefix)
- ✅ Relative paths
- ✅ Error handling
- ✅ Placeholder fallback

## 📋 Test Cases

### **Test 1: Có image_url**
```typescript
file = { image_url: "https://example.com/image.jpg" }
// Expected: Hiển thị ảnh từ URL
```

### **Test 2: Có img base64**
```typescript
file = { img: "data:image/jpeg;base64,/9j/4AAQ..." }
// Expected: Hiển thị ảnh base64
```

### **Test 3: Có img base64 không prefix**
```typescript
file = { img: "/9j/4AAQ..." }
// Expected: Hiển thị ảnh với prefix được thêm
```

### **Test 4: Không có ảnh**
```typescript
file = { name: "Test Map" }
// Expected: Hiển thị placeholder
```

### **Test 5: Ảnh lỗi**
```typescript
file = { image_url: "https://invalid-url.com/image.jpg" }
// Expected: Chuyển sang default image
```

## ✅ Kết Quả Mong Đợi

1. **Hiển thị ảnh đúng** cho cả tab MyMap và Template
2. **Hỗ trợ nhiều định dạng** ảnh khác nhau
3. **Fallback graceful** khi không có ảnh hoặc lỗi
4. **UI consistent** giữa các component
5. **Error handling** tốt hơn

## 🚀 Bước Tiếp Theo

1. **Test với dữ liệu thực tế** từ API
2. **Kiểm tra hiển thị** trên cả hai tab
3. **Verify fallback** khi ảnh lỗi
4. **Test performance** với nhiều ảnh
5. **Optimize loading** nếu cần 