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


  constructor(
    private navCtrl: NavController,
    private mapService: MapService,
    private mapShareService: MapShareService,
    
  ) { }

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

}
