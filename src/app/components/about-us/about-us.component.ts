import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [IonicModule, CommonModule],
  selector: 'app-about-us',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>About Us</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">Đóng</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="intro1">
        <div class="slide-overlay">
          <div class="i3">
            GVHD: Đỗ Thành Long<br>
            Nhóm thực hiện: 8<br>
            Lớp: DH22HM<br>
            Ngành: Hệ thống thông tin<br>
            Tên thành viên
          </div>

          <div class="member-grid">
            <div>Nguyễn Ngọc Ấn</div><div>22166002</div>
            <div>Nguyễn Hoàng Giang</div><div>22166017</div>
            <div>Nguyễn Thanh Giang</div><div>22166018</div>
            <div>Lê Quỳnh Như</div><div>22166067</div>
            <div>Huỳnh Trung Phong</div><div>22166068</div>
            <div>Nguyễn Phát Thịnh</div><div>22166081</div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['./about-us.component.scss']
})
export class AboutUsComponent {
  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss();
  }
}
