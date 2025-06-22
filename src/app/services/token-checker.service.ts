import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { Subscription, interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenCheckerService implements OnDestroy {
  private tokenCheckSubscription: Subscription | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Kiểm tra mỗi 5 phút

  constructor(private authService: AuthService) {
    this.startTokenChecking();
  }

  private startTokenChecking() {
    // Chỉ kiểm tra nếu user đã đăng nhập
    if (this.authService.isLoggedIn) {
      this.tokenCheckSubscription = interval(this.CHECK_INTERVAL).subscribe(() => {
        if (this.authService.isLoggedIn) {
          // Chỉ cần gọi isTokenValid, nó sẽ tự động kích hoạt
          // luồng xử lý hết hạn nếu cần thiết.
          this.authService.isTokenValid();
        } else {
          // User đã logout, dừng kiểm tra
          this.stopTokenChecking();
        }
      });
    }
  }

  public stopTokenChecking() {
    if (this.tokenCheckSubscription) {
      this.tokenCheckSubscription.unsubscribe();
      this.tokenCheckSubscription = null;
    }
  }

  public restartTokenChecking() {
    this.stopTokenChecking();
    this.startTokenChecking();
  }

  ngOnDestroy() {
    this.stopTokenChecking();
  }
} 