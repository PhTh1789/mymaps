import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';

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
  private reLoginInProgress = false;
  private autoRedirectTimer: Subscription | null = null;
  countdown = 10; // Đếm ngược 10 giây trước khi tự động redirect

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {
    this.tokenExpiredSubscription = this.tokenService.tokenExpired$.subscribe(
      (expired) => {
        if (expired) {
          this.reLoginInProgress = false;
          this.showModal = true;
          this.startAutoRedirect();
        }
      }
    );
  }

  ngOnInit() {
    if (this.authService.isLoggedIn && !this.tokenService.isTokenValid()) {
      this.reLoginInProgress = false;
      this.showModal = true;
      this.startAutoRedirect();
    }
  }

  ngOnDestroy() {
    if (this.tokenExpiredSubscription) {
      this.tokenExpiredSubscription.unsubscribe();
    }
    if (this.autoRedirectTimer) {
      this.autoRedirectTimer.unsubscribe();
    }
  }

  private startAutoRedirect(): void {
    // Dừng timer cũ nếu có
    if (this.autoRedirectTimer) {
      this.autoRedirectTimer.unsubscribe();
    }

    this.countdown = 10;
    
    // Bắt đầu đếm ngược và tự động redirect
    this.autoRedirectTimer = timer(0, 1000).subscribe(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        this.autoRedirect();
      }
    });
  }

  private autoRedirect(): void {
    if (this.autoRedirectTimer) {
      this.autoRedirectTimer.unsubscribe();
      this.autoRedirectTimer = null;
    }
    
    this.showModal = false;
    this.authService.logout();
    
    // Reload trang để đảm bảo tất cả state được reset
    window.location.href = '/login';
  }

  onReLogin() {
    if (!this.reLoginInProgress) {
      this.reLoginInProgress = true;
      this.showModal = false;
      
      // Dừng timer nếu user chọn đăng nhập lại thủ công
      if (this.autoRedirectTimer) {
        this.autoRedirectTimer.unsubscribe();
        this.autoRedirectTimer = null;
      }
    }
  }

  onDismiss() {
    if (this.reLoginInProgress) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
    this.tokenService.resetTokenExpiredStatus();
    
    // Dừng timer nếu user dismiss modal
    if (this.autoRedirectTimer) {
      this.autoRedirectTimer.unsubscribe();
      this.autoRedirectTimer = null;
    }
  }
} 