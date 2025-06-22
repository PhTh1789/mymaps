import { Injectable } from '@angular/core';
import { Observable, tap, catchError, switchMap, timer, throwError, of } from 'rxjs';
import { UserStateService } from '../services/user-state.service';
import { TokenService } from '../services/token.service';
import { AuthApiService, LoginCredentials, RegisterData } from '../services/auth-api.service';

// Khởi tạo ứng dụng
@Injectable({
  providedIn: 'root',
})

export class AuthService {
  constructor(
    private userStateService: UserStateService,
    private tokenService: TokenService,
    private authApiService: AuthApiService
  ) {
    // Không tự động logout nữa, để TokenExpiredModalComponent xử lý
    // this.tokenService.tokenExpired$.subscribe(expired => {
    //   if (expired) {
    //     console.log('AuthService: Đã nhận được sự kiện token hết hạn, đang đăng xuất...');
    //     this.logout();
    //   }
    // });
  }

  // Expose observables from child services
  get isLoggedIn$() { return this.userStateService.isLoggedIn$; }
  get userInfo$() { return this.userStateService.userInfo$; }
  get tokenExpired$() { return this.tokenService.tokenExpired$; }

  // Convenience getters
  get isLoggedIn(): boolean { return this.userStateService.isLoggedIn(); }
  get currentUserInfo() { return this.userStateService.getCurrentUserInfo(); }
  getAccessToken(): string | null { return this.tokenService.getAccessToken(); }

  /**
   * Đăng ký tài khoản mới
   */
  register(data: RegisterData): Observable<any> {
    return this.authApiService.register(data);
  }

  /**
   * Đăng nhập và lưu thông tin người dùng
   */
  login(credentials: LoginCredentials): Observable<any> {
    return this.authApiService.login(credentials).pipe(
      tap((response) => {
        if (response?.access_token) {
          // Lưu token
          this.tokenService.setAccessToken(response.access_token);
          this.userStateService.setLoggedIn(true);
          this.tokenService.resetTokenExpiredStatus();

          // Lấy thông tin người dùng chi tiết
          this.authApiService.getUserInfo(response.access_token).subscribe({
            next: (userInfo) => {
              this.userStateService.setUserInfo({
                userId: userInfo.user_id,
                username: userInfo.username,
                avatar: userInfo.avatar || null,
                email: userInfo.user_email,
                phone: userInfo.user_phone
              });
            },
            error: (err) => {
              console.error('Lỗi khi lấy thông tin người dùng:', err);
            }
          });
        }
      })
    );
  }

  /**
   * Đăng xuất và xóa tất cả dữ liệu
   */
  logout(): void {
    this.tokenService.removeAccessToken();
    this.userStateService.clearUserData();
    console.log('Đã đăng xuất thành công');
  }

  /**
   * Kiểm tra tính hợp lệ của token
   */
  isTokenValid(): boolean {
    return this.tokenService.isTokenValid();
  }

  /**
   * Kiểm tra và refresh token nếu cần
   */
  checkAndRefreshToken(): Observable<boolean> {
    if (!this.isLoggedIn) {
      return throwError(() => new Error('Chưa đăng nhập'));
    }

    if (this.tokenService.isTokenValid()) {
      return of(true);
    }

    // Token không hợp lệ, kích hoạt token expired modal
    this.tokenService.handleTokenExpiration();
    return throwError(() => new Error('Token đã hết hạn'));
  }

  /**
   * Lấy headers cho API calls
   */
  getAuthHeaders() {
    return this.tokenService.getAuthHeaders();
  }

  /**
   * Reset trạng thái token expired
   */
  resetTokenExpiredStatus(): void {
    this.tokenService.resetTokenExpiredStatus();
  }

  /**
   * Cập nhật thông tin người dùng
   */
  updateUserInfo(userInfo: Partial<{ userId: string; username: string; avatar: string | null; email?: string; phone?: string }>): void {
    this.userStateService.setUserInfo(userInfo);
  }

  /**
   * Làm mới thông tin từ localStorage
   */
  refreshUserInfoFromStorage(): void {
    // UserStateService đã tự động load từ localStorage trong constructor
    // Method này có thể được sử dụng để force refresh nếu cần
  }

  // Method để retry action sau khi token được refresh
  retryAction<T>(action: () => Observable<T>): Observable<T> {
    return action().pipe(
      catchError((error: any) => {
        if (error.status === 401 || error.status === 403) {
          // Token expired, đợi một chút rồi thử lại
          return timer(1000).pipe(
            switchMap(() => {
              // Kiểm tra xem user đã đăng nhập lại chưa
              if (this.isLoggedIn) {
                return action(); // Thử lại action
              } else {
                return throwError(() => new Error('Phiên đăng nhập đã hết hạn'));
              }
            })
          );
        }
        return throwError(() => error);
      })
    );
  }

  // Lấy thông tin user theo định dạng mới từ /user/me
  getCurrentUserInfoNew(): Observable<any> {
    const token = this.getAccessToken();
    if (!token) return throwError(() => new Error('Chưa đăng nhập'));
    return this.authApiService.getCurrentUserInfo(token);
  }
}
