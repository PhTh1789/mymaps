import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    public authService: AuthService,
    private tokenService: TokenService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Không đính kèm token cho các yêu cầu đăng nhập hoặc đăng ký
    if (request.url.includes(AUTH_CONSTANTS.ENDPOINTS.LOGIN) || request.url.includes(AUTH_CONSTANTS.ENDPOINTS.REGISTER)) {
      return next.handle(request);
    }
    
    // Đính kèm token vào các yêu cầu khác
    const accessToken = this.authService.getAccessToken();
    if (accessToken) {
      request = this.addTokenHeader(request, accessToken);
    }

    return next.handle(request).pipe(catchError(error => {
      // Xử lý lỗi 401 (Unauthorized) và 403 (Forbidden)
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        return this.handleAuthError(request, next);
      }
      return throwError(() => error);
    }));
  }

  private handleAuthError(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Kích hoạt token expired modal thay vì logout ngay lập tức
      console.log('Token hết hạn hoặc không hợp lệ. Kích hoạt token expired modal...');
      this.tokenService.handleTokenExpiration();
      
      return throwError(() => new Error('Phiên của bạn đã hết hạn, vui lòng đăng nhập lại.'));

    } else {
      // Nếu đang trong quá trình refresh, đợi cho đến khi có token mới
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(jwt => {
          return next.handle(this.addTokenHeader(request, jwt));
        })
      );
    }
  }

  private addTokenHeader(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
