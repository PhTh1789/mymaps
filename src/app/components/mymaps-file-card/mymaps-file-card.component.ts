import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DocumentService } from '../../services/document.service';
import { MapShareService } from '../../services/map-share.service';
import { NavController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { MapService } from '../../services/map.service';

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
    
  ) { }

  ngOnInit() {
    // Trạng thái public: shared = 1 (đã public, tối màu), shared = 0 (private, sáng màu)
    this.isShared = this.file?.shared === 1;
  }

  // khi click vào thẻ, sẽ chuyển đến trang explore và hiển thị bản đồ
  onClickCard() {
    if (this.file && this.file.map_id) {
      this.mapShareService.setMapId(this.file.map_id);
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
    if (this.file && this.file.map_id) {
      if (confirm('Bạn có chắc muốn xóa bản đồ này?')) {
        this.isDeleting = true;
        this.mapService.deleteMap(this.file.map_id).subscribe({
          next: () => {
            this.isDeleting = false;
            this.deleted.emit();
          },
          error: (err) => {
            this.isDeleting = false;
            alert('Xóa bản đồ thất bại!');
            console.error('Lỗi xóa bản đồ:', err);
          }
        });
      }
    }
  }

  onShareMap(event: Event) {
    event.stopPropagation();
    if (this.file && this.file.map_id) {
      if (!this.isShared) {
        // Nếu chưa public, gọi toPublicMap
        if (confirm('Bạn có chắc muốn public bản đồ này?')) {
          this.isPublishing = true;
          this.mapService.toPublicMap(this.file.map_id).subscribe({
            next: () => {
              this.isPublishing = false;
              this.isShared = true;
              this.file.shared = 1; // cập nhật trạng thái file
              alert('Public bản đồ thành công!');
              this.reloadTabs.emit();
            },
            error: (err) => {
              this.isPublishing = false;
              alert('Public bản đồ thất bại!');
              console.error('Lỗi public bản đồ:', err);
            }
          });
        }
      } else {
        // Nếu đã public, gọi toPrivateMap
        if (confirm('Bạn có chắc muốn chuyển bản đồ về private?')) {
          this.isPublishing = true;
          this.mapService.toPrivateMap(this.file.map_id).subscribe({
            next: () => {
              this.isPublishing = false;
              this.isShared = false;
              this.file.shared = 0; // cập nhật trạng thái file
              alert('Chuyển bản đồ về private thành công!');
              this.reloadTabs.emit();
            },
            error: (err) => {
              this.isPublishing = false;
              alert('Chuyển bản đồ về private thất bại!');
              console.error('Lỗi chuyển về private:', err);
            }
          });
        }
      }
    }
  }

}
