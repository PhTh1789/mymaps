# Cập nhật Shared Search Bar

## Tổng quan
Đã hợp nhất các thanh search bar của 3 tab (Explore, MyMap, Template) thành một component chung `SharedSearchBarComponent` để tái sử dụng và nhất quán giao diện.

## Component Mới

### SharedSearchBarComponent
**Location**: `src/app/components/shared-search-bar/`

**Features**:
- Avatar button để mở menu
- Search bar với placeholder tùy chỉnh
- Suggestions list với icon phù hợp
- Responsive design
- Event emitters cho tương tác

**Inputs**:
- `placeholder`: Text placeholder cho search bar
- `showAvatar`: Hiển thị avatar button (default: true)
- `searchQuery`: Giá trị hiện tại của search
- `showSuggestions`: Hiển thị suggestions list
- `suggestions`: Danh sách suggestions

**Outputs**:
- `searchChange`: Emit khi người dùng nhập text
- `searchClear`: Emit khi clear search
- `suggestionSelect`: Emit khi chọn suggestion
- `menuOpen`: Emit khi mở menu

## Logic Tìm kiếm Khác nhau

### Tab1 (Explore) - Tìm kiếm địa điểm
- **API**: OpenStreetMap Nominatim
- **Placeholder**: "Tìm kiếm địa điểm..."
- **Icon**: `location-outline`
- **Logic**: Tìm kiếm địa điểm trên bản đồ thế giới
- **Kết quả**: Hiển thị marker trên map

### Tab2 (MyMap) - Tìm kiếm bản đồ cá nhân
- **Placeholder**: "Tìm kiếm bản đồ của bạn..."
- **Logic**: Filter theo tên bản đồ
- **Kết quả**: Hiển thị danh sách bản đồ đã lọc

### Tab3 (Template) - Tìm kiếm template
- **Placeholder**: "Tìm kiếm bản đồ..."
- **Icon**: `map-outline`
- **Logic**: Filter theo tên template hoặc tác giả
- **Kết quả**: Hiển thị suggestions và danh sách template

## Cập nhật trong Code

### 1. Component Updates
- **Tab1**: Sử dụng shared search bar với logic tìm kiếm địa điểm
- **Tab2**: Sử dụng shared search bar với logic filter bản đồ
- **Tab3**: Sử dụng shared search bar với logic filter template

### 2. CSS Cleanup
- Loại bỏ styles search cũ từ các tab
- Giữ lại styles cần thiết cho layout
- Responsive design được bảo toàn

### 3. Method Updates
- Cập nhật `onSearchChange()` để nhận string thay vì event
- Cập nhật `selectLocation()` và `selectSuggestion()` để tương thích
- Logic tìm kiếm được giữ nguyên

## Lợi ích

### 1. Tái sử dụng Code
- Một component cho tất cả search bar
- Dễ bảo trì và cập nhật
- Nhất quán giao diện

### 2. UX Cải thiện
- Avatar button để mở menu ở tất cả tab
- Suggestions với icon phù hợp
- Responsive design tốt hơn

### 3. Performance
- Giảm code trùng lặp
- Component được tối ưu
- Loading nhanh hơn

## Cách sử dụng

```html
<app-shared-search-bar
  [placeholder]="'Tìm kiếm...'"
  [searchQuery]="searchQuery"
  [showSuggestions]="showSuggestions"
  [suggestions]="suggestions"
  (searchChange)="onSearchChange($event)"
  (searchClear)="clearSearch()"
  (suggestionSelect)="selectSuggestion($event)">
</app-shared-search-bar>
```

## Lưu ý
- Đảm bảo import `SharedSearchBarComponent` trong module
- Logic tìm kiếm vẫn được giữ nguyên trong từng tab
- Avatar button tự động mở menu khi click
- Suggestions list hiển thị icon phù hợp với loại dữ liệu 