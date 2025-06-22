import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AlertController, NavController, ToastController, LoadingController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AboutUsComponent } from '../../components/about-us/about-us.component';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
  ]
})
export class SettingsPage {
  notificationsEnabled = true;
  selectedLanguage = 'vi';

  constructor(
    private alertCtrl: AlertController,
    private http: HttpClient,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private errorHandler: ErrorHandlerService
  ) {}

  async confirmDeleteAccount() {
    const warningAlert = await this.alertCtrl.create({
      header: '⚠️ Cảnh báo',
      message: 'Bạn có chắc chắn muốn xóa tài khoản? Tất cả dữ liệu sẽ bị mất vĩnh viễn và không thể khôi phục.',
      buttons: [
        {
          text: 'Hủy',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Tiếp tục',
          handler: () => {
            this.showPasswordPrompt();
          }
        }
      ]
    });

    await warningAlert.present();
  }

  private async showPasswordPrompt() {
    const passwordAlert = await this.alertCtrl.create({
      header: 'Xác nhận xóa tài khoản',
      message: 'Vui lòng nhập mật khẩu để xác nhận xóa tài khoản.',
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: 'Nhập mật khẩu',
          attributes: {
            required: true,
            minlength: 1
          }
        }
      ],
      buttons: [
        {
          text: 'Hủy',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Xác nhận xóa',
          cssClass: 'danger',
          handler: (data) => {
            if (!data.password || data.password.trim() === '') {
              this.showToast('Vui lòng nhập mật khẩu', 'danger');
              return false;
            }
            if (data.password.trim().length < 1) {
              this.showToast('Mật khẩu không được để trống', 'danger');
              return false;
            }
            this.deleteAccount(data.password.trim());
            return true;
          }
        }
      ]
    });

    await passwordAlert.present();
  }

  async deleteAccount(password: string) {
    const token = this.authService.getAccessToken();

    if (!token) {
      this.showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'danger');
      setTimeout(() => {
        this.navCtrl.navigateRoot('/login');
      }, 2000);
      return;
    }

    if (!this.authService.isTokenValid()) {
      this.showToast('Token không hợp lệ. Vui lòng đăng nhập lại.', 'danger');
      setTimeout(() => {
        this.navCtrl.navigateRoot('/login');
      }, 2000);
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Đang xóa tài khoản...',
      spinner: 'crescent',
      backdropDismiss: false
    });
    await loading.present();

    try {
      const response = await this.http.delete(
        `https://myapp-r4xt.onrender.com/user/?password=${encodeURIComponent(password)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      ).toPromise();

      await loading.dismiss();

      this.authService.logout();
      
      this.showToast('Tài khoản đã được xóa thành công.', 'success');
      
      setTimeout(() => {
        this.navCtrl.navigateRoot('/login');
      }, 2000);

    } catch (error: any) {
      await loading.dismiss();
      
      console.error('Lỗi xóa tài khoản:', error);
      
      let errorMessage = 'Lỗi khi xóa tài khoản. Vui lòng thử lại.';
      let errorColor: 'danger' | 'warning' = 'danger';
      
      if (error.status === 0) {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.';
      } else if (error.status === 400) {
        errorMessage = 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      } else if (error.status === 401) {
        errorMessage = 'Mật khẩu không đúng hoặc token đã hết hạn.';
      } else if (error.status === 403) {
        errorMessage = 'Không có quyền xóa tài khoản.';
      } else if (error.status === 404) {
        errorMessage = 'Tài khoản không tồn tại.';
      } else if (error.status === 422) {
        errorMessage = 'Mật khẩu không hợp lệ hoặc không đúng định dạng.';
      } else if (error.status === 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
      } else if (error.status === 503) {
        errorMessage = 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.showToast(errorMessage, errorColor);
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 4000,
      color,
      position: 'top',
      buttons: [
        {
          text: 'Đóng',
          role: 'cancel'
        }
      ],
      cssClass: color === 'danger' ? 'error-toast' : 'success-toast'
    });
    await toast.present();
  }

  editProfile() {
    this.navCtrl.navigateForward('/profile');
  }

  async openAboutUsModal() {
    const modal = await this.modalCtrl.create({
      component: AboutUsComponent
    });
    await modal.present();
  }
}
