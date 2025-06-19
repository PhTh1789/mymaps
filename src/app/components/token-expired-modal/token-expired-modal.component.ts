import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-token-expired-modal',
  templateUrl: './token-expired-modal.component.html',
  styleUrls: ['./token-expired-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class TokenExpiredModalComponent implements OnInit, OnDestroy {
  showModal = false;
  private tokenExpiredSubscription: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.tokenExpiredSubscription = this.authService.tokenExpired$.subscribe(
      (expired) => {
        if (expired) {
          this.showModal = true;
        }
      }
    );
  }

  ngOnInit() {
    // Kiểm tra token khi component khởi tạo
    if (this.authService.getIsLoggedIn() && !this.authService.isTokenValid()) {
      this.showModal = true;
    }
  }

  ngOnDestroy() {
    if (this.tokenExpiredSubscription) {
      this.tokenExpiredSubscription.unsubscribe();
    }
  }

  // Xử lý khi người dùng click nút đăng nhập lại
  onReLogin() {
    this.showModal = false;
    this.authService.resetTokenExpiredStatus();
    this.router.navigate(['/login']);
  }

  // Xử lý khi người dùng đóng modal
  onDismiss() {
    this.showModal = false;
    this.authService.resetTokenExpiredStatus();
  }
} 