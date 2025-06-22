import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DocumentService } from '../../services/document.service';
import { MapShareService } from '../../services/map-share.service';
import { NavController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { MapService } from '../../services/map.service';
import { AuthService } from '../../services/auth.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-mymaps-file-card',
  templateUrl: './mymaps-file-card.component.html',
  styleUrls: ['./mymaps-file-card.component.scss'],
  standalone: false
})
export class MymapsFileCardComponent  {
  @Input() file: any;
  @Output() cardClick = new EventEmitter<string>();
  @Output() deleted = new EventEmitter<void>();
  @Output() reloadTabs = new EventEmitter<void>();

  isDeleting = false;
  isPublishing = false;
  isShared = false;

  constructor(
    private navCtrl: NavController,
    private mapService: MapService,
    private mapShareService: MapShareService,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit() {
    // Trạng thái public: share = true (đã public, xám màu), share = false (private, sáng màu)
    // Hỗ trợ cả cấu trúc dữ liệu cũ và mới
    this.isShared = this.file?.share === true;
    
    console.log('=== FILE DATA INIT ===');
    console.log('File:', this.file);
    console.log('Share status:', this.isShared);
    console.log('File share property:', this.file?.share);
    console.log('========================');
  }

  // Method để lấy URL ảnh, hỗ trợ cả img và image_url
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

  // Method xử lý lỗi khi load ảnh
  onImageError(event: any) {
    console.log('Lỗi load ảnh:', event);
    // Có thể thêm logic xử lý lỗi ở đây
  }

  // khi click vào thẻ, sẽ chuyển đến trang explore và hiển thị bản đồ
  onClickCard() {
    // Sử dụng trường id (dựa trên cấu trúc dữ liệu thực tế)
    const mapId = this.file?.id || this.file?.map_id || this.file?.mapId;
    
    if (this.file && mapId) {
      this.mapShareService.setMapId(mapId.toString());
      this.navCtrl.navigateRoot(['/tabs/tab1']);
    }
    // Khi thẻ được bấm, phát ra(evenemiter) sự kiện kèm theo ID của tệp
    if (this.file && this.file.id) {
      this.cardClick.emit(this.file.id);//emit() hàm gửi thông báo sự kiện click và gửi id của tài liệu
    }
  }

  // Phương thức cắt ngắn văn bản và thêm dấu ba chấm
  truncateText(text: string, maxLength: number = 35): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  truncateName(text: string, maxLength: number = 25): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  onDeleteMap(event: Event) {
    event.stopPropagation();
    
    // Sử dụng trường id (dựa trên cấu trúc dữ liệu thực tế)
    const mapId = this.file?.id || this.file?.map_id || this.file?.mapId;
    
    if (this.file && mapId) {
      if (confirm('Bạn có chắc muốn xóa bản đồ này?')) {
        this.isDeleting = true;
        
        // Sử dụng ErrorHandlerService với retry logic
        this.errorHandler.withRetry(() => 
          this.mapService.deleteMap(mapId.toString())
        ).subscribe({
          next: () => {
            this.isDeleting = false;
            alert('Xóa bản đồ thành công!');
            this.deleted.emit();
          },
          error: (err) => {
            this.isDeleting = false;
            const errorMessage = this.errorHandler.handleError(err);
            alert(errorMessage);
            console.error('Lỗi xóa bản đồ:', err);
          }
        });
      }
    }
  }

  onShareMap(event: Event) {
    event.stopPropagation();
    
    // Sử dụng trường id (dựa trên cấu trúc dữ liệu thực tế)
    const mapId = this.file?.id || this.file?.map_id || this.file?.mapId;
    
    console.log('=== SHARE MAP DEBUG ===');
    console.log('File data:', this.file);
    console.log('Map ID:', mapId);
    console.log('Current share status:', this.isShared);
    console.log('File share property:', this.file?.share);
    console.log('========================');
    
    if (this.file && mapId) {
      // Kiểm tra map_id có phải là số hợp lệ không
      const mapIdInt = parseInt(mapId.toString());
      if (isNaN(mapIdInt)) {
        alert('Map ID không hợp lệ. Vui lòng thử lại.');
        return;
      }
      
      // Xác định hành động dựa trên trạng thái hiện tại
      const currentStatus = this.isShared;
      const actionText = currentStatus ? 'chuyển về private' : 'public';
      
      if (confirm(`Bạn có chắc muốn ${actionText} bản đồ này?`)) {
        this.isPublishing = true;
        
        // Sử dụng ErrorHandlerService với retry logic
        this.errorHandler.withRetry(() => {
          if (!currentStatus) {
            // Chưa public -> Public: Sử dụng endpoint /template/ với POST
            console.log('🔄 Public map từ private sang template...');
            
            // Thử test endpoint trước nếu cần debug
            if (confirm('Bạn có muốn test các endpoint khác nhau không?')) {
              return this.mapService.testPublicMap(mapIdInt.toString());
            }
            
            return this.mapService.toPublicMap(mapIdInt.toString());
          } else {
            // Đã public -> Private: Sử dụng endpoint /map/?map_id với PUT
            console.log('🔄 Chuyển map từ public về private...');
            return this.mapService.toPrivateMap(mapIdInt.toString());
          }
        }).subscribe({
          next: (response) => {
            this.isPublishing = false;
            this.isShared = !currentStatus; // Toggle trạng thái local
            this.file.share = !currentStatus; // Cập nhật trạng thái file
            const newStatus = !currentStatus ? 'public' : 'private';
            console.log('✅ Share action thành công:', response);
            alert(`Chuyển bản đồ sang ${newStatus} thành công!`);
            this.reloadTabs.emit();
          },
          error: (err) => {
            this.isPublishing = false;
            const errorMessage = this.errorHandler.handleError(err);
            console.error('❌ Share action thất bại:', err);
            alert(errorMessage);
            console.error('Lỗi toggle map share:', err);
          }
        });
      }
    } else {
      console.error('Không tìm thấy Map ID');
    }
  }

}
