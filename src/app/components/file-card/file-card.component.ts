// src/app/components/file-card/file-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DocumentService } from '../../services/document.service';
import { MapShareService } from '../../services/map-share.service';
import { NavController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';

interface likeresponse {
  message: string;
  liked: boolean;
  no_like: number;
}

@Component({
  selector: 'app-file-card',
  templateUrl: './file-card.component.html',
  styleUrls: ['./file-card.component.scss'],
  standalone: false,
})
export class FileCardComponent {
  @Input() file: any; // nhận dữ liệu file đầu vào
  @Output() cardClick = new EventEmitter<string>(); // đầu ra của sự kiện cardclick, phát ra chuỗi ký tự id
  @Output() deleted = new EventEmitter<void>();
  @Output() reloadTabs = new EventEmitter<void>();

  constructor(
    private documentService: DocumentService,
    private mapShareService: MapShareService,
    private navCtrl: NavController
  ) {}

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
    // Sử dụng map_id từ TemplateItem interface
    const mapId = this.file?.map_id || this.file?.id;
    if (this.file && mapId) {
      this.mapShareService.setMapId(mapId.toString());
      this.navCtrl.navigateRoot(['/tabs/tab1']);
    }
    // Khi thẻ được bấm, phát ra(evenemiter) sự kiện kèm theo ID của tệp
    if (this.file && mapId) {
      this.cardClick.emit(mapId.toString());
    }
  }

  // Logic like mới: toggle like/unlike
  onLike() {
    const mapId = this.file?.map_id || this.file?.id;
    if (this.file && mapId) {
      this.documentService.toggleLike(mapId).subscribe({
        next: (response: likeresponse) => {
          // Cập nhật trạng thái liked và số lượng like
          this.file.liked = response.liked;
          this.file.no_like = response.no_like;
          console.log('Toggle like thành công:', response);
        },
        error: (err: any) => {
          console.error('Lỗi khi toggle like:', err);
        },
      });
    }
  }

  onImportTemplate(event: Event) {
    event.stopPropagation();
    const mapId = this.file?.map_id || this.file?.id;
    if (this.file && mapId) {
      this.documentService.importTemplate(mapId).subscribe({
        next: (res) => {
          console.log('Import thành công:', res);
        },
        error: (err) => {
          console.error('Lỗi import:', err);
        },
      });
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
}