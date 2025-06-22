import { Injectable } from '@angular/core';
import { Observable, throwError, timer, of } from 'rxjs';
import { catchError, switchMap, retryWhen, take, delay } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(private authService: AuthService) {}

  /**
   * Wrapper cho các API call với auto-retry khi token expired
   * @param action Function trả về Observable
   * @param maxRetries Số lần retry tối đa (mặc định: 1)
   * @param retryDelay Thời gian delay giữa các lần retry (ms, mặc định: 1000)
   */
  withRetry<T>(
    action: () => Observable<T>, 
    maxRetries: number = 1, 
    retryDelay: number = 1000
  ): Observable<T> {
    return action().pipe(
      catchError((error: any) => {
        // Chỉ retry cho lỗi 401/403 (token expired)
        if ((error.status === 401 || error.status === 403) && maxRetries > 0) {
          console.log(`Token expired, retrying... (${maxRetries} attempts left)`);
          
          return timer(retryDelay).pipe(
            switchMap(() => {
              // Kiểm tra xem user đã đăng nhập lại chưa
              if (this.authService.isLoggedIn) {
                // Thử lại với số lần retry giảm 1
                return this.withRetry(action, maxRetries - 1, retryDelay);
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

  /**
   * Wrapper cho các API call với auto-refresh token
   */
  withTokenRefresh<T>(action: () => Observable<T>): Observable<T> {
    return this.authService.checkAndRefreshToken().pipe(
      switchMap(() => action()),
      catchError((error: any) => {
        if (error.status === 401 || error.status === 403) {
          // Token expired, kích hoạt modal và thử lại sau khi user đăng nhập lại
          return timer(2000).pipe(
            switchMap(() => {
              if (this.authService.isLoggedIn) {
                return action();
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

  /**
   * Xử lý lỗi chung và hiển thị message phù hợp
   */
  handleError(error: any): string {
    if (error.message && error.message.includes('Phiên đăng nhập')) {
      return error.message;
    }
    
    if (error.status === 0) {
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.';
    } else if (error.status === 400) {
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
    } else if (error.status === 401 || error.status === 403) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    } else if (error.status === 404) {
      return 'Không tìm thấy dữ liệu yêu cầu.';
    } else if (error.status === 500) {
      return 'Lỗi server. Vui lòng thử lại sau.';
    }
    
    return 'Có lỗi xảy ra. Vui lòng thử lại sau.';
  }

  /**
   * Kiểm tra xem có phải lỗi token expired không
   */
  isTokenExpiredError(error: any): boolean {
    return error.status === 401 || error.status === 403 || 
           (error.message && error.message.includes('Phiên đăng nhập'));
  }
} 