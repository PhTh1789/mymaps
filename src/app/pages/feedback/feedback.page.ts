import { Component, inject } from '@angular/core';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { FeedbackService, FeedbackRequest } from '../../services/feedback.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  templateUrl: './feedback.page.html',
  styleUrls: ['./feedback.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class FeedbackPage {
  id: number = 0;
  star: number = 1;
  desc: string = '';
  isSubmitting: boolean = false;

  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private feedbackService: FeedbackService = inject(FeedbackService);

  setRating(value: number) {
    this.star = value;
  }

  async submitFeedback() {
    if (this.isSubmitting) return;

    const feedbackData: FeedbackRequest = {
      id: this.id,
      star: this.star,
      desc: this.desc.trim()
    };

    // Validate input using service
    const validation = this.feedbackService.validateFeedback(feedbackData);
    if (!validation.isValid) {
      const alert = await this.alertCtrl.create({
        header: 'Lỗi',
        message: validation.message,
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    this.isSubmitting = true;

    try {
      const response = await firstValueFrom(this.feedbackService.submitFeedback(feedbackData));

      const alert = await this.alertCtrl.create({
        header: 'Thành công',
        message: 'Phản hồi của bạn đã được gửi thành công!',
        buttons: ['OK']
      });
      await alert.present();

      await this.modalCtrl.dismiss({
        id: this.id,
        star: this.star,
        desc: this.desc
      });

    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      
      let errorMessage = 'Không gửi được phản hồi. Vui lòng thử lại sau.';
      
      if (error.status === 401 || error.status === 403) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      } else if (error.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      } else if (error.status === 0) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
      }

      const alert = await this.alertCtrl.create({
        header: 'Lỗi',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      this.isSubmitting = false;
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
